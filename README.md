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

The main domain logic is in [`src/domain/rules.js`](./src/domain/rules.js) and is separate from the React UI. Domain tests are in `src/domain/rules.test.js`.


See `three-runs/` for the written run-throughs. Add the screenshots from the actual app beside each `run.md` before submission.

## Rules

See [`RULES.md`](./RULES.md) for the current table of thresholds, bands, formulas, reasons and limits.

Important: the rate bands, FOIR, LTV, processing fee and stress values are prototype judgements. They are not promises from any lender and are not presented as universal RBI rules.

## Five-minute walkthrough

[`WALKTHROUGH.md`](./WALKTHROUGH.md) contains the written walkthrough for the challenge. It covers the current product, the three borrowers, the actual rule structure, what I would build next and what I would cut.
