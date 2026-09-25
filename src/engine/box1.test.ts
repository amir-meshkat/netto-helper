import { describe, expect, it } from "vitest";
import { getRules } from "../rules";
import { box1Tax } from "./box1";

const rules = getRules(2026);

describe("box1Tax", () => {
  it("taxes income inside the first bracket at the first rate", () => {
    expect(box1Tax(36_000, rules).total).toBeCloseTo(12_870.0, 2);
  });

  it("taxes only the part above a bracket boundary at the higher rate", () => {
    const result = box1Tax(50_000, rules);
    expect(result.total).toBeCloseTo(18_076.22, 2);
    expect(result.parts[0]).toMatchObject({ from: 0, upTo: 38_883, amount: 38_883 });
    expect(result.parts[0]?.tax).toBeCloseTo(13_900.67, 2);
    expect(result.parts[1]).toMatchObject({ from: 38_883, upTo: 78_426, amount: 11_117 });
    expect(result.parts[1]?.tax).toBeCloseTo(4_175.55, 2);
    expect(result.parts[2]?.amount).toBe(0);
  });

  it("uses all three brackets for a high income", () => {
    // 38,883 x 35.75% + 39,543 x 37.56% + 21,574 x 49.5%
    expect(box1Tax(100_000, rules).total).toBeCloseTo(13_900.6725 + 14_852.3508 + 10_679.13, 2);
  });

  it("is zero for zero or negative income", () => {
    expect(box1Tax(0, rules).total).toBe(0);
    expect(box1Tax(-500, rules).total).toBe(0);
  });
});
