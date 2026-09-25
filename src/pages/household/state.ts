import { isJobInput, newJob, type JobInput } from "../../ui/job-input";
import { isSideInput, type SideInput } from "../../ui/side-input";
import { readStored, writeStored } from "../../ui/storage";

/** One person: a salaried job, plus optional side income as a zzp'er. */
export interface PersonInput {
  name: string;
  job: JobInput;
  side: SideInput | null;
}

export interface HouseholdState {
  version: 2;
  people: PersonInput[];
}

export const MAX_PEOPLE = 2;

export function newPerson(monthly = ""): PersonInput {
  return { name: "", job: newJob(monthly), side: null };
}

/** First visit: one person with an example salary, so the answer shows right away. */
export function defaultState(): HouseholdState {
  return { version: 2, people: [newPerson("3000")] };
}

// Saved in this browser only (localStorage), never sent anywhere.
// Version 1 allowed several jobs per person; version 2 has one job plus side income.
const STORAGE_KEY = "netto-helper:household:v2";

/** What was saved on this device, or null when nothing (valid) was saved yet. */
export function loadSavedState(): HouseholdState | null {
  return parseSavedState(readStored(STORAGE_KEY));
}

export function loadState(): HouseholdState {
  return loadSavedState() ?? defaultState();
}

export function saveState(state: HouseholdState): void {
  writeStored(STORAGE_KEY, state);
}

export function parseSavedState(raw: string | null): HouseholdState | null {
  try {
    const value: unknown = raw ? JSON.parse(raw) : null;
    return isHouseholdState(value) ? value : null;
  } catch {
    return null; // broken JSON: start fresh
  }
}

function isHouseholdState(value: unknown): value is HouseholdState {
  if (typeof value !== "object" || value === null) return false;
  const state = value as Record<string, unknown>;
  if (state.version !== 2 || !Array.isArray(state.people)) return false;
  if (state.people.length < 1 || state.people.length > MAX_PEOPLE) return false;
  return state.people.every((person: unknown) => {
    if (typeof person !== "object" || person === null) return false;
    const p = person as Record<string, unknown>;
    return typeof p.name === "string" && isJobInput(p.job) && (p.side === null || isSideInput(p.side));
  });
}
