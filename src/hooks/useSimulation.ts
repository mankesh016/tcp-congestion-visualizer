import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { createSender } from "../sim/sender";
import { createInitialState, makeSender, simulationReducer } from "./simulationReducer";

export interface UseSimulationOptions {
  capacity: number;
  tickIntervalMs?: number;
  initialSenderCount?: number;
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
  const nextIdRef = useRef(initialSenderCount + 1);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => dispatch({ type: "step" }), tickIntervalMs);
    return () => clearInterval(id);
  }, [isRunning, tickIntervalMs]);

  const addSender = useCallback(() => {
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
    play: () => setIsRunning(true),
    pause: () => setIsRunning(false),
    step: () => dispatch({ type: "step" }),
    reset,
    addSender,
    removeSender,
  };
}
