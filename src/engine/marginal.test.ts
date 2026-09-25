import { describe, expect, it } from "vitest";
import { getRules } from "../rules";
import type { SideIncome } from "./business";
import { keptOfNext, keptOfNextSalary, taxZones, zoneAt } from "./marginal";
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
