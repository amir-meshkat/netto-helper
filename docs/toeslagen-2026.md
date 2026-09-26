# Toeslagen 2026: research draft

**Status: draft, 26 September 2026. Not verified. Do not build from these numbers yet.**

The cloud environment could not reach the official sites (belastingdienst.nl, rijksoverheid.nl, wetten.overheid.nl, eerstekamer.nl): its network policy blocks them. Everything below comes from web search summaries of official and third party pages. Every figure still has to be read on the official page. Once checked, the rules move into CLAUDE.md like the tax rules, and this file records what was checked where.

Status per figure:

- **Consistent**: several summaries agree, and where possible the numbers also agree with each other through the formula. Very likely right, still to be read on the official page.
- **Conflicting**: summaries disagree, or one looks like an older year. Must be read on the official page.
- **Missing**: not found yet.

## What all toeslagen share

- **Toetsingsinkomen.** Toeslagen look at the income of the whole year, added up for you and your toeslagpartner. For the people this site covers (salary and zzp side income, no box 2 or box 3), our reading is that this is the box 1 taxable income the engine already has per person: salary minus pension premium, plus taxable profit. Verify on the Dienst Toeslagen page about toetsingsinkomen.
- **Vermogen.** Savings and investments on 1 January must stay under a limit. Above it, no toeslag at all.
- **Paid in advance.** Dienst Toeslagen pays a monthly advance (voorschot) based on the expected income, and settles it after the year. Earning more than expected means paying back.
- **Toeslagpartner.** Usually your fiscal partner or the person you live with. For toeslagen the income of both counts, so it does not matter which partner earns it.

## 1. Zorgtoeslag (build this one first)

**In plain language.** The government decides what health insurance should cost (the standaardpremie, €2,119 a year). You are expected to pay part of that yourself (the normpremie). The normpremie is a small fixed part of a threshold income, plus 13.73% of every euro you earn above that threshold. Zorgtoeslag is the difference. So below the threshold you get the maximum, and above it every extra €100 costs you €13.73 of zorgtoeslag, on top of income tax. With a toeslagpartner the standaardpremie counts twice.

**Formula.**

- Alone: zorgtoeslag = standaardpremie − (1.912% × drempelinkomen + 13.730% × (toetsingsinkomen − drempelinkomen))
- With toeslagpartner: zorgtoeslag = 2 × standaardpremie − (4.289% × drempelinkomen + 13.730% × (toetsingsinkomen − drempelinkomen))
- Minimum 0. Nothing at all above the income limit or the vermogen limit.

| Parameter | 2026 | Status |
|---|---|---|
| Standaardpremie | €2,119 a year | Consistent |
| Drempelinkomen | €29,736 | Consistent (the same figure as where the algemene heffingskorting starts to shrink, as in 2025) |
| Normpremie alone | 1.912% of drempelinkomen | Consistent (one source, but it gives exactly the reported maximum) |
| Normpremie with partner | 4.289% of drempelinkomen | Consistent (same) |
| Above the drempelinkomen | 13.730% of the income above it | Consistent (same) |
| Income limit alone | €40,857 | Consistent |
| Income limit with partner | €51,142 | Consistent |
| Vermogen limit alone | €146,011 | Consistent |
| Vermogen limit with partner | €184,633 | Consistent |
| Maximum | €129 a month alone, about €247 with partner | Consistent (the formula gives €129.20 and €246.89; one source says €246) |

**Worked examples** (checked with a script, using the numbers above):

- **Alone, €3,000 a month plus 8% holiday pay** (toetsingsinkomen €38,880): normpremie = €568.55 + 13.73% × €9,144 = €1,824.02. Zorgtoeslag = €2,119 − €1,824.02 = **€294.98 a year, €24.58 a month**.
- **Couple, only one of them earns that €38,880**: 2 × €2,119 − (€1,275.38 + €1,255.47) = **€1,707.15 a year, €142.26 a month**.
- **The next €100 at €38,880, alone**: income tax takes €40.20, so the site says "you keep €59.80". With zorgtoeslag, another €13.73 goes, so **you keep €46.07**.

