import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { MAX_AMOUNT_INPUT_LENGTH, MAX_PERCENTAGE_INPUT_LENGTH } from '../../domain/limits'
import type { CalculatorFormValues } from './form'
import type { CalculatorFormControls } from './useCalculatorForm'

interface Props {
  name: keyof CalculatorFormValues
  label: string
  form: CalculatorFormControls
  percentage?: boolean
  hint?: string
  placeholder?: string
  className?: string
  id?: string
}

export function Field({ name, label, form, percentage, hint, placeholder, className, id: providedId }: Props) {
  const instanceId = useId()
  const id = providedId ?? instanceId
  const error = form.formState.errors[name]?.message
  const description = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ')
  const attributes: InputHTMLAttributes<HTMLInputElement> = {
    id, type: 'text', inputMode: 'decimal', autoComplete: 'off', spellCheck: false,
    maxLength: percentage ? MAX_PERCENTAGE_INPUT_LENGTH : MAX_AMOUNT_INPUT_LENGTH,
    'aria-invalid': !!error, 'aria-describedby': description || undefined,
    placeholder,
  }
  return (
    <div className={`field ${className ?? ''}`}>
      <label htmlFor={id}>{label}</label>
      <input {...attributes} {...form.register(name)} required />
      {hint && <p className="field-hint" id={`${id}-hint`}>{hint}</p>}
      {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
    </div>
  )
}
