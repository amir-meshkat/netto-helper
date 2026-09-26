import type { TaxRules } from "../rules";

/** Side income as a zzp'er or freelancer, per year, excluding btw. */
export interface SideIncome {
  revenue: number;
  costs: number;
  /**
   * "business": winst uit onderneming, with the entrepreneur deductions.
   * "other": resultaat uit overige werkzaamheden, when the Belastingdienst does not see it as a business.
   */
  kind: "business" | "other";
  /** Works at least the hours criterion (urencriterium) in the business. Rare next to a salaried job. */
  meetsHoursCriterion: boolean;
  /** Started less than five years ago, for the startersaftrek. Only counts with the hours criterion. */
  starter: boolean;
}

export interface BusinessProfit {
  /** Revenue minus costs. Losses are not included yet, so never below 0. */
  profit: number;
  selfEmployedDeduction: number;
  starterDeduction: number;
  /** Mkb-winstvrijstelling. */
  profitExemption: number;
  /** Profit that is taxed in box 1 (belastbare winst). Below 0 only for starters: it then lowers the salary's taxable income. */
  taxableProfit: number;
  /** Total of the deductions above, for the tariefsaanpassing. */
  deductions: number;
}

export function businessProfit(side: SideIncome, rules: TaxRules): BusinessProfit {
  const e = rules.entrepreneur;
  const profit = Math.max(0, side.revenue - side.costs);
  if (side.kind === "other") {
    return { profit, selfEmployedDeduction: 0, starterDeduction: 0, profitExemption: 0, taxableProfit: profit, deductions: 0 };
  }
  const starter = side.meetsHoursCriterion && side.starter;
  const selfEmployedDeduction = side.meetsHoursCriterion
    ? starter
      ? e.selfEmployedDeduction
      : Math.min(e.selfEmployedDeduction, profit)
    : 0;
  const starterDeduction = starter ? e.starterDeduction : 0;
  const afterDeductions = profit - selfEmployedDeduction - starterDeduction;
  const profitExemption = afterDeductions * e.profitExemptionRate;
  return {
    profit,
    selfEmployedDeduction,
    starterDeduction,
    profitExemption,
    taxableProfit: afterDeductions - profitExemption,
    deductions: selfEmployedDeduction + starterDeduction + profitExemption,
  };
}

/**
 * Zvw contribution a zzp'er pays on the taxed profit. Salary (where the employer paid the Zvw)
 * counts toward the maximum first, so only the room left under it is charged.
 */
export function zvwContribution(taxableProfit: number, salary: number, rules: TaxRules): number {
  const room = Math.max(0, rules.zvw.maxIncome - Math.max(0, salary));
  return rules.zvw.rate * Math.min(Math.max(0, taxableProfit), room);
}

/**
 * Tariefsaanpassing: in the top bracket, deductions save tax at a lower rate. Extra tax on the part of the
 * deductions that falls in the top bracket, measured on income before deductions.
 * The base is our reading of the Belastingdienst page; they calculate it automatically in the aangifte.
 */
export function topBracketAdjustment(deductions: number, incomeBeforeDeductions: number, rules: TaxRules): number {
  const topStart = rules.box1Brackets.at(-2)?.upTo ?? Infinity;
  const inTopBracket = Math.max(0, incomeBeforeDeductions - topStart);
  return rules.topBracketDeductionAdjustment * Math.min(Math.max(0, deductions), inTopBracket);
}