**The hard limit is small in 2026.** At the income limit the formula still gives about €24 a year (€23.53 alone, €23.58 with partner), and one euro above it you get nothing. So crossing the limit costs about €2 a month at once. The real armoedeval effect of zorgtoeslag is the steep 13.73% on every extra euro, not the cut at the limit. CLAUDE.md should say this once verified.

**New inputs needed:** none. The site already knows the income and whether there is a partner. Optional, behind "More details": savings above the vermogen limit (a yes/no is enough). Everyone 18 or older with a Dutch health insurance is assumed eligible.

## 2. Kindgebonden budget

**In plain language.** A yearly amount per child for parents with a low or middle income, paid on top of kinderbijslag. You get the maximum below a threshold income; above it, the total shrinks by 7.6% of every euro above the threshold. Older children get more. Single parents get an extra amount, the alleenstaande-ouderkop.

**Formula.** Kindgebonden budget = maximum (per child, plus age supplements, plus alleenstaande-ouderkop) − 7.60% × (toetsingsinkomen − drempel), minimum 0.

| Parameter | 2026 | Status |
|---|---|---|
| Per child | €2,580 a year | Consistent |
| Child aged 12 to 15 | €3,283 a year in total (so €703 extra) | Consistent |
| Child aged 16 or 17 | €3,516 a year in total (so €936 extra) | Consistent |
| Alleenstaande-ouderkop | €3,320, or €3,416 | **Conflicting**: one source says €3,320 but also "€5,996 for a single parent with one child", which implies €3,416 |
| Drempel alone | €29,736 | Consistent |
| Drempel with partner | €39,141 | Consistent |
| Afbouw | 7.60% of income above the drempel | Consistent (2025 was lower, check) |
| Vermogen limits | €146,011 alone, €184,633 with partner | Consistent (the same as zorgtoeslag) |

**New inputs needed:** children and their ages. "Single parent" follows from having no partner on the site. Kinderbijslag (from the SVB) does not depend on income, so it does not change "the next €100"; it could be an optional extra line later.

## 3. Huurtoeslag

**In plain language.** Help with rent for people with a low income. From 2026 it works differently: only the bare rent counts (no service costs), and a rent above the old maximum no longer rules you out; the calculation just stops at that maximum. You always pay a base rent yourself. Of the rent above that, the toeslag pays 100% up to a first limit and 65% up to a second limit. Above a threshold income, the toeslag shrinks by a fixed percentage of every extra euro (the linear afbouw, new in 2026).

**Structure (from the summaries, to verify):**

1. Rekenhuur = bare rent (kale huur), capped at the maximum.
2. Toeslag = 100% of the rent between the basishuur and the kwaliteitskortingsgrens, plus 65% between the kwaliteitskortingsgrens and the aftoppingsgrens. Above the aftoppingsgrens: 0%, or 40% for some groups (AOW age), not relevant for this site yet.
3. Minus a percentage of the income above an income point.

| Parameter | 2026 | Status |
|---|---|---|
| Maximum rent in the calculation | €932.93 a month | Consistent |
| Maximum rent for young people (18 to 20) | €498.20 | **Conflicting** (unclear which age group and which limit) |
| Basishuur | €202.52 alone, €200.71 for more people | Consistent (possibly one source copied by another) |
| Kwaliteitskortingsgrens | €498.20 or €454.47 | **Conflicting** (€454.47 looks like the 2024 figure) |
| Aftoppingsgrens, 1 or 2 people | €713.02, €650.43 or €648.21 | **Conflicting** (€650.43 looks like 2024) |
| Aftoppingsgrens, 3 or more people | €764.14, €697.07 or €694.56 | **Conflicting** (€697.07 looks like 2024) |
| Income point where the afbouw starts | €23,425 alone, €31,500 for more people | Consistent in two summaries, verify |
| Afbouw percentage | 27% alone, 22% for more people | **Missing** a clear source, and unclear whether per year or per month |
| Vermogen limit | €38,479 per person | One source, verify |

