# Borrower Copilot

An intentionally small, local-only React/Vite borrower self-assessment and negotiation tool for the Lokta build challenge.

## Run locally

```bash
npm install
npm run dev
```

The browser app has no backend, login, database, API, or credit-bureau integration. Open the sample borrowers from the landing page or enter a profile manually.

## Domain rules

The decision system lives in [`src/domain/rules.js`](src/domain/rules.js), separate from React. Major assumptions are centralized in `RULES` so FOIR, processing fee, LTV and stress assumptions can be changed without editing UI code.

See [`RULES.md`](RULES.md) for the complete table of rules, thresholds, bands, assumptions, rationale and limitations.

## Tests and build

```bash
npm test
npm run build
```

The domain tests cover EMI/reverse-principal calculations, income normalization, lender-vs-safe capacity, Ravi's secured route, Anita's don't-borrow state, and invalid/missing inputs.

## Challenge cases

The app includes prefilled Priya, Ravi and Anita profiles from the challenge so the complete decision flow can be inspected quickly.

The final submission should include a root-level `three-runs/` directory containing the three recorded/screenshot run-throughs (Priya, Ravi, Anita) and the questions, four outputs and Negotiation Card for each. A written walkthrough is acceptable; screenshots are included as supporting evidence.

## Important limitations

The outputs are planning estimates, not lender approvals. Rate bands and market references are illustrative and should be compared with a lender's KFS and quote. Prototype thresholds such as FOIR, LTV, processing fee and stress assumptions are explicitly documented as judgement/assumptions in `RULES.md` rather than presented as universal regulatory requirements.
