import { t } from "../i18n";
import { escapeHtml } from "./dom";
import { sliderHtml, type Unit } from "./slider";
import type { SliderRange } from "./slider-range";

// Form field building blocks shared by the job and side income forms.

export interface TextFieldOptions {
  id: string;
  value: string;
  label: string;
  /** Dutch term shown next to the label, in italics. */
  nl?: string;
  unit: Unit;
  big?: boolean;
  invalid: boolean;
  /** data-* attributes, so a page can find what the field belongs to. */
  data: Record<string, string>;
  /** Adds a slider under the box, for dragging instead of typing. */
  slider?: SliderRange;
}

export function textField(o: TextFieldOptions): string {
  const nl = o.nl ? ` <span class="nl">(${escapeHtml(o.nl)})</span>` : "";
  const box = ["input-unit", o.unit === "€" ? "input-euro" : "", o.big ? "input-big" : ""].join(" ");
  const data = Object.entries(o.data)
    .map(([key, value]) => ` data-${key}="${escapeHtml(value)}"`)
    .join("");
  return `
    <div class="field${o.invalid ? " invalid" : ""}">
      <label class="field-label" for="${o.id}">${escapeHtml(o.label)}${nl}</label>
      <div class="${box}">
        <input type="text" inputmode="decimal" autocomplete="off" id="${o.id}" value="${escapeHtml(o.value)}"${data}
          aria-invalid="${o.invalid}"${o.invalid ? ` aria-describedby="${o.id}-error"` : ""}>
        ${o.unit ? `<span class="unit" aria-hidden="true">${o.unit}</span>` : ""}
      </div>
      <span class="field-error" id="${o.id}-error">${escapeHtml(t.jobForm.notANumber)}</span>${
        o.slider ? sliderHtml(o.id, o.value, o.slider, o.unit, o.label) : ""
      }
    </div>`;
}

export interface CheckboxOptions {
  id: string;
  checked: boolean;
  label: string;
  nl?: string;
  hint?: string;
  data: Record<string, string>;
}

export function checkbox(o: CheckboxOptions): string {
  const nl = o.nl ? ` <span class="nl">(${escapeHtml(o.nl)})</span>` : "";
  const data = Object.entries(o.data)
    .map(([key, value]) => ` data-${key}="${escapeHtml(value)}"`)
    .join("");
  const hint = o.hint ? `<span class="check-hint" id="${o.id}-hint">${escapeHtml(o.hint)}</span>` : "";
  return `
    <label class="check" for="${o.id}">
      <input type="checkbox" id="${o.id}"${o.checked ? " checked" : ""}${data}${o.hint ? ` aria-describedby="${o.id}-hint"` : ""}>
      <span><span class="check-label">${escapeHtml(o.label)}${nl}</span>${hint}</span>
    </label>`;
}

/** Updates a text field's error state after typing. */
export function markInvalid(el: HTMLInputElement, invalid: boolean): void {
  el.setAttribute("aria-invalid", String(invalid));
  if (invalid) el.setAttribute("aria-describedby", `${el.id}-error`);
  else el.removeAttribute("aria-describedby");
  el.closest(".field")?.classList.toggle("invalid", invalid);
}
