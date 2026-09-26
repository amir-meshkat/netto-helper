import type { TaxRules } from "../rules";
import { box1Tax, type Box1Tax } from "./box1";
import { businessProfit, topBracketAdjustment, zvwContribution, type BusinessProfit, type SideIncome } from "./business";
import { generalCredit, labourCredit } from "./credits";

/**
 * Employee pension premium (werknemersdeel), in one of two forms:
 * - "monthly": the amount on the payslip, in euros per month. Easiest for most people.
 * - "scheme": the scheme's rule, rate over (yearly gross - franchise). The franchise is the part
 *   of the salary without pension build-up, in euros per year.
 */
export type Pension = { kind: "monthly"; amount: number } | { kind: "scheme"; rate: number; franchise: number };

export const NO_PENSION: Pension = { kind: "monthly", amount: 0 };

/** One job. Rates are fractions: 0.08 means 8%. */
export interface Job {
  /** Gross salary per month (bruto maandloon). */
  monthlyGross: number;
  /** Holiday pay (vakantiegeld). */
  holidayPayRate: number;
  /** Year-end bonus (eindejaarsuitkering), for example 0.0833 for a 13th month. */
  yearEndBonusRate: number;
  pension: Pension;
}

export interface JobYear {
  gross: number;
  pension: number;
  taxable: number;
}

/** Yearly gross, pension premium and taxable income of one job. */
export function jobYear(job: Job): JobYear {
  const gross = job.monthlyGross * 12 * (1 + job.holidayPayRate + job.yearEndBonusRate);
  const premium =
    job.pension.kind === "monthly"
      ? job.pension.amount * 12
      : Math.max(0, gross - job.pension.franchise) * job.pension.rate;
  const pension = Math.min(Math.max(0, premium), Math.max(0, gross));
  return { gross, pension, taxable: gross - pension };
}

export interface IncomeTax {
  taxableIncome: number;
  /** Income from work (arbeidsinkomen), the base for the labour credit. */
  workIncome: number;
  box1: Box1Tax;
  /** Tariefsaanpassing on deductions in the top bracket (entrepreneur deductions, a negative eigen woning saldo), added before the credits. */
  topBracketAdjustment: number;
  generalCredit: number;
  labourCredit: number;
  /** Credits actually used: never more than the tax before credits. */
  credits: number;
  tax: number;
}

interface IncomeTaxOptions {
  /** Defaults to the taxable income, which is right for salary only. */
  workIncome?: number;
  topBracketAdjustment?: number;
}

/** Income tax on a person's total taxable income: box 1 tax minus both credits. */
export function incomeTax(taxableIncome: number, rules: TaxRules, options: IncomeTaxOptions = {}): IncomeTax {
  const workIncome = options.workIncome ?? taxableIncome;
  const adjustment = options.topBracketAdjustment ?? 0;
  const box1 = box1Tax(taxableIncome, rules);
  const beforeCredits = box1.total + adjustment;
  const general = generalCredit(taxableIncome, rules);
  const labour = labourCredit(workIncome, rules);
  const credits = Math.min(beforeCredits, general + labour);
  return {
    taxableIncome,
    workIncome,
    box1,
    topBracketAdjustment: adjustment,
    generalCredit: general,
    labourCredit: labour,
    credits,
    tax: beforeCredits - credits,
  };
}

export interface PersonResult {
  jobs: JobYear[];
  /** Salary gross, with holiday pay and bonus. */
  gross: number;
  pension: number;
  /** Side income as a zzp'er, or null. */
  business: BusinessProfit | null;
  /** This person's share of the eigen woning saldo: above zero it adds to the income, below zero it is a deduction. */
  woning: number;
  taxable: number;
  incomeTax: IncomeTax;
  tax: number;
  /** Zvw contribution on side income. For salary the employer pays it. */
  zvw: number;
  netto: number;
}

/**
 * Yearly netto for one person: salary from one or more jobs, plus optional side income as a zzp'er, plus
 * their share of the eigen woning saldo (`woning`). Brackets and credits apply to the total, not per job.
 */
export function personNetto(jobs: Job[], rules: TaxRules, side: SideIncome | null = null, woning = 0): PersonResult {
  const years = jobs.map(jobYear);
  const gross = years.reduce((total, j) => total + j.gross, 0);
  const pension = years.reduce((total, j) => total + j.pension, 0);
  const salary = gross - pension;
  const business = side ? businessProfit(side, rules) : null;
  const profit = business?.profit ?? 0;
  // A negative box 1 income could be set off against other years (verliesverrekening); not included.
  const taxable = Math.max(0, salary + (business?.taxableProfit ?? 0) + woning);
  const tax = incomeTax(taxable, rules, {
    // Profit counts as income from work before the entrepreneur deductions. The home is not work.
    workIncome: salary + profit,
    // The negative eigen woning saldo is capped like the entrepreneur deductions, measured on income before both.
    topBracketAdjustment: topBracketAdjustment((business?.deductions ?? 0) + Math.max(0, -woning), salary + profit + Math.max(0, woning), rules),
  });
  const zvw = business ? zvwContribution(business.taxableProfit, salary, rules) : 0;
  return {
    jobs: years,
    gross,
    pension,
    business,
    woning,
    taxable,
    incomeTax: tax,
    tax: tax.tax,
    zvw,
    netto: salary + profit - tax.tax - zvw,
  };
}
