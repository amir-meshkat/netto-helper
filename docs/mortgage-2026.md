# Mortgage 2026: eigenwoningforfait and hypotheekrenteaftrek

Research notes for milestone 8, first item. Written on 26 September 2026 while Amir was away, so every choice
below marked **Assumption** is open for discussion. The figures come from search results that quote
belastingdienst.nl and several mortgage advisers; cloud sessions cannot open belastingdienst.nl itself.
Before relying on them, check them on the Belastingdienst pages listed under Sources.

## The rule in plain language

Owning the home you live in counts as income in box 1, and the interest on the mortgage for it is a deduction.

1. **Eigenwoningforfait.** A small made-up income for living in your own home: a percentage of the WOZ value.
   For almost every home it is 0.35% of the WOZ value: a home worth €400,000 adds €1,400 to your income.
2. **Mortgage interest** (hypotheekrente) on the loan for that home comes off.
3. **Saldo.** Forfait minus interest. With a normal mortgage the interest is larger, so the saldo is negative
   and lowers your taxable income: that is the hypotheekrenteaftrek.
4. **Cap.** A deduction saves at most 37.56% (the rate of the second bracket). In the top bracket, where
   income tax is 49.50%, the difference of 11.94% is added back (tariefsaanpassing). The engine already did
   this for the zzp deductions; the negative saldo is added to those deductions.
5. **Little or no mortgage (Wet Hillen).** When the forfait is larger than the interest, only part of the
   difference is taxed: 71.867% of it is deducted in 2026. This deduction is being phased out, by 4.8
   percentage points a year from 2026, until it is gone in 2041.
6. **Partners.** Fiscal partners may divide the saldo between them in any proportion. If they do not
   choose, it is half each.
7. **Toeslagen.** The saldo is part of box 1 income, so it also changes the toetsingsinkomen: a mortgage
   can mean more zorgtoeslag or kindgebonden budget. A home owner gets no huurtoeslag.

What it does not change: the labour tax credit (arbeidskorting) looks at income from work only, and the
Zvw on side income looks at the profit only.

What it does change besides the bracket: the general tax credit (algemene heffingskorting) looks at taxable
income. Between €29,736 and €78,423 it goes up by 6.398% of every euro of deduction, so there a deduction
saves 37.56% + 6.398% = 43.958% (or 35.75% + 6.398% = 42.148% in the first bracket).

## Other deductible home costs (added 27 September 2026)

Besides the interest, a few other costs of the own home come off the same way, in the year you pay them:

- **Erfpacht:** the yearly canon for ground lease, common in Amsterdam and some other cities. Buying off the
  erfpacht is not deductible.
- **Costs of getting the mortgage:** mortgage advice, valuation (taxatie), the NHG fee, and the notary for the
  mortgage deed (hypotheekakte). Also when you raise the mortgage for a renovation.
- **Not deductible:** the transfer tax (overdrachtsbelasting), the notary for the transfer deed (leveringsakte),
  the buying agent, renovation and furniture.

Worked example (a test): the same home as below, plus €1,200 erfpacht a year. Saldo €1,400 − €12,000 − €1,200 =
−€11,800, so tax is €11,800 × 43.958% = €5,187.04 lower a year, €522.95 more than without the erfpacht.

The page also takes the interest as typed from the yearly statement (jaaroverzicht), for anyone who has it:
that is the real figure, while loan × rate is a little too high for a loan that is being paid off.

## Worked example (also a test)

Alone, salary €4,000 a month with 8% holiday pay: €51,840 a year. Home with WOZ value €400,000, a loan of
€300,000 at 4.0% interest.

| Step | Amount |
|---|---|
| Eigenwoningforfait: 0.35% × €400,000 | + €1,400 |
| Mortgage interest: 4.0% × €300,000 | − €12,000 |
| Saldo | − €10,600 |
| Taxable income | €51,840 → €41,240 |
| Box 1 tax, all of it in the second bracket: 37.56% × €10,600 | €3,981.36 less |
| General tax credit, in its phase-out: 6.398% × €10,600 | €678.19 more |
| Tax per year | €4,659.55 less, €388.30 a month |

The interest is €1,000 a month; after tax it costs €611.70 a month.

More test cases:

- No mortgage, WOZ €400,000: forfait €1,400, Hillen deduction 71.867% × €1,400 = €1,006.14, so €393.86 is
  added to the income.
