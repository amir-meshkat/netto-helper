// Shape of one tax year's parameters. Amounts are euros per year, rates are fractions (0.3575 = 35.75%).

export interface Box1Bracket {
  /** Upper bound of this bracket. The last bracket uses Infinity. */
  upTo: number;
  rate: number;
}

/** General tax credit (algemene heffingskorting). */
export interface GeneralCreditRules {
  max: number;
  /** Income above which the credit starts to shrink. */
  phaseOutStart: number;
  /** Part of each euro above phaseOutStart that is taken off the credit. */
  phaseOutRate: number;
}

/**
 * One row of the labour tax credit (arbeidskorting) table.
 * Credit = base + rate x (income from work - from), for from <= income < upTo, minimum 0.
 */
export interface LabourCreditSegment {
  from: number;
  upTo: number;
  base: number;
  rate: number;
}

/** Rules for profit from a business (winst uit onderneming), such as zzp side income. */
export interface EntrepreneurRules {
  /** Hours per year in the business needed for the zelfstandigenaftrek (urencriterium). */
  hoursCriterion: number;
  /** Zelfstandigenaftrek. Needs the hours criterion. Not more than the profit, except for starters. */
  selfEmployedDeduction: number;
  /** Startersaftrek, on top of the zelfstandigenaftrek, for starters that meet the hours criterion. */
  starterDeduction: number;
  /** Mkb-winstvrijstelling: this part of the profit (after the deductions above) is not taxed. */
  profitExemptionRate: number;
  /**
   * Tariefsaanpassing: deductions save tax at most at a lower rate. For the part of the deductions
   * that falls in the top bracket, this percentage is added back.
   */
  topBracketDeductionAdjustment: number;
}

/** Income-dependent Zvw contribution that zzp'ers pay themselves (inkomensafhankelijke bijdrage Zvw). */
export interface ZvwRules {
  rate: number;
  /** Maximum income for the contribution (maximumbijdrage-inkomen). Salary counts toward it first. */
  maxIncome: number;
}

/** An amount for someone alone, and for someone with a toeslagpartner. */
export interface AlonePartner {
  alone: number;
  partner: number;
}

/** An amount for a one-person household, and for a household of more people. */
export interface OneMore {
  one: number;
  more: number;
}

/**
 * Zorgtoeslag = standaardpremie (twice with a toeslagpartner) minus the normpremie.
 * Normpremie = normpremieBase x drempelinkomen + normpremieRate x (income above the drempelinkomen).
 */
export interface ZorgtoeslagRules {
  standaardpremie: number;
  drempelinkomen: number;
  normpremieBase: AlonePartner;
  normpremieRate: number;
  /** Above this toetsingsinkomen: no zorgtoeslag at all, even where the formula still gives some. */
  maxIncome: AlonePartner;
  /** Maximum vermogen on 1 January. */
  maxVermogen: AlonePartner;
}

/** Kindgebonden budget: a yearly amount per child under 18, less a percentage of the income above a threshold. */
export interface KindgebondenBudgetRules {
  perChild: number;
  extra12to15: number;
  extra16to17: number;
  /** Alleenstaande-ouderkop: extra for a parent without toeslagpartner. */
  singleParent: number;
  threshold: AlonePartner;
  phaseOutRate: number;
  maxVermogen: AlonePartner;
}

/**
 * Huurtoeslag per month: shares of the bare rent in three bands above the basishuur,
 * minus a percentage of the yearly income above an income point (spread over 12 months).
 */
export interface HuurtoeslagRules {
  /** Rent counts up to this amount (rekengrens). A higher rent is allowed, the rest just does not count. */
  maxRent: number;
  /** Rekengrens when every resident is 18, 19 or 20. */
  maxRentYoung: number;
  /** The part of the rent you always pay yourself. */
  basishuur: OneMore;
  kwaliteitskortingsgrens: number;
  /** Aftoppingsgrens for 1 or 2 people, and for 3 or more. */
  aftoppingsgrens: { upToTwo: number; threeOrMore: number };
  /** Share of the rent paid up to the kwaliteitskortingsgrens, up to the aftoppingsgrens, and above it. */
  shares: { toKwaliteitskorting: number; toAftopping: number; aboveAftopping: number };
  /** Yearly toetsingsinkomen above which the toeslag goes down. */
  incomePoint: OneMore;
  /** Part of every euro above the income point that comes off the yearly toeslag. */
  phaseOutRate: OneMore;
  maxVermogen: AlonePartner;
}

export type ChildcareKind = "dagopvang" | "bso" | "gastouder";

/** One row of the kinderopvangtoeslag table: the share of the costs paid, by toetsingsinkomen. */
export interface KinderopvangBand {
  from: number;
  /** Up to and including. The last row uses Infinity. */
  upTo: number;
  /** For the child with the most hours of childcare. */
  first: number;
  /** For every other child. */
  next: number;
}

export interface KinderopvangRules {
  maxHourlyPrice: Record<ChildcareKind, number>;
  maxHoursPerMonth: number;
  table: KinderopvangBand[];
}

export interface ToeslagenRules {
  zorgtoeslag: ZorgtoeslagRules;
  kindgebondenBudget: KindgebondenBudgetRules;
  huurtoeslag: HuurtoeslagRules;
  kinderopvang: KinderopvangRules;
}

export interface TaxRules {
  year: number;
  box1Brackets: Box1Bracket[];
  generalCredit: GeneralCreditRules;
  labourCredit: LabourCreditSegment[];
  entrepreneur: EntrepreneurRules;
  zvw: ZvwRules;
  toeslagen: ToeslagenRules;
}
