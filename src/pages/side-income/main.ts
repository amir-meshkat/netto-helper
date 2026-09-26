import "../../ui/styles.css";
import "../../ui/tool.css";
import { businessProfit, type SideIncome } from "../../engine/business";
import { keptOfNext } from "../../engine/marginal";
import { jobYear, type Job } from "../../engine/person";
import { sideIncomeCurve, sideIncomeValue, type SideIncomeValue } from "../../engine/side-income";
import { t, type Who } from "../../i18n";
import { getRules } from "../../rules";
import { legend, stackedBar } from "../../ui/components";
import { byId, escapeHtml, rememberOpenDetails, withAmount } from "../../ui/dom";
import { floatingAnswer } from "../../ui/floating-answer";
import { euros, eurosCents } from "../../ui/format";
import { handleJobInput, handlePensionModeChange, jobFields } from "../../ui/job-form";
import { newJob, toEngineJob, type JobInput } from "../../ui/job-input";
import { renderLineChart, type ChartSeries } from "../../ui/line-chart";
import { initPage } from "../../ui/page";
import { handleSideInput, sideFields } from "../../ui/side-form";
import { toEngineSide } from "../../ui/side-input";
import { niceTicks } from "../../ui/ticks";
import { makeWho } from "../../ui/who";
import { MAX_PARTNERS, loadState, saveState } from "./state";

const rules = getRules(2026);
const s = t.sideIncome;
const state = loadState();
const details = rememberOpenDetails();
const COLORS = ["var(--person-a)", "var(--person-b)"];
/** A difference below this many euros per month is "it hardly matters". */
const HARDLY_MATTERS = 5;

initPage({
  title: s.title,
  homeHref: "../index.html",
  notes: [
    [s.notesSideTitle, s.notesSide],
    [s.toeslagenTitle, s.toeslagen],
    [t.common.couplesTitle, t.common.couples],
  ],
});
byId("page-title").textContent = s.title;
byId("page-intro").textContent = s.intro;
byId("inputs-title").textContent = s.inputsTitle;
byId("chart-title").textContent = s.chartTitle;
byId("table-toggle").textContent = s.tableToggle;

const inputs = byId("inputs");
const setMini = floatingAnswer(byId("answer-card"), byId<HTMLButtonElement>("mini"));

const who = (i: number): Who => makeWho(state.partners[i]?.name ?? "", i);
/** Job ids are "main-0" and "main-1"; the side income id is "side". */
const findJob = (jobId: string): JobInput | undefined => state.partners[Number(jobId.replace("main-", ""))]?.main;
const findSide = (sideId: string) => (sideId === "side" ? state.side : undefined);

// ---------- inputs ----------

function renderInputs(focusId?: string): void {
  const partners = state.partners
    .map((partner, i) => {
      const remove =
        i > 0
          ? `<button type="button" class="btn-link" data-action="remove-partner">${escapeHtml(t.common.removePartner)}</button>`
          : "";
      return `
      <section class="person-input" aria-labelledby="partner-${i}-title">
        <div class="person-head">
          <h3 id="partner-${i}-title"><span class="dot dot-${i}" aria-hidden="true"></span><span id="partner-${i}-name">${escapeHtml(who(i).name)}</span></h3>
          ${remove}
        </div>
        <div class="field">
          <label class="field-label" for="name-${i}">${escapeHtml(t.common.nameLabel)} <span class="nl">(${escapeHtml(t.common.nameHint)})</span></label>
          <input type="text" id="name-${i}" data-name="${i}" value="${escapeHtml(partner.name)}"
            placeholder="${escapeHtml(i === 0 ? t.common.you : t.common.partner)}" autocomplete="off" maxlength="30">
        </div>
        <div class="job">
          <div class="job-head"><span class="job-title">${escapeHtml(s.salaryTitle)}</span></div>
          ${jobFields(`main-${i}`, partner.main, details.isOpen(`more-main-${i}`))}
        </div>
      </section>`;
    })
    .join("");
  const addPartner =
    state.partners.length < MAX_PARTNERS
      ? `<button type="button" class="btn-add" data-action="add-partner">${escapeHtml(s.addPartner)}</button>`
      : "";
  const side = `
    <section class="inputs-section person-input" aria-labelledby="side-title">
      <div class="person-head"><h3 id="side-title">${escapeHtml(s.sideTitle)}</h3></div>
      <div class="job side">${sideFields("side", state.side, details.isOpen("more-side"))}</div>
    </section>`;
  inputs.innerHTML = partners + addPartner + side;
  if (focusId) document.getElementById(focusId)?.focus();
}

