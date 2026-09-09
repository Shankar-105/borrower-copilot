# Borrower Copilot — Rules

This is a borrower self-assessment, not a lender approval model. The goal is that every important number can be traced to an answer.

## Main rules

| What | Value | Why | Source |
|---|---:|---|---|
| Lender-side FOIR | 50% | Prototype estimate of total EMI a lender may size | My judgement |
| Borrower-safe FOIR | 40% | Keeps a buffer below lender-side capacity | My judgement |
| Processing fee | 2% | Lets the app show all-in APR | My judgement |
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

### Household income

The challenge explicitly gives Ravi a wife's income of ₹18,000/month. The app now captures this as **other household income you expect to rely on** for non-salaried borrowers.

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

Let `I` be normalized borrower income and `H` be other household income.

Lender-side capacity uses only the borrower income:

`lenderTotal = I × 50%`

`lenderAvailable = max(0, lenderTotal - existingEMI)`

Borrower-safe household capacity can use both incomes:

`householdIncome = I + H`

`safeTotal = householdIncome × 40%`

`foirSafeAvailable = max(0, safeTotal - existingEMI)`

If household expenses are known:

`cashflowSafeAvailable = max(0, householdIncome - existingEMI - householdExpenses)`

`safeAvailable = min(foirSafeAvailable, cashflowSafeAvailable)`

If expenses are unknown, the app does not invent ₹0 expenses. It uses the 40% FOIR ceiling and lowers confidence.

### Important Priya detail

If Priya enters ₹28,000 household expenses, the number may **not always move**. That is not a silently ignored input. For Priya, the 40% FOIR ceiling after her ₹14,000 existing EMI is ₹30,000. Her ₹28,000 expenses leave ₹68,000 of cash-flow room, so the ₹30,000 FOIR ceiling is still tighter and remains the binding limit.

The result now tells the borrower this explicitly instead of making it look like the expense field did nothing. If expenses are high enough to become the tighter constraint, the safe EMI and safe amount fall.

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

The code represents unknown credit with separate `minPoints` and `maxPoints`. It no longer relies on a shared `points` value plus a hidden extra maximum adjustment.

## EMI and principal

The app uses the reducing-balance EMI formula and the reverse formula to turn an EMI ceiling into a principal.

The midpoint of the rate band is used only as a planning rate for principal sizing. The borrower still sees the full rate band.

## Product routing

- Business purpose + supplied property/self-employed profile → LAP / secured business route.
- Business purpose without a secured route → business loan.
- Vehicle purpose → two-wheeler loan.
- Otherwise → personal loan.

Ravi is routed to a secured business/LAP route. The ₹45L property produces a ₹22.5L collateral cap, but income affordability is lower, so collateral does not justify a ₹15L recommendation.

## Decision

1. `DON'T BORROW` if high-cost debt and a recent bounce are both present.
2. `DON'T BORROW` if safe monthly capacity is zero.
3. `BORROW LESS` if the request is above borrower-safe amount.
4. Otherwise `BORROW`.

The stress case is shown separately. A failed stress case does not automatically change the base verdict because it is a resilience check.

## Stress

- Borrower income falls by 15%.
- The rate rises by 2 percentage points above the maximum rate in the band.
- Requested EMI is compared with stressed safe monthly room.
- Other household income remains as separately supplied rather than being silently stress-reduced.

## APR

The prototype assumes a 2% processing fee. It calculates APR from net disbursal after the fee while EMI is still based on the full principal. A numerical bisection solve is used instead of simply adding the fee percentage to the interest rate.

## Confidence and unknowns

Confidence falls when credit is unknown, income is non-salaried, expenses are unknown, a bounce exists, or age is unknown.

Unknown is never treated as zero. Unknown credit stays unknown and widens the rate band.

## Three challenge borrowers

### Priya

- ₹1.10L net salary, ₹14k existing EMI, credit score 780.
- ₹8L wedding request.
- Household expenses are not supplied by the brief. If she enters ₹28k, the FOIR ceiling remains tighter, so the safe amount may stay the same and the app explains why.
- Verdict: BORROW.

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
