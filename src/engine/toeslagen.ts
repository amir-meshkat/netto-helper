import type { ChildcareKind, KinderopvangBand, TaxRules } from "../rules";

// The four toeslagen for one household and one year. Amounts are euros per year.
// Every threshold and percentage comes from the rules; see "Toeslagen 2026" in CLAUDE.md.

export interface Childcare {
  kind: ChildcareKind;
  hoursPerMonth: number;
  pricePerHour: number;
}

export interface Child {
  age: number;
  /** Paid childcare, or null. Kinderopvangtoeslag assumes the parents work every month of the year. */
  care: Childcare | null;
}

/** Everything the toeslagen look at. */
export interface ToeslagHousehold {
  /** Toetsingsinkomen: the yearly income of the person and their toeslagpartner together. */
  income: number;
  partner: boolean;
  /** Savings and investments on 1 January. */
  vermogen: number;
  children: Child[];
  /** Bare rent per month (kale huur), without service costs. Null when the household does not rent. */
  rent: number | null;
  /** Every resident is 18, 19 or 20: rent counts up to the lower rekengrens. */
  allYoung: boolean;
}

export interface ZorgtoeslagResult {
  amount: number;
  standaardpremie: number;
  normpremie: number;
  /** Why there is nothing, when the formula alone would still give something. */
  stopped: "income" | "vermogen" | null;
}

export interface KindgebondenBudgetResult {
  amount: number;
  children: number;
  maximum: number;
  reduction: number;
  stopped: "vermogen" | null;
}

export interface HuurtoeslagResult {
  amount: number;
  countedRent: number;
  basishuur: number;
  /** Per month: what each band of the rent adds, after its share. */
  bands: { toKwaliteitskorting: number; toAftopping: number; aboveAftopping: number };
  /** Per year: what comes off for the income above the income point. */
  reduction: number;
  stopped: "vermogen" | null;
}

export interface KinderopvangChild {
  /** Index in the household's children. */
  child: number;
  share: number;
  /** The price per hour the toeslag counts: at most the maximum. */
  hourlyPrice: number;
  /** The hours per month the toeslag counts: at most the maximum. */
  hours: number;
  amount: number;
  /** What the parents pay the provider per year: every hour at its real price. */
  cost: number;
}

export interface KinderopvangResult {
  amount: number;
  children: KinderopvangChild[];
  /** What all childcare costs per year, before the toeslag. */
  cost: number;
}

export interface ToeslagenResult {
  zorgtoeslag: ZorgtoeslagResult;
  kindgebondenBudget: KindgebondenBudgetResult;
  huurtoeslag: HuurtoeslagResult;
  kinderopvang: KinderopvangResult;
  total: number;
}

const who = (h: ToeslagHousehold) => (h.partner ? "partner" : "alone");

export function zorgtoeslag(h: ToeslagHousehold, rules: TaxRules): ZorgtoeslagResult {
  const z = rules.toeslagen.zorgtoeslag;
  const standaardpremie = (h.partner ? 2 : 1) * z.standaardpremie;
  const normpremie = z.normpremieBase[who(h)] * z.drempelinkomen + z.normpremieRate * Math.max(0, h.income - z.drempelinkomen);
  const result = { standaardpremie, normpremie };
  if (h.vermogen > z.maxVermogen[who(h)]) return { ...result, amount: 0, stopped: "vermogen" };
  if (h.income > z.maxIncome[who(h)]) return { ...result, amount: 0, stopped: "income" };
  return { ...result, amount: Math.max(0, standaardpremie - normpremie), stopped: null };
}

export function kindgebondenBudget(h: ToeslagHousehold, rules: TaxRules): KindgebondenBudgetResult {
  const k = rules.toeslagen.kindgebondenBudget;
  const children = h.children.filter((c) => c.age >= 0 && c.age < 18);
  if (children.length === 0) return { amount: 0, children: 0, maximum: 0, reduction: 0, stopped: null };
  const extras = children.reduce((sum, c) => sum + (c.age >= 16 ? k.extra16to17 : c.age >= 12 ? k.extra12to15 : 0), 0);
  const maximum = children.length * k.perChild + extras + (h.partner ? 0 : k.singleParent);
  const reduction = k.phaseOutRate * Math.max(0, h.income - k.threshold[who(h)]);
  const result = { children: children.length, maximum, reduction };
  if (h.vermogen > k.maxVermogen[who(h)]) return { ...result, amount: 0, stopped: "vermogen" };
  return { ...result, amount: Math.max(0, maximum - reduction), stopped: null };
}