// ---------- results ----------

interface Situation {
  side: SideIncome;
  mains: Job[];
  values: SideIncomeValue[];
  two: boolean;
  /** Index of the partner who keeps more; null for one person, or when it hardly matters. */
  better: number | null;
  /** Extra netto per month when the better partner earns it. */
  difference: number;
}

function compute(): Situation {
  const side = toEngineSide(state.side);
  const mains = state.partners.map((partner) => toEngineJob(partner.main));
  const values = mains.map((main) => sideIncomeValue([main], side, rules));
  const two = values.length > 1;
  const keptA = (values[0]?.kept ?? 0) / 12;
  const keptB = (values[1]?.kept ?? 0) / 12;
  const difference = Math.abs(keptA - keptB);
  const better = !two || difference < HARDLY_MATTERS ? null : keptB > keptA ? 1 : 0;
  return { side, mains, values, two, better, difference };
}

/** People in display order: the better one first. */
const order = (sit: Situation) => (sit.better === 1 ? [1, 0] : sit.values.map((_, i) => i));
const perMonth = (sit: Situation, i: number, pick: (v: SideIncomeValue) => number) => {
  const value = sit.values[i];
  return value ? pick(value) / 12 : 0;
};
const keptPerMonth = (sit: Situation, i: number) => perMonth(sit, i, (v) => v.kept);
const averageKept = (sit: Situation) => sit.values.reduce((sum, v) => sum + v.kept, 0) / sit.values.length / 12;

function renderAnswer(sit: Situation): void {
  const el = byId("answer");
  const big = (amount: number) => `<strong class="answer-amount">${escapeHtml(euros(amount))}</strong>`;
  if (!sit.two) {
    const value = sit.values[0];
    if (!value) return;
    el.innerHTML = `
      <p class="eyebrow">${escapeHtml(s.answerLabelOne)}</p>
      <p class="answer">${withAmount(s.answerOne(who(0)), big(value.kept / 12))}</p>
      <p class="answer-sub">${escapeHtml(s.answerOneSub(euros(value.profit), euros(value.kept)))}</p>
      <p class="note">${escapeHtml(s.setAsideOne(euros(value.setAside / 12)))}</p>`;
    return;
  }
  if (sit.better === null) {
    el.innerHTML = `
      <p class="eyebrow">${escapeHtml(s.answerLabelTwo)}</p>
      <p class="answer">${withAmount(s.answerEither, big(averageKept(sit)))}</p>`;
    return;
  }
  const [first = 0, other = 1] = order(sit);
  el.innerHTML = `
    <p class="eyebrow">${escapeHtml(s.answerLabelTwo)}</p>
    <p class="answer">${withAmount(s.answerBetter(who(first), who(other)), big(sit.difference))}</p>
    <p class="answer-sub">${escapeHtml(
      s.answerTwoSub(who(first), euros(keptPerMonth(sit, first)), who(other), euros(keptPerMonth(sit, other))),
    )}</p>`;
}

function whyTable(sit: Situation): string {
  const deductions = businessProfit(sit.side, rules).deductions;
  const cells = (pick: (v: SideIncomeValue) => number) =>
    sit.values.map((v) => `<td>${escapeHtml(euros(pick(v)))}</td>`).join("");
  const row = (label: string, pick: (v: SideIncomeValue) => number, cls = "") =>
    `<tr${cls ? ` class="${cls}"` : ""}><td>${escapeHtml(label)}</td>${cells(pick)}</tr>`;
  const rows = [
    row(s.whyProfit, (v) => v.profit),
    ...(deductions > 0 ? [row(s.whyDeductions, () => deductions, "sub")] : []),
    row(s.whyExtraTax, (v) => v.extraTax, "sub"),
    row(s.whyZvw, (v) => v.zvw, "sub"),
    row(s.whyKept, (v) => v.kept, "sum"),
    row(s.whyKeptMonth, (v) => v.kept / 12),
    row(s.whySetAsideMonth, (v) => v.setAside / 12),
  ];
  const heads = sit.values.map((_, i) => `<th>${escapeHtml(who(i).name)}</th>`).join("");
  return `
    <table class="why-table cols-3">
      <thead><tr><th></th>${heads}</tr></thead>
      <tbody>${rows.join("")}</tbody>
    </table>
    <ol class="why-steps">${s.whySteps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>`;
}