**New inputs needed:** bare rent per month, and the number of people in the home (partner and children follow from the page). Possibly age under 21 or 23.

This is the toeslag where the summaries were least reliable. It needs the official "rekenregels huurtoeslag 2026" or the Staatscourant regeling before any code.

## 4. Kinderopvangtoeslag

**In plain language.** A percentage of the childcare costs, up to a maximum price per hour and a maximum number of hours. The percentage depends on the combined income: 96% for low and middle incomes, falling for higher incomes. A second child and later children get a higher percentage than the first. Both parents must work or study.

| Parameter | 2026 | Status |
|---|---|---|
| Maximum hourly price, dagopvang | €11.23 | Consistent |
| Maximum hourly price, buitenschoolse opvang | €9.98 | Consistent |
| Maximum hourly price, gastouderopvang | €8.49 | Consistent |
| Maximum hours | 230 a month per child | Consistent |
| 96% for both first and next children | up to about €56,412 combined income | **Conflicting** by €1 (€56,412 or €56,413) |
| Lowest percentage, first child | 36.5% | Consistent in two summaries; the income where it starts is **conflicting** (€165,658 or €235,689) |
| Lowest percentage, next children | 68.2% | One source |
| The full percentage table per income band | | **Missing**: it has dozens of rows and must come from the official table |

**New inputs needed:** per child: type of care, hours per month and price per hour. This is the most inputs of any toeslag, so it comes last.

## What this means for "the next €100"

For someone alone at €38,880: income tax leaves €59.80 of the next €100, zorgtoeslag takes €13.73 of it, so €46.07 is left. With children, kindgebonden budget takes another €7.60. With huurtoeslag on top, the combined rate goes well above 50%, which is the 70 to 80% range CLAUDE.md warns about. The exact numbers wait for verification.

## Official pages to read (once the network allows it)

- Zorgtoeslag 2026 amounts: https://www.belastingdienst.nl/wps/wcm/connect/nl/zorgtoeslag/content/hoeveel-zorgtoeslag-in-2026
- Zorgtoeslag income and vermogen limits: https://www.belastingdienst.nl/wps/wcm/connect/nl/zorgtoeslag/content/maximaal-inkomen-voor-zorgtoeslag and https://www.belastingdienst.nl/wps/wcm/connect/nl/zorgtoeslag/content/maximaal-vermogen-zorgtoeslag
- Zorgtoeslag percentages 2026 (Eerste Kamer, draft decree): https://www.eerstekamer.nl/brief_in/20250922/ontwerpbesluit_percentages_drempel/f=/vmr1ky884zhb.pdf
- Wet op de zorgtoeslag, version 1 January 2026: https://wetten.overheid.nl/BWBR0018451/2026-01-01
- Toeslagenkaart 2026 (all limits and amounts on one page): https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/themaoverstijgend/brochures_en_publicaties/toeslagenkaart-2026
- What changes in 2026: https://www.belastingdienst.nl/wps/wcm/connect/nl/toeslagen-2026/topics/veranderingen-toeslagen-2026
- Huurtoeslag parameters 2026: https://www.rijksoverheid.nl/actueel/nieuws/2025/11/25/indexering-inkomensgrenzen-woningcorporaties-maximale-huurprijsgrenzen-en-huurtoeslagparameters-2026
- Huurtoeslag changes 2026: https://www.belastingdienst.nl/wps/wcm/connect/nl/huurtoeslag/content/huurtoeslag-verandert-vanaf-2026
- Kinderopvangtoeslag amounts 2026: https://www.rijksoverheid.nl/onderwerpen/kinderopvangtoeslag/bedragen-kinderopvangtoeslag-2026
- Kinderopvangtoeslag calculation and table: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/themaoverstijgend/brochures_en_publicaties/berekening-kinderopvangtoeslag
- Kindgebonden budget and toetsingsinkomen: the Dienst Toeslagen pages on belastingdienst.nl.

Third party pages the summaries drew on, useful for comparison only: zorgwijzer.nl, rekenbuddy.nl, consumentenbond.nl, belastinghelden.nl, woonbond.nl, juridischloket.nl.
