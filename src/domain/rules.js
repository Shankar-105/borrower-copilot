export const RULES = {
  lenderFoir: 0.5,
  safeFoir: 0.4,
  processingFee: 0.02,
  stressIncomeDrop: 0.15,
  stressRateIncrease: 0.02,
  defaultTenureMonths: 48,
  minTenureMonths: 12,
  maxTenureMonths: 84,
  retirementAge: 60,
  securedLtv: 0.5,
  variableIncomeShare: 0.35,
  recentBounceRateAdd: 1.5,
  highCostDebtRateAdd: 2,
}

const RATE_BASE = {
  personal: [11, 18],
  business: [12, 20],
  lap: [10, 14],
  twoWheeler: [11, 19],
}

const CREDIT_STATUSES = new Set(['known', 'unknown', 'no-credit'])
const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
const safeNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback
const hasValue = (value) => value !== null && value !== undefined && value !== ''

export const formatInr = (value) => value == null ? '—' : `₹${Math.round(Math.max(0, safeNumber(value))).toLocaleString('en-IN')}`
export const formatLakhs = (value) => value == null ? '—' : `₹${(Math.max(0, safeNumber(value)) / 100000).toFixed(1)}L`
export const formatPercent = (value) => value == null ? 'Not available' : `${safeNumber(value).toFixed(1)}%`

export function normalizeIncome(profile) {
  const monthly = safeNumber(profile.monthlyIncome)
  if (profile.incomeType === 'salaried') return { monthly, method: 'Full net salary is used because it is recurring income.' }
  const documentedBase = profile.incomeType === 'self-employed' ? safeNumber(profile.documentedAnnualIncome) / 12 : 0
  const low = safeNumber(profile.incomeLow) || monthly
  const high = safeNumber(profile.incomeHigh) || low
  const rangeBase = low + (high - low) * RULES.variableIncomeShare
  const hasDocumentedIncome = profile.incomeType === 'self-employed' && documentedBase > 0
  const normalized = hasDocumentedIncome ? documentedBase : rangeBase
  const method = hasDocumentedIncome
    ? `${formatInr(documentedBase)} of monthly tax-record income is used because documented annual income is available; operating cash is not added on top.`
    : `${formatInr(rangeBase)} from the stable monthly income range (${formatInr(low)}–${formatInr(high)}) is used; peak months are not treated as normal income.`
  return { monthly: normalized, method }
}

function allowedTenure(profile) {
  if (!hasValue(profile.tenureMonths)) return null
  const requested = clamp(Math.round(safeNumber(profile.tenureMonths)), RULES.minTenureMonths, RULES.maxTenureMonths)
  const age = safeNumber(profile.age)
  if (!age) return requested
  const ageLimit = Math.max(RULES.minTenureMonths, (RULES.retirementAge - age) * 12)
  return Math.min(requested, ageLimit)
}

export function calculateEmi(principal, annualRate, tenureMonths) {
  const p = Math.max(0, safeNumber(principal))
  if (!p || !hasValue(tenureMonths)) return 0
  const n = clamp(Math.round(safeNumber(tenureMonths)), RULES.minTenureMonths, RULES.maxTenureMonths)
  const monthlyRate = Math.max(0, safeNumber(annualRate)) / 100 / 12
  if (!monthlyRate) return p / n
  return p * monthlyRate * (1 + monthlyRate) ** n / ((1 + monthlyRate) ** n - 1)
}

export function calculateMaximumPrincipal(emi, annualRate, tenureMonths) {
  const payment = Math.max(0, safeNumber(emi))
  if (!hasValue(tenureMonths)) return 0
  const n = clamp(Math.round(safeNumber(tenureMonths)), RULES.minTenureMonths, RULES.maxTenureMonths)
  const monthlyRate = Math.max(0, safeNumber(annualRate)) / 100 / 12
  if (!monthlyRate) return payment * n
  return payment * (1 - (1 + monthlyRate) ** -n) / monthlyRate
}

