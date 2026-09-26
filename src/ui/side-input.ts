import type { SideIncome } from "../engine/business";
import { parseNumber } from "./parse";
import type { SliderRange } from "./slider-range";

/** Side income as a zzp'er, as typed. Amounts per year, excluding btw. */
export interface SideInput {
  revenue: string;
  costs: string;
  /** The Belastingdienst sees it as a business (onderneming). Most registered zzp'ers. */
  business: boolean;
  /** Meets the hours criterion (urencriterium). */
  hours: boolean;
  starter: boolean;
}

export type SideTextKey = "revenue" | "costs";
export type SideSwitchKey = "business" | "hours" | "starter";

/** Slider range per amount, per year: the usual values. The text box still takes any number. */
export const SIDE_SLIDERS: Record<SideTextKey, SliderRange> = {
  revenue: { min: 0, max: 100_000, step: 500 },
  costs: { min: 0, max: 50_000, step: 250 },
};

export function newSide(revenue = "", costs = "0"): SideInput {
  return { revenue, costs, business: true, hours: false, starter: false };
}

const amount = (text: string) => Math.max(0, parseNumber(text) ?? 0);

export function toEngineSide(input: SideInput): SideIncome {
  return {
    revenue: amount(input.revenue),
    costs: amount(input.costs),
    kind: input.business ? "business" : "other",
    meetsHoursCriterion: input.hours,
    starter: input.starter,
  };
}

export function isSideInvalid(text: string): boolean {
  return text.trim() !== "" && parseNumber(text) === null;
}

/** Checks data read back from storage. */
export function isSideInput(value: unknown): value is SideInput {
  if (typeof value !== "object" || value === null) return false;
  const side = value as Record<string, unknown>;
  return (
    typeof side.revenue === "string" &&
    typeof side.costs === "string" &&
    typeof side.business === "boolean" &&
    typeof side.hours === "boolean" &&
    typeof side.starter === "boolean"
  );
}
