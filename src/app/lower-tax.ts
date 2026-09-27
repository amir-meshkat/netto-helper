import type { Home, HouseholdTotal, PersonIncome } from "../engine/household";
import { honeySpot, lijfrenteWhatIf, type HoneySpot } from "../engine/lijfrente";
import { t } from "../i18n";
import { legend, stackedBar } from "../ui/components";
import { byId, escapeHtml, withAmount } from "../ui/dom";
import { markInvalid, textField } from "../ui/fields";
import { euros, eurosCents, percent } from "../ui/format";
import { parseNumber } from "../ui/parse";
import type { SliderRange } from "../ui/slider-range";
import type { HouseholdState } from "./state";
import type { View } from "./view";

// "What could lower your tax?": options a person could choose, worked out on the situation typed, without
// changing the answers above. The first option is a lijfrente, led by its honey spot: the amount where each
// euro gives the most back. See docs/lijfrente-2026.md.

const s = t.lowerTax;
const l = s.lijfrente;

/** Until something is typed, "Try another amount" works out this example per year. */
export const EXAMPLE_DEPOSIT = "1000";

const DEPOSIT_SLIDER: SliderRange = { min: 0, max: 36_000, step: 100 };
const FACTOR_A_SLIDER: SliderRange = { min: 0, max: 10_000, step: 10 };

const amount = (text: string) => Math.max(0, parseNumber(text) ?? 0);
const isInvalid = (text: string) => text.trim() !== "" && parseNumber(text) === null;
const gain = (h: HoneySpot) => (h.free ? h.free.best.back - h.free.best.deposit : -Infinity);