function affordability(profile, income, otherHouseholdIncome = 0) {
  const existingEmi = Math.max(0, safeNumber(profile.existingEmi))
  const lenderTotal = income * RULES.lenderFoir
  const lenderAvailable = Math.max(0, lenderTotal - existingEmi)
  const householdIncome = Math.max(0, income + safeNumber(otherHouseholdIncome))
  const safeTotal = householdIncome * RULES.safeFoir
  const rentObligation = profile.housingType === 'rent' ? Math.max(0, safeNumber(profile.monthlyRent)) : 0
  const safeAvailable = Math.max(0, safeTotal - rentObligation - existingEmi)
  return {
    existingEmi,
    lenderTotal,
    safeTotal,
    lenderAvailable,
    safeAvailable,
    rentObligation,
    rentMissing: profile.housingType === 'rent' && !hasValue(profile.monthlyRent),
    householdIncome,
    otherHouseholdIncome: Math.max(0, safeNumber(otherHouseholdIncome)),
  }
}

function normalizeCreditScore(profile) {
  if (profile.creditStatus !== 'known' || !hasValue(profile.creditScore)) return null
  const score = Number(profile.creditScore)
  return Number.isFinite(score) && score >= 300 && score <= 900 ? score : null
}

function creditAdjustment(profile, route) {
  const status = CREDIT_STATUSES.has(profile.creditStatus) ? profile.creditStatus : 'unknown'
  const score = normalizeCreditScore(profile)
  if (route.key === 'lap' && status !== 'known') {
    return { minPoints: 0, maxPoints: 0, label: status === 'no-credit' ? 'no credit history; secured route limits the benchmark impact' : 'unknown credit history; secured route limits the benchmark impact', known: false }
  }
  if (status === 'no-credit') return { minPoints: 2.5, maxPoints: 2.5, label: 'no credit history', known: false }
  if (status !== 'known' || score == null) return { minPoints: 2, maxPoints: 3, label: 'unknown credit history', known: false }
  if (score >= 750) return { minPoints: -1.5, maxPoints: -1.5, label: 'strong stated score', known: true }
  if (score >= 700) return { minPoints: 0, maxPoints: 0, label: 'moderate stated score', known: true }
  return { minPoints: 2.5, maxPoints: 2.5, label: 'weaker stated score', known: true }
}

function productRoute(profile) {
  const loanType = profile.loanType
  if (safeNumber(profile.collateralValue) > 0 && (loanType === 'lap' || loanType === 'business' || profile.purpose === 'business')) {
    return { product: 'Loan against property / secured business loan', key: 'lap', reason: 'The business purpose and supplied property make a secured route more suitable than an unsecured loan in this prototype.' }
  }
  if (loanType === 'business' || profile.purpose === 'business') return { product: 'Business loan', key: 'business', reason: 'The stated purpose is business and no secured collateral route was supplied, so an unsecured business-finance route is used.' }
  if (loanType === 'vehicle' || profile.purpose === 'vehicle') return { product: 'Two-wheeler loan', key: 'twoWheeler', reason: 'The loan is for a two-wheeler, so the vehicle route is used.' }
  return { product: 'Personal loan', key: 'personal', reason: 'The stated purpose is personal and no secured or vehicle route was selected.' }
}

