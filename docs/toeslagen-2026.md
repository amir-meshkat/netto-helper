# Toeslagen 2026: research draft

**Status, 27 September 2026:** zorgtoeslag, kindgebonden budget and kinderopvangtoeslag are verified; huurtoeslag partly. Rechecked by search on 27 September 2026: the huurtoeslag figures (basishuur €202.52 and €200.71, kwaliteitskortingsgrens €498.20, aftoppingsgrenzen €713.02 and €764.14, shares 100%, 65% and 40%, income points €23,425 and €31,500, afbouw 27% and 22%) are the same in a Rijksoverheid news item of 25 November 2025, Volkshuisvesting Nederland and Woonbond, as quoted by search. One site gives the rekengrens as €932.32; the Toeslagenkaart's €932.93 stays. All four are built, and their rules are in CLAUDE.md ("Toeslagen 2026"). The huurtoeslag figures marked below as consistent but not verified are used in the code, with a note on the page, until someone reads them on an official page.

The cloud environment cannot reach the official sites (belastingdienst.nl, rijksoverheid.nl, wetten.overheid.nl, eerstekamer.nl): its network policy blocks them. The first draft came from web search summaries. Amir then shared the official **Toeslagenkaart 2026** (Dienst Toeslagen, November 2025, TG 710-1Z61PL); a copy is in `sources/toeslagenkaart-2026.pdf`. It confirmed most figures and corrected three. Amir later pasted two official pages as well: the kinderopvangtoeslag table (Rijksoverheid) and the huurtoeslag changes for 2026 (Dienst Toeslagen), in `sources/`.

Status per figure:

- **Verified (card)**: read on the Toeslagenkaart 2026.
- **Verified (calculation)**: not printed on the card, but it reproduces figures on the card to the euro.
- **Consistent**: several summaries agree, and where possible the numbers also agree with each other through the formula. Still to be read on an official page.
- **Conflicting**: summaries disagree, or one looks like an older year. Must be read on an official page.
- **Missing**: not found yet.

Corrected by the card: the kindgebonden budget extras for a child aged 12 to 15 (€724, not €703) and 16 or 17 (€964, not €936), and the alleenstaande-ouderkop (€3,416, not €3,320).

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
| Standaardpremie | €2,119 a year | Verified (calculation), and in Staatscourant results found by search |
| Drempelinkomen | €29,736 | Verified (card: the same figure is the kindgebonden budget threshold), and in Staatscourant results |
| Normpremie alone | 1.912% of drempelinkomen | Verified (calculation): gives the card's €1,550 |
| Normpremie with partner | 4.289% of drempelinkomen | Verified (calculation): gives the card's €2,963 |
| Above the drempelinkomen | 13.730% of the income above it | Consistent, and in Staatscourant results found by search |
| Income limit alone | €40,857 | Verified (card) |
| Income limit with partner | €51,142 | Verified (card) |
| Vermogen limit alone | €146,011 | Verified (card) |
| Vermogen limit with partner | €184,633 | Verified (card) |
| Maximum | €1,550 a year alone (€129 a month), €2,963 with partner (€247 a month) | Verified (card) |

**Worked examples** (checked with a script, using the numbers above):

- **Alone, €3,000 a month plus 8% holiday pay** (toetsingsinkomen €38,880): normpremie = €568.55 + 13.73% × €9,144 = €1,824.02. Zorgtoeslag = €2,119 − €1,824.02 = **€294.98 a year, €24.58 a month**.
- **Couple, only one of them earns that €38,880**: 2 × €2,119 − (€1,275.38 + €1,255.47) = **€1,707.15 a year, €142.26 a month**.
- **The next €100 at €36,000, alone**: income tax takes €40.20, so the site says "you keep €59.80". With zorgtoeslag, another €13.73 goes, so **you keep €46.07**. (An earlier version of this file said this about €38,880. That was wrong: €38,880 is just below the bracket boundary at €38,883, where income tax takes €41.95 of the next €100, so €44.32 is kept.)

**The hard limit is small in 2026.** At the income limit the formula still gives about €24 a year (€23.53 alone, €23.58 with partner), and one euro above it you get nothing. So crossing the limit costs about €2 a month at once. The real armoedeval effect of zorgtoeslag is the steep 13.73% on every extra euro, not the cut at the limit. CLAUDE.md should say this once verified.

**New inputs needed:** none. The site already knows the income and whether there is a partner. Optional, behind "More details": savings above the vermogen limit (a yes/no is enough). Everyone 18 or older with a Dutch health insurance is assumed eligible.

## 2. Kindgebonden budget

**In plain language.** A yearly amount per child for parents with a low or middle income, paid on top of kinderbijslag. You get the maximum below a threshold income; above it, the total shrinks by 7.6% of every euro above the threshold. Older children get more. Single parents get an extra amount, the alleenstaande-ouderkop.

**Formula.** Kindgebonden budget = maximum (per child, plus age supplements, plus alleenstaande-ouderkop) − 7.60% × (toetsingsinkomen − drempel), minimum 0.

| Parameter | 2026 | Status |
|---|---|---|
| Per child | €2,580 a year | Verified (card) |
| Child aged 12 to 15 | €724 extra a year | Verified (card); search said €703 |
| Child aged 16 or 17 | €964 extra a year | Verified (card); search said €936 |
| Alleenstaande-ouderkop | €3,416 a year | Verified (card: single parent with one child €5,996 = €2,580 + €3,416; two children €8,576) |
| Drempel alone | €29,736 | Verified (card) |
| Drempel with partner | €39,141 | Verified (card) |
| Afbouw | 7.60% of income above the drempel | Verified (card) |
| Vermogen limits | €146,011 alone, €184,633 with partner | Verified (card) |

