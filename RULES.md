# Borrower Copilot — Rules

This is a borrower self-assessment, not a lender approval model. The goal is that every important number can be traced to an answer. The challenge asks for a self-assessment with lender-side capacity, borrower-safe capacity, fair-rate band, EMI ceiling/stress, adaptive questions, honest uncertainty and a usable Negotiation Card.

## Main rules

| What | Value | Why | Source |
|---|---:|---|---|
| Lender-side FOIR | 50% | Prototype estimate of total EMI a lender may size | My judgement |
| Borrower-safe FOIR | 40% | Keeps a buffer below lender-side capacity | My judgement |
| Processing fee | 2% | Lets the app show an all-in APR estimate | My judgement |
| Stress income drop | 15% | Tests a lower-income month | My judgement |
| Stress rate increase | 2 pp | Tests a higher-rate case | My judgement |
| Stress expense reduction | 10% | Allows limited variable-spend adjustment under stress without pretending all expenses disappear | My judgement |
| Minimum maintenance floor | ₹7,500/month | Unknown or implausibly low maintenance is never treated as ₹0; rent is counted separately | My judgement |
| Fair-rate cap buffer | +1 pp over route base maximum | A borrower negotiation benchmark should not become a lender worst-case price; adverse risk is surfaced separately | My judgement |
| Tenure | 12–84 months | Keeps the prototype in a normal range | My judgement |
| Age limit | 60 years | Limits repayment horizon in this prototype | My judgement |
| Secured LTV cap | 50% | Collateral is an upper cap, not a replacement for income affordability | My judgement |
| Variable income | Low + 35% of range | Does not treat the best month as normal income | My judgement |
| Self-employed income source | Documented annual income / 12 when available; otherwise stable cash-range baseline | Uses one income basis and prevents ITR income and operating cash from being double-counted | My judgement |

The FOIR, LTV, fee, rate bands and stress values are prototype assumptions. They are not universal RBI rules or lender promises.

## Questions

The form is adaptive. The core questions are purpose, amount, loan type, income and type, existing EMIs, household expenses, age and credit score if known. Conditional questions appear for self-employed/business borrowers, and risk questions are included because they move decision/confidence or the benchmark.

Each additional question must change an output. Other household income changes safe household capacity; expenses change safe EMI capacity; collateral changes route/collateral cap; risk answers change the decision/confidence; tenure changes EMI/amount/APR; income type and documentation change normalization; credit changes the rate band and confidence.

## Household income

The challenge explicitly gives Ravi a wife's income of ₹18,000/month. The app captures this as **other household income you expect to rely on** for non-salaried borrowers.

This income is used for the **borrower-safe household calculation**, because it can affect the household's ability to carry an EMI. It is **not** added to lender-side sanction capacity because the app has not established that the spouse is a co-applicant or that the lender will count that income.

This is intentionally different from silently assuming the spouse is a co-borrower.

## Income normalization

### Salaried

`normalized income = net monthly salary`

### Self-employed

If ITR is available:

`normalized income = documented annual income / 12` when ITR income is available; otherwise use `low + 35% × (high - low)`

Otherwise:

`normalized income = cash income × 70%`

### Variable/informal

`normalized income = low + 35% × (high - low)`

## Affordability

Let `I` be normalized borrower income, `H` be other household income, `E` be existing monthly EMIs, and `X` be monthly household expenses excluding EMIs.

Lender-side capacity uses only borrower income:

`lenderTotal = I × 50%`

`lenderAvailable = max(0, lenderTotal - E)`

Borrower-safe household capacity can use both incomes:

`householdIncome = I + H`

`safeTotal = householdIncome × 40%`

If household expenses are known:

`safeAvailable = max(0, safeTotal - E - rent - max(X, ₹7,500))`

If household expenses are unknown, the model **does not use zero**. It uses a disclosed minimum maintenance floor of ₹7,500, in addition to rent when applicable:

`assumedExpenses = rent + ₹7,500`

`safeAvailable = max(0, safeTotal - E - assumedExpenses)`

Housing is asked before rent. Owned homes always use `rent = ₹0`; renters must provide a positive monthly rent. A missing renter rent value blocks borrower-safe capacity rather than being treated as free housing.

This makes silence widen uncertainty rather than manufacture affordability. The proxy is explicitly labelled as a judgement and is not presented as the borrower's actual spending.

### Priya example

For Priya, if the borrower enters ₹28,000 as monthly maintenance expenses:

`₹1,10,000 × 40% = ₹44,000 safe FOIR ceiling`

`₹44,000 - ₹14,000 existing EMI - ₹28,000 expenses = ₹2,000 new EMI ceiling`

That ₹2,000 is then converted into the borrower-safe principal using the midpoint rate and selected tenure. The expense input therefore directly changes the safe amount.

The challenge profile itself says Priya **rents** for ₹28,000. Rent is not necessarily her full household spending. In the prefilled challenge run, ₹28,000 is used as the known expense input so the app demonstrates the expense-sensitive rule; a real borrower should enter total monthly household expenses excluding EMIs.

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
| Credit unknown | +2 pp | +3 pp | Unknown credit widens the range without inventing a score |
| Non-salaried | +1 pp | +1 pp | More income uncertainty |
| Fair-rate ceiling | Base maximum +1 pp | Base maximum +1 pp | Prevents a negotiation benchmark from becoming an absurd worst-case quote |

