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

The audience has limited patience for complexity. Every page follows the same order:

1. **Answer first.** One sentence in euros, preferably per month. Example: "The second job is worth €130 more per month with Sara than with you."
2. **One simple reason.** A visual that needs no explanation.
3. **Details on request.** The full step by step calculation behind a "Show me why" toggle.

Other principles:

- Prefer euros over percentages. "Of the next €100 you keep €58" beats "marginal rate 42%".
- Bust the myth "if I work more I end up with less". For income tax alone you always keep more in total, only less per extra euro. Show both at once: total netto (always grows) and "of the next €100" (grows and shrinks by zone).
- Be honest about the exception: once toeslagen are added, the combined rate can reach 70 to 80%, and around a hard income limit (zorgtoeslag) earning a little more can leave you with less (the armoedeval). Show this when it happens, do not hide it.
- Label Dutch terms next to English ones, for example "General tax credit (algemene heffingskorting)". Later the site will be available in English, Dutch and Persian, so keep all UI text in a translation file from the start, and make layouts ready for right to left text (Persian).
- Numbers can be typed or dragged. Every number input has a slider next to its text box, and the results update in real time while dragging (milestone 4). Income comes first.
- Many parameters, all optional. Add every parameter that changes the answer for real people, but give each one a sensible default and keep it behind a "More details" toggle, like holiday pay and pension today. The answer shows before any of them is filled in.
- Every page works on a phone.
- Every page shows a short "Not included" note and "Indicative only, not tax advice".

## Tech stack

- Vite with TypeScript, multi-page setup (one HTML file per tool page).
- No UI framework needed at the start. Plain TypeScript and CSS. Charts as hand-written SVG, or a small library such as Chart.js if needed.
- Vitest for unit tests of the calculation engine.
- Deployable as a static site (GitHub Pages or Netlify). Run locally with `npm run dev`.

If Amir prefers C# later, the engine is small enough to port. Keep it free of UI code so that is possible.

## Where the work happens

