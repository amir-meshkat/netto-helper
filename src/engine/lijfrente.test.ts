import { describe, expect, it } from "vitest";
import { getRules } from "../rules";
import type { SideIncome } from "./business";
import { honeySpot, jaarruimte, lijfrenteWhatIf } from "./lijfrente";
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
    const w = lijfrenteWhatIf([{ jobs: [job(3_000)] }], noHome, 0, 1_000, {}, rules);
    expect(w.room.amount).toBeCloseTo(5_912.4, 6);
    expect(w.deductible).toBe(1_000);
    expect(w.taxLower).toBeCloseTo(421.48, 2);
    expect(w.toeslagenUp).toBeCloseTo(137.3, 2);
    expect(w.back).toBeCloseTo(558.78, 2);
    expect(w.cost).toBeCloseTo(441.22, 2);
  });

  it("at 51,840: 37.56% plus 6.398% general tax credit, no toeslagen", () => {
    const w = lijfrenteWhatIf([{ jobs: [job(4_000)] }], noHome, 0, 1_000, {}, rules);
    expect(w.back).toBeCloseTo(439.58, 2);
    expect(w.toeslagenUp).toBeCloseTo(0, 6);
  });

  it("keeps the full 49.50% in the top bracket: no tariefsaanpassing", () => {
    const w = lijfrenteWhatIf([{ jobs: [job(10_000, 0)] }], noHome, 0, 1_000, {}, rules);
    expect(w.back).toBeCloseTo(495, 6);
  });

  it("only counts the part within the jaarruimte", () => {
    const w = lijfrenteWhatIf([{ jobs: [job(4_000)] }], noHome, 0, 5_000, { factorA: 1_000 }, rules);
    expect(w.deductible).toBeCloseTo(3_530.4, 6);
    expect(w.cost).toBeCloseTo(5_000 - w.back, 6);
  });

  it("counts side income profit before the zzp deductions for the jaarruimte", () => {
    const side: SideIncome = { revenue: 12_000, costs: 2_000, kind: "business", meetsHoursCriterion: false, starter: false };
    const w = lijfrenteWhatIf([{ jobs: [job(3_000)], side }], noHome, 0, 1_000, {}, rules);
    expect(w.room.amount).toBeCloseTo(8_912.4, 6);
  });

  it("works for either partner: the deposit is on that partner's own income", () => {
    const people = [{ jobs: [job(4_000)] }, { jobs: [job(3_000)] }];
    const a = lijfrenteWhatIf(people, noHome, 0, 1_000, {}, rules);
    const b = lijfrenteWhatIf(people, noHome, 1, 1_000, {}, rules);
    expect(a.taxLower).toBeCloseTo(439.58, 2);
    expect(b.taxLower).toBeCloseTo(421.48, 2);
  });
});

