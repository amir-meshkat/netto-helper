import type { TaxRules } from "../rules";
import type { SideIncome } from "./business";
import { personNetto, type Job, type PersonResult } from "./person";
import { toeslagen, type Child, type ToeslagHousehold, type ToeslagenResult } from "./toeslagen";

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

/** What the toeslagen need to know about the home, besides the income. */
export interface Home {
  /** Savings and investments on 1 January, of the household together. */
  vermogen: number;
  children: Child[];
  /** Bare rent per month, or null when the household does not rent. */
  rent: number | null;
  allYoung: boolean;
}

export interface HouseholdTotal {
  work: HouseholdResult;
  /** The sum of everyone's box 1 taxable income: what the toeslagen count as income. */
  toetsingsinkomen: number;
  toeslagen: ToeslagenResult;
  /** What the childcare on the page costs per year. Kinderopvangtoeslag pays part of it back. */
  childcareCost: number;
  /**
   * What the household has per year: netto from work, plus toeslagen, minus the childcare costs.
   * Kinderopvangtoeslag is not money to spend; it only makes up for part of a bill, so the bill counts too.
   */
  total: number;
}

/** The toeslagen view of a household: combined income, and a toeslagpartner when there are two people. */
export function toeslagHousehold(work: HouseholdResult, home: Home): ToeslagHousehold {
  return {
    income: work.people.reduce((sum, p) => sum + p.taxable, 0),
    partner: work.people.length > 1,
    ...home,
  };
}

/** Everything the household has in a year: netto from work, plus toeslagen on the combined income. */
export function householdTotal(people: PersonIncome[], home: Home, rules: TaxRules): HouseholdTotal {
  const work = householdNetto(people, rules);
  const h = toeslagHousehold(work, home);
  const t = toeslagen(h, rules);
  const childcareCost = t.kinderopvang.cost;
  return { work, toetsingsinkomen: h.income, toeslagen: t, childcareCost, total: work.netto + t.total - childcareCost };
}
