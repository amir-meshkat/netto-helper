import { describe, expect, it } from "vitest";
import { getRules } from "../rules";
import { generalCredit, labourCredit } from "./credits";

const rules = getRules(2026);

describe("generalCredit (algemene heffingskorting)", () => {
  it("is the full amount up to the phase-out start", () => {
    expect(generalCredit(0, rules)).toBe(3_115);
    expect(generalCredit(29_736, rules)).toBe(3_115);
  });

  it("shrinks by 6.398% of income above the phase-out start", () => {
    expect(generalCredit(36_000, rules)).toBeCloseTo(2_714.23, 2);
  });

  it("never goes below zero", () => {
    expect(generalCredit(78_500, rules)).toBe(0);
    expect(generalCredit(200_000, rules)).toBe(0);
  });
});

describe("labourCredit (arbeidskorting)", () => {
  it("builds up slowly in the first segment", () => {
    expect(labourCredit(10_000, rules)).toBeCloseTo(832.4, 2);
  });

  it("builds up fast in the second segment", () => {
    // 996 + 31.009% x (20,000 - 11,965)
    expect(labourCredit(20_000, rules)).toBeCloseTo(3_487.57, 2);
  });

  it("grows a little in the third segment", () => {
    expect(labourCredit(36_000, rules)).toBeCloseTo(5_498.02, 2);
  });

  it("uses the next row at exactly a boundary, as the official table does", () => {
    expect(labourCredit(25_845, rules)).toBe(5_300);
    expect(labourCredit(45_592, rules)).toBe(5_685);
  });

  it("shrinks above 45,592 and is gone at high incomes", () => {
    // 5,685 - 6.51% x (50,000 - 45,592)
    expect(labourCredit(50_000, rules)).toBeCloseTo(5_398.04, 2);
    expect(labourCredit(132_900, rules)).toBeCloseTo(1.25, 2);
    expect(labourCredit(140_000, rules)).toBe(0);
  });

  it("is zero without income from work", () => {
    expect(labourCredit(0, rules)).toBe(0);
    expect(labourCredit(-100, rules)).toBe(0);
  });
});
