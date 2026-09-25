import "../../ui/styles.css";
import "../../ui/tool.css";
import type { SideIncome } from "../../engine/business";
import { householdNetto, type HouseholdResult, type PersonIncome } from "../../engine/household";
import { keptOfNextSalary } from "../../engine/marginal";
import type { PersonResult } from "../../engine/person";
import { sideIncomeValue } from "../../engine/side-income";
import { t, type Who } from "../../i18n";
import { getRules } from "../../rules";
import { legend, stackedBar, waffle } from "../../ui/components";
import { byId, escapeHtml, rememberOpenDetails, withAmount } from "../../ui/dom";
import { floatingAnswer } from "../../ui/floating-answer";
import { euros, eurosCents, percent, splitHundred } from "../../ui/format";
import { handleJobInput, handlePensionModeChange, jobFields } from "../../ui/job-form";
import { toEngineJob, type JobInput } from "../../ui/job-input";
import { handleSideInput, sideFields } from "../../ui/side-form";
import { newSide, toEngineSide, type SideInput } from "../../ui/side-input";
import { initPage } from "../../ui/page";
import { makeWho } from "../../ui/who";
import { MAX_PEOPLE, loadState, newPerson, saveState, type PersonInput } from "./state";

const rules = getRules(2026);
const h = t.household;
const state = loadState();
const details = rememberOpenDetails();

initPage({ title: h.title, homeHref: "../", notes: [[t.common.couplesTitle, t.common.couples]] });
byId("page-title").textContent = h.title;
byId("page-intro").textContent = h.intro;
byId("inputs-title").textContent = h.inputsTitle;

const inputs = byId("inputs");
const setMini = floatingAnswer(byId("answer-card"), byId<HTMLButtonElement>("mini"));

// ---------- state helpers ----------

function personAt(p: number): PersonInput {
  const person = state.people[p];
  if (!person) throw new Error(`No person ${p}`);
  return person;
}

const who = (p: number): Who => makeWho(state.people[p]?.name ?? "", p);

/** Ids look like "job-0" and "side-1": the number is the person. */
const indexOf = (id: string) => Number(id.split("-")[1]);
const findJob = (jobId: string): JobInput | undefined => state.people[indexOf(jobId)]?.job;
const findSide = (sideId: string): SideInput | undefined => state.people[indexOf(sideId)]?.side ?? undefined;

const engineSide = (person: PersonInput): SideIncome | null => (person.side ? toEngineSide(person.side) : null);
const engineIncome = (person: PersonInput): PersonIncome => ({ jobs: [toEngineJob(person.job)], side: engineSide(person) });

// ---------- inputs ----------

function sideBlock(p: number): string {
  const side = personAt(p).side;
  if (!side) {
    return `<button type="button" class="btn-add" data-action="add-side" data-p="${p}">${escapeHtml(h.addSide)}</button>`;
  }
  return `
    <div class="job side">
      <div class="job-head">
        <span class="job-title">${escapeHtml(h.sideTitle)}</span>
        <button type="button" class="btn-link" data-action="remove-side" data-p="${p}">${escapeHtml(h.removeSide)}</button>
      </div>
      ${sideFields(`side-${p}`, side, details.isOpen(`more-side-${p}`))}
    </div>`;
}

function personInputs(p: number): string {
  const person = personAt(p);
  const remove =
    p > 0
      ? `<button type="button" class="btn-link" data-action="remove-person" data-p="${p}">${escapeHtml(t.common.removePartner)}</button>`
      : "";
  return `
    <section class="person-input" aria-labelledby="person-${p}-title">
      <div class="person-head">
        <h3 id="person-${p}-title"><span class="dot dot-${p}" aria-hidden="true"></span><span id="person-${p}-name">${escapeHtml(h.personTitle(who(p)))}</span></h3>
        ${remove}
      </div>
      <div class="field">
        <label class="field-label" for="name-${p}">${escapeHtml(t.common.nameLabel)} <span class="nl">(${escapeHtml(t.common.nameHint)})</span></label>
        <input type="text" id="name-${p}" data-name="${p}" value="${escapeHtml(person.name)}"
          placeholder="${escapeHtml(p === 0 ? t.common.you : t.common.partner)}" autocomplete="off" maxlength="30">
      </div>
      <div class="job">
        <div class="job-head"><span class="job-title">${escapeHtml(h.salaryTitle)}</span></div>
        ${jobFields(`job-${p}`, person.job, details.isOpen(`more-job-${p}`))}
      </div>
      ${sideBlock(p)}
    </section>`;
}

function renderInputs(focusId?: string): void {
  const addPartner =
    state.people.length < MAX_PEOPLE
      ? `<button type="button" class="btn-add" data-action="add-person">${escapeHtml(t.common.addPartner)}</button>`
      : "";
  inputs.innerHTML = state.people.map((_, p) => personInputs(p)).join("") + addPartner;
  if (focusId) document.getElementById(focusId)?.focus();
}

