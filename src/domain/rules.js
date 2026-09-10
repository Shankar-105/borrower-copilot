export const RULES = {
  lenderFoir: 0.5,
  safeFoir: 0.4,
  processingFee: 0.02,
  stressIncomeDrop: 0.15,
  stressRateIncrease: 0.02,
  stressExpenseReduction: 0.1,
  unknownExpenseRatio: 0.2,
  fairRateCapBuffer: 1,
  defaultTenureMonths: 48,
  minTenureMonths: 12,
  maxTenureMonths: 84,
  retirementAge: 60,
  securedLtv: 0.5,
  variableIncomeShare: 0.35,
  selfEmployedCashHaircut: 0.7,
}

const RATE_BASE = {
  personal: [11, 18],
  business: [12, 20],
  lap: [10, 14],
  twoWheeler: [11, 19],
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)
const safeNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback
export const formatInr = (value) => `₹${Math.round(Math.max(0, safeNumber(value))).toLocaleString('en-IN')}`
export const formatLakhs = (value) => `₹${(Math.max(0, safeNumber(value)) / 100000).toFixed(1)}L`
export const formatPercent = (value) => `${safeNumber(value).toFixed(1)}%`

export function normalizeIncome(profile) {
  const monthly = safeNumber(profile.monthlyIncome)
  if (profile.incomeType === 'salaried') return { monthly, method: 'Full net salary is used because it is recurring income.' }
  if (profile.incomeType === 'self-employed') {
    const documented = safeNumber(profile.documentedAnnualIncome) / 12
    const cash = monthly || safeNumber(profile.incomeLow)
    const normalized = documented > 0 ? documented : cash * RULES.selfEmployedCashHaircut
    return { monthly: normalized, method: `${formatInr(normalized)} is used from documented income first; cash income is not treated as fully reliable.` }
  }
  const low = safeNumber(profile.incomeLow) || monthly
  const high = safeNumber(profile.incomeHigh) || low
  return { monthly: low + (high - low) * RULES.variableIncomeShare, method: `The lower end plus ${RULES.variableIncomeShare * 100}% of the range (${formatInr(low)}–${formatInr(high)}) is used so a strong month is not treated as normal income.` }
}

