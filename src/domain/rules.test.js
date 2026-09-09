import { describe, expect, it } from 'vitest'
import { calculateEmi, calculateMaximumPrincipal, evaluateBorrower, normalizeIncome, RULES, SAMPLE_BORROWERS } from './rules'

describe('Borrower Copilot domain rules', () => {
  it('calculates reducing-balance EMI and reverses it', () => {
    const emi = calculateEmi(800000, 12, 48)
    expect(emi).toBeCloseTo(21067, -1)
    expect(calculateMaximumPrincipal(emi, 12, 48)).toBeCloseTo(800000, -1)
  })

  it('normalizes variable income conservatively and documented self-employed income first', () => {
    expect(normalizeIncome({ incomeType: 'variable', incomeLow: 40000, incomeHigh: 80000 }).monthly).toBe(54000)
    expect(normalizeIncome({ incomeType: 'self-employed', monthlyIncome: 60000, documentedAnnualIncome: 420000 }).monthly).toBe(35000)
  })

  it('keeps the lender ceiling above the borrower-safe ceiling', () => {
    const result = evaluateBorrower(SAMPLE_BORROWERS.Priya)
    expect(result.affordability.lenderAvailable).toBeGreaterThan(result.affordability.safeAvailable)
    expect(result.lenderAmount).toBeGreaterThan(result.safeAmount)
    expect(result.decision).toBe('BORROW')
  })

  it('routes Ravi to secured business finance and accounts for collateral conservatively', () => {
    const result = evaluateBorrower(SAMPLE_BORROWERS.Ravi)
    expect(result.route.key).toBe('lap')
    expect(result.route.product).toContain('business')
    expect(result.confidence.level).toBe('Low')
    expect(result.safeAmount).toBeLessThanOrEqual(SAMPLE_BORROWERS.Ravi.collateralValue * RULES.securedLtv)
  })

  it('reaches a real dont-borrow state for Anita', () => {
    const result = evaluateBorrower(SAMPLE_BORROWERS.Anita)
    expect(result.decision).toBe('DON’T BORROW')
    expect(result.rate.max).toBeGreaterThan(result.rate.min)
    expect(result.stress.survives).toBe(true)
  })

  it('never emits invalid values for missing income', () => {
    const result = evaluateBorrower({ incomeType: 'variable', requestedAmount: 100000, tenureMonths: 48 })
    const values = [result.safeAmount, result.lenderAmount, result.recommendedEmi, result.apr.min, result.apr.max]
    expect(values.every(Number.isFinite)).toBe(true)
    expect(values.every((value) => value >= 0)).toBe(true)
  })
})