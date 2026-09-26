import { describe, expect, it } from "vitest";
import { getRules } from "../rules";
import { HOME_SLIDERS, isHomeInput, newCare, newChild, newHome, toEngineHome, type HomeTextKey } from "./home-input";
import { parseNumber } from "./parse";
import { sliderPosition, sliderText } from "./slider-range";

const rules = getRules(2026);

describe("toEngineHome", () => {
  it("starts with no children, no rent and no savings", () => {
    expect(toEngineHome(newHome())).toEqual({ vermogen: 0, children: [], rent: null, allYoung: false });
  });

  it("reads typed text the forgiving way", () => {
    const home = {
      ...newHome(),
      savings: "12.500",
      rent: "€ 850",
      allYoung: true,
      children: [
        { age: "3", care: { kind: "dagopvang" as const, hours: "120", price: "10,75" } },
        { age: "14", care: null },
      ],
    };
    expect(toEngineHome(home)).toEqual({
      vermogen: 12_500,
      rent: 850,
      allYoung: true,
      children: [
        { age: 3, care: { kind: "dagopvang", hoursPerMonth: 120, pricePerHour: 10.75 } },
        { age: 14, care: null },
      ],
    });
  });

  it("treats empty or invalid numbers as 0, and an age as whole years", () => {
    const home = { ...newHome(), savings: "lots", rent: "", children: [{ age: "4.7", care: null }] };
    const engine = toEngineHome(home);
    expect(engine.vermogen).toBe(0);
    expect(engine.rent).toBe(0);
    expect(engine.children[0]?.age).toBe(4);
  });

  it("starts new childcare at the maximum price per hour of its kind", () => {
    const care = newCare(rules);
    expect(care.kind).toBe("dagopvang");
    expect(Number(care.price)).toBe(rules.toeslagen.kinderopvang.maxHourlyPrice.dagopvang);
  });
});

describe("HOME_SLIDERS", () => {
  const keys: HomeTextKey[] = ["age", "hours", "price", "rent", "savings"];

  it("covers the defaults without clamping them", () => {
    const care = newCare(rules);
    const defaults: Record<HomeTextKey, string> = { age: newChild().age, hours: care.hours, price: care.price, rent: "800", savings: newHome().savings };
    for (const key of keys) expect(sliderPosition(defaults[key], HOME_SLIDERS[key])).toBe(parseNumber(defaults[key]));
  });

  it("writes text that reads back as the same number, at every slider position", () => {
    for (const key of keys) {
      const range = HOME_SLIDERS[key];
      for (let value = range.min; value <= range.max; value += range.step) {
        const rounded = Number(value.toFixed(6));
        expect(parseNumber(sliderText(rounded, range))).toBe(rounded);
      }
    }
  });
});

describe("isHomeInput", () => {
  it("accepts what newHome and newChild make, and rejects anything else", () => {
    expect(isHomeInput(newHome())).toBe(true);
    expect(isHomeInput({ ...newHome(), children: [newChild(), { ...newChild(), care: newCare(rules) }] })).toBe(true);
    expect(isHomeInput(null)).toBe(false);
    expect(isHomeInput({ ...newHome(), rent: 800 })).toBe(false);
    expect(isHomeInput({ ...newHome(), children: [{ age: "3", care: { kind: "nanny", hours: "1", price: "1" } }] })).toBe(false);
  });
});
