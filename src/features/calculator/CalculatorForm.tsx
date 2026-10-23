import { useId } from 'react'
import { CURRENCIES } from 'minorly'
import type { SupportedCurrency } from 'minorly'
import { useWatch } from 'react-hook-form'
import type { CalculationInput } from '../../domain/types'
import { FeeFields } from './FeeFields'
import { AllocationFields } from './AllocationFields'
import { Field } from './Field'
import type { CalculatorFormControls } from './useCalculatorForm'

export function CalculatorForm({ form, onCalculate, hidden }: {
  form: CalculatorFormControls; onCalculate: (input: CalculationInput) => void; hidden: boolean
}) {
  const id = useId()
  const currency = useWatch({ control: form.control, name: 'currency' })
  const minorUnit = CURRENCIES[currency as SupportedCurrency]?.minorUnit
  const currencyError = form.formState.errors.currency?.message
  const calculationError = form.formState.errors.root?.calculation?.message
  return (
    <form id="calculator-inputs" noValidate hidden={hidden}
      onSubmit={form.handleSubmit(onCalculate)} onChange={() => form.clearErrors('root')}>
      <fieldset className="input-section amount-section">
        <legend>Transaction</legend>
        <div className="transaction-fields">
          <Field form={form} name="originalAmount" label="Original amount" className="original-amount"
            placeholder={minorUnit === 0 ? '0' : '0.00'}
            hint={minorUnit === 0 ? 'Whole amounts only for JPY.' : 'Use a decimal point, without commas.'} />
          <div className="field currency-field">
            <label htmlFor={id}>Currency</label>
            <select id={id} {...form.register('currency')} aria-invalid={!!currencyError}
              aria-describedby={currencyError ? `${id}-error` : undefined}>
              {Object.keys(CURRENCIES).map(code => <option key={code} value={code}>{code}</option>)}
            </select>
            {currencyError && <p className="field-error" id={`${id}-error`}>{currencyError}</p>}
          </div>
        </div>
      </fieldset>
      <FeeFields prefix="provider" form={form} currency={currency} />
      <FeeFields prefix="markup" form={form} currency={currency} />
      <AllocationFields form={form} />
      {calculationError && <p className="calculation-error" role="alert">{calculationError}</p>}
      <button id="calculate-estimate" className="primary-action" type="submit">Calculate estimate
        <span aria-hidden="true"> →</span>
      </button>
    </form>
  )
}
