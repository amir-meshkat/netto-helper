import "../../ui/styles.css";
import "./landing.css";
import { personNetto } from "../../engine/person";
import { t } from "../../i18n";
import { getRules } from "../../rules";
import { byId, escapeHtml, withAmount } from "../../ui/dom";
import { euros } from "../../ui/format";
import { initPage } from "../../ui/page";
import { parseNumber } from "../../ui/parse";
import { newJob, toEngineJob } from "../../ui/job-input";
import { loadState, saveState } from "../household/state";

const rules = getRules(2026);
const l = t.landing;
/** Tools that exist already, with their relative link. The others show "Coming soon". */
const LIVE_TOOLS: Record<string, string> = { household: "household/", "side-income": "side-income/" };

initPage();

// The quick answer shares its salary with the household page, so clicking through keeps what you typed.
const state = loadState();
const firstPerson = state.people[0];
const firstJob = firstPerson?.job ?? newJob("3000");

byId("hero").innerHTML = `
  <h1 class="page-title">${escapeHtml(l.title)}</h1>
  <p class="page-intro">${escapeHtml(l.intro)}</p>
  <div class="quick">
    <div class="field">
      <label class="field-label" for="quick-gross">${escapeHtml(l.quickLabel)}</label>
      <div class="input-unit input-euro input-big">
        <input type="text" inputmode="decimal" autocomplete="off" id="quick-gross" value="${escapeHtml(firstJob.monthly)}">
        <span class="unit" aria-hidden="true">€</span>
      </div>
    </div>
    <div id="quick-answer" aria-live="polite"></div>
  </div>`;

function renderQuick(): void {
  const job = toEngineJob(firstJob);
  const el = byId("quick-answer");
  if (job.monthlyGross <= 0) {
    el.innerHTML = `<p class="answer-empty">${escapeHtml(t.household.answerEmpty)}</p>`;
    return;
  }
  const netto = personNetto([job], rules).netto;
  const amount = `<strong class="answer-amount">${escapeHtml(euros(netto / 12))}</strong>`;
  el.innerHTML = `
    <p class="answer">${withAmount(l.quickAnswer, amount)}</p>
    <p class="answer-sub">${escapeHtml(l.quickNote)} <a href="${LIVE_TOOLS.household}">${escapeHtml(l.quickMore)}</a></p>`;
}

byId<HTMLInputElement>("quick-gross").addEventListener("input", (event) => {
  const value = (event.target as HTMLInputElement).value;
  firstJob.monthly = value;
  (event.target as HTMLInputElement).setAttribute("aria-invalid", String(value.trim() !== "" && parseNumber(value) === null));
  renderQuick();
  if (firstPerson) saveState(state);
});

byId("tools").innerHTML = `
  <h2 class="section-title">${escapeHtml(l.toolsTitle)}</h2>
  <div class="tools">
    ${l.tools
      .map((tool) => {
        const href = LIVE_TOOLS[tool.id];
        const inner = `
          <h3>${escapeHtml(tool.question)}</h3>
          <p>${escapeHtml(tool.text)}</p>
          <span class="tool-cta">${escapeHtml(href ? t.common.open : t.common.comingSoon)}</span>`;
        return href
          ? `<a class="card tool tool-live" href="${href}">${inner}</a>`
          : `<div class="card tool tool-soon">${inner}</div>`;
      })
      .join("")}
  </div>`;

renderQuick();
