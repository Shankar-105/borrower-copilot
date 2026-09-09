# Borrower Copilot — Rules & Assumptions

## What this file is

Borrower Copilot is a local, illustrative borrower self-assessment tool. It is **not** a lender underwriting engine and it does not predict an actual lender approval.

The application turns the information a borrower provides into four planning outputs:

1. **Borrow / Borrow Less / Don't Borrow**
2. **Estimated lender-side capacity vs borrower-safe amount**
3. **Illustrative fair interest-rate band and all-in APR estimate**
4. **Borrower EMI ceiling and stress case**

The implementation intentionally keeps the domain logic in `src/domain/rules.js`, separate from React UI code.

> **Important:** Values marked **My judgement** are prototype assumptions used to make the challenge executable. They are not universal lender rules or RBI-mandated thresholds.

---

## 1. Core assumptions

| What | Value | Why | Source |
|---|---:|---|---|
| Lender-side FOIR ceiling | 50% of normalized monthly income | Provides a simple illustrative estimate of how much total monthly EMI a lender might consider supportable | My judgement |
| Borrower-safe FOIR ceiling | 40% of normalized monthly income | Keeps the borrower's recommended burden below the illustrative lender-side ceiling | My judgement |
| Processing fee | 2% of principal | Allows the app to demonstrate why all-in borrowing cost can exceed the quoted interest rate | My judgement |
| Emergency-reserve target | 6 months | Used as the prototype resilience target | My judgement |
| Stress income drop | 15% | Tests whether the requested EMI still fits after a moderate income shock | My judgement |
| Stress interest-rate increase | 2 percentage points | Tests payment resilience under a higher-rate scenario | My judgement |
| Default tenure | 48 months | Sensible prototype default for consumer borrowing | My judgement |
| Minimum tenure | 12 months | Prevents unrealistic short repayment periods in the prototype | My judgement |
| Maximum tenure | 84 months | Prevents unrealistic long repayment periods in the prototype | My judgement |
| Secured LTV cap | 50% of supplied collateral value | Conservative prototype cap so collateral does not become a claim to borrow 100% of asset value | My judgement |
| Variable-income normalization share | Lower bound + 35% of income range | Avoids treating a best month as normal income | My judgement |
| Self-employed cash-income treatment | Documented annual income is preferred; if absent, cash input is reduced to 70% | Makes undocumented income less influential than documented income | My judgement |
| Credit score strong threshold | 750+ | Simple prototype pricing segmentation | My judgement |
| Credit score moderate threshold | 700–749 | Simple prototype pricing segmentation | My judgement |
| Credit score weaker threshold | Below 700 | Simple prototype pricing segmentation | My judgement |

---

## 2. Rate reference bands

These are **illustrative market-reference bands**, not promises of what any lender will offer.

| Product route | Base rate band | Why | Source |
|---|---:|---|---|
| Personal loan | 11%–18% | Prototype unsecured personal-loan starting band | My judgement |
| Business loan | 12%–20% | Prototype business-finance band | My judgement |
| Loan against property / secured business route | 10%–14% | Lower illustrative band because the route is secured | My judgement |
| Two-wheeler loan | 11%–19% | Prototype vehicle-finance band | My judgement |
| Gold loan | 9%–16% | Reserved for a future route; not currently selected by the routing logic | My judgement |
| Home loan | 8%–11% | Reserved for a future route; not currently selected by the routing logic | My judgement |

The current challenge flows do not route borrowers to the home or gold entries. They remain in the rate table as reserved product references rather than active paths.

---

## 3. Income normalization

### Salaried

Use the supplied net monthly salary at 100%.

**Reason:** the prototype treats recurring documented salary as the most predictable income input.

### Self-employed

If documented annual income exists:

`normalized monthly income = documented annual income / 12`

If documented income is unavailable:

`normalized monthly income = supplied cash income × 70%`

The prototype intentionally prefers documented income over a larger cash-income claim.

### Variable / informal income

For a supplied range:

`normalized income = low + 35% × (high - low)`

This is deliberately conservative. It does **not** use the midpoint and does not use the highest month.

---

## 4. Affordability

Let:

- `I` = normalized monthly income
- `E` = existing monthly EMI

Then:

`lenderTotal = I × 50%`

`safeTotal = I × 40%`

Existing EMI is consumed first:

`lenderAvailable = max(0, lenderTotal - E)`

`safeAvailable = max(0, safeTotal - E)`

The application therefore produces two different monthly capacities.

### Why two capacities?

The challenge specifically asks for the difference between what a lender might size and what the borrower can safely carry. The borrower-safe figure is the recommendation; the lender-side figure is shown as context.

---

## 5. EMI formula

The application uses the standard reducing-balance EMI formula.

`EMI = P × r × (1+r)^n / ((1+r)^n - 1)`

Where:

- `P` = principal
- `r` = monthly interest rate
- `n` = number of monthly payments

Annual percentage rate is converted to a monthly decimal rate with:

