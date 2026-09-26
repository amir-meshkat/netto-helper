import { describe, expect, it } from "vitest";
import { getRules } from "../rules";
import type { SideIncome } from "./business";
import { jaarruimte, lijfrenteWhatIf } from "./lijfrente";
import { NO_PENSION, type Job } from "./person";

const rules = getRules(2026);
const job = (monthly: number, holiday = 0.08): Job => ({ monthlyGross: monthly, holidayPayRate: holiday, yearEndBonusRate: 0, pension: NO_PENSION });
const noHome = { vermogen: 0, children: [], rent: null, allYoung: false };

describe("jaarruimte", () => {
  it("is 30% of the income from work above the franchise of 19,172", () => {
    expect(jaarruimte(38_880, 0, rules).amount).toBeCloseTo(5_912.4, 6);
    expect(jaarruimte(51_840, 0, rules).amount).toBeCloseTo(9_800.4, 6);
  });

  it("goes down by 6.27 times factor A, never below zero", () => {
    expect(jaarruimte(51_840, 1_000, rules).amount).toBeCloseTo(3_530.4, 6);
    expect(jaarruimte(51_840, 2_000, rules).amount).toBe(0);
  });

  it("counts income up to 137,800 only, and is zero below the franchise", () => {
    expect(jaarruimte(150_000, 0, rules).amount).toBeCloseTo(35_588.4, 6);
    expect(jaarruimte(15_000, 0, rules).amount).toBe(0);
  });
});

describe("lijfrenteWhatIf", () => {
  it("worked example: 1,000 in at 38,880 gives 558.78 back, 137.30 of it through zorgtoeslag", () => {
    const w = lijfrenteWhatIf([{ jobs: [job(3_000)] }], noHome, 0, 1_000, 0, rules);
    expect(w.room.amount).toBeCloseTo(5_912.4, 6);
    expect(w.deductible).toBe(1_000);
    expect(w.taxLower).toBeCloseTo(421.48, 2);
    expect(w.toeslagenUp).toBeCloseTo(137.3, 2);
    expect(w.back).toBeCloseTo(558.78, 2);
    expect(w.cost).toBeCloseTo(441.22, 2);
  });

  it("at 51,840: 37.56% plus 6.398% general tax credit, no toeslagen", () => {
    const w = lijfrenteWhatIf([{ jobs: [job(4_000)] }], noHome, 0, 1_000, 0, rules);
    expect(w.back).toBeCloseTo(439.58, 2);
    expect(w.toeslagenUp).toBeCloseTo(0, 6);
  });

  it("keeps the full 49.50% in the top bracket: no tariefsaanpassing", () => {
    const w = lijfrenteWhatIf([{ jobs: [job(10_000, 0)] }], noHome, 0, 1_000, 0, rules);
    expect(w.back).toBeCloseTo(495, 6);
  });

  it("only counts the part within the jaarruimte", () => {
    const w = lijfrenteWhatIf([{ jobs: [job(4_000)] }], noHome, 0, 5_000, 1_000, rules);
    expect(w.deductible).toBeCloseTo(3_530.4, 6);
    expect(w.cost).toBeCloseTo(5_000 - w.back, 6);
  });

  it("counts side income profit before the zzp deductions for the jaarruimte", () => {
    const side: SideIncome = { revenue: 12_000, costs: 2_000, kind: "business", meetsHoursCriterion: false, starter: false };
    const w = lijfrenteWhatIf([{ jobs: [job(3_000)], side }], noHome, 0, 1_000, 0, rules);
    expect(w.room.amount).toBeCloseTo(8_912.4, 6);
  });

  it("works for either partner: the deposit is on that partner's own income", () => {
    const people = [{ jobs: [job(4_000)] }, { jobs: [job(3_000)] }];
    const a = lijfrenteWhatIf(people, noHome, 0, 1_000, 0, rules);
    const b = lijfrenteWhatIf(people, noHome, 1, 1_000, 0, rules);
    expect(a.taxLower).toBeCloseTo(439.58, 2);
    expect(b.taxLower).toBeCloseTo(421.48, 2);
  });
});