- Work happens in Claude Code sessions in the cloud. That machine is temporary, so finished work only counts once it is pushed to GitHub: github.com/amir-meshkat/netto-helper.
- Push straight to `main`, no pull requests (Amir's choice, 26 September 2026). Before every push, run `npm test`, `npm run typecheck` and `npm run build`, and push only when all three pass.
- Amir gets the code on his laptop with `git pull`. `.claude/launch.json` starts the dev server there; it holds the Windows path to node.exe, so it only works on his laptop.
- Preview: a private page at https://claude.ai/artifact/LBHZ7e7fuGpw1gD4fpX1yr, only visible to Amir until he shares it. Republish it after each milestone so he can try the pages, also on his phone. Publish the output of `npm run build`: the landing page `dist/index.html` as the page itself, without its `<!doctype>`, `<html>`, `<head>` and `<body>` tags (the host adds its own), and every other file in `dist/` at its own path. From a new session, pass that URL to update the same page.
- Links between pages name the file: `household/index.html` and `../index.html`, never a bare folder like `household/`. The preview host may not open a folder's index page.

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
    household.ts     sum over persons
    marginal.ts      "of the next €100" and zone detection
    side-income.ts   what side income adds and how much to set aside
    withholding.ts   payroll estimate for people with two employers (rare, kept in the engine)
    *.test.ts
  i18n/
    en.ts            all English UI text (nl.ts and fa.ts later, same shape)
    index.ts         picks the language, only English for now
  pages/
    landing/         index.html: quick answer and the tools as questions
    household/       milestone 2
    side-income/     milestone 3
    next-100/        milestones 5 and 6 (not built yet)
  ui/                shared: formatting, forgiving number input, job and side income forms, bars, 100 grid, line chart
index.html, household/index.html, side-income/index.html   one HTML entry per page
prototype/           bruto-netto-2026.html, the first single-file version. Reference only, not part of the build.
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
- Toeslagen (zorgtoeslag, huurtoeslag, kindgebonden budget, kinderopvangtoeslag) use the combined household income, so for toeslagen it does not matter which partner earns it. Check the exact rules per toeslag in milestone 7.

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

## Test cases (must pass)

- One person, €36,000 taxable income: box 1 tax €12,870.00, general credit €2,714.23, labour credit €5,498.02, tax to pay €4,657.75, netto €31,342.25.
- One person, two jobs, €3,000 and €1,200 per month, 8% holiday pay, no pension: combined gross €54,432, final tax about €13,096.
- Same person, payroll estimate: job 1 withholds with credits on its own salary (about €5,815), job 2 withholds without credits on its own salary (about €5,560). Total withheld about €11,375, so about €1,720 to pay at the aangifte. Real loonbelastingtabellen round slightly differently, so test these with a tolerance.
- Netto kept from a €10k second job: about €6,529 if the main job is €25k, about €4,953 if the main job is €50k.
- Netto as a function of gross must never decrease for income tax alone.
- Salary €3,000 per month with 8% holiday pay (€38,880) plus zzp revenue €12,000 and costs €2,000: taxable profit €8,730, extra income tax about €3,921, Zvw about €423, set aside about €4,344 (€362 per month), kept about €5,656.

## Milestones

Stop after each one for review. Status on 26 September 2026: 1 to 3 are done, 4 is next.

The milestones were renumbered on 26 September 2026. Before that, the side income page was milestone 5, the "next €100" pages were 3 and 4, and 6 was the dropped payslip check.

1. **Project setup and engine.** Vite + TypeScript + Vitest, rules file for 2026, engine with all test cases above passing. No UI yet. *Done.*
2. **Household page.** Port the prototype (now `prototype/bruto-netto-2026.html`) to this structure. One or two people, each with a salary and optional zzp side income. Inputs per job: monthly gross, holiday %, year-end %, pension (payslip amount or % and franchise). Output: household netto per month first, then per person breakdown with "Show me why". *Done.*
3. **Side income page (zzp).** For one person: what is left of the side income and how much to set aside per month. For a couple: which partner should earn it ("€X more per month with B"). Chart of netto kept from the side income against salary, with both partners marked. *Done.*
4. **Sliders for every number.** Every number a person enters gets a slider next to its text box: salary first, then side income revenue and costs, holiday pay, bonus and pension. Dragging updates every result on the page in real time; typing moves the slider. The slider covers the usual range (for example a salary of €0 to €10,000 per month); a typed value outside it still counts, and the slider then waits at its end. One shared component in `ui/` for the landing, household and side income pages. It must work with touch, mouse and keyboard, in right to left layouts, and stay smooth on a phone (redraw at most once per frame).
5. **"Next €100", one person.** One slider for gross salary, built on the milestone 4 slider. Top: total netto bar that always grows. Below: "Of the next €100 you keep €X" bar that changes by zone. Optional traffic light band (green, orange, red zones) with a "you are here" marker.
6. **"Next €100", couple.** Two sliders, one per partner, each with its own zone marker, and the household total.
7. **Toeslagen.** Zorgtoeslag, huurtoeslag, kindgebonden budget and kinderopvangtoeslag on the combined household income. Every extra input is optional, with a sensible default: for example rent, children and their ages, childcare hours and costs, and savings for the asset test (vermogenstoets). Add "lost toeslag" as a third colour in the "next €100" bar, and show the armoedeval honestly where it occurs. Research the exact 2026 rules first, write them into this file like the tax rules above, and confirm them with Amir. Build one toeslag at a time, starting with zorgtoeslag because its hard income limit causes the armoedeval.
8. **More optional parameters.** One at a time, add the items from "Not included" below that change the answer for many people, each as an optional input that is zero or off by default: mortgage (hypotheekrenteaftrek and eigenwoningforfait), a lijfrente what-if (a deposit lowers taxable income and the toetsingsinkomen for toeslagen), savings and investments in box 3, people at AOW age, special bonus rates, and for zzp'ers business losses, KOR and investment deductions. Explain each rule first, as always, and agree the order with Amir.

Dropped: ~~payslip check for two jobs~~. Two employers are rare in practice, and the set-aside question for zzp side income is answered on the side income page. The engine keeps `withholding.ts`.

Later ideas, not now: Dutch and Persian translations, an explanation layer where an LLM explains results in plain language while the numbers always come from the engine, and a public site on GitHub Pages or Netlify.

## Not included (show this on every page until added)

Toeslagen (until milestone 7), mortgage interest and other deductions, box 3 savings, lijfrente, special bonus rates, business losses, KOR and investment deductions, people at AOW age (until milestone 8). On salary the employer pays the Zvw health contribution; on side income the zzp'er pays it, and that is included.

The footer text is `common.notIncluded` in `src/i18n/en.ts`. Keep it and this list the same.
