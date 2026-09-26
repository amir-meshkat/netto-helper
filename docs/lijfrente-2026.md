# Lijfrente 2026: a what-if to lower your tax

Research notes for milestone 8, second item (26 September 2026). Amir asked for options that could reduce tax,
starting with lijfrente, in a what-if section. The figures come from search results quoting belastingdienst.nl
and pension providers; cloud sessions cannot open belastingdienst.nl itself. Check them there before relying on them.

## The rule in plain language

A lijfrente is money you put away for your pension yourself, in a blocked account or insurance. What you put in
this year comes off your taxable income in box 1, as long as it fits in your room for this year, the
**jaarruimte**. So you pay less income tax now, and because the toeslagen look at the same income, they can go up.
The money is locked until your pension, and you pay income tax on it when it is paid out, usually at a lower
rate after AOW age. So it moves tax to later rather than removing it.

- **Jaarruimte** = 30% of last year's income from work above €19,172 (the AOW-franchise), counting income up to
  €137,800, minus 6.27 × factor A. Never below 0, never above €35,589.
- **Factor A** is the pension you built up at work last year. It is on the yearly pension overview (UPO). With a
  good pension at work, factor A can use up all of the jaarruimte.
- **Income from work** for this: salary after the employee pension premium, plus profit from a business before
  the zelfstandigenaftrek and the mkb-winstvrijstelling. Not the own home.
- **The deduction keeps its full rate.** Unlike the mortgage interest, the lijfrente deduction is not capped at
  37.56%: in the top bracket it saves 49.50%.
- It also lowers the income that the general tax credit (algemene heffingskorting) looks at, so in its phase-out
  (€29,736 to €78,423) every euro saves another 6.398%. The labour tax credit does not change: it looks at income
  from work.
- **Reserveringsruimte:** jaarruimte left unused in the ten years before can still be used, up to €42,753 in 2026.
  Not included: it needs ten years of history.

## Worked examples (also tests)

Alone, salary €3,000 a month with 8% holiday pay (€38,880), no pension at work:

| Step | Amount |
|---|---|
| Jaarruimte: 30% × (€38,880 − €19,172) | €5,912.40 |
| What if: put in €1,000 | taxable income €38,880 → €37,880 |
| Box 1 tax, first bracket: 35.75% × €1,000 | €357.50 less |
| General tax credit, in its phase-out: 6.398% × €1,000 | €63.98 more |
| Zorgtoeslag, 13.73% of the income above €29,736 | €137.30 more |
| Back this year | €558.78 |
| What the €1,000 costs you now | €441.22 |

More cases:

- €51,840 (€4,000 a month with 8%): jaarruimte €9,800.40. €1,000 in gives €439.58 back (37.56% + 6.398%), no
  toeslagen at this income.
- €120,000: €1,000 in gives €495 back, the full 49.50%.
- Factor A of €1,000 at €51,840: jaarruimte €9,800.40 − €6,270 = €3,530.40. Factor A of €2,000: no room.
- Above €137,800 the room stops growing: €35,588.40.
- Salary €38,880 and side profit €10,000: the profit counts before the zzp deductions, so the jaarruimte is
  30% × (€48,880 − €19,172) = €8,912.40.
- Put in more than the jaarruimte: only the jaarruimte counts this year.

## 2026 figures

| Rule | 2026 | Source (via search) |
|---|---|---|
| Jaarruimte percentage | 30% of the premiegrondslag | pension providers (Raisin, a.s.r., Van Lanschot), since the Wet toekomst pensioenen |
| AOW-franchise | €19,172 | same |
| Maximum income counted | €137,800 | same |
| Factor A multiplier | 6.27 | same |
| Maximum jaarruimte | €35,589 | same, and 30% × (€137,800 − €19,172) = €35,588.40 |
| Maximum reserveringsruimte | €42,753 | MKB Servicedesk, Rabobank |
| Tariefsaanpassing | does not apply to lijfrente premiums | Belastingdienst page on the tariefsaanpassing, as summarised by search |
| Toetsingsinkomen and general tax credit | both follow the income after the deduction | Handboek Toeslagen, advisers |

Sources to check:

- https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/werk_en_inkomen/lijfrente/aftrekken-lijfrentepremies/aftrekken-lijfrentepremies
- https://www.belastingdienst.nl/wps/wcm/connect/nl/aftrek-en-kortingen/content/afbouw-tarief-aftrekposten-bij-hoog-inkomen
- The Belastingdienst jaarruimte calculator (rekenhulp lijfrentepremie), in Mijn Belastingdienst.

## Assumptions to discuss with Amir

1. **A what-if, not part of "what you keep".** Putting money in a lijfrente is saving, not spending, and the page
   does not know if you will do it, so the headline and the other sections do not change. The new section shows
   what a deposit would give back this year.
2. **This year's income stands in for last year's.** The jaarruimte for 2026 is based on 2025; the page uses the
   income typed now.
3. **Factor A is optional**, one per person, empty means 0. When someone has a pension premium at work and no
   factor A, the page warns that the jaarruimte is lower than shown.
4. **No reserveringsruimte.** Only this year's room counts; the page says that unused room from earlier years
   can add more.
5. **Tax later is not calculated.** The page says the money is taxed when paid out, usually at a lower rate after
   AOW age, and that it is locked until then.
6. **For a couple**, the same amount is worked out for each partner: a lijfrente premium belongs to the person who
   pays it and cannot be divided like the mortgage. The page says who gets the most back.
7. **With a mortgage**, the division of the eigen woning saldo is worked out again with the deposit.