function renderReason(sit: Situation): void {
  const rows = order(sit)
    .map((i) => {
      const v = sit.values[i];
      if (!v) return "";
      const bar = stackedBar(
        [
          { tone: "netto", value: v.kept },
          { tone: "tax", value: v.setAside },
        ],
        `${s.legendKept} ${euros(v.kept / 12)}, ${s.legendSetAside} ${euros(v.setAside / 12)}`,
      );
      return `
        <li class="${sit.better === i ? "best" : ""}">
          <div class="compare-label"><span class="dot dot-${i}" aria-hidden="true"></span>${escapeHtml(
            s.rowKeeps(who(i), euros(v.kept / 12), euros(v.profit / 12)),
          )}</div>
          ${bar}
        </li>`;
    })
    .join("");
  const keys = legend(
    [
      { tone: "netto", label: s.legendKept },
      { tone: "tax", label: s.legendSetAside },
    ],
    true,
  );
  const next100 = sit.mains.map((main) => eurosCents(keptOfNext(jobYear(main).taxable, rules)));
  const why = sit.two
    ? s.reasonWhy(who(0), next100[0] ?? "", who(1), next100[1] ?? "")
    : s.reasonWhyOne(who(0), next100[0] ?? "");
  const householdIf = sit.two
    ? `<ul class="card-notes">${order(sit)
        .map((i) => {
          const earns = sit.values[i];
          const other = sit.values[1 - i];
          if (!earns || !other) return "";
          return `<li>${escapeHtml(s.householdIf(who(i), euros((earns.nettoWith + other.nettoWithout) / 12)))}</li>`;
        })
        .join("")}</ul>`
    : "";
  byId("reason").innerHTML = `
    <h2>${escapeHtml(s.reasonTitle)}</h2>
    <ul class="compare">${rows}</ul>
    <div class="legend-row">${keys}</div>
    <p class="small muted">${escapeHtml(why)}</p>
    ${householdIf}
    <details class="why" data-key="why"${details.openIf("why")}>
      <summary>${escapeHtml(t.common.showWhy)}</summary>
      ${whyTable(sit)}
    </details>`;
}