export function validateProfileInputs(profile) {
  const errors = []
  const numeric = (key, label, { required = false, min = 0, integer = false } = {}) => {
    if (!hasValue(profile[key])) {
      if (required) errors.push(`${label} is required`)
      return
    }
    const value = Number(profile[key])
    if (!Number.isFinite(value) || value < min || (integer && !Number.isInteger(value))) errors.push(`${label} is invalid`)
  }

  numeric('requestedAmount', 'Requested amount', { required: true, min: 1 })
  if (profile.incomeType === 'salaried') numeric('monthlyIncome', 'Monthly income', { required: true, min: 1 })
  else {
    numeric('incomeLow', 'Lower monthly income', { required: true, min: 1 })
    numeric('incomeHigh', 'Higher monthly income', { required: true, min: 1 })
    if (hasValue(profile.incomeLow) && hasValue(profile.incomeHigh) && Number(profile.incomeLow) > Number(profile.incomeHigh)) errors.push('Lower income cannot be greater than higher income')
  }
  numeric('existingEmi', 'Existing EMI', { required: true, min: 0 })
  numeric('age', 'Age', { required: true, min: 18, integer: true })
  if (hasValue(profile.age) && Number(profile.age) > 80) errors.push('Age is invalid')
  numeric('tenureMonths', 'Preferred tenure', { required: true, min: RULES.minTenureMonths, integer: true })
  if (hasValue(profile.tenureMonths) && Number(profile.tenureMonths) > RULES.maxTenureMonths) errors.push('Preferred tenure is invalid')

  if (!['own', 'rent'].includes(profile.housingType)) errors.push('Housing type is required')
  if (profile.housingType === 'rent') numeric('monthlyRent', 'Monthly rent', { required: true, min: 0 })

  if (profile.incomeType === 'self-employed' && hasValue(profile.documentedAnnualIncome)) numeric('documentedAnnualIncome', 'Annual documented income', { min: 0 })
  if (hasValue(profile.otherHouseholdIncome)) numeric('otherHouseholdIncome', 'Other household income', { min: 0 })
  if (hasValue(profile.collateralValue)) numeric('collateralValue', 'Collateral value', { min: 0 })

  const creditStatus = profile.creditStatus || 'unknown'
  if (!CREDIT_STATUSES.has(creditStatus)) errors.push('Credit history status is invalid')
  if (creditStatus === 'known') {
    if (!hasValue(profile.creditScore)) errors.push('Credit score is required when credit history is known')
    else numeric('creditScore', 'Credit score', { required: true, min: 300 })
    if (hasValue(profile.creditScore) && Number(profile.creditScore) > 900) errors.push('Credit score is invalid')
  } else if (hasValue(profile.creditScore)) {
    errors.push('Credit score must be empty when credit history is unknown or no credit history')
  }

  return errors
}

function rateBand(profile, route) {
  const [baseMin, baseMax] = RATE_BASE[route.key]
  const credit = creditAdjustment(profile, route)
  let min = baseMin + credit.minPoints
  let max = baseMax + credit.maxPoints
  if (profile.incomeType !== 'salaried') { min += 1; max += 1 }
  const riskFlags = []
  if (profile.recentBounce === true) { riskFlags.push('recent bounced payment'); min += RULES.recentBounceRateAdd; max += RULES.recentBounceRateAdd }
  if (profile.highCostDebt === true) { riskFlags.push('high-cost debt'); min += RULES.highCostDebtRateAdd; max += RULES.highCostDebtRateAdd }
  const confidence = credit.known && !profile.recentBounce && !profile.highCostDebt ? 'High' : credit.known ? 'Medium' : 'Low'
  const riskText = riskFlags.length ? ` Risk flags raise the benchmark by ${formatPercent((profile.recentBounce ? RULES.recentBounceRateAdd : 0) + (profile.highCostDebt ? RULES.highCostDebtRateAdd : 0)} and also affect the borrowing decision where applicable.` : ''
  return {
    min,
    max,
    confidence,
    riskFlags,
    reason: `The band starts with a ${route.product.toLowerCase()} reference, then reflects ${credit.label}${profile.incomeType !== 'salaried' ? ' and non-salaried income' : ''}.${riskText}`,
  }
}

function calculateApr(principal, annualRate, tenureMonths) {
  const amount = Math.max(0, safeNumber(principal))
  if (!amount || !hasValue(tenureMonths)) return { apr: 0, fee: 0, net: 0, isEstimated: true, disclaimer: 'No borrowing amount was available for an APR estimate.' }
  const fee = amount * RULES.processingFee
  const net = amount - fee
  const emi = calculateEmi(amount, annualRate, tenureMonths)
  let low = 0
  let high = 1
  for (let i = 0; i < 80; i += 1) {
    const mid = (low + high) / 2
    const pv = mid === 0 ? emi * tenureMonths : emi * (1 - (1 + mid) ** -tenureMonths) / mid
    if (pv > net) low = mid
    else high = mid
  }
  return {
    apr: ((1 + (low + high) / 2) ** 12 - 1) * 100,
    fee,
    net,
    isEstimated: true,
    disclaimer: `APR is illustrative: the ${formatPercent(RULES.processingFee * 100)} processing fee is estimated. Actual documentation charges, fee caps, stamp duty, insurance, and state-specific closing costs can change the all-in cost.`,
  }
}

