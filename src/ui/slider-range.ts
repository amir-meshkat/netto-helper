import { parseNumber, type ParseOptions } from "./parse";

// The number side of a slider, kept free of the DOM so it can be tested.
// A slider covers the usual values; the text box next to it takes any number.

export interface SliderRange {
  min: number;
  max: number;
  step: number;
}

const clamp = (value: number, range: SliderRange) => Math.min(range.max, Math.max(range.min, value));

/**
 * Where the slider sits for the text in its box: the number, kept inside the range.
 * An empty box counts as 0, like everywhere else. Null when the text holds no number.
 */
export function sliderPosition(text: string, range: SliderRange, options: ParseOptions = {}): number | null {
  const value = text.trim() === "" ? 0 : parseNumber(text, options);
  return value === null ? null : clamp(value, range);
}

/** The text a slider writes into its box: plain digits rounded to the step, so "8.5" and never "8.500000001". */
export function sliderText(value: number, range: SliderRange): string {
  const decimals = String(range.step).split(".")[1]?.length ?? 0;
  return String(Number(value.toFixed(decimals)) || 0);
}

/** How far along the slider is, from 0 to 100. Colours the part of the track before the thumb. */
export function sliderFill(value: number, range: SliderRange): number {
  const span = range.max - range.min;
  return span > 0 ? ((clamp(value, range) - range.min) / span) * 100 : 0;
}
