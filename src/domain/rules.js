export const RULES = {
  lenderFoir: 0.5,
  safeFoir: 0.4,
  processingFee: 0.02,
  emergencyTargetMonths: 6,
  stressIncomeDrop: 0.15,
  stressRateIncrease: 0.02,
  defaultTenureMonths: 48,
  minTenureMonths: 12,
  maxTenureMonths: 84,
  securedLtv: 0.5,
  projectedIncomeCredit: 0.5,
}

const RATE_BASE = {
  personal: [11, 18],
  business: [12, 20],
  lap: [10, 14],
  twoWheeler: [11, 19],
  gold: [9, 16],
  home: [8, 11],
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
const safeNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback
export const formatInr = (value) => `₹${Math.round(Math.max(0, safeNumber(value))).toLocaleString('en-IN')}`
export const formatLakhs = (value) => `₹${(Math.max(0, safeNumber(value)) / 100000).toFixed(1)}L`
export const formatPercent = (value) => `${safeNumber(value).toFixed(1)}%`

export function normalizeIncome(profile) {
  const monthly = safeNumber(profile.monthlyIncome)
  if (profile.incomeType === 'salaried') return { monthly, method: 'Full net salary used because it is recurring and documented.' }
  if (profile.incomeType === 'self-employed') {
    const documented = safeNumber(profile.documentedAnnualIncome) / 12
    const cash = monthly || safeNumber(profile.incomeLow)
    const normalized = documented > 0 ? documented : cash * 0.7
    return { monthly: normalized, method: `${formatInr(normalized)} uses documented income first; cash income is not treated as fully reliable.` }
  }
  const low = safeNumber(profile.incomeLow) || monthly
  const high = safeNumber(profile.incomeHigh) || low
  return { monthly: low + (high - low) * 0.35, method: `The lower end plus 35% of the range (${formatInr(low)}–${formatInr(high)}) protects against a strong month being mistaken for normal income.` }
}

export function calculateEmi(principal, annualRate, tenureMonths) {
  const p = Math.max(0, safeNumber(principal))
  const n = clamp(Math.round(safeNumber(tenureMonths, RULES.defaultTenureMonths)), RULES.minTenureMonths, RULES.maxTenureMonths)
  const monthlyRate = Math.max(0, safeNumber(annualRate)) / 100 / 12
  if (!p) return 0
  if (!monthlyRate) return p / n
  return p * monthlyRate * (1 + monthlyRate) ** n / ((1 + monthlyRate) ** n - 1)
}

export function calculateMaximumPrincipal(emi, annualRate, tenureMonths) {
  const payment = Math.max(0, safeNumber(emi))
  const n = clamp(Math.round(safeNumber(tenureMonths, RULES.defaultTenureMonths)), RULES.minTenureMonths, RULES.maxTenureMonths)
  const monthlyRate = Math.max(0, safeNumber(annualRate)) / 100 / 12
  if (!monthlyRate) return payment * n
  return payment * (1 - (1 + monthlyRate) ** -n) / monthlyRate
}

function affordability(profile, income) {
  const existingEmi = Math.max(0, safeNumber(profile.existingEmi))
  const lenderTotal = income * RULES.lenderFoir
  const safeTotal = income * RULES.safeFoir
  return {
    existingEmi,
    lenderTotal,
    safeTotal,
    lenderAvailable: Math.max(0, lenderTotal - existingEmi),
    safeAvailable: Math.max(0, safeTotal - existingEmi),
    expenseBuffer: Math.max(0, income - existingEmi - safeTotal),
  }
}

function productRoute(profile) {
  if (profile.collateralValue > 0 && (profile.purpose === 'business' || profile.incomeType === 'self-employed')) {
    return { product: 'Loan against property / business loan', key: 'lap', reason: 'Your productive purpose and unencumbered shop/property make secured business finance more sensible than an unsecured personal loan.' }
  }
  if (profile.purpose === 'vehicle') return { product: 'Two-wheeler loan', key: 'twoWheeler', reason: 'A vehicle-specific loan may price the asset more directly than an unsecured personal loan.' }
  return { product: 'Personal loan', key: 'personal', reason: 'The stated purpose is personal and no secured route was supplied.' }
}

function creditAdjustment(profile) {
  if (profile.creditScore == null) return { points: 2, label: 'unknown credit history', known: false }
  if (profile.creditScore >= 750) return { points: -1.5, label: 'strong stated score', known: true }
  if (profile.creditScore >= 700) return { points: 0, label: 'moderate stated score', known: true }
  return { points: 2.5, label: 'weaker stated score', known: true }
}

function rateBand(profile, route) {
  const [baseMin, baseMax] = RATE_BASE[route.key]
  const credit = creditAdjustment(profile)
  let min = baseMin + credit.points
  let max = baseMax + credit.points
  if (profile.incomeType !== 'salaried') { min += 1; max += 1 }
  if (profile.recentBounce) { min += 2; max += 3 }
  if (profile.highCostDebt) { min += 1; max += 2 }
  if (!credit.known) max += 1
  return { min, max, confidence: credit.known && !profile.recentBounce ? 'Medium-high' : credit.known ? 'Medium' : 'Low', reason: `The band starts with a ${route.product.toLowerCase()} market reference, then reflects ${credit.label}${profile.recentBounce ? ', a recent bounced payment' : ''}${profile.incomeType !== 'salaried' ? ', and variable income' : ''}.` }
}

function calculateApr(principal, annualRate, tenureMonths) {
  const fee = Math.max(0, principal) * RULES.processingFee
  const net = Math.max(0, principal - fee)
  const emi = calculateEmi(principal, annualRate, tenureMonths)
  let low = 0
  let high = 1
  for (let i = 0; i < 80; i += 1) {
    const mid = (low + high) / 2
    const pv = mid === 0 ? emi * tenureMonths : emi * (1 - (1 + mid) ** -tenureMonths) / mid
    if (pv > net) low = mid
    else high = mid
  }
  return { apr: ((1 + (low + high) / 2) ** 12 - 1) * 100, fee, net }
}

function confidence(profile, normalized) {
  let score = 3
  if (profile.creditScore == null) score -= 1
  if (profile.incomeType !== 'salaried') score -= 1
  if (!profile.expensesKnown) score -= 1
  if (profile.recentBounce) score -= 1
  return { level: score >= 3 ? 'High' : score >= 2 ? 'Medium' : 'Low', score, reason: `${profile.creditScore == null ? 'Credit history is unavailable. ' : ''}${profile.incomeType !== 'salaried' ? 'Income is variable or partly undocumented. ' : ''}${!profile.expensesKnown ? 'Household expenses are incomplete. ' : ''}${profile.recentBounce ? 'A recent bounce makes the risk picture less settled.' : `Income was normalized to ${formatInr(normalized.monthly)}.`}`.trim() }
}

export function evaluateBorrower(profile) {
  const normalized = normalizeIncome(profile)
  const affordabilityResult = affordability(profile, normalized.monthly)
  const route = productRoute(profile)
  const rate = rateBand(profile, route)
  const averageRate = (rate.min + rate.max) / 2
  const lenderAmount = calculateMaximumPrincipal(affordabilityResult.lenderAvailable, averageRate, profile.tenureMonths)
  const safeAmount = calculateMaximumPrincipal(affordabilityResult.safeAvailable, averageRate, profile.tenureMonths)
  const collateralCap = safeNumber(profile.collateralValue) * RULES.securedLtv
  const safe = Math.min(safeAmount, route.key === 'lap' && collateralCap > 0 ? collateralCap : safeAmount)
  const requested = Math.max(0, safeNumber(profile.requestedAmount))
  const stressIncome = normalized.monthly * (1 - RULES.stressIncomeDrop)
  const stressAffordability = affordability(profile, stressIncome)
  const stressEmi = calculateEmi(requested, rate.max + RULES.stressRateIncrease * 100, profile.tenureMonths)
  const stress = { income: stressIncome, safeAvailable: stressAffordability.safeAvailable, requestedEmi: stressEmi, survives: stressEmi <= stressAffordability.safeAvailable }
  const severeDebt = profile.highCostDebt && profile.recentBounce
  const noCapacity = affordabilityResult.safeAvailable <= 0
  const requestedTooHigh = requested > safe * 1.2
  const decision = severeDebt || noCapacity ? 'DON’T BORROW' : requestedTooHigh ? 'BORROW LESS' : 'BORROW'
  const decisionReason = severeDebt ? 'Existing high-cost debt and a recent bounce mean new borrowing could deepen the debt problem.' : noCapacity ? 'Existing commitments already use the conservative monthly headroom.' : requestedTooHigh ? `The request is above the borrower-safe range of ${formatLakhs(safe)}.` : 'The request fits inside the conservative EMI ceiling, with a buffer left for ordinary months.'
  const aprLow = calculateApr(Math.max(1, safe), rate.min, profile.tenureMonths).apr
  const aprHigh = calculateApr(Math.max(1, safe), rate.max, profile.tenureMonths).apr
  return {
    normalized, affordability: affordabilityResult, route, rate, lenderAmount, safeAmount: safe, requested,
    decision, decisionReason, stress, confidence: confidence(profile, normalized), apr: { min: aprLow, max: aprHigh, fee: Math.max(1, safe) * RULES.processingFee },
    recommendedEmi: affordabilityResult.safeAvailable, tenure: profile.tenureMonths, explanation: [normalized.method, `Existing EMI of ${formatInr(affordabilityResult.existingEmi)} is counted before new borrowing.`, `Safe headroom is ${formatInr(affordabilityResult.safeAvailable)} at the ${RULES.safeFoir * 100}% borrower-safe ceiling.`, route.reason],
  }
}

export const SAMPLE_BORROWERS = {
  Priya: { name: 'Priya', age: 29, city: 'Bengaluru', incomeType: 'salaried', monthlyIncome: 110000, existingEmi: 14000, expensesKnown: true, creditScore: 780, requestedAmount: 800000, purpose: 'wedding', tenureMonths: 48, recentBounce: false, highCostDebt: false, emergencyMonths: 6 },
  Ravi: { name: 'Ravi', age: 42, city: 'Mysuru', incomeType: 'self-employed', monthlyIncome: 60000, incomeLow: 40000, incomeHigh: 80000, documentedAnnualIncome: 420000, existingEmi: 0, expensesKnown: false, creditScore: null, requestedAmount: 1500000, purpose: 'business', collateralValue: 4500000, tenureMonths: 60, recentBounce: false, highCostDebt: false, emergencyMonths: 3 },
  Anita: { name: 'Anita', age: 35, city: 'Hubballi', incomeType: 'variable', incomeLow: 26000, incomeHigh: 30000, existingEmi: 1050, expensesKnown: true, creditScore: null, requestedAmount: 150000, purpose: 'vehicle', tenureMonths: 36, recentBounce: true, highCostDebt: true, emergencyMonths: 0 },
}

export const QUESTION_DEFINITIONS = [
  { id: 'purpose', label: 'What are you borrowing for?', type: 'select', options: [['wedding', 'Wedding or family event'], ['business', 'Business or stock'], ['vehicle', 'Two-wheeler'], ['debt', 'Paying existing debt'], ['other', 'Something else']], affects: 'decision, route, rate' },
  { id: 'requestedAmount', label: 'How much do you want to borrow?', type: 'number', prefix: '₹', affects: 'decision, stress' },
  { id: 'incomeType', label: 'How does your income arrive?', type: 'select', options: [['salaried', 'Salaried'], ['self-employed', 'Self-employed'], ['variable', 'Informal or variable']], affects: 'normalization, rate, confidence' },
  { id: 'monthlyIncome', label: 'Your usual monthly take-home', type: 'number', prefix: '₹', visible: (profile) => profile.incomeType === 'salaried', affects: 'affordability' },
  { id: 'incomeLow', label: 'Lower monthly income', type: 'number', prefix: '₹', visible: (profile) => profile.incomeType !== 'salaried', affects: 'normalization, affordability' },
  { id: 'incomeHigh', label: 'Higher monthly income', type: 'number', prefix: '₹', visible: (profile) => profile.incomeType !== 'salaried', affects: 'normalization, affordability' },
  { id: 'documentedAnnualIncome', label: 'Annual documented income (ITR)', type: 'number', prefix: '₹', visible: (profile) => profile.incomeType === 'self-employed', affects: 'normalization, confidence' },
  { id: 'existingEmi', label: 'Existing monthly EMIs', type: 'number', prefix: '₹', affects: 'affordability, decision' },
  { id: 'creditScore', label: 'Credit score, if known', type: 'number', visible: () => true, optional: true, affects: 'rate, confidence' },
  { id: 'collateralValue', label: 'Unencumbered property or collateral value', type: 'number', prefix: '₹', visible: (profile) => profile.incomeType === 'self-employed' || profile.purpose === 'business', optional: true, affects: 'route, safe amount' },
  { id: 'expensesKnown', label: 'Do you know your household expenses?', type: 'select', options: [['true', 'Yes'], ['false', 'Not yet']], affects: 'confidence' },
  { id: 'recentBounce', label: 'Any EMI bounced in the last 6 months?', type: 'select', options: [['false', 'No'], ['true', 'Yes']], affects: 'decision, rate, confidence' },
  { id: 'highCostDebt', label: 'Any app or short-term debt above 24%?', type: 'select', options: [['false', 'No'], ['true', 'Yes']], affects: 'decision, rate' },
  { id: 'tenureMonths', label: 'Preferred tenure', type: 'select', options: [['24', '2 years'], ['36', '3 years'], ['48', '4 years'], ['60', '5 years'], ['84', '7 years']], affects: 'EMI, APR, safe amount' },
]