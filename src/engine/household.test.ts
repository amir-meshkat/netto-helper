import { describe, expect, it } from "vitest";
import { getRules } from "../rules";
import { householdNetto, householdTotal } from "./household";
import { NO_PENSION, personNetto, type Job } from "./person";

const rules = getRules(2026);

const yearlyJob = (yearlyGross: number): Job => ({
  monthlyGross: yearlyGross / 12,
  holidayPayRate: 0,
  yearEndBonusRate: 0,
  pension: NO_PENSION,
});

describe("householdNetto", () => {
  it("is the sum of the people in it", () => {
    const a = [yearlyJob(36_000)];
    const b = [yearlyJob(39_000), yearlyJob(15_000)];
    const household = householdNetto([{ jobs: a }, { jobs: b }], rules);
    expect(household.people).toHaveLength(2);
    expect(household.netto).toBeCloseTo(personNetto(a, rules).netto + personNetto(b, rules).netto, 6);
    expect(household.gross).toBeCloseTo(90_000, 6);
    expect(household.gross - household.pension - household.tax).toBeCloseTo(household.netto, 6);
  });

  it("taxes partners separately, so the split of the same total matters", () => {
    const oneEarner = householdNetto([{ jobs: [yearlyJob(54_000)] }, { jobs: [] }], rules);
    const twoEarners = householdNetto([{ jobs: [yearlyJob(27_000)] }, { jobs: [yearlyJob(27_000)] }], rules);
    expect(oneEarner.netto).toBeCloseTo(41_121.61, 2);
    expect(twoEarners.netto).toBeCloseTo(51_570.04, 2);
  });

  it("adds side income profit, and takes off its tax and Zvw", () => {
    const side = { revenue: 12_000, costs: 2_000, kind: "business" as const, meetsHoursCriterion: false, starter: false };
    const household = householdNetto([{ jobs: [yearlyJob(38_880)], side }], rules);
    expect(household.profit).toBe(10_000);
    expect(household.zvw).toBeCloseTo(423.41, 2);
    expect(household.gross + household.profit - household.tax - household.zvw).toBeCloseTo(household.netto, 6);
  });
});

describe("householdTotal", () => {
  const noHome = { vermogen: 0, children: [], rent: null, allYoung: false };

  it("adds toeslagen to the work netto: alone at 38,880 gets 294.98 zorgtoeslag", () => {
    const total = householdTotal([{ jobs: [yearlyJob(38_880)] }], noHome, rules);
    expect(total.toetsingsinkomen).toBeCloseTo(38_880, 6);
    expect(total.toeslagen.zorgtoeslag.amount).toBeCloseTo(294.98, 2);
    expect(total.total).toBeCloseTo(total.work.netto + total.toeslagen.total, 6);
  });

  it("uses the income of both partners together, and the rules for a toeslagpartner", () => {
    const total = householdTotal([{ jobs: [yearlyJob(38_880)] }, { jobs: [] }], noHome, rules);
    expect(total.toetsingsinkomen).toBeCloseTo(38_880, 6);
    expect(total.toeslagen.zorgtoeslag.amount).toBeCloseTo(1_707.15, 2);
  });

  it("takes the childcare costs off the total, so kinderopvangtoeslag only makes up for part of them", () => {
    const care = { kind: "dagopvang" as const, hoursPerMonth: 100, pricePerHour: 11.23 };
    const total = householdTotal([{ jobs: [yearlyJob(38_880)] }], { ...noHome, children: [{ age: 2, care }] }, rules);
    expect(total.childcareCost).toBeCloseTo(100 * 11.23 * 12, 6);
    expect(total.toeslagen.kinderopvang.amount).toBeCloseTo(0.96 * 100 * 11.23 * 12, 6);
    expect(total.total).toBeCloseTo(total.work.netto + total.toeslagen.total - total.childcareCost, 6);
  });

  it("counts taxable income: pension premium and the mkb-winstvrijstelling are not part of it", () => {
    const withPension: Job = { ...yearlyJob(40_000), pension: { kind: "monthly", amount: 100 } };
    const side = { revenue: 12_000, costs: 2_000, kind: "business" as const, meetsHoursCriterion: false, starter: false };
    const total = householdTotal([{ jobs: [withPension], side }], noHome, rules);
    expect(total.toetsingsinkomen).toBeCloseTo(40_000 - 1_200 + 8_730, 6);
  });
});
