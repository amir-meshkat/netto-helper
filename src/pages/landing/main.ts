import "../../ui/styles.css";
import "./landing.css";
import { personNetto } from "../../engine/person";
import { t } from "../../i18n";
import { getRules } from "../../rules";
import { byId, escapeHtml, withAmount } from "../../ui/dom";
import { markInvalid, textField } from "../../ui/fields";
import { euros } from "../../ui/format";
import { initPage } from "../../ui/page";
import { JOB_SLIDERS, isInvalidInput, newJob, toEngineJob } from "../../ui/job-input";
import { linkSliders } from "../../ui/slider";
import { loadState, saveState } from "../household/state";

const rules = getRules(2026);
const l = t.landing;
/**
 * Tools that exist already, with their relative link. The others show "Coming soon".
 * Links name index.html, because not every host opens a folder's index page (the preview host may not).
 */
const LIVE_TOOLS: Record<string, string> = {
  household: "household/index.html",
  "side-income": "side-income/index.html",
};

initPage();
linkSliders();

// The quick answer shares its salary with the household page, so clicking through keeps what you typed.
const state = loadState();
const firstPerson = state.people[0];
const firstJob = firstPerson?.job ?? newJob("3000");

byId("hero").innerHTML = `
  <h1 class="page-title">${escapeHtml(l.title)}</h1>
  <p class="page-intro">${escapeHtml(l.intro)}</p>
  <div class="quick">
    ${textField({
      id: "quick-gross",
      value: firstJob.monthly,
      label: l.quickLabel,
      unit: "€",
      big: true,
      invalid: isInvalidInput("monthly", firstJob.monthly),
      data: {},
      slider: JOB_SLIDERS.monthly,
    })}
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
  const el = event.target as HTMLInputElement;
  firstJob.monthly = el.value;
  markInvalid(el, isInvalidInput("monthly", el.value));
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
