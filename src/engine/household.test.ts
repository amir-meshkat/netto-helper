import { describe, expect, it } from "vitest";
import { getRules } from "../rules";
import { householdNetto, householdTotal } from "./household";
import { NO_PENSION, personNetto, type Job } from "./person";

const rules = getRules(2026);

const yearlyJob = (yearlyGross: number): Job => ({
  monthlyGross: yearlyGross / 12,
  holidayPayRate: 0,
  yearEndBonusRate: 0,
  pension: NO_PENSION,
});

describe("householdNetto", () => {
  it("is the sum of the people in it", () => {
    const a = [yearlyJob(36_000)];
    const b = [yearlyJob(39_000), yearlyJob(15_000)];
    const household = householdNetto([{ jobs: a }, { jobs: b }], rules);
    expect(household.people).toHaveLength(2);
    expect(household.netto).toBeCloseTo(personNetto(a, rules).netto + personNetto(b, rules).netto, 6);
    expect(household.gross).toBeCloseTo(90_000, 6);
    expect(household.gross - household.pension - household.tax).toBeCloseTo(household.netto, 6);
  });

  it("taxes partners separately, so the split of the same total matters", () => {
    const oneEarner = householdNetto([{ jobs: [yearlyJob(54_000)] }, { jobs: [] }], rules);
    const twoEarners = householdNetto([{ jobs: [yearlyJob(27_000)] }, { jobs: [yearlyJob(27_000)] }], rules);
    expect(oneEarner.netto).toBeCloseTo(41_121.61, 2);
    expect(twoEarners.netto).toBeCloseTo(51_570.04, 2);
  });

  it("adds side income profit, and takes off its tax and Zvw", () => {
    const side = { revenue: 12_000, costs: 2_000, kind: "business" as const, meetsHoursCriterion: false, starter: false };
    const household = householdNetto([{ jobs: [yearlyJob(38_880)], side }], rules);
    expect(household.profit).toBe(10_000);
    expect(household.zvw).toBeCloseTo(423.41, 2);
    expect(household.gross + household.profit - household.tax - household.zvw).toBeCloseTo(household.netto, 6);
  });
});

describe("householdTotal", () => {
  const noHome = { vermogen: 0, children: [], rent: null, allYoung: false };

  it("adds toeslagen to the work netto: alone at 38,880 gets 294.98 zorgtoeslag", () => {
    const total = householdTotal([{ jobs: [yearlyJob(38_880)] }], noHome, rules);
    expect(total.toetsingsinkomen).toBeCloseTo(38_880, 6);
    expect(total.toeslagen.zorgtoeslag.amount).toBeCloseTo(294.98, 2);
    expect(total.total).toBeCloseTo(total.work.netto + total.toeslagen.total, 6);
  });

  it("uses the income of both partners together, and the rules for a toeslagpartner", () => {
    const total = householdTotal([{ jobs: [yearlyJob(38_880)] }, { jobs: [] }], noHome, rules);
    expect(total.toetsingsinkomen).toBeCloseTo(38_880, 6);
    expect(total.toeslagen.zorgtoeslag.amount).toBeCloseTo(1_707.15, 2);
  });

  it("takes the childcare costs off the total, so kinderopvangtoeslag only makes up for part of them", () => {
    const care = { kind: "dagopvang" as const, hoursPerMonth: 100, pricePerHour: 11.23 };
    const total = householdTotal([{ jobs: [yearlyJob(38_880)] }], { ...noHome, children: [{ age: 2, care }] }, rules);
    expect(total.childcareCost).toBeCloseTo(100 * 11.23 * 12, 6);
    expect(total.toeslagen.kinderopvang.amount).toBeCloseTo(0.96 * 100 * 11.23 * 12, 6);
    expect(total.total).toBeCloseTo(total.work.netto + total.toeslagen.total - total.childcareCost, 6);
  });

  it("counts taxable income: pension premium and the mkb-winstvrijstelling are not part of it", () => {
    const withPension: Job = { ...yearlyJob(40_000), pension: { kind: "monthly", amount: 100 } };
    const side = { revenue: 12_000, costs: 2_000, kind: "business" as const, meetsHoursCriterion: false, starter: false };
    const total = householdTotal([{ jobs: [withPension], side }], noHome, rules);
    expect(total.toetsingsinkomen).toBeCloseTo(40_000 - 1_200 + 8_730, 6);
  });
});

