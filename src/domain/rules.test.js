import { describe, expect, it } from 'vitest'
import { calculateEmi, calculateMaximumPrincipal, evaluateBorrower, normalizeIncome, QUESTION_DEFINITIONS, RULES, SAMPLE_BORROWERS, validateProfileInputs } from './rules'

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

  it('uses the challenge run synthetic combined EMI for Anita', () => {
    expect(SAMPLE_BORROWERS.Anita.existingEmi).toBe(3500)
  })

  it('treats zero rent as valid while still requiring a renter to answer the rent field', () => {
    const owner = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, housingType: 'own', monthlyRent: 0 })
    const renterWithoutRent = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, monthlyRent: null })
    expect(validateProfileInputs({ ...SAMPLE_BORROWERS.Priya, housingType: 'rent', monthlyRent: 0 })).toEqual([])
    expect(owner.affordability.rentObligation).toBe(0)
    expect(renterWithoutRent.validationErrors).toContain('Monthly rent is required')
    expect(renterWithoutRent.decision).toBe('INCOMPLETE')
  })

  it('keeps lender capacity independent from other household income', () => {
    const base = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, otherHouseholdIncome: null })
    const withOtherIncome = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, otherHouseholdIncome: 50000 })
    expect(withOtherIncome.lenderAmount).toBe(base.lenderAmount)
    expect(withOtherIncome.safeAmount).toBeGreaterThan(base.safeAmount)
  })

  it('uses tenure as a real must-answer input', () => {
    const missingTenure = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, tenureMonths: null })
    expect(missingTenure.decision).toBe('INCOMPLETE')
    expect(missingTenure.safeAmount).toBeNull()
    expect(missingTenure.recommendedEmi).toBeNull()
    expect(validateProfileInputs({ ...SAMPLE_BORROWERS.Priya, tenureMonths: null })).toContain('Preferred tenure is required')
  })

  it('distinguishes known, unknown and no-credit states', () => {
    const known = evaluateBorrower(SAMPLE_BORROWERS.Priya)
    const unknown = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, creditStatus: 'unknown', creditScore: null })
    const noCredit = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, creditStatus: 'no-credit', creditScore: null })
    const invalid = validateProfileInputs({ ...SAMPLE_BORROWERS.Priya, creditStatus: 'known', creditScore: null })
    expect(known.rate.min).toBeLessThan(unknown.rate.min)
    expect(noCredit.rate.min).toBeGreaterThan(unknown.rate.min)
    expect(unknown.confidence.level).not.toBe('High')
    expect(invalid).toContain('Credit score is required when credit history is known')
    expect(validateProfileInputs({ ...SAMPLE_BORROWERS.Priya, creditStatus: 'unknown', creditScore: 780 })).toContain('Credit score must be empty when credit history is unknown or no credit history')
  })

  it('adapts additional questions to the income and route profile', () => {
    const visible = (profile) => QUESTION_DEFINITIONS.filter((question) => !question.visible || question.visible(profile)).map((question) => question.id)
    const priya = visible(SAMPLE_BORROWERS.Priya)
    const ravi = visible(SAMPLE_BORROWERS.Ravi)
    const anita = visible(SAMPLE_BORROWERS.Anita)
    expect(priya).toContain('monthlyIncome')
    expect(priya).not.toContain('incomeLow')
    expect(ravi).toContain('incomeLow')
    expect(ravi).toContain('documentedAnnualIncome')
    expect(ravi).toContain('collateralValue')
    expect(anita).not.toContain('documentedAnnualIncome')
    expect(anita).not.toContain('collateralValue')
    expect(priya).toContain('creditScore')
    expect(visible({ ...SAMPLE_BORROWERS.Priya, creditStatus: 'unknown', creditScore: null })).not.toContain('creditScore')
  })

  it('routes Ravi to secured finance and respects the collateral cap', () => {
    const result = evaluateBorrower(SAMPLE_BORROWERS.Ravi)
    expect(result.route.key).toBe('lap')
    expect(result.lenderAmount).toBeLessThanOrEqual(4500000 * RULES.securedLtv)
  })

  it('keeps stress informational and does not let it change the verdict', () => {
    const priya = evaluateBorrower(SAMPLE_BORROWERS.Priya)
    expect(priya.decision).toBe('BORROW LESS')
    expect(priya.stress.survives).toBe(false)
    const ravi = evaluateBorrower(SAMPLE_BORROWERS.Ravi)
    expect(ravi.decision).toBe('BORROW LESS')
    expect(ravi.stress).not.toBeNull()
  })

  it('lets risk flags move the rate benchmark as well as the decision', () => {
    const base = evaluateBorrower({ ...SAMPLE_BORROWERS.Anita, recentBounce: false, highCostDebt: false })
    const flagged = evaluateBorrower(SAMPLE_BORROWERS.Anita)
    expect(flagged.rate.min).toBeGreaterThan(base.rate.min)
    expect(flagged.rate.max).toBeGreaterThan(base.rate.max)
    expect(flagged.decision).toBe('DON’T BORROW')
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
    expect(result.safeAmount).toBeGreaterThan(0)
  })

  it('calculates APR and fee from the binding lender-side ceiling', () => {
    const result = evaluateBorrower({ ...SAMPLE_BORROWERS.Priya, otherHouseholdIncome: 200000 })
    expect(result.safeAmount).toBeGreaterThan(result.lenderAmount)
    expect(result.absoluteFeasibleCeiling).toBe(result.lenderAmount)
    expect(result.apr.fee).toBeCloseTo(result.absoluteFeasibleCeiling * RULES.processingFee, 6)
  })

  it('does not emit invalid money values for an empty profile', () => {
    const result = evaluateBorrower({ incomeType: 'variable', requestedAmount: 100000, tenureMonths: null })
    const moneyValues = [result.lenderAmount]
    expect(moneyValues.every((value) => value == null || (Number.isFinite(value) && value >= 0))).toBe(true)
    expect(result.safeAmount == null || (Number.isFinite(result.safeAmount) && result.safeAmount >= 0)).toBe(true)
    expect(result.recommendedEmi == null || Number.isFinite(result.recommendedEmi)).toBe(true)
    expect(result.apr.min == null || Number.isFinite(result.apr.min)).toBe(true)
    expect(result.apr.max == null || Number.isFinite(result.apr.max)).toBe(true)
  })
})
