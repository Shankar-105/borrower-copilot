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
The form requires the visible minimum questions, including monthly household expenses excluding rent and EMIs. Blank numeric answers remain unknown and cannot be used to produce an assessment; an explicit zero existing EMI is valid.

## Build and test

```bash
npm test
npm run build
```

The main domain logic is in [`src/domain/rules.js`](./src/domain/rules.js) and is separate from the React UI. Domain tests are in `src/domain/rules.test.js`.

See `three-runs/` for the written run-throughs. They document the questions asked, outputs, decision reasoning and Negotiation Card for the three challenge borrowers.

## Rules

See [`RULES.md`](./RULES.md) for the current table of thresholds, bands, formulas, reasons and limits.

Important: the rate bands, FOIR, LTV, processing fee and stress values are prototype judgements. They are not promises from any lender and are not presented as universal RBI rules.

For a `DON'T BORROW` verdict, the UI shows ₹0 as the amount to borrow now. Any positive borrower-safe figure remains a mathematical capacity check, not a recommendation to take the loan.

## Five-minute walkthrough

[`WALKTHROUGH.md`](./WALKTHROUGH.md) contains the written walkthrough for the challenge. It covers the current product, the three borrowers, the actual rule structure, what I would build next and what I would cut.