describe("honeySpot", () => {
  const yearly = (income: number): Job => ({ monthlyGross: income / 12, holidayPayRate: 0, yearEndBonusRate: 0, pension: NO_PENSION });
  /** Back per 100 of a deposit, for checking that nothing beats the honey spot. */
  const perHundred = (people: { jobs: Job[] }[], home: typeof noHome, d: number) =>
    (lijfrenteWhatIf(people, home, 0, d, {}, rules).back / d) * 100;

  it("at 38,880 every 100 gives 55.88 back all the way, so the honey spot is the whole jaarruimte", () => {
    const h = honeySpot([{ jobs: [job(3_000)] }], noHome, 0, {}, rules);
    expect(h.best?.deposit).toBeCloseTo(5_912.4, 2);
    expect(h.perHundred).toBeCloseTo(55.88, 2);
    expect(h.afterPerHundred).toBeNull();
    expect(h.free).toBeNull();
  });

  it("at 80,000 the top bracket gives 49.50 per 100 for the first 1,574, then about 44", () => {
    const people = [{ jobs: [yearly(80_000)] }];
    const h = honeySpot(people, noHome, 0, {}, rules);
    expect(h.room.amount).toBeCloseTo(18_248.4, 2);
    expect(h.best?.deposit).toBeCloseTo(1_574, 2);
    expect(h.perHundred).toBeCloseTo(49.5, 2);
    expect(h.afterPerHundred).toBeGreaterThan(43);
    expect(h.afterPerHundred).toBeLessThan(44);
  });

  it("with rent and children too, nothing in steps of 100 beats the honey spot", () => {
    const homes = [
      { ...noHome, rent: 800 },
      { ...noHome, children: [{ age: 3, care: null }, { age: 13, care: null }] },
      { ...noHome, rent: 900, children: [{ age: 5, care: null }] },
    ];
    for (const home of homes) {
      for (const income of [26_000, 34_000, 44_000, 52_000]) {
        const people = [{ jobs: [yearly(income)] }];
        const h = honeySpot(people, home, 0, { reservering: 20_000 }, rules);
        for (let d = 100; d <= h.room.total; d += 100) {
          const w = lijfrenteWhatIf(people, home, 0, d, { reservering: 20_000 }, rules);
          expect(h.perHundred).toBeGreaterThanOrEqual((w.back / d) * 100 - 0.001);
        }
      }
    }
  });

  it("gives at least as much back per 100 as any deposit in steps of 100", () => {
    for (const income of [38_880, 44_000, 80_000, 60_000]) {
      const people = [{ jobs: [yearly(income)] }];
      const h = honeySpot(people, noHome, 0, {}, rules);
      for (let d = 100; d <= h.room.amount; d += 100) expect(h.perHundred).toBeGreaterThanOrEqual(perHundred(people, noHome, d) - 0.001);
    }
  });

  it("finds the free spot: just under a kinderopvangtoeslag step, the household keeps more than it puts in", () => {
    const care = { kind: "dagopvang" as const, hoursPerMonth: 230, pricePerHour: 11.23 };
    const home = { ...noHome, children: [{ age: 1, care }, { age: 3, care }] };
    const people = [{ jobs: [yearly(58_300)] }, { jobs: [] }];
    const h = honeySpot(people, home, 0, {}, rules);
    // 58,300 - 58,185 + 1: one euro under the step that costs 216.96 a year.
    expect(h.free?.best.deposit).toBeCloseTo(116, 0);
    expect(h.free?.toeslag).toBe("kinderopvang");
    expect((h.free?.best.back ?? 0) - (h.free?.best.deposit ?? 0)).toBeGreaterThan(150);
    // The most you can put in while the household keeps at least as much as now.
    const upTo = h.free?.upTo ?? 0;
    expect(upTo).toBeGreaterThan(400);
    expect(upTo).toBeLessThan(500);
    expect(lijfrenteWhatIf(people, home, 0, upTo, {}, rules).back - upTo).toBeCloseTo(0, 0);
  });

  it("has no honey spot without jaarruimte", () => {
    const h = honeySpot([{ jobs: [yearly(15_000)] }], noHome, 0, {}, rules);
    expect(h.best).toBeNull();
    expect(h.free).toBeNull();
  });
});

describe("the room with last year's income and unused room from earlier years", () => {
  it("works out the jaarruimte on last year's income when it is given: 7,748.40 on 45,000", () => {
    const w = lijfrenteWhatIf([{ jobs: [job(4_000)] }], noHome, 0, 1_000, { lastYear: 45_000 }, rules);
    expect(w.room.amount).toBeCloseTo(7_748.4, 6);
    expect(w.room.income).toBe(45_000);
  });

  it("adds unused room from earlier years, at most 42,753", () => {
    expect(jaarruimte(38_880, 0, rules, 10_000).total).toBeCloseTo(15_912.4, 6);
    expect(jaarruimte(38_880, 0, rules, 50_000).reservering).toBe(42_753);
    const w = lijfrenteWhatIf([{ jobs: [job(3_000)] }], noHome, 0, 12_000, { reservering: 10_000 }, rules);
    expect(w.deductible).toBe(12_000);
  });

  it("with 10,000 unused room at 38,880 the honey spot is 9,144: down to 29,736 each 100 gives 55.88, below it 35.75", () => {
    const h = honeySpot([{ jobs: [job(3_000)] }], noHome, 0, { reservering: 10_000 }, rules);
    expect(h.room.total).toBeCloseTo(15_912.4, 6);
    expect(h.best?.deposit).toBeCloseTo(9_144, 2);
    expect(h.perHundred).toBeCloseTo(55.88, 2);
    expect(h.afterPerHundred).toBeCloseTo(35.75, 2);
  });
});