- WOZ €60,000: 0.25% × €60,000 = €150. WOZ €1,500,000: €4,725 + 2.35% × €150,000 = €8,250.
- Top bracket: salary €120,000, interest €20,000, WOZ €600,000 (forfait €2,100): saldo −€17,900, all of it
  in the top bracket. 49.50% × €17,900 = €8,860.50 less box 1 tax, minus the tariefsaanpassing 11.94% ×
  €17,900 = €2,137.26: €6,723.24 less tax, exactly 37.56%.
- Couple, one earning €51,840 and one nothing, same home: all of the saldo with the earner saves €4,659.55
  a year; half each would save only €2,329.77, because the partner without income pays no tax to save.

## 2026 figures

| Rule | 2026 | Source (via search) |
|---|---|---|
| Eigenwoningforfait, WOZ up to €12,500 | nil | advisers quoting the Belastingdienst table |
| €12,500 to €25,000 | 0.10% | same |
| €25,000 to €50,000 | 0.20% | same |
| €50,000 to €75,000 | 0.25% | same |
| €75,000 to €1,350,000 | 0.35% | same, and several 2026 overviews |
| Above €1,350,000 (villagrens) | €4,725 + 2.35% of the value above €1,350,000 | same |
| Wet Hillen deduction | 71.867% of forfait minus deductible costs | Belastingdienst page and advisers (76.667% in 2025, minus 4.8) |
| Maximum rate of the deduction | 37.56%, so a tariefsaanpassing of 11.94% | Belastingdienst page "Minder aftrek voor uw eigen woning als u een hoog inkomen hebt" and advisers |
| Tariefsaanpassing base | 11.94% × the lower of the deduction and (taxable income + the deduction − €78,426) | same page, as summarised by search |
| Division between fiscal partners | any proportion, half each if not chosen | Belastingdienst "Fiscaal partnerschap" and advisers |

Sources to check (not reachable from the cloud session):

- https://www.belastingdienst.nl/wps/wcm/connect/nl/koopwoning/content/hoe-werkt-eigenwoningforfait
- https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/woning/eigenwoningforfait/geen_of_een_kleine_eigenwoningschuld/geen_of_een_kleine_eigenwoningschuld
- https://www.belastingdienst.nl/wps/wcm/connect/nl/koopwoning/content/tariefsaanpassing-eigen-woning
- https://www.belastingdienst.nl/wps/wcm/connect/fisin/fisin2025/fiscaal_partnerschap

## Assumptions

Status on 27 September 2026, after Amir asked to complete these steps: 1 and 3 are solved on the page, 5 is
reworded, and the rest are choices that stay, each said on the page where it matters.

1. **Solved: interest from the annual statement.** Besides loan × rate (a little too high for a loan that is
   being paid off), the interest can be typed from the yearly statement (jaaroverzicht): "How do you know the
   interest?" in the mortgage block.
2. **Stays: all of the loan counts as eigenwoningschuld.** No check of the rules since 2013 (repaid in full
   within 30 years, at least annuity), the 30-year limit, the bijleenregeling or loan parts for other
   purposes. Most people's whole mortgage counts; the page's "Mortgage" note says what is assumed.
3. **Solved: other deductible home costs.** An optional "Other home costs" field takes erfpacht and the costs
   of getting the mortgage. Still not included: owning the home for only part of the year (after moving).
4. **Stays: a partner on the page is a fiscal partner who owns the home together.** Living together and
   owning the home together makes you fiscal partners, so this fits the most common case.
5. **Stays: the page divides the saldo in the most favourable way**, as advisers do. It compares half each,
   all with one partner, all with the other, and every division where one partner's income reaches the edge of
   a tax zone; one of those is always the best, because tax changes in straight lines between those edges.
   When several divisions are equally good, it keeps half each. (The earlier line that the online aangifte
   suggests this was not verified and is gone.)
6. **Stays: rent or own, not both.** Adding a mortgage hides the rent (and huurtoeslag), and the other way
   around.
7. **Stays: taxable income does not go below zero.** A negative box 1 income can be carried back or forward
   (verliesverrekening); rare for salaried people with a mortgage, not included.
8. **Stays: "what you keep" does not subtract the interest itself**, just as it does not subtract rent: housing
   costs are not taken off the netto. The mortgage section shows the interest, what comes back, and the net
   cost per month.
9. **Stays: side income with a mortgage** keeps each partner's share of the saldo as it is now. In reality the
   best division could shift when the side income moves to the other partner; the difference is small.
10. **Stays: no change to withholding.** Employers do not know about the mortgage, so the benefit comes back
    with the aangifte, or monthly with a voorlopige aanslag. The page says so.