function confidence(profile, normalized, validationErrors) {
  let score = 4
  const missingOptional = []
  if (profile.creditStatus !== 'known') { score -= 1; missingOptional.push(profile.creditStatus === 'no-credit' ? 'No credit history is stated.' : 'Credit score is unknown.') }
  if (profile.incomeType !== 'salaried') { score -= 1; missingOptional.push('Income is variable or partly documented.') }
  if (profile.incomeType === 'self-employed' && safeNumber(profile.documentedAnnualIncome) <= 0) { score -= 0.5; missingOptional.push('Documented annual income is not supplied.') }
  if (!hasValue(profile.otherHouseholdIncome)) { score -= 0.5; missingOptional.push('Other household income is not supplied.') }
  if (profile.recentBounce) score -= 0.5
  if (profile.highCostDebt) score -= 0.5
  if (profile.collateralValue > 0 && profile.incomeType !== 'salaried') score -= 0.25
  if (validationErrors.length) score -= Math.min(2, validationErrors.length * 0.5)
  return {
    level: score >= 3.5 ? 'High' : score >= 2.5 ? 'Medium' : 'Low',
    score,
    reason: `${missingOptional.join(' ')}${profile.recentBounce ? ' A recent bounce makes the risk picture less settled.' : ''}${profile.highCostDebt ? ' High-cost debt is present.' : ''} Income was normalized to ${formatInr(normalized.monthly)}.`.trim(),
  }
}

function hasRequiredInputs(profile) {
  const errors = validateProfileInputs(profile)
  return errors.length === 0
}

function buildTenureTradeoff(principal, annualRate, tenure, maximumTenure) {
  if (!principal || !tenure) return []
  const max = Math.min(RULES.maxTenureMonths, maximumTenure)
  const pool = [...new Set([12, 24, 36, 48, 60, 72, 84, tenure])]
    .map((months) => clamp(months, RULES.minTenureMonths, max))
    .filter((months, index, values) => values.indexOf(months) === index)
    .sort((a, b) => a - b)
  const lower = pool.filter((months) => months < tenure).sort((a, b) => b - a)
  const higher = pool.filter((months) => months > tenure).sort((a, b) => a - b)
  let candidates = [tenure]
  if (higher.length && lower.length) candidates = [lower[0], tenure, higher[0]]
  else if (lower.length >= 2) candidates = [lower[1], lower[0], tenure]
  else if (higher.length >= 2) candidates = [tenure, higher[0], higher[1]]
  else candidates = [...lower.slice(0, 2), tenure, ...higher.slice(0, 2)].slice(0, 3)
  return [...new Set(candidates)].sort((a, b) => a - b).map((months) => {
    const emi = calculateEmi(principal, annualRate, months)
    return { months, emi, totalInterest: Math.max(0, emi * months - principal), isSelected: months === tenure }
  })
}

