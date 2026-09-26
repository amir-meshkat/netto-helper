import type { TaxRules } from "../rules";
import type { SideIncome } from "./business";
import { homeEigenWoning, householdNetto, householdTotal, toeslagHousehold, type Home, type PersonIncome } from "./household";
import { gradualToeslagen, kinderopvangBand, kinderopvangtoeslag, toeslagCliffs, type ToeslagCliff, type ToeslagHousehold } from "./toeslagen";
import { NO_PENSION, incomeTax, personNetto, type Job } from "./person";

export interface TaxZone {
  from: number;
  upTo: number;
  /** Tax on the next euro inside this zone: 0.4 means 40 cents of every extra euro. */
  rate: number;
}

/** Of the next `amount` euros of taxable income, the part you keep after income tax. */
export function keptOfNext(taxableIncome: number, rules: TaxRules, amount = 100): number {
  const tax = (income: number) => incomeTax(income, rules).tax;
  return amount - (tax(taxableIncome + amount) - tax(taxableIncome));
}

/**
 * Of the next `amount` euros of salary, the part a person keeps. Unlike keptOfNext, this also
 * counts side income (its profit changes the credits and the room left for the Zvw contribution)
 * and the person's share of the eigen woning saldo.
 */
export function keptOfNextSalary(jobs: Job[], side: SideIncome | null, rules: TaxRules, amount = 100, woning = 0): number {
  const extra: Job = { monthlyGross: amount / 12, holidayPayRate: 0, yearEndBonusRate: 0, pension: NO_PENSION };
  return personNetto([...jobs, extra], rules, side, woning).netto - personNetto(jobs, rules, side, woning).netto;
}

export interface NextSalary {
  /** What the household keeps of it. Can be below zero where a toeslag drops at once (the armoedeval). */
  kept: number;
  taxAndZvw: number;
  lostToeslagen: number;
}

/**
 * Of the next `amount` euros of salary for person `p`: what the household keeps, what goes to income tax
 * and Zvw, and how much less toeslag the household gets. Toeslagen look at the combined income, so this
 * is a household question even though one person earns it.
 */
export function nextSalaryInHousehold(people: PersonIncome[], home: Home, p: number, rules: TaxRules, amount = 100): NextSalary {
  const extra = extraJob(amount);
  const before = householdTotal(people, home, rules);
  const after = householdTotal(
    people.map((person, i) => (i === p ? { ...person, jobs: [...person.jobs, extra] } : person)),
    home,
    rules,
  );
  const kept = after.total - before.total;
  const lostToeslagen = before.toeslagen.total - after.toeslagen.total;
  return { kept, taxAndZvw: amount - kept - lostToeslagen, lostToeslagen };
}

export interface NextHundredPoint {
  /** Person p's gross salary per month at this point. */
  monthlyGross: number;
  /** Person p's own taxable income per year. */
  taxable: number;
  /** The household's toetsingsinkomen and total (netto plus toeslagen, minus childcare) per year. */
  income: number;
  total: number;
  /** Of the next €100 of salary at this point: kept, income tax and Zvw, lower toeslagen. They add up to 100. */
  kept: number;
  tax: number;
  lostToeslagen: number;
  /**
   * The part of lostToeslagen that comes from the steps of kinderopvangtoeslag. Its table drops a little
   * at the end of every row of about €1,700, so the step at the end of this row is spread over the row:
   * that is what the next €100 costs on average. The steps themselves are in curveCliffs.
   */
  fromSteps: number;
}

/** A job that adds `amount` euros a year of salary, and nothing else. */
const extraJob = (amount: number): Job => ({ monthlyGross: amount / 12, holidayPayRate: 0, yearEndBonusRate: 0, pension: NO_PENSION });

/** Person p's first job at a different monthly salary, keeping its holiday pay, bonus and pension. */
function withSalary(person: PersonIncome, monthlyGross: number): PersonIncome {
  const [main, ...rest] = person.jobs;
  const job: Job = main ? { ...main, monthlyGross } : { ...extraJob(0), monthlyGross };
  return { ...person, jobs: [job, ...rest] };
}

