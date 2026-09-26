import type { TaxRules } from "../rules";
import type { SideIncome } from "./business";
import { personNetto, type Job } from "./person";

/** What side income as a zzp'er adds for one person, per year. */
export interface SideIncomeValue {
  nettoWithout: number;
  nettoWith: number;
  /** Extra netto from the side income. Always profit - setAside. */
  kept: number;
  /** Revenue minus costs. */
  profit: number;
  /** Extra income tax the side income causes, at this person's rates. */
  extraTax: number;
  zvw: number;
  /**
   * Nothing is withheld on side income, so this is what to set aside for the tax return:
   * extra income tax plus Zvw. Assumes the salary's own tax is withheld correctly by the employer.
   */
  setAside: number;
}

/**
 * The value of side income to one person. Tax is per person, on the total of their income,
 * so the same side income is worth a different amount to each partner. `woning` is the person's
 * share of the eigen woning saldo, the same with and without the side income.
 */
export function sideIncomeValue(jobs: Job[], side: SideIncome, rules: TaxRules, woning = 0): SideIncomeValue {
  const without = personNetto(jobs, rules, null, woning);
  const withSide = personNetto(jobs, rules, side, woning);
  const extraTax = withSide.tax - without.tax;
  return {
    nettoWithout: without.netto,
    nettoWith: withSide.netto,
    kept: withSide.netto - without.netto,
    profit: withSide.business?.profit ?? 0,
    extraTax,
    zvw: withSide.zvw,
    setAside: extraTax + withSide.zvw,
  };
}

export interface CurvePoint {
  /** Main job salary per month, as typed. */
  monthlyGross: number;
  /** Kept from the side income, per year. */
  kept: number;
}

/** Kept from the side income for a range of main job salaries, keeping the main job's other settings. */
export function sideIncomeCurve(mainJob: Job, side: SideIncome, monthlyGrossValues: number[], rules: TaxRules, woning = 0): CurvePoint[] {
  return monthlyGrossValues.map((monthlyGross) => ({
    monthlyGross,
    kept: sideIncomeValue([{ ...mainJob, monthlyGross }], side, rules, woning).kept,
  }));
}
