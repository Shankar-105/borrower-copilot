# Borrower Copilot — Rules

This file explains the rules used by the app. The goal is to make each number easy to trace to an answer.

This is a borrower self-assessment. It is not a lender approval model.

## 1. Main assumptions

| What | Value | Why | Source |
|---|---:|---|---|
| Lender-side FOIR | 50% | Gives an estimate of total EMI a lender may size for | My judgement |
| Borrower-safe FOIR | 40% | Leaves more room below the lender-side estimate | My judgement |
| Processing fee | 2% of principal | Lets the app show the difference between rate and all-in cost | My judgement |
| Stress income drop | 15% | Tests a lower-income month | My judgement |
| Stress rate increase | 2 percentage points | Tests a higher-rate case | My judgement |
| Default tenure | 48 months | Used when a tenure is not supplied | My judgement |
| Minimum tenure | 12 months | Keeps the prototype inside a normal repayment range | My judgement |
| Maximum tenure | 84 months | Keeps the prototype inside a normal repayment range | My judgement |
| Age limit for tenure | 60 years | Stops the selected tenure from going past the prototype working-age limit | My judgement |
| Secured LTV cap | 50% of collateral value | Collateral should not by itself allow borrowing up to the full asset value | My judgement |
| Variable-income share | Lower end + 35% of the range | Avoids treating the highest month as normal income | My judgement |
| Self-employed cash haircut | 30% haircut when no documented annual income is available | Makes undocumented cash income less influential | My judgement |

The FOIR values above are prototype rules. They are not universal RBI rules and do not predict a lender's actual eligibility.

## 2. Questions

The app starts with a small common set and then shows fields only when they apply.

### Must-set inputs

The form asks for:

- borrowing purpose
- loan type being considered
- requested amount
- income type
- monthly income or an income range
- existing EMIs
- whether household expenses are known, and the amount when known
- age
- credit score if known

These are enough to produce all four outputs. If some are unknown, the app does not turn them into a fake zero. Confidence goes down.

### Conditional inputs

- Annual ITR income appears for self-employed borrowers.
- Collateral appears for business/self-employed borrowers or when LAP is selected.
- Recent bounce and high-cost debt are asked because they can change the decision and rate.
- Tenure changes EMI, APR and the principal supported by a monthly ceiling, and the result shows a short numerical tenure trade-off.

This keeps the form shorter for a salaried borrower and adds fields when the profile needs them.

## 3. Income normalization

### Salaried

`normalized income = net monthly income`

The full value is used because the prototype treats recurring salary as the clearest income input.

### Self-employed

If ITR income is supplied:

`normalized income = documented annual income / 12`

If it is not supplied:

`normalized income = supplied cash income × 70%`

The prototype uses documented income first.

### Variable or informal

For a range:

`normalized income = low + 35% × (high - low)`

For example, ₹26,000–₹30,000 becomes ₹27,400.

## 4. Affordability

Let `I` be normalized monthly income and `E` be existing monthly EMI.

`lenderTotal = I × 50%`

`safeTotal = I × 40%`

Existing EMI is counted first:

`lenderAvailable = max(0, lenderTotal - E)`

`foirSafeAvailable = max(0, safeTotal - E)`

If the borrower knows monthly household expenses, excluding EMIs:

`cashflowSafeAvailable = max(0, I - E - householdExpenses)`

Then:

`safeAvailable = min(foirSafeAvailable, cashflowSafeAvailable)`

If expenses are not known, the app uses the FOIR safe ceiling and marks confidence lower.

This means household expenses are not just a question for display. When known, they can reduce the borrower-safe amount.

## 5. EMI

The app uses the reducing-balance EMI formula:

`EMI = P × r × (1+r)^n / ((1+r)^n - 1)`

Where:

- `P` = principal
- `r` = annual rate / 100 / 12
- `n` = number of months

At zero interest:

`EMI = P / n`

To turn an EMI ceiling into a principal:

`P = EMI × (1 - (1+r)^(-n)) / r`

At zero interest:

`P = EMI × n`

## 6. Tenure and age

The requested tenure is first limited to 12–84 months.

If age is known, the app also limits tenure so that the repayment does not go beyond the prototype's 60-year age limit.

For example, at age 58 a requested 48-month tenure becomes 24 months.

For O4, the result shows three nearby terms where possible: 36 months, the selected term, and 60 months. Each row shows the EMI and total interest on the borrower-safe amount at the rate midpoint. This makes the trade-off explicit: shorter tenure raises EMI and reduces total interest; longer tenure lowers EMI and increases total interest.

This is a prototype assumption, not a universal lender policy.

## 7. Product routing

