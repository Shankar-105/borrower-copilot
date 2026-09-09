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
- Rent / expense input: ₹28,000/month
- Collateral: Not supplied

The challenge gives Priya ₹28,000 rent, not her complete household spending. For this run-through I enter ₹28,000 as the known household-expense input to show the expense-sensitive rule. In a real use, the borrower should enter total monthly household expenses excluding EMIs.

## Questions shown

1. What are you borrowing for? — Wedding or family event
2. What loan type are you considering? — Personal loan
3. How much do you want to borrow? — ₹8,00,000
4. How does your income arrive? — Salaried
5. Your usual monthly take-home — ₹1,10,000
6. Existing monthly EMIs — ₹14,000
7. Do you know your monthly household expenses? — Yes
8. Monthly household expenses, excluding EMIs — ₹28,000
9. Your age — 29
10. Credit score, if known — 780
11. Any EMI bounced in the last 6 months? — No
12. Any app or short-term debt above 24%? — No
13. Preferred tenure — 4 years

The collateral question is not shown because this is not a business/self-employed/LAP case.

## O1 — Should I borrow?

**BORROW LESS**

Priya's 40% borrower-safe FOIR ceiling is ₹44,000. After her ₹14,000 existing EMI and ₹28,000 known household expenses, only ₹2,000/month remains for a new EMI.

The ₹8L request is therefore far above the practical amount the model can support. The result does not treat the ₹28k expense as a separate check that can be ignored; it directly reduces the safe EMI ceiling.

Confidence: **High** because income, age, expenses and credit score are supplied, with no recent bounce or high-cost debt.

## O2 — How much?

- Estimated lender-side capacity: **about ₹15.3L**
- Borrower-safe amount: **about ₹0.75L**
- Practical amount to plan around: **about ₹0.75L**
- New safe EMI ceiling: **₹2,000/month**

The borrower should use the **₹0.75L practical amount**, not the lender-side estimate.

The lender-side number uses 50% FOIR and only the normalized borrower income. The borrower-safe number uses 40% of household income, then subtracts the existing EMI and the known household expenses.

The calculation is:

`₹1,10,000 × 40% = ₹44,000`

`₹44,000 - ₹14,000 - ₹28,000 = ₹2,000 safe new EMI`

## O3 — What rate?

- Fair rate band: **9.5%–16.5%**
- All-in APR estimate: **about 11.1%–19.1%**
- Prototype processing fee: **2%**, about ₹1,491 on the practical amount

The 780 score moves the personal-loan reference band down by 1.5 percentage points. The app still shows a range because the actual lender quote is not known.

## O4 — What EMI?

- Base safe EMI ceiling: **₹2,000/month**
- Practical amount: **about ₹0.75L**
- Tenure used: **48 months**
- Tenure trade-off on the practical amount at the 13% midpoint:
  - 36 months: about **₹2.5k EMI**, about **₹16k total interest**
  - 48 months: about **₹2.0k EMI**, about **₹21k total interest** — selected
  - 60 months: about **₹1.7k EMI**, about **₹27k total interest**
- Stress income after a 15% drop: **₹93,500/month**
- Stressed safe EMI room: **₹0/month** because ₹37,400 FOIR ceiling - ₹14,000 existing EMI - ₹28,000 expenses is below zero
- Requested ₹8L EMI at the stressed rate of 18.5%: **about ₹23.7k/month**
- Stress result: **Buffer breaks**

The trade-off now uses the practical amount, because that is the amount the card recommends.

## Negotiation Card

The card should show:

- Recommended / practical amount: **about ₹0.75L**
- Borrower-safe household ceiling: **about ₹0.75L**
- Fair rate: **9.5%–16.5%**
- APR including fee: **about 11.1%–19.1%**
- EMI ceiling: **₹2,000/month**
- Route: **Personal loan**
- Verdict reason: the ₹8L request is above the practical amount after existing EMI and household expenses

I will add the result/card screenshots in this folder.
