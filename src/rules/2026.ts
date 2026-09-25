import type { TaxRules } from "./types";

// Tax year 2026, box 1, people below AOW age. Parameters only, no logic.
// Checked on 25 September 2026 against belastingdienst.nl: "Fiscale informatie 2026" chapters
// heffingskortingen, ondernemersaftrek, inkomensafhankelijke bijdrage Zvw, and the pages
// "Box 1: uitleg en tarieven", "Mkb-winstvrijstelling 2026", "Zelfstandigenaftrek 2026",
// "Percentages inkomensafhankelijke bijdrage Zvw" and "Tariefsaanpassing aftrekposten".
export const rules2026: TaxRules = {
  year: 2026,

  // Rates include the AOW, Anw and Wlz premiums (premies volksverzekeringen).
  box1Brackets: [
    { upTo: 38_883, rate: 0.3575 },
    { upTo: 78_426, rate: 0.3756 },
    { upTo: Infinity, rate: 0.495 },
  ],

  generalCredit: {
    max: 3_115,
    phaseOutStart: 29_736,
    phaseOutRate: 0.06398,
  },

  labourCredit: [
    { from: 0, upTo: 11_965, base: 0, rate: 0.08324 },
    { from: 11_965, upTo: 25_845, base: 996, rate: 0.31009 },
    { from: 25_845, upTo: 45_592, base: 5_300, rate: 0.0195 },
    { from: 45_592, upTo: 132_920, base: 5_685, rate: -0.0651 },
    { from: 132_920, upTo: Infinity, base: 0, rate: 0 },
  ],

  entrepreneur: {
    hoursCriterion: 1_225,
    selfEmployedDeduction: 1_200,
    starterDeduction: 2_123,
    profitExemptionRate: 0.127,
    // Deductions save at most 37.56% in the top bracket: 49.50% - 37.56% = 11.94% is added back.
    topBracketDeductionAdjustment: 0.1194,
  },

  zvw: {
    rate: 0.0485,
    maxIncome: 79_409,
  },
};
