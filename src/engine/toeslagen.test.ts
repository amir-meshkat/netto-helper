import { describe, expect, it } from "vitest";
import { getRules } from "../rules";
import {
  gradualToeslagen,
  huurtoeslag,
  kindgebondenBudget,
  kinderopvangShares,
  kinderopvangtoeslag,
  nextToeslagCliff,
  toeslagCliffs,
  toeslagen,
  zorgtoeslag,
  type Child,
  type ToeslagHousehold,
} from "./toeslagen";

const rules = getRules(2026);

/** A household with nothing but an income: add what a test needs. */
const household = (income: number, extra: Partial<ToeslagHousehold> = {}): ToeslagHousehold => ({
  income,
  partner: false,
  vermogen: 0,
  children: [],
  rent: null,
  allYoung: false,
  ...extra,
});
const child = (age: number, care: Child["care"] = null): Child => ({ age, care });

describe("zorgtoeslag", () => {
  it("gives the Toeslagenkaart's maximum at a low income: 1,550 alone and 2,963 with a toeslagpartner", () => {
    expect(zorgtoeslag(household(10_000), rules).amount).toBeCloseTo(1_550.45, 2);
    expect(zorgtoeslag(household(10_000, { partner: true }), rules).amount).toBeCloseTo(2_962.62, 2);
  });

  it("CLAUDE.md example: alone at 38,880 gives 294.98 a year", () => {
    const z = zorgtoeslag(household(38_880), rules);
    expect(z.normpremie).toBeCloseTo(1_824.02, 2);
    expect(z.amount).toBeCloseTo(294.98, 2);
  });

  it("CLAUDE.md example: a couple where one earns 38,880 gives 1,707.15 a year", () => {
    expect(zorgtoeslag(household(38_880, { partner: true }), rules).amount).toBeCloseTo(1_707.15, 2);
  });

  it("stops at once above the maximum income, with about 24 a year still left just below it", () => {
    expect(zorgtoeslag(household(40_857), rules).amount).toBeCloseTo(23.53, 2);
    const above = zorgtoeslag(household(40_858), rules);
    expect(above.amount).toBe(0);
    expect(above.stopped).toBe("income");
    expect(zorgtoeslag(household(51_143, { partner: true }), rules).amount).toBe(0);
  });

  it("gives nothing above the maximum vermogen", () => {
    const z = zorgtoeslag(household(20_000, { vermogen: 146_012 }), rules);
    expect(z.amount).toBe(0);
    expect(z.stopped).toBe("vermogen");
    expect(zorgtoeslag(household(20_000, { vermogen: 146_011 }), rules).amount).toBeGreaterThan(0);
  });
});

describe("kindgebonden budget", () => {
  it("gives the Toeslagenkaart's amounts for a single parent: 5,996 for one child, 8,576 for two", () => {
    expect(kindgebondenBudget(household(20_000, { children: [child(5)] }), rules).amount).toBe(5_996);
    expect(kindgebondenBudget(household(20_000, { children: [child(5), child(8)] }), rules).amount).toBe(8_576);
  });

  it("gives the Toeslagenkaart's amounts for a couple: 2,580 per child, also from the third child", () => {
    const couple = (children: Child[]) => household(39_141, { partner: true, children });
    expect(kindgebondenBudget(couple([child(3)]), rules).amount).toBe(2_580);
    expect(kindgebondenBudget(couple([child(3), child(6)]), rules).amount).toBe(5_160);
    expect(kindgebondenBudget(couple([child(3), child(6), child(9)]), rules).amount).toBe(7_740);
  });

  it("adds 724 for a child aged 12 to 15 and 964 for 16 or 17, and nothing from 18", () => {
    const couple = (age: number) => kindgebondenBudget(household(30_000, { partner: true, children: [child(age)] }), rules).amount;
    expect(couple(11)).toBe(2_580);
    expect(couple(12)).toBe(2_580 + 724);
    expect(couple(15)).toBe(2_580 + 724);
    expect(couple(16)).toBe(2_580 + 964);
    expect(couple(17)).toBe(2_580 + 964);
    expect(couple(18)).toBe(0);
  });

  it("goes down by 7.60% of the income above the threshold, to 0", () => {
    const k = kindgebondenBudget(household(49_141, { partner: true, children: [child(3), child(6)] }), rules);
    expect(k.maximum).toBe(5_160);
    expect(k.reduction).toBeCloseTo(760, 6);
    expect(k.amount).toBeCloseTo(4_400, 6);
    expect(kindgebondenBudget(household(200_000, { partner: true, children: [child(3)] }), rules).amount).toBe(0);
  });

  it("gives nothing without children, or above the maximum vermogen", () => {
    expect(kindgebondenBudget(household(20_000), rules).amount).toBe(0);
    expect(kindgebondenBudget(household(20_000, { children: [child(5)], vermogen: 146_012 }), rules).amount).toBe(0);
  });
});

