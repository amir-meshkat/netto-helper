import { rules2026 } from "./2026";
import type { TaxRules } from "./types";

export type {
  AlonePartner,
  Box1Bracket,
  ChildcareKind,
  EntrepreneurRules,
  GeneralCreditRules,
  HuurtoeslagRules,
  KindgebondenBudgetRules,
  KinderopvangBand,
  KinderopvangRules,
  LabourCreditSegment,
  OneMore,
  TaxRules,
  ToeslagenRules,
  ZorgtoeslagRules,
  ZvwRules,
} from "./types";

// A new tax year means a new rules file and one line here, no engine changes.
const RULES_BY_YEAR: Record<number, TaxRules> = {
  2026: rules2026,
};

export function getRules(year: number): TaxRules {
  const rules = RULES_BY_YEAR[year];
  if (!rules) {
    throw new Error(`No tax rules for ${year}. Available years: ${Object.keys(RULES_BY_YEAR).join(", ")}`);
  }
  return rules;
}
