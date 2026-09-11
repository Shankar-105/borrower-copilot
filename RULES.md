# Borrower Copilot — Rules

This is a borrower self-assessment, not a lender approval model. The app blocks the assessment until the visible must-answer questions are complete. Unknown information is not silently turned into a favourable zero.

## Central assumptions

| What | Value | Why | Source |
|---|---:|---|---|
| Lender FOIR | 50% | Approximate institutional affordability ceiling | My judgement |
| Borrower-safe FOIR | 40% | Leaves a buffer below the lender-side ceiling | My judgement |
| Processing fee | 2% | Illustrative fee used for APR | My judgement |
| Stress income drop | 15% | Simple resilience scenario | My judgement |
| LAP stress rate increase | 2 percentage points | Illustrative secured-rate stress | My judgement |
| Tenure | 12–84 months | Practical planning range | My judgement |
| Retirement age | 60 | Caps assumed repayment horizon | My judgement |
| Secured LTV cap | 50% | Conservative planning cap, not universal regulation | My judgement |
| Variable income normalization | Low + 35% of range | Avoids treating peak months as normal income | My judgement |
| Recent bounce rate add | +1.5 pp | Makes recent repayment risk visible in the benchmark | My judgement |
| High-cost debt rate add | +2 pp | Makes expensive existing debt visible in the benchmark | My judgement |

These are prototype judgements, not universal RBI rules or lender promises.

## Adaptive questions

### Must answer

- Purpose
- Loan type
- Requested amount
- Income type
- Monthly income for salaried borrowers **or** lower and higher monthly income for non-salaried borrowers
- Existing EMI
- Housing type
- Monthly rent when renting (zero is allowed, but the renter must explicitly answer the field)
- Age
- Preferred tenure

Tenure is a must because EMI, APR and the tenure trade-off cannot be calculated accurately without it. The form does not silently assume a default tenure.

### Additional

Additional questions adapt to the profile:

- Other household income — optional; used only in borrower-safe capacity, never lender-side capacity.
- Annual documented ITR income — shown only for self-employed borrowers.
- Collateral — shown only when self-employed, business-related, or LAP-related.
- Credit history status — distinguishes known score, unknown score, and no credit history.
- Credit score — shown and required only when the borrower says the score is known.
- Recent EMI bounce and high-cost debt — risk questions used for rate, decision and confidence.

Income fields switch with income type, and route-specific questions are skipped when they cannot affect the calculation.

## Income normalization

Salaried borrowers use net monthly income.

For self-employed borrowers, documented income takes precedence:

`normalizedIncome = documentedAnnualIncome / 12`

If documented income is unavailable, or for variable/informal income:

`normalizedIncome = low + 35% × (high - low)`

The documented base is not added to the range base.

## Affordability

Let `I` be normalized borrower income, `H` be optional other household income, `E` be existing EMI, and `R` be rent.

Lender-side capacity deliberately uses only the borrower:

`lenderTotal = I × 50%`

`lenderAvailable = max(0, lenderTotal - E)`

Borrower-safe capacity uses household income and stated rent:

`householdIncome = I + H`

`safeTotal = householdIncome × 40%`

`safeAvailable = max(0, safeTotal - E - R)`

There is **no household-maintenance-expense input** in the current product. Safety uses borrower income, optional other household income, existing EMI and rent only.

Other household income is optional. If it is not supplied, the safe calculation uses only the borrower's income and confidence reflects that uncertainty. It is never added to lender-side capacity.

For renters, rent must be explicitly answered, but **₹0 is valid**. Owned housing uses ₹0 rent because ownership was explicitly selected.

## Rate bands

| Route | Base band |
|---|---:|
| Personal | 11%–18% |
| Business | 12%–20% |
| LAP / secured business | 10%–14% |
| Two-wheeler | 11%–19% |

These are prototype planning bands, not lender quotes.

### Credit handling

The UI and rules distinguish:

- **Known score**: a score from 300–900 is supplied.
- **Unknown score**: the borrower does not know the score; no score value is accepted.
- **No credit history**: explicitly stated; no score value is accepted.

For unsecured routes:

