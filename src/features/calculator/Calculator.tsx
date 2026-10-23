import { useState } from 'react'
import { MoneyError } from 'minorly'
import { calculateTransaction } from '../../domain/calculator'
import type { CalculationInput, CalculationResult as Result } from '../../domain/types'
import { CalculatorForm } from './CalculatorForm'
import { CalculationResult } from './CalculationResult'
import { useCalculatorForm } from './useCalculatorForm'

export function Calculator() {
  const form = useCalculatorForm()
  const [result, setResult] = useState<Result | null>(null)
  function calculate(input: CalculationInput) {
    try {
      setResult(calculateTransaction(input))
    } catch (error) {
      if (!(error instanceof MoneyError)) throw error
      setResult(null)
      form.setError('root.calculation', { message: error.message })
    }
  }
  function edit() {
    setResult(null)
    requestAnimationFrame(() => form.setFocus('originalAmount'))
  }

  return (
    <>
      <a className="skip-link" href="#calculator">Skip to calculator</a>
      <main id="calculator" className="lens-shell">
        <header className="app-header">
          <div><span className="app-name">Minorly Lens</span><h1>Fee calculator</h1></div>
          <span className="estimate-label">Estimate</span>
        </header>
        <CalculatorForm form={form} onCalculate={calculate} hidden={!!result} />
        {result && <CalculationResult result={result} onEdit={edit} />}
        <footer className="assumptions">
          <p>Percentage fees use the original transaction amount.</p>
          <p>Fee rounding: half up to the currency’s smallest unit. A half-unit tie rounds upward.</p>
          <p>Configurable estimates, not guaranteed provider quotes.</p>
        </footer>
        <p className="sr-only" role="status">{result ? 'Estimate calculated. Buyer and seller totals are ready.' : ''}</p>
      </main>
    </>
  )
}
