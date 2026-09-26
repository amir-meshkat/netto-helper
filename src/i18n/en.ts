// All English UI text. nl.ts and fa.ts will have exactly the same shape (type Messages).
// Sentences are functions so every language can choose its own word order.
// "{amount}" marks where the UI puts a highlighted amount inside a sentence.

/** Who a sentence is about: "You", "Your partner", or a name typed by the user. */
export interface Who {
  /** At the start of a sentence: "You", "Your partner", "Sara". */
  name: string;
  /** Inside a sentence: "you", "your partner", "Sara". */
  inSentence: string;
  you: boolean;
}

const keeps = (p: Who) => (p.you ? "You keep" : `${p.name} keeps`);
const keepsMid = (p: Who) => (p.you ? "you keep" : `${p.inSentence} keeps`);
const whose = (p: Who) => (p.you ? "your" : `${p.inSentence}'s`);
const ifEarns = (p: Who) => (p.you ? "If you earn it" : `If ${p.inSentence} earns it`);

export const en = {
  meta: {
    lang: "en",
    dir: "ltr" as "ltr" | "rtl",
    numberLocale: "en-GB",
    siteName: "Netto Helper",
  },

  common: {
    homeLink: "All tools",
    showWhy: "Show me why",
    perMonth: "per month",
    comingSoon: "Coming soon",
    open: "Open",
    you: "You",
    youInSentence: "you",
    partner: "Your partner",
    partnerInSentence: "your partner",
    nameLabel: "Name",
    nameHint: "optional",
    addPartner: "Add a partner",
    removePartner: "Remove",
    privacy:
      "Private by design: everything is calculated in your browser. Nothing you type is sent anywhere or stored on a server.",
    disclaimer:
      "Indicative only, not tax advice. Figures for 2026, for people below AOW age. Rounding can differ a few euros from the Belastingdienst.",
    notIncludedTitle: "Not included yet",
    notIncluded:
      "Toeslagen, mortgage interest and other deductions, savings in box 3, lijfrente, special bonus rates, business losses, the kleineondernemersregeling (KOR), investment deductions, and people at AOW age. On salary your employer pays the Zvw health contribution; on side income you pay it yourself, and that is included.",
    netto: "Netto: yours to keep",
    tax: "Income tax and national insurance",
    taxAndZvw: "Income tax, national insurance and Zvw",
    pension: "Pension: your own savings for later",
    couplesTitle: "Couples",
    couples:
      "Income is taxed per person. Being fiscal partners does not change the numbers here. It starts to matter for shared items such as mortgage interest, savings in box 3 and deductions. For toeslagen, the combined income counts.",
  },

  /** The fields of a salaried job. */
  jobForm: {
    monthlyGross: "Gross salary per month",
    monthlyGrossNl: "bruto maandsalaris",
    moreDetails: "Holiday pay, bonus and pension",
    detailsNow: (holiday: string, bonus: string | null, pension: string | null) =>
      `Now: ${holiday} holiday pay, ${bonus ? `${bonus} bonus` : "no bonus"}, ${pension ? `${pension} pension` : "no pension"}`,
    pensionPerMonth: (amount: string) => `${amount} a month`,
    pensionScheme: (rate: string, franchise: string) => `${rate} above ${franchise}`,
    holiday: "Holiday pay",
    holidayNl: "vakantiegeld",
    yearEnd: "Year-end bonus or 13th month",
    yearEndNl: "eindejaarsuitkering",
    pension: "Pension premium you pay",
    pensionNl: "pensioenpremie",
    pensionModeMonthly: "Amount on my payslip",
    pensionModeScheme: "Percentage and franchise",
    pensionMonthly: "Per month",
    pensionMonthlyHint:
      "On your payslip, look for the pension deduction (pensioenpremie or werknemersdeel pensioen). Leave 0 if you have none.",
    pensionRate: "Premium",
    franchise: "Franchise per year",
    pensionSchemeHint:
      "Both are in your pension regulation (pensioenreglement). The franchise is the part of your salary without pension build-up.",
    notANumber: "Please type a number, for example 3500 or 3.500",
  },

  /** The fields of side income as a zzp'er. */
  sideForm: {
    revenue: "Revenue per year",
    revenueNl: "omzet",
    costs: "Business costs per year",
    costsNl: "kosten",
    amountsHint: "Per year, without btw. Revenue minus costs is your profit.",
    moreDetails: "Hours, starter and business status",
    now: (business: boolean, hours: boolean, starter: boolean) =>
      business
        ? `Now: a business, ${hours ? "hours criterion met" : "hours criterion not met"}${starter ? ", starter" : ""}`
        : "Now: other work, not a business",
    business: "The Belastingdienst sees it as a business",
    businessNl: "onderneming",
    businessHint:
      "True for most zzp'ers with several clients. If not, it counts as other work (resultaat uit overige werkzaamheden): then the mkb-winstvrijstelling and the entrepreneur deductions do not apply.",
    hours: (hours: string) => `I work ${hours} hours or more a year in it`,
    hoursNl: "urencriterium",
    hoursHint: (perWeek: string, amount: string) =>
      `That is about ${perWeek} hours a week, so rare next to a job. It gives the zelfstandigenaftrek of ${amount}.`,
    starter: "I started less than 5 years ago",
    starterNl: "startersaftrek",
    starterHint: (amount: string) => `Adds a startersaftrek of ${amount}, but only together with the hours criterion.`,
  },

  landing: {
    title: "What do you actually keep?",
    intro:
      "Simple answers in euros about Dutch salary, side income, tax and toeslagen. Made for everyone who wonders where their money goes, and whether working more is worth it.",
    quickLabel: "Your gross salary per month",
    quickAnswer: "You keep {amount} per month.",
    quickNote: "Holiday pay included, spread over the year.",
    quickMore: "Add pension, side income or a partner",
    toolsTitle: "Questions this site answers",
    tools: [
      {
        id: "household",
        question: "What does our household keep?",
        text: "Netto per month for one or two people, with salary and side income.",
      },
      {
        id: "side-income",
        question: "What is left of side income as a zzp'er?",
        text: "What you keep, how much to set aside for tax, and which partner should earn it.",
      },
      {
        id: "next-100",
        question: "Is working more worth it?",
        text: "Of the next €100 you earn, how much do you keep? Spoiler: always something, from income tax alone.",
      },
      {
        id: "toeslagen",
        question: "What about toeslagen?",
        text: "Huurtoeslag, zorgtoeslag and kindgebonden budget, and the places where earning more can cost you.",
      },
    ],
  },

  household: {
    title: "What does your household keep?",
    intro:
      "Type each person's gross monthly salary, and any side income as a zzp'er. You see right away what is left each month.",
    inputsTitle: "Your situation",
    salaryTitle: "Salary",
    sideTitle: "Side income as a zzp'er",
    addSide: "Add side income (zzp)",
    removeSide: "Remove",

    answerLabelOne: "Netto per month",
    answerLabelHousehold: "Household netto per month",
    answerOne: (p: Who) => `${keeps(p)} {amount} per month.`,
    answerHousehold: `Together you keep {amount} per month.`,
    answerSub: (yearly: string, hasSide: boolean) =>
      `That is ${yearly} per year after income tax${hasSide ? ", Zvw" : ""} and pension. Holiday pay, bonus${hasSide ? " and side income are" : " are"} spread over the 12 months.`,
    answerEmpty: "Type a gross monthly salary to see the answer.",

    reasonTitle: "Where each €100 goes",
    reasonSentence: (netto: string) => `Of every €100 earned, ${netto} stays with you.`,
    reasonSentenceHousehold: (netto: string) => `Of every €100 your household earns, ${netto} stays with you.`,

    personTitle: (p: Who) => p.name,
    detailsTitleOne: "Your numbers",
    personKeeps: (p: Who) => `${keeps(p)} {amount} per month`,
    nextHundred: (p: Who, amount: string) => `${keeps(p)} ${amount} of the next €100 of salary.`,
    nextHundredNote: "Earning more never leaves you with less in total, only less per extra euro. Toeslagen are not included yet.",
    setAside: (p: Who, perMonth: string, perYear: string) =>
      `Nothing is withheld on ${whose(p)} side income. Set aside about ${perMonth} per month (${perYear} a year) for income tax and Zvw, or ask for a provisional assessment (voorlopige aanslag) to pay it monthly.`,

    why: {
      salary: "Salary per year, with holiday pay and bonus",
      pension: "Pension premium you pay",
      profit: "Side income profit (revenue minus costs)",
      selfEmployedDeduction: "Zelfstandigenaftrek",
      starterDeduction: "Startersaftrek",
      profitExemption: (rate: string) => `Mkb-winstvrijstelling, ${rate} of the profit`,
      taxable: "Taxable income",
      taxableNl: "belastbaar inkomen box 1",
      box1: "Tax and national insurance, by bracket",
      bracket: (rate: string, amount: string) => `${rate} over ${amount}`,
      topBracketAdjustment: (rate: string) => `Tariefsaanpassing: in the top bracket deductions save at most ${rate}`,
      generalCredit: "General tax credit",
      generalCreditNl: "algemene heffingskorting",
      labourCredit: "Labour tax credit",
      labourCreditNl: "arbeidskorting",
      creditsCapped: "The credits are larger than the tax, so the tax becomes zero. The rest is not paid out.",
      taxToPay: "Income tax to pay",
      zvw: "Zvw contribution on side income",
      zvwNl: "inkomensafhankelijke bijdrage Zvw",
      nettoYear: "Netto per year",
      nettoMonth: "Netto per month, on average",
      stepsTitle: "How it works",
      steps: {
        gross: "Salary per year is the monthly salary times 12, plus holiday pay and bonus.",
        pension: "The pension premium comes off before tax, so it lowers your tax too.",
        side: (rate: string) =>
          `Side income: the profit minus the mkb-winstvrijstelling (${rate}) is added to the salary and taxed in the same brackets. For the labour credit the full profit counts as income from work.`,
        brackets: (list: string) =>
          `Tax goes in steps: ${list}. Each rate only applies to the part of income inside its step. These rates include the AOW, Anw and Wlz premiums.`,
        generalCredit: (max: string, start: string, rate: string) =>
          `General tax credit (algemene heffingskorting): ${max}, reduced by ${rate} of income above ${start}.`,
        labourCredit: (peak: string, peakAt: string, rate: string) =>
          `Labour tax credit (arbeidskorting): grows with your income up to ${peak} at ${peakAt}, then shrinks by ${rate} of every euro above that.`,
        zvw: (rate: string, max: string) =>
          `On side income you pay the Zvw contribution yourself: ${rate} of the taxed profit. Salary counts first toward the maximum of ${max}.`,
        partners: "Partners are taxed separately, each with their own brackets and credits.",
      },
      bracketStep: (rate: string, upTo: string | null) => (upTo ? `${rate} up to ${upTo}` : `${rate} above that`),
    },
  },

  sideIncome: {
    title: "Side income as a zzp'er",
    intro:
      "Freelance work on top of a salary: what you keep, how much to set aside for tax, and for couples, which partner keeps the most of it.",
    inputsTitle: "Your situation",
    salaryTitle: "Salary",
    sideTitle: "The side income",
    addPartner: "Add a partner, to see who should earn it",

    answerLabelOne: "What you keep",
    answerOne: (p: Who) => `${keeps(p)} {amount} per month of the side income.`,
    answerOneSub: (profit: string, kept: string) => `Of ${profit} profit per year, ${kept} is left after income tax and Zvw.`,
    setAsideOne: (perMonth: string) =>
      `Set aside ${perMonth} per month for income tax and Zvw: nothing is withheld on side income.`,
    answerLabelTwo: "Who should earn it",
    answerBetter: (better: Who, other: Who) =>
      `The side income is worth {amount} more per month with ${better.inSentence} than with ${other.inSentence}.`,
    answerEither: "It hardly matters who earns it: about {amount} per month is left either way.",
    answerTwoSub: (first: Who, keptFirst: string, second: Who, keptSecond: string) =>
      `Of it, ${first.inSentence} would keep ${keptFirst} per month and ${second.inSentence} ${keptSecond}.`,
    answerEmpty: "Type the revenue of the side income to see the answer.",
    pillOne: (kept: string, setAside: string) => `Keep ${kept}, set aside ${setAside} per month`,
    pillBetter: (p: Who, amount: string) => `Best with ${p.inSentence}: ${amount} more per month`,
    pillEither: (amount: string) => `Either way about ${amount} per month`,

    reasonTitle: "Where the side income goes",
    rowKeeps: (p: Who, kept: string, profit: string) => `${keeps(p)} ${kept} of ${profit} per month`,
    legendKept: "Kept",
    legendSetAside: "Set aside: income tax and Zvw",
    reasonWhy: (a: Who, keptA: string, b: Who, keptB: string) =>
      `Why: at the current salaries, ${keepsMid(a)} ${keptA} of the next €100 earned, and ${keepsMid(b)} ${keptB}.`,
    reasonWhyOne: (p: Who, kept: string) => `Why: at this salary, ${keepsMid(p)} ${kept} of the next €100 earned.`,
    householdIf: (p: Who, amount: string) =>
      p.you ? `Household netto if you earn it: ${amount} per month` : `Household netto if ${p.inSentence} earns it: ${amount} per month`,

    chartTitle: "What the side income leaves, by salary",
    chartSub: (profit: string, two: boolean) =>
      `For a side profit of ${profit} per month. The ${two ? "dots show where you both are" : "dot shows where you are"} now.`,
    chartX: "Salary, gross per month",
    chartY: "Kept from the side income, per month",
    chartWhole: (amount: string) => `All of the profit: ${amount}`,
    chartDescription: (points: string) =>
      `Line chart of how much of the side income is kept per month, for salaries from zero upward. ${points}`,
    chartTooltipMain: (amount: string) => `Salary ${amount} per month`,
    chartTooltipKept: "kept per month",
    chartSettingsOf: (p: Who) => `With ${whose(p)} holiday pay and pension`,
    tableToggle: "Show the numbers as a table",
    tableMain: "Salary, gross per month",
    tableKept: "Kept from the side income, per month",

    setAsideTitle: "How much to set aside",
    setAsideIntro:
      "There is no employer, so nothing is withheld on side income. You pay the income tax and Zvw on it with the tax return (aangifte), or monthly with a provisional assessment (voorlopige aanslag). Ask for one at the Belastingdienst to avoid one big bill.",
    setAsideLine: (p: Who | null, perMonth: string, tax: string, zvw: string) =>
      `${p ? `${ifEarns(p)}: set aside` : "Set aside"} ${perMonth} per month: ${tax} income tax and ${zvw} Zvw.`,

    whyProfit: "Profit (revenue minus costs)",
    whyDeductions: "Entrepreneur deductions and mkb-winstvrijstelling",
    whyExtraTax: "Extra income tax",
    whyZvw: "Zvw contribution",
    whyKept: "Kept per year",
    whyKeptMonth: "Kept per month",
    whySetAsideMonth: "Set aside per month",
    whySteps: [
      "Tax is calculated per person, on salary plus side income together.",
      "Side income comes on top of the salary, so it is taxed at the rates of the zone that person is already in. That zone differs per partner.",
      "The mkb-winstvrijstelling makes part of the profit tax free. On the rest you also pay the Zvw contribution yourself.",
      "What the side income is worth: netto with it minus netto without it. What is not kept is what to set aside.",
    ],

    notesSideTitle: "Side income",
    notesSide: "Amounts are without btw.",
    toeslagenTitle: "Toeslagen",
    toeslagen:
      "For toeslagen (huurtoeslag, zorgtoeslag, kindgebonden budget) the combined household income counts, so there it does not matter who earns the side income. Toeslagen are not included on this site yet.",
  },
};

export type Messages = typeof en;
