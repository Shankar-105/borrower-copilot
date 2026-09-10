# Borrower Copilot — Rules

This is a borrower self-assessment, not a lender approval model. The goal is that every important number can be traced to an answer. The challenge asks for a self-assessment with lender-side capacity, borrower-safe capacity, fair-rate band, EMI ceiling/stress, adaptive questions, honest uncertainty and a usable Negotiation Card.

## Main rules

| What | Value | Why | Source |
|---|---:|---|---|
| Lender-side FOIR | 50% | Prototype estimate of total EMI a lender may size | My judgement |
| Borrower-safe FOIR | 40% | Keeps a buffer below lender-side capacity | My judgement |
| Processing fee | 2% | Lets the app show an all-in APR estimate | My judgement |
| Stress income drop | 15% | Tests a lower-income month | My judgement |
| Stress rate increase | 2 pp | Tests a higher-rate case for the secured/LAP route | My judgement |
| Stress expense reduction | 10% | Allows limited variable-spend adjustment under stress without pretending all expenses disappear | My judgement |
| Minimum maintenance floor | ₹7,500/month | Unknown or implausibly low maintenance is never treated as ₹0; rent is counted separately | My judgement |
| Fair-rate cap buffer | +1 pp over route base maximum | A borrower negotiation benchmark should not become a lender worst-case price; adverse risk is surfaced separately | My judgement |
| Tenure | 12–84 months | Keeps the prototype in a normal range | My judgement |
| Default tenure | 48 months | Gives the form a starting planning tenure | My judgement |
| Age limit | 60 years | Limits repayment horizon in this prototype | My judgement |
| Secured LTV cap | 50% | Collateral is an upper cap, not a replacement for income affordability | My judgement |
| Variable income | Low + 35% of range | Does not treat the best month as normal income | My judgement |
| Self-employed income source | Documented annual income / 12 when available; otherwise low + 35% of range | Uses one income basis and prevents ITR income and operating cash from being double-counted | My judgement |

The FOIR, LTV, fee, rate bands and stress values are prototype assumptions. They are not universal RBI rules or lender promises.

## Questions

The form is adaptive. The core questions are purpose, loan type, amount, income and type, existing EMIs, housing, household expenses and age. Conditional questions appear for self-employed/business borrowers, and risk/product questions are additional because they move decision, route, amount, rate or confidence.

The current must-set is small enough to produce the four outputs: purpose, loan type, requested amount, income type and income, existing EMI, housing/rent, household-expense status/value, and age. Credit score, documented ITR income, other household income, collateral, recent bounce, high-cost debt and tenure are additional questions. A renter must provide a positive rent value before the result can be opened.

Each additional question must change an output. Other household income changes safe household capacity; expenses change safe EMI capacity; collateral changes route/collateral cap; risk answers change the decision/confidence; tenure changes EMI/APR/safe amount; income documentation changes normalization; credit changes the rate band and confidence.

## Household income

The challenge explicitly gives Ravi a wife's income of ₹18,000/month. The app captures this as **other household income you expect to rely on** for non-salaried borrowers.

This income is used for the **borrower-safe household calculation**, because it can affect the household's ability to carry an EMI. It is **not** added to lender-side sanction capacity because the app has not established that the spouse is a co-applicant or that the lender will count that income.

This is intentionally different from silently assuming the spouse is a co-borrower.

## Income normalization

### Salaried

`normalized income = net monthly salary`

### Self-employed

If documented annual income is available:

`normalized income = documented annual income / 12`

Operating cash is not added on top.

Otherwise:

`normalized income = low + 35% × (high - low)`

### Variable/informal

`normalized income = low + 35% × (high - low)`

## Affordability

Let `I` be normalized borrower income, `H` be other household income, `E` be existing monthly EMIs, and `X` be monthly general household expenses excluding rent and EMIs.

Lender-side capacity uses only borrower income:

`lenderTotal = I × 50%`

