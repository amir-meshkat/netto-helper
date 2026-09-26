import type { Home, HouseholdTotal, PersonIncome } from "../engine/household";
import { lijfrenteWhatIf, type LijfrenteWhatIf } from "../engine/lijfrente";
import { t } from "../i18n";
import { legend, stackedBar } from "../ui/components";
import { byId, escapeHtml, withAmount } from "../ui/dom";
import { markInvalid, textField } from "../ui/fields";
import { euros, percent } from "../ui/format";
import { parseNumber } from "../ui/parse";
import type { SliderRange } from "../ui/slider-range";
import type { HouseholdState } from "./state";
import type { View } from "./view";

// "What could lower your tax?": options a person could choose, worked out on the situation typed, without
// changing the answers above. The first option is a lijfrente. See docs/lijfrente-2026.md.

const s = t.lowerTax;
const l = s.lijfrente;

/** Until something is typed, the section works out this example amount per year. */
export const EXAMPLE_DEPOSIT = "1000";
/** Below this many euros a year, it hardly matters which partner puts it in. */
const HARDLY_MATTERS = 5;

const DEPOSIT_SLIDER: SliderRange = { min: 0, max: 36_000, step: 100 };
const FACTOR_A_SLIDER: SliderRange = { min: 0, max: 10_000, step: 10 };

const amount = (text: string) => Math.max(0, parseNumber(text) ?? 0);
const isInvalid = (text: string) => text.trim() !== "" && parseNumber(text) === null;

/** The deposit and each person's factor A. Built again only when the people or their names change. */
function renderControls(state: HouseholdState, view: View): void {
  const box = byId("lijfrente-controls");
  const two = state.people.length > 1;
  const key = JSON.stringify(state.people.map((_, p) => view.who(p).name));
  if (box.dataset.key === key) return;
  box.dataset.key = key;
  const deposit = state.lijfrente ?? EXAMPLE_DEPOSIT;
  const factorFields = state.people
    .map((person, p) =>
      textField({
        id: `factor-a-${p}`,
        value: person.factorA ?? "",
        label: l.factorA(two ? view.who(p) : null),
        unit: "",
        invalid: isInvalid(person.factorA ?? ""),
        data: { "factor-a": String(p) },
        slider: FACTOR_A_SLIDER,
      }),
    )
    .join("");
  box.innerHTML = `
    ${textField({ id: "lijfrente-deposit", value: deposit, label: l.deposit, nl: l.depositNl, unit: "€", invalid: isInvalid(deposit), data: { lijfrente: "deposit" }, slider: DEPOSIT_SLIDER })}
    <details class="more" data-key="more-factor-a"${view.details.openIf("more-factor-a")}>
      <summary>${escapeHtml(l.factorAMore)}<span class="details-now" id="factor-a-now">${escapeHtml(factorANow(state))}</span></summary>
      ${two ? `<div class="grid-2">${factorFields}</div>` : factorFields}
      <p class="hint">${escapeHtml(l.factorAHint)}</p>
    </details>`;
}

function factorANow(state: HouseholdState): string {
  const values = state.people.map((person) => amount(person.factorA ?? "")).filter((v) => v > 0);
  return l.factorANow(values.length > 0 ? values.map(euros).join(", ") : l.factorANone);
}

/** One sentence in euros, what it is made of, the room, and the warnings that apply. */
function answer(results: LijfrenteWhatIf[], deposit: number, total: HouseholdTotal, state: HouseholdState, view: View): string {
  if (deposit <= 0) return `<p class="section-answer">${escapeHtml(l.answerType)}</p>`;
  const two = results.length > 1;
  const strong = (value: number) => `<strong>${escapeHtml(euros(value))}</strong>`;
  const withRoom = results.map((r, p) => ({ r, p })).filter(({ r }) => r.room.amount > 0);
  const notes: string[] = [];

  let sentence: string;
  let main: { r: LijfrenteWhatIf; p: number } | undefined;
  if (withRoom.length === 0) {
    sentence = escapeHtml(two ? l.noRoomAll : l.noRoom(null));
  } else if (!two) {
    main = withRoom[0];
    sentence = withAmount(l.answerOne(euros(deposit)), strong(main?.r.back ?? 0));
  } else {
    const sorted = [...withRoom].sort((a, b) => b.r.back - a.r.back);
    const [best, other] = sorted;
    main = best;
    if (best && other && best.r.back - other.r.back < HARDLY_MATTERS) {
      sentence = withAmount(l.answerEither(euros(deposit)), strong((best.r.back + other.r.back) / 2));
    } else if (best) {
      const otherIndex = 1 - best.p;
      const otherBack = results[otherIndex]?.back ?? 0;
      sentence = withAmount(l.answerBetter(euros(deposit), view.who(best.p), euros(otherBack), view.who(otherIndex)), strong(best.r.back));
    } else {
      sentence = "";
    }
  }

  if (main) {
    const r = main.r;
    notes.push(l.split(euros(r.taxLower), r.toeslagenUp >= 0.5 ? euros(r.toeslagenUp) : null, euros(r.cost)));
  }
  results.forEach((r, p) => {
    const who = two ? view.who(p) : null;
    notes.push(r.room.amount > 0 ? l.room(who, euros(r.room.amount)) : two ? l.noRoom(who) : "");
    if (r.room.amount > 0 && deposit > r.room.amount + 0.5) notes.push(l.aboveRoom(view.who(p), euros(r.room.amount)));
  });

  // Building pension at work lowers the room: warn when no factor A was typed.
  const warnings = state.people
    .map((person, p) => ((total.work.people[p]?.pension ?? 0) > 0 && amount(person.factorA ?? "") <= 0 ? l.factorAWarning(view.who(p)) : ""))
    .filter(Boolean)
    .map((text) => `<p class="note">${escapeHtml(text)}</p>`)
    .join("");

  return `
    <p class="section-answer">${sentence}</p>
    ${notes.filter(Boolean).map((text) => `<p class="small muted">${escapeHtml(text)}</p>`).join("")}
    ${warnings}`;
}

