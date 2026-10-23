import { CURRENCIES, MoneyError, toMinorUnit, type SupportedCurrency } from 'minorly'
import { MAX_AMOUNT_INPUT_LENGTH, MAX_AMOUNT_MINOR } from './limits'

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

export function formatAmount(amountMinor: bigint, currency: SupportedCurrency): string {
  if (amountMinor < 0n) {
    throw new MoneyError('Amount cannot be negative.')
  }

  if (amountMinor > MAX_AMOUNT_MINOR) {
    throw new MoneyError('Amount exceeds the prototype limit.')
  }

  if (!Object.hasOwn(CURRENCIES, currency)) {
    throw new MoneyError('Unsupported currency.')
  }

  const { minorUnit } = CURRENCIES[currency]
  const digits = amountMinor.toString().padStart(minorUnit + 1, '0')
  const majorAmount = minorUnit === 0
    ? digits
    : `${digits.slice(0, -minorUnit)}.${digits.slice(-minorUnit)}`

  return `${currency} ${majorAmount}`
}
