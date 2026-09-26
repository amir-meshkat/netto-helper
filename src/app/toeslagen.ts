import type { Home, HouseholdTotal } from "../engine/household";
import { nextToeslagCliff, toeslagen, type ToeslagenResult } from "../engine/toeslagen";
import { t } from "../i18n";
import { byId, escapeHtml, withAmount } from "../ui/dom";
import { euros, eurosCents, percent } from "../ui/format";
import type { View } from "./view";

// The toeslagen section: what the household gets, per toeslag, and where earning more costs toeslag.
// Shown when there is any toeslag, or when children or rent were added (then "none" is an answer too).

const s = t.toeslagen;
type Key = keyof typeof s.names;

interface Line {
  key: Key;
  amount: number;
  /** Why there is none, when that needs saying. */
  none: string | null;
  why: string;
}

function lines(result: ToeslagenResult, home: Home, partner: boolean, view: View): Line[] {
  const { rules } = view;
  const who = partner ? "partner" : "alone";
  const z = result.zorgtoeslag;
  const k = result.kindgebondenBudget;
  const h = result.huurtoeslag;
  const ko = result.kinderopvang;
  const list: Line[] = [
    {
      key: "zorgtoeslag",
      amount: z.amount,
      none:
        z.stopped === "income"
          ? s.noneIncome(euros(rules.toeslagen.zorgtoeslag.maxIncome[who]))
          : z.stopped === "vermogen"
            ? s.noneVermogen
            : z.amount <= 0
              ? s.noneAtIncome
              : null,
      why:
        z.stopped === "income"
          ? s.why.zorgtoeslagStopped(euros(rules.toeslagen.zorgtoeslag.maxIncome[who]))
          : z.stopped === "vermogen"
            ? s.why.vermogen
            : s.why.zorgtoeslag(euros(z.standaardpremie), euros(z.normpremie), euros(z.amount)),
    },
  ];
  if (k.children > 0) {
    list.push({
      key: "kindgebondenBudget",
      amount: k.amount,
      none: k.stopped === "vermogen" ? s.noneVermogen : k.amount <= 0 ? s.noneAtIncome : null,
      why: k.stopped === "vermogen" ? s.why.vermogen : s.why.kindgebonden(euros(k.maximum), euros(k.reduction), euros(k.amount)),
    });
  }
  if (home.rent !== null) {
    const perMonth = h.bands.toKwaliteitskorting + h.bands.toAftopping + h.bands.aboveAftopping;
    list.push({
      key: "huurtoeslag",
      amount: h.amount,
      none:
        h.stopped === "vermogen" ? s.noneVermogen : (home.rent ?? 0) <= 0 ? s.typeRent : h.amount <= 0 ? s.noneAtIncome : null,
      why:
        h.stopped === "vermogen"
          ? s.why.vermogen
          : `${s.why.huur(eurosCents(h.countedRent), eurosCents(h.basishuur), eurosCents(perMonth), euros(h.reduction), euros(h.amount))} ${s.why.huurUnverified}`,
    });
  }
  if (ko.children.length > 0) {
    list.push({
      key: "kinderopvang",
      amount: ko.amount,
      none: null,
      why: [
        ...ko.children.map((c) => s.why.kinderopvangChild(c.child + 1, percent(c.share), eurosCents(c.hourlyPrice), String(c.hours), euros(c.amount))),
        ...(ko.children.length > 1 ? [s.why.kinderopvangFirst] : []),
      ].join(" "),
    });
  }
  return list;
}

export function renderToeslagen(total: HouseholdTotal, home: Home, view: View): void {
  const el = byId("toeslagen");
  const result = total.toeslagen;
  const partner = total.work.people.length > 1;
  const hasInputs = home.children.length > 0 || home.rent !== null;
  el.hidden = result.total <= 0 && !hasInputs;
  if (el.hidden) return;

  const list = lines(result, home, partner, view);
  const largest = Math.max(1, ...list.map((l) => l.amount));
  const items = list
    .map((l) => {
      const value = l.none ?? s.perMonth(euros(l.amount / 12));
      const bar = l.amount > 0 ? `<div class="bar thin"><span class="tone-toeslag" style="inline-size:${(l.amount / largest) * 100}%"></span></div>` : "";
      return `
        <li>
          <div class="toeslag-row"><span>${escapeHtml(s.names[l.key])} <span class="nl">(${escapeHtml(s.namesNl[l.key])})</span></span><strong>${escapeHtml(value)}</strong></div>
          ${bar}
        </li>`;
    })
    .join("");

  // Money to spend, and separately what kinderopvangtoeslag pays of the childcare bill.
  const spendable = result.total - result.kinderopvang.amount;
  const childcare =
    result.kinderopvang.children.length > 0
      ? `<p class="small">${escapeHtml(
          s.childcare(
            euros(result.kinderopvang.amount / 12),
            euros(result.kinderopvang.cost / 12),
            euros((result.kinderopvang.cost - result.kinderopvang.amount) / 12),
          ),
        )}</p>`
      : "";
  const answer =
    spendable > 0
      ? `<p class="section-answer">${withAmount(partner ? s.answerHousehold : s.answerOne, `<strong>${escapeHtml(euros(spendable / 12))}</strong>`)}</p>
         <p class="small muted">${escapeHtml(s.answerSub(euros(spendable), euros(total.toetsingsinkomen)))}</p>`
      : childcare
        ? ""
        : `<p class="section-answer">${escapeHtml(s.answerNone)}</p>`;

  // What the next €100 of household income costs in toeslagen, and the nearest place where one drops at once.
  const h = { income: total.toetsingsinkomen, partner, ...home };
  const drop = result.total - toeslagen({ ...h, income: h.income + 100 }, view.rules).total;
  const cliff = nextToeslagCliff(h, view.rules);
  const next100 = drop >= 0.005 ? `<p class="small">${escapeHtml(s.next100(eurosCents(drop)))}</p>` : "";
  const warning = cliff
    ? `<p class="note">${escapeHtml(s.cliff(s.namesNl[cliff.toeslag], euros(cliff.at), euros(total.toetsingsinkomen), euros(cliff.loss)))}</p>`
    : "";

  el.innerHTML = `
    <h2>${escapeHtml(s.title)}</h2>
    ${answer}
    ${childcare}
    <ul class="toeslag-list">${items}</ul>
    ${next100}
    ${warning}
    ${result.total > 0 ? `<p class="small muted">${escapeHtml(s.update)}</p>` : ""}
    <details class="why" data-key="why-toeslagen"${view.details.openIf("why-toeslagen")}>
      <summary>${escapeHtml(t.common.showWhy)}</summary>
      <ul class="card-notes">${list.map((l) => `<li><strong>${escapeHtml(s.namesNl[l.key])}:</strong> ${escapeHtml(l.why)}</li>`).join("")}</ul>
    </details>`;
}