`lenderAvailable = max(0, lenderTotal - E)`

Borrower-safe household capacity can use both incomes:

`householdIncome = I + H`

`safeTotal = householdIncome × 40%`

If the borrower rents, rent must be supplied as a positive value. Owned homes use `rent = ₹0`. A missing renter rent value blocks borrower-safe capacity rather than being treated as free housing.

If household expenses are known:

`knownExpenses = max(entered expenses, ₹7,500)`

`safeAvailable = max(0, safeTotal - E - rent - knownExpenses)`

If household expenses are unknown:

`assumedExpenses = rent + ₹7,500`

`safeAvailable = max(0, safeTotal - E - assumedExpenses)`

Unknown expenses therefore do **not** become zero. A disclosed ₹7,500 maintenance floor is used and confidence is lowered.

The UI asks for **monthly general maintenance, excluding rent and EMIs**, so rent and general household costs are kept separate in the calculation.

### Priya example

For Priya's prefilled challenge run, the app sets rent to ₹28,000 and the known general-maintenance input to ₹0. Because known expenses are protected by the ₹7,500 floor:

`₹1,10,000 × 40% = ₹44,000 safe FOIR ceiling`

`₹44,000 - ₹14,000 existing EMI - ₹28,000 rent - ₹7,500 maintenance floor = negative`

So her safe new EMI is `₹0` and the borrower-safe amount is `₹0`. This is intentionally more conservative than treating the challenge's rent as her entire household spending.

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
- **Borrower-safe amount**: what the household can safely carry under the safe FOIR/expense rules and, for secured/LAP routes, the collateral cap.

`practicalAmount = min(lenderAmount, safeAmount)`

The Negotiation Card uses the practical amount as its recommended amount when borrowing is possible. When the safe amount is zero, the card instead labels it as a safe amount to revisit later.

The displayed EMI ceiling corresponds to the practical amount. If collateral caps the principal below the income-derived safe amount, the recommended EMI is recalculated from that practical principal rather than displaying unused safe headroom.

## Product routing

- Business purpose + supplied property → LAP / secured business route.
- Business purpose without a secured route → business loan.
- Vehicle purpose → two-wheeler loan.
- Otherwise → personal loan.

Ravi is routed to a secured business/LAP route. The ₹45L property produces a ₹22.5L collateral cap, but income affordability is lower, so collateral does not justify a ₹15L recommendation.

The unsecured `business` route remains reachable when a business borrower supplies no collateral. This avoids a dead product tier while preserving the challenge's secured-Ravi case.

## Decision

1. `DON'T BORROW` if safe monthly capacity is zero.
2. `DON'T BORROW` if high-cost debt and a recent bounce are both present, unless the purpose/route is recognized as a productive vehicle or business/secured-business use.
3. `BORROW LESS` if the request is above the practical amount.
4. Otherwise `BORROW`.

For the productive vehicle/business case with severe debt risk, the current model still returns `BORROW LESS` rather than `DON'T BORROW`, while explaining that the debt profile is high risk. This is a deliberate prototype judgement and should be defended in the follow-up.

The stress case is shown separately. A failed stress case does not automatically change the base verdict because it is a resilience check; the borrower can see the failed buffer without the model pretending that stress is a new underwriting decision.

## Stress

- Borrower income falls by 15%.
- For the secured/LAP route, the stress rate rises by 2 percentage points above the rate maximum. Other routes keep the selected fixed-rate assumption rather than assuming a contractual rate rise.
- Requested EMI is compared with stressed safe monthly room.
- Other household income remains as separately supplied rather than being silently stress-reduced.
- Known or assumed household expenses are reduced by 10% under stress to represent limited variable-spend adjustment.
- The ₹7,500 maintenance floor is also reduced by 10% under stress.

## APR

The prototype assumes a 2% processing fee. It calculates APR from net disbursal after the fee while EMI is still based on the full principal. A numerical bisection solve is used instead of simply adding the fee percentage to the interest rate.