| Condition | Minimum | Maximum | Why |
|---|---:|---:|---|
| Credit 750+ | -1.5 pp | -1.5 pp | Strong stated score |
| Credit 700–749 | 0 pp | 0 pp | Middle bucket |
| Credit below 700 | +2.5 pp | +2.5 pp | Weaker stated score |
| Credit unknown | +2 pp | +3 pp | Unknown credit widens the range |
| No credit history | +2.5 pp | +2.5 pp | No established credit history |
| Non-salaried income | +1 pp | +1 pp | More income uncertainty |

For LAP/secured business routes, unknown/no-credit status does not add a separate credit penalty because collateral already changes the route; the status still lowers confidence.

Risk flags also move the benchmark:

- Recent bounced payment: +1.5 pp.
- High-cost debt above 24%: +2 pp.

These flags can also affect the borrowing verdict; they are not hidden from the rate benchmark.

## Amounts and decisions

The app keeps two capacity numbers:

- **Lender-side capacity**: what the prototype estimates a lender may size.
- **Borrower-safe amount**: what the borrower can conservatively carry.

For secured/LAP routes, lender-side capacity also respects the collateral LTV cap.

`absoluteFeasibleCeiling = min(lenderAmount, safeAmount)`

`targetPrincipal = min(requestedAmount, absoluteFeasibleCeiling)`

Recommended EMI is calculated from `targetPrincipal` at the midpoint of the illustrative rate band.

The borrower should use the borrower-safe/absolute-feasible side, not the lender-side estimate, when deciding what to carry.

If the verdict is `DON'T BORROW`, the UI shows **₹0 as the amount to borrow now**. A positive mathematical safe ceiling remains a capacity check only.

## Product routing

- Business purpose + supplied collateral → LAP / secured business route.
- Business purpose without collateral → business loan.
- Vehicle purpose → two-wheeler loan.
- Otherwise → personal loan.

Ravi is routed to secured business/LAP. His ₹45L property gives a ₹22.5L collateral cap, but income affordability is lower.

## Decision

1. `DON'T BORROW` if borrower-safe monthly capacity is zero.
2. `DON'T BORROW` if high-cost debt and a recent bounce are both present.
3. `BORROW LESS` if the request is above the absolute feasible ceiling.
4. Otherwise `BORROW`.

The stress result does **not** change the base verdict. It is a separate resilience check.

For Anita, high-cost debt plus a recent bounce produces `DON'T BORROW`. There is no productive-purpose exception.

## Stress

- Normalized borrower income falls by 15%.
- Other household income stays as separately supplied.
- Rent and existing EMI stay unchanged.
- LAP tests a 2 percentage-point rate increase above the rate maximum.
- Other routes do not assume a contractual rate increase.
- The planned principal is compared with stressed safe monthly room.
- Stress is informational and does not automatically change the borrowing verdict.

## APR

The prototype assumes a 2% processing fee. APR is estimated from net disbursal after the fee while EMI is based on the full principal. A numerical bisection solve is used.

APR is calculated **only on the absolute feasible ceiling**:

`APR principal = absoluteFeasibleCeiling`

If there is no feasible principal, APR is unavailable.

The APR is illustrative, not a full lender KFS. Actual documentation charges, stamp duty, insurance, fee caps and lender-specific conventions are not known.

## Confidence and unknowns

Confidence falls for meaningful uncertainty or risk, including unknown/no-credit status, non-salaried income, missing self-employed documented income, missing optional other household income, recent bounce, high-cost debt, incomplete inputs, and collateral-backed non-salaried uncertainty.

The rate object separately reports rate confidence. Unknown information is never silently converted into a favourable zero.

## Validation

The domain validates:

- positive requested amount
- salaried monthly income or a valid non-salaried income range
- non-negative existing EMI
- age 18–80
- required tenure within 12–84 months
- valid housing type
- renter rent when unanswered; zero is valid
- non-negative optional income/collateral values
- credit status consistency
- credit score only when status is `known`, within 300–900

Invalid required inputs keep the result in `INCOMPLETE` and the UI keeps the assessment button disabled.

## What this prototype does not know

- Bureau data
- Actual lender underwriting
- Lender-specific FOIR rules
- Formal co-applicant treatment of other household income
- Actual collateral/title valuation
- Exact lender rate cards and KFS charges
- Facts not supplied by the borrower

Those are limitations, not numbers the prototype should invent.
