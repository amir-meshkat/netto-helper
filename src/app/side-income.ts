import { businessProfit, type SideIncome } from "../engine/business";
import { keptOfNext } from "../engine/marginal";
import { jobYear, type Job } from "../engine/person";
import { sideIncomeCurve, sideIncomeValue, type SideIncomeValue } from "../engine/side-income";
import { t } from "../i18n";
import { legend, stackedBar } from "../ui/components";
import { byId, escapeHtml, withAmount } from "../ui/dom";
import { euros, eurosCents } from "../ui/format";
import { newJob, toEngineJob } from "../ui/job-input";
import { renderLineChart, type ChartSeries } from "../ui/line-chart";
import { niceTicks } from "../ui/ticks";
import { householdIfEarns, type OneSideIncome, type SideSituation } from "./side-situation";
import type { View } from "./view";

// The side income section: what it leaves, how much to set aside, and for a couple who should earn it.
// Shown once someone has side income with a profit.

const s = t.sideIncome;
const COLORS = ["var(--person-a)", "var(--person-b)"];

/** One row of the section: a person, their side income, and what it is worth to them. */
interface Row {
  person: number;
  side: SideIncome;
  value: SideIncomeValue;
}

/** Rows in display order. For one side income and a couple: the person who keeps more first. */
function rows(sit: SideSituation): Row[] {
  if (sit.kind === "each") {
    return sit.owners.flatMap((person, k) => {
      const side = sit.sides[k];
      const value = sit.values[k];
      return side && value ? [{ person, side, value }] : [];
    });
  }
  const order = sit.better === 1 ? [1, 0] : sit.values.map((_, i) => i);
  return order.flatMap((person) => {
    const value = sit.values[person];
    return value ? [{ person, side: sit.side, value }] : [];
  });
}

/** One side income and two people: the section compares who should earn it. */
const isCouple = (sit: SideSituation) => sit.kind === "one" && sit.values.length > 1;
const perMonth = (amount: number) => euros(amount / 12);

/** One sentence in euros, as the first line of the section. */
function answer(sit: SideSituation, view: View): string {
  const strong = (amount: number) => `<strong>${escapeHtml(euros(amount))}</strong>`;
  const line = (sentence: string, amount: number, sub = "") =>
    `<p class="section-answer">${withAmount(sentence, strong(amount))}</p>${sub ? `<p class="small muted">${escapeHtml(sub)}</p>` : ""}`;

  if (sit.kind === "each") {
    return line(s.answerEach, sit.values.reduce((sum, v) => sum + v.kept, 0) / 12);
  }
  if (!isCouple(sit)) {
    const value = sit.values[0];
    return value ? line(s.answerOne(view.who(sit.owner)), value.kept / 12, s.answerOneSub(euros(value.profit), euros(value.kept))) : "";
  }
  if (sit.better === null) {
    return line(s.answerEither, sit.values.reduce((sum, v) => sum + v.kept, 0) / sit.values.length / 12);
  }
  const first = sit.better;
  const other = 1 - first;
  const kept = (i: number) => perMonth(sit.values[i]?.kept ?? 0);
  return line(
    s.answerBetter(view.who(first), view.who(other)),
    sit.difference,
    s.answerTwoSub(view.who(first), kept(first), view.who(other), kept(other)),
  );
}

/** The calculation per column: profit, deductions, extra tax, Zvw, and what is kept and set aside. */
function whyTable(list: Row[], view: View): string {
  const columns = [...list].sort((a, b) => a.person - b.person);
  const cells = (pick: (row: Row) => number) => columns.map((c) => `<td>${escapeHtml(euros(pick(c)))}</td>`).join("");
  const row = (label: string, pick: (row: Row) => number, cls = "") =>
    `<tr${cls ? ` class="${cls}"` : ""}><td>${escapeHtml(label)}</td>${cells(pick)}</tr>`;
  const deductions = (c: Row) => businessProfit(c.side, view.rules).deductions;
  const rowsHtml = [
    row(s.whyProfit, (c) => c.value.profit),
    ...(columns.some((c) => deductions(c) > 0) ? [row(s.whyDeductions, deductions, "sub")] : []),
    row(s.whyExtraTax, (c) => c.value.extraTax, "sub"),
    row(s.whyZvw, (c) => c.value.zvw, "sub"),
    row(s.whyKept, (c) => c.value.kept, "sum"),
    row(s.whyKeptMonth, (c) => c.value.kept / 12),
    row(s.whySetAsideMonth, (c) => c.value.setAside / 12),
  ];
  const heads = columns.map((c) => `<th>${escapeHtml(view.who(c.person).name)}</th>`).join("");
  return `
    <table class="why-table cols-3">
      <thead><tr><th></th>${heads}</tr></thead>
      <tbody>${rowsHtml.join("")}</tbody>
    </table>
    <ol class="why-steps">${s.whySteps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>`;
}

