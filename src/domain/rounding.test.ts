import { MoneyError } from 'minorly'
import { describe, expect, it } from 'vitest'
import { roundHalfUp } from './rounding'

describe('roundHalfUp', () => {
  it.each([
    [0n, 1n, 0n],
    [0n, 1_000_000n, 0n],
    [6n, 3n, 2n],
    [49n, 100n, 0n],
    [50n, 100n, 1n],
    [51n, 100n, 1n],
    [150n, 100n, 2n],
    [250n, 100n, 3n],
    [1n, 3n, 0n],
    [2n, 3n, 1n],
    [5n, 2n, 3n],
  ] as const)('rounds %s divided by %s to %s', (numerator, denominator, expected) => {
    expect(roundHalfUp(numerator, denominator)).toBe(expected)
  })

  it('rounds large intermediate values exactly', () => {
    expect(roundHalfUp(9_007_199_254_740_991_000_000n, 1_000_000n))
      .toBe(9_007_199_254_740_991n)
    expect(roundHalfUp(4_503_599_627_370_495_500_000n, 1_000_000n))
      .toBe(4_503_599_627_370_496n)
  })

  it('leaves monetary range validation to the caller', () => {
    expect(roundHalfUp(9_007_199_254_740_992n, 1n)).toBe(9_007_199_254_740_992n)
  })

  it.each([-1n, -100n])('rejects negative numerator %s', (numerator) => {
    expect(() => roundHalfUp(numerator, 100n)).toThrow(MoneyError)
  })

  it.each([0n, -1n, -100n])('rejects non-positive denominator %s', (denominator) => {
    expect(() => roundHalfUp(0n, denominator)).toThrow(MoneyError)
  })
})
