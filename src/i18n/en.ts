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
    showWhy: "Show me why",
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
      "Deductions besides the mortgage interest and a lijfrente, savings in box 3, reserveringsruimte for a lijfrente, special bonus rates, business losses, the kleineondernemersregeling (KOR), investment deductions, and people at AOW age. For toeslagen: other people living with you besides your partner and children, and special situations. On salary your employer pays the Zvw health contribution; on side income you pay it yourself, and that is included.",
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

  /** The one page: title and intro above everything else. */
  page: {
    title: "What do you actually keep?",
    intro:
      "Simple answers in euros about Dutch salary, side income and tax, for everyone who wonders where their money goes. Type or drag your salary, add a partner or side income, and every answer updates as you go.",
    inputsTitle: "Your situation",
  },

  household: {
    salaryTitle: "Salary",
    sideTitle: "Side income as a zzp'er",
    addSide: "Add side income (zzp)",
    removeSide: "Remove",

    answerLabelOne: "Netto per month",
    answerLabelHousehold: "Household netto per month",
    answerLabelOneToeslagen: "Per month, with toeslagen",
    answerLabelHouseholdToeslagen: "Household per month, with toeslagen",
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
    nextHundredNote: "Earning more never leaves you with less in total, only less per extra euro.",
    nextHundredSplit: (tax: string, toeslagen: string | null) =>
      toeslagen ? `Income tax takes ${tax}, and your toeslagen go down by ${toeslagen}.` : `Income tax takes ${tax}.`,
    nextHundredStill: "You still end up with more in total, only a lot less per extra euro.",
    nextHundredNegative: (p: Who, amount: string) =>
      `The next €100 of salary leaves ${p.you ? "you" : p.inSentence} with ${amount} less.`,
    nextHundredLoss:
      "This is the armoedeval: at this income a toeslag drops at once. The toeslagen section shows which one, and where.",
    legendKept: "Kept",
    legendTax: "Income tax and Zvw",
    legendToeslag: "Lower toeslagen",
    answerSubToeslagen: (yearly: string, work: string, toeslagen: string, childcare: string | null) =>
      `That is ${yearly} per year: ${work} from work after income tax and pension, plus ${toeslagen} in toeslagen${
        childcare ? `, minus ${childcare} you pay for childcare after kinderopvangtoeslag` : ""
      }.`,
    splitToeslagen: "Toeslagen",
    splitChildcare: "Childcare you pay",

    why: {
      salary: "Salary per year, with holiday pay and bonus",
      pension: "Pension premium you pay",
      profit: "Side income profit (revenue minus costs)",
      selfEmployedDeduction: "Zelfstandigenaftrek",
      starterDeduction: "Startersaftrek",
      profitExemption: (rate: string) => `Mkb-winstvrijstelling, ${rate} of the profit`,
      woning: (two: boolean) => (two ? "Own home: share of forfait minus interest" : "Own home: forfait minus mortgage interest"),
      woningNl: "eigen woning",
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
        home: "Own home: the eigenwoningforfait minus the mortgage interest changes the taxable income. The mortgage section shows how.",
        partners: "Partners are taxed separately, each with their own brackets and credits.",
      },
      bracketStep: (rate: string, upTo: string | null) => (upTo ? `${rate} up to ${upTo}` : `${rate} above that`),
    },
  },

  /** The side income section: shown once someone has side income with a profit. */
  sideIncome: {
    answerOne: (p: Who) => `${keeps(p)} {amount} per month of the side income.`,
    answerOneSub: (profit: string, kept: string) => `Of ${profit} profit per year, ${kept} is left after income tax and Zvw.`,
    answerLabelTwo: "Who should earn it",
    answerBetter: (better: Who, other: Who) =>
      `The side income is worth {amount} more per month with ${better.inSentence} than with ${other.inSentence}.`,
    answerEither: "It hardly matters who earns it: about {amount} per month is left either way.",
    answerTwoSub: (first: Who, keptFirst: string, second: Who, keptSecond: string) =>
      `Of it, ${first.inSentence} would keep ${keptFirst} per month and ${second.inSentence} ${keptSecond}.`,
    answerEach: "Together you keep {amount} per month of your side incomes.",

    reasonTitle: "Where the side income goes",
    rowKeeps: (p: Who, kept: string, profit: string) => `${keeps(p)} ${kept} of ${profit} per month`,
    rowIf: (p: Who, now: boolean, kept: string, profit: string) =>
      `${ifEarns(p)}${now ? " (as now)" : ""}, ${keepsMid(p)} ${kept} of ${profit} per month`,
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
    chartSettingsOf: (p: Who, home: boolean) => `With ${whose(p)} holiday pay${home ? ", pension and part of the home" : " and pension"}`,
    tableToggle: "Show the numbers as a table",
    tableMain: "Salary, gross per month",
    tableKept: "Kept from the side income, per month",

    setAsideTitle: "How much to set aside",
    setAsideIntro:
      "There is no employer, so nothing is withheld on side income. You pay the income tax and Zvw on it with the tax return (aangifte), or monthly with a provisional assessment (voorlopige aanslag). Ask for one at the Belastingdienst to avoid one big bill.",
    setAsideLine: (p: Who | null, perMonth: string, tax: string, zvw: string) =>
      `${p ? `${ifEarns(p)}: set aside` : "Set aside"} ${perMonth} per month: ${tax} income tax and ${zvw} Zvw.`,
    setAsideOwn: (p: Who, perMonth: string, tax: string, zvw: string) =>
      `For ${whose(p)} side income, set aside ${perMonth} per month: ${tax} income tax and ${zvw} Zvw.`,

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
    lowersToeslagen: (perMonth: string, left: string) =>
      `It also raises your household income for toeslagen, which go down by ${perMonth} per month. So ${left} per month of the side income is really left.`,
    toeslagenUpdate:
      "Toeslagen are paid in advance on the income you expect. Tell Dienst Toeslagen about the side income (in Mijn toeslagen), or you pay it back later.",
  },

  /** The "Is working more worth it?" section: of the next €100, at every salary. */
  worthIt: {
    title: "Is working more worth it?",
    answerYes: (p: Who, two: boolean) =>
      two
        ? `Yes: of the next €100 ${p.you ? "you earn" : `${p.inSentence} earns`}, your household keeps {amount}.`
        : "Yes: of the next €100 you earn, you keep {amount}.",
    answerNo: (p: Who, two: boolean) =>
      two
        ? `Not the next €100 ${p.you ? "you earn" : `${p.inSentence} earns`}: it leaves your household with {amount} less.`
        : "Not the next €100: it leaves you with {amount} less.",
    range: (upTo: string, low: string, high: string, two: boolean) =>
      `For salaries up to ${upTo} per month, ${two ? "your household keeps" : "you keep"} between ${low} and ${high} of every extra €100.`,
    alwaysMore: "So your total always goes up when you earn more, only faster or slower.",
    mostlyMore:
      "Your total goes up with every raise, except one that only just crosses a tick at the top of the chart: there a toeslag drops at once.",
    lessBetween: (from: string, to: string) =>
      `Between ${from} and ${to} per month, earning more leaves you with less: the toeslagen go down faster than the salary goes up.`,
    stepsAverage: (steps: string, kept: string, two: boolean) =>
      `Kinderopvangtoeslag also goes down, in small steps. Spread evenly they cost ${steps} of every extra €100 here, so on average ${two ? "your household keeps" : "you keep"} ${kept}. The chart shows this average.`,
    whoseTitle: "Whose salary goes up",
    chartSub: (other: Who | null, otherSalary: string) =>
      other
        ? `Of the next €100 of salary, at every salary. ${other.you ? "Your" : `${other.name}'s`} salary stays at ${otherSalary} per month, and everything else as you typed it.`
        : "Of the next €100 of salary, at every salary, with everything else as you typed it.",
    legendStep: "A toeslag drops at once",
    chartX: "Salary, gross per month",
    chartY: "Of the next €100",
    marker: (p: Who, amount: string) => `${p.name}: ${amount}`,
    description: (p: Who, amount: string) =>
      `Stacked area chart of what is kept, what goes to income tax and what is lost in toeslagen, of the next €100 of salary, for salaries from zero upward. ${p.name}: ${amount} kept now.`,
    tooltipHead: (salary: string) => `Salary ${salary} per month`,
    tooltipTotal: (amount: string, two: boolean) => `${two ? "Household total" : "Your total"}: ${amount} per month`,
    tooltipSteps: (amount: string) => `Of the lower toeslagen, ${amount} is the kinderopvangtoeslag steps, on average`,
    tooltipNext: (at: string, name: string, loss: string) => `Next drop: at ${at}, ${name} −${loss} a year`,
    whyIntro: (p: Who, other: Who | null) =>
      `At every salary, what happens to the next €100 of ${p.you ? "your" : `${p.inSentence}'s`} salary, with everything else as you typed it: holiday pay, pension, side income${
        other ? `, ${other.you ? "your" : `${other.inSentence}'s`} salary` : ""
      }, children and rent.`,
    whyTax:
      "Income tax goes up in zones: the brackets, and the tax credits that grow and then shrink as income rises. That is why the red band steps up and down.",
    whyToeslagen: (list: string) => `Toeslagen go down gradually as the household income rises: ${list}.`,
    whyToeslag: (name: string, rate: string) => `${name} by ${rate} of it`,
    whyCliffs: "Where a toeslag drops at once:",
    whyZorgCliff: (at: string, loss: string) => `At ${at} per month, zorgtoeslag stops: the last ${loss} a year goes at once.`,
    whySteps: (count: number, from: string, to: string, low: string, high: string) =>
      `From ${from} to ${to} per month, kinderopvangtoeslag steps down ${count} times, by ${low} to ${high} a year each.`,
    tableToggle: "Show the numbers as a table",
    tableSalary: "Salary per month",
    tableKept: "Kept",
    tableTax: "Income tax and Zvw",
    tableToeslagen: "Lower toeslagen",
    tableTotal: "Total per month",
  },

  /** The own home and mortgage section: what the hypotheekrenteaftrek is worth. */
  mortgage: {
    title: "Your mortgage",
    answerLower: (two: boolean) =>
      two ? "Your mortgage lowers your household's tax by {amount} per month." : "Your mortgage lowers your tax by {amount} per month.",
    answerHigher: "Owning your home adds {amount} per month to your tax.",
    noEffect: "At this income the mortgage does not change your income tax: the tax credits already cover all of it.",
    typeFirst: "Type the WOZ value, what is left of the loan and the interest rate to see what the mortgage does to your tax.",
    cost: (interest: string, back: string, own: string, toeslagen: boolean) =>
      `Of ${interest} interest per month, ${back} comes back through lower tax${toeslagen ? " and higher toeslagen" : ""}, so the interest costs you ${own} per month.`,
    toeslagenUp: (amount: string) => `Toeslagen look at the income after the deduction, so they go up by ${amount} per month.`,
    higherWhy: "The eigenwoningforfait is larger than the mortgage interest, so a small part of it is taxed as income.",
    legendBack: "Comes back to you",
    legendOwn: "You pay",
    rowForfait: (rate: string) => `Imputed income for the home, ${rate} of the WOZ value (eigenwoningforfait)`,
    rowForfaitVilla: "Imputed income for the home (eigenwoningforfait, with the rate above the villagrens)",
    rowInterest: "Mortgage interest (hypotheekrente), loan × rate",
    rowHillen: "Deduction for little or no mortgage (Wet Hillen)",
    rowSaldo: "Balance in box 1",
    rowShare: (p: Who) => (p.you ? "Your share" : `${p.name}'s share`),
    rowTax: "Less income tax per year",
    rowTaxMore: "More income tax per year",
    rowToeslagen: "More toeslagen per year",
    steps: {
      forfait: (rate: string) =>
        `Owning the home you live in counts as a small income in box 1: the eigenwoningforfait, ${rate} of the WOZ value for most homes.`,
      interest: "The interest on the mortgage for the home comes off. It is usually larger than the forfait, so your taxable income goes down: that is the hypotheekrenteaftrek.",
      cap: (max: string) => `A deduction saves at most ${max} of every euro. In the top bracket the difference is added back (tariefsaanpassing).`,
      credit: (from: string, to: string, rate: string) =>
        `Between ${from} and ${to} the general tax credit goes up by ${rate} of every euro of deduction, so there it saves a little more.`,
      partners:
        "Fiscal partners may divide the balance any way they like. The page takes the division with the least tax together, and half each when nothing is better.",
      hillen: (rate: string) =>
        `When the forfait is larger than the interest, ${rate} of the difference is deducted (Wet Hillen). This deduction is being phased out until 2041.`,
    },
    aangifte:
      "Your employer does not know about the mortgage, so the tax comes back with the aangifte. Ask the Belastingdienst for a voorlopige aanslag to get it back every month.",
    notesTitle: "Mortgage",
    notes:
      "Interest is taken as loan × rate for the whole year, and the whole loan is taken to count for the deduction (eigenwoningschuld). Not included: erfpacht, the costs of taking out a mortgage, and part of a year. A partner on this page counts as your fiscal partner. The 2026 figures for the eigenwoningforfait and the Wet Hillen come from summaries of official pages and still need checking on belastingdienst.nl.",
  },

  /** "What could lower your tax?": what-if options, worked out on the situation typed. Lijfrente first. */
  lowerTax: {
    title: "What could lower your tax?",
    intro: "Options you could choose, worked out on your situation. They do not change the answers above unless you do them.",
    lijfrente: {
      title: "Save for your pension yourself",
      titleNl: "lijfrente",
      honey: (p: Who | null) =>
        p ? `Your honey spot: put {amount} in a lijfrente in ${p.you ? "your" : `${p.inSentence}'s`} name.` : "Your honey spot: put {amount} in a lijfrente.",
      honeySplit: (per: string, back: string, cost: string, toeslagen: boolean) =>
        `Of every €100 of it, ${per} comes back this year through lower tax${toeslagen ? " and higher toeslagen" : ""}: ${back} in all, so it costs you ${cost}.`,
      honeyAll: (p: Who | null) =>
        p ? `That is all of ${p.you ? "your" : `${p.inSentence}'s`} jaarruimte this year.` : "That is all of your jaarruimte this year.",
      honeyAfter: (after: string, room: string) =>
        `Above it, ${after} of every €100 comes back, up to the jaarruimte of ${room}. The honey spot is where each euro gives the most back.`,
      free: (p: Who | null, deposit: string) =>
        `Put ${deposit} in a lijfrente${p ? ` in ${p.you ? "your" : `${p.inSentence}'s`} name` : ""}: your household keeps {amount} more, and the ${deposit} goes to the pension.`,
      freeWhy: (name: string, upTo: string) =>
        `It brings the household income just under a point where ${name} drops at once. Up to ${upTo}, the household keeps at least as much as now, and all of it goes to the pension.`,
      otherPartner: (p: Who, deposit: string, per: string) => `For ${p.inSentence}, the honey spot is ${deposit}: ${per} of every €100 comes back.`,
      tryMore: "Try another amount",
      tryNow: (amount: string) => `Now: ${amount}`,
      tryResult: (p: Who | null, deposit: string, back: string, cost: string) =>
        `${p ? `In ${p.you ? "your" : `${p.inSentence}'s`} name, ` : ""}${deposit} gives ${back} back this year, so it costs ${cost}.`,
      noRoom: (p: Who | null) =>
        p ? `${p.name} has no room for a lijfrente this year (jaarruimte €0).` : "You have no room for a lijfrente this year (jaarruimte €0).",
      noRoomAll: "Neither of you has room for a lijfrente this year (jaarruimte €0).",
      aboveRoom: (p: Who, room: string) =>
        `Only ${room} counts for ${p.inSentence} this year: the rest is above the jaarruimte. Room left unused in the ten years before (reserveringsruimte) can add more; that is not included.`,
      factorAWarning: (p: Who) =>
        `${p.you ? "You build" : `${p.name} builds`} pension at work, so the jaarruimte is lower than shown. Type factor A from the pension overview (UPO) below.`,
      legendBack: "Comes back this year",
      legendOwn: "You pay now",
      later:
        "The money stays locked until your pension. You pay income tax on it when it is paid out, usually at a lower rate after AOW age: a lijfrente moves tax to later.",
      deposit: "Amount per year",
      depositNl: "lijfrentepremie",
      factorAMore: "Pension at work (factor A)",
      factorANow: (values: string) => `Now: ${values}`,
      factorANone: "none entered",
      factorA: (p: Who | null) => (p ? `Factor A, ${p.name}` : "Factor A"),
      factorAHint:
        "On the yearly pension overview (UPO) from your pension fund. It is the pension you built at work last year, and it lowers the room for a lijfrente. Leave it empty without a pension at work.",
      why: {
        income: "Income from work: salary after pension premium, plus profit before the zzp deductions",
        franchise: "Minus the AOW-franchise",
        base: "Premiegrondslag",
        rate: (rate: string) => `${rate} of it`,
        factorA: (multiplier: string) => `Minus ${multiplier} × factor A`,
        room: "Jaarruimte this year",
        honey: "Honey spot: put in",
        deductible: "Comes off the taxable income",
        tax: "Less income tax",
        toeslagen: "More toeslagen",
        back: "Back this year",
        perHundred: "Back of every €100",
        steps: {
          honey:
            "The honey spot is the amount where each euro gives the most back. What comes back changes where your income crosses a tax zone or a point where a toeslag starts or stops, so the page checks every one of those points up to the jaarruimte.",
          deduction: "The deposit comes off your taxable income in box 1, as long as it fits in the jaarruimte.",
          rate: (top: string) =>
            `It saves tax at your own rate, up to ${top} in the top bracket. Unlike the mortgage interest, this deduction is not capped.`,
          credit: (from: string, to: string, rate: string) =>
            `It also lowers the income that the general tax credit and the toeslagen look at: between ${from} and ${to} it saves ${rate} more, and toeslagen can go up.`,
          room: (rate: string, franchise: string, max: string, multiplier: string) =>
            `The jaarruimte is ${rate} of last year's income from work above ${franchise} (counting income up to ${max}), minus ${multiplier} × factor A. The page uses the income you typed now.`,
        },
      },
    },
    notesTitle: "Lijfrente",
    notes:
      "The lijfrente what-if uses the income typed now for last year's income. Not included: reserveringsruimte, and the tax when the lijfrente is paid out. The 2026 jaarruimte figures come from summaries of official pages and still need checking on belastingdienst.nl.",
  },

  /** The inputs for toeslagen and the own home: children and childcare, rent or a mortgage, savings. All optional. */
  homeForm: {
    title: "Children, home and savings",
    hint: "For toeslagen and the mortgage. Skip what does not apply.",
    addChild: "Add a child",
    childTitle: (n: number) => `Child ${n}`,
    remove: "Remove",
    age: "Age",
    addCare: "Add childcare (kinderopvang)",
    removeCare: "No childcare",
    careKind: "Type of childcare",
    careKinds: { dagopvang: "Day care", bso: "After school", gastouder: "Childminder" } as Record<"dagopvang" | "bso" | "gastouder", string>,
    careKindsNl: {
      dagopvang: "dagopvang",
      bso: "buitenschoolse opvang",
      gastouder: "gastouderopvang",
    } as Record<"dagopvang" | "bso" | "gastouder", string>,
    hours: "Hours per month",
    price: "Price per hour",
    careHint: (max: string, hours: string) =>
      `The toeslag counts up to ${max} per hour and ${hours} hours a month. It assumes you both work every month.`,
    addRent: "Add rent (huurtoeslag)",
    rentTitle: "Rent",
    rent: "Bare rent per month",
    rentNl: "kale huur",
    rentHint: "Without service costs: from 2026 only the bare rent counts.",
    allYoung: "Everyone living here is 18, 19 or 20",
    allYoungHint: (limit: string) => `Then rent counts up to ${limit} per month instead of the usual limit.`,
    addMortgage: "Add a mortgage (own home)",
    mortgageTitle: "Own home and mortgage",
    woz: "WOZ value of the home",
    wozNl: "WOZ-waarde",
    wozHint: "On the yearly letter from your municipality (WOZ-beschikking), or at wozwaardeloket.nl.",
    loan: "Mortgage left",
    loanNl: "hypotheekschuld",
    rate: "Interest rate",
    rateNl: "hypotheekrente",
    mortgageHint:
      "What you still owe on the loan for this home, and its interest rate per year. With several loan parts, add up the loans and use the average rate.",
    savingsMore: "Savings and investments",
    savingsNl: "vermogen",
    savingsNow: (amount: string | null) => (amount ? `Now: ${amount}` : "Now: none entered"),
    savings: "Savings and investments on 1 January",
    savingsHint: (huur: string, zorg: string) =>
      `Of the whole household. For someone alone: above ${huur} no huurtoeslag, above ${zorg} no zorgtoeslag or kindgebonden budget. The limits are higher with a partner.`,
  },

  /** The toeslagen section. */
  toeslagen: {
    title: "Toeslagen",
    answerOne: "You get about {amount} per month in toeslagen.",
    answerHousehold: "Together you get about {amount} per month in toeslagen.",
    answerNone: "At this income you get no toeslagen.",
    childcare: (toeslag: string, cost: string, own: string) =>
      `For childcare: kinderopvangtoeslag pays ${toeslag} of the ${cost} it costs per month, so you pay ${own} yourself.`,
    answerSub: (yearly: string, income: string) =>
      `That is ${yearly} a year. Toeslagen look at the combined taxable income of the household: ${income} a year.`,
    names: {
      zorgtoeslag: "Health care allowance",
      kindgebondenBudget: "Child budget",
      huurtoeslag: "Rent allowance",
      kinderopvang: "Childcare allowance",
    } as Record<"zorgtoeslag" | "kindgebondenBudget" | "huurtoeslag" | "kinderopvang", string>,
    namesNl: {
      zorgtoeslag: "zorgtoeslag",
      kindgebondenBudget: "kindgebonden budget",
      huurtoeslag: "huurtoeslag",
      kinderopvang: "kinderopvangtoeslag",
    } as Record<"zorgtoeslag" | "kindgebondenBudget" | "huurtoeslag" | "kinderopvang", string>,
    perMonth: (amount: string) => `${amount} per month`,
    noneIncome: (limit: string) => `none: income above ${limit}`,
    noneVermogen: "none: savings above the limit",
    noneAtIncome: "none at this income",
    typeRent: "type your rent to see it",
    next100: (amount: string) => `Of every extra €100 of household income, your toeslagen go down by ${amount}.`,
    cliff: (name: string, at: string, now: string, loss: string) =>
      `Watch out: at a household income of ${at} a year (now ${now}), ${name} drops by ${loss} a year at once.`,
    update:
      "Toeslagen are paid in advance on the income you expect. When your income changes, update it in Mijn toeslagen, or you pay back later.",
    why: {
      zorgtoeslag: (standaard: string, norm: string, amount: string) =>
        `Standaardpremie ${standaard} minus the normpremie ${norm} (the part you pay yourself, which grows with income) = ${amount} a year.`,
      zorgtoeslagStopped: (limit: string) => `The income is above ${limit}, so there is no zorgtoeslag at all.`,
      kindgebonden: (maximum: string, reduction: string, amount: string) =>
        `The maximum for your children is ${maximum}; minus 7.6% of the income above the threshold (${reduction}) = ${amount} a year.`,
      huur: (counted: string, basis: string, perMonth: string, reduction: string, amount: string) =>
        `Rent counted ${counted} per month; you always pay the first ${basis} yourself. Of the rent above that, the toeslag pays 100%, then 65%, then 40%: ${perMonth} per month. Minus a part of the income above the income point (${reduction} a year) = ${amount} a year.`,
      huurUnverified:
        "Some 2026 huurtoeslag figures (the basishuur, the income point and its percentage) come from summaries of official pages and still need checking on the pages themselves.",
      kinderopvangChild: (n: number, share: string, price: string, hours: string, amount: string) =>
        `Child ${n}: ${share} of ${price} × ${hours} hours × 12 months = ${amount} a year.`,
      kinderopvangFirst: "The child with the most hours of childcare counts as the first child; the others get the percentage for the next child.",
      vermogen: "Savings are above the limit, so there is none.",
    },
    notesTitle: "Toeslagen",
    notes:
      "Worked out for the whole of 2026 on the combined taxable income, so for toeslagen it does not matter which partner earns it. A partner on this page counts as your toeslagpartner. Kinderopvangtoeslag assumes you both work every month. Some huurtoeslag figures still need checking on an official page.",
  },
};

export type Messages = typeof en;
