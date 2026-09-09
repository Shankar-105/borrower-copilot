# Five-minute walkthrough

## 0:00–0:45 — What I built

Borrower Copilot is a local borrower self-assessment. A borrower enters the information they know and gets four answers: whether to borrow, a lender-side amount and a safer amount, a fair rate range with APR, and an EMI ceiling with a stress case.

The result also shows a small tenure trade-off: nearby terms with their EMI and total interest, so the borrower can see what they gain by stretching or shortening the loan.

There is also a Negotiation Card that can be used when speaking to a lender.

There is no login, backend, bureau pull or stored personal data.

## 0:45–2:00 — Priya

Priya is salaried with ₹1.10L net monthly income, a ₹14k car EMI and a 780 score. She wants ₹8L for a wedding.

The app uses her full net income. At 50% FOIR the estimated lender-side new EMI room is ₹41k. At 40% the borrower-safe room is ₹30k after the existing EMI.

At the midpoint of the rate band, that gives about ₹15.3L lender-side capacity and about ₹11.2L borrower-safe amount. Her ₹8L request fits the safe amount, so the base verdict is BORROW.

Her total household expenses are not supplied by the challenge, so the app does not make up a number. If she enters ₹28k, the result explains that the 40% FOIR ceiling is still tighter than the remaining cash-flow room, so the safe amount can stay the same without silently ignoring the expense input.

The result also shows 36/48/60-month EMI and interest trade-offs on the safe amount. The shorter term costs less interest but has a higher EMI; the longer term lowers EMI but costs more interest.

The stress case is close: after a 15% income drop and a 2-point rate increase, the requested EMI is slightly above the stressed safe room. I would use that as a reason to keep the request close to ₹8L or lower, even though the base verdict is BORROW.

## 2:00–3:15 — Ravi

Ravi is self-employed. He reports ₹40k–₹80k cash income, but his ITR shows ₹4.2L for the year. The app uses the documented figure for lender-side capacity, so normalized borrower income is ₹35k/month.

The challenge also says his wife earns ₹18k/month. The app now captures that as other household income. It is included in the borrower-safe household calculation because Ravi may rely on it for household cash flow, but it is not silently added to lender-side sanction capacity because the app has not established that she is a co-applicant.

His business purpose and ₹45L unencumbered shop route him to a secured business/LAP route. The collateral cap is ₹22.5L. The lender-side capacity is about ₹7.3L, while the household-safe affordability ceiling is about ₹8.8L. For a real borrowing decision, I would use the lower practical number because the lender still has to sanction the loan.

The ₹15L request is above both, so the verdict is BORROW LESS. Unknown credit and unknown household expenses make confidence Low.

The stress case also breaks the buffer by a large amount.

## 3:15–4:00 — Anita

Anita has ₹26k–₹30k variable income, ₹1,050 existing EMI, unknown credit, one recent bounce and ₹35k of high-cost app debt. She wants ₹1.5L for an electric scooter.

The income normalizes to ₹27,400/month. The mathematical safe amount is about ₹2.6L, so the requested amount would fit on EMI alone.

But the app does not stop at the EMI calculation. High-cost debt plus a recent bounce triggers the DON'T BORROW guard. This is important because a borrower can have mathematical capacity and still have a current debt problem.

## 4:00–5:00 — Code and next steps

The domain rules are in `src/domain/rules.js`, separate from the UI. The main assumptions are at the top of the file, so they can be changed in one place.

The credit adjustment is deliberately explicit: unknown credit adds +2 percentage points to the minimum and +3 to the maximum. This avoids hiding one side of the rule inside a generic shared value.

Household income and household expenses are also kept separate from lender-side borrower income. That makes the Ravi case easier to defend: a spouse's income can improve household affordability without pretending the lender will count it unless co-applicant treatment is established.

If I had more time, I would add better verified expense and income history inputs, more lender-specific product data, and a fuller quote comparison using the lender's KFS values.

I would cut questions that do not change an output. I would also avoid adding more loan products unless the questionnaire has enough information to support them.

For the follow-up, I can change a value such as safe FOIR from 40% to 35% and show how the safe EMI, safe amount and verdict change without changing the UI code.
