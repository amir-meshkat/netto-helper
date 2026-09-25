import { describe, expect, it } from "vitest";
import { euros, eurosCents, percent, splitHundred } from "./format";

describe("money formatting", () => {
  it("shows whole euros with thousands separators", () => {
    expect(euros(2_611.85)).toBe("€2,612");
    expect(euros(31_342.25)).toBe("€31,342");
  });

  it("never shows minus zero", () => {
    expect(euros(-0.3)).toBe("€0");
  });

  it("shows cents when asked", () => {
    expect(eurosCents(59.802)).toBe("€59.80");
  });

  it("shows rates as percentages without losing decimals from the rules", () => {
    expect(percent(0.06398)).toBe("6.398%");
    expect(percent(0.3575)).toBe("35.75%");
    expect(percent(0.0195)).toBe("1.95%");
    expect(percent(0.495)).toBe("49.5%");
  });
});

describe("splitHundred", () => {
  it("turns amounts into whole euros of every 100 that always add up to 100", () => {
    expect(splitHundred([31_342.25, 4_657.75, 0])).toEqual([87, 13, 0]);
    const parts = splitHundred([1, 1, 1]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it("gives all zeros when there is nothing to split", () => {
    expect(splitHundred([0, 0, 0])).toEqual([0, 0, 0]);
  });
});
