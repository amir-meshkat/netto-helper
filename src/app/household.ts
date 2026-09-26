import type { HouseholdResult } from "../engine/household";
import { keptOfNextSalary } from "../engine/marginal";
import type { PersonResult } from "../engine/person";
import { t } from "../i18n";
import { legend, stackedBar, waffle } from "../ui/components";
import { byId, escapeHtml, withAmount } from "../ui/dom";
import { euros, eurosCents, percent, splitHundred } from "../ui/format";
import { toEngineJob } from "../ui/job-input";
import { toEngineSide } from "../ui/side-input";
import type { PersonInput } from "./state";
import type { View } from "./view";

// The household sections: the headline answer, where each €100 goes, and a card per person.

const h = t.household;

const hasIncome = (result: HouseholdResult) => result.gross + result.profit > 0;

/** The headline: netto per month for one person, or for the household. */
export function renderAnswer(result: HouseholdResult, view: View): void {
  const el = byId("answer");
  if (!hasIncome(result)) {
    el.innerHTML = `<p class="answer-empty">${escapeHtml(h.answerEmpty)}</p>`;
    return;
  }
  const two = result.people.length > 1;
  const amount = `<strong class="answer-amount">${escapeHtml(euros(result.netto / 12))}</strong>`;
  const sentence = two ? h.answerHousehold : h.answerOne(view.who(0));
  const split = two
    ? `<ul class="split">${result.people
        .map(
          (r, p) =>
            `<li><span class="dot dot-${p}" aria-hidden="true"></span>${escapeHtml(h.personTitle(view.who(p)))} <strong>${escapeHtml(euros(r.netto / 12))}</strong></li>`,
        )
        .join("")}</ul>`
    : "";
  el.innerHTML = `
    <p class="eyebrow">${escapeHtml(two ? h.answerLabelHousehold : h.answerLabelOne)}</p>
    <p class="answer">${withAmount(sentence, amount)}</p>
    <p class="answer-sub">${escapeHtml(h.answerSub(euros(result.netto), result.profit > 0))}</p>
    ${split}`;
}

/** The small answer pill that follows the reader down the page. Null while there is no answer. */
export function miniAnswer(result: HouseholdResult): string | null {
  if (!hasIncome(result)) return null;
  const label = result.people.length > 1 ? h.answerLabelHousehold : h.answerLabelOne;
  return `<span>${escapeHtml(label)}</span><strong>${escapeHtml(euros(result.netto / 12))}</strong>`;
}

/** Where each €100 goes: a grid of 100 squares for netto, tax and pension. */
export function renderEach100(result: HouseholdResult): void {
  const el = byId("each-100");
  el.hidden = !hasIncome(result);
  if (el.hidden) return;
  const two = result.people.length > 1;
  // Zvw on side income sits with the tax: both are money that is not yours to keep.
  const taxes = result.tax + result.zvw;
  const [netto = 0, tax = 0, pension = 0] = splitHundred([result.netto, taxes, result.pension]);
  const sentence = (two ? h.reasonSentenceHousehold : h.reasonSentence)(euros(netto));
  const items = [
    { tone: "netto" as const, amount: euros(netto), label: t.common.netto },
    { tone: "tax" as const, amount: euros(tax), label: result.zvw > 0 ? t.common.taxAndZvw : t.common.tax },
    ...(result.pension > 0 ? [{ tone: "pension" as const, amount: euros(pension), label: t.common.pension }] : []),
  ];
  el.innerHTML = `
    <h2>${escapeHtml(h.reasonTitle)}</h2>
    <div class="reason">
      ${waffle(
        [
          { tone: "netto", count: netto },
          { tone: "tax", count: tax },
          { tone: "pension", count: pension },
        ],
        sentence,
      )}
      <div>
        <p class="reason-sentence">${escapeHtml(sentence)}</p>
        ${legend(items)}
      </div>
    </div>`;
}

