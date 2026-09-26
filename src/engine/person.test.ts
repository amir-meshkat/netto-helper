import { describe, expect, it } from "vitest";
import { getRules } from "../rules";
import { NO_PENSION, incomeTax, jobYear, personNetto, type Job } from "./person";

const rules = getRules(2026);

/** A job with no holiday pay, bonus or pension unless given. */
function job(monthlyGross: number, extra: Partial<Job> = {}): Job {
  return { monthlyGross, holidayPayRate: 0, yearEndBonusRate: 0, pension: NO_PENSION, ...extra };
}

/** A job that pays exactly this amount per year. */
const yearlyJob = (yearlyGross: number) => job(yearlyGross / 12);

describe("incomeTax", () => {
  it("matches the worked example for 36,000 taxable income", () => {
    const result = incomeTax(36_000, rules);
    expect(result.box1.total).toBeCloseTo(12_870.0, 2);
    expect(result.generalCredit).toBeCloseTo(2_714.23, 2);
    expect(result.labourCredit).toBeCloseTo(5_498.02, 2);
    expect(result.tax).toBeCloseTo(4_657.75, 2);
  });

  it("caps the credits at the box 1 tax, so tax is never negative", () => {
    const result = incomeTax(8_000, rules);
    expect(result.generalCredit + result.labourCredit).toBeGreaterThan(result.box1.total);
    expect(result.credits).toBeCloseTo(result.box1.total, 10);
    expect(result.tax).toBe(0);
  });
});

describe("jobYear", () => {
  it("adds holiday pay and year-end bonus to 12 monthly salaries", () => {
    const result = jobYear(job(3_000, { holidayPayRate: 0.08, yearEndBonusRate: 0.0833 }));
    expect(result.gross).toBeCloseTo(3_000 * 12 * 1.1633, 2);
  });

  it("takes the pension premium off before tax, only over the part above the franchise", () => {
    // Example scheme, not a real one: 5% premium over gross minus a franchise of 18,000.
    const result = jobYear(job(4_000, { holidayPayRate: 0.08, pension: { kind: "scheme", rate: 0.05, franchise: 18_000 } }));
    expect(result.gross).toBeCloseTo(51_840, 2);
    expect(result.pension).toBeCloseTo((51_840 - 18_000) * 0.05, 2);
    expect(result.taxable).toBeCloseTo(51_840 - 1_692, 2);
  });

  it("has no pension premium when the franchise is above the salary", () => {
    expect(jobYear(job(1_000, { pension: { kind: "scheme", rate: 0.05, franchise: 18_000 } })).pension).toBe(0);
  });

  it("accepts the pension premium as the monthly amount on the payslip", () => {
    const result = jobYear(job(3_500, { holidayPayRate: 0.08, pension: { kind: "monthly", amount: 180 } }));
    expect(result.pension).toBe(2_160);
    expect(result.taxable).toBeCloseTo(45_360 - 2_160, 2);
  });

  it("never takes more pension than the salary, and ignores a negative amount", () => {
    expect(jobYear(job(100, { pension: { kind: "monthly", amount: 500 } })).taxable).toBe(0);
    expect(jobYear(job(100, { pension: { kind: "monthly", amount: -50 } })).pension).toBe(0);
  });
});

describe("personNetto", () => {
  it("one person, 36,000: netto 31,342.25", () => {
    const result = personNetto([job(3_000)], rules);
    expect(result.gross).toBeCloseTo(36_000, 2);
    expect(result.tax).toBeCloseTo(4_657.75, 2);
    expect(result.netto).toBeCloseTo(31_342.25, 2);
  });

  it("two jobs of 3,000 and 1,200 per month with 8% holiday pay: gross 54,432, tax about 13,096", () => {
    const result = personNetto([job(3_000, { holidayPayRate: 0.08 }), job(1_200, { holidayPayRate: 0.08 })], rules);
    expect(result.gross).toBeCloseTo(54_432, 2);
    expect(Math.abs(result.tax - 13_096)).toBeLessThan(1);
  });

  it("taxes two jobs exactly like one job with the same total", () => {
    const twoJobs = personNetto([yearlyJob(39_000), yearlyJob(15_000)], rules);
    const oneJob = personNetto([yearlyJob(54_000)], rules);
    expect(twoJobs.tax).toBeCloseTo(oneJob.tax, 6);
    expect(twoJobs.netto).toBeCloseTo(oneJob.netto, 6);
  });

  it("keeps about 6,529 of a 10k second job next to a 25k main job, and about 4,953 next to 50k", () => {
    const keptFromSecondJob = (main: number) =>
      personNetto([yearlyJob(main), yearlyJob(10_000)], rules).netto - personNetto([yearlyJob(main)], rules).netto;
    expect(Math.abs(keptFromSecondJob(25_000) - 6_529)).toBeLessThan(1);
    expect(Math.abs(keptFromSecondJob(50_000) - 4_953)).toBeLessThan(1);
  });

  it("gives zero for a person without jobs", () => {
    expect(personNetto([], rules)).toMatchObject({ gross: 0, tax: 0, netto: 0 });
  });

  // The myth "if I earn more I end up with less" is false for income tax alone.
  // Steps of 1 euro: the official labour credit table has rounding jumps of 5 and 7 cents at
  // 25,845 and 45,592, so a step of 1 cent right across those points would show a tiny dip.
  it("never gives less netto for more gross, from 0 to 200,000 in steps of 1 euro", () => {
    for (const pension of [0, 0.08]) {
      let previous = -Infinity;
      for (let gross = 0; gross <= 200_000; gross += 1) {
        const { netto } = personNetto([job(gross / 12, { pension: { kind: "scheme", rate: pension, franchise: 18_000 } })], rules);
        if (netto < previous) throw new Error(`Netto went down at gross ${gross} (pension ${pension})`);
        previous = netto;
      }
    }
  });
});

