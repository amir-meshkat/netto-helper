import type { Home } from "../engine/household";
import type { ChildcareKind, TaxRules } from "../rules";
import { parseNumber } from "./parse";
import type { SliderRange } from "./slider-range";

// What the toeslagen and the mortgage need besides income, as typed: children and childcare, rent or a
// mortgage, savings.
// Kept as text, like the job and side income inputs, so "12.500" stays as the user wrote it.

export interface CareInput {
  kind: ChildcareKind;
  hours: string;
  price: string;
}

export interface ChildInput {
  age: string;
  care: CareInput | null;
}

/**
 * An own home with a mortgage. The interest per year is loan times rate, or typed from the annual statement
 * (mode "interest"). Fields added later are optional, so a mortgage saved before them still reads.
 */
export interface MortgageInput {
  /** WOZ value of the home. */
  woz: string;
  /** What is left of the loan for the home now. */
  loan: string;
  /** Interest rate in percent, for example "3.8". */
  rate: string;
  /** How the interest is given: loan and rate (the default), or the interest from the annual statement. */
  mode?: MortgageMode;
  /** Interest paid per year, from the annual statement (jaaroverzicht). */
  interest?: string;
  /** Other deductible home costs per year: erfpacht, costs of the mortgage. */
  costs?: string;
}

export type MortgageMode = "rate" | "interest";
export const MORTGAGE_MODES: readonly MortgageMode[] = ["rate", "interest"];

export interface HomeInput {
  children: ChildInput[];
  /** Bare rent per month, or null when no rent was added. */
  rent: string | null;
  /** The own home, or null. A household rents or owns, so rent and mortgage are never both set. */
  mortgage: MortgageInput | null;
  /** Everyone living here is 18, 19 or 20. */
  allYoung: boolean;
  savings: string;
}

export type HomeTextKey = "age" | "hours" | "price" | "rent" | "savings" | "woz" | "loan" | "rate" | "interest" | "costs";

export const CHILDCARE_KINDS: readonly ChildcareKind[] = ["dagopvang", "bso", "gastouder"];

/** Slider range per field: the usual values. The text box still takes any number. */
export const HOME_SLIDERS: Record<HomeTextKey, SliderRange> = {
  age: { min: 0, max: 17, step: 1 },
  hours: { min: 0, max: 230, step: 1 },
  price: { min: 0, max: 15, step: 0.05 },
  rent: { min: 0, max: 1_500, step: 5 },
  savings: { min: 0, max: 250_000, step: 1_000 },
  woz: { min: 0, max: 1_500_000, step: 5_000 },
  loan: { min: 0, max: 1_000_000, step: 5_000 },
  rate: { min: 0, max: 8, step: 0.05 },
  interest: { min: 0, max: 40_000, step: 50 },
  costs: { min: 0, max: 10_000, step: 50 },
};

export function newHome(): HomeInput {
  return { children: [], rent: null, mortgage: null, allYoung: false, savings: "0" };
}

/** Starts empty: the answer waits until the WOZ value, loan and rate are typed. */
export function newMortgage(): MortgageInput {
  return { woz: "", loan: "", rate: "", mode: "rate", interest: "", costs: "" };
}

/** Interest per year as the engine needs it: typed from the statement, or loan times rate. */
function mortgageInterest(m: MortgageInput): number {
  return m.mode === "interest" ? amount(m.interest ?? "") : amount(m.loan) * percentage(m.rate);
}

export function newChild(): ChildInput {
  return { age: "4", care: null };
}

/** New childcare starts at the maximum price per hour: many providers charge about that or more. */
export function newCare(rules: TaxRules, kind: ChildcareKind = "dagopvang"): CareInput {
  return { kind, hours: "100", price: String(rules.toeslagen.kinderopvang.maxHourlyPrice[kind]) };
}

const amount = (text: string) => Math.max(0, parseNumber(text) ?? 0);
/** "3.8" or "3,8" is 3.8%, never 3,800%. */
const percentage = (text: string) => Math.max(0, parseNumber(text, { decimalOnly: true }) ?? 0) / 100;

export function toEngineHome(input: HomeInput): Home {
  const m = input.mortgage;
  return {
    vermogen: amount(input.savings),
    rent: input.rent === null || m ? null : amount(input.rent),
    owner: m ? { woz: amount(m.woz), interest: mortgageInterest(m), costs: amount(m.costs ?? "") } : null,
    allYoung: input.allYoung,
    children: input.children.map((child) => ({
      age: Math.floor(amount(child.age)),
      care: child.care
        ? { kind: child.care.kind, hoursPerMonth: amount(child.care.hours), pricePerHour: amount(child.care.price) }
        : null,
    })),
  };
}

/** True when the text is not empty but holds no number. */
export function isHomeInvalid(text: string, key?: HomeTextKey): boolean {
  return text.trim() !== "" && parseNumber(text, { decimalOnly: key === "rate" }) === null;
}

function isMortgageInput(value: unknown): value is MortgageInput {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  const optional = (v: unknown) => v === undefined || typeof v === "string";
  return (
    typeof m.woz === "string" &&
    typeof m.loan === "string" &&
    typeof m.rate === "string" &&
    (m.mode === undefined || MORTGAGE_MODES.includes(m.mode as MortgageMode)) &&
    optional(m.interest) &&
    optional(m.costs)
  );
}

function isCareInput(value: unknown): value is CareInput {
  if (typeof value !== "object" || value === null) return false;
  const care = value as Record<string, unknown>;
  return (
    CHILDCARE_KINDS.includes(care.kind as ChildcareKind) && typeof care.hours === "string" && typeof care.price === "string"
  );
}

/** Checks data read back from storage. */
export function isHomeInput(value: unknown): value is HomeInput {
  if (typeof value !== "object" || value === null) return false;
  const home = value as Record<string, unknown>;
  return (
    Array.isArray(home.children) &&
    home.children.every((child: unknown) => {
      if (typeof child !== "object" || child === null) return false;
      const c = child as Record<string, unknown>;
      return typeof c.age === "string" && (c.care === null || isCareInput(c.care));
    }) &&
    (home.rent === null || typeof home.rent === "string") &&
    // Saved before the mortgage: no field at all.
    (home.mortgage === undefined || home.mortgage === null || isMortgageInput(home.mortgage)) &&
    typeof home.allYoung === "boolean" &&
    typeof home.savings === "string"
  );
}