/** A bar per person: the part of the deposit that comes back this year, and the part you pay. */
function bars(results: LijfrenteWhatIf[], deposit: number, view: View): string {
  if (deposit <= 0 || results.every((r) => r.room.amount <= 0)) return "";
  const rows = results
    .map((r, p) => {
      const back = Math.max(0, Math.min(r.back, deposit));
      const bar = stackedBar(
        [
          { tone: "netto", value: back },
          { tone: "pension", value: deposit - back },
        ],
        `${l.legendBack} ${euros(back)}, ${l.legendOwn} ${euros(deposit - back)}`,
      );
      const label = results.length > 1 ? `<div class="compare-label"><span class="dot dot-${p}" aria-hidden="true"></span>${escapeHtml(l.bar(view.who(p), euros(r.back), euros(deposit)))}</div>` : "";
      return `<li>${label}${bar}</li>`;
    })
    .join("");
  const keys = legend(
    [
      { tone: "netto", label: l.legendBack },
      { tone: "pension", label: l.legendOwn },
    ],
    true,
  );
  return `<ul class="compare">${rows}</ul><div class="legend-row">${keys}</div>`;
}

/** The jaarruimte step by step, and what the deposit does to tax and toeslagen, per person. */
function why(results: LijfrenteWhatIf[], view: View): string {
  const { rules } = view;
  const r = rules.lijfrente;
  const w = l.why;
  const two = results.length > 1;
  const cells = (pick: (x: LijfrenteWhatIf) => string) => results.map((x) => `<td>${escapeHtml(pick(x))}</td>`).join("");
  const row = (label: string, pick: (x: LijfrenteWhatIf) => string, cls = "") => `<tr${cls ? ` class="${cls}"` : ""}><td>${escapeHtml(label)}</td>${cells(pick)}</tr>`;
  const head = two ? `<thead><tr><th></th>${results.map((_, p) => `<th>${escapeHtml(view.who(p).name)}</th>`).join("")}</tr></thead>` : "";
  const rows = [
    row(w.income, (x) => euros(x.room.income)),
    row(w.franchise, () => `− ${euros(r.franchise)}`, "minus"),
    row(w.base, (x) => euros(x.room.premiegrondslag), "sum"),
    row(w.rate(percent(r.rate)), (x) => euros(x.room.beforeFactorA)),
    row(w.factorA(String(r.factorAMultiplier)), (x) => `− ${euros(x.room.factorADeduction)}`, "minus"),
    row(w.room, (x) => euros(x.room.amount), "sum"),
    row(w.deductible, (x) => euros(x.deductible)),
    row(w.tax, (x) => euros(x.taxLower)),
    row(w.toeslagen, (x) => euros(x.toeslagenUp)),
    row(w.back, (x) => euros(x.back), "sum"),
  ];
  const g = rules.generalCredit;
  const top = rules.box1Brackets.at(-1)?.rate ?? 0;
  const steps = [
    w.steps.deduction,
    w.steps.rate(percent(top)),
    w.steps.credit(euros(g.phaseOutStart), euros(g.phaseOutStart + g.max / g.phaseOutRate), percent(g.phaseOutRate)),
    w.steps.room(percent(r.rate), euros(r.franchise), euros(r.maxIncome), String(r.factorAMultiplier)),
  ];
  return `
    <table class="why-table${two ? " cols-3" : ""}">${head}<tbody>${rows.join("")}</tbody></table>
    <ol class="why-steps">${steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>`;
}

/** Texts that never change, and the inputs inside the section. Call once. */
export function initLowerTax(state: HouseholdState, changed: () => void): void {
  byId("lower-tax-title").textContent = s.title;
  byId("lower-tax-intro").textContent = s.intro;
  byId("lijfrente-title").innerHTML = `${escapeHtml(l.title)} <span class="nl">(${escapeHtml(l.titleNl)})</span>`;
  byId("lijfrente-later").textContent = l.later;
  byId("lijfrente-why-toggle").textContent = t.common.showWhy;
  byId("lijfrente-controls").addEventListener("input", (event) => {
    const el = event.target;
    if (!(el instanceof HTMLInputElement) || el.type !== "text") return;
    if (el.dataset.lijfrente === "deposit") {
      state.lijfrente = el.value;
    } else if (el.dataset.factorA !== undefined) {
      const person = state.people[Number(el.dataset.factorA)];
      if (!person) return;
      person.factorA = el.value;
      const now = document.getElementById("factor-a-now");
      if (now) now.textContent = factorANow(state);
    } else {
      return;
    }
    markInvalid(el, isInvalid(el.value));
    changed();
  });
}

/** Shows the section once there is income. */
export function renderLowerTax(people: PersonIncome[], home: Home, total: HouseholdTotal, state: HouseholdState, view: View): void {
  const el = byId("lower-tax");
  el.hidden = total.work.gross + total.work.profit <= 0;
  if (el.hidden) return;
  renderControls(state, view);
  const deposit = amount(state.lijfrente ?? EXAMPLE_DEPOSIT);
  const results = people.map((_, p) => lijfrenteWhatIf(people, home, p, deposit, amount(state.people[p]?.factorA ?? ""), view.rules));
  byId("lijfrente-answer").innerHTML = answer(results, deposit, total, state, view) + bars(results, deposit, view);
  byId("lijfrente-why").innerHTML = why(results, view);
}
