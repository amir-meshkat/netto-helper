import type { TaxRules } from "../rules";

/** General tax credit (algemene heffingskorting): full amount, then shrinks with income, minimum 0. */
export function generalCredit(taxableIncome: number, rules: TaxRules): number {
  const { max, phaseOutStart, phaseOutRate } = rules.generalCredit;
  return Math.max(0, max - Math.max(0, taxableIncome - phaseOutStart) * phaseOutRate);
}

/**
 * Labour tax credit (arbeidskorting), from the official table. A row applies from its "from"
 * up to, but not including, its "upTo". Minimum 0.
 */
export function labourCredit(workIncome: number, rules: TaxRules): number {
  if (workIncome <= 0) return 0;
  const segment = rules.labourCredit.find((s) => workIncome < s.upTo);
  if (!segment) return 0;
  return Math.max(0, segment.base + segment.rate * (workIncome - segment.from));
}