export function evaluateBorrower(profile) {
  const validationErrors = validateProfileInputs(profile)
  const normalized = normalizeIncome(profile)
  const otherHouseholdIncome = Math.max(0, safeNumber(profile.otherHouseholdIncome))
  const affordabilityResult = affordability(profile, normalized.monthly, otherHouseholdIncome)
  const route = productRoute(profile)
  const rate = rateBand(profile, route)
  const averageRate = (rate.min + rate.max) / 2
  const tenure = allowedTenure(profile)
  const ready = hasRequiredInputs(profile) && tenure != null
  const collateralCap = safeNumber(profile.collateralValue) * RULES.securedLtv
  const lenderIncomeAmount = ready ? calculateMaximumPrincipal(affordabilityResult.lenderAvailable, averageRate, tenure) : null
  const lenderAmount = ready ? (route.key === 'lap' ? Math.min(lenderIncomeAmount, collateralCap) : lenderIncomeAmount) : null
  const safeAmount = ready ? calculateMaximumPrincipal(affordabilityResult.safeAvailable, averageRate, tenure) : null
  const requested = Math.max(0, safeNumber(profile.requestedAmount))
  const absoluteFeasibleCeiling = ready ? Math.min(lenderAmount, safeAmount) : null
  const targetPrincipal = ready ? Math.min(requested, absoluteFeasibleCeiling) : null
  const recommendedEmi = ready ? calculateEmi(targetPrincipal, averageRate, tenure) : null

  const stressIncome = normalized.monthly * (1 - RULES.stressIncomeDrop)
  const stressAffordability = affordability(profile, stressIncome, otherHouseholdIncome)
  const stressRateIncrease = route.key === 'lap' ? RULES.stressRateIncrease * 100 : 0
  const stressEmi = ready ? calculateEmi(targetPrincipal, rate.max + stressRateIncrease, tenure) : null
  const stress = ready ? { income: stressIncome, householdIncome: stressAffordability.householdIncome, safeAvailable: stressAffordability.safeAvailable, requestedEmi: stressEmi, survives: stressEmi <= stressAffordability.safeAvailable } : null

  const severeDebt = profile.highCostDebt === true && profile.recentBounce === true
  const noCapacity = ready && affordabilityResult.safeAvailable <= 0
  const exceedsSafeCapacity = ready && requested > safeAmount
  const exceedsLenderCapacity = ready && requested > lenderAmount
  const requestedTooHigh = ready && requested > absoluteFeasibleCeiling
  const decision = !ready ? 'INCOMPLETE' : noCapacity || severeDebt ? 'DON’T BORROW' : requestedTooHigh ? 'BORROW LESS' : 'BORROW'
  const decisionReason = !ready
    ? 'Complete the required questions to see a borrower-safe calculation.'
    : severeDebt
      ? 'Existing high-cost debt and a recent bounce mean new borrowing could deepen the debt problem.'
      : noCapacity
        ? 'The conservative monthly headroom is already used by existing commitments and stated rent.'
        : requestedTooHigh && exceedsSafeCapacity && exceedsLenderCapacity
          ? `The request exceeds both your borrower-safe ceiling of ${formatLakhs(safeAmount)} and the lender-side estimate of ${formatLakhs(lenderAmount)}.`
          : requestedTooHigh && exceedsSafeCapacity
            ? `The request exceeds your borrower-safe ceiling of ${formatLakhs(safeAmount)}; a lender offering more would not make that monthly burden safe.`
            : requestedTooHigh && exceedsLenderCapacity
              ? `The request exceeds the lender-side estimate of ${formatLakhs(lenderAmount)}, which is constrained by institutional affordability or collateral policy.`
              : 'The request fits inside both the lender-side estimate and the conservative borrower-safe ceiling.'

  const aprLow = absoluteFeasibleCeiling > 0 ? calculateApr(absoluteFeasibleCeiling, rate.min, tenure).apr : null
  const aprHigh = absoluteFeasibleCeiling > 0 ? calculateApr(absoluteFeasibleCeiling, rate.max, tenure).apr : null
  const aprFee = absoluteFeasibleCeiling > 0 ? absoluteFeasibleCeiling * RULES.processingFee : 0
  const age = safeNumber(profile.age)
  const maximumTenure = age ? Math.max(RULES.minTenureMonths, Math.min(RULES.maxTenureMonths, (RULES.retirementAge - age) * 12)) : RULES.maxTenureMonths
  const tradeoffPrincipal = absoluteFeasibleCeiling == null ? 0 : (requested > absoluteFeasibleCeiling ? absoluteFeasibleCeiling : requested)
  const tenureTradeoff = buildTenureTradeoff(tradeoffPrincipal, averageRate, tenure, maximumTenure)
  const tenureNote = tenure == null ? 'Preferred tenure is required because EMI and APR depend on it.' : age && tenure < safeNumber(profile.tenureMonths, tenure) ? `Tenure is limited to ${tenure} months using the ${RULES.retirementAge}-year age assumption.` : `Tenure used is ${tenure} months.`
  const rentNote = profile.housingType === 'rent' ? `Stated rent of ${formatInr(affordabilityResult.rentObligation)} is included in borrower-safe capacity.` : 'No rent is included because the borrower selected an owned home.'
  const householdIncomeNote = otherHouseholdIncome > 0 ? `${formatInr(otherHouseholdIncome)} of other household income is included in the borrower-safe household calculation, but not in lender-side sanction capacity.` : 'Other household income is not included in the safe household calculation because it was not supplied.'
  const stressExpenseNote = ready ? `Stress reduces normalized borrower income by ${RULES.stressIncomeDrop * 100}%. ${rentNote} Existing EMI remains unchanged. ${route.key === 'lap' ? `The secured route also tests a ${RULES.stressRateIncrease * 100}-point rate rise.` : 'The selected route does not assume a contractual rate rise.'} This stress check is informational; it does not change the borrowing verdict.` : 'Stress will be shown after all must-answer inputs are complete.'
  const leverageNote = route.key === 'lap' && collateralCap > 0
    ? `Your unencumbered collateral supports a lender-side cap of ${formatLakhs(collateralCap)}.`
    : profile.creditStatus === 'known' && safeNumber(profile.creditScore) >= 750
      ? `Your stated ${profile.creditScore} credit score supports asking for the lower end of the ${formatPercent(rate.min)}–${formatPercent(rate.max)} benchmark.`
      : `Use the ${formatLakhs(absoluteFeasibleCeiling)} absolute feasible ceiling as your maximum planning amount, even if a lender offers more.`

  const apr = {
    min: aprLow,
    max: aprHigh,
    fee: aprFee,
    isEstimated: true,
    disclaimer: `APR is illustrative: the ${formatPercent(RULES.processingFee * 100)} processing fee is estimated. Actual documentation charges, fee caps, stamp duty, insurance, and state-specific closing costs can change the all-in cost.`,
  }
  return {
    normalized,
    affordability: affordabilityResult,
    route,
    rate,
    lenderAmount,
    safeAmount,
    collateralCap,
    absoluteFeasibleCeiling,
    requested,
    decision,
    decisionReason,
    stress,
    confidence: confidence(profile, normalized, validationErrors),
    apr,
    recommendedEmi,
    tenure,
    tenureTradeoff,
    validationErrors,
    explanation: ready ? [`Say: "I can carry a contractual EMI of ${formatInr(recommendedEmi)} for this request; please show me the offer without crossing that ceiling."`, `Say: "Your estimated lender-side capacity is ${formatLakhs(lenderAmount)}, but my borrower-safe ceiling is ${formatLakhs(safeAmount)}; I will negotiate from the safer figure."`, `Say: "My existing EMI of ${formatInr(affordabilityResult.existingEmi)} is already committed, so it cannot be counted as new-loan capacity."`, normalized.method, householdIncomeNote, rentNote, leverageNote, stressExpenseNote, tenureNote, route.reason] : ['Complete the must-answer questions to calculate the four outputs.'],
  }
}

