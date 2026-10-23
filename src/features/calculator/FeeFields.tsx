import { useId } from 'react'
import { useWatch } from 'react-hook-form'
import { Field } from './Field'
import type { CalculatorFormControls } from './hooks/useCalculatorForm'

export function FeeFields({ prefix, form, currency }: {
  prefix: 'provider' | 'markup'; form: CalculatorFormControls; currency: string
}) {
  const id = useId()
  const mode = useWatch({ control: form.control, name: `${prefix}Mode` })
  const error = form.formState.errors[`${prefix}Mode`]?.message
  return (
    <fieldset className="input-section">
      <legend>{prefix === 'provider' ? 'Provider fee' : 'Platform markup'}</legend>
      <div className="field">
        <label htmlFor={id}>{prefix === 'provider' ? 'Fee type' : 'Markup type'}</label>
        <select id={id} {...form.register(`${prefix}Mode`)} aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}>
          {prefix === 'markup' && <option value="none">No markup</option>}
          <option value="fixed">Fixed amount</option>
          <option value="percentage">Percentage</option>
          <option value="percentage-plus-fixed">Percentage + fixed amount</option>
        </select>
        {error && <p id={`${id}-error`} className="field-error">{error}</p>}
      </div>
      {mode !== 'none' && (
        <div className={mode === 'percentage-plus-fixed' ? 'field-pair' : 'fee-values'}>
          {mode !== 'fixed' && <Field form={form} name={`${prefix}Percentage`}
            label="Percentage (%)" percentage placeholder="0" />}
          {mode !== 'percentage' && <Field form={form} name={`${prefix}Fixed`}
            label={`Fixed amount (${currency})`} placeholder="0" />}
        </div>
      )}
    </fieldset>
  )
}
