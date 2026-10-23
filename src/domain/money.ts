import { CURRENCIES, MoneyError, toMinorUnit, type SupportedCurrency } from 'minorly'
import { MAX_AMOUNT_INPUT_LENGTH } from './limits'

export function parseAmount(input: string, currency: SupportedCurrency): bigint {
  if (input.length === 0) {
    throw new MoneyError('Enter an amount.')
  }

  if (input.length > MAX_AMOUNT_INPUT_LENGTH) {
    throw new MoneyError(`Amount must be at most ${MAX_AMOUNT_INPUT_LENGTH} characters.`)
  }

  // Reject whitespace rather than letting Minorly trim it. This also rejects a
  // trailing newline, which a regex ending in "$" alone could otherwise accept.
  if (input !== input.trim() || !/^\d+(\.\d+)?$/.test(input)) {
    throw new MoneyError('Enter a plain, non-negative decimal amount.')
  }

  if (!Object.hasOwn(CURRENCIES, currency)) {
    throw new MoneyError('Unsupported currency.')
  }

  const { minorUnit } = CURRENCIES[currency]
  const fractionalPart = input.split('.')[1] ?? ''

  if (fractionalPart.length > minorUnit) {
    throw new MoneyError(`${currency} supports at most ${minorUnit} decimal places.`)
  }

  // Minorly parses the decimal string exactly and rejects unsafe integers.
  // Its safe-integer number result can then be converted to bigint exactly.
  return BigInt(toMinorUnit(input, currency))
}
