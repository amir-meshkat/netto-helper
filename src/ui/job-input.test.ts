import { describe, expect, it } from "vitest";
import { isInvalidInput, isJobInput, newJob, toEngineJob } from "./job-input";

describe("toEngineJob", () => {
  it("reads typed text into engine numbers, percentages as fractions", () => {
    const job = toEngineJob({ ...newJob("3.500"), holidayPct: "8", yearEndPct: "8,33", pensionMonthly: "€ 180" });
    expect(job.monthlyGross).toBe(3500);
    expect(job.holidayPayRate).toBeCloseTo(0.08, 10);
    expect(job.yearEndBonusRate).toBeCloseTo(0.0833, 10);
    expect(job.pension).toEqual({ kind: "monthly", amount: 180 });
  });

  it("uses the scheme fields when that pension mode is chosen", () => {
    const job = toEngineJob({ ...newJob("4000"), pensionMode: "scheme", pensionPct: "7,5", franchise: "18.000" });
    expect(job.pension).toEqual({ kind: "scheme", rate: 0.075, franchise: 18_000 });
  });

  it("treats empty, invalid and negative input as 0", () => {
    const job = toEngineJob({ ...newJob(""), holidayPct: "abc", pensionMonthly: "-50" });
    expect(job.monthlyGross).toBe(0);
    expect(job.holidayPayRate).toBe(0);
    expect(job.pension).toEqual({ kind: "monthly", amount: 0 });
  });
});

describe("isInvalidInput", () => {
  it("accepts empty text and numbers, rejects text without a number", () => {
    expect(isInvalidInput("monthly", "")).toBe(false);
    expect(isInvalidInput("monthly", "3.500")).toBe(false);
    expect(isInvalidInput("monthly", "lots")).toBe(true);
  });
});

describe("isJobInput", () => {
  it("accepts a job and rejects anything else", () => {
    expect(isJobInput(newJob("1000"))).toBe(true);
    expect(isJobInput({ ...newJob("1000"), pensionMode: "other" })).toBe(false);
    expect(isJobInput({ monthly: 1000 })).toBe(false);
    expect(isJobInput(null)).toBe(false);
  });
});
