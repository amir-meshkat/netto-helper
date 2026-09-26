import type { Home } from "../engine/household";
import type { ChildcareKind, TaxRules } from "../rules";
import { parseNumber } from "./parse";
import type { SliderRange } from "./slider-range";

// What the toeslagen need besides income, as typed: children and childcare, rent, savings.
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

export interface HomeInput {
  children: ChildInput[];
  /** Bare rent per month, or null when no rent was added. */
  rent: string | null;
  /** Everyone living here is 18, 19 or 20. */
  allYoung: boolean;
  savings: string;
}

export type HomeTextKey = "age" | "hours" | "price" | "rent" | "savings";

export const CHILDCARE_KINDS: readonly ChildcareKind[] = ["dagopvang", "bso", "gastouder"];

/** Slider range per field: the usual values. The text box still takes any number. */
export const HOME_SLIDERS: Record<HomeTextKey, SliderRange> = {
  age: { min: 0, max: 17, step: 1 },
  hours: { min: 0, max: 230, step: 1 },
  price: { min: 0, max: 15, step: 0.05 },
  rent: { min: 0, max: 1_500, step: 5 },
  savings: { min: 0, max: 250_000, step: 1_000 },
};

export function newHome(): HomeInput {
  return { children: [], rent: null, allYoung: false, savings: "0" };
}

export function newChild(): ChildInput {
  return { age: "4", care: null };
}

/** New childcare starts at the maximum price per hour: many providers charge about that or more. */
export function newCare(rules: TaxRules, kind: ChildcareKind = "dagopvang"): CareInput {
  return { kind, hours: "100", price: String(rules.toeslagen.kinderopvang.maxHourlyPrice[kind]) };
}

const amount = (text: string) => Math.max(0, parseNumber(text) ?? 0);

export function toEngineHome(input: HomeInput): Home {
  return {
    vermogen: amount(input.savings),
    rent: input.rent === null ? null : amount(input.rent),
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
export function isHomeInvalid(text: string): boolean {
  return text.trim() !== "" && parseNumber(text) === null;
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
    typeof home.allYoung === "boolean" &&
    typeof home.savings === "string"
  );
}
