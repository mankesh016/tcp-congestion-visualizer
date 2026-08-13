import { describe, expect, it } from "vitest";
import { applyLoss, createSender, growSender } from "./sender";

describe("createSender", () => {
  it("starts in slow-start with cwnd 1 and unbounded ssthresh by default", () => {
    const s = createSender("a");
    expect(s.state).toBe("slow-start");
    expect(s.cwnd).toBe(1);
    expect(s.ssthresh).toBe(Infinity);
  });
});

describe("growSender", () => {
  it("doubles cwnd each tick during slow start", () => {
    let s = createSender("a");
    s = growSender(s);
    expect(s.cwnd).toBe(2);
    s = growSender(s);
    expect(s.cwnd).toBe(4);
    s = growSender(s);
    expect(s.cwnd).toBe(8);
  });

  it("caps at ssthresh and switches to congestion-avoidance when doubling would exceed it", () => {
    let s = createSender("a", { ssthresh: 10 });
    s = growSender(s); // 1 -> 2
    s = growSender(s); // 2 -> 4
    s = growSender(s); // 4 -> 8
    s = growSender(s); // 8 -> 16 exceeds ssthresh(10), capped at 10
    expect(s.cwnd).toBe(10);
    expect(s.state).toBe("congestion-avoidance");
  });

  it("grows by exactly 1 per tick during congestion avoidance", () => {
    let s = createSender("a", { ssthresh: 4 });
    s = growSender(s); // 1 -> 2
    s = growSender(s); // 2 -> 4, hits ssthresh, switches state
    expect(s.state).toBe("congestion-avoidance");
    expect(s.cwnd).toBe(4);
    s = growSender(s);
    expect(s.cwnd).toBe(5);
    s = growSender(s);
    expect(s.cwnd).toBe(6);
  });
});

describe("applyLoss", () => {
  it("halves cwnd, sets ssthresh to the new cwnd, and ends slow start", () => {
    const s = createSender("a", { initialCwnd: 16 });
    const afterLoss = applyLoss(s);
    expect(afterLoss.cwnd).toBe(8);
    expect(afterLoss.ssthresh).toBe(8);
    expect(afterLoss.state).toBe("congestion-avoidance");
  });

  it("never drops cwnd below 1", () => {
    const s = createSender("a", { initialCwnd: 1 });
    const afterLoss = applyLoss(s);
    expect(afterLoss.cwnd).toBe(1);
  });
});
