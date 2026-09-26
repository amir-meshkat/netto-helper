import { describe, expect, it } from "vitest";
import kinderopvangSource from "../../docs/sources/kinderopvangtoeslag-2026.md?raw";
import { getRules } from "./index";

// These checks catch typos when a new year's rules file is added.
describe("rules", () => {
  it("returns the 2026 rules and refuses unknown years", () => {
    expect(getRules(2026).year).toBe(2026);
    expect(() => getRules(1999)).toThrow(/No tax rules for 1999/);
  });

  const rules = getRules(2026);

  it("has box 1 brackets in ascending order, ending at Infinity", () => {
    const bounds = rules.box1Brackets.map((b) => b.upTo);
    expect(bounds).toEqual([...bounds].sort((a, b) => a - b));
    expect(bounds.at(-1)).toBe(Infinity);
  });

  it("has labour credit segments that start at 0, connect without gaps and end at Infinity", () => {
    const segments = rules.labourCredit;
    expect(segments[0]?.from).toBe(0);
    segments.slice(1).forEach((s, i) => expect(s.from).toBe(segments[i]?.upTo));
    expect(segments.at(-1)?.upTo).toBe(Infinity);
  });
});

describe("toeslagen rules", () => {
  const rules = getRules(2026).toeslagen;

  it("has the kinderopvangtoeslag table exactly as on the Rijksoverheid page (docs/sources)", () => {
    const euros = (text: string) => Number(text.replace(/\./g, ""));
    const share = (text: string) => Number((Number(text.replace(",", ".")) / 100).toFixed(4));
    const rows = [...kinderopvangSource.matchAll(/\| € ([\d.]+) \| (?:€ ([\d.]+)|en hoger) \| ([\d,]+)% \| ([\d,]+)% \|/g)].map((m) => ({
      from: euros(m[1] ?? ""),
      upTo: m[2] ? euros(m[2]) : Infinity,
      first: share(m[3] ?? ""),
      next: share(m[4] ?? ""),
    }));
    expect(rows).toHaveLength(69);
    expect(rules.kinderopvang.table).toEqual(rows);
  });

  it("has a kinderopvangtoeslag table without gaps, never rising, from 0 to Infinity", () => {
    const table = rules.kinderopvang.table;
    expect(table[0]?.from).toBe(0);
    table.slice(1).forEach((band, i) => {
      const before = table[i];
      expect(band.from).toBe((before?.upTo ?? NaN) + 1);
      expect(band.first).toBeLessThanOrEqual(before?.first ?? NaN);
      expect(band.next).toBeLessThanOrEqual(before?.next ?? NaN);
    });
    expect(table.at(-1)?.upTo).toBe(Infinity);
  });

  it("gives the Toeslagenkaart's maximum zorgtoeslag: 1,550 alone and 2,963 with a toeslagpartner", () => {
    const z = rules.zorgtoeslag;
    expect(Math.round(z.standaardpremie - z.normpremieBase.alone * z.drempelinkomen)).toBe(1_550);
    expect(Math.round(2 * z.standaardpremie - z.normpremieBase.partner * z.drempelinkomen)).toBe(2_963);
  });

  it("gives the Toeslagenkaart's kindgebonden budget for a single parent: 5,996 for one child, 8,576 for two", () => {
    const k = rules.kindgebondenBudget;
    expect(k.perChild + k.singleParent).toBe(5_996);
    expect(2 * k.perChild + k.singleParent).toBe(8_576);
  });
});