// ---------- results ----------

function renderAnswer(result: HouseholdResult, two: boolean): void {
  const el = byId("answer");
  if (result.gross + result.profit <= 0) {
    el.innerHTML = `<p class="answer-empty">${escapeHtml(h.answerEmpty)}</p>`;
    return;
  }
  const amount = `<strong class="answer-amount">${escapeHtml(euros(result.netto / 12))}</strong>`;
  const sentence = two ? h.answerHousehold : h.answerOne(who(0));
  const split = two
    ? `<ul class="split">${result.people
        .map(
          (r, p) =>
            `<li><span class="dot dot-${p}" aria-hidden="true"></span>${escapeHtml(h.personTitle(who(p)))} <strong>${escapeHtml(euros(r.netto / 12))}</strong></li>`,
        )
        .join("")}</ul>`
    : "";
  el.innerHTML = `
    <p class="eyebrow">${escapeHtml(two ? h.answerLabelHousehold : h.answerLabelOne)}</p>
    <p class="answer">${withAmount(sentence, amount)}</p>
    <p class="answer-sub">${escapeHtml(h.answerSub(euros(result.netto), result.profit > 0))}</p>
    ${split}`;
}

function renderReason(result: HouseholdResult, two: boolean): void {
  const el = byId("reason");
  el.hidden = result.gross + result.profit <= 0;
  if (el.hidden) return;
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

/** Nothing is withheld on side income: say how much to set aside. */
function setAsideNote(person: PersonInput, w: Who): string {
  const side = engineSide(person);
  if (!side) return "";
  const { setAside } = sideIncomeValue([toEngineJob(person.job)], side, rules);
  if (setAside < 1) return "";
  return `<p class="note">${escapeHtml(h.setAside(w, euros(setAside / 12), euros(setAside)))}</p>`;
}

function whyTable(r: PersonResult): string {
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
function whySteps(hasSide: boolean, two: boolean): string {
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

function personCard(r: PersonResult, p: number, two: boolean): string {
  const person = personAt(p);
  if (r.gross + (r.business?.profit ?? 0) <= 0) return "";
  const w = who(p);
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
  const kept = keptOfNextSalary([toEngineJob(person.job)], engineSide(person), rules);
  return `
    <article class="card person-card">
      <h2>${title}</h2>
      ${bar}
      <p class="next100">${escapeHtml(h.nextHundred(w, eurosCents(kept)))}<span class="small muted">${escapeHtml(h.nextHundredNote)}</span></p>
      ${setAsideNote(person, w)}
      <details class="why" data-key="${key}"${details.openIf(key)}>
        <summary>${escapeHtml(t.common.showWhy)}</summary>
        ${whyTable(r)}
        ${whySteps(r.business !== null, two)}
      </details>
    </article>`;
}

function renderResults(): void {
  const result = householdNetto(state.people.map(engineIncome), rules);
  const two = state.people.length > 1;
  renderAnswer(result, two);
  renderReason(result, two);
  byId("people").innerHTML = result.people.map((r, p) => personCard(r, p, two)).join("");
  setMini(
    result.gross + result.profit > 0
      ? `<span>${escapeHtml(two ? h.answerLabelHousehold : h.answerLabelOne)}</span><strong>${escapeHtml(euros(result.netto / 12))}</strong>`
      : null,
  );
}

function update(): void {
  renderResults();
  saveState(state);
}

// ---------- events ----------

inputs.addEventListener("input", (event) => {
  const el = event.target;
  if (!(el instanceof HTMLInputElement) || el.type === "checkbox") return;
  if (el.dataset.name !== undefined) {
    const p = Number(el.dataset.name);
    personAt(p).name = el.value;
    byId(`person-${p}-name`).textContent = h.personTitle(who(p));
    update();
  } else if (handleJobInput(event, findJob) || handleSideInput(event, findSide)) {
    update();
  }
});

inputs.addEventListener("change", (event) => {
  const el = event.target;
  if (el instanceof HTMLInputElement && el.type === "checkbox") {
    if (handleSideInput(event, findSide)) update();
    return;
  }
  const focusId = handlePensionModeChange(event, findJob);
  if (focusId === null) return;
  renderInputs(focusId);
  update();
});

inputs.addEventListener("click", (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>("button[data-action]");
  if (!button) return;
  const p = Number(button.dataset.p);
  let focusId: string | undefined;
  switch (button.dataset.action) {
    case "add-side":
      personAt(p).side = newSide();
      focusId = `side-${p}-revenue`;
      break;
    case "remove-side":
      personAt(p).side = null;
      focusId = `job-${p}-monthly`;
      break;
    case "add-person":
      state.people.push(newPerson());
      focusId = `job-${state.people.length - 1}-monthly`;
      break;
    case "remove-person":
      state.people.splice(p, 1);
      focusId = "job-0-monthly";
      break;
  }
  renderInputs(focusId);
  update();
});

renderInputs();
renderResults();
