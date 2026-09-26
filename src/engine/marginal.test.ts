import { describe, expect, it } from "vitest";
import { getRules } from "../rules";
import type { SideIncome } from "./business";
import { curveCliffs, keptOfNext, keptOfNextSalary, nextHundredAcross, nextHundredCurve, nextSalaryInHousehold, taxZones, zoneAt } from "./marginal";
import { NO_PENSION, incomeTax, type Job } from "./person";

const rules = getRules(2026);

// The zone table from CLAUDE.md (tax on the next euro, income tax only).
const EXPECTED_ZONES = [
  { from: 0, upTo: 11_400, rate: 0 },
  { from: 11_400, upTo: 11_965, rate: 0.27 },
  { from: 11_965, upTo: 25_845, rate: 0.05 },
  { from: 25_845, upTo: 29_736, rate: 0.34 },
  { from: 29_736, upTo: 38_883, rate: 0.4 },
  { from: 38_883, upTo: 45_592, rate: 0.42 },
  { from: 45_592, upTo: 78_426, rate: 0.5 },
  { from: 78_426, upTo: 132_920, rate: 0.56 },
  { from: 132_920, upTo: Infinity, rate: 0.495 },
];

describe("keptOfNext", () => {
  it("keeps 59.80 of the next 100 at 36,000", () => {
    expect(keptOfNext(36_000, rules)).toBeCloseTo(59.8, 2);
  });

  it("keeps all of it while the credits still cover all tax", () => {
    expect(keptOfNext(5_000, rules)).toBeCloseTo(100, 6);
  });

  it("keeps less per euro at 60,000 than at 20,000, but always something", () => {
    expect(keptOfNext(20_000, rules)).toBeCloseTo(95.26, 2);
    expect(keptOfNext(60_000, rules)).toBeCloseTo(49.53, 2);
  });
});

describe("keptOfNextSalary", () => {
  const job: Job = { monthlyGross: 3_000, holidayPayRate: 0, yearEndBonusRate: 0, pension: NO_PENSION };

  it("equals keptOfNext for salary only", () => {
    expect(keptOfNextSalary([job], null, rules)).toBeCloseTo(keptOfNext(36_000, rules), 6);
  });

  it("counts the effect of side income on the credits", () => {
    const side: SideIncome = { revenue: 12_000, costs: 2_000, kind: "business", meetsHoursCriterion: false, starter: false };
    // Salary 36,000 plus side profit 10,000: work income 46,000 is past the labour credit peak,
    // so the next salary euro also shrinks the labour credit.
    const kept = keptOfNextSalary([job], side, rules);
    expect(kept).toBeCloseTo(100 - 37.56 - 6.398 - 6.51, 2);
  });
});

describe("taxZones", () => {
  const zones = taxZones(rules);

  it("covers every income from 0 upward without gaps", () => {
    expect(zones[0]?.from).toBe(0);
    zones.slice(1).forEach((zone, i) => expect(zone.from).toBe(zones[i]?.upTo));
    expect(zones.at(-1)?.upTo).toBe(Infinity);
  });

  it("matches the rate of each zone in the CLAUDE.md table (within 1 percentage point)", () => {
    for (const expected of EXPECTED_ZONES) {
      const middle = expected.upTo === Infinity ? expected.from + 10_000 : (expected.from + expected.upTo) / 2;
      expect(Math.abs(zoneAt(zones, middle).rate - expected.rate), `zone around ${middle}`).toBeLessThan(0.01);
    }
  });

  it("starts a new zone at each boundary in the table", () => {
    const starts = zones.map((z) => z.from);
    for (const { from } of EXPECTED_ZONES) {
      const tolerance = from === 11_400 ? 100 : 1; // the table says "about 11,400"
      const closest = Math.min(...starts.map((s) => Math.abs(s - from)));
      expect(closest, `boundary at ${from}`).toBeLessThan(tolerance);
    }
  });

  it("ends the zero zone exactly where the credits stop covering all tax", () => {
    const end = zones[0]?.upTo ?? NaN;
    expect(zones[0]?.rate).toBe(0);
    expect(incomeTax(end - 0.01, rules).tax).toBe(0);
    expect(incomeTax(end + 1, rules).tax).toBeGreaterThan(0);
  });

  it("agrees with keptOfNext inside each zone", () => {
    for (const zone of zones.filter((z) => z.upTo - z.from > 200)) {
      const inside = zone.from + 50;
      expect(keptOfNext(inside, rules)).toBeCloseTo(100 * (1 - zone.rate), 6);
    }
  });

  it("never takes 100% or more of the next euro (income tax alone)", () => {
    for (const zone of zones) expect(zone.rate).toBeLessThan(1);
  });
});

