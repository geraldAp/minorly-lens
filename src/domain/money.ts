import { MoneyError, toMinorUnit, type SupportedCurrency } from 'minorly'
import { MAX_AMOUNT_INPUT_LENGTH } from './limits'

export function parseAmount(input: string, currency: SupportedCurrency): bigint {
  if (input.length > MAX_AMOUNT_INPUT_LENGTH) {
    throw new MoneyError(`Amount must be at most ${MAX_AMOUNT_INPUT_LENGTH} characters.`)
  }

  // Minorly permits negative values and removes commas; Lens rejects both.
  if (input.includes('-')) {
    throw new MoneyError('Amount cannot be negative.')
  }

  if (input.includes(',')) {
    throw new MoneyError('Use a dot as the decimal separator, without commas.')
  }

  // Minorly trims surrounding whitespace and validates syntax, currency,
  // decimal precision and safe-integer bounds before returning an exact integer.
  return BigInt(toMinorUnit(input, currency))
}