APR is calculated on the **borrower-safe amount**, not on the lender-side amount. This keeps the displayed APR tied to the conservative planning benchmark shown to the borrower. The practical amount and Negotiation Card may be lower than the safe amount when lender-side capacity or collateral caps it.

If the borrower-safe amount is zero, APR is shown as zero rather than inventing a benchmark for a loan the borrower should not take.

This is an illustrative APR for the fee model in this prototype, not a full lender KFS. The app does not know every possible charge or lender-specific APR convention.

## Confidence and unknowns

Confidence falls when credit is unknown, income is non-salaried, expenses are unknown, a bounce exists, or age is unknown. The rate object also exposes a separate rate confidence based on credit/risk information.

Unknown is never treated as zero. Unknown credit stays unknown and widens the rate band. Unknown expenses use the visible maintenance floor and lower confidence.

## Three challenge borrowers

### Priya

- ₹1.10L net salary, ₹14k existing EMI, credit score 780.
- ₹8L wedding request.
- Challenge gives ₹28k rent. The prefilled run also has ₹0 general-maintenance input, which is raised to the protective ₹7,500 floor.
- `₹44k safe FOIR - ₹14k EMI - ₹28k rent - ₹7.5k floor` leaves no safe new EMI.
- Borrower-safe amount: **₹0**.
- Lender-side estimate: **about ₹15.3L**.
- Verdict: **DON'T BORROW**.

### Ravi

- ₹40k–₹80k cash income, ₹4.2L ITR income.
- Wife earns ₹18k/month.
- ₹0 existing EMI, unknown credit, ₹45L unencumbered shop.
- ₹15L business request.
- Documented ITR income is used as ₹35k/month; the operating cash range is not added on top.
- Wife's ₹18k is added only to borrower-safe household capacity.
- Unknown household expenses use the disclosed ₹7,500 maintenance floor rather than zero.
- Lender-side estimate: **about ₹7.7L** at the current secured-route rate midpoint.
- Borrower-safe amount: **about ₹6.0L**.
- Secured route and ₹22.5L collateral cap apply.
- Verdict: **BORROW LESS**.

### Anita

- ₹26k–₹30k variable income, ₹1,050 existing EMI.
- Unknown credit, one recent bounce, high-cost app debt.
- ₹1.5L vehicle request.
- Unknown household expenses use the disclosed ₹7,500 maintenance floor rather than zero.
- Borrower-safe mathematical amount: **about ₹0.68L**.
- The recent bounce and high-cost debt trigger the debt-risk guard; they are not stacked into an extreme fair-rate claim.
- Verdict: **BORROW LESS** in the current implementation because the vehicle route is treated as productive even with the severe-debt guard. This is a notable product judgement, not a challenge-mandated fact.

## What this prototype does not know

- Bureau data
- Actual lender underwriting
- Lender-specific FOIR rules
- Verified household expenses
- Whether another household earner is a formal co-applicant
- Actual collateral/title valuation
- Exact lender rate cards and KFS charges
- Whether Anita's electric scooter would actually increase delivery income enough to justify new borrowing

Those are limitations, not numbers the prototype should invent.

## Live rule change

Changing `safeFoir` from 40% to 35% changes borrower-safe EMI and amount but not lender-side capacity. Changing `lenderFoir` changes lender-side capacity. Changing `processingFee` changes APR. Changing `stressIncomeDrop` changes the stress result. Changing `stressExpenseReduction` changes stressed expense room. Changing `minimumExpenseFloor` changes known-low and unknown-expense cases. Changing `variableIncomeShare` changes variable/self-employed range normalization. Changing `fairRateCapBuffer` would change the intended negotiation benchmark, but the current `rateBand` implementation does not yet apply a separate cap-buffer constant; its cap is hard-coded to the base maximum plus 1 pp. This is an implementation/documentation gap to fix before submission.
