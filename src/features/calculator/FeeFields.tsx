import { useId } from 'react'
import { useWatch } from 'react-hook-form'
import { CALCULATION_MODES } from '../../domain/constants'
import { Field } from './Field'
import { FEE_SOURCE } from './constants'
import type { FeeSource } from './constants'
import type { CalculatorFormControls } from './hooks/useCalculatorForm'

export function FeeFields({ prefix, form, currency }: {
  prefix: FeeSource; form: CalculatorFormControls; currency: string
}) {
  const id = useId()
  const mode = useWatch({ control: form.control, name: `${prefix}Mode` })
  const error = form.formState.errors[`${prefix}Mode`]?.message
  return (
    <fieldset className="input-section">
      <legend>{prefix === FEE_SOURCE.PROVIDER ? 'Provider fee' : 'Platform markup'}</legend>
      <div className="field">
        <label htmlFor={id}>{prefix === FEE_SOURCE.PROVIDER ? 'Fee type' : 'Markup type'}</label>
        <select id={id} {...form.register(`${prefix}Mode`)} aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}>
          {prefix === FEE_SOURCE.MARKUP && <option value={CALCULATION_MODES.markup.NONE}>No markup</option>}
          <option value={CALCULATION_MODES.fee.FIXED}>Fixed amount</option>
          <option value={CALCULATION_MODES.fee.PERCENTAGE}>Percentage</option>
          <option value={CALCULATION_MODES.fee.PERCENTAGE_PLUS_FIXED}>Percentage + fixed amount</option>
        </select>
        {error && <p id={`${id}-error`} className="field-error">{error}</p>}
      </div>
      {mode !== CALCULATION_MODES.markup.NONE && (
        <div className={mode === CALCULATION_MODES.fee.PERCENTAGE_PLUS_FIXED ? 'field-pair' : 'fee-values'}>
          {mode !== CALCULATION_MODES.fee.FIXED && <Field form={form} name={`${prefix}Percentage`}
            label="Percentage (%)" percentage placeholder="0" />}
          {mode !== CALCULATION_MODES.fee.PERCENTAGE && <Field form={form} name={`${prefix}Fixed`}
            label={`Fixed amount (${currency})`} placeholder="0" />}
        </div>
      )}
    </fieldset>
  )
}
