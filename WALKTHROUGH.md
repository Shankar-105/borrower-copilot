# Five-minute walkthrough

## Product

Borrower Copilot is a local borrower self-assessment for the four Lokta outputs: borrow, don't borrow, borrow less; lender-side versus borrower-safe amount; fair rate and APR range; and EMI ceiling with stress. It has no backend, login, bureau pull, or stored personal data.

The flow is adaptive. Must questions collect purpose, loan type, requested amount, income type, income, existing EMI, household expenses excluding rent and EMIs, housing, age, and rent when the borrower selects renting. Additional questions include ITR income, optional other household income, credit score, collateral, repayment risk, and tenure. Blank must-answer numeric fields remain unknown and block the assessment; an explicit zero existing EMI is valid.

## Core affordability

Lender-side capacity uses only borrower normalized income and existing EMI:

`lenderAvailable = max(0, income × 50% - existingEmi)`

Borrower-safe capacity uses normalized borrower income plus optional other household income, then subtracts existing EMI, current rent, and monthly household expenses:

`safeAvailable = max(0, (income + otherHouseholdIncome) × 40% - existingEmi - rent - householdExpenses)`

Household expenses are entered excluding rent and existing EMIs. A renter must provide positive rent; an owner explicitly has zero rent. The three prefilled scenarios use illustrative expense assumptions because the challenge brief does not provide those values.

The loan amount is calculated from EMI headroom using the reducing-balance formula. For LAP, lender capacity is also capped by a 50% illustrative LTV. The safe amount is never collateral-capped.

When the verdict is `DON'T BORROW`, the live preview and Negotiation Card show **₹0 as the amount to borrow now**. The positive borrower-safe figure remains visible as a mathematical capacity check only.

## Priya

Priya is salaried at ₹1,10,000/month, has ₹14,000 existing EMI, ₹28,000 rent, ₹10,000 illustrative household expenses, score 780, and requests ₹8,00,000.

- Lender-side estimate: about ₹15.3L
- Borrower-safe amount: ₹0
- Absolute feasible ceiling: ₹0
- Safe EMI ceiling: ₹0/month
- Rate: 9.5%–16.5%
- APR: Not available because there is no feasible borrowing principal
- Decision: `DON'T BORROW`

The safe calculation is `₹1,10,000 × 40% - ₹14,000 - ₹28,000 - ₹10,000 = -₹8,000`, floored at zero. Her strong stated score improves the benchmark, but it does not override household outgoings. The stress case fails too: requested EMI is about ₹22,878 against ₹0 of stressed room.

## Ravi

Ravi is self-employed with a ₹4,20,000 ITR, a ₹40k–₹80k cash range, ₹18,000 other household income, ₹8,000 illustrative household expenses, a ₹45L unencumbered shop, and a ₹15L business request.

Because documented income exists, normalized borrower income is ₹35,000/month. The cash range is not added on top. His wife's income affects only borrower-safe household capacity, not lender capacity.

- Lender-side estimate: about ₹7.7L
- Borrower-safe amount: about ₹5.8L
- Absolute feasible ceiling: about ₹5.8L
- Collateral cap: ₹22.5L, not binding
- Safe EMI ceiling: ₹13,200/month
- Rate: 11%–15%
- APR: about 12.6%–17.1%
- Decision: `BORROW LESS`
- Route: secured business/LAP
- Confidence: Low

The request exceeds both capacity boundaries. The stress case also fails: requested EMI is about ₹37,279 against ₹11,100 of stressed room, so Ravi should change the amount or tenure before accepting an offer.

## Anita

Anita has ₹26k–₹30k variable income, ₹1,050 existing EMI, ₹8,000 illustrative household expenses, unknown credit, one recent bounce, high-cost app debt, and a ₹1.5L two-wheeler request.

Her normalized income is `₹26,000 + 35% × ₹4,000 = ₹27,400`.

- Lender-side estimate: about ₹3.5L
- Borrower-safe amount: about ₹52k
- Absolute feasible ceiling: about ₹52k
- Mathematical safe EMI ceiling: about ₹1,910/month
- Rate: 14%–23%
- APR: about 16.6%–27.5%
- Decision: `DON'T BORROW`
- Amount to borrow now: **₹0**
- Confidence: Low

The decision comes from the explicit severe-debt rule: high-cost debt plus a recent bounced EMI. The vehicle purpose does not override that guard. The stress case fails too: requested EMI is about ₹5,806 against ₹266 of stressed room.

## Negotiation Card

The card shows requested amount, lender-side estimate, borrower-safe amount, fair rate band, APR range, EMI ceiling, route, reasons, confidence, and fee limitations. For `DON'T BORROW`, its primary amount and EMI-to-carry-now fields are both ₹0, while the mathematical borrower-safe capacity remains visible separately. It supports comparing both nominal rate and lender APR; APR must be compared using the same principal, tenure, and all-in fee basis.

## Change scenarios

Changing `RULES.lenderFoir` changes lender capacity only. Changing `RULES.safeFoir` or household expenses changes safe capacity and decisions. Changing `RULES.processingFee` changes APR and fee. Changing `RULES.stressIncomeDrop` changes stress. Changing `RULES.variableIncomeShare` changes variable-income normalization and downstream amounts.

## What I would build next

I would add lender-quote capture for principal, nominal rate, processing fee, insurance, and other charges so the borrower can compare a real KFS against the same principal and tenure. I would also add purpose-specific cash-flow questions for productive borrowing, a co-applicant distinction, and a printable or downloadable card with a clear stress warning.

## What I would cut

I would cut the impression that a single prototype rate band is a market quote. The band should remain a negotiation benchmark, labelled as judgement, without suggesting that a lender must match it.
