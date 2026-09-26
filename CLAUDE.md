# Netto Helper: Dutch income and toeslagen explained

## What this project is

A small website that helps ordinary people in the Netherlands understand what they actually keep from their salary, and why. The owner is Amir, a geodata engineer (civil engineering and GIS background, works in C#, FME, Dynamo). He is building this to help himself, his partner and his friends, and to learn the Dutch tax rules along the way.

The site is a set of real, static web pages. No backend. All calculations run in the browser, and no personal data is sent anywhere or stored on a server.

## How to work with Amir

This is a learning project as much as a software project. Follow these rules:

- Work in small steps. One milestone at a time, and stop at the end of each one so Amir can review it.
- Before implementing a tax rule, explain it in plain language in a short paragraph, with one worked example in euros. Then write the test, then the code.
- Do not build ahead. If you see something useful for a later milestone, mention it in one line and continue with the current one.
- When a rule or number is uncertain, say so and point to where it should be verified (Belastingdienst, Dienst Toeslagen, rijksoverheid.nl). Never invent a figure.
- Never use em dashes in any text you write for this project: UI copy, docs, comments or commit messages. Use a colon, comma or a new sentence instead.

## Design principles for the pages

The audience has limited patience for complexity. The page, and each section on it, follows the same order:

1. **Answer first.** One sentence in euros, preferably per month. Example: "The second job is worth €130 more per month with Sara than with you."
2. **One simple reason.** A visual that needs no explanation.
3. **Details on request.** The full step by step calculation behind a "Show me why" toggle.

Other principles:

- Prefer euros over percentages. "Of the next €100 you keep €58" beats "marginal rate 42%".
- Bust the myth "if I work more I end up with less". For income tax alone you always keep more in total, only less per extra euro. Show both at once: total netto (always grows) and "of the next €100" (grows and shrinks by zone).
- Be honest about the exception: once toeslagen are added, the combined rate can reach 70 to 80%, and at a hard income limit earning a little more can leave you with less (the armoedeval). For zorgtoeslag in 2026 the hard limit is small (the last €24 a year stops at once); the bigger effect is the steady phase-out, 13.73% of every extra euro. Show this when it happens, do not hide it.
- Label Dutch terms next to English ones, for example "General tax credit (algemene heffingskorting)". Later the site will be available in English, Dutch and Persian, so keep all UI text in a translation file from the start, and make layouts ready for right to left text (Persian).
- Numbers can be typed or dragged. Every number input has a slider next to its text box, and the results update in real time while dragging (milestone 4). Income comes first.
- Many parameters, all optional. Add every parameter that changes the answer for real people, but give each one a sensible default and keep it behind a "More details" toggle, like holiday pay and pension today. The answer shows before any of them is filled in.
- The page starts simple: one salary and one answer. A section only appears once the person adds what it needs (a partner, side income, children or rent).
- The page works on a phone.
- The page shows a short "Not included" note and "Indicative only, not tax advice".

## Tech stack

- Vite with TypeScript. One page, `index.html`: the tools are sections on it, all fed by one set of inputs (milestone 5).
- No UI framework needed at the start. Plain TypeScript and CSS. Charts as hand-written SVG, or a small library such as Chart.js if needed.
- Vitest for unit tests of the calculation engine.
- A static site on GitHub Pages, published by `.github/workflows/deploy.yml` (see below). Run locally with `npm run dev`.

If Amir prefers C# later, the engine is small enough to port. Keep it free of UI code so that is possible.

## Where the work happens

- Work happens in Claude Code sessions in the cloud. That machine is temporary, so finished work only counts once it is pushed to GitHub: github.com/amir-meshkat/netto-helper.
- Push straight to `main`, no pull requests (Amir's choice, 26 September 2026). Before every push, run `npm test`, `npm run typecheck` and `npm run build`, and push only when all three pass.
- Live site: https://amir-meshkat.github.io/netto-helper/ (GitHub Pages, from 26 September 2026). Every push to `main` goes live: `.github/workflows/deploy.yml` runs the tests and the build (which includes the typecheck) and publishes `dist/`. A failing test stops the deploy. Pages is switched on in the repository settings with Source "GitHub Actions". The site is public: anything pushed to `main` is visible to everyone within minutes.
- Amir gets the code on his laptop with `git pull`. `.claude/launch.json` starts the dev server there; it holds the Windows path to node.exe, so it only works on his laptop.
- Preview: https://claude.ai/artifact/LBHZ7e7fuGpw1gD4fpX1yr, shared by link. Optional now that the site is live on GitHub Pages; republish it only when Amir asks. Publish the output of `npm run build`: `dist/index.html` as the page itself, without its `<!doctype>`, `<html>`, `<head>` and `<body>` tags (the host adds its own), and every other file in `dist/` at its own path. From a new session, pass that URL to update the same page.
- Each section has a plain anchor (`#netto`, `#each-100`, `#toeslagen`, `#people`, `#worth-it`, `#side-income`), so a link can open the page at one question. Keep anchors to letters, digits and hyphens: the preview host passes only plain anchors like these.

## Architecture

```
src/
  rules/
    2026.ts          yearly parameters only, no logic
    types.ts         the shape of one tax year's parameters
    index.ts         picks the rules for a given year
  engine/
    box1.ts          bracket tax
    credits.ts       algemene heffingskorting, arbeidskorting
    business.ts      zzp side income: entrepreneur deductions, mkb-winstvrijstelling, Zvw, tariefsaanpassing
    person.ts        gross to netto for one person: salary plus optional side income
    household.ts     sum over persons, plus toeslagen on the combined income, minus childcare costs
    marginal.ts      "of the next €100" (with toeslagen, for the household), the same at every salary for the chart, and zone detection
    toeslagen.ts     zorgtoeslag, kindgebonden budget, huurtoeslag, kinderopvangtoeslag, and where one drops at once
    side-income.ts   what side income adds and how much to set aside
    withholding.ts   payroll estimate for people with two employers (rare, kept in the engine)
    *.test.ts
  i18n/
    en.ts            all English UI text (nl.ts and fa.ts later, same shape)
    index.ts         picks the language, only English for now
  app/
    main.ts          the one page: inputs, events, redraw once per frame
    state.ts         what was typed, saved in this browser; carries over the old pages' inputs
    household.ts     sections: headline answer, where each €100 goes, a card per person
    side-situation.ts which side income to show and who should earn it (no DOM, tested)
    side-income.ts   section: what side income leaves, how much to set aside, the chart
    toeslagen.ts     section: the toeslagen, per toeslag, and the nearest place where one drops at once
    worth-it.ts      section: is working more worth it, "of the next €100" at every salary, for one partner at a time
    view.ts          what every section needs to draw itself
  ui/                shared: formatting, forgiving number input, sliders, job, side income and home forms, bars, 100 grid, line and area charts (chart-frame.ts: axes, crosshair, tooltip)
index.html           the page
prototype/           bruto-netto-2026.html, the first single-file version. Reference only, not part of the build.
docs/                research notes: toeslagen-2026.md (partly verified), sources/ (official documents, such as the Toeslagenkaart 2026)
```

Tools are started with `node node_modules/...` in package.json, because group policy on Amir's laptop blocks the `.cmd` shims in node_modules/.bin. Use `npm test` and `npm run dev`, not `npx`.

Rule: the engine never contains a hard coded tax number. Every threshold and percentage lives in `rules/<year>.ts`. A new tax year means a new rules file, not code changes.

## Tax rules for 2026 (box 1, below AOW age)

Verified against belastingdienst.nl on 25 September 2026 (Fiscale informatie 2026 and the 2026 pages on box 1, heffingskortingen, ondernemersaftrek, mkb-winstvrijstelling and Zvw).

Box 1 brackets (rates include AOW, Anw and Wlz premiums):

| Taxable income | Rate |
|---|---|
| up to €38,883 | 35.75% |
| €38,883 to €78,426 | 37.56% |
| above €78,426 | 49.50% |

General tax credit (algemene heffingskorting): max €3,115. Reduced by 6.398% of income above €29,736, minimum 0.

Labour tax credit (arbeidskorting), based on income from work:

| From | To | Credit |
|---|---|---|
| €0 | €11,965 | 8.324% of income |
| €11,965 | €25,845 | €996 + 31.009% of income above €11,965 |
| €25,845 | €45,592 | €5,300 + 1.950% of income above €25,845 |
| €45,592 | about €132,920 | €5,685 − 6.510% of income above €45,592, minimum 0 |

Calculation per person:

1. Gross per job per year = monthly salary × 12 × (1 + holiday pay % + year-end bonus %).
2. Pension premium per job = max(0, gross − franchise) × employee premium %. Every employer has its own scheme, so premium % and franchise are inputs per job. Pension is deducted before tax.
3. Taxable income = sum of (gross − pension) over all jobs of that person.
4. Box 1 tax on taxable income.
5. Credits = general credit + labour credit, capped at the box 1 tax.
6. Tax to pay = box 1 tax − credits. Netto = gross − pension − tax.

Side income as a zzp'er (winst uit onderneming). In the Netherlands a "second job" almost always means this, not a second employer:

| Rule | 2026 |
|---|---|
| Mkb-winstvrijstelling, every entrepreneur | 12.7% of profit after the ondernemersaftrek |
| Urencriterium | 1,225 hours a year |
| Zelfstandigenaftrek, needs the urencriterium | €1,200, not more than the profit (except starters) |
| Startersaftrek, starters with the urencriterium | €2,123 |
| Tariefsaanpassing on these deductions | 11.94% on the part in the top bracket (deductions save at most 37.56%) |
| Zvw contribution the zzp'er pays | 4.85% of taxed profit, maximum income €79,409 including salary |

- Profit = revenue minus costs, without btw. No holiday pay, no pension, nothing withheld.
- Taxable profit (belastbare winst) = profit minus ondernemersaftrek minus mkb-winstvrijstelling. It is added to the salary in box 1.
- Arbeidsinkomen for the arbeidskorting = salary plus profit before ondernemersaftrek and mkb-winstvrijstelling. The algemene heffingskorting uses taxable income.
- Zvw: salary counts first toward the maximum; the contribution is only on taxed profit in the room left.
- Not a business for the Belastingdienst (resultaat uit overige werkzaamheden): no deductions, no mkb-winstvrijstelling, Zvw still applies.
- Open points: the exact base of the tariefsaanpassing and whether the Zvw base is profit after deductions are our reading of the law, not spelled out on the Belastingdienst pages. Losses, KOR, investment deductions and FOR/lijfrente are not included.

Key facts to reflect in the tools:

- Brackets and credits apply to a person's total income, not per job. Two jobs paying €39k + €15k are taxed exactly like one job paying €54k.
- Nothing is withheld on zzp side income, so the key answer is "set aside €X per month" (extra income tax plus Zvw), or ask for a voorlopige aanslag.
- For the rare person with two employers: only one applies the credits (loonheffingskorting), and each withholds as if its salary were the only income, so they usually pay extra at the aangifte.
- Partners are taxed individually on salaries. Fiscal partnership only matters later (mortgage interest, box 3, deductions).
- Toeslagen (zorgtoeslag, huurtoeslag, kindgebonden budget, kinderopvangtoeslag) use the combined household income, so for toeslagen it does not matter which partner earns it. The rules are in "Toeslagen 2026" below.

Marginal rate zones (tax on the next euro, income tax only):

| Person's taxable income | Tax on next euro |
|---|---|
| up to about €11,400 | 0% (credits cover all tax) |
| €11,400 to €11,965 | about 27% |
| €11,965 to €25,845 | about 5% |
| €25,845 to €29,736 | about 34% |
| €29,736 to €38,883 | about 40% |
| €38,883 to €45,592 | about 42% |
| €45,592 to €78,426 | about 50% |
| €78,426 to €132,920 | about 56% |
| above €132,920 | 49.5% |

Compute these from the rules, do not hard code them. The table is for testing.

## Toeslagen 2026

Source: the Toeslagenkaart 2026 (Dienst Toeslagen, November 2025, TG 710-1Z61PL), shared by Amir on 26 September 2026. A copy is in `docs/sources/toeslagenkaart-2026.pdf`, because cloud sessions cannot reach belastingdienst.nl. Figures that are not on the card say where they come from. Everything not yet verified stays in `docs/toeslagen-2026.md`.

Shared by all toeslagen:

- Toetsingsinkomen: the income of the whole year, added up for a person and their toeslagpartner. Our reading for this site (salary and zzp side income, no box 2 or 3): the sum of each person's box 1 taxable income from the engine. Not on the card; verify on the Dienst Toeslagen page about toetsingsinkomen.
- Vermogen on 1 January above the limit: no toeslag at all.

Zorgtoeslag:

| Rule | 2026 | Source |
|---|---|---|
| Maximum income | €40,857 alone, €51,142 with toeslagpartner | card |
| Maximum toeslag | €1,550 a year alone, €2,963 with toeslagpartner | card |
| Maximum vermogen | €146,011 alone, €184,633 with toeslagpartner | card |
| Standaardpremie | €2,119 a year | Staatscourant (via search), not on the card |
| Drempelinkomen | €29,736 | Staatscourant (via search); the same figure as the kindgebonden budget threshold on the card |
| Normpremie | 1.912% (alone) or 4.289% (with toeslagpartner) of the drempelinkomen, plus 13.730% of the income above it | 13.730% from the Staatscourant (via search); 1.912% and 4.289% reproduce the card's maximum toeslag to the euro |

- Zorgtoeslag = standaardpremie (twice with a toeslagpartner) − normpremie, minimum 0, and 0 above the maximum income or vermogen.
- Worked example: alone, €38,880: normpremie €568.55 + 13.73% × €9,144 = €1,824.02, so zorgtoeslag €294.98 a year (€24.58 a month). A couple where one earns €38,880 and the other nothing: €1,707.15 a year.
- At the maximum income the formula still gives about €24 a year; one euro above it, nothing. That is the hard limit.

Kindgebonden budget (all from the card):

| Rule | 2026 |
|---|---|
| Per child | €2,580 a year |
| Extra for a child aged 12 to 15 | €724 a year |
| Extra for a child aged 16 or 17 | €964 a year |
| Extra for a single parent (alleenstaande-ouderkop) | €3,416 a year (card: one child, single parent €5,996 = €2,580 + €3,416) |
| Threshold | €29,736 alone, €39,141 with toeslagpartner |
| Afbouw | 7.60% of the income above the threshold |
| Maximum vermogen | €146,011 alone, €184,633 with toeslagpartner |

- Kindgebonden budget = the total maximum − 7.60% × (toetsingsinkomen − threshold), minimum 0. That the 7.60% also reduces the alleenstaande-ouderkop is our reading; the card does not say.

Huurtoeslag. From 2026: only the bare rent counts (no service costs), a higher rent no longer rules you out (the calculation stops at the rekengrens), and the young people's limit is for households where everyone is under 21. Source for these: the Dienst Toeslagen page Amir pasted, `docs/sources/huurtoeslag-2026-wijzigingen.md`.

| Rule | 2026 | Source |
|---|---|---|
| Rekengrens | €932.93 a month; €498.20 when everyone is 18, 19 or 20 (a child in the home lifts it) | card and page |
| Maximum vermogen | €38,479 alone, €76,958 with toeslagpartner (and €38,479 per other resident, not modelled) | card |
| Kwaliteitskortingsgrens | €498.20 | not verified: consistent with the young people's rekengrens, as in earlier years |
| Aftoppingsgrens | €713.02 for 1 or 2 people, €764.14 for 3 or more | not verified: search, and 4.4% above 2025 like the kwaliteitskortingsgrens |
| Share of the rent paid | 100% from the basishuur to the kwaliteitskortingsgrens, 65% up to the aftoppingsgrens, 40% above it for every household | not verified: Rijksoverheid factsheet via search |
| Basishuur | €202.52 for one person, €200.71 for more people | not verified: search |
| Income afbouw | 27% (one person) or 22% (more people) of the yearly income above €23,425 or €31,500 | not verified: Rijksoverheid summary via search |

- Huurtoeslag per year = 12 × (the shares of the counted rent in each band) − the income afbouw, minimum 0.
- Worked example: alone, bare rent €800, income €30,000: €295.68 + 65% × €214.82 + 40% × €86.98 = €470.11 a month, so €5,641.26 a year, minus 27% × €6,575 = €1,775.25, gives €3,866.01 a year.
- The page says in "Show me why" and in the footer that some huurtoeslag figures still need checking.

Kinderopvangtoeslag. Source: the Rijksoverheid page Amir pasted, `docs/sources/kinderopvangtoeslag-2026.md`, and the card.

- Maximum price per hour: dagopvang €11.23, buitenschoolse opvang €9.98, gastouderopvang (both) €8.49. At most 230 hours per child per month.
- The share paid comes from the table by combined income: 96% for every child up to €56,412, falling to 36.5% for the first child and 68.2% for the next ones. The table is in `rules/2026.ts`, generated from the source file, and a test checks the two match.
- Our reading, not on the pages: the "first child" is the child with the most hours of childcare.
- The site assumes the parents work every month (the toeslag follows the months the least working parent works).
- Worked example: one child, 100 hours of dagopvang at €11.23, income €38,880: 96% × €11.23 × 100 × 12 = €12,936.96 a year.

How the page uses toeslagen:

- The headline counts toeslagen and takes off the childcare costs, because kinderopvangtoeslag only pays back part of a bill: "what you keep" means after childcare.
- "Of the next €100" is a household question, because toeslagen look at the combined income. It shows income tax, lower toeslagen and what is kept, and says so plainly when it is negative (the armoedeval).
- The toeslagen section warns about the nearest place ahead where a toeslag drops at once: the zorgtoeslag limit, or a row of the kinderopvangtoeslag table.
- "Is working more worth it?" shows "of the next €100" at every salary of one partner, with everything else as typed. Its first sentence uses the real next €100, the same number as the person card. The chart leaves the drops at once out of the curve (zorgtoeslag counts as staying at its last €24 above the limit) and marks them as ticks along the top. Kinderopvangtoeslag only goes down in steps, about one every €1,700 of income, which adds up: each step is spread evenly over its row, so the chart shows what the steps cost on average, and the section says so.

## Test cases (must pass)

Toeslagen (see "Toeslagen 2026" above for the sources):

- Zorgtoeslag: the card's maximum (€1,550.45 alone, €2,962.62 with toeslagpartner), €294.98 alone at €38,880, €1,707.15 for a couple with one earner at €38,880, €23.53 just at the €40,857 limit and nothing one euro above it.
- Kindgebonden budget: the card's €5,996 and €8,576 for a single parent with one or two children, €2,580 per child for a couple, the age extras €724 and €964.
- Kinderopvangtoeslag: 96% at €56,412 and 95.5% or 95.6% at €56,413; two children in full time dagopvang lose €216.96 a year at once at €58,185.
- Huurtoeslag: €3,866.01 a year alone with €800 rent at €30,000 (not verified, see above).
- Of the next €100, alone: €46.07 kept at €36,000 (income tax €40.20, zorgtoeslag €13.73); €44.32 at €38,880, because most of that €100 falls above the €38,883 bracket boundary.
- The "worth it" chart: at €38,880 it gives the card's €44.32; at €40,800 only the 13.73% of the €57 up to the zorgtoeslag limit counts as lost toeslag, not the €23.53 that stops at once; two children in full time dagopvang at €57,000: the €216.96 step at €58,185, spread over its row from €56,413 to €58,184, is €12.24 of every €100.

Income tax:

- One person, €36,000 taxable income: box 1 tax €12,870.00, general credit €2,714.23, labour credit €5,498.02, tax to pay €4,657.75, netto €31,342.25.
- One person, two jobs, €3,000 and €1,200 per month, 8% holiday pay, no pension: combined gross €54,432, final tax about €13,096.
- Same person, payroll estimate: job 1 withholds with credits on its own salary (about €5,815), job 2 withholds without credits on its own salary (about €5,560). Total withheld about €11,375, so about €1,720 to pay at the aangifte. Real loonbelastingtabellen round slightly differently, so test these with a tolerance.
- Netto kept from a €10k second job: about €6,529 if the main job is €25k, about €4,953 if the main job is €50k.
- Netto as a function of gross must never decrease for income tax alone.
- Salary €3,000 per month with 8% holiday pay (€38,880) plus zzp revenue €12,000 and costs €2,000: taxable profit €8,730, extra income tax about €3,921, Zvw about €423, set aside about €4,344 (€362 per month), kept about €5,656.

## Milestones

Stop after each one for review. Status on 26 September 2026: 1 to 5 and 7 are done, 6 is dropped, 8 is next.

The milestones were renumbered on 26 September 2026. Before that, the side income page was milestone 5, the "next €100" pages were 3 and 4, and 6 was the dropped payslip check.

1. **Project setup and engine.** Vite + TypeScript + Vitest, rules file for 2026, engine with all test cases above passing. No UI yet. *Done.*
2. **Household page.** Port the prototype (now `prototype/bruto-netto-2026.html`) to this structure. One or two people, each with a salary and optional zzp side income. Inputs per job: monthly gross, holiday %, year-end %, pension (payslip amount or % and franchise). Output: household netto per month first, then per person breakdown with "Show me why". *Done.*
3. **Side income page (zzp).** For one person: what is left of the side income and how much to set aside per month. For a couple: which partner should earn it ("€X more per month with B"). Chart of netto kept from the side income against salary, with both partners marked. *Done.*
4. **Sliders for every number.** Every number a person enters gets a slider next to its text box: salary first, then side income revenue and costs, holiday pay, bonus and pension. Dragging updates every result on the page in real time; typing moves the slider. The slider covers the usual range (for example a salary of €0 to €10,000 per month); a typed value outside it still counts, and the slider then waits at its end. One shared component in `ui/` for the landing, household and side income pages. It must work with touch, mouse and keyboard, in right to left layouts, and stay smooth on a phone (redraw at most once per frame). *Done:* `ui/slider.ts` writes a dragged value into the text box and fires the box's input event, so pages handle it exactly like typing. The ranges are `JOB_SLIDERS` in `ui/job-input.ts` and `SIDE_SLIDERS` in `ui/side-input.ts`.
5. **One page for everything.** Amir's idea, 26 September 2026. Replace the landing, household and side income pages with one page and one set of inputs, so a person types their situation once and every answer uses it. Today the side income page copies the household inputs once and then drifts apart; this ends that. The page opens as simple as the landing page is now: one salary with its slider, and one answer. Adding a partner or side income adds its inputs and the answer sections that need them, each with its own one-sentence answer, one visual and "Show me why":
   - Household netto per month (the headline) and where each €100 goes.
   - Per person: netto and "of the next €100".
   - Side income, when someone has it: how much to set aside per month, and with a partner, how much more or less it would be worth if the other partner earned it, with the chart against salary.

   Wide screens: inputs on the left, answers on the right. Each section gets a plain #anchor, so a link can point to one question. Saved inputs from the old pages carry over. The engine does not change. *Done:* the code is in `src/app/`. A person alone gets no heading or name field; names appear with a partner. The per-person card no longer repeats the set-aside note, the side income section has it. When both partners have side income there is nothing to compare, so the section shows each one's own and no chart. The old side income page's inputs carry over only when there are no household inputs, with the side income on the first person.
6. ~~"Next €100" pages for one person and for a couple.~~ Dropped on 26 September 2026: with sliders and one page, dragging a salary already shows total netto growing and "of the next €100" changing for each partner. What is left, a chart across all incomes, moves to milestone 7.
7. **Toeslagen.** Zorgtoeslag, huurtoeslag, kindgebonden budget and kinderopvangtoeslag on the combined household income. Every extra input is optional, with a sensible default: for example rent, children and their ages, childcare hours and costs, and savings for the asset test (vermogenstoets). Add "lost toeslag" as a third colour in the "next €100" bar, and show the armoedeval honestly where it occurs. Research the exact 2026 rules first, write them into this file like the tax rules above, and confirm them with Amir. Amir asked for all four at once (26 September 2026). *Done:* the rules are in "Toeslagen 2026" above, the engine in `engine/toeslagen.ts`, the inputs (children with age and optional childcare, rent, savings) in `ui/home-form.ts`, the section in `app/toeslagen.ts`. The saved inputs moved to version 3; version 2 carries over with an empty home. Still open: the huurtoeslag figures marked "not verified". The "Is working more worth it?" section (`app/worth-it.ts`) is a stacked area of kept, income tax and lost toeslag across all salaries, with a "you are here" dot; for a couple a toggle picks whose salary goes up, because the other partner's salary stays where it is. See "How the page uses toeslagen" for how it treats the drops at once.
8. **More optional parameters.** One at a time, add the items from "Not included" below that change the answer for many people, each as an optional input that is zero or off by default: mortgage (hypotheekrenteaftrek and eigenwoningforfait), a lijfrente what-if (a deposit lowers taxable income and the toetsingsinkomen for toeslagen), savings and investments in box 3, people at AOW age, special bonus rates, and for zzp'ers business losses, KOR and investment deductions. Explain each rule first, as always, and agree the order with Amir.

Dropped: ~~payslip check for two jobs~~. Two employers are rare in practice, and the set-aside question for zzp side income is answered in the side income section. The engine keeps `withholding.ts`.

Later ideas, not now: Dutch and Persian translations, and an explanation layer where an LLM explains results in plain language while the numbers always come from the engine.

## Not included (show this on the page until added)

Mortgage interest and other deductions, box 3 savings, lijfrente, special bonus rates, business losses, KOR and investment deductions, people at AOW age (until milestone 8). For toeslagen: other people living in the home besides the partner and children, and special situations. On salary the employer pays the Zvw health contribution; on side income the zzp'er pays it, and that is included.

The footer text is `common.notIncluded` in `src/i18n/en.ts`. Keep it and this list the same.
