# Borrower Copilot — Rules

This is a borrower self-assessment, not a lender approval model. The goal is that every important number can be traced to an answer.

## Main rules

| What | Value | Why | Source |
|---|---:|---|---|
| Lender-side FOIR | 50% | Prototype estimate of total EMI a lender may size | My judgement |
| Borrower-safe FOIR | 40% | Keeps a buffer below lender-side capacity | My judgement |
| Processing fee | 2% | Lets the app show an all-in APR estimate | My judgement |
| Stress income drop | 15% | Tests a lower-income month | My judgement |
| Stress rate increase | 2 pp | Tests a higher-rate case | My judgement |
| Tenure | 12–84 months | Keeps the prototype in a normal range | My judgement |
| Age limit | 60 years | Limits repayment horizon in this prototype | My judgement |
| Secured LTV cap | 50% | Collateral is an upper cap, not a replacement for income affordability | My judgement |
| Variable income | Low + 35% of range | Does not treat the best month as normal income | My judgement |
| Self-employed cash | 70% of cash when no ITR is available | Reduces reliance on undocumented cash income | My judgement |

The FOIR numbers are prototype assumptions. They are not universal RBI rules.

## Questions

The form is adaptive. The core questions are purpose, amount, loan type, income and type, existing EMIs, household expenses, age and credit score if known. Conditional questions appear for self-employed/business borrowers, and risk questions are included because they move rate or decision.

Each optional question is kept only when it can change an output: other household income changes safe household capacity, expenses change safe EMI capacity, collateral changes route/collateral cap, risk answers change rate or decision, and tenure changes EMI/amount/APR.

## Household income

The challenge explicitly gives Ravi a wife's income of ₹18,000/month. The app captures this as **other household income you expect to rely on** for non-salaried borrowers.

This income is used for the **borrower-safe household calculation**, because it can affect the household's ability to carry an EMI. It is **not** added to lender-side sanction capacity because the app has not established that the spouse is a co-applicant or that the lender will count that income.

This is intentionally different from silently assuming the spouse is a co-borrower.

## Income normalization

### Salaried

`normalized income = net monthly salary`

### Self-employed

If ITR is available:

`normalized income = documented annual income / 12`

Otherwise:

`normalized income = cash income × 70%`

### Variable/informal

`normalized income = low + 35% × (high - low)`

## Affordability

Let `I` be normalized borrower income, `H` be other household income, `E` be existing monthly EMIs, and `X` be known monthly household expenses excluding EMIs.

Lender-side capacity uses only borrower income:

`lenderTotal = I × 50%`

`lenderAvailable = max(0, lenderTotal - E)`

Borrower-safe household capacity can use both incomes:

`householdIncome = I + H`

`safeTotal = householdIncome × 40%`

If household expenses are known, **expenses are part of the safe FOIR calculation and are subtracted from the FOIR ceiling**:

`safeAvailable = max(0, safeTotal - E - X)`

If expenses are unknown:

`safeAvailable = max(0, safeTotal - E)`

The app does not invent ₹0 expenses. Missing expenses lower confidence.

### Priya example

For Priya, if the borrower enters ₹28,000 as monthly household expenses:

`₹1,10,000 × 40% = ₹44,000 safe FOIR ceiling`

`₹44,000 - ₹14,000 existing EMI - ₹28,000 expenses = ₹2,000 new EMI ceiling`

That ₹2,000 is then converted into the borrower-safe principal using the midpoint rate and selected tenure. The expense input therefore directly changes the safe amount.

The challenge profile itself says Priya **rents** for ₹28,000. Rent is not necessarily her full household spending. In the prefilled challenge run, ₹28,000 is used as the known expense input so the app demonstrates the requested expense-sensitive rule; a real borrower should enter total monthly household expenses excluding EMIs.

## Rate bands

| Route | Base band |
|---|---:|
| Personal | 11%–18% |
| Business | 12%–20% |
| LAP / secured business | 10%–14% |
| Two-wheeler | 11%–19% |

These are prototype planning bands, not lender quotes.

### Rate adjustments

| Condition | Minimum | Maximum | Why |
|---|---:|---:|---|
| Credit 750+ | -1.5 pp | -1.5 pp | Strong stated score |
| Credit 700–749 | 0 pp | 0 pp | Middle bucket |
| Credit below 700 | +2.5 pp | +2.5 pp | Weaker stated score |
| Credit unknown | +2 pp | +3 pp | Unknown credit widens the range |
| Non-salaried | +1 pp | +1 pp | More income uncertainty |
| Recent bounce | +2 pp | +3 pp | Recent repayment stress |
| High-cost debt | +1 pp | +2 pp | Existing expensive debt |

