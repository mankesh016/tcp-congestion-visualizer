import { addSender, createNetwork, removeSender, step, type Network } from "../sim/network";
import { createSender, type Sender } from "../sim/sender";

export interface SimulationSnapshot {
  tick: number;
  cwnds: Record<string, number>;
  congestionEvent: boolean;
}

export interface SimulationState {
  network: Network;
  history: SimulationSnapshot[];
  tick: number;
}

export type SimulationAction =
  | { type: "step" }
  | { type: "add"; sender: Sender }
  | { type: "remove"; id: string }
  | { type: "reset"; capacity: number; initialSenders: Sender[] };

export function createInitialState(capacity: number, initialSenders: Sender[]): SimulationState {
  return { network: createNetwork(capacity, initialSenders), history: [], tick: 0 };
}

/**
 * Pure reducer: the whole tick (grow senders, detect congestion, apply
 * synchronized loss, append history) happens as one atomic state
 * transition. This keeps history and network state from ever drifting out
 * of sync, and it's safe under React StrictMode's double-invoke checks
 * since reducers are expected to be pure and side-effect free.
 */
export function simulationReducer(
  state: SimulationState,
  action: SimulationAction,
): SimulationState {
  switch (action.type) {
    case "step": {
      const result = step(state.network);
      const cwnds: Record<string, number> = {};
      for (const sender of result.network.senders) {
        cwnds[sender.id] = sender.cwnd;
      }
      const tick = state.tick + 1;
      return {
        network: result.network,
        tick,
        history: [...state.history, { tick, cwnds, congestionEvent: result.congestionEvent }],
      };
    }
    case "add":
      return { ...state, network: addSender(state.network, action.sender) };
    case "remove":
      return { ...state, network: removeSender(state.network, action.id) };
    case "reset":
      return createInitialState(action.capacity, action.initialSenders);
    default:
      return state;
  }
}

export function makeSender(index: number): Sender {
  return createSender(`S${index}`);
}
