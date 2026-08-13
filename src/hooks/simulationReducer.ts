import { addSender, createNetwork, removeSender, step, type Network } from "../sim/network";
import { createSender, type Sender } from "../sim/sender";

export interface SimulationSnapshot {
  tick: number;
  cwnds: Record<string, number>;
  congestionEvent: boolean;
  /** Theoretical fair share (capacity / active sender count) at this tick. */
  fairShare: number;
}

export interface SimulationState {
  network: Network;
  history: SimulationSnapshot[];
  tick: number;
  /** senderId -> tick at which it should automatically depart. Only set for auto-spawned senders. */
  lifespans: Record<string, number>;
  /**
   * Every sender id that has ever joined this run, in order, including ones
   * that have since left. The chart draws a line per id in this list (not
   * per currently-active sender) so a departed sender's history stays on
   * screen instead of vanishing — the line simply stops extending past its
   * last recorded tick.
   */
  allSenderIds: string[];
}

export type SimulationAction =
  | { type: "step" }
  | { type: "autoTick"; spawn?: Sender; lifespanTicks?: number }
  | { type: "add"; sender: Sender }
  | { type: "remove"; id: string }
  | { type: "reset"; capacity: number; initialSenders: Sender[] };

export function createInitialState(capacity: number, initialSenders: Sender[]): SimulationState {
  return {
    network: createNetwork(capacity, initialSenders),
    history: [],
    tick: 0,
    lifespans: {},
    allSenderIds: initialSenders.map((sender) => sender.id),
  };
}

function withoutKey<T>(record: Record<string, T>, key: string): Record<string, T> {
  const { [key]: _removed, ...rest } = record;
  return rest;
}

/** Grow every sender one RTT, detect/apply congestion, and record a history snapshot. */
function advanceTick(state: SimulationState, network: Network): SimulationState {
  const result = step(network);
  const cwnds: Record<string, number> = {};
  for (const sender of result.network.senders) {
    cwnds[sender.id] = sender.cwnd;
  }
  const tick = state.tick + 1;
  const senderCount = result.network.senders.length;
  const fairShare = senderCount > 0 ? result.network.config.capacity / senderCount : 0;

  return {
    ...state,
    network: result.network,
    tick,
    history: [...state.history, { tick, cwnds, congestionEvent: result.congestionEvent, fairShare }],
  };
}

/**
 * Pure reducer: the whole tick (grow senders, detect congestion, apply
 * synchronized loss, append history) happens as one atomic state
 * transition. This keeps history and network state from ever drifting out
 * of sync, and it's safe under React StrictMode's double-invoke checks
 * since reducers are expected to be pure and side-effect free.
 *
 * Randomness for auto-spawned senders (whether to spawn, how long they
 * live) is decided by the caller and passed in as plain data on the
 * action, so the reducer itself never calls Math.random() and stays
 * fully deterministic and unit-testable.
 */
export function simulationReducer(
  state: SimulationState,
  action: SimulationAction,
): SimulationState {
  switch (action.type) {
    case "step":
      return advanceTick(state, state.network);

    case "autoTick": {
      const nextTick = state.tick + 1;
      const expiredIds = Object.entries(state.lifespans)
        .filter(([, departTick]) => departTick <= nextTick)
        .map(([id]) => id);

      let network = expiredIds.reduce((net, id) => removeSender(net, id), state.network);
      let lifespans = expiredIds.reduce((ls, id) => withoutKey(ls, id), state.lifespans);

      let allSenderIds = state.allSenderIds;
      if (action.spawn) {
        network = addSender(network, action.spawn);
        lifespans = { ...lifespans, [action.spawn.id]: nextTick + (action.lifespanTicks ?? 0) };
        allSenderIds = [...allSenderIds, action.spawn.id];
      }

      return advanceTick({ ...state, lifespans, allSenderIds }, network);
    }

    case "add":
      return {
        ...state,
        network: addSender(state.network, action.sender),
        allSenderIds: [...state.allSenderIds, action.sender.id],
      };

    case "remove":
      return {
        ...state,
        network: removeSender(state.network, action.id),
        lifespans: withoutKey(state.lifespans, action.id),
      };

    case "reset":
      return createInitialState(action.capacity, action.initialSenders);

    default:
      return state;
  }
}

export function makeSender(index: number): Sender {
  return createSender(`S${index}`);
}
