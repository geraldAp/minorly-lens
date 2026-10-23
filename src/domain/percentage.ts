import { MoneyError } from 'minorly'
import {
  MAX_PERCENTAGE_INPUT_LENGTH,
  MAX_PERCENTAGE_SCALED,
  PERCENTAGE_DECIMAL_PLACES,
  PERCENTAGE_SCALE,
} from './limits'

export function parsePercentage(input: string): bigint {
  if (input.length > MAX_PERCENTAGE_INPUT_LENGTH) {
    throw new MoneyError(`Percentage must be at most ${MAX_PERCENTAGE_INPUT_LENGTH} characters.`)
  }

  const normalized = input.trim()

  if (normalized.length === 0) {
    throw new MoneyError('Enter a percentage.')
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new MoneyError('Enter a non-negative decimal percentage, such as 1.275.')
  }

  const [wholePart, fractionalPart = ''] = normalized.split('.')

  if (fractionalPart.length > PERCENTAGE_DECIMAL_PLACES) {
    throw new MoneyError(`Percentage supports at most ${PERCENTAGE_DECIMAL_PLACES} decimal places.`)
  }

  // Pad the fractional digits instead of converting the decimal text to number.
  const paddedFraction = fractionalPart.padEnd(PERCENTAGE_DECIMAL_PLACES, '0')
  const percentageScaled = BigInt(wholePart) * PERCENTAGE_SCALE + BigInt(paddedFraction)

  if (percentageScaled > MAX_PERCENTAGE_SCALED) {
    throw new MoneyError('Percentage must be between 0 and 100.')
  }

  return percentageScaled
}