describe("nextSalaryInHousehold", () => {
  const noHome = { vermogen: 0, children: [], rent: null, allYoung: false };
  const job = (yearly: number): Job => ({ monthlyGross: yearly / 12, holidayPayRate: 0, yearEndBonusRate: 0, pension: NO_PENSION });

  it("alone at 36,000: of the next 100, income tax takes 40.20 and zorgtoeslag 13.73, so 46.07 is kept", () => {
    const next = nextSalaryInHousehold([{ jobs: [job(36_000)] }], noHome, 0, rules);
    expect(next.taxAndZvw).toBeCloseTo(40.2, 2);
    expect(next.lostToeslagen).toBeCloseTo(13.73, 2);
    expect(next.kept).toBeCloseTo(46.07, 2);
  });

  it("alone at 38,880: the next 100 mostly falls above the 38,883 bracket boundary, so 44.32 is kept", () => {
    const next = nextSalaryInHousehold([{ jobs: [job(38_880)] }], noHome, 0, rules);
    expect(next.taxAndZvw).toBeCloseTo(41.95, 2);
    expect(next.lostToeslagen).toBeCloseTo(13.73, 2);
    expect(next.kept).toBeCloseTo(44.32, 2);
  });

  it("shows the armoedeval: across a kinderopvangtoeslag step, 100 more salary leaves the household with less", () => {
    const care = { kind: "dagopvang" as const, hoursPerMonth: 230, pricePerHour: 11.23 };
    const home = { ...noHome, children: [{ age: 1, care }, { age: 3, care }] };
    const next = nextSalaryInHousehold([{ jobs: [job(58_150)] }, { jobs: [] }], home, 0, rules);
    expect(next.lostToeslagen).toBeGreaterThan(216.96);
    expect(next.kept).toBeLessThan(0);
  });

  it("gives the same as keptOfNextSalary when there are no toeslagen", () => {
    const next = nextSalaryInHousehold([{ jobs: [job(90_000)] }], noHome, 0, rules);
    expect(next.lostToeslagen).toBe(0);
    expect(next.kept).toBeCloseTo(keptOfNextSalary([job(90_000)], null, rules), 6);
  });
});

