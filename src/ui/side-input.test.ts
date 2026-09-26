import { describe, expect, it } from "vitest";
import { parseNumber } from "./parse";
import { SIDE_SLIDERS, isSideInput, isSideInvalid, newSide, toEngineSide, type SideTextKey } from "./side-input";
import { sliderPosition, sliderText } from "./slider-range";

describe("toEngineSide", () => {
  it("reads typed text into engine numbers", () => {
    const side = toEngineSide({ ...newSide("12.000"), costs: "€ 2.000" });
    expect(side).toEqual({ revenue: 12_000, costs: 2_000, kind: "business", meetsHoursCriterion: false, starter: false });
  });

  it("maps the switches", () => {
    const side = toEngineSide({ ...newSide("5000"), business: false, hours: true, starter: true });
    expect(side.kind).toBe("other");
    expect(side.meetsHoursCriterion).toBe(true);
    expect(side.starter).toBe(true);
  });

  it("treats empty, invalid and negative input as 0", () => {
    expect(toEngineSide({ ...newSide(""), costs: "-5" })).toMatchObject({ revenue: 0, costs: 0 });
  });
});

describe("validation", () => {
  it("flags text without a number", () => {
    expect(isSideInvalid("abc")).toBe(true);
    expect(isSideInvalid("")).toBe(false);
  });

  it("recognises saved side income", () => {
    expect(isSideInput(newSide("100"))).toBe(true);
    expect(isSideInput({ ...newSide("100"), hours: "yes" })).toBe(false);
    expect(isSideInput(null)).toBe(false);
  });
});

describe("SIDE_SLIDERS", () => {
  const keys: SideTextKey[] = ["revenue", "costs"];

  it("covers the example side income without clamping it", () => {
    const side = newSide("12000", "2000");
    for (const key of keys) expect(sliderPosition(side[key], SIDE_SLIDERS[key])).toBe(parseNumber(side[key]));
  });

  it("writes text that reads back as the same amount, at every slider position", () => {
    for (const key of keys) {
      const range = SIDE_SLIDERS[key];
      for (let value = range.min; value <= range.max; value += range.step) {
        expect(parseNumber(sliderText(value, range))).toBe(value);
      }
    }
  });
});
