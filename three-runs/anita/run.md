# Anita — run-through

## Profile

- Age: 35
- City: Hubballi
- Income: informal/variable
- Monthly income range: ₹26,000–₹30,000
- Existing EMI: ₹1,050
- Credit score: Not known
- Purpose: electric scooter
- Loan type: two-wheeler loan
- Requested amount: ₹1,50,000
- Tenure: 36 months
- Recent bounce: Yes, one EMI last month
- High-cost debt above 24%: Yes, ₹35,000 outstanding
- Household expenses: Not known from the challenge profile
- Collateral: Not supplied

The profile also has two children and a husband who has been unemployed for 8 months. The current rules do not turn those facts into made-up income or expense numbers.

## Questions shown

### Must answer

1. What are you borrowing for? — Two-wheeler
2. What loan type are you considering? — Two-wheeler loan
3. How much do you want to borrow? — ₹1,50,000
4. How does your income arrive? — Informal or variable
5. Lower monthly income — ₹26,000
6. Higher monthly income — ₹30,000
7. Existing monthly EMIs — ₹1,050
8. Do you own your home or rent? — Own House
9. Do you know your monthly household expenses? — Not yet
10. Your age — 35

### Additional questions

11. Credit score, if known — Not known
12. Any EMI bounced in the last 6 months? — Yes
13. Any app or short-term debt above 24%? — Yes
14. Preferred tenure — 3 years

The collateral question is not shown because this is not a secured/LAP case. Other household income is not supplied in the challenge profile.

## O1 — Should I borrow?

**BORROW LESS**

Anita has high-cost debt and a recent bounced EMI. The current code recognizes a severe-debt guard, but it makes an exception for productive vehicle/business routes. Because the electric scooter is treated as a productive vehicle purpose, the verdict is **BORROW LESS**, not DON'T BORROW.

This is a deliberate prototype judgement and is the main point I would defend carefully in the interview. The app still makes the debt risk visible rather than pretending the new borrowing is safe.

Confidence: **Low** because income is variable, credit is unknown and household expenses are not known.

## O2 — How much?

- Normalized income: **₹27,400/month** using the low + 35% of range rule
- Estimated lender-side capacity: **about ₹3.5L**
- Borrower-safe amount: **about ₹0.68L**
- Safe EMI ceiling: **₹2,410/month**
- Practical amount to plan around: **about ₹0.68L**

These are mathematical capacity numbers only. The borrower should **not read them as proof that another loan is safe**. The current verdict is BORROW LESS because the request is above the practical amount, while the severe-debt/productive-purpose exception remains visible in the reasoning.

The safe number uses the disclosed ₹7,500 maintenance floor because unknown expenses are never treated as ₹0.

## O3 — What rate?

- Route: **Two-wheeler loan**
- Fair rate band: **14%–20%**
- All-in APR estimate: **about 16.6%–27.5%**
- Prototype processing fee: **2%**, about ₹1,352 on the borrower-safe amount

The base two-wheeler band is 11%–19%. Unknown credit adds +2 to +3 points and non-salaried income adds 1 point. The current rate implementation does not apply a separate fair-rate cap constant; the resulting 14%–23% raw band is therefore what the code currently produces if no other cap is added. The current run documentation should not claim a 20% cap unless the code is changed to implement it.

The recent bounce and high-cost debt are shown as risk flags rather than stacked into the fair-rate benchmark.

## O4 — What EMI?

- Base safe EMI ceiling: **₹2,410/month**
- Practical amount: **about ₹0.68L**
- Tenure used: **36 months**
- Tenure trade-off uses the practical amount at the 17% midpoint.
- 24 months: about **₹3.3k EMI**, about **₹12.6k total interest**
- 36 months: about **₹2.4k EMI**, about **₹19.2k total interest** — selected
- 48 months: about **₹2.0k EMI**, about **₹26.0k total interest**
- Stress income after a 15% drop: **₹23,290/month**
- Stressed safe household room: **about ₹1,516/month** after the 10% expense reduction
- Requested ₹1.5L EMI at the current top rate of 23%: **about ₹5.8k/month**
- Stress result: **Buffer breaks**

The stress case is a resilience check. The base BORROW LESS verdict comes from the request being above the practical amount, with the severe-debt/productive-purpose judgement also visible.

## Negotiation Card

The card should show:

- Recommended amount: **about ₹0.68L**
- Lender-side estimate: **about ₹3.5L**
- Borrower-safe amount: **about ₹0.68L**
- Fair rate: **14%–23%** under the current code
- APR including fee: **about 16.6%–27.5%**
- EMI ceiling: **₹2,410/month**
- Route: **Two-wheeler loan**
- Risk flags: recent bounce + high-cost debt
- Verdict: **BORROW LESS**

I will add the result/card screenshots in this folder.