describe("huurtoeslag", () => {
  it("alone, rent 800, income 30,000: 100%, 65% and 40% bands above the basishuur, less 27% above 23,425", () => {
    const h = huurtoeslag(household(30_000, { rent: 800 }), rules);
    expect(h.countedRent).toBe(800);
    expect(h.bands.toKwaliteitskorting).toBeCloseTo(295.68, 6);
    expect(h.bands.toAftopping).toBeCloseTo(214.82 * 0.65, 6);
    expect(h.bands.aboveAftopping).toBeCloseTo(86.98 * 0.4, 6);
    expect(h.reduction).toBeCloseTo(1_775.25, 6);
    expect(h.amount).toBeCloseTo(3_866.01, 2);
  });

  it("counts a rent above the rekengrens as 932.93", () => {
    const h = huurtoeslag(household(20_000, { rent: 1_200 }), rules);
    expect(h.countedRent).toBe(932.93);
    expect(h.amount).toBeCloseTo(6_279.32, 2);
  });

  it("counts rent up to 498.20 when everyone is 18, 19 or 20, but not with a child in the home", () => {
    expect(huurtoeslag(household(15_000, { rent: 700, allYoung: true }), rules).amount).toBeCloseTo(3_548.16, 2);
    const withChild = huurtoeslag(household(15_000, { rent: 700, allYoung: true, children: [child(1)] }), rules);
    expect(withChild.countedRent).toBe(700);
  });

  it("uses the figures for more people, and the higher aftoppingsgrens from 3 people", () => {
    const h = huurtoeslag(household(40_000, { partner: true, children: [child(4)], rent: 900 }), rules);
    expect(h.amount).toBeCloseTo(4_426.34, 2);
  });

  it("goes down to 0 as income rises, and gives nothing without rent or above the maximum vermogen", () => {
    expect(huurtoeslag(household(44_000, { rent: 800 }), rules).amount).toBeGreaterThan(0);
    expect(huurtoeslag(household(44_400, { rent: 800 }), rules).amount).toBe(0);
    expect(huurtoeslag(household(20_000), rules).amount).toBe(0);
    expect(huurtoeslag(household(20_000, { rent: 800, vermogen: 38_480 }), rules).amount).toBe(0);
    expect(huurtoeslag(household(20_000, { rent: 800, partner: true, vermogen: 76_958 }), rules).amount).toBeGreaterThan(0);
  });
});

describe("kinderopvangtoeslag", () => {
  it("uses the table row that holds the income: 96% up to 56,412, then 95.5% and 95.6%", () => {
    expect(kinderopvangShares(56_412, rules)).toEqual({ first: 0.96, next: 0.96 });
    expect(kinderopvangShares(56_413, rules)).toEqual({ first: 0.955, next: 0.956 });
    expect(kinderopvangShares(1_000_000, rules)).toEqual({ first: 0.365, next: 0.682 });
  });

  it("pays the share of the price per hour, for every month of the year", () => {
    const care = { kind: "dagopvang" as const, hoursPerMonth: 200, pricePerHour: 10 };
    expect(kinderopvangtoeslag(household(50_000, { children: [child(2, care)] }), rules).amount).toBeCloseTo(23_040, 6);
  });

  it("counts at most the maximum price per hour and 230 hours a month", () => {
    const care = { kind: "dagopvang" as const, hoursPerMonth: 250, pricePerHour: 12.5 };
    const k = kinderopvangtoeslag(household(50_000, { children: [child(2, care)] }), rules);
    expect(k.children[0]?.hourlyPrice).toBe(11.23);
    expect(k.children[0]?.hours).toBe(230);
    expect(k.amount).toBeCloseTo(29_755.008, 6);
    // The cost is what the parents pay the provider: every hour at its real price.
    expect(k.cost).toBeCloseTo(250 * 12.5 * 12, 6);
  });

  it("gives the child with the most hours the first-child share, the others the next-child share", () => {
    const children = [
      child(7, { kind: "bso", hoursPerMonth: 100, pricePerHour: 9.98 }),
      child(2, { kind: "dagopvang", hoursPerMonth: 150, pricePerHour: 11.23 }),
    ];
    const k = kinderopvangtoeslag(household(80_000, { partner: true, children }), rules);
    expect(k.children.map((c) => c.share)).toEqual([0.939, 0.859]);
    expect(k.amount).toBeCloseTo(28_609.29, 2);
  });

  it("gives nothing without childcare", () => {
    expect(kinderopvangtoeslag(household(30_000, { children: [child(2)] }), rules).amount).toBe(0);
  });
});