/** Of every €100 of household income inside this row of the kinderopvangtoeslag table, what its closing step costs on average. */
function stepsPerHundred(h: ToeslagHousehold, rules: TaxRules): number {
  const band = kinderopvangBand(h.income, rules);
  if (!Number.isFinite(band.upTo)) return 0;
  const amount = (income: number) => kinderopvangtoeslag({ ...h, income }, rules).amount;
  return ((amount(band.upTo) - amount(band.upTo + 1)) / (band.upTo + 1 - band.from)) * 100;
}

/**
 * "Of the next €100" along person p's salary, everything else as it is: the other partner's salary,
 * side income, children, rent. For the "Is working more worth it?" chart. Measured over the real next
 * €100, like nextSalaryInHousehold, but without the drops at once (see gradualToeslagen): those are single
 * points, in curveCliffs. The steps of kinderopvangtoeslag are in it on average (see fromSteps).
 */
export function nextHundredCurve(people: PersonIncome[], home: Home, p: number, monthlyGross: number[], rules: TaxRules): NextHundredPoint[] {
  const amount = 100;
  const saldo = homeEigenWoning(home, rules)?.saldo ?? 0;
  return monthlyGross.map((x) => {
    const at = people.map((person, i) => (i === p ? withSalary(person, x) : person));
    const more = at.map((person, i) => (i === p ? { ...person, jobs: [...person.jobs, extraJob(amount)] } : person));
    const here = householdTotal(at, home, rules);
    const work = householdNetto(more, rules, saldo);
    const now = toeslagHousehold(here.work, home);
    const tax = amount - (work.netto - here.work.netto);
    const fromSteps = stepsPerHundred(now, rules);
    const lostToeslagen = gradualToeslagen(now, rules) - gradualToeslagen(toeslagHousehold(work, home), rules) + fromSteps;
    return {
      monthlyGross: x,
      taxable: here.work.people[p]?.taxable ?? 0,
      income: here.toetsingsinkomen,
      total: here.total,
      kept: amount - tax - lostToeslagen,
      tax,
      lostToeslagen,
      fromSteps,
    };
  });
}

/**
 * nextHundredCurve for salaries from 0 to xMax: an even grid of `samples` steps, plus both sides of every
 * place where a rate changes, so a narrow zone never falls between two points. Those places are the tax
 * zones of person p (on their own income) and where zorgtoeslag, kindgebonden budget and huurtoeslag start
 * or stop going down (on the household income).
 */
export function nextHundredAcross(people: PersonIncome[], home: Home, p: number, xMax: number, samples: number, rules: TaxRules): NextHundredPoint[] {
  const grid = Array.from({ length: samples + 1 }, (_, k) => (k / samples) * xMax);
  const coarse = nextHundredCurve(people, home, p, grid, rules);

  // The salary where an income is reached. Income grows with salary, in straight lines between kinks such as a pension franchise.
  const salaryAt = (value: number, of: (pt: NextHundredPoint) => number): number[] => {
    for (let i = 1; i < coarse.length; i++) {
      const a = coarse[i - 1];
      const b = coarse[i];
      if (a && b && of(a) < value && value < of(b)) return [a.monthlyGross + ((value - of(a)) / (of(b) - of(a))) * (b.monthlyGross - a.monthlyGross)];
    }
    return [];
  };
  // "The next €100" at income x covers x to x + 100, so a change at b shows from b - 100 to b: look just outside that.
  const around = (b: number, of: (pt: NextHundredPoint) => number) => [...salaryAt(b - 101, of), ...salaryAt(b + 1, of)];
  const z = rules.toeslagen;
  const who = people.length > 1 ? "partner" : "alone";
  const own = taxZones(rules).map((zone) => zone.from);
  const household = [
    z.zorgtoeslag.drempelinkomen,
    z.zorgtoeslag.maxIncome[who],
    z.kindgebondenBudget.threshold[who],
    z.huurtoeslag.incomePoint.one,
    z.huurtoeslag.incomePoint.more,
  ];
  const extra = [...own.flatMap((b) => around(b, (pt) => pt.taxable)), ...household.flatMap((b) => around(b, (pt) => pt.income))];

  return [...coarse, ...nextHundredCurve(people, home, p, extra, rules)]
    .sort((a, b) => a.monthlyGross - b.monthlyGross)
    .filter((pt, i, all) => i === 0 || pt.monthlyGross - (all[i - 1]?.monthlyGross ?? 0) > 1e-6);
}

