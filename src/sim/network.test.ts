import { describe, expect, it } from "vitest";
import { createSender } from "./sender";
import { addSender, createNetwork, removeSender, step } from "./network";

describe("step", () => {
  it("grows a single sender via slow start when under capacity", () => {
    const network = createNetwork(100, [createSender("a")]);
    const result = step(network);
    expect(result.congestionEvent).toBe(false);
    expect(result.network.senders[0].cwnd).toBe(2);
  });

  it("triggers a synchronized loss and halves every sender when combined cwnd exceeds capacity", () => {
    const network = createNetwork(10, [
      createSender("a", { initialCwnd: 6 }),
      createSender("b", { initialCwnd: 6 }),
    ]);
    // both double: 12 + 12 = 24 > capacity(10)
    const result = step(network);
    expect(result.congestionEvent).toBe(true);
    expect(result.network.senders[0].cwnd).toBe(6); // 12 halved
    expect(result.network.senders[1].cwnd).toBe(6);
    expect(result.network.senders.every((s) => s.state === "congestion-avoidance")).toBe(true);
  });

  it("does not touch senders when the network is empty", () => {
    const network = createNetwork(100, []);
    const result = step(network);
    expect(result.congestionEvent).toBe(false);
    expect(result.totalCwnd).toBe(0);
    expect(result.network.senders).toHaveLength(0);
  });
});

describe("addSender / removeSender", () => {
  it("adds a sender without mutating the original network", () => {
    const network = createNetwork(100, []);
    const updated = addSender(network, createSender("a"));
    expect(network.senders).toHaveLength(0);
    expect(updated.senders).toHaveLength(1);
  });

  it("removes a sender by id", () => {
    const network = createNetwork(100, [createSender("a"), createSender("b")]);
    const updated = removeSender(network, "a");
    expect(updated.senders.map((s) => s.id)).toEqual(["b"]);
  });
});