`r = annualRate / 100 / 12`

For zero interest:

`EMI = P / n`

---

## 6. Reverse EMI → maximum principal

To find the largest principal supported by a monthly EMI ceiling:

`P = EMI × (1 - (1+r)^(-n)) / r`

For zero interest:

`P = EMI × n`

This is why the same monthly headroom can support different loan amounts at different tenures.

Longer tenure generally allows a larger principal for the same monthly payment, while increasing the total interest paid.

---

## 7. Lender-side amount vs borrower-safe amount

The engine first calculates a rate band and uses its midpoint:

`averageRate = (rateMin + rateMax) / 2`

It then converts the two monthly capacities into two principal amounts:

`lenderAmount = maximumPrincipal(lenderAvailable, averageRate, tenure)`

`safeAmount = maximumPrincipal(safeAvailable, averageRate, tenure)`

The lender-side amount is therefore an **estimate**, not an actual lender sanction.

The borrower-safe amount is the number the borrower should use for planning.

---

## 8. Product routing

The current active routing rules are intentionally small because the challenge is scored on the three supplied borrowers, not on building every possible Indian loan product.

### Secured business/LAP route

If:

- collateral value is greater than zero, AND
- purpose is business OR income type is self-employed

then route to:

**Loan against property / business loan**

Reason: productive borrowing plus supplied unencumbered collateral makes a secured business route more sensible than an unsecured personal loan in the prototype.

### Two-wheeler route

If purpose is `vehicle`:

**Two-wheeler loan**

### Default

Everything else:

**Personal loan**

### Why not home or gold loan?

The questionnaire and routing logic do not collect the information required to make those routes meaningful for the challenge's three cases. Gold lending would require physical-asset details such as purity/weight and appraisal; home lending would require a materially different property-purchase workflow. The current challenge cases do not require either route.

The `RATE_BASE` table contains those bands as reserved references, but the current `productRoute()` never selects them.

---

## 9. Credit-score adjustment

The engine converts the supplied score into a pricing adjustment rather than treating a score as a final approval decision.

| Condition | Adjustment | Meaning |
|---|---:|---|
| Score >= 750 | -1.5 percentage points | Strong stated score |
| 700–749 | 0 points | Moderate stated score |
| Below 700 | +2.5 points | Weaker stated score |
| Score unknown | +2 points | Uncertainty is priced conservatively |

**Unknown is not zero.**

An unknown credit score does not become 300, 0, or a fabricated score. Instead the model widens/raises the illustrative rate band and lowers confidence.

---

## 10. Rate-band adjustments

The rate engine starts with the selected product's base band and applies adjustments.

| Rule | Effect on minimum | Effect on maximum | Why |
|---|---:|---:|---|
| Credit adjustment | As above | As above | Reflects stated credit-profile uncertainty/risk |
| Income is not salaried | +1 pp | +1 pp | Prototype adjustment for variable/partly undocumented income |
| Recent bounced EMI | +2 pp | +3 pp | Reflects recent repayment stress |
| High-cost debt | +1 pp | +2 pp | Reflects existing expensive debt |
| Credit score unknown | +0 pp | +1 pp additional | Widens the band because pricing uncertainty remains |

The output is always a range.

The system does not claim to know the exact lender quote.

---

## 11. Why average rate is used for loan-capacity calculations

The rate engine intentionally returns a range, for example:

`13%–18%`

The application still needs one rate to convert monthly EMI capacity into a principal amount. It therefore uses:

`averageRate = (minimum + maximum) / 2`

This is a **planning simplification**, not a prediction that the lender will offer the exact midpoint.

The rate range itself remains visible to the borrower.

---

## 12. Collateral cap

For the secured/LAP route:

`collateralCap = collateralValue × 50%`

Then:

`safeAmount = min(safeAmountFromEMI, collateralCap)`

This prevents the affordability calculation from producing a secured-loan recommendation above the prototype's collateral cap.

For non-LAP routes, collateral does not cap the amount.

The 50% LTV is a prototype judgement, not a universal lender or regulatory requirement.

---

## 13. Borrow / Borrow Less / Don't Borrow

The engine has three possible decisions.

### DON'T BORROW

Triggered when either:

1. `highCostDebt && recentBounce`
2. `safeAvailable <= 0`

The first is a deliberately strong debt-stress guard: expensive existing debt plus a recent repayment failure means additional borrowing can deepen the problem.

### BORROW LESS

If the severe-debt/no-capacity conditions do not fire, the engine checks:

`requestedAmount > safeAmount × 1.2`

If true, it recommends **BORROW LESS**.

### BORROW

Otherwise it recommends **BORROW**.

This means the prototype intentionally allows a request somewhat above the safe amount before switching to the stronger `BORROW LESS` state. This is a product-policy choice and can be changed in one place.

---

## 14. Stress case

The stress scenario reduces normalized income by 15%:

`stressIncome = normalizedIncome × 85%`

It recalculates safe monthly EMI room using the same affordability rules.

