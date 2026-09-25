import { describe, expect, it } from "vitest";
import { parseNumber } from "./parse";

describe("parseNumber", () => {
  it("reads plain numbers", () => {
    expect(parseNumber("3500")).toBe(3500);
    expect(parseNumber("8")).toBe(8);
  });

  it("reads Dutch and English thousands separators the same way", () => {
    expect(parseNumber("3.500")).toBe(3500);
    expect(parseNumber("3,500")).toBe(3500);
    expect(parseNumber("1.234.567")).toBe(1_234_567);
    expect(parseNumber("  2 800 ")).toBe(2800);
  });

  it("reads decimals with a comma or a point", () => {
    expect(parseNumber("8,5")).toBe(8.5);
    expect(parseNumber("8.5")).toBe(8.5);
    expect(parseNumber("3500.00")).toBe(3500);
    expect(parseNumber("0,125")).toBe(0.125);
  });

  it("uses the last separator as the decimal one when both appear", () => {
    expect(parseNumber("3.500,50")).toBe(3500.5);
    expect(parseNumber("3,500.50")).toBe(3500.5);
  });

  it("ignores the euro sign and other decoration", () => {
    expect(parseNumber("€ 3.500")).toBe(3500);
    expect(parseNumber("€3500,-")).toBe(3500);
  });

  it("can treat a single separator as decimal only, for percentages", () => {
    expect(parseNumber("8.333", { decimalOnly: true })).toBe(8.333);
    expect(parseNumber("8,333", { decimalOnly: true })).toBe(8.333);
  });

  it("returns null when there is no number", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("   ")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
  });
});
