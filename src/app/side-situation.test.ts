import { describe, expect, it } from "vitest";
import { householdNetto } from "../engine/household";
import { sideIncomeValue } from "../engine/side-income";
import { getRules } from "../rules";
import { newJob, toEngineJob } from "../ui/job-input";
import { newSide, toEngineSide } from "../ui/side-input";
import { householdIfEarns, sideSituation } from "./side-situation";
import type { PersonInput } from "./state";

const rules = getRules(2026);
const person = (monthly: string, side: PersonInput["side"] = null, name = ""): PersonInput => ({
  name,
  job: newJob(monthly),
  side,
});

describe("sideSituation", () => {
  it("is null without side income, or while its revenue is still empty", () => {
    expect(sideSituation([person("3000")], rules)).toBeNull();
    expect(sideSituation([person("3000", newSide())], rules)).toBeNull();
    expect(sideSituation([person("3000", newSide("", "0")), person("2000")], rules)).toBeNull();
  });

  it("one person: matches the CLAUDE.md test case, set aside about 4,344 and keep about 5,656", () => {
    const sit = sideSituation([person("3000", newSide("12000", "2000"))], rules);
    expect(sit?.kind).toBe("one");
    if (sit?.kind !== "one") return;
    expect(sit.owner).toBe(0);
    expect(sit.values).toHaveLength(1);
    expect(sit.values[0]?.setAside).toBeCloseTo(4_344.12, 2);
    expect(sit.values[0]?.kept).toBeCloseTo(5_655.88, 2);
    expect(sit.better).toBeNull();
  });

  it("a couple with one side income: compares it for both, and finds who keeps more", () => {
    const people = [person("3800", newSide("12000", "2000")), person("2000")];
    const sit = sideSituation(people, rules);
    if (sit?.kind !== "one") throw new Error("expected one side income");
    expect(sit.owner).toBe(0);
    expect(sit.values).toHaveLength(2);
    const [you, partner] = sit.values.map((v) => v.kept / 12);
    expect(partner).toBeGreaterThan(you ?? Infinity);
    expect(sit.better).toBe(1);
    expect(sit.difference).toBeCloseTo((partner ?? 0) - (you ?? 0), 6);
  });

  it("finds the side income of the second person too", () => {
    const sit = sideSituation([person("3800"), person("2000", newSide("12000", "2000"))], rules);
    expect(sit?.kind === "one" && sit.owner).toBe(1);
  });

  it("says it hardly matters when both would keep about the same", () => {
    const sit = sideSituation([person("3000", newSide("12000", "2000")), person("3000")], rules);
    if (sit?.kind !== "one") throw new Error("expected one side income");
    expect(sit.better).toBeNull();
    expect(sit.difference).toBeLessThan(5);
  });

  it("a couple where both have side income: each person's own, no comparison", () => {
    const people = [person("3800", newSide("12000", "2000")), person("2000", newSide("6000", "500"))];
    const sit = sideSituation(people, rules);
    expect(sit?.kind).toBe("each");
    if (sit?.kind !== "each") return;
    expect(sit.owners).toEqual([0, 1]);
    sit.owners.forEach((owner, k) => {
      const p = people[owner];
      if (!p?.side) throw new Error("owner without side income");
      expect(sit.values[k]).toEqual(sideIncomeValue([toEngineJob(p.job)], toEngineSide(p.side), rules));
    });
  });
});

describe("householdIfEarns", () => {
  it("gives today's household netto for the person who earns it now, and more with the better partner", () => {
    const people = [person("3800", newSide("12000", "2000")), person("2000")];
    const sit = sideSituation(people, rules);
    if (sit?.kind !== "one") throw new Error("expected one side income");
    const today = householdNetto(
      people.map((p) => ({ jobs: [toEngineJob(p.job)], side: p.side ? toEngineSide(p.side) : null })),
      rules,
    ).netto;
    expect(householdIfEarns(sit, 0)).toBeCloseTo(today, 6);
    expect(householdIfEarns(sit, 1) - householdIfEarns(sit, 0)).toBeCloseTo(sit.difference * 12, 6);
  });
});