/** Factor A per person, and another amount to try. Built again only when the people or their names change. */
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
    <details class="more" data-key="more-factor-a"${view.details.openIf("more-factor-a")}>
      <summary>${escapeHtml(l.factorAMore)}<span class="details-now" id="factor-a-now">${escapeHtml(factorANow(state))}</span></summary>
      ${two ? `<div class="grid-2">${factorFields}</div>` : factorFields}
      <p class="hint">${escapeHtml(l.factorAHint)}</p>
    </details>
    <details class="more" data-key="more-lijfrente-try"${view.details.openIf("more-lijfrente-try")}>
      <summary>${escapeHtml(l.tryMore)}<span class="details-now" id="lijfrente-try-now">${escapeHtml(l.tryNow(euros(amount(deposit))))}</span></summary>
      ${textField({ id: "lijfrente-deposit", value: deposit, label: l.deposit, nl: l.depositNl, unit: "€", invalid: isInvalid(deposit), data: { lijfrente: "deposit" }, slider: DEPOSIT_SLIDER })}
      <div id="lijfrente-try"></div>
    </details>`;
}

function factorANow(state: HouseholdState): string {
  const values = state.people.map((person) => amount(person.factorA ?? "")).filter((v) => v > 0);
  return l.factorANow(values.length > 0 ? values.map(euros).join(", ") : l.factorANone);
}

/** Which person leads: a free spot first (the most gain), then the most back per euro. */
function leader(spots: HoneySpot[]): number {
  let lead = 0;
  spots.forEach((h, p) => {
    const current = spots[lead];
    if (!current || !h.best) return;
    if (!current.best || gain(h) > gain(current) || (gain(h) === gain(current) && h.perHundred > current.perHundred + 0.05)) lead = p;
  });
  return lead;
}

/** The honey spot in one sentence, what it is made of, and the room around it. */
function answer(spots: HoneySpot[], total: HouseholdTotal, state: HouseholdState, view: View): string {
  const two = spots.length > 1;
  const lead = leader(spots);
  const h = spots[lead];
  const small = (text: string) => `<p class="small muted">${escapeHtml(text)}</p>`;
  const strong = (text: string) => `<strong>${escapeHtml(text)}</strong>`;
  const who = two ? view.who(lead) : null;

  // Building pension at work lowers the room: warn when no factor A was typed.
  const warnings = state.people
    .map((person, p) => ((total.work.people[p]?.pension ?? 0) > 0 && amount(person.factorA ?? "") <= 0 ? l.factorAWarning(view.who(p)) : ""))
    .filter(Boolean)
    .map((text) => `<p class="note">${escapeHtml(text)}</p>`)
    .join("");

  if (!h?.best) return `<p class="section-answer">${escapeHtml(two ? l.noRoomAll : l.noRoom(null))}</p>${warnings}`;

  let lines: string;
  let bar: string;
  if (h.free) {
    const f = h.free.best;
    lines = `
      <p class="section-answer">${withAmount(l.free(who, euros(f.deposit)), strong(euros(f.back - f.deposit)))}</p>
      ${small(l.freeWhy(t.toeslagen.namesNl[h.free.toeslag], euros(h.free.upTo)))}`;
    bar = stackedBar([{ tone: "netto", value: f.back }], `${l.legendBack} ${euros(f.back)}`);
  } else {
    const b = h.best;
    const room = h.afterPerHundred === null ? l.honeyAll(who) : l.honeyAfter(eurosCents(h.afterPerHundred), euros(h.room.amount));
    lines = `
      <p class="section-answer">${withAmount(l.honey(who), strong(euros(b.deposit)))}</p>
      ${small(l.honeySplit(eurosCents(h.perHundred), euros(b.back), euros(b.cost), b.toeslagenUp >= 0.5))}
      ${small(room)}`;
    bar = stackedBar(
      [
        { tone: "netto", value: b.back },
        { tone: "pension", value: b.cost },
      ],
      `${l.legendBack} ${euros(b.back)}, ${l.legendOwn} ${euros(b.cost)}`,
    );
  }
  const keys = legend(
    [
      { tone: "netto", label: l.legendBack },
      ...(h.free ? [] : [{ tone: "pension" as const, label: l.legendOwn }]),
    ],
    true,
  );

  // For a couple, the other partner's honey spot in one line.
  const other = two ? spots[1 - lead] : undefined;
  const otherLine = other
    ? other.best
      ? small(l.otherPartner(view.who(1 - lead), euros(other.best.deposit), eurosCents(other.perHundred)))
      : small(l.noRoom(view.who(1 - lead)))
    : "";

  return `${lines}${bar}<div class="legend-row">${keys}</div>${otherLine}${warnings}`;
}

/** Another amount, for everyone: what it gives back, and whether it is above the jaarruimte. */
function tryResult(people: PersonIncome[], home: Home, state: HouseholdState, view: View): string {
  const deposit = amount(state.lijfrente ?? EXAMPLE_DEPOSIT);
  if (deposit <= 0) return "";
  const two = people.length > 1;
  return people
    .map((_, p) => {
      const r = lijfrenteWhatIf(people, home, p, deposit, amount(state.people[p]?.factorA ?? ""), view.rules);
      const who = two ? view.who(p) : null;
      if (r.room.amount <= 0) return `<p class="small">${escapeHtml(l.noRoom(who))}</p>`;
      const above = deposit > r.room.amount + 0.5 ? ` ${l.aboveRoom(view.who(p), euros(r.room.amount))}` : "";
      return `<p class="small">${escapeHtml(l.tryResult(who, euros(deposit), euros(r.back), euros(r.cost)) + above)}</p>`;
    })
    .join("");
}

/** The jaarruimte step by step, and the honey spot's effect, per person. */
function why(spots: HoneySpot[], view: View): string {
  const { rules } = view;
  const r = rules.lijfrente;
  const w = l.why;
  const two = spots.length > 1;
  const cells = (pick: (h: HoneySpot) => string) => spots.map((h) => `<td>${escapeHtml(pick(h))}</td>`).join("");
  const row = (label: string, pick: (h: HoneySpot) => string, cls = "") =>
    `<tr${cls ? ` class="${cls}"` : ""}><td>${escapeHtml(label)}</td>${cells(pick)}</tr>`;
  const head = two ? `<thead><tr><th></th>${spots.map((_, p) => `<th>${escapeHtml(view.who(p).name)}</th>`).join("")}</tr></thead>` : "";
  // The free spot when there is one, otherwise the honey spot.
  const shown = (h: HoneySpot) => h.free?.best ?? h.best;
  const rows = [
    row(w.income, (h) => euros(h.room.income)),
    row(w.franchise, () => `− ${euros(r.franchise)}`, "minus"),
    row(w.base, (h) => euros(h.room.premiegrondslag), "sum"),
    row(w.rate(percent(r.rate)), (h) => euros(h.room.beforeFactorA)),
    row(w.factorA(String(r.factorAMultiplier)), (h) => `− ${euros(h.room.factorADeduction)}`, "minus"),
    row(w.room, (h) => euros(h.room.amount), "sum"),
    row(w.honey, (h) => euros(shown(h)?.deposit ?? 0)),
    row(w.tax, (h) => euros(shown(h)?.taxLower ?? 0), "sub"),
    row(w.toeslagen, (h) => euros(shown(h)?.toeslagenUp ?? 0), "sub"),
    row(w.back, (h) => euros(shown(h)?.back ?? 0), "sum"),
    row(w.perHundred, (h) => {
      const x = shown(h);
      return x && x.deposit > 0 ? eurosCents((x.back / x.deposit) * 100) : euros(0);
    }),
  ];
  const g = rules.generalCredit;
  const top = rules.box1Brackets.at(-1)?.rate ?? 0;
  const steps = [
    w.steps.deduction,
    w.steps.honey,
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
      const now = document.getElementById("lijfrente-try-now");
      if (now) now.textContent = l.tryNow(euros(amount(el.value)));
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
  const spots = people.map((_, p) => honeySpot(people, home, p, amount(state.people[p]?.factorA ?? ""), view.rules));
  byId("lijfrente-answer").innerHTML = answer(spots, total, state, view);
  byId("lijfrente-try").innerHTML = tryResult(people, home, state, view);
  byId("lijfrente-why").innerHTML = why(spots, view);
}
