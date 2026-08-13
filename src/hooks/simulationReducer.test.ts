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
    expect(next.history[0]).toEqual({
      tick: 1,
      cwnds: { S1: 2 },
      congestionEvent: false,
      fairShare: 100,
    });
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

  it("records the theoretical fair share (capacity / sender count) in each snapshot", () => {
    const state = createInitialState(100, [makeSender(1), makeSender(2), makeSender(3)]);
    const next = simulationReducer(state, { type: "step" });

    expect(next.history[0].fairShare).toBeCloseTo(100 / 3);
  });
});

describe("simulationReducer autoTick", () => {
  it("spawns the given sender and schedules its departure relative to the resulting tick", () => {
    const state = createInitialState(100, [makeSender(1)]);
    const next = simulationReducer(state, {
      type: "autoTick",
      spawn: createSender("S2"),
      lifespanTicks: 5,
    });

    expect(next.tick).toBe(1);
    expect(next.network.senders.map((s) => s.id).sort()).toEqual(["S1", "S2"]);
    expect(next.lifespans.S2).toBe(6); // nextTick(1) + lifespanTicks(5)
  });

  it("does nothing extra when no spawn is provided", () => {
    const state = createInitialState(100, [makeSender(1)]);
    const next = simulationReducer(state, { type: "autoTick" });

    expect(next.network.senders.map((s) => s.id)).toEqual(["S1"]);
    expect(next.lifespans).toEqual({});
  });

  it("automatically removes a sender once its scheduled departure tick is reached", () => {
    let state = createInitialState(100, [makeSender(1)]);
    state = simulationReducer(state, {
      type: "autoTick",
      spawn: createSender("S2"),
      lifespanTicks: 2,
    }); // tick 1, S2 departs at tick 3

    expect(state.network.senders.map((s) => s.id).sort()).toEqual(["S1", "S2"]);

    state = simulationReducer(state, { type: "autoTick" }); // tick 2, still alive
    expect(state.network.senders.map((s) => s.id).sort()).toEqual(["S1", "S2"]);

    state = simulationReducer(state, { type: "autoTick" }); // tick 3, S2 departs
    expect(state.network.senders.map((s) => s.id)).toEqual(["S1"]);
    expect(state.lifespans).toEqual({});
  });

  it("clears a sender's lifespan entry when it is manually removed early", () => {
    let state = createInitialState(100, [makeSender(1)]);
    state = simulationReducer(state, {
      type: "autoTick",
      spawn: createSender("S2"),
      lifespanTicks: 10,
    });
    state = simulationReducer(state, { type: "remove", id: "S2" });

    expect(state.lifespans).toEqual({});
    // further auto ticks should not error or resurrect S2
    state = simulationReducer(state, { type: "autoTick" });
    expect(state.network.senders.map((s) => s.id)).toEqual(["S1"]);
  });
});