describe("personNetto with a share of the eigen woning saldo", () => {
  const job = (monthly: number, holiday = 0): Job => ({ monthlyGross: monthly, holidayPayRate: holiday, yearEndBonusRate: 0, pension: NO_PENSION });

  it("worked example: 51,840 and a saldo of -10,600 is 4,659.55 less tax (37.56% plus 6.398% general credit)", () => {
    const without = personNetto([job(4_000, 0.08)], rules);
    const withHome = personNetto([job(4_000, 0.08)], rules, null, -10_600);
    expect(withHome.taxable).toBeCloseTo(41_240, 6);
    expect(withHome.woning).toBe(-10_600);
    expect(without.tax - withHome.tax).toBeCloseTo(4_659.55, 2);
    // The labour credit looks at income from work, which does not change.
    expect(withHome.incomeTax.labourCredit).toBeCloseTo(without.incomeTax.labourCredit, 6);
    expect(withHome.netto - without.netto).toBeCloseTo(4_659.55, 2);
  });

  it("top bracket: a saldo of -17,900 on 120,000 saves exactly 37.56%, after a tariefsaanpassing of 2,137.26", () => {
    const without = personNetto([job(10_000)], rules);
    const withHome = personNetto([job(10_000)], rules, null, -17_900);
    expect(withHome.incomeTax.topBracketAdjustment).toBeCloseTo(2_137.26, 2);
    expect(without.tax - withHome.tax).toBeCloseTo(6_723.24, 2);
  });

  it("the tariefsaanpassing only takes the part of the deduction that falls in the top bracket", () => {
    // 80,000 - 78,426 = 1,574 of the 10,000 deduction is in the top bracket.
    const withHome = personNetto([job(80_000 / 12)], rules, null, -10_000);
    expect(withHome.incomeTax.topBracketAdjustment).toBeCloseTo(0.1194 * 1_574, 6);
  });

  it("a positive saldo (Wet Hillen) is taxed as income", () => {
    const withHome = personNetto([job(3_000)], rules, null, 393.86);
    expect(withHome.taxable).toBeCloseTo(36_393.86, 6);
    expect(withHome.tax - personNetto([job(3_000)], rules).tax).toBeGreaterThan(0);
  });

  it("taxable income does not go below zero", () => {
    expect(personNetto([job(500)], rules, null, -20_000).taxable).toBe(0);
  });
});

describe("personNetto with a lijfrente deduction", () => {
  const job = (monthly: number): Job => ({ monthlyGross: monthly, holidayPayRate: 0, yearEndBonusRate: 0, pension: NO_PENSION });

  it("lowers taxable income, not income from work, and saves the full 49.50% in the top bracket", () => {
    const without = personNetto([job(10_000)], rules);
    const withLijfrente = personNetto([job(10_000)], rules, null, 0, 1_000);
    expect(withLijfrente.taxable).toBeCloseTo(119_000, 6);
    expect(withLijfrente.incomeTax.workIncome).toBeCloseTo(120_000, 6);
    expect(without.tax - withLijfrente.tax).toBeCloseTo(495, 6);
  });

  it("leaves less room in the top bracket for the tariefsaanpassing on the mortgage", () => {
    // 80,000 - 1,000 lijfrente - 78,426 = 574 of the mortgage deduction falls in the top bracket.
    const r = personNetto([job(80_000 / 12)], rules, null, -10_000, 1_000);
    expect(r.incomeTax.topBracketAdjustment).toBeCloseTo(0.1194 * 574, 6);
  });
});
