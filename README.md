# Borrower Copilot

An intentionally small, local-only React/Vite borrower self-assessment and negotiation tool.

```bash
npm install
npm run dev
```

The browser app has no backend, login, database, API, or credit-bureau integration. Open the sample borrowers from the landing page or enter a profile manually. The decision system lives in [`src/domain/rules.js`](src/domain/rules.js), separate from React. Change `RULES` there to test a different FOIR, fee, LTV, or stress scenario.

```bash
npm test
npm run build
```

The outputs are planning estimates, not lender approvals. Rate bands and market references are illustrative and should be compared with a lender's KFS and quote.