describe("householdNetto with an eigen woning saldo", () => {
  const people = (a: number, b: number) => [{ jobs: [yearlyJob(a)] }, { jobs: b > 0 ? [yearlyJob(b)] : [] }];
  const tax = (r: ReturnType<typeof householdNetto>) => r.tax;

  it("puts all of it with the earner when the partner has no income: 4,659.55 less tax, not 2,329.77", () => {
    const without = householdNetto(people(51_840, 0), rules);
    const withHome = householdNetto(people(51_840, 0), rules, -10_600);
    expect(withHome.people.map((p) => p.woning)).toEqual([-10_600, 0]);
    expect(tax(without) - tax(withHome)).toBeCloseTo(4_659.55, 2);
  });

  it("keeps half each when no division is better", () => {
    const withHome = householdNetto(people(51_840, 51_840), rules, -10_600);
    expect(withHome.people.map((p) => p.woning)).toEqual([-5_300, -5_300]);
  });

  it("puts a positive saldo with the partner who pays no tax on it", () => {
    const withHome = householdNetto(people(51_840, 0), rules, 393.86);
    expect(withHome.people[1]?.woning).toBeCloseTo(393.86, 6);
    expect(tax(withHome)).toBeCloseTo(tax(householdNetto(people(51_840, 0), rules)), 6);
  });

  it("finds a division at least as good as every division in steps of 1%", () => {
    const cases: [number, number, number][] = [
      [60_000, 15_000, -25_000],
      [90_000, 30_000, -40_000],
      [20_000, 12_000, -6_000],
      [45_000, 44_000, -30_000],
      [130_000, 0, -60_000],
      [30_000, 9_000, 500],
    ];
    for (const [a, b, saldo] of cases) {
      const best = tax(householdNetto(people(a, b), rules, saldo));
      for (let k = 0; k <= 100; k++) {
        const share = (saldo * k) / 100;
        const other = personNetto([yearlyJob(a)], rules, null, share).tax + personNetto(b > 0 ? [yearlyJob(b)] : [], rules, null, saldo - share).tax;
        expect(best).toBeLessThanOrEqual(other + 0.005);
      }
    }
  });
});

describe("householdTotal with an own home", () => {
  it("lowers the toetsingsinkomen by the saldo, so toeslagen can go up", () => {
    const home = { vermogen: 0, children: [], rent: null, allYoung: false };
    const owner = { ...home, owner: { woz: 300_000, interest: 9_000 } };
    const without = householdTotal([{ jobs: [yearlyJob(40_000)] }], home, rules);
    const withHome = householdTotal([{ jobs: [yearlyJob(40_000)] }], owner, rules);
    // Saldo: 0.35% x 300,000 - 9,000 = -7,950.
    expect(withHome.eigenWoning?.saldo).toBeCloseTo(-7_950, 6);
    expect(withHome.toetsingsinkomen).toBeCloseTo(40_000 - 7_950, 6);
    expect(withHome.toeslagen.zorgtoeslag.amount).toBeGreaterThan(without.toeslagen.zorgtoeslag.amount);
  });

  it("gives an owner no huurtoeslag, even with a rent typed", () => {
    const home = { vermogen: 0, children: [], rent: 800, allYoung: false, owner: { woz: 300_000, interest: 9_000 } };
    expect(householdTotal([{ jobs: [yearlyJob(25_000)] }], home, rules).toeslagen.huurtoeslag.amount).toBe(0);
  });
});

describe("householdTotal with erfpacht", () => {
  it("worked example: 1,200 erfpacht on top of 12,000 interest saves 5,187.04 a year at 51,840", () => {
    const home = { vermogen: 0, children: [], rent: null, allYoung: false };
    const without = householdNetto([{ jobs: [yearlyJob(51_840)] }], rules);
    const withHome = householdTotal([{ jobs: [yearlyJob(51_840)] }], { ...home, owner: { woz: 400_000, interest: 12_000, costs: 1_200 } }, rules);
    expect(without.tax - withHome.work.tax).toBeCloseTo(5_187.04, 2);
    expect(withHome.toetsingsinkomen).toBeCloseTo(51_840 - 11_800, 6);
  });
});