export function huurtoeslag(h: ToeslagHousehold, rules: TaxRules): HuurtoeslagResult {
  const r = rules.toeslagen.huurtoeslag;
  const people = (h.partner ? 2 : 1) + h.children.length;
  const size = people === 1 ? "one" : "more";
  const basishuur = r.basishuur[size];
  const none = { amount: 0, countedRent: 0, basishuur, bands: { toKwaliteitskorting: 0, toAftopping: 0, aboveAftopping: 0 }, reduction: 0 };
  if (h.rent === null || h.rent <= 0) return { ...none, stopped: null };

  // The lower rekengrens is for households where everyone is 18, 19 or 20; a child in the home lifts it.
  const young = h.allYoung && h.children.length === 0;
  const countedRent = Math.min(h.rent, young ? r.maxRentYoung : r.maxRent);
  const aftopping = people <= 2 ? r.aftoppingsgrens.upToTwo : r.aftoppingsgrens.threeOrMore;
  const between = (low: number, high: number) => Math.max(0, Math.min(countedRent, high) - Math.max(low, basishuur));
  const bands = {
    toKwaliteitskorting: r.shares.toKwaliteitskorting * between(0, r.kwaliteitskortingsgrens),
    toAftopping: r.shares.toAftopping * between(r.kwaliteitskortingsgrens, aftopping),
    aboveAftopping: r.shares.aboveAftopping * between(aftopping, Infinity),
  };
  const perMonth = bands.toKwaliteitskorting + bands.toAftopping + bands.aboveAftopping;
  const reduction = r.phaseOutRate[size] * Math.max(0, h.income - r.incomePoint[size]);
  const result = { countedRent, basishuur, bands, reduction };
  if (h.vermogen > r.maxVermogen[who(h)]) return { ...result, amount: 0, stopped: "vermogen" };
  return { ...result, amount: Math.max(0, 12 * perMonth - reduction), stopped: null };
}

/** The table row for this toetsingsinkomen (in whole euros, as the Belastingdienst counts it). */
export function kinderopvangBand(income: number, rules: TaxRules): KinderopvangBand {
  const table = rules.toeslagen.kinderopvang.table;
  const euros = Math.floor(Math.max(0, income));
  const band = table.find((b) => euros <= b.upTo) ?? table.at(-1);
  if (!band) throw new Error("Empty kinderopvangtoeslag table");
  return band;
}

export function kinderopvangShares(income: number, rules: TaxRules): { first: number; next: number } {
  const { first, next } = kinderopvangBand(income, rules);
  return { first, next };
}

export function kinderopvangtoeslag(h: ToeslagHousehold, rules: TaxRules): KinderopvangResult {
  const k = rules.toeslagen.kinderopvang;
  const shares = kinderopvangShares(h.income, rules);
  const cared = h.children.flatMap((c, i) => (c.care && c.care.hoursPerMonth > 0 && c.care.pricePerHour > 0 ? [{ i, care: c.care }] : []));
  // The "first child" is the one with the most hours of childcare; the sort keeps the order for equal hours.
  const firstChild = [...cared].sort((a, b) => b.care.hoursPerMonth - a.care.hoursPerMonth)[0]?.i;
  const children = cared.map(({ i, care }) => {
    const share = i === firstChild ? shares.first : shares.next;
    const hourlyPrice = Math.min(care.pricePerHour, k.maxHourlyPrice[care.kind]);
    const hours = Math.min(care.hoursPerMonth, k.maxHoursPerMonth);
    const cost = 12 * care.pricePerHour * care.hoursPerMonth;
    return { child: i, share, hourlyPrice, hours, amount: 12 * share * hourlyPrice * hours, cost };
  });
  const total = (pick: (c: KinderopvangChild) => number) => children.reduce((sum, c) => sum + pick(c), 0);
  return { amount: total((c) => c.amount), children, cost: total((c) => c.cost) };
}