describe("nextHundredCurve", () => {
  const noHome = { vermogen: 0, children: [], rent: null, allYoung: false };
  const monthly = (gross: number): Job => ({ monthlyGross: gross, holidayPayRate: 0, yearEndBonusRate: 0, pension: NO_PENSION });

  it("at 3,000 a month (36,000): keep 46.07, income tax 40.20, zorgtoeslag 13.73", () => {
    const [point] = nextHundredCurve([{ jobs: [monthly(0)] }], noHome, 0, [3_000], rules);
    expect(point?.income).toBeCloseTo(36_000, 6);
    expect(point?.kept).toBeCloseTo(46.07, 2);
    expect(point?.tax).toBeCloseTo(40.2, 2);
    expect(point?.lostToeslagen).toBeCloseTo(13.73, 2);
  });

  it("at 7,500 a month (90,000): 49.50% bracket plus 6.51% less arbeidskorting, so 43.99 kept, no toeslagen", () => {
    const [point] = nextHundredCurve([{ jobs: [monthly(0)] }], noHome, 0, [7_500], rules);
    expect(point?.kept).toBeCloseTo(43.99, 2);
    expect(point?.lostToeslagen).toBeCloseTo(0, 6);
  });

  it("always splits the 100 into kept, tax and toeslagen, and total netto never goes down", () => {
    const xs = Array.from({ length: 121 }, (_, i) => i * 50);
    const curve = nextHundredCurve([{ jobs: [monthly(0)] }], noHome, 0, xs, rules);
    for (const point of curve) expect(point.kept + point.tax + point.lostToeslagen).toBeCloseTo(100, 6);
    curve.slice(1).forEach((point, i) => expect(point.income).toBeGreaterThan(curve[i]?.income ?? Infinity));
  });

  it("measures over the real next €100, like the person card: €44.32 at €38,880, where the bracket changes at €38,883", () => {
    const people = [{ jobs: [{ ...monthly(3_000), holidayPayRate: 0.08 }] }];
    const [point] = nextHundredCurve(people, noHome, 0, [3_000], rules);
    expect(point?.income).toBeCloseTo(38_880, 6);
    expect(point?.kept).toBeCloseTo(nextSalaryInHousehold(people, noHome, 0, rules).kept, 6);
    expect(point?.kept).toBeCloseTo(44.32, 2);
  });

  it("leaves out a drop at once: across the zorgtoeslag limit only the 13.73% up to it counts", () => {
    // 40,800 a year: 57 euros to the limit of 40,857, where the last 23.53 a year stops at once.
    const [point] = nextHundredCurve([{ jobs: [monthly(3_400)] }], noHome, 0, [3_400], rules);
    expect(point?.lostToeslagen).toBeCloseTo(0.1373 * 57, 6);
    const real = nextSalaryInHousehold([{ jobs: [monthly(3_400)] }], noHome, 0, rules);
    expect(real.lostToeslagen - (point?.lostToeslagen ?? 0)).toBeCloseTo(23.53, 2);
  });

  it("counts the own home: at the current salary it gives the same as the person card", () => {
    const home = { ...noHome, owner: { woz: 400_000, interest: 12_000 } };
    const people = [{ jobs: [{ ...monthly(4_000), holidayPayRate: 0.08 }] }, { jobs: [monthly(1_000)] }];
    const [point] = nextHundredCurve(people, home, 0, [4_000], rules);
    expect(point?.income).toBeCloseTo(51_840 + 12_000 - 10_600, 6);
    expect(point?.kept).toBeCloseTo(nextSalaryInHousehold(people, home, 0, rules).kept, 6);
  });

  it("keeps the other partner's salary where it is", () => {
    const people = [{ jobs: [monthly(0)] }, { jobs: [monthly(2_000)] }];
    const [point] = nextHundredCurve(people, noHome, 0, [1_000], rules);
    expect(point?.income).toBeCloseTo(12 * 1_000 + 12 * 2_000, 6);
  });

  it("spreads each kinderopvangtoeslag step over its row: 216.96 over 56,413 to 58,184 is 12.24 of every 100", () => {
    const care = { kind: "dagopvang" as const, hoursPerMonth: 230, pricePerHour: 11.23 };
    const home = { vermogen: 0, children: [{ age: 1, care }, { age: 3, care }], rent: null, allYoung: false };
    const people = [{ jobs: [monthly(0)] }, { jobs: [monthly(0)] }];
    const [point] = nextHundredCurve(people, home, 0, [4_750], rules);
    expect(point?.income).toBeCloseTo(57_000, 6);
    expect(point?.fromSteps).toBeCloseTo((216.96 / 1_772) * 100, 2);
    // Kindgebonden budget still goes down by 7.60%; zorgtoeslag stopped at 51,142.
    expect(point?.lostToeslagen).toBeCloseTo(7.6 + (216.96 / 1_772) * 100, 2);
    expect((point?.kept ?? 0) + (point?.tax ?? 0) + (point?.lostToeslagen ?? 0)).toBeCloseTo(100, 6);
  });

  it("adds nothing for steps without childcare, or in a row where the next row has the same share", () => {
    expect(nextHundredCurve([{ jobs: [monthly(0)] }], noHome, 0, [4_750], rules)[0]?.fromSteps).toBe(0);
    const care = { kind: "dagopvang" as const, hoursPerMonth: 100, pricePerHour: 11.23 };
    const home = { ...noHome, children: [{ age: 1, care }] };
    expect(nextHundredCurve([{ jobs: [monthly(0)] }], home, 0, [3_000], rules)[0]?.fromSteps).toBe(0);
  });
});

