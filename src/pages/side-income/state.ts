import { isJobInput, newJob, type JobInput } from "../../ui/job-input";
import { isSideInput, newSide, type SideInput } from "../../ui/side-input";
import { readStored, writeStored } from "../../ui/storage";
import { loadSavedState as loadSavedHousehold, type HouseholdState } from "../household/state";

export interface PartnerInput {
  name: string;
  main: JobInput;
}

export interface SideIncomeState {
  version: 1;
  /** One person, or two partners to compare. */
  partners: PartnerInput[];
  side: SideInput;
}

export const MAX_PARTNERS = 2;

/** Example for a first visit: two partners in clearly different tax zones. */
export function defaultState(): SideIncomeState {
  return {
    version: 1,
    partners: [
      { name: "", main: newJob("3800") },
      { name: "", main: newJob("2000") },
    ],
    side: newSide("12000", "2000"),
  };
}

/** First visit: start from what was typed on the household page, if anything. Copies, never shares. */
export function fromHousehold(household: HouseholdState | null): SideIncomeState {
  const state = defaultState();
  if (!household) return state;
  state.partners = household.people.slice(0, MAX_PARTNERS).map((person) => ({ name: person.name, main: { ...person.job } }));
  const existing = household.people.find((person) => person.side)?.side;
  if (existing) state.side = { ...existing };
  return state;
}

// Saved in this browser only (localStorage), never sent anywhere.
const STORAGE_KEY = "netto-helper:side-income:v1";

export function loadState(): SideIncomeState {
  return parseSavedState(readStored(STORAGE_KEY)) ?? fromHousehold(loadSavedHousehold());
}

export function saveState(state: SideIncomeState): void {
  writeStored(STORAGE_KEY, state);
}

export function parseSavedState(raw: string | null): SideIncomeState | null {
  try {
    const value: unknown = raw ? JSON.parse(raw) : null;
    return isSideIncomeState(value) ? value : null;
  } catch {
    return null;
  }
}

function isSideIncomeState(value: unknown): value is SideIncomeState {
  if (typeof value !== "object" || value === null) return false;
  const state = value as Record<string, unknown>;
  return (
    state.version === 1 &&
    Array.isArray(state.partners) &&
    state.partners.length >= 1 &&
    state.partners.length <= MAX_PARTNERS &&
    state.partners.every((partner: unknown) => {
      if (typeof partner !== "object" || partner === null) return false;
      const p = partner as Record<string, unknown>;
      return typeof p.name === "string" && isJobInput(p.main);
    }) &&
    isSideInput(state.side)
  );
}
