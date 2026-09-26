import { t } from "../i18n";
import type { ChildcareKind, TaxRules } from "../rules";
import { escapeHtml } from "./dom";
import { checkbox, markInvalid, textField } from "./fields";
import { euros, eurosCents } from "./format";
import { CHILDCARE_KINDS, HOME_SLIDERS, isHomeInvalid, newCare, toEngineHome, type ChildInput, type HomeInput, type HomeTextKey } from "./home-input";
import type { Unit } from "./slider";

// The inputs for toeslagen and the own home: children (with optional childcare), rent or a mortgage, and
// savings. All optional.
// Text fields carry data-home (the HomeTextKey) and, for a child, data-c (the child's index).

const f = t.homeForm;

function field(id: string, key: HomeTextKey, value: string, label: string, unit: Unit, options: { nl?: string; big?: boolean; child?: number } = {}) {
  return textField({
    id,
    value,
    label,
    nl: options.nl,
    unit,
    big: options.big,
    invalid: isHomeInvalid(value, key),
    data: { home: key, ...(options.child === undefined ? {} : { c: String(options.child) }) },
    slider: HOME_SLIDERS[key],
  });
}

function careFields(child: ChildInput, c: number, rules: TaxRules): string {
  const care = child.care;
  if (!care) {
    return `<button type="button" class="btn-add" data-action="add-care" data-c="${c}">${escapeHtml(f.addCare)}</button>`;
  }
  const radio = (kind: ChildcareKind) => `
    <label><input type="radio" id="child-${c}-kind-${kind}" name="child-${c}-kind" value="${kind}"
      data-care-kind="${c}"${care.kind === kind ? " checked" : ""}><span>${escapeHtml(f.careKinds[kind])}</span></label>`;
  const k = rules.toeslagen.kinderopvang;
  return `
    <fieldset class="pension">
      <legend>${escapeHtml(f.careKind)} <span class="nl">(${escapeHtml(f.careKindsNl[care.kind])})</span></legend>
      <div class="segmented">${CHILDCARE_KINDS.map(radio).join("")}</div>
    </fieldset>
    <div class="grid-2">
      ${field(`child-${c}-hours`, "hours", care.hours, f.hours, "", { child: c })}
      ${field(`child-${c}-price`, "price", care.price, f.price, "€", { child: c })}
    </div>
    <p class="hint">${escapeHtml(f.careHint(eurosCents(k.maxHourlyPrice[care.kind]), String(k.maxHoursPerMonth)))}</p>
    <button type="button" class="btn-link" data-action="remove-care" data-c="${c}">${escapeHtml(f.removeCare)}</button>`;
}

function childBlock(child: ChildInput, c: number, rules: TaxRules): string {
  return `
    <div class="job child">
      <div class="job-head">
        <span class="job-title">${escapeHtml(f.childTitle(c + 1))}</span>
        <button type="button" class="btn-link" data-action="remove-child" data-c="${c}">${escapeHtml(f.remove)}</button>
      </div>
      ${field(`child-${c}-age`, "age", child.age, f.age, "", { child: c })}
      ${careFields(child, c, rules)}
    </div>`;
}

function rentBlock(home: HomeInput, rules: TaxRules): string {
  if (home.rent === null) return "";
  const h = rules.toeslagen.huurtoeslag;
  return `
    <div class="job rent">
      <div class="job-head">
        <span class="job-title">${escapeHtml(f.rentTitle)}</span>
        <button type="button" class="btn-link" data-action="remove-rent">${escapeHtml(f.remove)}</button>
      </div>
      ${field("home-rent", "rent", home.rent, f.rent, "€", { nl: f.rentNl, big: true })}
      <p class="hint">${escapeHtml(f.rentHint)}</p>
      ${checkbox({
        id: "home-young",
        checked: home.allYoung,
        label: f.allYoung,
        hint: f.allYoungHint(eurosCents(h.maxRentYoung)),
        data: { "home-switch": "allYoung" },
      })}
    </div>`;
}

