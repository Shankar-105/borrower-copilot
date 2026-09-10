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

## What is in the app

- Adaptive questions based on income type, purpose, loan type and whether the borrower needs a secured route.
- A small must-set for purpose, loan type, amount, income, existing EMIs, housing, expenses and age; credit score and other risk/product details are additional questions.
- Other household income for borrowers who expect to rely on it; this affects borrower-safe household capacity but is not silently treated as lender/co-applicant income.
- Conservative income normalization: salaried income uses net salary; self-employed borrowers use documented annual income when supplied, otherwise a 35% point inside the reported income range; variable/informal income uses the same range rule.
- Separate lender-side and borrower-safe EMI ceilings.
- Known general household expenses are used with rent separately. A minimum ₹7,500 maintenance floor protects against an unrealistically low known expense value.
- Unknown household expenses are never treated as ₹0; the current implementation uses the ₹7,500 maintenance floor and lowers confidence.
- Personal, business, secured/LAP and two-wheeler routes. Ravi's collateral routes him to secured business/LAP; unsecured business remains reachable when no collateral is supplied.
- Rate bands with credit and income adjustments. Recent bounce and high-cost debt remain risk flags and can affect the borrowing decision without being stacked as extra rate penalties.
- All-in APR estimate with the 2% processing fee included. APR is calculated only on the absolute feasible ceiling, so the amount, fee and APR refer to the same conservative maximum planning principal.
- A stress case with lower borrower income. The current implementation also reduces household expense load by 10% under stress; only the secured/LAP route applies the configured 2 percentage-point rate stress.
- A numeric tenure trade-off showing EMI and total interest for nearby terms.
- Confidence based on missing or uncertain information.
- Borrow / Borrow Less / Don't Borrow verdicts. High-cost debt together with a recent bounce always triggers DON'T BORROW.
- Negotiation Card with a lender quote comparison.

## Challenge borrowers

The app has the three borrowers from the challenge as prefilled examples:

- Priya — Bengaluru, salaried, ₹1.10L net income, ₹14k car EMI, score 780, ₹28k rent and zero entered general maintenance. The current protective ₹7.5k maintenance floor leaves **₹0 borrower-safe EMI and ₹0 borrower-safe amount**, so the current verdict is **DON'T BORROW**.
- Ravi — Mysuru, self-employed, ₹4.2L documented annual income, wife earns ₹18k/month, ₹45L unencumbered shop, ₹15L business borrowing request. The current model normalizes Ravi to ₹35k/month, routes him to secured business/LAP and gives a borrower-safe and absolute feasible ceiling of about **₹6.0L**.
- Anita — Hubballi, variable income, existing app debt, recent bounce, ₹1.5L vehicle request. The current model gives a mathematical borrower-safe and absolute feasible ceiling of about **₹0.68L**, but the severe-debt guard returns **DON'T BORROW**.

See `three-runs/` for the written run-throughs. Add the screenshots from the actual app beside each `run.md` before submission.

## Rules

See [`RULES.md`](./RULES.md) for the current table of thresholds, bands, formulas, reasons and limits.

Important: the rate bands, FOIR, LTV, processing fee, expense floor/proxy and stress values are prototype judgements. They are not promises from any lender and are not presented as universal RBI rules.

## Five-minute walkthrough

[`WALKTHROUGH.md`](./WALKTHROUGH.md) contains the written walkthrough for the challenge. It covers the current product, the three borrowers, the actual rule structure, what I would build next and what I would cut.