function whyTable(r: PersonResult, view: View): string {
  const { rules } = view;
  const w = h.why;
  const tax = r.incomeTax;
  const nl = (text: string) => ` <span class="nl">(${escapeHtml(text)})</span>`;
  const row = (labelHtml: string, value: string, cls = "") =>
    `<tr${cls ? ` class="${cls}"` : ""}><td>${labelHtml}</td><td>${escapeHtml(value)}</td></tr>`;
  const minus = (amount: number) => `− ${euros(amount)}`;
  const b = r.business;

  const rows = [row(escapeHtml(w.salary), euros(r.gross))];
  if (r.pension > 0) rows.push(row(escapeHtml(w.pension), minus(r.pension), "minus"));
  if (b) {
    rows.push(row(escapeHtml(w.profit), `+ ${euros(b.profit)}`));
    if (b.selfEmployedDeduction > 0) rows.push(row(escapeHtml(w.selfEmployedDeduction), minus(b.selfEmployedDeduction), "sub minus"));
    if (b.starterDeduction > 0) rows.push(row(escapeHtml(w.starterDeduction), minus(b.starterDeduction), "sub minus"));
    if (b.profitExemption !== 0) {
      rows.push(row(escapeHtml(w.profitExemption(percent(rules.entrepreneur.profitExemptionRate))), minus(b.profitExemption), "sub minus"));
    }
  }
  rows.push(row(escapeHtml(w.taxable) + nl(w.taxableNl), euros(r.taxable), "sum"));
  rows.push(row(escapeHtml(w.box1), euros(tax.box1.total)));
  for (const part of tax.box1.parts.filter((x) => x.amount > 0)) {
    rows.push(row(escapeHtml(w.bracket(percent(part.rate), euros(part.amount))), euros(part.tax), "sub"));
  }
  if (tax.topBracketAdjustment > 0) {
    const topRate = rules.box1Brackets.at(-1)?.rate ?? 0;
    const cappedAt = percent(topRate - rules.entrepreneur.topBracketDeductionAdjustment);
    rows.push(row(escapeHtml(w.topBracketAdjustment(cappedAt)), `+ ${euros(tax.topBracketAdjustment)}`, "sub"));
  }
  rows.push(row(escapeHtml(w.generalCredit) + nl(w.generalCreditNl), minus(tax.generalCredit), "minus"));
  rows.push(row(escapeHtml(w.labourCredit) + nl(w.labourCreditNl), minus(tax.labourCredit), "minus"));
  if (tax.credits < tax.generalCredit + tax.labourCredit - 0.005) {
    rows.push(`<tr class="sub"><td colspan="2">${escapeHtml(w.creditsCapped)}</td></tr>`);
  }
  rows.push(row(escapeHtml(w.taxToPay), euros(tax.tax), "sum"));
  if (r.zvw > 0) rows.push(row(escapeHtml(w.zvw) + nl(w.zvwNl), euros(r.zvw)));
  rows.push(row(escapeHtml(w.nettoYear), euros(r.netto), "sum"));
  rows.push(row(escapeHtml(w.nettoMonth), euros(r.netto / 12)));
  return `<table class="why-table"><tbody>${rows.join("")}</tbody></table>`;
}

/** The rules in words, with the numbers taken from the rules file. */
function whySteps(hasSide: boolean, two: boolean, view: View): string {
  const { rules } = view;
  const s = h.why.steps;
  const brackets = rules.box1Brackets
    .map((b) => h.why.bracketStep(percent(b.rate), b.upTo === Infinity ? null : euros(b.upTo)))
    .join(", ");
  const g = rules.generalCredit;
  const shrinking = rules.labourCredit.find((segment) => segment.rate < 0);
  const items = [
    s.gross,
    s.pension,
    ...(hasSide ? [s.side(percent(rules.entrepreneur.profitExemptionRate))] : []),
    s.brackets(brackets),
    s.generalCredit(euros(g.max), euros(g.phaseOutStart), percent(g.phaseOutRate)),
    ...(shrinking ? [s.labourCredit(euros(shrinking.base), euros(shrinking.from), percent(-shrinking.rate))] : []),
    ...(hasSide ? [s.zvw(percent(rules.zvw.rate), euros(rules.zvw.maxIncome))] : []),
    ...(two ? [s.partners] : []),
  ];
  return `
    <p class="small"><strong>${escapeHtml(h.why.stepsTitle)}</strong></p>
    <ol class="why-steps">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`;
}

function personCard(r: PersonResult, person: PersonInput, p: number, two: boolean, view: View): string {
  if (r.gross + (r.business?.profit ?? 0) <= 0) return "";
  const w = view.who(p);
  const key = `why-${p}`;
  const title = two
    ? `<span class="dot dot-${p}" aria-hidden="true"></span><span>${withAmount(h.personKeeps(w), `<strong>${escapeHtml(euros(r.netto / 12))}</strong>`)}</span>`
    : escapeHtml(h.detailsTitleOne);
  const bar = two
    ? stackedBar(
        [
          { tone: "netto", value: r.netto },
          { tone: "tax", value: r.tax + r.zvw },
          { tone: "pension", value: r.pension },
        ],
        `${t.common.netto} ${euros(r.netto)}, ${t.common.taxAndZvw} ${euros(r.tax + r.zvw)}, ${t.common.pension} ${euros(r.pension)}`,
      )
    : "";
  const side = person.side ? toEngineSide(person.side) : null;
  const kept = keptOfNextSalary([toEngineJob(person.job)], side, view.rules);
  return `
    <article class="card person-card">
      <h2>${title}</h2>
      ${bar}
      <p class="next100">${escapeHtml(h.nextHundred(w, eurosCents(kept)))}<span class="small muted">${escapeHtml(h.nextHundredNote)}</span></p>
      <details class="why" data-key="${key}"${view.details.openIf(key)}>
        <summary>${escapeHtml(t.common.showWhy)}</summary>
        ${whyTable(r, view)}
        ${whySteps(r.business !== null, two, view)}
      </details>
    </article>`;
}

/** A card per person: their netto, "of the next €100", and the full calculation on request. */
export function renderPeople(result: HouseholdResult, people: PersonInput[], view: View): void {
  const two = people.length > 1;
  byId("people").innerHTML = result.people
    .map((r, p) => {
      const person = people[p];
      return person ? personCard(r, person, p, two, view) : "";
    })
    .join("");
}