The route is based on purpose, selected loan type and collateral.

### Loan against property / secured business

If collateral is supplied and the profile is business/self-employed or the borrower selected LAP, use the secured business route.

### Business loan

If the purpose or selected loan type is business and there is no secured route, use business loan.

### Two-wheeler loan

If the purpose or selected loan type is vehicle, use two-wheeler loan.

### Personal loan

Otherwise use personal loan.

The challenge does not require a full home-loan or gold-loan workflow. Those routes were removed from the active calculation rather than pretending that a home or gold loan can be priced from the current questions.

## 8. Rate bands

These are planning bands used by the prototype.

| Route | Base band | Source |
|---|---:|---|
| Personal loan | 11%–18% | My judgement / market reference |
| Business loan | 12%–20% | My judgement / market reference |
| Loan against property / secured business | 10%–14% | My judgement / market reference |
| Two-wheeler loan | 11%–19% | My judgement / market reference |

The app does not claim that a lender will quote the midpoint or any exact value.

## 9. Rate adjustments

Start with the selected product band.

| Condition | Minimum change | Maximum change | Why |
|---|---:|---:|---|
| Score 750+ | -1.5 pp | -1.5 pp | Strong stated score |
| Score 700–749 | 0 pp | 0 pp | Middle score bucket |
| Score below 700 | +2.5 pp | +2.5 pp | Weaker stated score |
| Score unknown | +2 pp | +2 pp | Unknown credit is treated as uncertainty |
| Non-salaried income | +1 pp | +1 pp | More income uncertainty in this prototype |
| Recent bounce | +2 pp | +3 pp | Recent repayment stress |
| High-cost debt | +1 pp | +2 pp | Existing expensive debt |
| Credit unknown | +0 pp | +1 pp extra | Widens the range when pricing information is missing |

The rate remains a range.

## 10. Lender amount and borrower-safe amount

The engine uses the midpoint of the rate band only for converting monthly capacity into a principal estimate:

`averageRate = (rateMin + rateMax) / 2`

Then:

`lenderAmount = maximumPrincipal(lenderAvailable, averageRate, tenure)`

`incomeSafeAmount = maximumPrincipal(safeAvailable, averageRate, tenure)`

For a secured route:

`collateralCap = collateralValue × 50%`

`safeAmount = min(incomeSafeAmount, collateralCap)`

Otherwise:

`safeAmount = incomeSafeAmount`

The borrower should use `safeAmount` for planning. The lender-side number is only a comparison point.

Collateral is an upper cap, not a replacement for income affordability. Ravi is the main example: the shop value allows a higher secured ceiling, but his documented income gives a much lower safe amount.

## 11. Borrow / Borrow less / Don't borrow

The order is:

1. `DON'T BORROW` if `highCostDebt && recentBounce`.
2. `DON'T BORROW` if `safeAvailable <= 0`.
3. `BORROW LESS` if `requestedAmount > safeAmount`.
4. Otherwise `BORROW`.

The request is therefore compared directly with the borrower-safe amount. There is no extra 20% allowance above the safe amount.

### Why the debt guard is separate

A borrower can have enough mathematical EMI room and still have a debt problem. The combination of high-cost debt and a recent bounce is treated as a reason to pause new borrowing.

## 12. Stress case

The stress case is separate from the base decision.

`stressIncome = normalizedIncome × 85%`

The app recalculates safe monthly room at that lower income.

It then calculates the requested loan EMI at:

`stressRate = rateMax + 2 percentage points`

The displayed result is:

`stressed requested EMI` versus `stressed safe monthly room`

If the EMI is above the stressed room, the card says the buffer breaks.

This does not automatically change the base verdict. The reason is that the stress case is shown as a resilience check, while the base verdict uses the current stated profile. The borrower should treat a failed stress case as a reason to reduce the requested amount or increase the buffer before borrowing.

## 13. APR including processing fee

The prototype assumes a 2% processing fee.

For principal `P`:

`fee = P × 2%`

`netDisbursal = P - fee`

The borrower still pays EMI based on the full principal.

The app solves for the effective monthly rate `r` where:

`netDisbursal = EMI × (1 - (1+r)^(-n)) / r`

It then annualizes:

`APR = ((1+r)^12 - 1) × 100`

Bisection is used for the small numerical solve. The app does not simply add the fee percentage to the interest rate. If borrower-safe principal is zero, APR and fee are shown as zero rather than inventing a rate for a zero-size loan.

## 14. Confidence

The confidence score starts at 3.

| Condition | Change |
|---|---:|
| Credit score unknown | -1 |
| Non-salaried income | -1 |
| Household expenses not known | -1 |
| Recent bounce | -1 |
| Age not known | -1 |

