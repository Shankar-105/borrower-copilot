# Walkthrough: Borrower Copilot

## Project Overview
The Borrower Copilot is a self-assessment tool designed for Indian borrowers. The main goal is to bridge the information gap between a borrower and a lender. Usually, borrowers walk into a bank blind and just accept whatever sanction letter they get. This app gives them the numbers first—should they borrow, how much is safe, and what rate is fair—so they can actually negotiate.

Everything is built locally. There is no backend, no database, and no API calls. All calculations happen in the browser, meaning the borrower's data never leaves their device.

## The Core Engine (The "Brains")
One of the main engineering decisions here was to completely separate the domain logic from the React UI. All the math and rules live in `src/domain/rules.js`. This ensures that the logic is deterministic—given the same inputs, you always get the same output—and it allows us to write rigorous unit tests in `rules.test.js` without having to simulate UI clicks.

**The sequential execution flow inside the engine:**

1. **Input Cleaning & Normalization:** 
   The engine first handles the "messiness" of Indian income. 
   - For salaried employees, it's simple net monthly income.
   - For self-employed or informal workers, it's trickier. We use the documented ITR if available ($\text{Annual ITR} \div 12$). If not, we use a conservative formula: $\text{Low Income} + 35\% \text{ of the range}$. This is crucial because it stops one or two "peak months" from making the borrower look richer than they are, which would lead to over-borrowing.

2. **The Two-Track Affordability Analysis:**
   The app calculates two different ceilings because a bank's logic is different from a borrower's safety logic.
   - **Lender-Side Track:** This simulates a bank's FOIR (Fixed Obligation to Income Ratio) of $50\%$. It calculates $\text{Income} \times 0.5$ and subtracts existing EMIs. This is what the bank is *likely* to sanction.
   - **Borrower-Safe Track:** This is the "conservative" view. It uses a $40\%$ FOIR and adds optional other household income (like a spouse's earnings) but then subtracts both existing EMIs **and** monthly rent. This tells the borrower what they can actually carry without sacrificing their quality of life.

3. **Product Routing:**
   Based on the borrower's purpose and available collateral, the engine routes them to a specific product:
   - If there's a business purpose and they have property, it routes to **LAP (Loan Against Property)**.
   - If it's for a vehicle, it goes to a **Two-Wheeler Loan**.
   - Otherwise, it defaults to a **Personal Loan**.
   Routing is key because a secured loan (LAP) gets much better rates than an unsecured personal loan.

4. **Dynamic Rate Benchmarking:**
   Instead of a single number, we provide a rate band.
   - It starts with a base range for the product (e.g., $11\%-18\%$ for Personal).
   - **Credit Modifiers:** A score $\ge 750$ shifts the band down. A weak score or "No Credit" shifts it up.
   - **Confidence Widening:** If credit is "Unknown," we don't just shift the rate up; we **widen** the band. This reflects the uncertainty—the bank might give a great rate or a terrible one, and the borrower needs to be prepared for both.
   - **Risk Penalties:** Recent payment bounces or high-cost "app loans" add penalty points (e.g., $+1.5\%$ to $+2\%$) to the benchmark.

5. **Calculating the Absolute Ceiling:**
   The "Absolute Feasible Ceiling" is the $\min(\text{Lender Amount}, \text{Safe Amount})$. For LAP loans, we also apply a $50\%$ LTV (Loan-to-Value) cap on the property. This prevents the borrower from borrowing more than the property can realistically support.

6. **The Final Verdict:**
   The engine then makes a decision:
   - `DON'T BORROW`: If safe room is $\le 0$, or if they have both a recent bounce AND high-cost debt, or if their existing EMIs are $> 60\%$ of income (the "Debt Trap" threshold).
   - `BORROW LESS`: If the requested amount is higher than the Absolute Feasible Ceiling.
   - `BORROW`: If the request fits within both the lender and safe limits.

## Case Study Analysis

### Priya (The Salaried Professional)
Priya earns ₹1.1L/month but has a car loan (₹14k) and high rent (₹28k). Despite a great credit score (780), her "Safe Room" is tiny (~₹2k). Because her basic living costs are so high, the app tells her to **BORROW LESS**. It teaches her that a high credit score doesn't mean you can afford a high EMI.

### Ravi (The Self-Employed Owner)
Ravi has a ₹45L shop, but his documented income is only ₹35k/month. While the property (collateral) could theoretically back a ₹22.5L loan, his income can't support the monthly payments for the ₹15L he wants. The app identifies that the lender will cap him based on income, not property, resulting in a **BORROW LESS** verdict.

### Anita (The Informal Worker)
Anita earns ~₹27.4k/month and has a few app loans. She has a recent payment bounce and existing high-cost debt. Even though she has some mathematical room for a small loan, the engine triggers the "Debt Trap" risk. The verdict is **DON'T BORROW**, and the amount is set to ₹0 to prevent further financial distress.

## The Negotiation Card & Final Outputs
The final result is a **Negotiation Card**. It doesn't just give a number; it gives a strategy.
- **APR Calculation:** We calculate the all-in APR using a bisection method, assuming a $2\%$ processing fee. This is critical because lenders often quote "nominal rates" and hide fees.
- **Tenure Trade-off:** The app shows how changing the tenure (e.g., from 3 to 5 years) affects the EMI and the total interest paid.
- **Stress Test:** We simulate a $15\%$ income drop. If the EMI no longer fits in the safe room, the app warns the borrower that the loan is "unstable."

## Summary of Engineering Choices
- **Separation of Concerns:** UI (React) $\leftrightarrow$ Logic (`rules.js`).
- **Conservative Defaults:** "Unknown" is never treated as zero; it's treated as a risk that widens the rate band.
- **Transparency:** Every number (like the ₹22k ceiling) is accompanied by a "Why" sentence so the borrower can explain their position to the lender.
