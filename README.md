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

The core form has a small must-answer set: purpose, loan type, requested amount, income type and the matching income fields, existing EMI, housing type, rent when renting, age and preferred tenure. Rent can be ₹0, but a renter must explicitly answer the field. Preferred tenure is required because EMI and APR depend on it.

Additional questions adapt to the profile. Self-employed borrowers can provide documented ITR income and collateral; other household income is optional; credit status separates known score, unknown score and no credit history; the score field appears only for a known score. Risk questions cover recent bounce and high-cost debt.

## Build and test

```bash
npm test
npm run build
```

The main domain logic is in [`src/domain/rules.js`](./src/domain/rules.js) and is separate from the React UI. Domain tests are in `src/domain/rules.test.js`.

## Rules

See [`RULES.md`](./RULES.md) for the current table of thresholds, bands, formulas, validation, adaptive questions and limitations. The documentation is intentionally explicit about which values are prototype judgement versus borrower-provided data.

Important: the rate bands, FOIR, LTV, processing fee and stress values are prototype judgements. They are not promises from any lender and are not presented as universal RBI rules.

The borrower-safe calculation uses normalized borrower income, optional other household income, existing EMI and rent. It does **not** ask for or use a separate household-maintenance-expense number.

For a `DON'T BORROW` verdict, the UI shows ₹0 as the amount to borrow now. Any positive borrower-safe figure remains a mathematical capacity check, not a recommendation to take the loan.

Stress is shown as a separate resilience check. It does not automatically change the base verdict.

## Challenge run-throughs

See `three-runs/` for the written run-throughs. They document the actual adaptive questions, outputs, decision reasoning and Negotiation Card for Priya, Ravi and Anita.

## Five-minute walkthrough

[`WALKTHROUGH.md`](./WALKTHROUGH.md) contains the written walkthrough for the challenge. It covers the current product, the three borrowers, the actual rule structure and the limits of this prototype.
