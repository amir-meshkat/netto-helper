import { describe, expect, it } from "vitest";
import { sliderFill, sliderPosition, sliderText, type SliderRange } from "./slider-range";

const salary: SliderRange = { min: 0, max: 10_000, step: 50 };
const percentage: SliderRange = { min: 0, max: 20, step: 0.5 };

describe("sliderPosition", () => {
  it("puts the slider at the typed number, read the forgiving way", () => {
    expect(sliderPosition("3000", salary)).toBe(3000);
    expect(sliderPosition("3.500", salary)).toBe(3500);
    expect(sliderPosition("€ 4.250,-", salary)).toBe(4250);
    expect(sliderPosition("8,5", percentage, { decimalOnly: true })).toBe(8.5);
  });

  it("waits at the end of the range for a typed number outside it", () => {
    expect(sliderPosition("15000", salary)).toBe(10_000);
    expect(sliderPosition("-50", salary)).toBe(0);
  });

  it("treats an empty box as 0, and gives null for text without a number", () => {
    expect(sliderPosition("", salary)).toBe(0);
    expect(sliderPosition("  ", salary)).toBe(0);
    expect(sliderPosition("lots", salary)).toBeNull();
  });
});

describe("sliderText", () => {
  it("writes plain digits, rounded to the step", () => {
    expect(sliderText(3050, salary)).toBe("3050");
    expect(sliderText(8.5, percentage)).toBe("8.5");
    expect(sliderText(8, percentage)).toBe("8");
  });

  it("never shows floating point noise or -0", () => {
    expect(sliderText(0.1 + 0.2, { min: 0, max: 1, step: 0.1 })).toBe("0.3");
    expect(sliderText(-0, salary)).toBe("0");
  });
});

describe("sliderFill", () => {
  it("gives how far along the slider is, from 0 to 100", () => {
    expect(sliderFill(0, salary)).toBe(0);
    expect(sliderFill(2_500, salary)).toBe(25);
    expect(sliderFill(10_000, salary)).toBe(100);
  });

  it("stays between 0 and 100 for values outside the range", () => {
    expect(sliderFill(20_000, salary)).toBe(100);
    expect(sliderFill(-1, salary)).toBe(0);
  });
});