function allowedTenure(profile) {
  const requested = clamp(Math.round(safeNumber(profile.tenureMonths, RULES.defaultTenureMonths)), RULES.minTenureMonths, RULES.maxTenureMonths)
  const age = safeNumber(profile.age)
  if (!age) return requested
  const ageLimit = Math.max(RULES.minTenureMonths, (RULES.retirementAge - age) * 12)
  return Math.min(requested, ageLimit)
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

function affordability(profile, income, otherHouseholdIncome = 0, options = {}) {
  const existingEmi = Math.max(0, safeNumber(profile.existingEmi))
  const lenderTotal = income * RULES.lenderFoir
  const lenderAvailable = Math.max(0, lenderTotal - existingEmi)
  const householdIncome = Math.max(0, income + safeNumber(otherHouseholdIncome))
  const safeTotal = householdIncome * RULES.safeFoir
  const expensesComplete = profile.expensesKnown === true && Number.isFinite(Number(profile.monthlyExpenses))
  const knownExpenses = expensesComplete ? Math.max(0, Number(profile.monthlyExpenses)) : null
  const assumedExpenses = expensesComplete ? knownExpenses : householdIncome * RULES.unknownExpenseRatio
  const expenseReduction = options.stress ? clamp(RULES.stressExpenseReduction, 0, 1) : 0
  const expensesUsed = assumedExpenses * (1 - expenseReduction)
  const safeAvailable = Math.max(0, safeTotal - existingEmi - expensesUsed)
  return {
    existingEmi,
    lenderTotal,
    safeTotal,
    lenderAvailable,
    safeAvailable,
    monthlyExpenses: knownExpenses,
    expensesUsed,
    expensesAssumed: !expensesComplete,
    householdIncome,
    otherHouseholdIncome: Math.max(0, safeNumber(otherHouseholdIncome)),
  }
}

function productRoute(profile) {
  const loanType = profile.loanType
  if (profile.collateralValue > 0 && (loanType === 'lap' || loanType === 'business' || profile.purpose === 'business')) {
    return { product: 'Loan against property / secured business loan', key: 'lap', reason: 'The business purpose and supplied property make a secured route more suitable than an unsecured loan in this prototype.' }
  }
  if (loanType === 'business' || profile.purpose === 'business') return { product: 'Business loan', key: 'business', reason: 'The stated purpose is business and no secured collateral route was supplied, so an unsecured business-finance route is used.' }
  if (loanType === 'vehicle' || profile.purpose === 'vehicle') return { product: 'Two-wheeler loan', key: 'twoWheeler', reason: 'The loan is for a two-wheeler, so the vehicle route is used.' }
  return { product: 'Personal loan', key: 'personal', reason: 'The stated purpose is personal and no secured or vehicle route was selected.' }
}

function creditAdjustment(profile) {
  if (profile.creditScore == null) return { minPoints: 2, maxPoints: 3, label: 'unknown credit history', known: false }
  if (profile.creditScore >= 750) return { minPoints: -1.5, maxPoints: -1.5, label: 'strong stated score', known: true }
  if (profile.creditScore >= 700) return { minPoints: 0, maxPoints: 0, label: 'moderate stated score', known: true }
  return { minPoints: 2.5, maxPoints: 2.5, label: 'weaker stated score', known: true }
}

function rateBand(profile, route) {
  const [baseMin, baseMax] = RATE_BASE[route.key]
  const credit = creditAdjustment(profile)
  let min = baseMin + credit.minPoints
  let max = baseMax + credit.maxPoints
  if (profile.incomeType !== 'salaried') { min += 1; max += 1 }

  // A Negotiation Card is a borrower benchmark, not a simulation of the lender's
  // worst-case risk price. Bounce/high-cost debt are therefore surfaced as
  // decision risk flags rather than stacked into an extreme "fair" rate.
  const riskFlags = []
  if (profile.recentBounce) riskFlags.push('recent bounced payment')
  if (profile.highCostDebt) riskFlags.push('high-cost debt')
  max = Math.min(max, baseMax + RULES.fairRateCapBuffer)
  min = Math.min(min, max)

  const confidence = credit.known && !profile.recentBounce && !profile.highCostDebt ? 'Medium-high' : credit.known ? 'Medium' : 'Low'
  const riskText = riskFlags.length ? ` Risk flags: ${riskFlags.join(' and ')} are handled in the borrowing verdict rather than used to inflate the fair-rate benchmark.` : ''
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
  if (!amount) return { apr: 0, fee: 0, net: 0 }
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
  return { apr: ((1 + (low + high) / 2) ** 12 - 1) * 100, fee, net }
}

function confidence(profile, normalized) {
  let score = 3
  if (profile.creditScore == null) score -= 1
  if (profile.incomeType !== 'salaried') score -= 1
  const expensesComplete = profile.expensesKnown === true && Number.isFinite(Number(profile.monthlyExpenses))
  if (!expensesComplete) score -= 1
  if (profile.recentBounce) score -= 1
  if (!safeNumber(profile.age)) score -= 1
  return { level: score >= 3 ? 'High' : score >= 2 ? 'Medium' : 'Low', score, reason: `${profile.creditScore == null ? 'Credit history is unavailable. ' : ''}${profile.incomeType !== 'salaried' ? 'Income is variable or partly undocumented. ' : ''}${!expensesComplete ? `Household expenses are unknown, so a ${RULES.unknownExpenseRatio * 100}% household-income proxy is used. ` : ''}${!safeNumber(profile.age) ? 'Age is unavailable. ' : ''}${profile.recentBounce ? 'A recent bounce makes the risk picture less settled. ' : ''}${profile.highCostDebt ? 'High-cost debt is present. ' : ''}${`Income was normalized to ${formatInr(normalized.monthly)}.`}`.trim() }
}

function buildTenureTradeoff(principal, annualRate, tenure, maximumTenure) {
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
  const normalized = normalizeIncome(profile)
  const otherHouseholdIncome = Math.max(0, safeNumber(profile.otherHouseholdIncome))
  const affordabilityResult = affordability(profile, normalized.monthly, otherHouseholdIncome)
  const route = productRoute(profile)
  const rate = rateBand(profile, route)
  const averageRate = (rate.min + rate.max) / 2
  const tenure = allowedTenure(profile)
  const lenderAmount = calculateMaximumPrincipal(affordabilityResult.lenderAvailable, averageRate, tenure)
  const incomeSafeAmount = calculateMaximumPrincipal(affordabilityResult.safeAvailable, averageRate, tenure)
  const collateralCap = safeNumber(profile.collateralValue) * RULES.securedLtv
  const safe = Math.min(incomeSafeAmount, route.key === 'lap' && collateralCap > 0 ? collateralCap : incomeSafeAmount)
  const practicalAmount = Math.min(lenderAmount, safe)
  const recommendedEmi = practicalAmount < incomeSafeAmount
    ? calculateEmi(practicalAmount, averageRate, tenure)
    : affordabilityResult.safeAvailable
  const requested = Math.max(0, safeNumber(profile.requestedAmount))
  const stressIncome = normalized.monthly * (1 - RULES.stressIncomeDrop)
  const stressAffordability = affordability(profile, stressIncome, otherHouseholdIncome, { stress: true })
  const stressEmi = calculateEmi(requested, rate.max + RULES.stressRateIncrease * 100, tenure)
  const stress = { income: stressIncome, householdIncome: stressAffordability.householdIncome, safeAvailable: stressAffordability.safeAvailable, expensesUsed: stressAffordability.expensesUsed, requestedEmi: stressEmi, survives: stressEmi <= stressAffordability.safeAvailable }
  const severeDebt = profile.highCostDebt === true && profile.recentBounce === true
  const noCapacity = affordabilityResult.safeAvailable <= 0
  const requestedTooHigh = requested > practicalAmount
  const decision = severeDebt || noCapacity ? 'DON’T BORROW' : requestedTooHigh ? 'BORROW LESS' : 'BORROW'
  const decisionReason = severeDebt ? 'Existing high-cost debt and a recent bounce mean new borrowing could deepen the debt problem.' : noCapacity ? 'The conservative monthly headroom is already used by existing commitments and household costs.' : requestedTooHigh ? `The request is above the practical amount of ${formatLakhs(practicalAmount)} that is both affordable and within the lender-side estimate.` : 'The request fits inside both the lender-side estimate and the conservative household ceiling.'
  const aprLow = calculateApr(practicalAmount, rate.min, tenure).apr
  const aprHigh = calculateApr(practicalAmount, rate.max, tenure).apr
  const aprFee = practicalAmount * RULES.processingFee
  const age = safeNumber(profile.age)
  const maximumTenure = age ? Math.max(RULES.minTenureMonths, Math.min(RULES.maxTenureMonths, (RULES.retirementAge - age) * 12)) : RULES.maxTenureMonths
  const tenureTradeoff = buildTenureTradeoff(practicalAmount, averageRate, tenure, maximumTenure)
  const tenureNote = age && tenure < safeNumber(profile.tenureMonths, tenure) ? `Tenure is limited to ${tenure} months using the ${RULES.retirementAge}-year age assumption.` : `Tenure used is ${tenure} months.`
  const expenseNote = affordabilityResult.monthlyExpenses != null
    ? `Known household expenses of ${formatInr(affordabilityResult.monthlyExpenses)} are subtracted from the ${RULES.safeFoir * 100}% FOIR ceiling after existing EMIs, leaving ${formatInr(affordabilityResult.safeAvailable)} for a new EMI.`
    : `Household expenses are unknown, so the model uses a ${RULES.unknownExpenseRatio * 100}% household-income expense proxy (${formatInr(affordabilityResult.expensesUsed)}) instead of treating unknown as ₹0.`
  const householdIncomeNote = otherHouseholdIncome > 0 ? `${formatInr(otherHouseholdIncome)} of other household income is included in the borrower-safe household calculation, but not in lender-side sanction capacity.` : 'No other household income is included in the safe household calculation.'
  const stressExpenseNote = `Stress uses ${formatInr(stressAffordability.expensesUsed)} of household expenses, reduced by ${RULES.stressExpenseReduction * 100}% to represent limited variable-spend adjustment rather than assuming every expense is fixed.`
  return {
    normalized,
    affordability: affordabilityResult,
    route,
    rate,
    lenderAmount,
    safeAmount: safe,
    practicalAmount,
    requested,
    decision,
    decisionReason,
    stress,
    confidence: confidence(profile, normalized),
    apr: { min: aprLow, max: aprHigh, fee: aprFee },
    recommendedEmi,
    tenure,
    tenureTradeoff,
    explanation: [normalized.method, `Existing EMI of ${formatInr(affordabilityResult.existingEmi)} is counted before new borrowing.`, `Safe headroom is ${formatInr(affordabilityResult.safeAvailable)} after applying the ${RULES.safeFoir * 100}% borrower-safe FOIR rule.`, householdIncomeNote, `Practical amount is the lower of lender-side capacity (${formatLakhs(lenderAmount)}) and borrower-safe capacity (${formatLakhs(safe)}).`, expenseNote, stressExpenseNote, tenureNote, route.reason],
  }
}

export const SAMPLE_BORROWERS = {
  Priya: { name: 'Priya', age: 29, city: 'Bengaluru', incomeType: 'salaried', monthlyIncome: 110000, existingEmi: 14000, otherHouseholdIncome: 0, expensesKnown: true, monthlyExpenses: 28000, creditScore: 780, requestedAmount: 800000, purpose: 'wedding', loanType: 'personal', tenureMonths: 48, recentBounce: false, highCostDebt: false, collateralValue: 0 },
  Ravi: { name: 'Ravi', age: 42, city: 'Mysuru', incomeType: 'self-employed', monthlyIncome: 60000, incomeLow: 40000, incomeHigh: 80000, documentedAnnualIncome: 420000, existingEmi: 0, otherHouseholdIncome: 18000, expensesKnown: false, monthlyExpenses: null, creditScore: null, requestedAmount: 1500000, purpose: 'business', loanType: 'business', collateralValue: 4500000, tenureMonths: 60, recentBounce: false, highCostDebt: false },
  Anita: { name: 'Anita', age: 35, city: 'Hubballi', incomeType: 'variable', incomeLow: 26000, incomeHigh: 30000, documentedAnnualIncome: 0, existingEmi: 1050, otherHouseholdIncome: 0, expensesKnown: false, monthlyExpenses: null, creditScore: null, requestedAmount: 150000, purpose: 'vehicle', loanType: 'vehicle', collateralValue: 0, tenureMonths: 36, recentBounce: true, highCostDebt: true },
}

export const QUESTION_DEFINITIONS = [
  { id: 'purpose', label: 'What are you borrowing for?', type: 'select', options: [['wedding', 'Wedding or family event'], ['business', 'Business or stock'], ['vehicle', 'Two-wheeler'], ['debt', 'Paying existing debt'], ['other', 'Something else']], affects: 'decision, route, rate' },
  { id: 'loanType', label: 'What loan type are you considering?', type: 'select', options: [['not-sure', 'Not sure'], ['personal', 'Personal loan'], ['business', 'Business loan'], ['lap', 'Loan against property'], ['vehicle', 'Two-wheeler loan']], affects: 'route, rate' },
  { id: 'requestedAmount', label: 'How much do you want to borrow?', type: 'number', prefix: '₹', affects: 'decision, stress' },
  { id: 'incomeType', label: 'How does your income arrive?', type: 'select', options: [['salaried', 'Salaried'], ['self-employed', 'Self-employed'], ['variable', 'Informal or variable']], affects: 'normalization, rate, confidence' },
  { id: 'monthlyIncome', label: 'Your usual monthly take-home', type: 'number', prefix: '₹', visible: (profile) => profile.incomeType === 'salaried', affects: 'affordability' },
  { id: 'incomeLow', label: 'Lower monthly income', type: 'number', prefix: '₹', visible: (profile) => profile.incomeType !== 'salaried', affects: 'normalization, affordability' },
  { id: 'incomeHigh', label: 'Higher monthly income', type: 'number', prefix: '₹', visible: (profile) => profile.incomeType !== 'salaried', affects: 'normalization, affordability' },
  { id: 'documentedAnnualIncome', label: 'Annual documented income (ITR)', type: 'number', prefix: '₹', visible: (profile) => profile.incomeType === 'self-employed', affects: 'normalization, confidence' },
  { id: 'existingEmi', label: 'Existing monthly EMIs', type: 'number', prefix: '₹', affects: 'affordability, decision' },
  { id: 'otherHouseholdIncome', label: 'Other household income you expect to rely on', type: 'number', prefix: '₹', visible: (profile) => profile.incomeType !== 'salaried', optional: true, affects: 'safe amount, stress' },
  { id: 'monthlyExpenses', label: 'Monthly household expenses, excluding EMIs', type: 'number', prefix: '₹', visible: (profile) => profile.expensesKnown === true, affects: 'safe amount, confidence' },
  { id: 'expensesKnown', label: 'Do you know your monthly household expenses?', type: 'select', options: [['true', 'Yes'], ['false', 'Not yet']], affects: 'safe amount, confidence' },
  { id: 'age', label: 'Your age', type: 'number', min: 18, max: 80, affects: 'tenure, confidence' },
  { id: 'creditScore', label: 'Credit score, if known', type: 'number', visible: () => true, optional: true, affects: 'rate, confidence' },
  { id: 'collateralValue', label: 'Unencumbered property or collateral value', type: 'number', prefix: '₹', visible: (profile) => profile.incomeType === 'self-employed' || profile.purpose === 'business' || profile.loanType === 'lap', optional: true, affects: 'route, safe amount' },
  { id: 'recentBounce', label: 'Any EMI bounced in the last 6 months?', type: 'select', options: [['false', 'No'], ['true', 'Yes']], affects: 'decision, confidence' },
  { id: 'highCostDebt', label: 'Any app or short-term debt above 24%?', type: 'select', options: [['false', 'No'], ['true', 'Yes']], affects: 'decision, confidence' },
  { id: 'tenureMonths', label: 'Preferred tenure', type: 'select', options: [['24', '2 years'], ['36', '3 years'], ['48', '4 years'], ['60', '5 years'], ['84', '7 years']], affects: 'EMI, APR, safe amount' },
]
