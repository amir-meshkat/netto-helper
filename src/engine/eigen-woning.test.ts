import { describe, expect, it } from "vitest";
import { getRules } from "../rules";
import { eigenWoning, eigenwoningforfait } from "./eigen-woning";

const rules = getRules(2026);

describe("eigenwoningforfait", () => {
  it("is 0.35% of the WOZ value for almost every home: 1,400 at 400,000", () => {
    expect(eigenwoningforfait(400_000, rules)).toBeCloseTo(1_400, 6);
    expect(eigenwoningforfait(75_001, rules)).toBeCloseTo(0.0035 * 75_001, 6);
    expect(eigenwoningforfait(1_350_000, rules)).toBeCloseTo(4_725, 6);
  });

  it("uses the percentage of the band for the whole value below 75,000", () => {
    expect(eigenwoningforfait(12_500, rules)).toBe(0);
    expect(eigenwoningforfait(20_000, rules)).toBeCloseTo(20, 6);
    expect(eigenwoningforfait(50_000, rules)).toBeCloseTo(100, 6);
    expect(eigenwoningforfait(60_000, rules)).toBeCloseTo(150, 6);
  });

  it("adds 2.35% of the value above the villagrens of 1,350,000: 8,250 at 1,500,000", () => {
    expect(eigenwoningforfait(1_500_000, rules)).toBeCloseTo(8_250, 6);
  });
});

describe("eigenWoning", () => {
  it("worked example: forfait 1,400 minus interest 12,000 gives a saldo of -10,600", () => {
    const w = eigenWoning({ woz: 400_000, interest: 12_000 }, rules);
    expect(w.forfait).toBeCloseTo(1_400, 6);
    expect(w.hillen).toBe(0);
    expect(w.saldo).toBeCloseTo(-10_600, 6);
  });

  it("Wet Hillen: without a mortgage only 28.133% of the forfait is taxed, 393.86 at 400,000", () => {
    const w = eigenWoning({ woz: 400_000, interest: 0 }, rules);
    expect(w.hillen).toBeCloseTo(1_006.14, 2);
    expect(w.saldo).toBeCloseTo(393.86, 2);
  });

  it("Wet Hillen on a small mortgage: only the difference between forfait and interest counts", () => {
    expect(eigenWoning({ woz: 400_000, interest: 1_000 }, rules).saldo).toBeCloseTo(400 * (1 - 0.71867), 6);
  });
});

describe("eigenWoning with other deductible costs", () => {
  it("takes erfpacht and the costs of the mortgage off like interest: saldo -11,800 with 1,200 erfpacht", () => {
    const w = eigenWoning({ woz: 400_000, interest: 12_000, costs: 1_200 }, rules);
    expect(w.costs).toBe(1_200);
    expect(w.saldo).toBeCloseTo(-11_800, 6);
  });

  it("counts the costs for the Wet Hillen too: only the forfait above interest and costs is taxed in part", () => {
    expect(eigenWoning({ woz: 400_000, interest: 0, costs: 300 }, rules).saldo).toBeCloseTo(1_100 * (1 - 0.71867), 6);
  });
});