describe("nextHundredAcross", () => {
  const noHome = { vermogen: 0, children: [], rent: null, allYoung: false };
  const monthly = (gross: number): Job => ({ monthlyGross: gross, holidayPayRate: 0, yearEndBonusRate: 0, pension: NO_PENSION });

  it("never skips a narrow zone: €11,400 to €11,965, where you keep about €73, is there even with a coarse grid", () => {
    // 40 steps of €150 a month (€1,800 a year) could step right over a zone of €565 a year.
    const curve = nextHundredAcross([{ jobs: [monthly(0)] }], noHome, 0, 6_000, 40, rules);
    expect(curve.some((pt) => pt.income > 11_400 && pt.income < 11_965 && Math.abs(pt.kept - 73) < 1)).toBe(true);
    curve.slice(1).forEach((pt, i) => expect(pt.monthlyGross).toBeGreaterThan(curve[i]?.monthlyGross ?? Infinity));
    expect(curve[0]?.monthlyGross).toBe(0);
    expect(curve.at(-1)?.monthlyGross).toBe(6_000);
  });

  it("finds the zones of the person whose salary moves, with the partner's income on top for toeslagen", () => {
    const people = [{ jobs: [monthly(2_000)] }, { jobs: [monthly(0)] }];
    const curve = nextHundredAcross(people, noHome, 1, 6_000, 40, rules);
    expect(curve.some((pt) => pt.taxable > 11_400 && pt.taxable < 11_965 && Math.abs(pt.kept + pt.lostToeslagen - 73) < 1)).toBe(true);
    // Zorgtoeslag for a couple starts to go down at a household income of 29,736: 5,736 of the partner's own.
    const start = curve.find((pt) => pt.lostToeslagen > 1);
    expect(start?.income).toBeGreaterThan(29_736 - 100);
    expect(start?.income).toBeLessThan(29_736 + 50);
  });
});

describe("curveCliffs", () => {
  it("puts each toeslag cliff at the salary where the household income reaches it", () => {
    const care = { kind: "dagopvang" as const, hoursPerMonth: 230, pricePerHour: 11.23 };
    const home = { vermogen: 0, children: [{ age: 1, care }, { age: 3, care }], rent: null, allYoung: false };
    const monthly = (gross: number): Job => ({ monthlyGross: gross, holidayPayRate: 0, yearEndBonusRate: 0, pension: NO_PENSION });
    const people = [{ jobs: [monthly(0)] }, { jobs: [monthly(0)] }];
    const xs = Array.from({ length: 241 }, (_, i) => i * 25);
    const cliffs = curveCliffs(nextHundredCurve(people, home, 0, xs, rules), home, true, rules);
    const zorg = cliffs.find((c) => c.toeslag === "zorgtoeslag");
    expect(zorg?.monthlyGross).toBeCloseTo(51_143 / 12, 6);
    const step = cliffs.find((c) => c.income === 58_185);
    expect(step?.monthlyGross).toBeCloseTo(58_185 / 12, 6);
    expect(step?.loss).toBeCloseTo(216.96, 2);
    expect(cliffs.every((c) => c.monthlyGross <= 6_000)).toBe(true);
  });
});