Recent bounce and high-cost debt are **risk flags**, not stacked fair-rate penalties. They remain visible and can trigger the `DON'T BORROW` guard. This separates two concepts the borrower needs to understand: *what is a defensible benchmark for negotiation* versus *whether this borrower should take new debt at all*.

## EMI and principal

The app uses the reducing-balance EMI formula and the reverse formula to turn an EMI ceiling into a principal.

The midpoint of the rate band is used only as a planning rate for principal sizing. The borrower still sees the full rate band.

## Practical amount

The app keeps both required O2 numbers:

- **Lender-side capacity**: what the prototype estimates a lender may size.
- **Borrower-safe amount**: what the household can safely carry under the safe FOIR/expense rules and collateral cap.

`practicalAmount = min(lenderAmount, safeAmount)`

The Negotiation Card recommends the practical amount because an amount that is affordable but unlikely to be sanctioned is not useful as the amount to plan around.

The displayed EMI ceiling corresponds to the practical amount. If collateral caps the principal below the income-derived safe amount, the recommended EMI is recalculated from that practical principal rather than displaying unused safe headroom.

## Product routing

- Business purpose + supplied property → LAP / secured business route.
- Business purpose without a secured route → business loan.
- Vehicle purpose → two-wheeler loan.
- Otherwise → personal loan.

Ravi is routed to a secured business/LAP route. The ₹45L property produces a ₹22.5L collateral cap, but income affordability is lower, so collateral does not justify a ₹15L recommendation.

The unsecured `business` route remains reachable when a business borrower supplies no collateral. This avoids a dead product tier while preserving the challenge's secured-Ravi case.

## Decision

1. `DON'T BORROW` if high-cost debt and a recent bounce are both present.
2. `DON'T BORROW` if safe monthly capacity is zero.
3. `BORROW LESS` if the request is above the practical amount.
4. Otherwise `BORROW`.

The stress case is shown separately. A failed stress case does not automatically change the base verdict because it is a resilience check; the borrower can see the failed buffer without the model pretending that stress is a new underwriting decision.

## Stress

- Borrower income falls by 15%.
- The rate rises by 2 percentage points above the maximum rate in the band.
- Requested EMI is compared with stressed safe monthly room.
- Other household income remains as separately supplied rather than being silently stress-reduced.
- Known household expenses remain in the stressed safe-FOIR calculation, but the model reduces the expense load by 10% to represent limited variable-spend adjustment.
- The ₹7,500 maintenance floor is also reduced by 10% under stress.

## APR

The prototype assumes a 2% processing fee. It calculates APR from net disbursal after the fee while EMI is still based on the full principal. A numerical bisection solve is used instead of simply adding the fee percentage to the interest rate.

APR is calculated on the **practical amount**, because that is the amount the card recommends. If practical capacity is zero, APR is shown as zero rather than inventing a benchmark for a loan the borrower should not take.

This is an illustrative APR for the fee model in this prototype, not a full lender KFS. The app does not know every possible charge or lender-specific APR convention.

## Confidence and unknowns

Confidence falls when credit is unknown, income is non-salaried, expenses are unknown, a bounce exists, or age is unknown.

Unknown is never treated as zero. Unknown credit stays unknown and widens the rate band. Unknown expenses use the visible maintenance floor and lower confidence.

## Three challenge borrowers

### Priya

- ₹1.10L net salary, ₹14k existing EMI, credit score 780.
- ₹8L wedding request.
- Challenge gives ₹28k rent. Rent is counted separately, and a known maintenance input below ₹7,500 is raised to the protective floor.
- With zero maintenance entered, safe new EMI is `max(0, ₹44k - ₹14k - ₹28k - ₹7.5k) = ₹0`.
- The practical amount is therefore far below the ₹8L request.
- Verdict: DON'T BORROW.

### Ravi

- ₹40k–₹80k cash income, ₹4.2L ITR income.
- Wife earns ₹18k/month.
- ₹0 existing EMI, unknown credit, ₹45L unencumbered shop.
- ₹15L business request.
- Documented ITR income is used as ₹35k/month; the operating cash range is not added on top.
- Wife's ₹18k is added only to borrower-safe household capacity.
- Unknown household expenses use the disclosed ₹7,500 maintenance floor rather than zero.
- Lender-side capacity remains based on Ravi's documented income.
- Secured route and ₹22.5L collateral cap apply.
- Verdict: BORROW LESS.

### Anita

- ₹26k–₹30k variable income, ₹1,050 existing EMI.
- Unknown credit, one recent bounce, high-cost app debt.
- ₹1.5L vehicle request.
- Unknown household expenses use the disclosed proxy rather than zero.
- The recent bounce and high-cost debt trigger the debt-risk guard; they are not stacked into an extreme fair-rate claim.
- Verdict: DON'T BORROW.

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

Changing `safeFoir` from 40% to 35% changes borrower-safe EMI and amount but not lender-side capacity. Changing `lenderFoir` changes lender-side capacity. Changing `processingFee` changes APR. Changing `stressIncomeDrop` changes the stress result. Changing `unknownExpenseRatio` changes only cases where expenses are unknown. Changing `fairRateCapBuffer` changes the negotiation benchmark without changing the borrowing verdict.
