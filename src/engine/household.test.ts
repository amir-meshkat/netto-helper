import { describe, expect, it } from "vitest";
import { getRules } from "../rules";
import { householdNetto } from "./household";
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
