# Borrower Copilot - Rules

This is a self-assessment tool, not a bank's approval system. The app won't show results until all must-answer questions are filled.

## Main Assumptions

| What | Value | Why | Source |
|---|---:|---|---|
| Lender FOIR | 50% | Standard bank limit | Judgement |
| Safe FOIR | 40% | Buffer for the borrower | Judgement |
| Processing fee | 2% | Average fee for APR | Judgement |
| Stress income drop | 15% | To check if borrower can survive a dip | Judgement |
| LAP rate stress | +2% | Rate hike scenario for secured loans | Judgement |
| Tenure | 12-84 months | Common loan periods | Judgement |
| Retirement age | 60 | Max repayment age | Judgement |
| Secured LTV | 50% | Conservative cap for property | Judgement |
| Variable income | Low + 35% of range | Stops peak months from skewing income | Judgement |
| Bounce penalty | +1.5% | Higher risk if payment bounced | Judgement |
| High-cost debt penalty | +2% | Risk if already in app-loan trap | Judgement |

## Questions

### Must answer
Purpose, Loan type, Amount, Income type (and matching fields), Existing EMI, Housing (Rent/Own), Rent (if renting), Age, and Tenure.

### Additional (Adaptive)
- Other household income: Only used for safe amount, not lender size.
- ITR income: For self-employed only.
- Collateral: For business/LAP/self-employed.
- Credit Score: Shown only if borrower says they know it.
- Bounces/High-cost debt: Used for rate and decision.

## Income Logic
- Salaried: Net monthly income.
- Self-employed (with ITR): `ITR / 12`.
- Others: `Low + 35% * (High - Low)`.

## Affordability
Lender-side: `(Income * 50%) - Existing EMI`.
Borrower-safe: `((Income + Household Income) * 40%) - Existing EMI - Rent`.

## Rate Bands
- Personal: 11%–18%
- Business: 12%–20%
- LAP: 10%–14%
- Two-wheeler: 11%–19%

**Credit Logic:**
- Known score (750+): -1.5%
- Known score (700-749): 0%
- Known score (<700): +2.5%
- Unknown/No credit: Range shifts up and widens (adds 2-3% to max) because of uncertainty.
- Non-salaried: +1%

## Decision Logic
1. `DON'T BORROW`: If safe capacity is 0, or if they have both a recent bounce AND high-cost debt, or if existing EMI > 60% of income (Debt Trap).
2. `BORROW LESS`: If they ask for more than the absolute ceiling (min of lender and safe amount).
3. `BORROW`: If it fits in the ceiling.

## Stress & APR
- Stress: Drops income by 15%. For LAP, adds 2% to rate. Just for info, doesn't change the main verdict.
- APR: Uses a 2% fee. Calculated using bisection method on the absolute ceiling.
