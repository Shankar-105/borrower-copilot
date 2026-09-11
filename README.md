# Borrower Copilot

React app for Lokta challenge. Basically, it's a tool for Indian borrowers to figure out if they should take a loan, how much they can actually afford, and what rate is fair before they go to a bank.

## How to run
Need Node.js 20+.

```bash
npm ci
npm run dev
```
Just open the URL in the terminal. No backend or DB used, everything is local.

## How it works
- Must-answer fields: Basic stuff like loan purpose, amount, income, EMI, age, and tenure.
- Adaptive fields: Extra questions (like ITR for self-employed or collateral) only show up if they actually help the numbers.
- Everything is in the browser, no data is stored.

## Testing & Logic
```bash
npm test
npm run build
```
Logic is kept separate from UI in `src/domain/rules.js`. Tests are in `src/domain/rules.test.js`.

## Docs
- All thresholds and formulas are in `RULES.md`.
- Case studies for Priya, Ravi, and Anita are in `three-runs/`.
- Overall walkthrough is in `WALKTHROUGH.md`.