export const SAMPLE_BORROWERS = {
  Priya: { name: 'Priya', age: 29, city: 'Bengaluru', incomeType: 'salaried', monthlyIncome: 110000, incomeLow: null, incomeHigh: null, documentedAnnualIncome: null, existingEmi: 14000, otherHouseholdIncome: null, housingType: 'rent', monthlyRent: 28000, creditStatus: 'known', creditScore: 780, requestedAmount: 800000, purpose: 'wedding', loanType: 'personal', collateralValue: 0, recentBounce: false, highCostDebt: false, tenureMonths: 48 },
  Ravi: { name: 'Ravi', age: 42, city: 'Mysuru', incomeType: 'self-employed', monthlyIncome: null, incomeLow: 40000, incomeHigh: 80000, documentedAnnualIncome: 420000, existingEmi: 0, otherHouseholdIncome: 18000, housingType: 'own', monthlyRent: 0, creditStatus: 'unknown', creditScore: null, requestedAmount: 1500000, purpose: 'business', loanType: 'business', collateralValue: 4500000, recentBounce: false, highCostDebt: false, tenureMonths: 60 },
  Anita: { name: 'Anita', age: 35, city: 'Hubballi', incomeType: 'variable', monthlyIncome: null, incomeLow: 26000, incomeHigh: 30000, documentedAnnualIncome: null, existingEmi: 1050, otherHouseholdIncome: null, housingType: 'own', monthlyRent: 0, creditStatus: 'unknown', creditScore: null, requestedAmount: 150000, purpose: 'vehicle', loanType: 'vehicle', collateralValue: 0, recentBounce: true, highCostDebt: true, tenureMonths: 36 },
}