export interface CurveCliff {
  /** Person p's salary per month where the household income reaches the cliff. */
  monthlyGross: number;
  /** The household toetsingsinkomen where the toeslag is lower at once. */
  income: number;
  toeslag: ToeslagCliff["toeslag"];
  /** How much less toeslag per year, at once. */
  loss: number;
}

/** The toeslag cliffs that fall inside the curve, placed on person p's salary. */
export function curveCliffs(curve: NextHundredPoint[], home: Home, partner: boolean, rules: TaxRules): CurveCliff[] {
  return toeslagCliffs({ income: 0, partner, ...home }, rules).flatMap((cliff) => {
    for (let i = 1; i < curve.length; i++) {
      const a = curve[i - 1];
      const b = curve[i];
      if (a && b && a.income < cliff.at && cliff.at <= b.income) {
        const f = (cliff.at - a.income) / (b.income - a.income);
        return [{ monthlyGross: a.monthlyGross + f * (b.monthlyGross - a.monthlyGross), income: cliff.at, toeslag: cliff.toeslag, loss: cliff.loss }];
      }
    }
    return [];
  });
}

/**
 * Income ranges where the tax on the next euro stays the same, computed from the rules.
 * The rate only changes at a bracket boundary, a credit threshold, a credit reaching zero,
 * or the income where the credits stop covering all tax.
 */
export function taxZones(rules: TaxRules): TaxZone[] {
  const tax = (income: number) => incomeTax(income, rules).tax;

  const points = new Set<number>([0, firstTaxedIncome(tax)]);
  for (const bracket of rules.box1Brackets) points.add(bracket.upTo);
  const general = rules.generalCredit;
  points.add(general.phaseOutStart);
  points.add(general.phaseOutStart + general.max / general.phaseOutRate);
  for (const segment of rules.labourCredit) {
    points.add(segment.from);
    if (segment.rate < 0) points.add(segment.from - segment.base / segment.rate);
  }

  const bounds = [...points].filter(Number.isFinite).sort((a, b) => a - b);
  const zones: TaxZone[] = [];
  bounds.forEach((from, i) => {
    const upTo = bounds[i + 1] ?? Infinity;
    const rate = rateBetween(tax, from, upTo);
    const previous = zones.at(-1);
    if (previous && Math.abs(previous.rate - rate) < 1e-9) previous.upTo = upTo;
    else zones.push({ from, upTo, rate });
  });
  return zones;
}

/** The zone that contains this income. */
export function zoneAt(zones: TaxZone[], income: number): TaxZone {
  const zone = zones.find((z) => income < z.upTo) ?? zones.at(-1);
  if (!zone) throw new Error("zoneAt needs at least one zone");
  return zone;
}

/** Tax on the next euro between two points, measured away from the edges, where the labour credit table jumps a few cents. */
function rateBetween(tax: (income: number) => number, from: number, upTo: number): number {
  const width = upTo === Infinity ? 1_000 : upTo - from;
  const low = from + width / 4;
  const high = from + (width * 3) / 4;
  return (tax(high) - tax(low)) / (high - low);
}

/** Lowest income with tax above zero. Tax never goes down as income goes up, so halving the search range works. */
function firstTaxedIncome(tax: (income: number) => number): number {
  let low = 0;
  let high = 1_000;
  while (tax(high) === 0) {
    if (high > 10_000_000) return Infinity;
    low = high;
    high *= 2;
  }
  for (let step = 0; step < 60; step++) {
    const middle = (low + high) / 2;
    if (tax(middle) > 0) high = middle;
    else low = middle;
  }
  return high;
}
