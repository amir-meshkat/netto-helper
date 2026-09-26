import type { Home, HouseholdTotal, PersonIncome } from "../engine/household";
import { curveCliffs, nextHundredAcross, nextHundredCurve, nextSalaryInHousehold, type CurveCliff, type NextHundredPoint, type NextSalary } from "../engine/marginal";
import { t } from "../i18n";
import { renderAreaChart } from "../ui/area-chart";
import { legend } from "../ui/components";
import { byId, escapeHtml, withAmount } from "../ui/dom";
import { euros, eurosCents, percent } from "../ui/format";
import { niceTicks } from "../ui/ticks";
import type { View } from "./view";

// "Is working more worth it?": of the next €100 of salary, at every salary, as a stacked area of what is
// kept, what goes to income tax and what is lost in toeslagen, with a dot where the person is now.
// For a couple one person's salary moves and the other stays; a toggle picks whose.

const w = t.worthIt;
const h = t.household;
const nl = t.toeslagen.namesNl;
const PERSON_COLORS = ["var(--person-a)", "var(--person-b)"];
/** Even steps along the salary axis, plus the places where a rate changes: smooth, and quick enough to redraw while dragging. */
const SAMPLES = 160;

/** Whose salary goes up, for a couple. Kept while the page is open, not saved. */
let chosen = 0;

interface Curve {
  key: string;
  points: NextHundredPoint[];
  cliffs: CurveCliff[];
  table: NextHundredPoint[];
}
let cache: Curve | null = null;

/**
 * The curve for person p. It sets p's salary itself, so p's own salary is not part of the cache key:
 * dragging it only moves the dot.
 */
function curveFor(people: PersonIncome[], home: Home, p: number, xMax: number, view: View): Curve {
  const without = people.map((person, i) =>
    i === p ? { ...person, jobs: person.jobs.map((job, j) => (j === 0 ? { ...job, monthlyGross: 0 } : job)) } : person,
  );
  const key = JSON.stringify([without, home, p, xMax]);
  if (cache?.key === key) return cache;
  const points = nextHundredAcross(people, home, p, xMax, SAMPLES, view.rules);
  const tableStep = xMax > 10_000 ? 1_000 : 500;
  const tableXs = Array.from({ length: Math.floor(xMax / tableStep) + 1 }, (_, k) => k * tableStep);
  cache = {
    key,
    points,
    cliffs: curveCliffs(points, home, people.length > 1, view.rules),
    table: nextHundredCurve(people, home, p, tableXs, view.rules),
  };
  return cache;
}

/** The first stretch of salaries where earning more leaves less, not counting the steps: [from, to], or null. */
function lessRange(points: NextHundredPoint[]): [number, number] | null {
  const start = points.findIndex((pt) => pt.kept + pt.fromSteps < 0);
  if (start < 0) return null;
  const end = points.findIndex((pt, k) => k > start && pt.kept + pt.fromSteps >= 0);
  const last = points[end < 0 ? points.length - 1 : end - 1];
  return [points[start]?.monthlyGross ?? 0, last?.monthlyGross ?? 0];
}

const small = (text: string) => `<p class="small muted">${escapeHtml(text)}</p>`;

/**
 * The answer first, with the same number as the person card: the real next €100. Then how it goes at
 * other salaries, and, with childcare, the average the chart shows.
 */
function answer(next: NextSalary, here: NextHundredPoint, curve: Curve, p: number, two: boolean, xMax: number, view: View): string {
  const who = view.who(p);
  const sentence = next.kept >= 0 ? w.answerYes(who, two) : w.answerNo(who, two);
  const amount = `<strong>${escapeHtml(eurosCents(Math.abs(next.kept)))}</strong>`;
  const kept = curve.points.map((pt) => pt.kept);
  const low = Math.min(...kept);
  const less = lessRange(curve.points);
  const range = low >= 0 ? w.range(euros(xMax), euros(low), euros(Math.max(...kept)), two) : "";
  const overall = less ? "" : curve.cliffs.length === 0 ? w.alwaysMore : w.mostlyMore;
  return `
    <p class="section-answer">${withAmount(sentence, amount)}</p>
    ${range || overall ? small(`${range} ${overall}`.trim()) : ""}
    ${here.fromSteps >= 0.5 ? small(w.stepsAverage(eurosCents(here.fromSteps), eurosCents(here.kept), two)) : ""}
    ${less ? `<p class="note">${escapeHtml(w.lessBetween(euros(less[0]), euros(less[1])))}</p>` : ""}`;
}

