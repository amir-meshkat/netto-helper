import { describe, expect, it } from "vitest";
import { getRules } from "../rules";
import type { SideIncome } from "./business";
import { NO_PENSION, personNetto, type Job } from "./person";
import { sideIncomeCurve, sideIncomeValue } from "./side-income";

const rules = getRules(2026);

const job = (monthlyGross: number, holidayPayRate = 0.08): Job => ({
  monthlyGross,
  holidayPayRate,
  yearEndBonusRate: 0,
  pension: NO_PENSION,
});

const side: SideIncome = { revenue: 12_000, costs: 2_000, kind: "business", meetsHoursCriterion: false, starter: false };

describe("personNetto with side income", () => {
  // Worked example: salary 3,000 a month with 8% holiday pay (38,880), side profit 10,000.
  const result = personNetto([job(3_000)], rules, side);

  it("taxes salary plus profit after the 12.7% exemption", () => {
    expect(result.taxable).toBeCloseTo(38_880 + 8_730, 6);
    expect(result.incomeTax.box1.total).toBeCloseTo(17_178.53, 2);
  });

  it("uses the general credit on taxable income, the labour credit on salary plus profit before deductions", () => {
    expect(result.incomeTax.generalCredit).toBeCloseTo(1_971.42, 2);
    expect(result.incomeTax.workIncome).toBeCloseTo(48_880, 6);
    expect(result.incomeTax.labourCredit).toBeCloseTo(5_470.95, 2);
    expect(result.tax).toBeCloseTo(9_736.16, 2);
  });

  it("charges the Zvw contribution on the taxed profit, and adds the profit to netto", () => {
    expect(result.zvw).toBeCloseTo(423.41, 2);
    expect(result.netto).toBeCloseTo(38_880 + 10_000 - 9_736.16 - 423.41, 1);
  });

  it("adds the tariefsaanpassing when salary plus profit reaches the top bracket", () => {
    const high = personNetto([job(7_500, 0)], rules, side); // salary 90,000
    expect(high.incomeTax.topBracketAdjustment).toBeCloseTo(1_270 * 0.1194, 6);
  });
});

describe("sideIncomeValue", () => {
  it("keeps about 5,656 of 10,000 profit next to a 38,880 salary, and sets aside about 4,344", () => {
    const value = sideIncomeValue([job(3_000)], side, rules);
    expect(value.profit).toBe(10_000);
    expect(value.extraTax).toBeCloseTo(3_920.71, 2);
    expect(value.zvw).toBeCloseTo(423.41, 2);
    expect(value.setAside).toBeCloseTo(4_344.12, 2);
    expect(value.kept).toBeCloseTo(5_655.88, 2);
    expect(value.kept + value.setAside).toBeCloseTo(value.profit, 6);
  });

  it("is worth more next to a lower salary", () => {
    const low = sideIncomeValue([job(2_000)], side, rules);
    const high = sideIncomeValue([job(3_800)], side, rules);
    expect(low.kept).toBeGreaterThan(high.kept);
  });

  it("needs nothing set aside for income tax when the credits still cover it", () => {
    const value = sideIncomeValue([], { ...side, revenue: 6_000, costs: 0 }, rules);
    expect(value.extraTax).toBe(0);
    expect(value.setAside).toBeCloseTo(value.zvw, 6);
  });
});

describe("sideIncomeCurve", () => {
  it("gives the kept amount for each main salary, with the main job's other settings", () => {
    const main = job(0);
    const curve = sideIncomeCurve(main, side, [0, 2_000, 4_000], rules);
    expect(curve.map((point) => point.monthlyGross)).toEqual([0, 2_000, 4_000]);
    for (const point of curve) {
      const expected = sideIncomeValue([{ ...main, monthlyGross: point.monthlyGross }], side, rules).kept;
      expect(point.kept).toBeCloseTo(expected, 6);
    }
  });
});

describe("sideIncomeValue with a share of the eigen woning saldo", () => {
  it("taxes the side income at the rates after the mortgage deduction", () => {
    // 45,360 with a deduction of 10,600 is 34,760 taxable: part of the side income now falls in the first bracket.
    const value = sideIncomeValue([job(3_500)], side, rules, -10_600);
    const without = personNetto([job(3_500)], rules, null, -10_600);
    const withSide = personNetto([job(3_500)], rules, side, -10_600);
    expect(value.kept).toBeCloseTo(withSide.netto - without.netto, 6);
    expect(value.kept).toBeGreaterThan(sideIncomeValue([job(3_500)], side, rules).kept + 50);
  });
});
