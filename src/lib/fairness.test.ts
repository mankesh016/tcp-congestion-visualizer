import { describe, expect, it } from "vitest";
import { jainsFairnessIndex } from "./fairness";

describe("jainsFairnessIndex", () => {
  it("returns 1.0 when every sender has an identical window", () => {
    expect(jainsFairnessIndex([10, 10, 10, 10])).toBeCloseTo(1);
  });

  it("returns 1/n when a single sender holds the entire window", () => {
    expect(jainsFairnessIndex([40, 0, 0, 0])).toBeCloseTo(1 / 4);
  });

  it("returns 1 for an empty or single-sender set (vacuously fair)", () => {
    expect(jainsFairnessIndex([])).toBe(1);
    expect(jainsFairnessIndex([7])).toBeCloseTo(1);
  });

  it("scores partial skew between the two extremes", () => {
    const index = jainsFairnessIndex([10, 20]);
    expect(index).toBeGreaterThan(1 / 2);
    expect(index).toBeLessThan(1);
  });
});
