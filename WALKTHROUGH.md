# Five-minute walkthrough

## Product

Borrower Copilot is a local borrower self-assessment for the Lokta outputs: borrow, don't borrow or borrow less; lender-side versus borrower-safe amount; fair rate and illustrative APR; and EMI with a stress check. It has no backend, login, bureau pull or stored personal data.

The form is adaptive. Must-answer questions are purpose, loan type, requested amount, income type, the matching income fields, existing EMI, housing, rent when renting, age and preferred tenure. Preferred tenure is required because EMI and APR depend on it. Rent can be ₹0, but a renter must explicitly answer the field.

Additional questions adapt to the profile. Self-employed borrowers get documented ITR income and collateral. Credit status separates known score, unknown score and no credit history; the score input appears only for a known score. Other household income is optional. Recent bounce and high-cost debt are risk questions.

## Core affordability

Lender-side capacity uses only borrower normalized income and existing EMI:

`lenderAvailable = max(0, income × 50% - existingEmi)`

Borrower-safe capacity uses normalized borrower income plus optional other household income, then subtracts existing EMI and rent:

`safeAvailable = max(0, (income + otherHouseholdIncome) × 40% - existingEmi - rent)`

There is no separate household-maintenance-expense input.

The loan amount is calculated from EMI headroom using the reducing-balance formula. For LAP, lender capacity is also capped by 50% illustrative LTV.

When the verdict is `DON'T BORROW`, the live preview and Negotiation Card show **₹0 as the amount to borrow now**. A positive borrower-safe number is a mathematical capacity check only.

## Priya

Priya is 29, salaried in Bengaluru, earns ₹1,10,000 net monthly, has a ₹14,000 car EMI, rents for ₹28,000/month, has a 780 score, and requests ₹8,00,000 for a wedding personal loan over 48 months.

### Questions shown: 15 total

**Must answer (10):** purpose, loan type, requested amount, salaried income type, monthly income, existing EMI, housing type, rent, age, preferred tenure.

**Additional (5):** other household income, credit status = known, credit score = 780, recent bounce, high-cost debt.

ITR and collateral are skipped.

### Outputs

- Normalized income: **₹1,10,000/month**
- Lender-side estimate: **about ₹15.3L**
- Borrower-safe amount: **about ₹74.6k**
- Absolute feasible ceiling: **about ₹74.6k**
- Planned EMI at the ceiling: **₹2,000/month**
- Rate: **9.5%–16.5%**
- APR: **about 11.1%–19.1%**
- Decision: **BORROW LESS**
- Confidence: High

Safe monthly room is `₹1,10,000 × 40% - ₹14,000 - ₹28,000 = ₹2,000`. The 15% income stress leaves ₹0 safe room, so the planned EMI does not survive the stress check. Stress is informational and does not change the base verdict.

## Ravi

Ravi is 42, self-employed in Mysuru. Cash income is ₹40,000–₹80,000/month, ITR income is ₹4,20,000/year, the shop is worth ₹45L and unencumbered, his wife earns ₹18,000/month, credit is unknown, and he requests ₹15L for business use over 60 months.

### Questions shown: 16 total

**Must answer (10):** purpose, loan type, requested amount, self-employed income type, lower income, higher income, existing EMI, housing type, age, preferred tenure.

**Additional (6):** ITR income, other household income, credit status = unknown, collateral, recent bounce, high-cost debt.

### Outputs

- Normalized borrower income: **₹35,000/month** from ITR income
- Lender-side estimate: **about ₹7.7L**
- Borrower-safe amount: **about ₹9.3L**
- Absolute feasible ceiling: **about ₹7.7L**
- Collateral cap: **₹22.5L**, not binding
- Planned EMI at the ceiling: **₹17,500/month**
- Rate: **11%–15%**
- APR: **about 12.6%–17.1%**
- Route: secured business/LAP
- Decision: **BORROW LESS**
- Confidence: Low

The lender calculation uses only Ravi's normalized ₹35,000 income. His wife's ₹18,000 is used only for borrower-safe capacity. Stress is shown separately and does not trigger the base verdict.

## Anita

Anita is 35 in Hubballi, earns ₹26,000–₹30,000 from variable work, has a ₹1,050 existing EMI, unknown credit, one recent bounce, high-cost app debt, and requests ₹1.5L for an electric scooter over 36 months.

### Questions shown: 14 total

**Must answer (10):** purpose, loan type, requested amount, variable income type, lower income, higher income, existing EMI, housing type, age, preferred tenure.

**Additional (4):** other household income, credit status = unknown, recent bounce, high-cost debt.

ITR, collateral and credit-score input are skipped.

### Outputs

- Normalized income: **₹27,400/month** using low + 35% of range
- Lender-side estimate: **about ₹3.3L**
- Borrower-safe amount: **about ₹2.6L**
- Absolute feasible ceiling: **about ₹2.6L**
- Mathematical safe EMI ceiling: **about ₹9,910/month**
- Rate: **17.5%–26.5%**
- APR: **about 20.7%–31.9%**
- Route: Two-wheeler loan
- Decision: **DON'T BORROW**
- Amount to borrow now: **₹0**
- Confidence: Low

The stop decision comes from high-cost debt plus a recent bounced EMI. The risk flags also raise the illustrative rate benchmark. The positive safe amount is only a mathematical capacity check.

## Negotiation Card

The card shows requested amount, lender-side estimate, borrower-safe amount, fair rate, APR including the illustrative processing fee, EMI, route, reasons and confidence. For `DON'T BORROW`, the primary amount and EMI-to-carry-now fields are both ₹0. It also lets the borrower compare a lender's nominal rate and APR against the prototype benchmark.

## What changes live

Changing income type changes which income fields are visible. Changing housing to rent reveals the rent field; ₹0 is valid when explicitly entered. Choosing known credit reveals the score field, while unknown and no-credit states reject a supplied score. Changing tenure changes EMI, APR and the tenure trade-off. Other household income changes borrower-safe capacity but never lender-side capacity. Risk flags change the rate benchmark and severe debt flags can change the base verdict.

## Submission notes

The domain logic is intentionally small and deterministic. `RULES.md` documents the current thresholds, adaptive questions, formulas, validation and limitations, and the three run-throughs mirror the current sample profiles and UI behaviour.
