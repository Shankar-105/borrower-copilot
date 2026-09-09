# Five-minute walkthrough

## 0:00–0:45 — What I built

Borrower Copilot is a local borrower self-assessment. A borrower enters the information they know and gets four answers: whether to borrow, a lender-side amount and a safer amount, a fair rate range with APR, and an EMI ceiling with a stress case.

The result also shows a small tenure trade-off with EMI and total interest, plus a Negotiation Card for the lender conversation.

There is no login, backend, bureau pull or stored personal data.

## 0:45–2:00 — Priya

Priya is salaried with ₹1.10L net monthly income, a ₹14k car EMI and a 780 score. She wants ₹8L for a wedding. The challenge gives ₹28k rent; for the run-through I enter ₹28k as the known household-expense input, while noting that rent is not necessarily the same as total household spending.

The key affordability rule is:

`₹1,10,000 × 40% = ₹44,000 safe FOIR ceiling`

`₹44,000 - ₹14,000 existing EMI - ₹28,000 expenses = ₹2,000 safe new EMI`

So the ₹28k expense directly changes the safe EMI and safe amount. It is not a separate cash-flow check that can be ignored after calculating FOIR. The safe amount is about ₹0.75L, so the ₹8L request gets BORROW LESS.

The lender-side estimate remains about ₹15.3L because lender-side capacity uses the prototype 50% FOIR on normalized borrower income. The practical amount is the lower of lender-side and borrower-safe capacity, so the card uses about ₹0.75L.

The rate band is 9.5%–16.5%. The stress case also breaks because after the 15% income drop, the 40% FOIR ceiling is ₹37.4k and ₹14k existing EMI plus ₹28k expenses already uses more than that.

## 2:00–3:15 — Ravi

Ravi is self-employed. He reports ₹40k–₹80k cash income, but his ITR shows ₹4.2L for the year. The app uses the documented figure for lender-side capacity, so normalized borrower income is ₹35k/month.

The challenge also says his wife earns ₹18k/month. The app captures that as other household income. It is included in the borrower-safe household calculation because Ravi may rely on it for household cash flow, but it is not silently added to lender-side sanction capacity because the app has not established that she is a co-applicant.

His business purpose and ₹45L unencumbered shop route him to a secured business/LAP route. The collateral cap is ₹22.5L. The lender-side capacity is about ₹7.3L, while the household-safe affordability ceiling is about ₹8.8L. The practical amount is therefore about ₹7.3L.

The ₹15L request is above both, so the verdict is BORROW LESS. Unknown credit and unknown household expenses make confidence Low.

## 3:15–4:00 — Anita

Anita has ₹26k–₹30k variable income, ₹1,050 existing EMI, unknown credit, one recent bounce and ₹35k of high-cost app debt. She wants ₹1.5L for an electric scooter.

The income normalizes to ₹27,400/month. The mathematical safe amount is above the request on EMI capacity alone, but the app does not stop there. High-cost debt plus a recent bounce triggers the DON'T BORROW guard.

This matters because a borrower can have mathematical EMI capacity and still have a current debt problem.

## 4:00–5:00 — Code and next steps

The domain rules are in `src/domain/rules.js`, separate from the UI. The main assumptions are at the top of the file, so they can be changed in one place.

The affordability rule is explicit: known household expenses are subtracted from the borrower-safe FOIR ceiling after existing EMIs. For example, Priya's ₹28k expense turns a ₹30k post-existing-EMI FOIR headroom into a ₹2k safe new EMI ceiling.

The credit adjustment is also explicit: unknown credit adds +2 percentage points to the minimum and +3 to the maximum.

Household income and lender-side borrower income are kept separate. That makes the Ravi case easier to defend: a spouse's income can improve household affordability without pretending the lender will count it unless co-applicant treatment is established.

The practical amount is the lower of lender-side and borrower-safe capacity. APR and the tenure trade-off are calculated on that practical amount so the Negotiation Card and supporting numbers refer to the same amount.

If I had more time, I would add better verified expense and income history inputs, more lender-specific product data, and a fuller quote comparison using the lender's KFS values.

I would cut questions that do not change an output. I would also avoid adding more loan products unless the questionnaire has enough information to support them.

For the follow-up, I can change a value such as safe FOIR from 40% to 35% and show how the safe EMI, safe amount and verdict change without changing the UI code.
