import { describe, expect, it } from "vitest";
import { getRules } from "../rules";
import { businessProfit, topBracketAdjustment, zvwContribution, type SideIncome } from "./business";

const rules = getRules(2026);

const side = (extra: Partial<SideIncome> = {}): SideIncome => ({
  revenue: 12_000,
  costs: 2_000,
  kind: "business",
  meetsHoursCriterion: false,
  starter: false,
  ...extra,
});

describe("businessProfit", () => {
  it("takes 12.7% off the profit for every entrepreneur (mkb-winstvrijstelling)", () => {
    const result = businessProfit(side(), rules);
    expect(result.profit).toBe(10_000);
    expect(result.selfEmployedDeduction).toBe(0);
    expect(result.profitExemption).toBeCloseTo(1_270, 6);
    expect(result.taxableProfit).toBeCloseTo(8_730, 6);
  });

  it("adds the zelfstandigenaftrek of 1,200 with the hours criterion, before the 12.7%", () => {
    const result = businessProfit(side({ meetsHoursCriterion: true }), rules);
    expect(result.selfEmployedDeduction).toBe(1_200);
    expect(result.profitExemption).toBeCloseTo(8_800 * 0.127, 6);
    expect(result.taxableProfit).toBeCloseTo(8_800 * 0.873, 6);
  });

  it("adds the startersaftrek of 2,123 for starters, but only with the hours criterion", () => {
    expect(businessProfit(side({ meetsHoursCriterion: true, starter: true }), rules).taxableProfit).toBeCloseTo(
      (10_000 - 1_200 - 2_123) * 0.873,
      6,
    );
    expect(businessProfit(side({ starter: true }), rules).starterDeduction).toBe(0);
  });

  it("never gives a zelfstandigenaftrek above the profit, except for starters", () => {
    const small = side({ revenue: 800, costs: 0, meetsHoursCriterion: true });
    expect(businessProfit(small, rules).selfEmployedDeduction).toBe(800);
    expect(businessProfit(small, rules).taxableProfit).toBe(0);
    expect(businessProfit({ ...small, starter: true }, rules).taxableProfit).toBeLessThan(0);
  });

  it("gives no deductions for other work that is not a business (resultaat uit overige werkzaamheden)", () => {
    const result = businessProfit(side({ kind: "other", meetsHoursCriterion: true }), rules);
    expect(result.deductions).toBe(0);
    expect(result.taxableProfit).toBe(10_000);
  });

  it("does not include losses yet: costs above revenue give a profit of 0", () => {
    expect(businessProfit(side({ revenue: 1_000, costs: 3_000 }), rules).profit).toBe(0);
  });
});

describe("zvwContribution", () => {
  it("is 4.85% of the taxed profit", () => {
    expect(zvwContribution(8_730, 38_880, rules)).toBeCloseTo(423.41, 2);
  });

  it("only counts the room left under the maximum after the salary", () => {
    expect(zvwContribution(8_730, 75_000, rules)).toBeCloseTo((79_409 - 75_000) * 0.0485, 6);
    expect(zvwContribution(8_730, 90_000, rules)).toBe(0);
  });
});

describe("topBracketAdjustment (tariefsaanpassing)", () => {
  it("is zero when income before deductions stays below the top bracket", () => {
    expect(topBracketAdjustment(1_270, 48_880, rules)).toBe(0);
  });

  it("adds back 11.94% of the deductions that fall in the top bracket", () => {
    expect(topBracketAdjustment(1_270, 100_000, rules)).toBeCloseTo(1_270 * 0.1194, 6);
    expect(topBracketAdjustment(1_270, 79_000, rules)).toBeCloseTo(574 * 0.1194, 6);
  });
});
