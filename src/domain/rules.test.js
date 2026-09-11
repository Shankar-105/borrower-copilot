import { describe, expect, it } from 'vitest'
import { calculateEmi, calculateMaximumPrincipal, evaluateBorrower, normalizeIncome, RULES, SAMPLE_BORROWERS } from './rules'

describe('Borrower Copilot core rules', () => {
  it('locks the central affordability assumptions', () => {
    expect(RULES.lenderFoir).toBe(0.5)
    expect(RULES.safeFoir).toBe(0.4)
    expect(RULES.processingFee).toBe(0.02)
    expect(RULES.stressIncomeDrop).toBe(0.15)
    expect(RULES.stressRateIncrease).toBe(0.02)
  })

  it('calculates EMI and reverses the principal', () => {
    const emi = calculateEmi(800000, 12, 48)
    expect(emi).toBeCloseTo(21067, 0)
    expect(calculateMaximumPrincipal(emi, 12, 48)).toBeCloseTo(800000, 0)
  })

  it('uses documented income instead of the income range when available', () => {
    expect(normalizeIncome({ incomeType: 'self-employed', incomeLow: 40000, incomeHigh: 80000, documentedAnnualIncome: 420000 }).monthly).toBe(35000)
    expect(normalizeIncome({ incomeType: 'variable', incomeLow: 40000, incomeHigh: 80000 }).monthly).toBe(54000)
  })

  it('requires rent for renters and assumes zero rent only for owners', () => {
    const missingRent = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, housingType: 'rent', monthlyRent: 0 })
    const owner = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, housingType: 'own', monthlyRent: 28000 })
    expect(missingRent.affordability.rentMissing).toBe(true)
    expect(missingRent.affordability.safeAvailable).toBe(0)
    expect(owner.affordability.rentObligation).toBe(0)
  })

  it('keeps lender capacity independent from other household income', () => {
    const base = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, otherHouseholdIncome: 0 })
    const withOtherIncome = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, otherHouseholdIncome: 50000 })
    expect(withOtherIncome.lenderAmount).toBe(base.lenderAmount)
    expect(withOtherIncome.safeAmount).toBeGreaterThan(base.safeAmount)
  })

  it('routes Ravi to secured finance and respects the collateral cap', () => {
    const result = evaluateBorrower(SAMPLE_BORROWERS.Ravi)
    expect(result.route.key).toBe('lap')
    expect(result.lenderAmount).toBeLessThanOrEqual(4500000 * RULES.securedLtv)
  })

  it('produces the required distinct challenge decisions', () => {
    expect(evaluateBorrower(SAMPLE_BORROWERS.Priya).decision).toBe('BORROW LESS')
    expect(evaluateBorrower(SAMPLE_BORROWERS.Ravi).decision).toBe('BORROW LESS')
    expect(evaluateBorrower(SAMPLE_BORROWERS.Anita).decision).toBe('DON’T BORROW')
  })

  it('keeps the lender and safe capacities separate', () => {
    const result = evaluateBorrower(SAMPLE_BORROWERS.Priya)
    expect(result.lenderAmount).toBeGreaterThan(result.safeAmount)
    expect(result.absoluteFeasibleCeiling).toBe(result.safeAmount)
  })

  it('does not emit invalid money values for an empty profile', () => {
    const result = evaluateBorrower({ incomeType: 'variable', requestedAmount: 100000, tenureMonths: 48 })
    const values = [result.lenderAmount, result.safeAmount, result.recommendedEmi, result.apr.min, result.apr.max]
    expect(values.every(Number.isFinite)).toBe(true)
    expect(values.every((value) => value >= 0)).toBe(true)
  })
})
