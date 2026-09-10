import { describe, expect, it } from 'vitest'
import { calculateEmi, calculateMaximumPrincipal, evaluateBorrower, normalizeIncome, RULES, SAMPLE_BORROWERS } from './rules'

describe('Borrower Copilot domain rules', () => {
  it('calculates reducing-balance EMI and reverses it', () => {
    const emi = calculateEmi(800000, 12, 48)
    expect(emi).toBeCloseTo(21067, -1)
    expect(calculateMaximumPrincipal(emi, 12, 48)).toBeCloseTo(800000, -1)
  })

  it('uses documented monthly income for self-employed borrowers when available', () => {
    expect(normalizeIncome({ incomeType: 'variable', incomeLow: 40000, incomeHigh: 80000 }).monthly).toBe(54000)
    expect(normalizeIncome({ incomeType: 'self-employed', monthlyIncome: 60000, incomeLow: 40000, incomeHigh: 80000, documentedAnnualIncome: 420000 }).monthly).toBe(35000)
  })

  it('uses the stable range for self-employed borrowers without documented income', () => {
    expect(normalizeIncome({ incomeType: 'self-employed', incomeLow: 40000, incomeHigh: 80000, documentedAnnualIncome: 0 }).monthly).toBe(54000)
  })

  it('keeps lender capacity separate from borrower-safe capacity', () => {
    const result = evaluateBorrower(SAMPLE_BORROWERS.Priya)
    expect(result.affordability.lenderAvailable).toBeGreaterThan(result.affordability.safeAvailable)
    expect(result.lenderAmount).toBeGreaterThan(result.safeAmount)
    expect(result.decision).toBe('DON’T BORROW')
  })

  it('subtracts known household expenses inside the borrower-safe FOIR calculation', () => {
    const result = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, housingType: 'own', monthlyRent: 0, expensesKnown: true, monthlyExpenses: 28000 })
    expect(result.affordability.safeAvailable).toBe(2000)
    expect(result.recommendedEmi).toBeCloseTo(2000, 0)
    expect(result.safeAmount).toBeGreaterThan(0)
    expect(result.safeAmount).toBeLessThan(100000)
  })

  it('enforces the maintenance floor when known expenses are entered below it', () => {
    const result = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, housingType: 'own', monthlyRent: 0, expensesKnown: true, monthlyExpenses: 0 })
    expect(result.affordability.generalMaintenance).toBe(RULES.minimumExpenseFloor)
    expect(result.affordability.monthlyExpenses).toBe(RULES.minimumExpenseFloor)
    expect(result.affordability.expensesAssumed).toBe(true)
  })

  it('requires rent for renters instead of treating missing rent as zero', () => {
    const result = evaluateBorrower({ ...SAMPLE_BORROWERS.Ravi, housingType: 'rent', monthlyRent: 0 })
    expect(result.affordability.rentMissing).toBe(true)
    expect(result.affordability.rentObligation).toBe(0)
    expect(result.affordability.safeAvailable).toBe(0)
  })

  it('uses zero rent for owned homes regardless of stale rent input', () => {
    const result = evaluateBorrower({ ...SAMPLE_BORROWERS.Ravi, housingType: 'own', monthlyRent: 28000 })
    expect(result.affordability.rentMissing).toBe(false)
    expect(result.affordability.rentObligation).toBe(0)
  })

  it('sizes the recommended EMI to the requested principal within the feasible ceiling', () => {
    const result = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, housingType: 'own', monthlyRent: 0, expensesKnown: false, requestedAmount: 50000 })
    expect(result.recommendedEmi).toBeCloseTo(calculateEmi(50000, (result.rate.min + result.rate.max) / 2, result.tenure), 5)
    expect(result.recommendedEmi).toBeLessThan(result.affordability.safeAvailable)
  })

  it('uses an explicit minimum expense floor when household expenses are unknown', () => {
    const result = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, housingType: 'own', monthlyRent: 0, expensesKnown: false, monthlyExpenses: null })
    expect(result.affordability.expensesAssumed).toBe(true)
    expect(result.affordability.expensesUsed).toBe(RULES.minimumExpenseFloor)
    expect(result.affordability.safeAvailable).toBe(22500)
    expect(result.confidence.level).toBe('Medium')
  })

  it('uses known household expenses to reduce the borrower-safe headroom', () => {
    const base = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, housingType: 'own', monthlyRent: 0, expensesKnown: false, monthlyExpenses: null })
    const withExpenses = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, housingType: 'own', monthlyRent: 0, expensesKnown: true, monthlyExpenses: 75000 })
    expect(withExpenses.affordability.safeAvailable).toBeLessThan(base.affordability.safeAvailable)
    expect(withExpenses.safeAmount).toBeLessThan(base.safeAmount)
  })

  it('routes Ravi to secured business finance and accounts for collateral conservatively', () => {
    const result = evaluateBorrower(SAMPLE_BORROWERS.Ravi)
    expect(result.route.key).toBe('lap')
    expect(result.route.product).toContain('secured business')
    expect(result.confidence.level).toBe('Low')
    expect(result.affordability.householdIncome).toBe(53000)
    expect(result.affordability.expensesAssumed).toBe(true)
    expect(result.safeAmount).toBeLessThanOrEqual(SAMPLE_BORROWERS.Ravi.collateralValue * RULES.securedLtv)
  })

  it('keeps borrower-safe capacity independent from collateral value', () => {
    const result = evaluateBorrower({ ...SAMPLE_BORROWERS.Ravi, collateralValue: 100000 })
    expect(result.lenderAmount).toBeLessThanOrEqual(50000)
    expect(result.safeAmount).toBeGreaterThan(result.lenderAmount)
  })

  it('applies rate-rise stress only to floating-rate secured routes', () => {
    const fixed = evaluateBorrower(SAMPLE_BORROWERS.Priya)
    const secured = evaluateBorrower(SAMPLE_BORROWERS.Ravi)
    expect(fixed.stress.requestedEmi).toBeCloseTo(calculateEmi(fixed.requested, fixed.rate.max, fixed.tenure), 5)
    expect(secured.stress.requestedEmi).toBeGreaterThan(calculateEmi(secured.requested, secured.rate.max, secured.tenure))
  })

  it('keeps unsecured business routing available when no collateral is supplied', () => {
    const result = evaluateBorrower({ ...SAMPLE_BORROWERS.Ravi, collateralValue: 0 })
    expect(result.route.key).toBe('business')
  })

  it('keeps the rate benchmark honest without a hidden cap', () => {
    const result = evaluateBorrower(SAMPLE_BORROWERS.Anita)
    expect(result.rate.riskFlags).toEqual(['recent bounced payment', 'high-cost debt'])
    expect(result.rate.max).toBe(23)
    expect(result.rate.min).toBeLessThanOrEqual(result.rate.max)
  })

  it('does not allow a request above the safe amount to pass as BORROW', () => {
    const result = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, housingType: 'own', monthlyRent: 0, requestedAmount: 1200000, expensesKnown: false })
    expect(result.decision).toBe('BORROW LESS')
  })

  it('uses the institutional boundary when it is stricter than safe cash flow', () => {
    const result = evaluateBorrower({ ...SAMPLE_BORROWERS.Ravi, collateralValue: 100000, requestedAmount: 100000 })
    expect(result.lenderAmount).toBeLessThan(result.safeAmount)
    expect(result.absoluteFeasibleCeiling).toBe(result.lenderAmount)
    expect(result.decisionReason).toContain('lender-side estimate')
  })

  it('returns dont-borrow for Anita when severe debt risk is present', () => {
    const result = evaluateBorrower(SAMPLE_BORROWERS.Anita)
    expect(result.decision).toBe('DON’T BORROW')
    expect(result.decisionReason).toContain('high-cost debt')
    expect(result.rate.max).toBeGreaterThan(result.rate.min)
    expect(result.stress.survives).toBe(false)
  })

  it('calculates APR from the absolute feasible ceiling', () => {
    const result = evaluateBorrower(SAMPLE_BORROWERS.Ravi)
    expect(result.absoluteFeasibleCeiling).toBeCloseTo(result.safeAmount, 5)
    expect(result.apr.fee).toBeCloseTo(result.absoluteFeasibleCeiling * RULES.processingFee, 5)
  })

  it('keeps age in the tenure calculation when a borrower is close to the age limit', () => {
    const result = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, age: 58, tenureMonths: 48 })
    expect(result.tenure).toBe(24)
  })

  it('shows a real tenure tradeoff around the selected term', () => {
    const result = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, housingType: 'own', monthlyRent: 0, expensesKnown: false, monthlyExpenses: null })
    expect(result.tenureTradeoff.length).toBe(3)
    expect(result.tenureTradeoff.find((option) => option.months === 36).emi).toBeGreaterThan(result.tenureTradeoff.find((option) => option.months === 48).emi)
    expect(result.tenureTradeoff.find((option) => option.months === 60).emi).toBeLessThan(result.tenureTradeoff.find((option) => option.months === 48).emi)
    expect(result.tenureTradeoff.find((option) => option.months === 60).totalInterest).toBeGreaterThan(result.tenureTradeoff.find((option) => option.months === 48).totalInterest)
  })

  it('does not invent an APR when the absolute feasible ceiling is zero', () => {
    const result = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, housingType: 'own', monthlyRent: 0, existingEmi: 60000, expensesKnown: true, monthlyExpenses: 60000 })
    expect(result.absoluteFeasibleCeiling).toBe(0)
    expect(result.apr.min).toBe(0)
    expect(result.apr.max).toBe(0)
    expect(result.apr.fee).toBe(0)
  })

  it('never emits invalid values for missing income', () => {
    const result = evaluateBorrower({ incomeType: 'variable', requestedAmount: 100000, tenureMonths: 48 })
    const values = [result.safeAmount, result.lenderAmount, result.recommendedEmi, result.apr.min, result.apr.max]
    expect(values.every(Number.isFinite)).toBe(true)
    expect(values.every((value) => value >= 0)).toBe(true)
  })
})
