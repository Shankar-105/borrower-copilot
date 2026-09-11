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

function affordability(profile, income, otherHouseholdIncome = 0) {
  const existingEmi = Math.max(0, safeNumber(profile.existingEmi))
  const lenderTotal = income * RULES.lenderFoir
  const lenderAvailable = Math.max(0, lenderTotal - existingEmi)
  const householdIncome = Math.max(0, income + safeNumber(otherHouseholdIncome))
  const safeTotal = householdIncome * RULES.safeFoir
  const rentRequired = profile.housingType === 'rent'
  const rentObligation = rentRequired ? Math.max(0, safeNumber(profile.monthlyRent)) : 0
  const rentMissing = rentRequired && rentObligation <= 0
  const householdExpenses = Math.max(0, safeNumber(profile.monthlyHouseholdExpenses))
  const borrowerOutgoings = rentObligation + householdExpenses + existingEmi
  const safeAvailable = rentMissing ? 0 : Math.max(0, safeTotal - borrowerOutgoings)
  return {
    existingEmi,
    lenderTotal,
    safeTotal,
    lenderAvailable,
    safeAvailable,
    rentObligation,
    rentMissing,
    householdExpenses,
    borrowerOutgoings,
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

function creditAdjustment(profile, route) {
  if (profile.creditScore == null && route.key === 'lap') return { minPoints: 0, maxPoints: 0, label: 'thin credit file offset by secured collateral', known: false }
  if (profile.creditScore == null) return { minPoints: 2, maxPoints: 3, label: 'unknown credit history', known: false }
  if (profile.creditScore >= 750) return { minPoints: -1.5, maxPoints: -1.5, label: 'strong stated score', known: true }
  if (profile.creditScore >= 700) return { minPoints: 0, maxPoints: 0, label: 'moderate stated score', known: true }
  return { minPoints: 2.5, maxPoints: 2.5, label: 'weaker stated score', known: true }
}

function rateBand(profile, route) {
  const [baseMin, baseMax] = RATE_BASE[route.key]
  const credit = creditAdjustment(profile, route)
  let min = baseMin + credit.minPoints
  let max = baseMax + credit.maxPoints
  if (profile.incomeType !== 'salaried') { min += 1; max += 1 }

  const riskFlags = []
  if (profile.recentBounce) riskFlags.push('recent bounced payment')
  if (profile.highCostDebt) riskFlags.push('high-cost debt')
  min = Math.min(min, max)

  const confidence = credit.known && !profile.recentBounce && !profile.highCostDebt ? 'Medium-high' : credit.known ? 'Medium' : 'Low'
  const riskText = riskFlags.length ? ` Risk flags: ${riskFlags.join(' and ')} are handled in the borrowing verdict rather than used to inflate the rate benchmark.` : ''
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
  if (!amount) return { apr: 0, fee: 0, net: 0, isEstimated: true, disclaimer: 'No borrowing amount was available for an APR estimate.' }
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

function confidence(profile, normalized) {
  let score = 3
  if (profile.creditScore == null) score -= 1
  if (profile.incomeType !== 'salaried') score -= 1
  if (profile.recentBounce) score -= 1
  if (!safeNumber(profile.age)) score -= 1
  const rentStatus = profile.housingType === 'rent' && safeNumber(profile.monthlyRent) <= 0 ? 'Rent is missing, so the borrower-safe result is set to zero until it is supplied. ' : ''
  const expenseStatus = profile.monthlyHouseholdExpenses == null ? 'Household expenses are missing. ' : ''
  return { level: score >= 3 ? 'High' : score >= 2 ? 'Medium' : 'Low', score, reason: `${profile.creditScore == null ? 'Credit history is unavailable. ' : ''}${profile.incomeType !== 'salaried' ? 'Income is variable or partly undocumented. ' : ''}${rentStatus}${expenseStatus}${!safeNumber(profile.age) ? 'Age is unavailable. ' : ''}${profile.recentBounce ? 'A recent bounce makes the risk picture less settled. ' : ''}${profile.highCostDebt ? 'High-cost debt is present. ' : ''}${`Income was normalized to ${formatInr(normalized.monthly)}.`}`.trim() }
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
  const collateralCap = safeNumber(profile.collateralValue) * RULES.securedLtv
  const lenderIncomeAmount = calculateMaximumPrincipal(affordabilityResult.lenderAvailable, averageRate, tenure)
  const lenderAmount = route.key === 'lap' ? Math.min(lenderIncomeAmount, collateralCap) : lenderIncomeAmount
  const safeAmount = calculateMaximumPrincipal(affordabilityResult.safeAvailable, averageRate, tenure)
  const requested = Math.max(0, safeNumber(profile.requestedAmount))
  const absoluteFeasibleCeiling = Math.min(lenderAmount, safeAmount)
  const targetPrincipal = Math.min(requested, absoluteFeasibleCeiling)
  const recommendedEmi = calculateEmi(targetPrincipal, averageRate, tenure)
  const stressIncome = normalized.monthly * (1 - RULES.stressIncomeDrop)
  const stressAffordability = affordability(profile, stressIncome, otherHouseholdIncome)
  const stressRateIncrease = route.key === 'lap' ? RULES.stressRateIncrease : 0
  const stressEmi = calculateEmi(requested, rate.max + stressRateIncrease * 100, tenure)
  const stress = { income: stressIncome, householdIncome: stressAffordability.householdIncome, safeAvailable: stressAffordability.safeAvailable, requestedEmi: stressEmi, survives: stressEmi <= stressAffordability.safeAvailable }
  const severeDebt = profile.highCostDebt === true && profile.recentBounce === true
  const noCapacity = affordabilityResult.safeAvailable <= 0
  const exceedsSafeCapacity = requested > safeAmount
  const exceedsLenderCapacity = requested > lenderAmount
  const requestedTooHigh = requested > absoluteFeasibleCeiling
  const decision = noCapacity || severeDebt ? 'DON’T BORROW' : requestedTooHigh ? 'BORROW LESS' : 'BORROW'
  const decisionReason = severeDebt
    ? 'Existing high-cost debt and a recent bounce mean new borrowing could deepen the debt problem.'
    : noCapacity
      ? 'The conservative monthly headroom is already used by existing commitments and household costs.'
      : requestedTooHigh && exceedsSafeCapacity && exceedsLenderCapacity
        ? `The request exceeds both your borrower-safe ceiling of ${formatLakhs(safeAmount)} and the lender-side estimate of ${formatLakhs(lenderAmount)}.`
        : requestedTooHigh && exceedsSafeCapacity
          ? `The request exceeds your borrower-safe ceiling of ${formatLakhs(safeAmount)}; a lender offering more would not make that monthly burden safe.`
          : requestedTooHigh && exceedsLenderCapacity
            ? `The request exceeds the lender-side estimate of ${formatLakhs(lenderAmount)}, which is constrained by institutional affordability or collateral policy.`
            : 'The request fits inside both the lender-side estimate and the conservative borrower-safe ceiling.'
  const aprLow = calculateApr(absoluteFeasibleCeiling, rate.min, tenure).apr
  const aprHigh = calculateApr(absoluteFeasibleCeiling, rate.max, tenure).apr
  const aprFee = absoluteFeasibleCeiling * RULES.processingFee
  const age = safeNumber(profile.age)
  const maximumTenure = age ? Math.max(RULES.minTenureMonths, Math.min(RULES.maxTenureMonths, (RULES.retirementAge - age) * 12)) : RULES.maxTenureMonths
  const tradeoffPrincipal = requested > absoluteFeasibleCeiling ? absoluteFeasibleCeiling : requested
  const tenureTradeoff = buildTenureTradeoff(tradeoffPrincipal, averageRate, tenure, maximumTenure)
  const tenureNote = age && tenure < safeNumber(profile.tenureMonths, tenure) ? `Tenure is limited to ${tenure} months using the ${RULES.retirementAge}-year age assumption.` : `Tenure used is ${tenure} months.`
  const expenseNote = `Borrower safety uses stated household income, other household income, rent of ${formatInr(affordabilityResult.rentObligation)}, household expenses of ${formatInr(affordabilityResult.householdExpenses)}, and existing EMI of ${formatInr(affordabilityResult.existingEmi)}; this leaves ${formatInr(affordabilityResult.safeAvailable)} for a new EMI.`
  const householdIncomeNote = otherHouseholdIncome > 0 ? `${formatInr(otherHouseholdIncome)} of other household income is included in the borrower-safe household calculation, but not in lender-side sanction capacity.` : 'No other household income is included in the safe household calculation.'
  const stressExpenseNote = `Stress reduces normalized borrower income by ${RULES.stressIncomeDrop * 100}%; rent, household expenses, and existing EMI remain unchanged. ${route.key === 'lap' ? `The secured route also tests a ${RULES.stressRateIncrease * 100}-point rate rise.` : 'The selected fixed-rate route does not assume a contractual rate rise.'} ${stress.survives ? 'The requested EMI remains inside stressed room.' : 'The requested EMI exceeds stressed room; do not accept this requested amount without changing the plan.'}`
  const leverageNote = route.key === 'lap' && collateralCap > 0
    ? `Your unencumbered collateral supports a lender-side cap of ${formatLakhs(collateralCap)}; ask the lender to explain any quote above the ${formatPercent(rate.min)}–${formatPercent(rate.max)} benchmark.`
    : profile.creditScore >= 750
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
    confidence: confidence(profile, normalized),
    apr,
    recommendedEmi,
    tenure,
    tenureTradeoff,
    explanation: [`Say: "I can carry a contractual EMI of ${formatInr(recommendedEmi)} for this request; please show me the offer without crossing that ceiling."`, `Say: "Your estimated lender-side capacity is ${formatLakhs(lenderAmount)}, but my borrower-safe ceiling is ${formatLakhs(safeAmount)}; I will negotiate from the safer figure."`, `Say: "My existing EMI of ${formatInr(affordabilityResult.existingEmi)} is already committed, so it cannot be counted as new-loan capacity."`, normalized.method, householdIncomeNote, expenseNote, leverageNote, stressExpenseNote, tenureNote, route.reason],
  }
}

export const SAMPLE_BORROWERS = {
  Priya: { name: 'Priya', age: 29, city: 'Bengaluru', incomeType: 'salaried', monthlyIncome: 110000, existingEmi: 14000, monthlyHouseholdExpenses: 10000, otherHouseholdIncome: 0, housingType: 'rent', monthlyRent: 28000, creditScore: 780, requestedAmount: 800000, purpose: 'wedding', loanType: 'personal', tenureMonths: 48, recentBounce: false, highCostDebt: false, collateralValue: 0 },
  Ravi: { name: 'Ravi', age: 42, city: 'Mysuru', incomeType: 'self-employed', monthlyIncome: 60000, incomeLow: 40000, incomeHigh: 80000, documentedAnnualIncome: 420000, existingEmi: 0, monthlyHouseholdExpenses: 8000, otherHouseholdIncome: 18000, housingType: 'own', monthlyRent: 0, creditScore: null, requestedAmount: 1500000, purpose: 'business', loanType: 'business', collateralValue: 4500000, tenureMonths: 60, recentBounce: false, highCostDebt: false },
  Anita: { name: 'Anita', age: 35, city: 'Hubballi', incomeType: 'variable', incomeLow: 26000, incomeHigh: 30000, documentedAnnualIncome: 0, existingEmi: 1050, monthlyHouseholdExpenses: 8000, otherHouseholdIncome: 0, housingType: 'own', monthlyRent: 0, creditScore: null, requestedAmount: 150000, purpose: 'vehicle', loanType: 'vehicle', collateralValue: 0, tenureMonths: 36, recentBounce: true, highCostDebt: true },
}

export const QUESTION_DEFINITIONS = [
  { id: 'purpose', label: 'What are you borrowing for?', type: 'select', options: [['wedding', 'Wedding or family event'], ['business', 'Business or stock'], ['vehicle', 'Two-wheeler'], ['debt', 'Paying existing debt'], ['other', 'Something else']], affects: 'decision, route, rate', tier: 'must' },
  { id: 'loanType', label: 'What loan type are you considering?', type: 'select', options: [['not-sure', 'Not sure'], ['personal', 'Personal loan'], ['business', 'Business loan'], ['lap', 'Loan against property'], ['vehicle', 'Two-wheeler loan']], affects: 'route, rate', tier: 'must' },
  { id: 'requestedAmount', label: 'How much do you want to borrow?', type: 'number', prefix: '₹', required: true, affects: 'decision, stress', tier: 'must' },
  { id: 'incomeType', label: 'How does your income arrive?', type: 'select', options: [['salaried', 'Salaried'], ['self-employed', 'Self-employed'], ['variable', 'Informal or variable']], affects: 'normalization, rate, confidence', tier: 'must' },
  { id: 'monthlyIncome', label: 'Your usual monthly take-home', type: 'number', prefix: '₹', required: true, visible: (profile) => profile.incomeType === 'salaried', affects: 'affordability', tier: 'must' },
  { id: 'incomeLow', label: 'Lower monthly income', type: 'number', prefix: '₹', required: true, visible: (profile) => profile.incomeType !== 'salaried', affects: 'normalization, affordability', tier: 'must' },
  { id: 'incomeHigh', label: 'Higher monthly income', type: 'number', prefix: '₹', required: true, visible: (profile) => profile.incomeType !== 'salaried', affects: 'normalization, affordability', tier: 'must' },
  { id: 'documentedAnnualIncome', label: 'Annual documented income (ITR)', type: 'number', prefix: '₹', visible: (profile) => profile.incomeType === 'self-employed', affects: 'normalization, confidence', tier: 'additional' },
  { id: 'existingEmi', label: 'Existing monthly EMIs', type: 'number', prefix: '₹', required: true, affects: 'affordability, decision', tier: 'must' },
  { id: 'monthlyHouseholdExpenses', label: 'Monthly household expenses, excluding rent and EMIs', type: 'number', prefix: '₹', required: true, affects: 'safe amount, decision, stress', tier: 'must' },
  { id: 'otherHouseholdIncome', label: 'Other household income you expect to rely on', type: 'number', prefix: '₹', optional: true, affects: 'safe amount, stress', tier: 'additional' },
  { id: 'housingType', label: 'Do you own your home or rent?', type: 'select', options: [['own', 'Own House'], ['rent', 'Rent']], affects: 'safe amount, confidence', tier: 'must' },
  { id: 'monthlyRent', label: 'Monthly rent', type: 'number', prefix: '₹', min: 1, required: true, visible: (profile) => profile.housingType === 'rent', affects: 'safe amount, confidence', tier: 'must' },
  { id: 'age', label: 'Your age', type: 'number', min: 18, max: 80, required: true, affects: 'tenure, confidence', tier: 'must' },
  { id: 'creditScore', label: 'Credit score, if known', type: 'number', visible: () => true, optional: true, affects: 'rate, confidence', tier: 'additional' },
  { id: 'collateralValue', label: 'Unencumbered property or collateral value', type: 'number', prefix: '₹', visible: (profile) => profile.incomeType === 'self-employed' || profile.purpose === 'business' || profile.loanType === 'lap', optional: true, affects: 'route, safe amount', tier: 'additional' },
  { id: 'recentBounce', label: 'Any EMI bounced in the last 6 months?', type: 'select', options: [['false', 'No'], ['true', 'Yes']], affects: 'decision, confidence', tier: 'additional' },
  { id: 'highCostDebt', label: 'Any app or short-term debt above 24%?', type: 'select', options: [['false', 'No'], ['true', 'Yes']], affects: 'decision, confidence', tier: 'additional' },
  { id: 'tenureMonths', label: 'Preferred tenure', type: 'select', options: [['24', '2 years'], ['36', '3 years'], ['48', '4 years'], ['60', '5 years'], ['84', '7 years']], affects: 'EMI, APR, safe amount', tier: 'additional' },
]
