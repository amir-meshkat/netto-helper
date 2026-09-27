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

  // Deductions save at most 37.56% in the top bracket: 49.50% - 37.56% = 11.94% is added back.
  // For the eigen woning, confirmed via search of the Belastingdienst page on the tariefsaanpassing eigen woning.
  topBracketDeductionAdjustment: 0.1194,

  entrepreneur: {
    hoursCriterion: 1_225,
    selfEmployedDeduction: 1_200,
    starterDeduction: 2_123,
    profitExemptionRate: 0.127,
  },

  // Eigen woning 2026. Not verified on belastingdienst.nl itself (not reachable from the cloud session):
  // from search results quoting it, see docs/mortgage-2026.md.
  eigenWoning: {
    forfait: [
      { upTo: 12_500, rate: 0 },
      { upTo: 25_000, rate: 0.001 },
      { upTo: 50_000, rate: 0.002 },
      { upTo: 75_000, rate: 0.0025 },
      { upTo: 1_350_000, rate: 0.0035 },
    ],
    villa: { from: 1_350_000, base: 4_725, rate: 0.0235 },
    // 76.667% in 2025, 4.8 percentage points less every year from 2026, gone in 2041.
    hillenRate: 0.71867,
  },

  // Lijfrente 2026, from search results quoting belastingdienst.nl and pension providers: see docs/lijfrente-2026.md.
  // The jaarruimte for 2026 is worked out on the income of 2025.
  lijfrente: {
    rate: 0.3,
    franchise: 19_172,
    maxIncome: 137_800,
    factorAMultiplier: 6.27,
    maxJaarruimte: 35_589,
    maxReserveringsruimte: 42_753,
  },

  zvw: {
    rate: 0.0485,
    maxIncome: 79_409,
  },

  // Toeslagen 2026. Sources, because cloud sessions cannot reach belastingdienst.nl:
  // - Toeslagenkaart 2026 (Dienst Toeslagen, November 2025), docs/sources/toeslagenkaart-2026.pdf.
  // - Kinderopvangtoeslag table from rijksoverheid.nl, docs/sources/kinderopvangtoeslag-2026.md.
  // - Huurtoeslag changes from belastingdienst.nl, docs/sources/huurtoeslag-2026-wijzigingen.md.
  // Huurtoeslag figures beyond the card come from search summaries of official pages, the same in several
  // sources (rechecked 27 September 2026); see CLAUDE.md.
  toeslagen: {
    zorgtoeslag: {
      // Not on the card, but with these the card's maximum toeslag comes out to the euro:
      // 2,119 - 1.912% x 29,736 = 1,550 alone, 2 x 2,119 - 4.289% x 29,736 = 2,963 with a toeslagpartner.
      standaardpremie: 2_119,
      drempelinkomen: 29_736,
      normpremieBase: { alone: 0.01912, partner: 0.04289 },
      normpremieRate: 0.1373,
      maxIncome: { alone: 40_857, partner: 51_142 }, // card
      maxVermogen: { alone: 146_011, partner: 184_633 }, // card
    },

    // All from the card. The alleenstaande-ouderkop is the card's 5,996 for one child minus 2,580.
    kindgebondenBudget: {
      perChild: 2_580,
      extra12to15: 724,
      extra16to17: 964,
      singleParent: 3_416,
      threshold: { alone: 29_736, partner: 39_141 },
      phaseOutRate: 0.076,
      maxVermogen: { alone: 146_011, partner: 184_633 },
    },

    huurtoeslag: {
      maxRent: 932.93, // card
      maxRentYoung: 498.2, // card
      // Not verified: basishuur, income point and phase-out rate (Rijksoverheid summaries found by search).
      basishuur: { one: 202.52, more: 200.71 },
      // Not verified, but consistent: in earlier years the kwaliteitskortingsgrens equalled the rekengrens
      // for young people (498.20 in 2026), and both limits below grew by the same 4.4% from 2025.
      kwaliteitskortingsgrens: 498.2,
      aftoppingsgrens: { upToTwo: 713.02, threeOrMore: 764.14 },
      // From 2026 every household gets 40% above the aftoppingsgrens (Rijksoverheid factsheet, via search).
      shares: { toKwaliteitskorting: 1, toAftopping: 0.65, aboveAftopping: 0.4 },
      incomePoint: { one: 23_425, more: 31_500 },
      phaseOutRate: { one: 0.27, more: 0.22 },
      maxVermogen: { alone: 38_479, partner: 76_958 }, // card
    },

    kinderopvang: {
      maxHourlyPrice: { dagopvang: 11.23, bso: 9.98, gastouder: 8.49 },
      maxHoursPerMonth: 230,
      // Generated from docs/sources/kinderopvangtoeslag-2026.md; rules.test.ts checks they match.
      table: [
        { from: 0, upTo: 24_149, first: 0.96, next: 0.96 },
        { from: 24_150, upTo: 25_756, first: 0.96, next: 0.96 },
        { from: 25_757, upTo: 27_363, first: 0.96, next: 0.96 },
        { from: 27_364, upTo: 28_973, first: 0.96, next: 0.96 },
        { from: 28_974, upTo: 30_579, first: 0.96, next: 0.96 },
        { from: 30_580, upTo: 32_189, first: 0.96, next: 0.96 },
        { from: 32_190, upTo: 33_795, first: 0.96, next: 0.96 },
        { from: 33_796, upTo: 35_400, first: 0.96, next: 0.96 },
        { from: 35_401, upTo: 37_129, first: 0.96, next: 0.96 },
        { from: 37_130, upTo: 38_855, first: 0.96, next: 0.96 },
        { from: 38_856, upTo: 40_586, first: 0.96, next: 0.96 },
        { from: 40_587, upTo: 42_313, first: 0.96, next: 0.96 },
        { from: 42_314, upTo: 44_046, first: 0.96, next: 0.96 },
        { from: 44_047, upTo: 45_776, first: 0.96, next: 0.96 },
        { from: 45_777, upTo: 47_546, first: 0.96, next: 0.96 },
        { from: 47_547, upTo: 49_318, first: 0.96, next: 0.96 },
        { from: 49_319, upTo: 51_092, first: 0.96, next: 0.96 },
        { from: 51_093, upTo: 52_864, first: 0.96, next: 0.96 },
        { from: 52_865, upTo: 54_641, first: 0.96, next: 0.96 },
        { from: 54_642, upTo: 56_412, first: 0.96, next: 0.96 },
        { from: 56_413, upTo: 58_184, first: 0.955, next: 0.956 },
        { from: 58_185, upTo: 59_957, first: 0.948, next: 0.956 },
        { from: 59_958, upTo: 61_895, first: 0.939, next: 0.956 },
        { from: 61_896, upTo: 65_695, first: 0.924, next: 0.956 },
        { from: 65_696, upTo: 69_492, first: 0.916, next: 0.952 },
        { from: 69_493, upTo: 73_292, first: 0.905, next: 0.946 },
        { from: 73_293, upTo: 77_094, first: 0.882, next: 0.942 },
        { from: 77_095, upTo: 80_891, first: 0.859, next: 0.939 },
        { from: 80_892, upTo: 84_693, first: 0.837, next: 0.932 },
        { from: 84_694, upTo: 88_491, first: 0.812, next: 0.927 },
        { from: 88_492, upTo: 92_291, first: 0.789, next: 0.922 },
        { from: 92_292, upTo: 96_091, first: 0.767, next: 0.915 },
        { from: 96_092, upTo: 99_889, first: 0.743, next: 0.909 },
        { from: 99_890, upTo: 103_694, first: 0.721, next: 0.905 },
        { from: 103_695, upTo: 107_492, first: 0.696, next: 0.902 },
        { from: 107_493, upTo: 111_290, first: 0.673, next: 0.895 },
        { from: 111_291, upTo: 115_090, first: 0.651, next: 0.891 },
        { from: 115_091, upTo: 118_963, first: 0.627, next: 0.886 },
        { from: 118_964, upTo: 122_857, first: 0.606, next: 0.879 },
        { from: 122_858, upTo: 126_747, first: 0.585, next: 0.874 },
        { from: 126_748, upTo: 130_638, first: 0.564, next: 0.87 },
        { from: 130_639, upTo: 134_527, first: 0.542, next: 0.867 },
        { from: 134_528, upTo: 138_420, first: 0.523, next: 0.86 },
        { from: 138_421, upTo: 142_312, first: 0.504, next: 0.854 },
        { from: 142_313, upTo: 146_205, first: 0.485, next: 0.85 },
        { from: 146_206, upTo: 150_092, first: 0.465, next: 0.844 },
        { from: 150_093, upTo: 153_982, first: 0.445, next: 0.84 },
        { from: 153_983, upTo: 157_877, first: 0.425, next: 0.833 },
        { from: 157_878, upTo: 161_766, first: 0.405, next: 0.827 },
        { from: 161_767, upTo: 165_657, first: 0.385, next: 0.817 },
        { from: 165_658, upTo: 169_547, first: 0.365, next: 0.814 },
        { from: 169_548, upTo: 173_440, first: 0.365, next: 0.806 },
        { from: 173_441, upTo: 177_335, first: 0.365, next: 0.797 },
        { from: 177_336, upTo: 181_223, first: 0.365, next: 0.791 },
        { from: 181_224, upTo: 185_114, first: 0.365, next: 0.782 },
        { from: 185_115, upTo: 189_002, first: 0.365, next: 0.777 },
        { from: 189_003, upTo: 192_896, first: 0.365, next: 0.769 },
        { from: 192_897, upTo: 196_789, first: 0.365, next: 0.762 },
        { from: 196_790, upTo: 200_681, first: 0.365, next: 0.755 },
        { from: 200_682, upTo: 204_571, first: 0.365, next: 0.745 },
        { from: 204_572, upTo: 208_458, first: 0.365, next: 0.74 },
        { from: 208_459, upTo: 212_353, first: 0.365, next: 0.733 },
        { from: 212_354, upTo: 216_242, first: 0.365, next: 0.725 },
        { from: 216_243, upTo: 220_134, first: 0.365, next: 0.718 },
        { from: 220_135, upTo: 224_026, first: 0.365, next: 0.712 },
        { from: 224_027, upTo: 227_915, first: 0.365, next: 0.704 },
        { from: 227_916, upTo: 231_807, first: 0.365, next: 0.696 },
        { from: 231_808, upTo: 235_697, first: 0.365, next: 0.691 },
        { from: 235_698, upTo: Infinity, first: 0.365, next: 0.682 },
      ],
    },
  },
};
