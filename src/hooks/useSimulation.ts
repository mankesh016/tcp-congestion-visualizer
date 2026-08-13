import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { createSender } from "../sim/sender";
import { createInitialState, makeSender, simulationReducer, type SimulationState } from "./simulationReducer";

export interface UseSimulationOptions {
  capacity: number;
  tickIntervalMs?: number;
  initialSenderCount?: number;
}

export const MAX_SENDERS = 8;
const SPAWN_PROBABILITY = 0.15;
const MIN_LIFESPAN_TICKS = 15;
const MAX_LIFESPAN_TICKS = 40;

function randomLifespanTicks(): number {
  return Math.round(MIN_LIFESPAN_TICKS + Math.random() * (MAX_LIFESPAN_TICKS - MIN_LIFESPAN_TICKS));
}

export function useSimulation({
  capacity,
  tickIntervalMs = 400,
  initialSenderCount = 0,
}: UseSimulationOptions) {
  const initialSenders = Array.from({ length: initialSenderCount }, (_, i) => makeSender(i + 1));
  const [state, dispatch] = useReducer(
    simulationReducer,
    undefined,
    () => createInitialState(capacity, initialSenders),
  );
  const [isRunning, setIsRunning] = useState(false);
  const [autoMode, setAutoMode] = useState(false);
  const nextIdRef = useRef(initialSenderCount + 1);

  // Interval callbacks close over stale state; a ref kept in sync every
  // render lets the tick logic always read the latest sender count without
  // tearing down and recreating the interval on every single tick.
  const stateRef = useRef<SimulationState>(state);
  stateRef.current = state;

  const performTick = useCallback(() => {
    if (!autoMode) {
      dispatch({ type: "step" });
      return;
    }
    const activeCount = stateRef.current.network.senders.length;
    const shouldSpawn = activeCount < MAX_SENDERS && Math.random() < SPAWN_PROBABILITY;
    const spawn = shouldSpawn ? createSender(`S${nextIdRef.current++}`) : undefined;
    const lifespanTicks = shouldSpawn ? randomLifespanTicks() : undefined;
    dispatch({ type: "autoTick", spawn, lifespanTicks });
  }, [autoMode]);

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

  const reset = useCallback(() => {
    setIsRunning(false);
    const seeded = Array.from({ length: initialSenderCount }, (_, i) => makeSender(i + 1));
    nextIdRef.current = initialSenderCount + 1;
    dispatch({ type: "reset", capacity, initialSenders: seeded });
  }, [capacity, initialSenderCount]);

  return {
    network: state.network,
    history: state.history,
    tick: state.tick,
    isRunning,
    autoMode,
    setAutoMode,
    canAddSender: state.network.senders.length < MAX_SENDERS,
    play: () => setIsRunning(true),
    pause: () => setIsRunning(false),
    step: performTick,
    reset,
    addSender,
    removeSender,
  };
}
