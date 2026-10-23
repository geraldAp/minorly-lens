import { CURRENCIES, MoneyError } from 'minorly'
import type { SupportedCurrency } from 'minorly'
import { parseAmount } from '../../domain/money'
import { parsePercentage } from '../../domain/percentage'
import type { CalculationInput, FeeAllocation, FeeRule, PlatformMarkupRule } from '../../domain/types'

export interface CalculatorFormValues {
  currency: string
  originalAmount: string
  providerMode: FeeRule['mode']
  providerPercentage: string
  providerFixed: string
  markupMode: PlatformMarkupRule['mode']
  markupPercentage: string
  markupFixed: string
  allocationMode: FeeAllocation['mode']
  buyerPercentage: string
}

export const defaultValues: CalculatorFormValues = {
  currency: 'GHS', originalAmount: '',
  providerMode: 'percentage-plus-fixed', providerPercentage: '', providerFixed: '',
  markupMode: 'none', markupPercentage: '', markupFixed: '',
  allocationMode: 'buyer-pays-all', buyerPercentage: '50',
}

export type FormErrors = Partial<Record<keyof CalculatorFormValues, string>>
type ParsedForm = { ok: true; input: CalculationInput } | { ok: false; errors: FormErrors }

// CONVERT ACTIVE FORM FIELDS INTO CALCULATOR INPUTS OR RETURN FIELD ERRORS.
export function parseCalculatorForm(values: CalculatorFormValues): ParsedForm {
  const errors: FormErrors = {}
  if (!Object.hasOwn(CURRENCIES, values.currency)) {
    return { ok: false, errors: { currency: 'Choose a supported currency.' } }
  }
  const currency = values.currency as SupportedCurrency
  // PARSE ONE FIELD AND RECORD EXPECTED VALIDATION ERRORS AGAINST THAT FIELD.
  function read(field: keyof CalculatorFormValues, parse: (value: string) => bigint) {
    try {
      return parse(values[field])
    } catch (error) {
      if (!(error instanceof MoneyError)) throw error
      errors[field] = error.message
      return undefined
    }
  }
  // CONVERT AN AMOUNT STRING INTO EXACT MINOR UNITS FOR THE SELECTED CURRENCY.
  const amount = (value: string) => parseAmount(value, currency)
  const originalAmountMinor = read('originalAmount', amount)
  // BUILD A PROVIDER OR MARKUP RULE USING ONLY THE SELECTED FEE TYPE'S FIELDS.
  function fee(prefix: 'provider' | 'markup'): PlatformMarkupRule | undefined {
    const mode = values[`${prefix}Mode`]
    if (mode === 'none' && prefix === 'markup') return { mode: 'none' }
    if (!['fixed', 'percentage', 'percentage-plus-fixed'].includes(mode)) {
      errors[`${prefix}Mode`] = 'Choose a supported fee type.'
      return undefined
    }
    const fixed = mode === 'percentage' ? 0n : read(`${prefix}Fixed`, amount)
    const percentage = mode === 'fixed' ? 0n : read(`${prefix}Percentage`, parsePercentage)
    if (fixed === undefined || percentage === undefined) return undefined
    if (mode === 'fixed') return { mode, amountMinor: fixed }
    if (mode === 'percentage') return { mode, percentageScaled: percentage }
    return { mode: 'percentage-plus-fixed', amountMinor: fixed, percentageScaled: percentage }
  }
  const providerFee = fee('provider')
  const platformMarkup = fee('markup')
  let allocation: FeeAllocation | undefined
  switch (values.allocationMode) {
    case 'buyer-pays-all': case 'seller-pays-all':
      allocation = { mode: values.allocationMode }
      break
    case 'custom': {
      const buyerPercentageScaled = read('buyerPercentage', parsePercentage)
      if (buyerPercentageScaled !== undefined) allocation = { mode: 'custom', buyerPercentageScaled }
      break
    }
    default:
      errors.allocationMode = 'Choose who pays the fees.'
  }
  if (Object.keys(errors).length || originalAmountMinor === undefined || !providerFee
    || providerFee.mode === 'none' || !platformMarkup || !allocation) {
    return { ok: false, errors }
  }
  return { ok: true, input: { currency, originalAmountMinor, providerFee, platformMarkup, allocation } }
}
