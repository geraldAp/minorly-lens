import { MoneyError } from 'minorly'

export function roundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (numerator < 0n) {
    throw new MoneyError('Rounding numerator cannot be negative.')
  }

  if (denominator <= 0n) {
    throw new MoneyError('Rounding denominator must be positive.')
  }

  return (numerator + denominator / 2n) / denominator
}
