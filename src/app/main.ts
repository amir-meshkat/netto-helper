import "../ui/styles.css";
import "../ui/tool.css";
import { householdTotal, type PersonIncome } from "../engine/household";
import { nextSalaryInHousehold } from "../engine/marginal";
import { t } from "../i18n";
import { getRules } from "../rules";
import { byId, escapeHtml, oncePerFrame, rememberOpenDetails } from "../ui/dom";
import { floatingAnswer } from "../ui/floating-answer";
import { handleHomeChange, handleHomeInput, homeFields } from "../ui/home-form";
import { newCare, newChild, newMortgage, toEngineHome } from "../ui/home-input";
import { handleJobInput, handlePensionModeChange, jobFields } from "../ui/job-form";
import { toEngineJob, type JobInput } from "../ui/job-input";
import { initPage } from "../ui/page";
import { handleSideInput, sideFields } from "../ui/side-form";
import { newSide, toEngineSide, type SideInput } from "../ui/side-input";
import { linkSliders } from "../ui/slider";
import { makeWho } from "../ui/who";
import { miniAnswer, renderAnswer, renderEach100, renderPeople } from "./household";
import { renderMortgage } from "./mortgage";
import { initSideIncome, renderSideIncome } from "./side-income";
import { renderToeslagen } from "./toeslagen";
import { initWorthIt, renderWorthIt } from "./worth-it";
import { sideSituation } from "./side-situation";
import { MAX_PEOPLE, loadState, newPerson, saveState, type PersonInput } from "./state";
import type { View } from "./view";

// The one page: one set of inputs, and every answer drawn from them.

const rules = getRules(2026);
const h = t.household;
const state = loadState();

initPage({
  notes: [
    [t.common.couplesTitle, t.common.couples],
    [t.sideIncome.notesSideTitle, t.sideIncome.notesSide],
    [t.toeslagen.notesTitle, t.toeslagen.notes],
    [t.mortgage.notesTitle, t.mortgage.notes],
  ],
});
byId("page-title").textContent = t.page.title;
byId("page-intro").textContent = t.page.intro;
byId("inputs-title").textContent = t.page.inputsTitle;
initSideIncome();
initWorthIt(() => renderResults());

const view: View = {
  rules,
  who: (p) => makeWho(state.people[p]?.name ?? "", p),
  details: rememberOpenDetails(),
};
const inputs = byId("inputs");
const setMini = floatingAnswer(byId("netto"), byId<HTMLButtonElement>("mini"));

// ---------- state helpers ----------

function personAt(p: number): PersonInput {
  const person = state.people[p];
  if (!person) throw new Error(`No person ${p}`);
  return person;
}

/** Ids look like "job-0" and "side-1": the number is the person. */
const indexOf = (id: string) => Number(id.split("-")[1]);
const findJob = (jobId: string): JobInput | undefined => state.people[indexOf(jobId)]?.job;
const findSide = (sideId: string): SideInput | undefined => state.people[indexOf(sideId)]?.side ?? undefined;