export function toeslagen(h: ToeslagHousehold, rules: TaxRules): ToeslagenResult {
  const z = zorgtoeslag(h, rules);
  const k = kindgebondenBudget(h, rules);
  const hu = huurtoeslag(h, rules);
  const ko = kinderopvangtoeslag(h, rules);
  return { zorgtoeslag: z, kindgebondenBudget: k, huurtoeslag: hu, kinderopvang: ko, total: z.amount + k.amount + hu.amount + ko.amount };
}

/**
 * The toeslagen without the drops at once, for "of the next €100": zorgtoeslag stays at its last amount
 * above its income limit, and kinderopvangtoeslag is left out, because it only goes down in steps.
 * The difference over an income range is what the toeslagen take step by step; the drops are in toeslagCliffs.
 */
export function gradualToeslagen(h: ToeslagHousehold, rules: TaxRules): number {
  const limit = rules.toeslagen.zorgtoeslag.maxIncome[who(h)];
  const zorg = zorgtoeslag({ ...h, income: Math.min(h.income, limit) }, rules).amount;
  return zorg + kindgebondenBudget(h, rules).amount + huurtoeslag(h, rules).amount;
}

/**
 * Incomes where a toeslag that goes down step by step reaches zero: kindgebonden budget, huurtoeslag, and the
 * zorgtoeslag formula. Below them, the next euro of income costs toeslag; above them, it no longer does.
 * The household's own income in `h` does not matter.
 */
export function toeslagRunOut(h: ToeslagHousehold, rules: TaxRules): number[] {
  const t = rules.toeslagen;
  const at = { ...h, income: 0 };
  const points: number[] = [];
  const k = kindgebondenBudget(at, rules);
  if (k.maximum > 0) points.push(t.kindgebondenBudget.threshold[who(h)] + k.maximum / t.kindgebondenBudget.phaseOutRate);
  const hu = huurtoeslag(at, rules);
  const perMonth = hu.bands.toKwaliteitskorting + hu.bands.toAftopping + hu.bands.aboveAftopping;
  if (perMonth > 0) {
    const size = (h.partner ? 2 : 1) + h.children.length === 1 ? "one" : "more";
    points.push(t.huurtoeslag.incomePoint[size] + (12 * perMonth) / t.huurtoeslag.phaseOutRate[size]);
  }
  const z = zorgtoeslag(at, rules);
  const z0 = z.standaardpremie - t.zorgtoeslag.normpremieBase[who(h)] * t.zorgtoeslag.drempelinkomen;
  if (z0 > 0) points.push(t.zorgtoeslag.drempelinkomen + z0 / t.zorgtoeslag.normpremieRate);
  return points;
}

export interface ToeslagCliff {
  /** The first toetsingsinkomen where the toeslag is lower at once. */
  at: number;
  toeslag: "zorgtoeslag" | "kinderopvang";
  /** How much less that toeslag is per year, from one euro to the next. */
  loss: number;
}

/**
 * Every income where a toeslag drops at once instead of step by step: the zorgtoeslag limit, and each row
 * of the kinderopvangtoeslag table. Only drops of at least one euro a year count. In order of income.
 */
export function toeslagCliffs(h: ToeslagHousehold, rules: TaxRules): ToeslagCliff[] {
  const at = (income: number) => ({ ...h, income });
  const drop = (limit: number, toeslag: ToeslagCliff["toeslag"]): ToeslagCliff => {
    const amount = toeslag === "zorgtoeslag" ? (x: number) => zorgtoeslag(at(x), rules).amount : (x: number) => kinderopvangtoeslag(at(x), rules).amount;
    return { at: limit + 1, toeslag, loss: amount(limit) - amount(limit + 1) };
  };
  return [
    drop(rules.toeslagen.zorgtoeslag.maxIncome[who(h)], "zorgtoeslag"),
    ...rules.toeslagen.kinderopvang.table.filter((b) => Number.isFinite(b.upTo)).map((b) => drop(b.upTo, "kinderopvang")),
  ]
    .filter((c) => c.loss >= 1)
    .sort((a, b) => a.at - b.at);
}

/** The nearest cliff ahead of the household's income, within `within` euros a year. */
export function nextToeslagCliff(h: ToeslagHousehold, rules: TaxRules, within = 5_000): ToeslagCliff | null {
  // Still at or below the limit (income can have cents), and the drop is within reach.
  return toeslagCliffs(h, rules).find((c) => c.at - 1 >= h.income && c.at <= h.income + within) ?? null;
}
