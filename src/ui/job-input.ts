import type { Job } from "../engine/person";
import { parseNumber } from "./parse";

/** One job as typed. Kept as text, so "3.500" stays exactly as the user wrote it. */
export interface JobInput {
  monthly: string;
  holidayPct: string;
  yearEndPct: string;
  pensionMode: "monthly" | "scheme";
  pensionMonthly: string;
  pensionPct: string;
  franchise: string;
}

export type JobTextKey = Exclude<keyof JobInput, "pensionMode">;

export const JOB_TEXT_KEYS: readonly JobTextKey[] = [
  "monthly",
  "holidayPct",
  "yearEndPct",
  "pensionMonthly",
  "pensionPct",
  "franchise",
];

const PERCENT_KEYS = new Set<JobTextKey>(["holidayPct", "yearEndPct", "pensionPct"]);

export function newJob(monthly = ""): JobInput {
  return {
    monthly,
    holidayPct: "8",
    yearEndPct: "0",
    pensionMode: "monthly",
    pensionMonthly: "0",
    pensionPct: "0",
    franchise: "0",
  };
}

const amount = (text: string) => Math.max(0, parseNumber(text) ?? 0);
const rate = (text: string) => Math.max(0, parseNumber(text, { decimalOnly: true }) ?? 0) / 100;

export function toEngineJob(input: JobInput): Job {
  return {
    monthlyGross: amount(input.monthly),
    holidayPayRate: rate(input.holidayPct),
    yearEndBonusRate: rate(input.yearEndPct),
    pension:
      input.pensionMode === "scheme"
        ? { kind: "scheme", rate: rate(input.pensionPct), franchise: amount(input.franchise) }
        : { kind: "monthly", amount: amount(input.pensionMonthly) },
  };
}

/** True when the text is not empty but holds no number. */
export function isInvalidInput(key: JobTextKey, text: string): boolean {
  return text.trim() !== "" && parseNumber(text, { decimalOnly: PERCENT_KEYS.has(key) }) === null;
}

/** Checks data read back from storage. */
export function isJobInput(value: unknown): value is JobInput {
  if (typeof value !== "object" || value === null) return false;
  const job = value as Record<string, unknown>;
  return (
    JOB_TEXT_KEYS.every((key) => typeof job[key] === "string") &&
    (job.pensionMode === "monthly" || job.pensionMode === "scheme")
  );
}
