import type { TaxRules } from "../rules";

// The home you own and live in (eigen woning), in box 1: the eigenwoningforfait counts as income, the
// mortgage interest comes off. See docs/mortgage-2026.md for the rules and what is assumed.

export interface OwnHome {
  /** WOZ value of the home. */
  woz: number;
  /** Mortgage interest per year on the loan for this home (eigenwoningschuld). */
  interest: number;
  /**
   * Other deductible costs per year: the erfpacht canon, and in the year of buying or raising the mortgage
   * the costs of getting it (advice, valuation, NHG, notary for the mortgage deed).
   */
  costs?: number;
}

export interface EigenWoningResult {
  forfait: number;
  interest: number;
  /** Other deductible costs: erfpacht, costs of the mortgage. */
  costs: number;
  /** Wet Hillen: deducted when the forfait is larger than the interest. */
  hillen: number;
  /**
   * Forfait minus interest, other costs and the Hillen deduction: added to box 1 income. Below zero with a normal
   * mortgage, which lowers the taxable income (the hypotheekrenteaftrek).
   */
  saldo: number;
}

/** A percentage of the whole WOZ value, by band, or above the villagrens a fixed amount plus a higher percentage. */
export function eigenwoningforfait(woz: number, rules: TaxRules): number {
  const e = rules.eigenWoning;
  const value = Math.max(0, woz);
  if (value > e.villa.from) return e.villa.base + e.villa.rate * (value - e.villa.from);
  const band = e.forfait.find((b) => value <= b.upTo);
  return band ? band.rate * value : 0;
}

export function eigenWoning(home: OwnHome, rules: TaxRules): EigenWoningResult {
  const forfait = eigenwoningforfait(home.woz, rules);
  const interest = Math.max(0, home.interest);
  const costs = Math.max(0, home.costs ?? 0);
  const deductible = interest + costs;
  const hillen = forfait > deductible ? rules.eigenWoning.hillenRate * (forfait - deductible) : 0;
  return { forfait, interest, costs, hillen, saldo: forfait - deductible - hillen };
}