function mortgageBlock(home: HomeInput): string {
  const m = home.mortgage;
  if (!m) return "";
  return `
    <div class="job mortgage">
      <div class="job-head">
        <span class="job-title">${escapeHtml(f.mortgageTitle)}</span>
        <button type="button" class="btn-link" data-action="remove-mortgage">${escapeHtml(f.remove)}</button>
      </div>
      ${field("home-woz", "woz", m.woz, f.woz, "€", { nl: f.wozNl })}
      <p class="hint">${escapeHtml(f.wozHint)}</p>
      <div class="grid-2">
        ${field("home-loan", "loan", m.loan, f.loan, "€", { nl: f.loanNl })}
        ${field("home-rate", "rate", m.rate, f.rate, "%", { nl: f.rateNl })}
      </div>
      <p class="hint">${escapeHtml(f.mortgageHint)}</p>
    </div>`;
}

/** Short summary under the savings toggle, so the value is never hidden. */
export function savingsNow(home: HomeInput): string {
  const vermogen = toEngineHome(home).vermogen;
  return f.savingsNow(vermogen > 0 ? euros(vermogen) : null);
}

/** Children, rent or a mortgage, and savings, with buttons to add what applies. A household rents or owns, not both. */
export function homeFields(home: HomeInput, rules: TaxRules, savingsOpen: boolean): string {
  const limits = rules.toeslagen;
  const neither = home.rent === null && home.mortgage === null;
  const add = (action: string, label: string) => `<button type="button" class="btn-add" data-action="${action}">${escapeHtml(label)}</button>`;
  return `
    <section class="person-input home-input" aria-labelledby="home-title">
      <div class="person-head"><h3 id="home-title">${escapeHtml(f.title)}</h3></div>
      <p class="hint">${escapeHtml(f.hint)}</p>
      ${home.children.map((child, c) => childBlock(child, c, rules)).join("")}
      ${rentBlock(home, rules)}
      ${mortgageBlock(home)}
      <div class="add-row">
        ${add("add-child", f.addChild)}
        ${neither ? add("add-rent", f.addRent) + add("add-mortgage", f.addMortgage) : ""}
      </div>
      <details class="more" data-key="more-home"${savingsOpen ? " open" : ""}>
        <summary>${escapeHtml(f.savingsMore)} <span class="nl">(${escapeHtml(f.savingsNl)})</span><span class="details-now" id="home-savings-now">${escapeHtml(savingsNow(home))}</span></summary>
        ${field("home-savings", "savings", home.savings, f.savings, "€")}
        <p class="hint">${escapeHtml(f.savingsHint(euros(limits.huurtoeslag.maxVermogen.alone), euros(limits.zorgtoeslag.maxVermogen.alone)))}</p>
      </details>
    </section>`;
}

/** Typing in a home field. Returns false when the event was not for one. */
export function handleHomeInput(event: Event, home: HomeInput): boolean {
  const el = event.target;
  if (!(el instanceof HTMLInputElement) || el.type !== "text" || !el.dataset.home) return false;
  const key = el.dataset.home as HomeTextKey;
  const child = el.dataset.c === undefined ? undefined : home.children[Number(el.dataset.c)];
  if (key === "age" && child) child.age = el.value;
  else if ((key === "hours" || key === "price") && child?.care) child.care[key] = el.value;
  else if (key === "rent" && home.rent !== null) home.rent = el.value;
  else if ((key === "woz" || key === "loan" || key === "rate") && home.mortgage) home.mortgage[key] = el.value;
  else if (key === "savings") home.savings = el.value;
  else return false;
  markInvalid(el, isHomeInvalid(el.value, key));
  const now = document.getElementById("home-savings-now");
  if (now && key === "savings") now.textContent = savingsNow(home);
  return true;
}

/** The "everyone is 18, 19 or 20" switch, or a childcare kind. False when the event was not for one. */
export function handleHomeChange(event: Event, home: HomeInput, rules: TaxRules): "redraw" | "update" | false {
  const el = event.target;
  if (!(el instanceof HTMLInputElement)) return false;
  if (el.type === "checkbox" && el.dataset.homeSwitch === "allYoung") {
    home.allYoung = el.checked;
    return "update";
  }
  if (el.type === "radio" && el.dataset.careKind !== undefined && el.checked) {
    const child = home.children[Number(el.dataset.careKind)];
    if (!child?.care) return false;
    const kind = el.value as ChildcareKind;
    // A new kind has its own maximum price; keep a price that was typed, unless it was that maximum.
    const oldMax = String(rules.toeslagen.kinderopvang.maxHourlyPrice[child.care.kind]);
    child.care = { ...child.care, kind, price: child.care.price === oldMax ? newCare(rules, kind).price : child.care.price };
    return "redraw";
  }
  return false;
}
