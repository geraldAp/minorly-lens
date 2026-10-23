import { useForm } from 'react-hook-form'
import type { FieldErrors, Resolver, UseFormReturn } from 'react-hook-form'
import type { CalculationInput } from '../../domain/types'
import { defaultValues, parseCalculatorForm } from './form'
import type { CalculatorFormValues } from './form'

export type CalculatorFormControls = UseFormReturn<CalculatorFormValues, undefined, CalculationInput>

// React Hook Form receives field errors or the validated calculation input.
// No number coercion or second set of money-validation rules is introduced.
const resolver: Resolver<CalculatorFormValues, undefined, CalculationInput> = (values) => {
  const parsed = parseCalculatorForm(values)
  if (parsed.ok) return { values: parsed.input, errors: {} }
  const errors: FieldErrors<CalculatorFormValues> = {}
  for (const [field, message] of Object.entries(parsed.errors)) {
    errors[field as keyof CalculatorFormValues] = { type: 'validate', message }
  }
  return { values: {}, errors }
}

export function useCalculatorForm() {
  return useForm<CalculatorFormValues, undefined, CalculationInput>({
    defaultValues, resolver, mode: 'onSubmit', reValidateMode: 'onChange',
  })
}