Mapping:

- 3 or more = High
- 2 = Medium
- below 2 = Low

This is confidence in the supplied information. It is not a loan approval probability.

## 15. Unknown values

Unknown does not become zero.

For example, an unknown credit score does not become 300. The rate band is adjusted upward and widened, and confidence falls.

Unknown household expenses do not become ₹0 of spending. The app does not subtract a made-up expense number. It uses the FOIR safe ceiling and tells the borrower that the safe amount is less certain.

## 16. Why some challenge examples are not separate rules

The challenge lists many possible additional questions. They are not all needed for the three supplied borrowers.

- Card utilisation is not asked because no challenge borrower has a card-utilisation fact that would change an output.
- Co-applicant income is not used because none of the three cases needs it.
- Emergency savings are not used because the supplied cases can already be separated using income, EMI, expenses, credit information and debt stress. Adding a question that does not move an output would make the form longer without helping the decision.
- Projected income is not used because none of the cases supplies projected income.
- Home and gold rate routes are not active because the current questions do not support those products.

This is a deliberate scope choice. The model should not pretend to know a number that the borrower has not supplied.

## 17. Three challenge borrowers

### Priya

- Age 29, salaried, ₹1,10,000 net monthly income.
- Existing car EMI: ₹14,000.
- Credit score: 780.
- Purpose: wedding.
- Loan type: personal.
- Household expenses are not fully known from the challenge profile, so the app does not invent a total expense number.
- Normalized income: ₹1,10,000.
- Lender EMI room: ₹41,000.
- Safe EMI room: ₹30,000.
- Rate band: 9.5%–16.5%.
- Midpoint used for principal sizing: 13%.
- Lender-side capacity: about ₹15.3L.
- Borrower-safe amount: about ₹11.2L.
- Request: ₹8L.
- Verdict: BORROW.
- Stress: at 15% lower income and 18.5% rate, the requested EMI is about ₹23.7k against about ₹23.4k stressed safe room. The buffer is slightly short in this stress case.

### Ravi

- Age 42, self-employed kirana owner.
- Cash income: ₹40,000–₹80,000.
- ITR: ₹4.2L/year.
- No existing EMI.
- No known credit score.
- Business purpose and ₹45L unencumbered shop.
- Loan type: business.
- Documented income is used, so normalized income is ₹35,000/month.
- Lender EMI room: ₹17,500.
- Safe EMI room: ₹14,000.
- Secured route is selected.
- Rate band: 13%–18%.
- Midpoint: 15.5%.
- Lender-side capacity: about ₹7.3L.
- Income-based safe amount: about ₹5.8L.
- Collateral cap: ₹22.5L.
- Final safe amount: about ₹5.8L because income affordability is lower.
- Request: ₹15L.
- Verdict: BORROW LESS.
- Stress: the requested EMI is about ₹39.7k against about ₹11.9k stressed safe room, so the buffer breaks.

### Anita

- Age 35, variable income of ₹26,000–₹30,000.
- Existing EMI: ₹1,050.
- Credit score unknown.
- Vehicle purpose and vehicle loan type.
- One recent bounce.
- High-cost app debt above 24%.
- Normalized income: ₹27,400/month.
- Safe EMI room: ₹9,910.
- Rate band: 17%–28%.
- Midpoint: 22.5%.
- Borrower-safe amount: about ₹2.6L.
- Request: ₹1.5L.
- The mathematical amount fits, but the high-cost-debt + recent-bounce guard fires.
- Verdict: DON'T BORROW.
- Stress: the requested EMI is about ₹6.4k against about ₹8.3k stressed safe room, so this specific EMI stress test survives. The verdict is still DON'T BORROW because the debt-risk guard is separate.

## 18. Limits

The app does not know:

- actual bureau data
- lender-specific underwriting
- lender-specific FOIR policy
- verified household expenses
- actual collateral valuation or title quality
- lender-specific rate cards
- lender-specific fees, insurance or other charges unless modeled
- the actual KFS terms

The rate bands are planning references. The borrower should compare the lender's quote and KFS with the card.

## 19. Change-one-number test

The main values are in `RULES` so they can be changed without editing the UI.

Examples:

- Change `safeFoir` from 40% to 35%: safe EMI room, safe amount and possibly the verdict change. Lender capacity does not change.
- Change `lenderFoir` from 50% to 45%: lender-side capacity changes. The safe amount does not change if safe FOIR stays at 40%.
- Change `processingFee` from 2% to 3%: the APR estimate changes, while the base EMI capacity does not.
- Change `stressIncomeDrop` from 15% to 20%: the stress room changes.

This is the live rule-change part of the follow-up.
