import type { HouseholdTotal } from "../engine/household";
import { t } from "../i18n";
import { legend, stackedBar } from "../ui/components";
import { byId, escapeHtml, withAmount } from "../ui/dom";
import { euros, percent } from "../ui/format";
import type { View } from "./view";

// The own home section: what the mortgage does to income tax and toeslagen. Shown once a mortgage is added.

const m = t.mortgage;

/** One sentence in euros, then what the interest really costs, with a bar of the part that comes back. */
function answer(total: HouseholdTotal, without: HouseholdTotal, two: boolean): string {
  const w = total.eigenWoning;
  if (!w || (w.interest <= 0 && w.forfait <= 0)) return `<p class="section-answer">${escapeHtml(m.typeFirst)}</p>`;
  const taxLower = without.work.tax - total.work.tax;
  const toeslagenUp = total.toeslagen.total - without.toeslagen.total;
  const toeslagenLine = toeslagenUp >= 12 ? `<p class="small">${escapeHtml(m.toeslagenUp(euros(toeslagenUp / 12)))}</p>` : "";
  // Less than 50 cents a month either way: the credits already cover all tax.
  if (Math.abs(taxLower) < 6) return `<p class="section-answer">${escapeHtml(m.noEffect)}</p>${toeslagenLine}`;
  if (taxLower < 0) {
    return `
      <p class="section-answer">${withAmount(m.answerHigher, `<strong>${escapeHtml(euros(-taxLower / 12))}</strong>`)}</p>
      <p class="small muted">${escapeHtml(m.higherWhy)}</p>`;
  }
  const back = Math.min(w.interest, taxLower + Math.max(0, toeslagenUp));
  const own = w.interest - back;
  const bar = stackedBar(
    [
      { tone: "netto", value: back },
      { tone: "pension", value: own },
    ],
    `${m.legendBack} ${euros(back / 12)}, ${m.legendOwn} ${euros(own / 12)}`,
  );
  const keys = legend(
    [
      { tone: "netto", label: m.legendBack },
      { tone: "pension", label: m.legendOwn },
    ],
    true,
  );
  return `
    <p class="section-answer">${withAmount(m.answerLower(two), `<strong>${escapeHtml(euros(taxLower / 12))}</strong>`)}</p>
    <p class="small muted">${escapeHtml(m.cost(euros(w.interest / 12), euros(back / 12), euros(own / 12), toeslagenUp >= 0.5))}</p>
    ${bar}
    ${keys}
    ${toeslagenLine}
    <p class="small muted">${escapeHtml(m.aangifte)}</p>`;
}

/** The calculation: forfait, interest, Hillen, the balance and how partners divide it, and the effect. */
function why(total: HouseholdTotal, without: HouseholdTotal, view: View): string {
  const w = total.eigenWoning;
  if (!w) return "";
  const { rules } = view;
  const e = rules.eigenWoning;
  const two = total.work.people.length > 1;
  const row = (label: string, value: string, cls = "") =>
    `<tr${cls ? ` class="${cls}"` : ""}><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`;
  const signed = (amount: number) => (Math.abs(amount) < 0.5 ? euros(0) : amount < 0 ? `− ${euros(-amount)}` : `+ ${euros(amount)}`);
  const mainRate = e.forfait.at(-1)?.rate ?? 0;
  const villa = w.forfait > e.villa.base;
  const taxLower = without.work.tax - total.work.tax;
  const toeslagenUp = total.toeslagen.total - without.toeslagen.total;

  const rows = [
    row(villa ? m.rowForfaitVilla : m.rowForfait(percent(mainRate)), `+ ${euros(w.forfait)}`),
    row(m.rowInterest, `− ${euros(w.interest)}`, "minus"),
    ...(w.hillen > 0 ? [row(m.rowHillen, `− ${euros(w.hillen)}`, "minus")] : []),
    row(m.rowSaldo, signed(w.saldo), "sum"),
    ...(two ? total.work.people.map((p, i) => row(m.rowShare(view.who(i)), signed(p.woning), "sub")) : []),
    row(taxLower >= 0 ? m.rowTax : m.rowTaxMore, euros(Math.abs(taxLower))),
    ...(toeslagenUp >= 0.5 ? [row(m.rowToeslagen, euros(toeslagenUp))] : []),
  ];

  const g = rules.generalCredit;
  const topRate = rules.box1Brackets.at(-1)?.rate ?? 0;
  const s = m.steps;
  const steps = [
    s.forfait(percent(mainRate)),
    s.interest,
    s.cap(percent(topRate - rules.topBracketDeductionAdjustment)),
    s.credit(euros(g.phaseOutStart), euros(g.phaseOutStart + g.max / g.phaseOutRate), percent(g.phaseOutRate)),
    ...(two ? [s.partners] : []),
    ...(w.hillen > 0 ? [s.hillen(percent(e.hillenRate))] : []),
  ];
  return `
    <table class="why-table"><tbody>${rows.join("")}</tbody></table>
    <ol class="why-steps">${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>`;
}

/**
 * Shows the section when the household owns its home. `without` is the same household without the own
 * home, to show what the mortgage changes.
 */
export function renderMortgage(total: HouseholdTotal, without: HouseholdTotal | null, view: View): void {
  const el = byId("mortgage");
  el.hidden = !total.eigenWoning || !without;
  if (!total.eigenWoning || !without) return;
  const two = total.work.people.length > 1;
  el.innerHTML = `
    <h2>${escapeHtml(m.title)}</h2>
    ${answer(total, without, two)}
    <details class="why" data-key="why-mortgage"${view.details.openIf("why-mortgage")}>
      <summary>${escapeHtml(t.common.showWhy)}</summary>
      ${why(total, without, view)}
    </details>`;
}
