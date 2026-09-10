# Ravi — run-through

## Profile

- Age: 42
- City: Mysuru
- Income: self-employed kirana store owner
- Cash income: ₹40,000–₹80,000/month
- Documented ITR income: ₹4,20,000/year
- Existing EMI: ₹0
- Credit score: Not known
- Purpose: second stock line and delivery vehicle
- Loan type: business loan
- Requested amount: ₹15,00,000
- Tenure: 60 months
- Recent bounce: No
- High-cost debt above 24%: No
- Wife's income: ₹18,000/month
- Household expenses: Not known from the challenge profile
- Unencumbered shop value: ₹45,00,000

The app uses the ITR income for lender-side capacity because it is documented. Ravi's wife's ₹18k income is captured separately as other household income. It helps the borrower-safe household calculation, but it is not silently added to what a lender may sanction because the app has not established that she is a co-applicant.

## Questions shown

1. What are you borrowing for? — Business or stock
2. What loan type are you considering? — Business loan
3. How much do you want to borrow? — ₹15,00,000
4. How does your income arrive? — Self-employed
5. Lower monthly income — ₹40,000
6. Higher monthly income — ₹80,000
7. Annual documented income (ITR) — ₹4,20,000
8. Existing monthly EMIs — ₹0
9. Other household income you expect to rely on — ₹18,000
10. Do you know your monthly household expenses? — Not yet
11. Your age — 42
12. Credit score, if known — Not known
13. Unencumbered property or collateral value — ₹45,00,000
14. Any EMI bounced in the last 6 months? — No
15. Any app or short-term debt above 24%? — No
16. Preferred tenure — 5 years

## O1 — Should I borrow?

**BORROW LESS**

The ₹15L request is above the practical amount. Ravi's property establishes a secured route, while the wife's income improves borrower-safe household capacity. Because household expenses are unknown, the model uses a disclosed 20% household-income expense proxy rather than treating missing expenses as ₹0.

Confidence: **Low** because the credit score and household expenses are not known, and the income is self-employed.

## O2 — How much?

- Estimated lender-side capacity: **about ₹7.5L**
- Borrower-safe household amount: **about ₹4.6L**
- Collateral cap at 50% LTV: **₹22.5L**
- Practical amount to plan around: **about ₹4.6L**
- Safe EMI ceiling: **₹10,600/month**

The borrower-safe amount uses Ravi's normalized ₹35k borrower income plus his wife's ₹18k household income, then subtracts the 20% unknown-expense proxy. The lender-side number uses Ravi's ₹35k normalized income only.

The practical amount is the lower of lender-side capacity and borrower-safe capacity, so the card uses about ₹4.6L.

## O3 — What rate?

- Route: **Loan against property / secured business loan**
- Fair rate band: **13%–15%**
- All-in APR estimate: **about 14.6%–17.0%**
- Prototype processing fee: **2%**, about ₹9,111 on the practical amount

The secured route starts from the 10%–14% prototype band. Unknown credit adds +2 pp to the minimum and +3 pp to the maximum, and non-salaried income adds 1 pp. The fair-rate benchmark is capped at one point above the route base maximum, so unknown risk widens the range without turning the card into an absurd worst-case lender quote.

## O4 — What EMI?

- Borrower-safe EMI ceiling: **₹10,600/month**
- Practical amount to plan around: **about ₹4.6L**
- Tenure used: **60 months**
- Tenure trade-off uses the practical amount at the 14% midpoint.
- Stress income after a 15% drop: **₹29,750/month**
- Stress household income including wife's income: **₹47,750/month**
- Stress household expenses: **about ₹8,595**, after the 10% variable-spend reduction
- Stressed safe EMI room: **about ₹10,505/month**
- Requested ₹15L EMI at the stressed rate of 17%: materially above stressed safe room
- Stress result: **Buffer breaks**

The trade-off uses the practical amount because that is the amount the card recommends. The safe EMI ceiling is still shown separately because it is the household's monthly limit.

## Negotiation Card

The card should show:

- Recommended / practical amount: **about ₹4.6L**
- Borrower-safe household ceiling: **about ₹4.6L**
- Fair rate: **13%–15%**
- APR including fee: **about 14.6%–17.0%**
- EMI ceiling: **₹10,600/month**
- Route: **Loan against property / secured business loan**
- Verdict reason: the ₹15L request is above the practical amount after the disclosed unknown-expense proxy

I will add the result/card screenshots in this folder.