**New inputs needed:** children and their ages. "Single parent" follows from having no partner on the site. Kinderbijslag (from the SVB) does not depend on income, so it does not change "the next €100"; it could be an optional extra line later.

## 3. Huurtoeslag

**In plain language.** Help with rent for people with a low income. From 2026 it works differently: only the bare rent counts (no service costs), and a rent above the old maximum no longer rules you out; the calculation just stops at that maximum. You always pay a base rent yourself. Of the rent above that, the toeslag pays 100% up to a first limit and 65% up to a second limit. Above a threshold income, the toeslag shrinks by a fixed percentage of every extra euro (the linear afbouw, new in 2026).

**Structure (from the summaries, to verify):**

1. Rekenhuur = bare rent (kale huur), capped at the maximum.
2. Toeslag = 100% of the rent between the basishuur and the kwaliteitskortingsgrens, plus 65% between the kwaliteitskortingsgrens and the aftoppingsgrens. Above the aftoppingsgrens: 0%, or 40% for some groups (AOW age), not relevant for this site yet.
3. Minus a percentage of the income above an income point.

| Parameter | 2026 | Status |
|---|---|---|
| Maximum rent in the calculation (rekengrens) | €932.93 a month when someone is 21 or older, or a child lives there | Verified (card) |
| Rekengrens when everyone is 18, 19 or 20 | €498.20 | Verified (card) |
| Income of a child under 23 living at home | the first €6,218 does not count | Verified (card) |
| Basishuur | €202.52 alone, €200.71 for more people | Consistent (possibly one source copied by another) |
| Kwaliteitskortingsgrens | €498.20 | Consistent: in earlier years it equalled the young people's limit (€454.47 in 2024, €477.20 in 2025, €498.20 in 2026), and a later search gave €498.20 |
| Aftoppingsgrens, 1 or 2 people | €713.02 | Consistent: 4.4% above 2025 (€682.96), the same increase as the kwaliteitskortingsgrens; €650.43 was 2024 |
| Aftoppingsgrens, 3 or more people | €764.14 | Consistent: 4.4% above 2025 (€731.93); €697.07 was 2024 |
| Share above the aftoppingsgrens | 40% for every household (before 2026 only for some) | Consistent: Rijksoverheid factsheet "Vereenvoudiging van de huurtoeslag", via search |
| Income point where the afbouw starts | €23,425 alone, €31,500 for more people | Consistent in official summaries via search |
| Afbouw percentage | 27% alone, 22% for more people, of the yearly income above the point | Consistent: "€1,000 more income gives €270 or €220 less huurtoeslag" in an official summary via search |
| Vermogen limit | €38,479 alone, €76,958 with partner, €38,479 per other resident | Verified (card) |

**New inputs needed:** bare rent per month, and the number of people in the home (partner and children follow from the page). Possibly age under 21 or 23.

This is the toeslag where the summaries were least reliable. It needs the official "rekenregels huurtoeslag 2026" or the Staatscourant regeling before any code.

## 4. Kinderopvangtoeslag

**In plain language.** A percentage of the childcare costs, up to a maximum price per hour and a maximum number of hours. The percentage depends on the combined income: 96% for low and middle incomes, falling for higher incomes. A second child and later children get a higher percentage than the first. Both parents must work or study.

| Parameter | 2026 | Status |
|---|---|---|
| Maximum hourly price, dagopvang | €11.23 | Verified (card) |
| Maximum hourly price, buitenschoolse opvang | €9.98 | Verified (card) |
| Maximum hourly price, gastouderopvang | €8.49, for dagopvang and buitenschoolse opvang | Verified (card) |
| Maximum hours | 230 a month per child, 2,760 a year | Verified (Rijksoverheid page) |
| 96% for both first and next children | up to €56,412 combined income; from €56,413 95.5% and 95.6% | Verified (Rijksoverheid page) |
| Lowest percentage, first child | 36.5% from €165,658 | Verified (Rijksoverheid page); €235,689 was where the next-child percentage bottoms out |
| Lowest percentage, next children | 68.2% from €235,698 | Verified (Rijksoverheid page) |
| The full percentage table per income band | 69 rows | Verified (Rijksoverheid page, `sources/kinderopvangtoeslag-2026.md`) |
| Which child is the "first child" | the one with the most hours | Our reading, not on the page |

**New inputs needed:** per child: type of care, hours per month and price per hour. This is the most inputs of any toeslag, so it comes last.

## What this means for "the next €100"

For someone alone at €36,000: income tax leaves €59.80 of the next €100, zorgtoeslag takes €13.73 of it, so €46.07 is left. With children and above the €29,736 threshold, kindgebonden budget takes another €7.60, leaving €38.47. With huurtoeslag on top, the combined rate goes well above 50%, which is the 70 to 80% range CLAUDE.md warns about. The exact numbers wait for verification.

## Still to verify

- Huurtoeslag: basishuur, kwaliteitskortingsgrens, aftoppingsgrenzen, the income point and the afbouw percentage (the rekenregels huurtoeslag 2026).
- Kinderopvangtoeslag: the percentage table per income, and the maximum of 230 hours.
- Toetsingsinkomen: that it is the box 1 taxable income for the people this site covers.
- The card also lists an "indexpercentage inkomen" of 4.39%. Dienst Toeslagen uses it to estimate income; the site does not need it.

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
