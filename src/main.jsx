import React, { useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { evaluateBorrower, formatInr, formatLakhs, formatPercent, QUESTION_DEFINITIONS, RULES, SAMPLE_BORROWERS, validateProfileInputs } from './domain/rules'
import './styles.css'

const blank = { name: '', age: null, city: '', purpose: 'wedding', loanType: 'not-sure', requestedAmount: null, incomeType: 'salaried', monthlyIncome: null, incomeLow: null, incomeHigh: null, documentedAnnualIncome: null, existingEmi: null, otherHouseholdIncome: null, housingType: 'own', monthlyRent: null, creditStatus: 'unknown', creditScore: null, collateralValue: 0, recentBounce: false, highCostDebt: false, tenureMonths: null }
const asValue = (key, value) => {
  if (['recentBounce', 'highCostDebt'].includes(key)) return value === 'true'
  if (['creditScore', 'collateralValue', 'requestedAmount', 'monthlyIncome', 'incomeLow', 'incomeHigh', 'documentedAnnualIncome', 'existingEmi', 'otherHouseholdIncome', 'monthlyRent', 'tenureMonths', 'age'].includes(key)) return value === '' ? null : Number(value)
  return value
}

function QuestionField({ question, profile, update }) {
  const value = profile[question.id]
  const missing = question.required && (value == null || value === '' || (question.type === 'number' && Number.isNaN(Number(value))) )
  const showMissing = missing && (value != null || question.id === 'monthlyRent' || question.id === 'tenureMonths' || question.id === 'creditScore')
  return <label className="field" key={question.id}><span>{question.label}{question.optional && <small> optional</small>}{question.required && <small> required</small>}</span>{question.type === 'select' ? <select value={String(value ?? '')} onChange={(event) => update(question.id, event.target.value)}>{question.options.map(([optionValue, label]) => <option key={optionValue} value={optionValue}>{label}</option>)}</select> : <div className="input-wrap">{question.prefix && <b>{question.prefix}</b>}<input type="number" min={question.min ?? 0} max={question.max} required={question.required} aria-invalid={showMissing} value={value ?? ''} onChange={(event) => update(question.id, event.target.value)} />{question.suffix && <b>{question.suffix}</b>}</div>}{showMissing && <small className="field-error">Enter this value to continue.</small>}<small className="affects">Affects {question.affects}</small></label>
}

function App() {
  const [profile, setProfile] = useState(blank)
  const [stage, setStageState] = useState('intro')
  const result = useMemo(() => evaluateBorrower(profile), [profile])
  const visibleQuestions = QUESTION_DEFINITIONS.filter((question) => !question.visible || question.visible(profile))
  const mustQuestions = visibleQuestions.filter((question) => question.tier === 'must')
  const additionalQuestions = visibleQuestions.filter((question) => question.tier === 'additional')
  const update = (key, value) => setProfile((current) => {
    const next = { ...current, [key]: asValue(key, value) }
    if (key === 'housingType' && next.housingType === 'own') next.monthlyRent = 0
    if (key === 'creditStatus' && next.creditStatus !== 'known') next.creditScore = null
    return next
  })
  const mustQuestionsAreComplete = mustQuestions.every((question) => {
    const value = profile[question.id]
    if (question.type !== 'number') return value != null && value !== ''
    if (value == null || value === '') return false
    const number = Number(value)
    return Number.isFinite(number) && (question.id === 'existingEmi' || question.id === 'monthlyRent' ? number >= 0 : number > 0)
  })
  const validationErrors = validateProfileInputs(profile)
  const canShowResults = mustQuestionsAreComplete && validationErrors.length === 0
  const setStage = (nextStage) => {
    if (nextStage === 'result' && !canShowResults) return
    setStageState(nextStage)
  }
  const loadSample = (name) => { setProfile({ ...blank, ...SAMPLE_BORROWERS[name] }); setStage('form') }
  const reset = () => { setProfile(blank); setStage('intro') }

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">B</span><span>Borrower <i>Copilot</i></span></div><div className="top-note">Private, local, illustrative</div></header>
    {stage === 'intro' && <main className="intro-page">
      <div className="kicker">A decision workspace for Indian borrowers</div>
      <h1>Before you borrow, know what you can <em>carry.</em></h1>
      <p className="intro-copy">A clear self-assessment for the conversation before the lender conversation. We will show what a lender may size, what is safer for you, and where the uncertainty lives.</p>
      <button className="primary-button" onClick={() => setStage('form')}>Start with your numbers <span>↗</span></button>
      <div className="promise-row"><span><b>01</b> Borrow or pause</span><span><b>02</b> A safe range</span><span><b>03</b> Your negotiation card</span></div>
      <section className="sample-section"><div><div className="section-label">See the model in motion</div><h2>Try one of the three challenge borrowers</h2><p>These are illustrative profiles from the brief. They are prefilled so you can inspect the reasoning without entering every number.</p></div><div className="sample-list">{Object.keys(SAMPLE_BORROWERS).map((name) => <button key={name} className="sample-button" onClick={() => loadSample(name)}><span><b>{name}</b><small>{SAMPLE_BORROWERS[name].purpose === 'business' ? 'Business growth' : SAMPLE_BORROWERS[name].purpose === 'vehicle' ? 'Electric scooter' : 'Wedding loan'}</small></span><span>→</span></button>)}</div></section>
    </main>}
    {stage === 'form' && <main className="workspace"><div className="progress"><span>YOUR PICTURE</span><div><i className="active"/><i/><i/></div><span>1 / 3</span></div><div className="workspace-heading"><div className="kicker">Start with the minimum picture</div><h1>What would make this borrowing <em>wise?</em></h1><p>The must-answer questions produce the core affordability, EMI, rate and decision outputs. Extra questions only appear when they can tighten an answer. Unknown information stays unknown; it never quietly becomes a favourable zero.</p></div><div className="form-layout"><section className="question-panel"><div className="section-label">Must answer</div><div className="question-grid">{mustQuestions.map((question) => <QuestionField key={question.id} question={question} profile={profile} update={update} />)}</div>{additionalQuestions.length > 0 && <details className="additional-questions"><summary>Improve the estimate with more details</summary><p>These questions adapt to your profile. They can tighten the route, rate, confidence or borrower-safe amount without blocking the core assessment.</p><div className="question-grid">{additionalQuestions.map((question) => <QuestionField key={question.id} question={question} profile={profile} update={update} />)}</div></details>}<div className="form-actions"><button className="quiet-button" onClick={reset}>Start over</button><button className="primary-button" disabled={!canShowResults} aria-disabled={!canShowResults} onClick={() => setStage('result')}>See my assessment <span>↗</span></button></div></section><aside className="live-preview"><div className="section-label">Live preview</div><div className="preview-number">{result.decision === 'DON’T BORROW' ? '₹0' : formatLakhs(result.safeAmount)}</div><p>{result.decision === 'DON’T BORROW' ? 'amount to borrow now' : 'borrower-safe amount to plan around'}</p><div className="preview-line"><span>{result.decision === 'DON’T BORROW' ? 'Mathematical safe ceiling' : 'Borrower-safe EMI ceiling'}</span><b>{result.decision === 'DON’T BORROW' ? formatLakhs(result.safeAmount) : formatInr(result.recommendedEmi)}</b></div><div className="preview-line"><span>Borrower-safe amount</span><b>{formatLakhs(result.safeAmount)}</b></div><div className="preview-line"><span>Confidence</span><b>{result.confidence.level}</b></div><div className="preview-note">Updates as you answer. This is a planning estimate, not an approval.</div></aside></div></main>}
    {stage === 'result' && <Result profile={profile} result={result} onBack={() => setStage('form')} onReset={reset} />}
  </div>
}

function Result({ result, onBack, onReset }) {
  const [quote, setQuote] = useState('')
  const decisionClass = result.decision === 'BORROW' ? 'good' : result.decision === 'BORROW LESS' ? 'caution' : 'stop'
  return <main className="result-page"><div className="result-toolbar"><button className="text-button" onClick={onBack}>← Edit answers</button><button className="text-button" onClick={() => window.print()}>Print card ↗</button></div><section className={`decision-band ${decisionClass}`}><div><div className="kicker">Your first answer</div><h1>{result.decision.toLowerCase().replace('’', "'")}</h1><p>{result.decisionReason}</p></div><div className="confidence"><span>Confidence</span><b>{result.confidence.level}</b><small>{result.confidence.reason}</small></div></section><section className="result-grid"><div className="main-result"><div className="section-label">The four numbers to take with you</div><div className="amount-compare"><Metric label="You asked for" value={formatLakhs(result.requested)} detail="Your stated amount, not a recommendation."/><Metric label="Estimated lender-side capacity" value={formatLakhs(result.lenderAmount)} detail={`${formatInr(result.affordability.lenderAvailable)} new EMI at ${RULES.lenderFoir * 100}% of normalized borrower income.`}/><Metric emphasis label={result.decision === 'DON’T BORROW' ? 'Mathematical safe ceiling — do not borrow now' : 'Borrower-safe amount — use this for planning'} value={formatLakhs(result.safeAmount)} detail={result.decision === 'DON’T BORROW' ? 'This is a mathematical capacity check only. The current amount to borrow is ₹0.' : 'Use this amount as your personal planning ceiling.'}/></div><div className="why-block"><div className="section-label">Why this answer</div>{result.explanation.map((line) => <p key={line}>↳ {line}</p>)}</div><div className="detail-grid"><article><div className="section-label">Fair rate range</div><strong className="big-mono">{formatPercent(result.rate.min)}–{formatPercent(result.rate.max)}</strong><p>{result.rate.reason}</p></article><article><div className="section-label">All-in APR estimate</div><strong className="big-mono">{formatPercent(result.apr.min)}–{formatPercent(result.apr.max)}</strong><p>{result.apr.disclaimer}</p></article><article><div className="section-label">Product route</div><strong>{result.route.product}</strong><p>{result.route.reason}</p></article><article><div className="section-label">Stress case</div><strong>{result.stress ? (result.stress.survives ? 'Still carries' : 'Buffer breaks') : 'Complete required inputs'}</strong><p>{result.stress ? `With income down ${RULES.stressIncomeDrop * 100}% and the relevant rate stress applied, planned EMI is ${formatInr(result.stress.requestedEmi)} against ${formatInr(result.stress.safeAvailable)} safe room. This is an informational check, not a trigger for the borrowing verdict.` : 'Complete the must-answer inputs first.'}</p></article></div><TenureTradeoff result={result}/></div><NegotiationCard result={result} quote={quote} setQuote={setQuote} /></section><button className="quiet-button bottom-reset" onClick={onReset}>Assess another situation</button></main>
}

function TenureTradeoff({ result }) {
  return <section className="tenure-tradeoff"><div className="section-label">Tenure trade-off</div>{result.absoluteFeasibleCeiling > 0 ? <><p>Shorter tenure means a higher EMI but less total interest. Longer tenure lowers the EMI but costs more interest. These figures use the borrower-safe amount at the rate midpoint.</p><div className="tenure-table"><div className="tenure-row tenure-head"><span>Tenure</span><span>EMI</span><span>Total interest</span></div>{result.tenureTradeoff.map((option) => <div className={`tenure-row ${option.isSelected ? 'selected' : ''}`} key={option.months}><span>{option.months} months{option.isSelected ? ' · selected' : ''}</span><span>{formatInr(option.emi)}</span><span>{formatInr(option.totalInterest)}</span></div>)}</div></> : <p>No feasible borrowing principal is available, so there is no tenure or interest trade-off to compare.</p>}</section>
}

function Metric({ label, value, detail, emphasis }) { return <div className={`metric ${emphasis ? 'emphasis' : ''}`}><span>{label}</span><strong>{value}</strong><small>{detail}</small></div> }
function NegotiationCard({ result, quote, setQuote }) {
  const [quoteApr, setQuoteApr] = useState('')
  const quoteNumber = Number(quote)
  const quoteAprNumber = Number(quoteApr)
  const quoteMessage = quoteNumber > result.rate.max ? `Ask why ${quote}% is above your illustrative benchmark.` : quoteNumber < result.rate.min ? `This is below your illustrative benchmark. Check the full quote and fees before comparing.` : `This quote is within your illustrative benchmark. Compare the APR and fees too.`
  const aprMessage = quoteApr && (result.apr.min == null ? 'No APR benchmark is available because there is no feasible borrowing principal.' : quoteAprNumber > result.apr.max ? `The lender APR is above your illustrative ${formatPercent(result.apr.min)}–${formatPercent(result.apr.max)} ceiling benchmark.` : quoteAprNumber < result.apr.min ? `The lender APR is below the illustrative benchmark; confirm the quoted principal and fees are comparable.` : `The lender APR is within the illustrative benchmark. Confirm the quoted principal and all fees match this comparison.`)
  const cardAmountLabel = result.decision === 'DON’T BORROW' ? 'Amount to borrow now' : 'Recommended amount'
  const cardAmount = result.decision === 'DON’T BORROW' ? 0 : result.safeAmount
  const cardEmiLabel = result.decision === 'DON’T BORROW' ? 'EMI to carry now' : 'EMI ceiling'
  const cardEmi = result.decision === 'DON’T BORROW' ? 0 : result.recommendedEmi
  return <aside className="negotiation-card"><div className="card-top"><span className="brand-mark small">B</span><span>Negotiation Card</span><span className="card-date">LOCAL / PRIVATE</span></div><h2>What I should carry into the lender conversation.</h2><div className="card-hero"><span>{cardAmountLabel}</span><strong>{formatLakhs(cardAmount)}</strong><small>{result.decision === 'DON’T BORROW' ? 'Do not take a new loan now. The mathematical safe ceiling is shown separately below.' : result.decisionReason}</small></div><div className="card-rows"><div><span>Lender-side estimate</span><b>{formatLakhs(result.lenderAmount)}</b></div><div><span>Borrower-safe amount</span><b>{formatLakhs(result.safeAmount)}</b></div><div><span>Fair rate</span><b>{formatPercent(result.rate.min)}–{formatPercent(result.rate.max)}</b></div><div><span>APR incl. fee</span><b>{formatPercent(result.apr.min)}–{formatPercent(result.apr.max)}</b></div><div><span>{cardEmiLabel}</span><b>{formatInr(cardEmi)}</b></div><div><span>Route</span><b>{result.route.product}</b></div></div><div className="quote-check"><label>Compare lender nominal rate<input value={quote} onChange={(event) => setQuote(event.target.value)} placeholder="e.g. 14" type="number" min="0" step="0.1" /><span>%</span></label>{quote && <p className={quoteNumber > result.rate.max ? 'quote-high' : quoteNumber < result.rate.min ? 'quote-low' : 'quote-ok'}>{quoteMessage} Nominal rate is not APR.</p>}<label>Compare lender APR<input value={quoteApr} onChange={(event) => setQuoteApr(event.target.value)} placeholder="e.g. 16.5" type="number" min="0" step="0.1" /><span>%</span></label>{quoteApr && <p className={quoteAprNumber > result.apr.max ? 'quote-high' : quoteAprNumber < result.apr.min ? 'quote-low' : 'quote-ok'}>{aprMessage}</p>}</div><div className="card-foot">Illustrative self-assessment only. Compare APR using the same principal, tenure and all-in fee set as the lender quote.</div></aside>
}

const root = globalThis.__borrowerCopilotRoot ?? createRoot(document.getElementById('root'))
globalThis.__borrowerCopilotRoot = root
root.render(<App />)