It also increases the maximum rate by 2 percentage points:

`stressRate = rateMax + 2 percentage points`

The requested loan's EMI is recalculated at that stressed rate.

The stress result is:

`survives = stressedRequestedEMI <= stressedSafeAvailable`

This is not a prediction of future rates or income. It is a resilience check.

---

## 15. APR calculation

The prototype assumes a 2% upfront processing fee.

For principal `P`:

`fee = P × 2%`

`netDisbursal = P - fee`

The borrower still repays EMI calculated on the full principal `P`.

Because the borrower receives less cash than the principal used to calculate EMI, the effective annualized cost is higher than the quoted interest rate.

The engine solves for the monthly effective rate using bisection:

`netDisbursal = EMI × (1 - (1+r)^(-n)) / r`

Then annualizes:

`APR = ((1+r)^12 - 1) × 100`

### Why bisection?

APR is not obtained by simply adding `2%` to the quoted annual interest rate. The fee changes the effective amount received at the start while the repayment schedule remains based on the full principal. Solving the cash-flow equation gives the effective monthly rate; bisection is a simple, deterministic numerical method for finding that rate.

The solver runs 80 iterations, which is more than enough for this small calculation.

---

## 16. Confidence

The final confidence score starts at 3.

| Condition | Score change |
|---|---:|
| Credit score unknown | -1 |
| Income is not salaried | -1 |
| Household expenses not known | -1 |
| Recent bounced payment | -1 |

Mapping:

- `3+` → High
- `2` → Medium
- below `2` → Low

The score is an indicator of how much the application trusts the supplied information. It is not a probability of loan approval.

---

## 17. Fields intentionally not used in the current calculation

These fields exist in the current implementation but are not active inputs to every calculation.

| Field | Current status | Why |
|---|---|---|
| `projectedIncomeCredit` | Defined but unused | Reserved for a future rule that could apply a haircut to projected/unverified income. None of the three challenge cases requires projected income. |
| `emergencyTargetMonths` | Defined but not used in the final calculation | The prototype captures `emergencyMonths` in sample data but currently uses neither to change the decision nor rate. |
| `expenseBuffer` | Calculated but not used downstream | Kept as a useful affordability diagnostic, but the current decision model uses FOIR and existing EMI instead. |
| `emergencyMonths` | Present in samples but unused | The challenge mentions emergency savings as a possible additional question; this V1 does not yet make it move an output. |
| `home` rate band | Defined but not routed | No home-buying workflow exists in the current questionnaire. |
| `gold` rate band | Defined but not routed | No physical gold/appraisal workflow exists in the current questionnaire. |

These are not hidden rules. They are explicitly identified as unused/reserved so that reviewers can see the boundary of the current model.

---

## 18. Challenge-specific reasoning

### Priya

- Salaried income is treated as fully documented.
- Credit score 780 receives the strong-score adjustment.
- No recent bounce or high-cost debt adjustment.
- Wedding purpose routes to personal loan.
- Her lender-side capacity is higher than her borrower-safe capacity.
- Her ₹8L request is below her calculated safe amount in the current model, so the decision is `BORROW`.

### Ravi

- Documented annual income of ₹4.2L becomes ₹35,000/month normalized income.
- Cash income is not allowed to dominate because documented income exists.
- Unknown credit score adds a conservative rate adjustment and lowers confidence.
- Business purpose + collateral routes him to the secured LAP/business route.
- The 50% collateral cap is applied, although in this case the EMI-derived safe amount is lower than the collateral cap.
- His ₹15L request is materially above his borrower-safe amount, so the decision is `BORROW LESS`.

### Anita

- Variable income of ₹26K–₹30K is normalized to ₹27,400/month.
- Unknown credit score widens the rate band.
- Variable income adds a rate adjustment.
- Recent bounce adds a significant rate adjustment.
- High-cost debt adds another rate adjustment.
- Vehicle purpose routes to a two-wheeler loan.
- The combination of high-cost debt + recent bounce triggers the hard `DON'T BORROW` guard.

---

## 19. Important limitations

This prototype does **not** know:

- a borrower's actual bureau report
- lender-specific underwriting policies
- lender-specific FOIR rules
- lender-specific rate cards
- actual eligibility criteria
- verified income
- verified expenses
- actual collateral valuation
- legal/title quality of collateral
- lender-specific processing fees
- insurance or other loan charges unless explicitly modeled
- actual lender KFS terms

Therefore, the numbers should be used as **planning benchmarks**, not approval promises.

The borrower should compare an actual lender quote and KFS against the app's illustrative range.

---

## 20. Change-one-number test

The model is intentionally centralized so an interviewer can change assumptions such as:

- lender FOIR 50% → 55%
- safe FOIR 40% → 35%
- processing fee 2% → 3%
- stress income drop 15% → 20%
- secured LTV 50% → 40%

The UI consumes the resulting calculation; it does not contain the financial formulas.

This separation is a deliberate engineering requirement of the challenge.