export const QUESTION_DEFINITIONS = [
  { id: 'purpose', label: 'What are you borrowing for?', type: 'select', options: [['wedding', 'Wedding or family event'], ['business', 'Business or stock'], ['vehicle', 'Two-wheeler'], ['debt', 'Paying existing debt'], ['other', 'Something else']], affects: 'decision, route, rate', tier: 'must' },
  { id: 'loanType', label: 'What loan type are you considering?', type: 'select', options: [['not-sure', 'Not sure'], ['personal', 'Personal loan'], ['business', 'Business loan'], ['lap', 'Loan against property'], ['vehicle', 'Two-wheeler loan']], affects: 'route, rate', tier: 'must' },
  { id: 'requestedAmount', label: 'How much do you want to borrow?', type: 'number', prefix: '₹', min: 1, required: true, affects: 'decision, stress', tier: 'must' },
  { id: 'incomeType', label: 'How does your income arrive?', type: 'select', options: [['salaried', 'Salaried'], ['self-employed', 'Self-employed'], ['variable', 'Informal or variable']], affects: 'normalization, rate, confidence', tier: 'must' },
  { id: 'monthlyIncome', label: 'Your usual monthly take-home', type: 'number', prefix: '₹', min: 1, required: true, visible: (profile) => profile.incomeType === 'salaried', affects: 'affordability', tier: 'must' },
  { id: 'incomeLow', label: 'Lower monthly income', type: 'number', prefix: '₹', min: 1, required: true, visible: (profile) => profile.incomeType !== 'salaried', affects: 'normalization, affordability', tier: 'must' },
  { id: 'incomeHigh', label: 'Higher monthly income', type: 'number', prefix: '₹', min: 1, required: true, visible: (profile) => profile.incomeType !== 'salaried', affects: 'normalization, affordability', tier: 'must' },
  { id: 'documentedAnnualIncome', label: 'Annual documented income (ITR)', type: 'number', prefix: '₹', min: 0, visible: (profile) => profile.incomeType === 'self-employed', affects: 'normalization, confidence', tier: 'additional' },
  { id: 'existingEmi', label: 'Existing monthly EMIs', type: 'number', prefix: '₹', min: 0, required: true, affects: 'affordability, decision', tier: 'must' },
  { id: 'otherHouseholdIncome', label: 'Other household income you expect to rely on', type: 'number', prefix: '₹', min: 0, optional: true, affects: 'safe amount, stress, confidence', tier: 'additional' },
  { id: 'housingType', label: 'Do you own your home or rent?', type: 'select', options: [['own', 'Own House'], ['rent', 'Rent']], affects: 'safe amount', tier: 'must' },
  { id: 'monthlyRent', label: 'Monthly rent', type: 'number', prefix: '₹', min: 0, required: true, visible: (profile) => profile.housingType === 'rent', affects: 'safe amount', tier: 'must' },
  { id: 'age', label: 'Your age', type: 'number', min: 18, max: 80, required: true, affects: 'tenure, confidence', tier: 'must' },
  { id: 'tenureMonths', label: 'Preferred tenure', type: 'select', options: [['24', '2 years'], ['36', '3 years'], ['48', '4 years'], ['60', '5 years'], ['84', '7 years']], required: true, affects: 'EMI, APR, safe amount, stress', tier: 'must' },
  { id: 'creditStatus', label: 'What is your credit history status?', type: 'select', options: [['unknown', 'I do not know my score'], ['known', 'I know my score'], ['no-credit', 'I have no credit history']], affects: 'rate, confidence', tier: 'additional' },
  { id: 'creditScore', label: 'Your credit score', type: 'number', prefix: '', min: 300, max: 900, required: true, visible: (profile) => profile.creditStatus === 'known', affects: 'rate, confidence', tier: 'additional' },
  { id: 'collateralValue', label: 'Unencumbered property or collateral value', type: 'number', prefix: '₹', min: 0, visible: (profile) => profile.incomeType === 'self-employed' || profile.purpose === 'business' || profile.loanType === 'lap', optional: true, affects: 'route, lender capacity', tier: 'additional' },
  { id: 'recentBounce', label: 'Any EMI bounced in the last 6 months?', type: 'select', options: [['false', 'No'], ['true', 'Yes']], affects: 'rate, decision, confidence', tier: 'additional' },
  { id: 'highCostDebt', label: 'Any app or short-term debt above 24%?', type: 'select', options: [['false', 'No'], ['true', 'Yes']], affects: 'rate, decision, confidence', tier: 'additional' },
]
