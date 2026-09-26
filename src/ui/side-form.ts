import { t } from "../i18n";
import { getRules } from "../rules";
import { escapeHtml } from "./dom";
import { checkbox, markInvalid, textField } from "./fields";
import { euros } from "./format";
import { SIDE_SLIDERS, isSideInvalid, type SideInput, type SideSwitchKey, type SideTextKey } from "./side-input";

// The inputs of side income as a zzp'er: revenue and costs per year, plus three switches
// behind a toggle. Elements carry data-side (a page-unique id) and data-k (the SideInput key).

const f = t.sideForm;
const entrepreneur = getRules(2026).entrepreneur;

/** Short summary under the toggle, so the defaults are never hidden. */
export function sideNow(side: SideInput): string {
  return f.now(side.business, side.hours, side.hours && side.starter);
}

export function sideFields(sideId: string, side: SideInput, open: boolean): string {
  const text = (key: SideTextKey, label: string, nl: string, big = false) =>
    textField({
      id: `${sideId}-${key}`,
      value: side[key],
      label,
      nl,
      unit: "€",
      big,
      invalid: isSideInvalid(side[key]),
      data: { side: sideId, k: key },
      slider: SIDE_SLIDERS[key],
    });
  const toggle = (key: SideSwitchKey, label: string, nl: string, hint: string) =>
    checkbox({ id: `${sideId}-${key}`, checked: side[key], label, nl, hint, data: { side: sideId, k: key } });
  return `
    <div class="grid-2">
      ${text("revenue", f.revenue, f.revenueNl, true)}
      ${text("costs", f.costs, f.costsNl, true)}
    </div>
    <p class="hint">${escapeHtml(f.amountsHint)}</p>
    <details class="more" data-key="more-${sideId}"${open ? " open" : ""}>
      <summary>${escapeHtml(f.moreDetails)}<span class="details-now" id="${sideId}-now">${escapeHtml(sideNow(side))}</span></summary>
      ${toggle("business", f.business, f.businessNl, f.businessHint)}
      ${toggle(
        "hours",
        f.hours(entrepreneur.hoursCriterion.toLocaleString(t.meta.numberLocale)),
        f.hoursNl,
        f.hoursHint(String(Math.round(entrepreneur.hoursCriterion / 52)), euros(entrepreneur.selfEmployedDeduction)),
      )}
      ${toggle("starter", f.starter, f.starterNl, f.starterHint(euros(entrepreneur.starterDeduction)))}
    </details>`;
}

type FindSide = (sideId: string) => SideInput | undefined;

/** Typing an amount or flipping a switch. Returns false when the event was not for side income. */
export function handleSideInput(event: Event, findSide: FindSide): boolean {
  const el = event.target;
  if (!(el instanceof HTMLInputElement) || !el.dataset.side) return false;
  const side = findSide(el.dataset.side);
  if (!side) return false;
  if (el.type === "checkbox") {
    side[el.dataset.k as SideSwitchKey] = el.checked;
  } else {
    side[el.dataset.k as SideTextKey] = el.value;
    markInvalid(el, isSideInvalid(el.value));
  }
  const now = document.getElementById(`${el.dataset.side}-now`);
  if (now) now.textContent = sideNow(side);
  return true;
}