Unknown credit is represented with separate minimum and maximum adjustments. It is never converted into a fake score.

## EMI and principal

The app uses the reducing-balance EMI formula and the reverse formula to turn an EMI ceiling into a principal.

The midpoint of the rate band is used only as a planning rate for principal sizing. The borrower still sees the full rate band.

## Practical amount

The app keeps both required O2 numbers:

- **Lender-side capacity**: what the prototype estimates a lender may size.
- **Borrower-safe amount**: what the household can safely carry under the safe FOIR/expense rules and collateral cap.

`practicalAmount = min(lenderAmount, safeAmount)`

The Negotiation Card recommends the practical amount because an amount that is affordable but unlikely to be sanctioned is not useful as the amount to plan around.

## Product routing

- Business purpose + supplied property/self-employed profile → LAP / secured business route.
- Business purpose without a secured route → business loan.
- Vehicle purpose → two-wheeler loan.
- Otherwise → personal loan.

Ravi is routed to a secured business/LAP route. The ₹45L property produces a ₹22.5L collateral cap, but income affordability is lower, so collateral does not justify a ₹15L recommendation.

## Decision

1. `DON'T BORROW` if high-cost debt and a recent bounce are both present.
2. `DON'T BORROW` if safe monthly capacity is zero.
3. `BORROW LESS` if the request is above the practical amount.
4. Otherwise `BORROW`.

The stress case is shown separately. A failed stress case does not automatically change the base verdict because it is a resilience check.

## Stress

- Borrower income falls by 15%.
- The rate rises by 2 percentage points above the maximum rate in the band.
- Requested EMI is compared with stressed safe monthly room.
- Other household income remains as separately supplied rather than being silently stress-reduced.
- Known household expenses remain in the stressed safe-FOIR calculation.

## APR

The prototype assumes a 2% processing fee. It calculates APR from net disbursal after the fee while EMI is still based on the full principal. A numerical bisection solve is used instead of simply adding the fee percentage to the interest rate.

APR is calculated on the **practical amount**, because that is the amount the card recommends. If practical capacity is zero, APR is shown as zero rather than inventing a benchmark for a loan the borrower should not take.

## Confidence and unknowns

Confidence falls when credit is unknown, income is non-salaried, expenses are unknown, a bounce exists, or age is unknown.

Unknown is never treated as zero. Unknown credit stays unknown and widens the rate band.

## Three challenge borrowers

### Priya

- ₹1.10L net salary, ₹14k existing EMI, credit score 780.
- ₹8L wedding request.
- Challenge gives ₹28k rent. In the written run, that ₹28k is entered as the known household-expense input to exercise the expense rule.
- With ₹28k expenses, safe new EMI is `₹44k - ₹14k - ₹28k = ₹2k`.
- The practical amount is therefore far below the ₹8L request.
- Verdict: BORROW LESS.

### Ravi

- ₹40k–₹80k cash income, ₹4.2L ITR income.
- Wife earns ₹18k/month.
- ₹0 existing EMI, unknown credit, ₹45L unencumbered shop.
- ₹15L business request.
- ITR gives normalized borrower income of ₹35k/month.
- Wife's ₹18k is added only to borrower-safe household capacity.
- Lender-side capacity remains based on Ravi's documented income.
- Secured route and ₹22.5L collateral cap apply.
- Verdict: BORROW LESS.

### Anita

- ₹26k–₹30k variable income, ₹1,050 existing EMI.
- Unknown credit, one recent bounce, high-cost app debt.
- ₹1.5L vehicle request.
- Verdict: DON'T BORROW because the debt-risk guard fires.

## What this prototype does not know

- Bureau data
- Actual lender underwriting
- Lender-specific FOIR rules
- Verified household expenses
- Whether another household earner is a formal co-applicant
- Actual collateral/title valuation
- Exact lender rate cards and KFS charges

Those are limitations, not numbers the prototype should invent.

## Live rule change

Changing `safeFoir` from 40% to 35% changes borrower-safe EMI and amount but not lender-side capacity. Changing `lenderFoir` changes lender-side capacity. Changing `processingFee` changes APR. Changing `stressIncomeDrop` changes the stress result.
