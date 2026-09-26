import type { HouseholdResult, HouseholdTotal } from "../engine/household";
import type { NextSalary } from "../engine/marginal";
import type { PersonResult } from "../engine/person";
import { t } from "../i18n";
import { legend, stackedBar, waffle } from "../ui/components";
import { byId, escapeHtml, withAmount } from "../ui/dom";
import { euros, eurosCents, percent, splitHundred } from "../ui/format";
import type { View } from "./view";

// The household sections: the headline answer, where each €100 goes, and a card per person.
// The headline and "the next €100" include toeslagen; where each €100 goes is about work income only.

const h = t.household;

const hasIncome = (result: HouseholdResult) => result.gross + result.profit > 0;

/** "Netto per month", or "Per month, with toeslagen" once toeslagen or childcare are part of the amount. */
function answerLabel(total: HouseholdTotal): string {
  const two = total.work.people.length > 1;
  const withToeslagen = total.toeslagen.total > 0 || total.childcareCost > 0;
  if (withToeslagen) return two ? h.answerLabelHouseholdToeslagen : h.answerLabelOneToeslagen;
  return two ? h.answerLabelHousehold : h.answerLabelOne;
}

/** The headline: what one person, or the household, has per month: netto from work plus toeslagen. */
export function renderAnswer(total: HouseholdTotal, view: View): void {
  const el = byId("answer");
  const result = total.work;
  if (!hasIncome(result)) {
    el.innerHTML = `<p class="answer-empty">${escapeHtml(h.answerEmpty)}</p>`;
    return;
  }
  const two = result.people.length > 1;
  // Kinderopvangtoeslag only pays back part of the childcare bill: show the part you pay, not the toeslag.
  const toeslagen = total.toeslagen.total - total.toeslagen.kinderopvang.amount;
  const ownChildcare = total.childcareCost - total.toeslagen.kinderopvang.amount;
  const amount = `<strong class="answer-amount">${escapeHtml(euros(total.total / 12))}</strong>`;
  const sentence = two ? h.answerHousehold : h.answerOne(view.who(0));
  const split = two
    ? `<ul class="split">${result.people
        .map(
          (r, p) =>
            `<li><span class="dot dot-${p}" aria-hidden="true"></span>${escapeHtml(h.personTitle(view.who(p)))} <strong>${escapeHtml(euros(r.netto / 12))}</strong></li>`,
        )
        .join("")}${toeslagen > 0 ? `<li>${escapeHtml(h.splitToeslagen)} <strong>${escapeHtml(euros(toeslagen / 12))}</strong></li>` : ""}${
        ownChildcare >= 1 ? `<li>${escapeHtml(h.splitChildcare)} <strong>− ${escapeHtml(euros(ownChildcare / 12))}</strong></li>` : ""
      }</ul>`
    : "";
  const sub =
    toeslagen > 0 || total.childcareCost > 0
      ? h.answerSubToeslagen(euros(total.total), euros(result.netto), euros(toeslagen), ownChildcare >= 1 ? euros(ownChildcare) : null)
      : h.answerSub(euros(result.netto), result.profit > 0);
  el.innerHTML = `
    <p class="eyebrow">${escapeHtml(answerLabel(total))}</p>
    <p class="answer">${withAmount(sentence, amount)}</p>
    <p class="answer-sub">${escapeHtml(sub)}</p>
    ${split}`;
}

/** The small answer pill that follows the reader down the page. Null while there is no answer. */
export function miniAnswer(total: HouseholdTotal): string | null {
  if (!hasIncome(total.work)) return null;
  return `<span>${escapeHtml(answerLabel(total))}</span><strong>${escapeHtml(euros(total.total / 12))}</strong>`;
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

/**
 * Of the next €100 of salary: what is kept, in one sentence, a bar in three colours (kept, income tax,
 * lower toeslagen), and an honest warning where earning more leaves the household with less.
 */
function nextHundred(next: NextSalary, w: ReturnType<View["who"]>): string {
  const lost = next.lostToeslagen >= 0.005;
  const bar =
    next.kept >= 0
      ? stackedBar(
          [
            { tone: "netto", value: next.kept },
            { tone: "tax", value: next.taxAndZvw },
            { tone: "toeslag", value: next.lostToeslagen },
          ],
          `${h.legendKept} ${eurosCents(next.kept)}, ${h.legendTax} ${eurosCents(next.taxAndZvw)}, ${h.legendToeslag} ${eurosCents(next.lostToeslagen)}`,
        )
      : "";
  const keys = lost
    ? legend(
        [
          { tone: "netto", label: h.legendKept },
          { tone: "tax", label: h.legendTax },
          { tone: "toeslag", label: h.legendToeslag },
        ],
        true,
      )
    : "";
  const note = next.kept < 0 ? "" : lost ? h.nextHundredStill : h.nextHundredNote;
  const warning = next.kept < 0 ? `<p class="note">${escapeHtml(h.nextHundredLoss)}</p>` : "";
  const sentence = next.kept < 0 ? h.nextHundredNegative(w, eurosCents(-next.kept)) : h.nextHundred(w, eurosCents(next.kept));
  return `
      <p class="next100">${escapeHtml(sentence)}</p>
      <div class="next100-bar">${bar}</div>
      ${keys}
      <p class="small muted">${escapeHtml(h.nextHundredSplit(eurosCents(next.taxAndZvw), lost ? eurosCents(next.lostToeslagen) : null))} ${escapeHtml(note)}</p>
      ${warning}`;
}

function personCard(r: PersonResult, next: NextSalary, p: number, two: boolean, view: View): string {
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
  return `
    <article class="card person-card">
      <h2>${title}</h2>
      ${bar}
      ${nextHundred(next, w)}
      <details class="why" data-key="${key}"${view.details.openIf(key)}>
        <summary>${escapeHtml(t.common.showWhy)}</summary>
        ${whyTable(r, view)}
        ${whySteps(r.business !== null, two, view)}
      </details>
    </article>`;
}

/** A card per person: their netto, "of the next €100" (with toeslagen), and the full calculation on request. */
export function renderPeople(result: HouseholdResult, next: NextSalary[], view: View): void {
  const two = result.people.length > 1;
  byId("people").innerHTML = result.people
    .map((r, p) => {
      const n = next[p];
      return n ? personCard(r, n, p, two, view) : "";
    })
    .join("");
}
