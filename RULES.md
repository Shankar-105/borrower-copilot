# Borrower Copilot — Rules

This is a borrower self-assessment, not a lender approval model. Every important number should be traceable to an answer and a visible prototype rule. The form blocks the assessment until all visible must questions have an answer; blank numeric inputs remain unknown rather than becoming zero.

## Central assumptions

| What | Value | Why | Source |
|---|---:|---|---|
| Lender FOIR | 50% | Approximate institutional affordability ceiling | My judgement |
| Borrower-safe FOIR | 40% | Leaves a buffer below the lender-side ceiling | My judgement |
| Household expenses | Required monthly amount excluding rent and EMIs | Prevents owned housing from being treated as zero living cost | Borrower answer; used by this prototype |
| Processing fee | 2% | Illustrative fee for the APR estimate | My judgement |
| Stress income drop | 15% | Simple resilience scenario | My judgement |
| LAP stress rate increase | 2 percentage points | Illustrative secured-rate stress | My judgement |
| Tenure | 12–84 months; default 48 | Keeps the prototype within common retail planning ranges | My judgement |
| Retirement age | 60 | Caps assumed repayment horizon | My judgement |
| Secured LTV cap | 50% | Conservative planning cap, not universal regulation | My judgement |
| Variable income normalization | Low + 35% of range | Avoids treating peak months as normal income | My judgement |

These are not universal RBI rules or lender promises.

## Adaptive questions

Must questions: purpose, loan type, requested amount, income type, income, existing EMI, household expenses excluding rent and EMIs, housing type, age, rent when housing is rented, and preferred tenure. A renter must enter a positive rent amount; an owned home uses zero rent because the borrower explicitly selected ownership. A zero existing EMI is allowed as an explicit answer; an empty field is not.

Additional questions: documented ITR income for self-employed borrowers, optional other household income, and credit score. Each additional field changes safe capacity, route, rate, decision, confidence, or EMI/APR.

## Income normalization

Salaried borrowers use net monthly income.

For self-employed borrowers, documented income takes precedence:

`normalizedIncome = documentedAnnualIncome / 12`

If documented income is unavailable, or for variable/informal income:

`normalizedIncome = low + 35% × (high - low)`

The documented base is not added to the range base. This avoids double-counting the same operating income.

## Affordability

Let `I` be normalized borrower income, `H` be optional other household income, `E` be existing EMI, `R` be rent, and `X` be monthly household expenses excluding rent and EMIs.

Lender-side capacity deliberately uses only the borrower:

`lenderTotal = I × 50%`

`lenderAvailable = max(0, lenderTotal - E)`

Borrower-safe capacity uses household income and the requested household outgoings:

`householdIncome = I + H`

`safeTotal = householdIncome × 40%`

`safeAvailable = max(0, safeTotal - E - R - X)`

Other household income is optional and appears in additional questions. It is never added to lender capacity. Rent is counted only when housing type is `rent`; a missing renter rent sets safe capacity to zero rather than silently treating rent as free. `X` is required so an owned home is not treated as zero living cost.

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

Recent bounce and high-cost debt are **risk flags**, not stacked fair-rate penalties. They remain visible and can trigger the `DON'T BORROW` guard. The rate band remains a negotiation benchmark; severe debt risk is handled in the borrowing decision rather than being used to make a punitive quote look fair.

## Amounts and decisions

The app keeps the two required O2 numbers:

- **Lender-side capacity**: what the prototype estimates a lender may size.
- **Borrower-safe amount**: what the household can safely carry under the safe FOIR and stated rent/EMI rules.

For secured/LAP routes, lender-side capacity also respects the collateral LTV cap.

`absoluteFeasibleCeiling = min(lenderAmount, safeAmount)`

This is the single conservative maximum planning principal. The recommended/practical amount is the lower of the request and this ceiling:

`targetPrincipal = min(requestedAmount, absoluteFeasibleCeiling)`

The displayed recommended EMI is calculated from `targetPrincipal`.

The borrower should use the borrower-safe/absolute-feasible side, not the lender-side estimate, when deciding what they can actually carry.

If the verdict is `DON'T BORROW`, the app deliberately presents **₹0 as the amount to borrow now** in the live preview and Negotiation Card. The positive borrower-safe amount remains visible only as a mathematical capacity check, so it cannot be mistaken for permission to borrow while the stop condition applies.

## Product routing

- Business purpose + supplied property → LAP / secured business route.
- Business purpose without a secured route → business loan.
- Vehicle purpose → two-wheeler loan.
- Otherwise → personal loan.

Ravi is routed to a secured business/LAP route. The ₹45L property produces a ₹22.5L collateral cap, but income affordability is lower, so collateral does not justify a ₹15L recommendation.

The unsecured `business` route remains reachable when a business borrower supplies no collateral. This avoids a dead product tier while preserving the challenge's secured-Ravi case.

## Decision

1. `DON'T BORROW` if safe monthly capacity is zero.
2. `DON'T BORROW` if high-cost debt and a recent bounce are both present.
3. `BORROW LESS` if the request is above the absolute feasible ceiling.
4. Otherwise `BORROW`.

For Anita, the high-cost debt plus recent bounce therefore produces **DON'T BORROW**. There is no productive-purpose exception.

The stress case is shown separately and explicitly says when the requested EMI exceeds stressed room. A failed stress case does not automatically change the base verdict because it is a resilience check, but the borrower is told not to accept the requested amount without changing the plan.

## Stress

- Borrower income falls by 15%.
- For the secured/LAP route, the stress rate rises by 2 percentage points above the rate maximum. Other routes keep the selected fixed-rate assumption rather than assuming a contractual rate rise.
- Requested EMI is compared with stressed safe monthly room.
- Other household income remains as separately supplied rather than being silently stress-reduced.
- Rent, household expenses and existing EMI remain unchanged under stress.

## APR

The prototype assumes a 2% processing fee. It calculates APR from net disbursal after the fee while EMI is still based on the full principal. A numerical bisection solve is used instead of simply adding the fee percentage to the interest rate.

APR is calculated **only on the absolute feasible ceiling**. This keeps the APR, processing fee and maximum planning principal on the same basis as the conservative ceiling:

`APR principal = absoluteFeasibleCeiling`

If the absolute feasible ceiling is zero, APR is marked unavailable rather than shown as a comparable zero-rate benchmark for a loan the borrower should not take.

This is an illustrative APR for the fee model in this prototype, not a full lender KFS. The app does not know every possible charge or lender-specific APR convention.

## Confidence and unknowns

Confidence falls when credit is unknown, income is non-salaried, a bounce exists, or age is unknown. A missing renter rent value is called out. The rate object also exposes a separate rate confidence based on credit/risk information.

Unknown is never silently converted into a favourable zero. Unknown credit stays unknown and widens the rate band. Missing required must inputs block the assessment; missing renter rent blocks the safe calculation until it is supplied.

## What this prototype does not know

- Bureau data
- Actual lender underwriting
- Lender-specific FOIR rules
- Exact household expenses beyond the monthly amount supplied by the borrower
- Whether another household earner is a formal co-applicant
- Actual collateral/title valuation
- Exact lender rate cards and KFS charges; the card compares a nominal quote to the benchmark, while the displayed APR remains illustrative for the prototype ceiling
- Whether the requested loan is affordable under facts not supplied by the borrower

Those are limitations, not numbers the prototype should invent.
