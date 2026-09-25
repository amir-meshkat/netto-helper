import { describe, expect, it } from "vitest";
import { getRules } from "../rules";
import { NO_PENSION, personNetto, type Job } from "./person";
import { payrollEstimate } from "./withholding";

const rules = getRules(2026);

const job = (monthlyGross: number): Job => ({
  monthlyGross,
  holidayPayRate: 0.08,
  yearEndBonusRate: 0,
  pension: NO_PENSION,
});

// Real loonbelastingtabellen round a little differently, so these use a tolerance.
const expectAbout = (actual: number, expected: number, tolerance = 5) =>
  expect(Math.abs(actual - expected)).toBeLessThan(tolerance);

describe("payrollEstimate", () => {
  const jobs = [job(3_000), job(1_200)];

  it("job 1 withholds with credits, job 2 without, each on its own salary", () => {
    const estimate = payrollEstimate(jobs, rules);
    expect(estimate.jobs[0]?.appliesCredits).toBe(true);
    expect(estimate.jobs[1]?.appliesCredits).toBe(false);
    expectAbout(estimate.jobs[0]?.withheld ?? NaN, 5_815);
    expectAbout(estimate.jobs[1]?.withheld ?? NaN, 5_560);
    expectAbout(estimate.totalWithheld, 11_375);
  });

  it("leaves about 1,720 to pay at the aangifte", () => {
    const estimate = payrollEstimate(jobs, rules);
    expectAbout(estimate.finalTax, 13_096);
    expectAbout(estimate.settlement, 1_720);
    expect(estimate.settlement).toBeCloseTo(estimate.finalTax - estimate.totalWithheld, 6);
  });

  it("has the same final tax whichever job applies the credits, only the settlement changes", () => {
    const creditsAtJob1 = payrollEstimate(jobs, rules, 0);
    const creditsAtJob2 = payrollEstimate(jobs, rules, 1);
    expect(creditsAtJob2.jobs[1]?.appliesCredits).toBe(true);
    expect(creditsAtJob2.finalTax).toBeCloseTo(creditsAtJob1.finalTax, 6);
    expect(creditsAtJob2.settlement).not.toBeCloseTo(creditsAtJob1.settlement, 0);
  });

  it("can mean money back instead: a second job next to a low main salary", () => {
    // Main job 2,000 a month with 150 pension, second job 800 a month, both with 8% holiday pay.
    // Taxable 24,120 + 10,368. The main job's credits still count at the full low-income level.
    const main: Job = { ...job(2_000), pension: { kind: "monthly", amount: 150 } };
    const estimate = payrollEstimate([main, job(800)], rules);
    expectAbout(estimate.settlement, -399);
  });

  it("matches the final tax exactly with only one job", () => {
    const estimate = payrollEstimate([job(3_000)], rules);
    expect(estimate.totalWithheld).toBeCloseTo(personNetto([job(3_000)], rules).tax, 6);
    expect(estimate.settlement).toBeCloseTo(0, 6);
  });
});