const engineIncome = (person: PersonInput): PersonIncome => ({
  jobs: [toEngineJob(person.job)],
  side: person.side ? toEngineSide(person.side) : null,
});

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
      ${sideFields(`side-${p}`, side, view.details.isOpen(`more-side-${p}`))}
    </div>`;
}

/** One person's inputs. Alone, a person needs no heading or name: the page starts with just a salary. */
function personInputs(p: number): string {
  const person = personAt(p);
  const two = state.people.length > 1;
  const remove =
    p > 0
      ? `<button type="button" class="btn-link" data-action="remove-person" data-p="${p}">${escapeHtml(t.common.removePartner)}</button>`
      : "";
  const head = two
    ? `
      <div class="person-head">
        <h3 id="person-${p}-title"><span class="dot dot-${p}" aria-hidden="true"></span><span id="person-${p}-name">${escapeHtml(h.personTitle(view.who(p)))}</span></h3>
        ${remove}
      </div>
      <div class="field">
        <label class="field-label" for="name-${p}">${escapeHtml(t.common.nameLabel)} <span class="nl">(${escapeHtml(t.common.nameHint)})</span></label>
        <input type="text" id="name-${p}" data-name="${p}" value="${escapeHtml(person.name)}"
          placeholder="${escapeHtml(p === 0 ? t.common.you : t.common.partner)}" autocomplete="off" maxlength="30">
      </div>`
    : "";
  return `
    <section class="person-input"${two ? ` aria-labelledby="person-${p}-title"` : ""}>
      ${head}
      <div class="job">
        <div class="job-head"><span class="job-title">${escapeHtml(h.salaryTitle)}</span></div>
        ${jobFields(`job-${p}`, person.job, view.details.isOpen(`more-job-${p}`))}
      </div>
      ${sideBlock(p)}
    </section>`;
}

function renderInputs(focusId?: string): void {
  const addPartner =
    state.people.length < MAX_PEOPLE
      ? `<button type="button" class="btn-add" data-action="add-person">${escapeHtml(t.common.addPartner)}</button>`
      : "";
  inputs.innerHTML =
    state.people.map((_, p) => personInputs(p)).join("") + addPartner + homeFields(state.home, rules, view.details.isOpen("more-home"));
  if (focusId) document.getElementById(focusId)?.focus();
}

// ---------- answers ----------

function renderResults(): void {
  const people = state.people.map(engineIncome);
  const home = toEngineHome(state.home);
  const total = householdTotal(people, home, rules);
  renderAnswer(total, view);
  renderEach100(total.work);
  // The same household without its own home: what the mortgage changes.
  renderMortgage(total, home.owner ? householdTotal(people, { ...home, owner: null }, rules) : null, view);
  renderToeslagen(total, home, view);
  renderPeople(
    total.work,
    people.map((_, p) => nextSalaryInHousehold(people, home, p, rules)),
    view,
  );
  renderWorthIt(people, home, total, view);
  const sit = sideSituation(
    state.people,
    rules,
    total.work.people.map((p) => p.woning),
  );
  // What the side income costs in toeslagen: the household without any side income, compared to now.
  const lostToeslagen = sit
    ? householdTotal(people.map((person) => ({ ...person, side: null })), home, rules).toeslagen.total - total.toeslagen.total
    : 0;
  renderSideIncome(sit, view, lostToeslagen);
  setMini(miniAnswer(total));
}

function update(): void {
  renderResults();
  saveState(state);
}

/** For typing and dragging: many events, one redraw per frame. */
const updateSoon = oncePerFrame(update);
linkSliders();

// ---------- events ----------

inputs.addEventListener("input", (event) => {
  const el = event.target;
  if (!(el instanceof HTMLInputElement) || el.type === "checkbox") return;
  if (el.dataset.name !== undefined) {
    const p = Number(el.dataset.name);
    personAt(p).name = el.value;
    byId(`person-${p}-name`).textContent = h.personTitle(view.who(p));
    updateSoon();
  } else if (handleJobInput(event, findJob) || handleSideInput(event, findSide) || handleHomeInput(event, state.home)) {
    updateSoon();
  }
});

inputs.addEventListener("change", (event) => {
  const el = event.target;
  const home = handleHomeChange(event, state.home, rules);
  if (home === "redraw") renderInputs(el instanceof HTMLElement ? el.id : undefined);
  if (home) {
    update();
    return;
  }
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
  const c = Number(button.dataset.c);
  const child = state.home.children[c];
  let focusId: string | undefined;
  switch (button.dataset.action) {
    case "add-child":
      state.home.children.push(newChild());
      focusId = `child-${state.home.children.length - 1}-age`;
      break;
    case "remove-child":
      state.home.children.splice(c, 1);
      break;
    case "add-care":
      if (child) child.care = newCare(rules);
      focusId = `child-${c}-hours`;
      break;
    case "remove-care":
      if (child) child.care = null;
      focusId = `child-${c}-age`;
      break;
    case "add-rent":
      state.home.rent = "";
      focusId = "home-rent";
      break;
    case "remove-rent":
      state.home.rent = null;
      break;
    case "add-mortgage":
      state.home.mortgage = newMortgage();
      focusId = "home-woz";
      break;
    case "remove-mortgage":
      state.home.mortgage = null;
      break;
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
