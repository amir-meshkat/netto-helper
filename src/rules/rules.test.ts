import { describe, expect, it } from "vitest";
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
