import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { createSender } from "../sim/sender";
import { createInitialState, makeSender, simulationReducer, type SimulationState } from "./simulationReducer";

export interface UseSimulationOptions {
  capacity: number;
  tickIntervalMs?: number;
  initialSenderCount?: number;
  spawnProbability?: number;
}

export const MAX_SENDERS = 8;
const MIN_LIFESPAN_TICKS = 15;
const MAX_LIFESPAN_TICKS = 40;

function randomLifespanTicks(): number {
  return Math.round(MIN_LIFESPAN_TICKS + Math.random() * (MAX_LIFESPAN_TICKS - MIN_LIFESPAN_TICKS));
}

export function useSimulation({
  capacity,
  tickIntervalMs: initialTickIntervalMs = 400,
  initialSenderCount = 0,
  spawnProbability: initialSpawnProbability = 0.15,
}: UseSimulationOptions) {
  const initialSenders = Array.from({ length: initialSenderCount }, (_, i) => makeSender(i + 1));
  const [state, dispatch] = useReducer(
    simulationReducer,
    undefined,
    () => createInitialState(capacity, initialSenders),
  );
  const [isRunning, setIsRunning] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [tickIntervalMs, setTickIntervalMs] = useState(initialTickIntervalMs);
  const [spawnProbability, setSpawnProbability] = useState(initialSpawnProbability);
  // Jitter models a bottleneck whose realized capacity fluctuates tick to
  // tick (cross-traffic on the link) as a fraction of the nominal capacity:
  // 0 = perfectly stable link, 1 = capacity can momentarily swing to 0 or 2x.
  const [jitter, setJitter] = useState(0);
  const nextIdRef = useRef(initialSenderCount + 1);

  // Interval callbacks close over stale state; a ref kept in sync every
  // render lets the tick logic always read the latest sender count without
  // tearing down and recreating the interval on every single tick.
  const stateRef = useRef<SimulationState>(state);
  stateRef.current = state;

  const performTick = useCallback(() => {
    const nominalCapacity = stateRef.current.network.config.capacity;
    const capacityOverride =
      jitter > 0
        ? Math.max(1, Math.round(nominalCapacity * (1 + jitter * (Math.random() * 2 - 1))))
        : undefined;

    if (!autoMode) {
      dispatch({ type: "step", capacityOverride });
      return;
    }
    const activeCount = stateRef.current.network.senders.length;
    const shouldSpawn = activeCount < MAX_SENDERS && Math.random() < spawnProbability;
    const spawn = shouldSpawn ? createSender(`S${nextIdRef.current++}`) : undefined;
    const lifespanTicks = shouldSpawn ? randomLifespanTicks() : undefined;
    dispatch({ type: "autoTick", spawn, lifespanTicks, capacityOverride });
  }, [autoMode, jitter, spawnProbability]);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(performTick, tickIntervalMs);
    return () => clearInterval(id);
  }, [isRunning, performTick, tickIntervalMs]);

  const addSender = useCallback(() => {
    if (stateRef.current.network.senders.length >= MAX_SENDERS) return;
    const sender = createSender(`S${nextIdRef.current}`);
    nextIdRef.current += 1;
    dispatch({ type: "add", sender });
  }, []);

  const removeSender = useCallback((id: string) => {
    dispatch({ type: "remove", id });
  }, []);

  const setCapacity = useCallback((next: number) => {
    dispatch({ type: "setCapacity", capacity: next });
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    const seeded = Array.from({ length: initialSenderCount }, (_, i) => makeSender(i + 1));
    nextIdRef.current = initialSenderCount + 1;
    dispatch({ type: "reset", capacity: stateRef.current.network.config.capacity, initialSenders: seeded });
  }, [initialSenderCount]);

  return {
    network: state.network,
    history: state.history,
    allSenderIds: state.allSenderIds,
    tick: state.tick,
    congestionEventCount: state.congestionEventCount,
    cumulativeThroughput: state.cumulativeThroughput,
    isRunning,
    autoMode,
    setAutoMode,
    canAddSender: state.network.senders.length < MAX_SENDERS,
    capacity: state.network.config.capacity,
    setCapacity,
    tickIntervalMs,
    setTickIntervalMs,
    spawnProbability,
    setSpawnProbability,
    jitter,
    setJitter,
    play: () => setIsRunning(true),
    pause: () => setIsRunning(false),
    step: performTick,
    reset,
    addSender,
    removeSender,
  };
}