/** For a couple: whose salary goes up. Built again only when the names change, so focus stays on the chosen option. */
function renderWhose(people: PersonIncome[], view: View): void {
  const box = byId("worth-whose");
  box.hidden = people.length < 2;
  if (box.hidden) return;
  const options = byId("worth-whose-options");
  const names = people.map((_, p) => view.who(p).name);
  const key = JSON.stringify(names);
  if (options.dataset.key !== key) {
    options.dataset.key = key;
    options.innerHTML = names
      .map((name, p) => `<label><input type="radio" name="worth-whose" value="${p}"><span>${escapeHtml(name)}</span></label>`)
      .join("");
  }
  options.querySelectorAll("input").forEach((input) => {
    input.checked = Number(input.value) === chosen;
  });
}

/** The rules behind the chart in words, the places where a toeslag drops at once, and the numbers as a table. */
function why(curve: Curve, people: PersonIncome[], home: Home, p: number, view: View): string {
  const { rules } = view;
  const two = people.length > 1;
  const z = rules.toeslagen;
  const one = !two && home.children.length === 0;
  const gradual = [
    w.whyToeslag(nl.zorgtoeslag, percent(z.zorgtoeslag.normpremieRate)),
    ...(home.children.length > 0 ? [w.whyToeslag(nl.kindgebondenBudget, percent(z.kindgebondenBudget.phaseOutRate))] : []),
    ...(home.rent !== null ? [w.whyToeslag(nl.huurtoeslag, percent(one ? z.huurtoeslag.phaseOutRate.one : z.huurtoeslag.phaseOutRate.more))] : []),
  ];

  const zorg = curve.cliffs.filter((c) => c.toeslag === "zorgtoeslag");
  const steps = curve.cliffs.filter((c) => c.toeslag === "kinderopvang");
  const losses = steps.map((c) => c.loss);
  const cliffs = [
    ...zorg.map((c) => w.whyZorgCliff(euros(c.monthlyGross), euros(c.loss))),
    ...(steps.length > 0
      ? [
          w.whySteps(
            steps.length,
            euros(steps[0]?.monthlyGross ?? 0),
            euros(steps.at(-1)?.monthlyGross ?? 0),
            euros(Math.min(...losses)),
            euros(Math.max(...losses)),
          ),
        ]
      : []),
  ];

  const anyToeslag = curve.table.some((pt) => pt.lostToeslagen >= 0.005);
  const rows = curve.table
    .map(
      (pt) =>
        `<tr><td>${escapeHtml(euros(pt.monthlyGross))}</td><td>${escapeHtml(eurosCents(pt.kept))}</td><td>${escapeHtml(eurosCents(pt.tax))}</td>${
          anyToeslag ? `<td>${escapeHtml(eurosCents(pt.lostToeslagen))}</td>` : ""
        }<td>${escapeHtml(euros(pt.total / 12))}</td></tr>`,
    )
    .join("");
  const heads = [w.tableSalary, w.tableKept, w.tableTax, ...(anyToeslag ? [w.tableToeslagen] : []), w.tableTotal];
  return `
    <p class="small">${escapeHtml(w.whyIntro(view.who(p), two ? view.who(1 - p) : null))}</p>
    <p class="small">${escapeHtml(w.whyTax)}</p>
    <p class="small">${escapeHtml(w.whyToeslagen(gradual.join(", ")))}</p>
    ${
      cliffs.length > 0
        ? `<p class="small"><strong>${escapeHtml(w.whyCliffs)}</strong></p><ul class="card-notes">${cliffs.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>`
        : ""
    }
    <table class="data-table">
      <thead><tr>${heads.map((head) => `<th>${escapeHtml(head)}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/** Texts that never change, and the toggle for whose salary goes up. Call once. */
export function initWorthIt(redraw: () => void): void {
  byId("worth-title").textContent = w.title;
  byId("worth-whose-title").textContent = w.whoseTitle;
  byId("worth-why-toggle").textContent = t.common.showWhy;
  byId("worth-whose").addEventListener("change", (event) => {
    const el = event.target;
    if (!(el instanceof HTMLInputElement)) return;
    chosen = Number(el.value);
    redraw();
  });
}

/** Shows the section once there is income, with the chart for the chosen person's salary. */
export function renderWorthIt(people: PersonIncome[], home: Home, total: HouseholdTotal, view: View): void {
  const el = byId("worth-it");
  el.hidden = total.work.gross + total.work.profit <= 0;
  if (el.hidden) return;
  if (chosen >= people.length) chosen = 0;
  const p = chosen;
  const two = people.length > 1;
  const who = view.who(p);
  const salary = people[p]?.jobs[0]?.monthlyGross ?? 0;
  const xMax = niceTicks(Math.max(6_000, salary * 1.3)).at(-1) ?? 6_000;
  const curve = curveFor(people, home, p, xMax, view);
  const [here] = nextHundredCurve(people, home, p, [salary], view.rules);
  if (!here) return;

  renderWhose(people, view);
  const next = nextSalaryInHousehold(people, home, p, view.rules);
  byId("worth-answer").innerHTML = answer(next, here, curve, p, two, xMax, view);
  const other = two ? 1 - p : null;
  byId("worth-sub").textContent = w.chartSub(
    other === null ? null : view.who(other),
    euros(other === null ? 0 : (people[other]?.jobs[0]?.monthlyGross ?? 0)),
  );

  const anyToeslag = curve.points.some((pt) => pt.lostToeslagen >= 0.005);
  const keys = legend(
    [
      { tone: "netto", label: h.legendKept },
      { tone: "tax", label: h.legendTax },
      ...(anyToeslag ? [{ tone: "toeslag" as const, label: h.legendToeslag }] : []),
    ],
    true,
  );
  const tickKey = curve.cliffs.length > 0 ? `<li><span class="tick-key" aria-hidden="true"></span><span>${escapeHtml(w.legendStep)}</span></li>` : "";
  byId("worth-legend").innerHTML = keys.replace("</ul>", `${tickKey}</ul>`);

  const { points } = curve;
  const ofNext = eurosCents(here.kept);
  renderAreaChart(byId("worth-chart"), {
    xs: points.map((pt) => pt.monthlyGross),
    layers: [
      { label: h.legendKept, color: "var(--netto)", opacity: 0.85, values: points.map((pt) => pt.kept) },
      { label: h.legendTax, color: "var(--tax)", opacity: 0.45, values: points.map((pt) => pt.tax) },
      { label: h.legendToeslag, color: "var(--toeslag)", opacity: 0.55, values: points.map((pt) => pt.lostToeslagen) },
    ],
    markers: [{ x: salary, y: Math.max(0, here.kept), label: w.marker(who, ofNext), color: PERSON_COLORS[p] ?? "" }],
    ticks: curve.cliffs.map((c) => ({ x: c.monthlyGross, color: "var(--toeslag)" })),
    xTitle: w.chartX,
    yTitle: w.chartY,
    xMax,
    yMax: Math.max(100, ...points.map((pt) => Math.max(0, pt.kept) + pt.tax + pt.lostToeslagen)),
    formatX: euros,
    formatY: euros,
    description: w.description(who, ofNext),
    tooltip: (index) => {
      const pt = points[index];
      if (!pt) return { head: "", rows: [], notes: [] };
      const next = curve.cliffs.find((c) => c.monthlyGross > pt.monthlyGross);
      return {
        head: w.tooltipHead(euros(pt.monthlyGross)),
        rows: [
          { color: "var(--netto)", value: eurosCents(pt.kept), label: h.legendKept },
          { color: "var(--tax)", value: eurosCents(pt.tax), label: h.legendTax },
          ...(anyToeslag ? [{ color: "var(--toeslag)", value: eurosCents(pt.lostToeslagen), label: h.legendToeslag }] : []),
        ],
        notes: [
          w.tooltipTotal(euros(pt.total / 12), two),
          ...(pt.fromSteps >= 0.005 ? [w.tooltipSteps(eurosCents(pt.fromSteps))] : []),
          ...(next ? [w.tooltipNext(euros(next.monthlyGross), nl[next.toeslag], euros(next.loss))] : []),
        ],
      };
    },
  });

  byId("worth-why").innerHTML = why(curve, people, home, p, view);
}