describe("toeslagen", () => {
  it("adds up the four", () => {
    const h = household(30_000, { rent: 800, children: [child(2, { kind: "dagopvang", hoursPerMonth: 100, pricePerHour: 10 })] });
    const t = toeslagen(h, rules);
    expect(t.total).toBeCloseTo(t.zorgtoeslag.amount + t.kindgebondenBudget.amount + t.huurtoeslag.amount + t.kinderopvang.amount, 6);
    expect(t.total).toBeGreaterThan(0);
  });
});

describe("nextToeslagCliff", () => {
  it("finds the zorgtoeslag limit ahead: about 24 a year stops at once", () => {
    const cliff = nextToeslagCliff(household(40_000), rules);
    expect(cliff?.at).toBe(40_858);
    expect(cliff?.toeslag).toBe("zorgtoeslag");
    expect(cliff?.loss).toBeCloseTo(23.53, 2);
  });

  it("finds a kinderopvangtoeslag step ahead: two children full time lose 216.96 at 58,185", () => {
    const care = { kind: "dagopvang" as const, hoursPerMonth: 230, pricePerHour: 11.23 };
    const h = household(58_000, { partner: true, children: [child(1, care), child(3, care)] });
    const cliff = nextToeslagCliff(h, rules);
    expect(cliff?.at).toBe(58_185);
    expect(cliff?.toeslag).toBe("kinderopvang");
    expect(cliff?.loss).toBeCloseTo(216.96, 2);
  });

  it("finds nothing when no toeslag stops or steps down within reach", () => {
    expect(nextToeslagCliff(household(100_000), rules)).toBeNull();
  });
});

describe("toeslagCliffs", () => {
  it("without childcare: only the zorgtoeslag limit, alone or with a toeslagpartner", () => {
    expect(toeslagCliffs(household(0), rules).map((c) => c.at)).toEqual([40_858]);
    expect(toeslagCliffs(household(0, { partner: true }), rules).map((c) => c.at)).toEqual([51_143]);
  });

  it("with full time childcare: every step of the table from 56,413 up, in order, each at least one euro", () => {
    const care = { kind: "dagopvang" as const, hoursPerMonth: 230, pricePerHour: 11.23 };
    const cliffs = toeslagCliffs(household(0, { partner: true, children: [child(1, care), child(3, care)] }), rules);
    const ats = cliffs.map((c) => c.at);
    expect(ats).toEqual([...ats].sort((a, b) => a - b));
    expect(cliffs.every((c) => c.loss >= 1)).toBe(true);
    expect(cliffs.find((c) => c.at === 58_185)?.loss).toBeCloseTo(216.96, 2);
    expect(ats[0]).toBe(51_143);
  });
});

describe("gradualToeslagen", () => {
  it("is the toeslagen without the drops at once: zorgtoeslag stays at its last amount above the limit", () => {
    expect(gradualToeslagen(household(40_857), rules)).toBeCloseTo(23.53, 2);
    expect(gradualToeslagen(household(45_000), rules)).toBeCloseTo(23.53, 2);
    expect(gradualToeslagen(household(30_000), rules)).toBeCloseTo(zorgtoeslag(household(30_000), rules).amount, 6);
  });

  it("adds kindgebonden budget and huurtoeslag, and leaves out kinderopvangtoeslag, which only goes down in steps", () => {
    const care = { kind: "dagopvang" as const, hoursPerMonth: 100, pricePerHour: 11.23 };
    const h = household(35_000, { rent: 800, children: [child(3, care)] });
    const t = toeslagen(h, rules);
    expect(gradualToeslagen(h, rules)).toBeCloseTo(t.zorgtoeslag.amount + t.kindgebondenBudget.amount + t.huurtoeslag.amount, 6);
  });

  it("gives nothing for zorgtoeslag above the maximum vermogen", () => {
    expect(gradualToeslagen(household(45_000, { vermogen: 200_000 }), rules)).toBe(0);
  });
});
