import type { TaxRules } from "../rules";
import { box1Tax } from "./box1";
import { incomeTax, jobYear, personNetto, type Job } from "./person";

export interface JobWithholding {
  gross: number;
  taxable: number;
  /** True for the one job that applies the credits (loonheffingskorting). */
  appliesCredits: boolean;
  /** Tax withheld by this employer over the year. */
  withheld: number;
}

export interface PayrollEstimate {
  jobs: JobWithholding[];
  totalWithheld: number;
  /** The real yearly tax on the total income, as in the aangifte. */
  finalTax: number;
  /** Positive: to pay at the aangifte. Negative: money back. */
  settlement: number;
}

/**
 * Yearly estimate of what each employer withholds. Every employer acts as if its salary is
 * the only income; only the job at creditsJobIndex applies the credits.
 */
export function payrollEstimate(jobs: Job[], rules: TaxRules, creditsJobIndex = 0): PayrollEstimate {
  const perJob = jobs.map((job, index): JobWithholding => {
    const { gross, taxable } = jobYear(job);
    const appliesCredits = index === creditsJobIndex;
    const withheld = appliesCredits ? incomeTax(taxable, rules).tax : box1Tax(taxable, rules).total;
    return { gross, taxable, appliesCredits, withheld };
  });
  const totalWithheld = perJob.reduce((total, j) => total + j.withheld, 0);
  const finalTax = personNetto(jobs, rules).tax;
  return { jobs: perJob, totalWithheld, finalTax, settlement: finalTax - totalWithheld };
}
