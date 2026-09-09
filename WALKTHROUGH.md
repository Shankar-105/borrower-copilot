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

Her total household expenses are not supplied by the challenge, so the app does not make up a number. Confidence is Medium.

The result also shows 36/48/60-month EMI and interest trade-offs on the safe amount. The shorter term costs less interest but has a higher EMI; the longer term lowers EMI but costs more interest.

The stress case is close: after a 15% income drop and a 2-point rate increase, the requested EMI is slightly above the stressed safe room. I would use that as a reason to keep the request close to ₹8L or lower, even though the base verdict is BORROW.

## 2:00–3:15 — Ravi

Ravi is self-employed. He reports ₹40k–₹80k cash income, but his ITR shows ₹4.2L for the year. The app uses the documented figure, so normalized income is ₹35k/month.

His business purpose and ₹45L unencumbered shop route him to a secured business/LAP route. The collateral cap is ₹22.5L, but his income-based safe amount is only about ₹5.8L. This shows why collateral should be a cap, not a replacement for repayment capacity.

The ₹15L request is above the safe amount, so the verdict is BORROW LESS. Unknown credit and unknown household expenses make confidence Low.

The stress case also breaks the buffer by a large amount.

## 3:15–4:00 — Anita

Anita has ₹26k–₹30k variable income, ₹1,050 existing EMI, unknown credit, one recent bounce and ₹35k of high-cost app debt. She wants ₹1.5L for an electric scooter.

The income normalizes to ₹27,400/month. The mathematical safe amount is about ₹2.6L, so the requested amount would fit on EMI alone.

But the app does not stop at the EMI calculation. High-cost debt plus a recent bounce triggers the DON'T BORROW guard. This is important because a borrower can have mathematical capacity and still have a current debt problem.

## 4:00–5:00 — Code and next steps

The domain rules are in `src/domain/rules.js`, separate from the UI. The main assumptions are at the top of the file, so they can be changed in one place.

If I had more time, I would add better verified expense and income history inputs, more lender-specific product data, and a fuller quote comparison using the lender's KFS values.

I would cut questions that do not change an output. I would also avoid adding more loan products unless the questionnaire has enough information to support them.

For the follow-up, I can change a value such as safe FOIR from 40% to 35% and show how the safe EMI, safe amount and verdict change without changing the UI code.
