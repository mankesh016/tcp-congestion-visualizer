import { describe, expect, it } from "vitest";
import { createSender } from "../sim/sender";
import { createInitialState, makeSender, simulationReducer } from "./simulationReducer";

describe("simulationReducer", () => {
  it("advances one tick, growing senders and recording a history snapshot", () => {
    const state = createInitialState(100, [makeSender(1)]);
    const next = simulationReducer(state, { type: "step" });

    expect(next.tick).toBe(1);
    expect(next.network.senders[0].cwnd).toBe(2);
    expect(next.history).toHaveLength(1);
    expect(next.history[0]).toEqual({ tick: 1, cwnds: { S1: 2 }, congestionEvent: false });
  });

  it("accumulates history across multiple steps in order", () => {
    let state = createInitialState(100, [makeSender(1)]);
    state = simulationReducer(state, { type: "step" });
    state = simulationReducer(state, { type: "step" });
    state = simulationReducer(state, { type: "step" });

    expect(state.history.map((snapshot) => snapshot.tick)).toEqual([1, 2, 3]);
    expect(state.history.map((snapshot) => snapshot.cwnds.S1)).toEqual([2, 4, 8]);
  });

  it("adds a sender to the live network without touching history", () => {
    const state = createInitialState(100, [makeSender(1)]);
    const next = simulationReducer(state, { type: "add", sender: createSender("S2") });

    expect(next.network.senders.map((s) => s.id)).toEqual(["S1", "S2"]);
    expect(next.history).toEqual(state.history);
  });

  it("removes a sender from the live network by id", () => {
    const state = createInitialState(100, [makeSender(1), makeSender(2)]);
    const next = simulationReducer(state, { type: "remove", id: "S1" });

    expect(next.network.senders.map((s) => s.id)).toEqual(["S2"]);
  });

  it("resets to a fresh network, empty history, and tick 0", () => {
    let state = createInitialState(100, [makeSender(1)]);
    state = simulationReducer(state, { type: "step" });
    state = simulationReducer(state, { type: "step" });

    const reset = simulationReducer(state, {
      type: "reset",
      capacity: 50,
      initialSenders: [makeSender(1)],
    });

    expect(reset.tick).toBe(0);
    expect(reset.history).toHaveLength(0);
    expect(reset.network.config.capacity).toBe(50);
    expect(reset.network.senders).toHaveLength(1);
  });
});
