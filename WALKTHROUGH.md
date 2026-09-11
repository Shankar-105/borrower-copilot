# Five-minute walkthrough

## Product

Borrower Copilot is a local borrower self-assessment for the four Lokta outputs: borrow/don't borrow/borrow less, lender-side versus borrower-safe amount, fair rate and APR range, and EMI ceiling with stress. It has no backend, login, bureau pull, or stored personal data.

The flow is adaptive. Must questions collect purpose, loan type, requested amount, income type, income, existing EMI, housing, age, and rent when the borrower selects renting. Additional questions include ITR income, optional other household income, credit score, collateral, repayment risk, and tenure.

## Core affordability

Lender-side capacity uses only borrower normalized income and existing EMI:

`lenderAvailable = max(0, income × 50% - existingEmi)`

Borrower-safe capacity uses normalized borrower income plus optional other household income, then subtracts existing EMI and current rent:

`safeAvailable = max(0, (income + otherHouseholdIncome) × 40% - existingEmi - rent)`

There is no general-maintenance or household-expense input in the current app. A renter must provide positive rent; an owner explicitly has zero rent.

The loan amount is calculated from EMI headroom using the reducing-balance formula. For LAP, lender capacity is also capped by 50% illustrative LTV. The safe amount is never collateral-capped.

## Priya

Priya is salaried at ₹1,10,000/month, has ₹14,000 existing EMI, ₹28,000 rent, score 780, and requests ₹8,00,000.

- Lender-side estimate: about ₹15.3L
- Borrower-safe amount: about ₹74.6k
- Absolute feasible ceiling: about ₹74.6k
- Safe EMI ceiling: ₹2,000/month
- Rate: 9.5%–16.5%
- APR: about 11.1%–19.1%
- Decision: `BORROW LESS`

The safe calculation is `₹1,10,000 × 40% - ₹14,000 - ₹28,000 = ₹2,000`. Her strong stated score improves the benchmark, but it does not override the rent and existing EMI calculation.

## Ravi

Ravi is self-employed with a ₹4,20,000 ITR, a ₹40k–₹80k cash range, ₹18,000 other household income, a ₹45L unencumbered shop, and a ₹15L business request.

Because documented income exists, normalized borrower income is ₹35,000/month. The cash range is not added on top. His wife's income affects only borrower-safe household capacity, not lender capacity.

- Lender-side estimate: about ₹7.7L
- Borrower-safe amount: about ₹9.3L
- Absolute feasible ceiling: about ₹7.7L
- Collateral cap: ₹22.5L, which is not binding
- Safe EMI ceiling: ₹17,500/month
- Rate: 11%–15%
- APR: about 12.6%–17.1%
- Decision: `BORROW LESS`
- Route: secured business/LAP

The request exceeds both independent boundaries. Ravi is shown the safer household amount and the stricter lender-side ceiling separately.

## Anita

Anita has ₹26k–₹30k variable income, ₹1,050 existing EMI, unknown credit, one recent bounce, high-cost app debt, and a ₹1.5L two-wheeler request.

Her normalized income is `₹26,000 + 35% × ₹4,000 = ₹27,400`.

- Lender-side estimate: about ₹3.5L
- Borrower-safe amount: about ₹2.7L
- Absolute feasible ceiling: about ₹2.7L
- Safe EMI ceiling: about ₹5,461/month
- Rate: 14%–23%
- APR: about 16.6%–27.5%
- Decision: `DON'T BORROW`

The decision is not caused by the vehicle purpose. It is caused by the explicit severe-debt rule: high-cost debt plus a recent bounced EMI. The stress view is separate: income falls 15%; because this is a fixed-rate two-wheeler route, no rate increase is assumed.

## Negotiation Card

The card shows requested amount, lender-side estimate, borrower-safe amount, fair rate band, APR range, EMI ceiling, route, reasons, confidence, and fee limitations. A quote above the benchmark tells the borrower to ask why; it does not claim a lender is required to match the benchmark.

## Change scenarios

Changing `RULES.lenderFoir` changes lender capacity only. Changing `RULES.safeFoir` changes safe capacity and decisions. Changing `RULES.processingFee` changes APR and fee. Changing `RULES.stressIncomeDrop` changes only stress. Changing `RULES.variableIncomeShare` changes variable-income normalization and downstream amounts. None of these require UI changes.
