import type { TaxRules } from "../rules";
import type { SideIncome } from "./business";
import { personNetto, type Job, type PersonResult } from "./person";

/** One person's income: salary from jobs, plus optional side income as a zzp'er. */
export interface PersonIncome {
  jobs: Job[];
  side?: SideIncome | null;
}

export interface HouseholdResult {
  people: PersonResult[];
  /** Salary gross. */
  gross: number;
  pension: number;
  /** Side income profit (revenue minus costs). */
  profit: number;
  tax: number;
  zvw: number;
  netto: number;
}

/**
 * Yearly netto for a household: each person is taxed on their own income, then everything is added up.
 * Fiscal partnership does not change salary tax, so it is not needed here.
 */
export function householdNetto(people: PersonIncome[], rules: TaxRules): HouseholdResult {
  const results = people.map((person) => personNetto(person.jobs, rules, person.side ?? null));
  const total = (pick: (p: PersonResult) => number) => results.reduce((sum, p) => sum + pick(p), 0);
  return {
    people: results,
    gross: total((p) => p.gross),
    pension: total((p) => p.pension),
    profit: total((p) => p.business?.profit ?? 0),
    tax: total((p) => p.tax),
    zvw: total((p) => p.zvw),
    netto: total((p) => p.netto),
  };
}