function renderReason(sit: SideSituation, view: View): void {
  const list = rows(sit);
  const couple = isCouple(sit);
  const owner = sit.kind === "one" ? sit.owner : -1;
  const better = sit.kind === "one" ? sit.better : null;
  const bars = list
    .map(({ person, value }) => {
      const label = couple
        ? s.rowIf(view.who(person), person === owner, perMonth(value.kept), perMonth(value.profit))
        : s.rowKeeps(view.who(person), perMonth(value.kept), perMonth(value.profit));
      const bar = stackedBar(
        [
          { tone: "netto", value: value.kept },
          { tone: "tax", value: value.setAside },
        ],
        `${s.legendKept} ${perMonth(value.kept)}, ${s.legendSetAside} ${perMonth(value.setAside)}`,
      );
      const best = couple && better === person;
      return `
        <li class="${best ? "best" : ""}">
          <div class="compare-label"><span class="dot dot-${person}" aria-hidden="true"></span>${escapeHtml(label)}</div>
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

  // Why it differs: the next €100 of salary is taxed differently for each partner.
  let why = "";
  let householdIf = "";
  if (sit.kind === "one") {
    const next100 = sit.mains.map((main) => eurosCents(keptOfNext(jobYear(main).taxable, view.rules)));
    why = couple
      ? s.reasonWhy(view.who(0), next100[0] ?? "", view.who(1), next100[1] ?? "")
      : s.reasonWhyOne(view.who(sit.owner), next100[sit.owner] ?? "");
    if (couple) {
      householdIf = `<ul class="card-notes">${list
        .map(({ person }) => `<li>${escapeHtml(s.householdIf(view.who(person), perMonth(householdIfEarns(sit, person))))}</li>`)
        .join("")}</ul>`;
    }
  }

  byId("side-reason").innerHTML = `
    <h2>${escapeHtml(couple ? s.answerLabelTwo : s.reasonTitle)}</h2>
    ${answer(sit, view)}
    <ul class="compare">${bars}</ul>
    <div class="legend-row">${keys}</div>
    ${why ? `<p class="small muted">${escapeHtml(why)}</p>` : ""}
    ${householdIf}
    <details class="why" data-key="why-side"${view.details.openIf("why-side")}>
      <summary>${escapeHtml(t.common.showWhy)}</summary>
      ${whyTable(list, view)}
    </details>`;
}

/** Nothing is withheld on side income: how much to set aside, for each person or each option. */
function renderSetAside(sit: SideSituation, view: View): void {
  const couple = isCouple(sit);
  const lines = rows(sit)
    .map(({ person, value }) => {
      const amounts = [perMonth(value.setAside), perMonth(value.extraTax), perMonth(value.zvw)] as const;
      const text =
        sit.kind === "each"
          ? s.setAsideOwn(view.who(person), ...amounts)
          : s.setAsideLine(couple ? view.who(person) : null, ...amounts);
      return `<li>${escapeHtml(text)}</li>`;
    })
    .join("");
  byId("side-aside").innerHTML = `
    <h2>${escapeHtml(s.setAsideTitle)}</h2>
    <p class="card-sub">${escapeHtml(s.setAsideIntro)}</p>
    <ul class="card-notes">${lines}</ul>`;
}

/** What the side income leaves at every salary, with a dot for where each person is now. */
function renderChart(sit: OneSideIncome, view: View): void {
  const { rules } = view;
  const couple = isCouple(sit);
  const kept = (i: number) => (sit.values[i]?.kept ?? 0) / 12;
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
      : [toSeries(mainA, view.who(0).name, COLORS[0] ?? ""), toSeries(mainB, view.who(1).name, COLORS[1] ?? "")];

  byId("chart-sub").textContent = s.chartSub(euros(profitPerMonth), couple);
  byId("chart-legend").innerHTML = sameSettings
    ? ""
    : series
        .map((line, i) => `<li><span class="line-key" style="background:${line.color}"></span>${escapeHtml(s.chartSettingsOf(view.who(i)))}</li>`)
        .join("");

  const markerLabel = (i: number) => `${view.who(i).name} ${euros(kept(i))}`;
  renderLineChart(byId("chart"), {
    series,
    markers: sit.mains.map((main, i) => ({ x: main.monthlyGross, y: kept(i), label: markerLabel(i), color: COLORS[i] ?? "" })),
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

/** Texts that never change. Call once. */
export function initSideIncome(): void {
  byId("chart-title").textContent = s.chartTitle;
  byId("table-toggle").textContent = s.tableToggle;
}

/** Shows the section when someone has side income with a profit, and hides it otherwise. */
export function renderSideIncome(sit: SideSituation | null, view: View): void {
  byId("side-income").hidden = sit === null;
  if (!sit) return;
  renderReason(sit, view);
  renderSetAside(sit, view);
  // The chart compares salaries for one side income; with two, there is nothing to put on one line.
  byId("side-chart-card").hidden = sit.kind !== "one";
  if (sit.kind === "one") renderChart(sit, view);
}
