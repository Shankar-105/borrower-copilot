# Five-minute walkthrough

## 0:00–0:45 — What I built

Borrower Copilot is a local borrower self-assessment. A borrower enters the information they know and gets four answers: whether to borrow, a lender-side amount and a safer amount, a fair rate range with an illustrative APR, and an EMI ceiling with a stress case.

The question flow follows the challenge's two tiers. The must-set is kept small enough to produce all four outputs. Extra questions appear when they can tighten a number, route, decision, or confidence. A renter must provide a positive rent value before the result can be opened.

The result also shows a small tenure trade-off with EMI and total interest, plus a Negotiation Card with a lender quote comparison.

There is no login, backend, bureau pull or stored personal data.

## 0:45–2:00 — Priya

Priya is salaried with ₹1.10L net monthly income, a ₹14k car EMI and a 780 score. She wants ₹8L for a wedding. The challenge gives ₹28k rent. The prefilled run also enters ₹0 for general maintenance, so the current model applies its ₹7,500 minimum maintenance floor instead of allowing zero household maintenance.

The key affordability rule is:

`₹1,10,000 × 40% = ₹44,000 safe FOIR ceiling`

`₹44,000 - ₹14,000 existing EMI - ₹28,000 rent - ₹7,500 maintenance floor < ₹0`

So the borrower-safe new EMI is ₹0 and the borrower-safe amount is ₹0. The current verdict is DON'T BORROW. This is the important difference from treating Priya's rent as if it were her complete household spending.

The lender-side estimate remains about ₹15.3L because lender-side capacity uses the prototype 50% FOIR on normalized borrower income. The card does not tell Priya to use that lender-side number as her personal affordability target.

## 2:00–3:15 — Ravi

Ravi is self-employed. He reports ₹40k–₹80k cash income, but his ITR shows ₹4.2L for the year. The app uses the documented figure for normalization, so borrower income becomes ₹35k/month. Operating cash is not added on top.

The challenge also says his wife earns ₹18k/month. The app captures that as other household income. It is included in the borrower-safe household calculation because Ravi may rely on it for household cash flow, but it is not silently added to lender-side sanction capacity because the app has not established that she is a co-applicant.

His business purpose and ₹45L unencumbered shop route him to a secured business/LAP route. The collateral cap is ₹22.5L, but income affordability is lower. With unknown household expenses, the model uses the ₹7,500 maintenance floor instead of zero. The borrower-safe amount is about ₹6.0L while the lender-side estimate is about ₹7.7L, so the practical amount is about ₹6.0L.

The ₹15L request is above the practical amount, so the verdict is BORROW LESS. Unknown credit, unknown household expenses and self-employed income make confidence Low.

The unsecured `business` route is still reachable for a business borrower with no collateral; it is not dead code hidden behind Ravi's secured case.

## 3:15–4:00 — Anita

Anita has ₹26k–₹30k variable income, ₹1,050 existing EMI, unknown credit, one recent bounce and ₹35k of high-cost app debt. She wants ₹1.5L for an electric scooter.

The model normalizes her income to ₹27,400 using the low + 35% of range rule. Unknown expenses use the ₹7,500 maintenance floor. This gives a mathematical borrower-safe amount of about ₹0.68L and a safe EMI ceiling of about ₹2,410/month.

High-cost debt plus a recent bounce is recognized as severe debt risk. However, the current implementation treats a vehicle/business route as a productive-purpose exception, so the verdict is **BORROW LESS**, not DON'T BORROW. The requested amount is still above the practical amount, and the risk flags remain visible.

This is a deliberate prototype judgement, not a requirement stated by the challenge. It is one of the rules I would be ready to defend or change live in the follow-up.

The current two-wheeler rate band is 14%–23% after unknown credit and non-salaried adjustments. The implementation does not currently apply the separate documented +1 pp fair-rate cap constant, so the code and rules should be tightened before final submission if that cap is intended.

## 4:00–5:00 — Code and next steps

The domain rules are in `src/domain/rules.js`, separate from the UI. The main assumptions are at the top of the file, so they can be changed in one place. Domain tests are in `src/domain/rules.test.js`.

The affordability rule distinguishes lender and borrower perspectives. Lender-side capacity uses borrower income and lender FOIR. Borrower-safe capacity can include household income, subtracts rent and known household maintenance, and uses a disclosed maintenance floor when expenses are unknown. Unknown is never silently converted to zero.

Household income and lender-side borrower income are kept separate. That makes the Ravi case easier to defend: a spouse's income can improve household affordability without pretending the lender will count it unless co-applicant treatment is established.

The practical amount is the lower of lender-side and borrower-safe capacity. For a secured route, lender-side capacity also respects the collateral LTV cap. The displayed recommended EMI is calculated from the practical principal, so the card does not show unused safe headroom.

The current APR estimate is calculated from the borrower-safe amount after a 2% processing fee. This is an illustrative fee-based APR, not a full lender KFS.

The fair-rate benchmark separates **negotiation price** from **borrow/no-borrow risk**. Recent bounce and high-cost debt are decision risk flags, not arbitrary stacked penalties that could tell a borrower that a punitive quote is "fair".

The stress case drops borrower income by 15% and reduces household expense load by 10%. Only the secured/LAP route applies the configured 2 percentage-point rate stress; the other routes keep the selected fixed-rate assumption. A failed stress case is shown as a resilience check and does not automatically change the base verdict.

If I had more time, I would add better verified expense and income history inputs, more lender-specific product data, and a fuller quote comparison using lender KFS values. I would also make the fair-rate cap a named rule constant and add a focused test for it, because the current documentation describes the cap while the implementation still hard-codes the +1 pp behavior.

I would cut questions that do not change an output. I would also avoid adding more loan products unless the questionnaire has enough information to support them.

For the follow-up, I can change `safeFoir`, `minimumExpenseFloor`, `stressIncomeDrop`, `stressExpenseReduction`, `variableIncomeShare`, or the fair-rate cap logic and show which outputs move while the UI remains unchanged.
