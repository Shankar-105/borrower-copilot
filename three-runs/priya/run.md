# Priya — run-through

## Profile

- Age: 29
- City: Bengaluru
- Income: salaried
- Net monthly income: ₹1,10,000
- Existing EMI: ₹14,000 for car loan
- Credit score: 780
- Purpose: wedding
- Loan type: personal loan
- Requested amount: ₹8,00,000
- Tenure: 48 months
- Recent bounce: No
- High-cost debt above 24%: No
- Rent: ₹28,000/month
- General maintenance input: ₹0/month in the prefilled sample
- Collateral: Not supplied

The challenge gives Priya ₹28,000 rent, not her complete household spending. The current app keeps rent separate from general household maintenance. In the prefilled challenge run, general maintenance is entered as ₹0 to test the protective minimum-expense floor. The model raises that value to ₹7,500 rather than treating it as a real zero-spend household.

## Questions shown

### Must answer

1. What are you borrowing for? — Wedding or family event
2. What loan type are you considering? — Personal loan
3. How much do you want to borrow? — ₹8,00,000
4. How does your income arrive? — Salaried
5. Your usual monthly take-home — ₹1,10,000
6. Existing monthly EMIs — ₹14,000
7. Do you own your home or rent? — Rent
8. Monthly rent — ₹28,000
9. Do you know your monthly household expenses? — Yes
10. Monthly general maintenance, excluding rent and EMIs — ₹0
11. Your age — 29

### Additional questions

12. Credit score, if known — 780
13. Any EMI bounced in the last 6 months? — No
14. Any app or short-term debt above 24%? — No
15. Preferred tenure — 4 years

The collateral question is not shown because this is not a business/self-employed/LAP case. Other household income is also not shown for a salaried borrower.

## O1 — Should I borrow?

**DON'T BORROW**

Priya's 40% borrower-safe FOIR ceiling is ₹44,000. After her ₹14,000 existing EMI, ₹28,000 rent and the ₹7,500 protective maintenance floor, there is no safe room left for a new EMI.

The ₹8L request is therefore not supportable under the borrower-safe calculation.

Confidence: **High** because income, age, rent, expense status and credit score are supplied, with no recent bounce or high-cost debt.

## O2 — How much?

- Estimated lender-side capacity: **about ₹15.3L**
- Borrower-safe amount: **₹0**
- Absolute feasible ceiling: **₹0**
- Practical amount to plan around: **₹0**
- New safe EMI ceiling: **₹0/month**

The borrower should **not use the lender-side estimate as a personal affordability target**. The current model says there is no borrower-safe room for a new loan under these inputs.

The calculation is:

`₹1,10,000 × 40% = ₹44,000`

`₹44,000 - ₹14,000 existing EMI - ₹28,000 rent - ₹7,500 maintenance floor < ₹0`

So the safe new EMI is `₹0` and the absolute feasible ceiling is `₹0`.

## O3 — What rate?

- Route: **Personal loan**
- Rate band: **9.5%–16.5%**
- All-in APR estimate: **0%–0%** because the absolute feasible ceiling is ₹0
- Prototype processing fee: **2%**, ₹0 on the absolute feasible ceiling

The 780 score moves the personal-loan reference band down by 1.5 percentage points. The rate band is illustrative. APR is not manufactured when there is no feasible principal to benchmark.

## O4 — What EMI?

- Base safe EMI ceiling: **₹0/month**
- Absolute feasible ceiling: **₹0**
- Practical amount: **₹0**
- Tenure used: **48 months**
- Tenure trade-off: all displayed principal/interest values are ₹0 because the practical amount is ₹0
- Stress income after a 15% drop: **₹93,500/month**
- Stressed safe EMI room: **₹0/month**
- Requested ₹8L EMI at the stressed rate of 18.5%: **about ₹23.7k/month**
- Stress result: **Buffer breaks**

The stress case reinforces that the requested loan is not resilient. It does not change the base verdict because the base verdict is already DON'T BORROW.

## Negotiation Card

The card should show:

- Absolute feasible ceiling: **₹0**
- Lender-side estimate: **about ₹15.3L**
- Borrower-safe amount: **₹0**
- Rate: **9.5%–16.5%**
- APR including fee: **0%–0%** because there is no feasible principal
- EMI ceiling: **₹0/month**
- Route: **Personal loan**
- Verdict reason: the conservative borrower-safe calculation has no remaining EMI room after existing EMI, rent and the maintenance floor

I will add the result/card screenshots in this folder.
