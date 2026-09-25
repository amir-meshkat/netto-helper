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

export interface TaxRules {
  year: number;
  box1Brackets: Box1Bracket[];
  generalCredit: GeneralCreditRules;
  labourCredit: LabourCreditSegment[];
  entrepreneur: EntrepreneurRules;
  zvw: ZvwRules;
}
