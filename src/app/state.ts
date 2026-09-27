import { isHomeInput, newHome, type HomeInput } from "../ui/home-input";
import { isJobInput, newJob, type JobInput } from "../ui/job-input";
import { isSideInput, type SideInput } from "../ui/side-input";
import { readStored, writeStored } from "../ui/storage";

/** One person: a salaried job, plus optional side income as a zzp'er. */
export interface PersonInput {
  name: string;
  job: JobInput;
  side: SideInput | null;
  /** Factor A from the pension overview (UPO), for the lijfrente jaarruimte. Missing or empty: none. */
  factorA?: string;
  /** Last year's income from work, for the jaarruimte. Missing or empty: this year's. */
  lastYear?: string;
  /** Unused lijfrente room from the ten years before (reserveringsruimte). Missing or empty: none. */
  reservering?: string;
}

export interface HouseholdState {
  version: 3;
  people: PersonInput[];
  /** Children, rent or a mortgage, and savings: what the toeslagen and the own home need besides income. */
  home: HomeInput;
  /** The what-if lijfrente deposit per year, as typed. Missing: the section's example amount. */
  lijfrente?: string;
}

export const MAX_PEOPLE = 2;

export function newPerson(monthly = ""): PersonInput {
  return { name: "", job: newJob(monthly), side: null };
}

/** First visit: one person with an example salary, so the answer shows right away. */
export function defaultState(): HouseholdState {
  return { version: 3, people: [newPerson("3000")], home: newHome() };
}

// Saved in this browser only (localStorage), never sent anywhere.
// Version 1 allowed several jobs per person; version 2 has one job plus side income; version 3 adds the home.
// The key still says "household": the one page took over the household page's inputs as they were.
const STORAGE_KEY = "netto-helper:household:v2";

/** Where the separate side income page (before milestone 5) kept its own inputs. */
const OLD_SIDE_INCOME_KEY = "netto-helper:side-income:v1";

/** What was saved on this device, or null when nothing (valid) was saved yet. */
export function loadSavedState(): HouseholdState | null {
  return parseSavedState(readStored(STORAGE_KEY));
}

/**
 * What this device had typed before. The household inputs carry over as they are. The old side income
 * page's inputs are only used when there are no household inputs yet.
 */
export function loadState(): HouseholdState {
  return loadSavedState() ?? fromOldSideIncomePage(readStored(OLD_SIDE_INCOME_KEY)) ?? defaultState();
}

export function saveState(state: HouseholdState): void {
  writeStored(STORAGE_KEY, state);
}

export function parseSavedState(raw: string | null): HouseholdState | null {
  let value: unknown;
  try {
    value = raw ? JSON.parse(raw) : null;
  } catch {
    return null; // broken JSON: start fresh
  }
  if (typeof value !== "object" || value === null) return null;
  const state = value as Record<string, unknown>;
  if (!arePeople(state.people)) return null;
  // Saved before the toeslagen: keep the people, start with an empty home.
  if (state.version === 2) return { version: 3, people: state.people, home: newHome() };
  // Saved before the mortgage or the lijfrente: the same version, without those fields.
  if (state.version === 3 && isHomeInput(state.home)) {
    const lijfrente = typeof state.lijfrente === "string" ? { lijfrente: state.lijfrente } : {};
    return { version: 3, people: state.people, home: { ...state.home, mortgage: state.home.mortgage ?? null }, ...lijfrente };
  }
  return null;
}

function arePeople(value: unknown): value is PersonInput[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_PEOPLE) return false;
  return value.every((person: unknown) => {
    if (typeof person !== "object" || person === null) return false;
    const p = person as Record<string, unknown>;
    return (
      typeof p.name === "string" &&
      isJobInput(p.job) &&
      (p.side === null || isSideInput(p.side)) &&
      [p.factorA, p.lastYear, p.reservering].every((v) => v === undefined || typeof v === "string")
    );
  });
}

/**
 * The old side income page saved one or two partners with a salary each, and one side income that
 * belonged to nobody in particular. Here the partners become the people, and the side income goes to the
 * first person, the "you" of that page. Null when nothing valid was saved there.
 */
export function fromOldSideIncomePage(raw: string | null): HouseholdState | null {
  let value: unknown;
  try {
    value = raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) return null;
  const old = value as Record<string, unknown>;
  const partners = old.partners;
  if (old.version !== 1 || !Array.isArray(partners) || !isSideInput(old.side)) return null;
  if (partners.length < 1 || partners.length > MAX_PEOPLE) return null;
  const people: PersonInput[] = [];
  for (const partner of partners as unknown[]) {
    if (typeof partner !== "object" || partner === null) return null;
    const p = partner as Record<string, unknown>;
    if (typeof p.name !== "string" || !isJobInput(p.main)) return null;
    people.push({ name: p.name, job: p.main, side: people.length === 0 ? old.side : null });
  }
  return { version: 3, people, home: newHome() };
}
