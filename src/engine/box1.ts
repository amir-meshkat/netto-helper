import type { TaxRules } from "../rules";

/** The slice of income that falls inside one bracket, and the tax on that slice. */
export interface BracketPart {
  from: number;
  upTo: number;
  rate: number;
  amount: number;
  tax: number;
}

export interface Box1Tax {
  total: number;
  /** One entry per bracket, also the unused ones (amount 0), for the "Show me why" steps. */
  parts: BracketPart[];
}

/** Box 1 tax on a person's taxable income, before credits. Each rate applies only to its own slice. */
export function box1Tax(taxableIncome: number, rules: TaxRules): Box1Tax {
  const parts: BracketPart[] = [];
  let from = 0;
  let total = 0;
  for (const { upTo, rate } of rules.box1Brackets) {
    const amount = Math.max(0, Math.min(taxableIncome, upTo) - from);
    const tax = amount * rate;
    parts.push({ from, upTo, rate, amount, tax });
    total += tax;
    from = upTo;
  }
  return { total, parts };
}