function renderChart(sit: Situation): void {
  const profitPerMonth = (sit.values[0]?.profit ?? 0) / 12;
  const highest = Math.max(...sit.mains.map((m) => m.monthlyGross));
  const xMax = niceTicks(Math.max(6_000, highest * 1.3)).at(-1) ?? 6_000;
  const steps = 120;
  const xs = Array.from({ length: steps + 1 }, (_, k) => (k / steps) * xMax);

  // One curve when everyone's salary has the same holiday pay and pension, otherwise one per person.
  const [mainA = toEngineJob(newJob()), mainB] = sit.mains;
  const sameSettings = !mainB || JSON.stringify({ ...mainA, monthlyGross: 0 }) === JSON.stringify({ ...mainB, monthlyGross: 0 });
  const toSeries = (main: Job, label: string, color: string): ChartSeries => ({
    label,
    color,
    points: sideIncomeCurve(main, sit.side, xs, rules).map((p) => ({ x: p.monthlyGross, y: p.kept / 12 })),
  });
  const series =
    sameSettings || !mainB
      ? [toSeries(mainA, s.chartY, "var(--muted)")]
      : [toSeries(mainA, who(0).name, COLORS[0] ?? ""), toSeries(mainB, who(1).name, COLORS[1] ?? "")];

  byId("chart-sub").textContent = s.chartSub(euros(profitPerMonth), sit.two);
  byId("chart-legend").innerHTML = sameSettings
    ? ""
    : series
        .map((line, i) => `<li><span class="line-key" style="background:${line.color}"></span>${escapeHtml(s.chartSettingsOf(who(i)))}</li>`)
        .join("");

  const markerLabel = (i: number) => `${who(i).name} ${euros(keptPerMonth(sit, i))}`;
  renderLineChart(byId("chart"), {
    series,
    markers: sit.mains.map((main, i) => ({
      x: main.monthlyGross,
      y: keptPerMonth(sit, i),
      label: markerLabel(i),
      color: COLORS[i] ?? "",
    })),
    reference: { y: profitPerMonth, label: s.chartWhole(euros(profitPerMonth)) },
    xTitle: s.chartX,
    yTitle: s.chartY,
    xMax,
    yMax: profitPerMonth,
    formatX: euros,
    formatY: euros,
    description: s.chartDescription(sit.mains.map((_, i) => `${markerLabel(i)}.`).join(" ")),
    tooltipHead: (x) => s.chartTooltipMain(euros(x)),
    tooltipValue: s.chartTooltipKept,
  });

  // The same numbers as a table, for screen readers and anyone who prefers numbers.
  const tableStep = xMax > 10_000 ? 1_000 : 500;
  const mains = sameSettings || !mainB ? [mainA] : [mainA, mainB];
  const tableRows = [];
  for (let x = 0; x <= xMax; x += tableStep) {
    const cells = mains
      .map((main) => `<td>${escapeHtml(euros(sideIncomeValue([{ ...main, monthlyGross: x }], sit.side, rules).kept / 12))}</td>`)
      .join("");
    tableRows.push(`<tr><td>${escapeHtml(euros(x))}</td>${cells}</tr>`);
  }
  const heads =
    mains.length === 1
      ? `<th>${escapeHtml(s.tableKept)}</th>`
      : series.map((line) => `<th>${escapeHtml(`${s.tableKept} (${line.label})`)}</th>`).join("");
  byId("chart-table").innerHTML = `
    <table class="data-table">
      <thead><tr><th>${escapeHtml(s.tableMain)}</th>${heads}</tr></thead>
      <tbody>${tableRows.join("")}</tbody>
    </table>`;
}

/** Nothing is withheld on side income: how much to set aside, for each option. */
function renderSetAside(sit: Situation): void {
  const lines = order(sit)
    .map((i) => {
      const v = sit.values[i];
      if (!v) return "";
      const text = s.setAsideLine(sit.two ? who(i) : null, euros(v.setAside / 12), euros(v.extraTax / 12), euros(v.zvw / 12));
      return `<li>${escapeHtml(text)}</li>`;
    })
    .join("");
  byId("set-aside").innerHTML = `
    <h2>${escapeHtml(s.setAsideTitle)}</h2>
    <p class="card-sub">${escapeHtml(s.setAsideIntro)}</p>
    <ul class="card-notes">${lines}</ul>`;
}

function renderResults(): void {
  const sit = compute();
  const hasProfit = (sit.values[0]?.profit ?? 0) > 0;
  byId("results").hidden = !hasProfit;
  if (!hasProfit) {
    byId("answer").innerHTML = `<p class="answer-empty">${escapeHtml(s.answerEmpty)}</p>`;
    setMini(null);
    return;
  }
  renderAnswer(sit);
  renderReason(sit);
  renderChart(sit);
  renderSetAside(sit);
  const [first = 0] = order(sit);
  const one = sit.values[0];
  const pill = !sit.two
    ? s.pillOne(euros((one?.kept ?? 0) / 12), euros((one?.setAside ?? 0) / 12))
    : sit.better === null
      ? s.pillEither(euros(averageKept(sit)))
      : s.pillBetter(who(first), euros(sit.difference));
  setMini(`<span>${escapeHtml(pill)}</span>`);
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
    const i = Number(el.dataset.name);
    const partner = state.partners[i];
    if (!partner) return;
    partner.name = el.value;
    byId(`partner-${i}-name`).textContent = who(i).name;
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
  if (button.dataset.action === "add-partner" && state.partners.length < MAX_PARTNERS) {
    state.partners.push({ name: "", main: newJob("") });
    renderInputs("main-1-monthly");
  } else if (button.dataset.action === "remove-partner") {
    state.partners.splice(1);
    renderInputs("main-0-monthly");
  } else {
    return;
  }
  update();
});

renderInputs();
renderResults();
