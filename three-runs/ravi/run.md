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

### Must answer

1. What are you borrowing for? — Business or stock
2. What loan type are you considering? — Business loan
3. How much do you want to borrow? — ₹15,00,000
4. How does your income arrive? — Self-employed
5. Lower monthly income — ₹40,000
6. Higher monthly income — ₹80,000
7. Existing monthly EMIs — ₹0
8. Do you own your home or rent? — Own House
9. Do you know your monthly household expenses? — Not yet
10. Your age — 42

### Additional questions

11. Annual documented income (ITR) — ₹4,20,000
12. Other household income you expect to rely on — ₹18,000
13. Credit score, if known — Not known
14. Unencumbered property or collateral value — ₹45,00,000
15. Any EMI bounced in the last 6 months? — No
16. Any app or short-term debt above 24%? — No
17. Preferred tenure — 5 years

The collateral question appears because Ravi is self-employed. The current form uses the challenge's collateral to route him to the secured business/LAP path.

## O1 — Should I borrow?

**BORROW LESS**

The ₹15L request is above the practical amount. Ravi's property establishes a secured route, while the wife's income improves borrower-safe household capacity. Because household expenses are unknown, the model uses a disclosed ₹7,500 maintenance floor rather than treating missing expenses as ₹0.

Confidence: **Low** because the credit score and household expenses are not known, and the income is self-employed.

## O2 — How much?

- Normalized borrower income: **₹35,000/month** from the ₹4.2L documented annual income
- Estimated lender-side capacity: **about ₹7.7L**
- Borrower-safe household amount: **about ₹6.0L**
- Collateral cap at 50% LTV: **₹22.5L**
- Practical amount to plan around: **about ₹6.0L**
- Safe EMI ceiling: **₹13,700/month**

The borrower-safe amount uses Ravi's normalized ₹35k borrower income plus his wife's ₹18k household income, then subtracts the ₹7,500 maintenance floor. The lender-side number uses Ravi's ₹35k normalized income only.

The practical amount is the lower of lender-side capacity and borrower-safe capacity, so the card uses about ₹6.0L. The ₹22.5L collateral cap is not the recommendation because income affordability is lower.

## O3 — What rate?

- Route: **Loan against property / secured business loan**
- Fair rate band: **11%–15%**
- All-in APR estimate: **about 12.6%–17.1%**
- Prototype processing fee: **2%**, about ₹12,042 on the borrower-safe amount

The secured route starts from the 10%–14% prototype band. Unknown credit does not add a separate penalty on this secured route in the current code, while non-salaried income adds 1 percentage point. The resulting 11%–15% band is illustrative.

The current implementation does **not** apply the documented fair-rate cap-buffer as a separate constant. It hard-codes the intended +1 pp cap behavior in the rate logic. This should be made explicit in code before submission.

## O4 — What EMI?

- Borrower-safe EMI ceiling: **about ₹13,700/month**
- Practical amount to plan around: **about ₹6.0L**
- Tenure used: **60 months**
- Tenure trade-off uses the practical amount at the 13% midpoint.
- 48 months: about **₹16.2k EMI**, about **₹1.7L total interest**
- 60 months: about **₹13.7k EMI**, about **₹2.2L total interest** — selected
- 72 months: about **₹12.1k EMI**, about **₹2.7L total interest**
- Stress income after a 15% drop: **₹29,750/month**
- Stress household income including wife's income: **₹47,750/month**
- Stressed safe EMI room: **about ₹12,350/month** after the 10% expense reduction
- Requested ₹15L EMI at the stressed rate of 17%: **about ₹37.3k/month**
- Stress result: **Buffer breaks**

The trade-off uses the practical amount because that is the amount the card recommends. The safe EMI ceiling is still shown separately because it is the household's monthly limit.

## Negotiation Card

The card should show:

- Recommended / practical amount: **about ₹6.0L**
- Lender-side estimate: **about ₹7.7L**
- Borrower-safe amount: **about ₹6.0L**
- Fair rate: **11%–15%**
- APR including fee: **about 12.6%–17.1%**
- EMI ceiling: **about ₹13,700/month**
- Route: **Loan against property / secured business loan**
- Verdict reason: the ₹15L request is above the practical amount after borrower-safe household affordability

I will add the result/card screenshots in this folder.
