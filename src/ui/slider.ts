import { t } from "../i18n";
import { escapeHtml } from "./dom";
import { euros, percent } from "./format";
import { sliderFill, sliderPosition, sliderText, type SliderRange } from "./slider-range";

// A slider under a number box. Dragging it writes the value into the box and fires the box's
// input event, so a page handles a dragged value exactly like a typed one. Typing moves the slider.

/** Euros, a percentage, or a plain number such as an age or hours. */
export type Unit = "€" | "%" | "";

/** What a screen reader says for the slider's value: "€3,050", "8.5%" or "12". */
const valueText = (value: number, unit: Unit) =>
  unit === "€" ? euros(value) : unit === "%" ? percent(value / 100) : value.toLocaleString(t.meta.numberLocale);

/** The slider for the text box with id `boxId`. Its own id is `${boxId}-slider`. */
export function sliderHtml(boxId: string, text: string, range: SliderRange, unit: Unit, label: string): string {
  const value = sliderPosition(text, range, { decimalOnly: unit === "%" }) ?? range.min;
  return `
      <input type="range" class="slider" id="${boxId}-slider" min="${range.min}" max="${range.max}" step="${range.step}"
        value="${value}" data-for="${boxId}" data-unit="${unit}" aria-label="${escapeHtml(label)}"
        aria-valuetext="${escapeHtml(valueText(value, unit))}" style="--fill: ${sliderFill(value, range)}%">`;
}

const rangeOf = (slider: HTMLInputElement): SliderRange => ({
  min: Number(slider.min),
  max: Number(slider.max),
  step: Number(slider.step),
});

const unitOf = (slider: HTMLInputElement): Unit => (slider.dataset.unit === "%" ? "%" : slider.dataset.unit === "€" ? "€" : "");

/** Colours the track up to the thumb, and updates what a screen reader says. */
function paint(slider: HTMLInputElement, value: number): void {
  slider.style.setProperty("--fill", `${sliderFill(value, rangeOf(slider))}%`);
  slider.setAttribute("aria-valuetext", valueText(value, unitOf(slider)));
}

/** Keeps every slider on the page in step with its text box, also after a redraw. Call once per page. */
export function linkSliders(): void {
  document.addEventListener("input", (event) => {
    const el = event.target;
    if (!(el instanceof HTMLInputElement)) return;
    if (el.type === "range" && el.dataset.for) {
      const box = document.getElementById(el.dataset.for);
      if (!(box instanceof HTMLInputElement)) return;
      const value = Number(el.value);
      box.value = sliderText(value, rangeOf(el));
      paint(el, value);
      box.dispatchEvent(new Event("input", { bubbles: true }));
    } else if (event.isTrusted && el.id) {
      // Typed by the person, not written by a slider: move the slider along.
      // Text without a number leaves it where it is.
      const slider = document.getElementById(`${el.id}-slider`);
      if (!(slider instanceof HTMLInputElement) || slider.type !== "range") return;
      const value = sliderPosition(el.value, rangeOf(slider), { decimalOnly: unitOf(slider) === "%" });
      if (value === null) return;
      slider.value = String(value);
      paint(slider, value);
    }
  });
}
