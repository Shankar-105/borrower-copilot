# Borrower Copilot

A local React/Vite app for the Lokta Borrower Copilot challenge.

The app helps an Indian borrower answer four questions before speaking to a lender:

1. Should I borrow?
2. How much might a lender size, and how much can I safely carry?
3. What rate should I compare against?
4. What EMI should I agree to?

It also gives a one-screen Negotiation Card.

## Run locally

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

There is no backend, login, database, API or credit-bureau pull. The answers stay in the browser.

## Build and test

```bash
npm test
npm run build
```

The main domain logic is in `src/domain/rules.js` and is separate from the React UI.

## What is in the app

- Adaptive questions based on income type, purpose and loan type.
- Must-set questions for purpose, loan type, amount, income, existing EMIs, household expenses, age and credit score if known.
- Conservative income normalization for self-employed and variable income.
- Lender-side and borrower-safe EMI ceilings.
- Household-expense check when the borrower knows the number.
- Personal, business, secured/LAP and two-wheeler routes.
- Rate bands with explicit adjustments for credit uncertainty, income type, recent bounce and high-cost debt.
- All-in APR estimate with the processing fee included.
- A stress case with lower income and a higher rate.
- A numeric tenure trade-off showing EMI and total interest for nearby terms.
- Confidence based on missing or uncertain information.
- Borrow / Borrow Less / Don't Borrow verdicts.
- Negotiation Card with a lender quote comparison.

## Challenge borrowers

The app has the three borrowers from the challenge as prefilled examples:

- Priya — Bengaluru, salaried, ₹1.10L net income, ₹14k car EMI, score 780, ₹8L wedding loan.
- Ravi — Mysuru, self-employed, ₹4.2L documented annual income, ₹45L unencumbered shop, ₹15L business borrowing request.
- Anita — Hubballi, variable income, existing app debt, recent bounce, ₹1.5L vehicle request.

See `three-runs/` for the written run-throughs. Add the screenshots from the actual app beside each `run.md` before submission.

## Rules

See `RULES.md` for the full table of thresholds, bands, formulas, reasons and limits.

Important: the rate bands, FOIR, LTV, processing fee and stress values are prototype judgements. They are not promises from any lender and are not presented as universal RBI rules.

## Five-minute walkthrough

`WALKTHROUGH.md` contains the written walkthrough for the challenge. It covers the product, the three borrowers, the rule structure, what I would build next and what I would cut.

## Submission checklist

- [x] Working local app
- [x] `RULES.md`
- [x] Three written run-throughs in `three-runs/`
- [x] Negotiation Card in the result screen
- [x] Written five-minute walkthrough in `WALKTHROUGH.md`
- [ ] Add Priya screenshots
- [ ] Add Ravi screenshots
- [ ] Add Anita screenshots

## Limits

This is a planning tool, not an approval system. It does not know the actual bureau report, lender underwriting rules, verified income or expenses, exact collateral value, lender rate card, or full KFS terms. The borrower should compare the actual lender quote and KFS with the card.
