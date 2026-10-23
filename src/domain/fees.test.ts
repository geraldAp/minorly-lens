import { MoneyError } from 'minorly'
import { describe, expect, it } from 'vitest'
import { calculateFee, calculateFees } from './fees'

describe('calculateFee', () => {
  it('returns a fixed fee in minor units', () => {
    expect(calculateFee(10_000n, { mode: 'fixed', amountMinor: 100n })).toBe(100n)
  })

  it('allows a zero fixed fee', () => {
    expect(calculateFee(10_000n, { mode: 'fixed', amountMinor: 0n })).toBe(0n)
  })

  it('allows a fixed fee above the original amount before allocation', () => {
    expect(calculateFee(100n, { mode: 'fixed', amountMinor: 200n })).toBe(200n)
  })

  it('calculates a percentage of the original amount', () => {
    expect(calculateFee(10_000n, { mode: 'percentage', percentageScaled: 20_000n })).toBe(200n)
  })

  it('supports fractional percentages and rounds half up', () => {
    // 1.275% of GHS 100 is GHS 1.275, rounded to GHS 1.28.
    expect(calculateFee(10_000n, { mode: 'percentage', percentageScaled: 12_750n })).toBe(128n)
  })

  it.each([
    [24n, 20_000n, 0n],
    [25n, 20_000n, 1n],
    [26n, 20_000n, 1n],
    [499_999n, 1n, 0n],
    [500_000n, 1n, 1n],
    [500_001n, 1n, 1n],
  ] as const)('rounds amount %s at scaled rate %s to %s minor units', (amount, rate, expected) => {
    expect(calculateFee(amount, { mode: 'percentage', percentageScaled: rate })).toBe(expected)
  })

  it.each([
    [0n, 0n],
    [1_000_000n, 10_000n],
  ] as const)('accepts the percentage boundary %s', (rate, expected) => {
    expect(calculateFee(10_000n, { mode: 'percentage', percentageScaled: rate })).toBe(expected)
  })

  it('adds the fixed fee without including it in the percentage base', () => {
    expect(calculateFee(10_000n, {
      mode: 'percentage-plus-fixed',
      percentageScaled: 20_000n,
      amountMinor: 100n,
    })).toBe(300n)
  })

  it('rounds a fractional percentage fee before adding the fixed fee', () => {
    expect(calculateFee(10_000n, {
      mode: 'percentage-plus-fixed',
      percentageScaled: 12_750n,
      amountMinor: 100n,
    })).toBe(228n)
  })

  it('keeps fixed fees when the original amount is zero', () => {
    expect(calculateFee(0n, { mode: 'fixed', amountMinor: 100n })).toBe(100n)
    expect(calculateFee(0n, { mode: 'percentage', percentageScaled: 20_000n })).toBe(0n)
    expect(calculateFee(0n, {
      mode: 'percentage-plus-fixed',
      percentageScaled: 20_000n,
      amountMinor: 100n,
    })).toBe(100n)
  })

  it('handles large integer intermediates without losing precision', () => {
    expect(calculateFee(9_007_199_254_740_991n, {
      mode: 'percentage', percentageScaled: 1_000_000n,
    })).toBe(9_007_199_254_740_991n)
    expect(calculateFee(9_007_199_254_740_991n, {
      mode: 'percentage', percentageScaled: 500_000n,
    })).toBe(4_503_599_627_370_496n)
    expect(calculateFee(0n, {
      mode: 'fixed', amountMinor: 9_007_199_254_740_991n,
    })).toBe(9_007_199_254_740_991n)
  })

  it.each([-1n, 9_007_199_254_740_992n])('rejects original amount %s outside the bounds', (amount) => {
    expect(() => calculateFee(amount, { mode: 'fixed', amountMinor: 100n })).toThrow(MoneyError)
  })

  it.each([-1n, 9_007_199_254_740_992n])('rejects fixed component %s outside the bounds', (amount) => {
    expect(() => calculateFee(0n, { mode: 'fixed', amountMinor: amount })).toThrow(MoneyError)
    expect(() => calculateFee(0n, {
      mode: 'percentage-plus-fixed', percentageScaled: 0n, amountMinor: amount,
    })).toThrow(MoneyError)
  })

  it.each([-1n, 1_000_001n])('rejects scaled percentage %s outside the bounds', (rate) => {
    expect(() => calculateFee(100n, {
      mode: 'percentage', percentageScaled: rate,
    })).toThrow(MoneyError)
    expect(() => calculateFee(100n, {
      mode: 'percentage-plus-fixed', percentageScaled: rate, amountMinor: 0n,
    })).toThrow(MoneyError)
  })

  it('rejects an oversized result even when each input is within bounds', () => {
    expect(() => calculateFee(9_007_199_254_740_991n, {
      mode: 'percentage-plus-fixed', percentageScaled: 1_000_000n, amountMinor: 1n,
    })).toThrow(MoneyError)
  })

  it('rejects an unsupported fee mode at runtime', () => {
    // @ts-expect-error Check untrusted runtime data despite the fee-rule type.
    expect(() => calculateFee(100n, { mode: 'none' })).toThrow(MoneyError)
  })
})

describe('calculateFees', () => {
  const providerRule = {
    mode: 'percentage-plus-fixed',
    percentageScaled: 20_000n,
    amountMinor: 100n,
  } as const

  it('supports no platform markup', () => {
    expect(calculateFees(10_000n, providerRule, { mode: 'none' })).toEqual({
      providerFeeMinor: 300n,
      platformMarkupMinor: 0n,
      combinedFeesMinor: 300n,
    })
  })

  it('adds a fixed platform markup', () => {
    expect(calculateFees(10_000n, providerRule, {
      mode: 'fixed', amountMinor: 100n,
    })).toEqual({
      providerFeeMinor: 300n,
      platformMarkupMinor: 100n,
      combinedFeesMinor: 400n,
    })
  })

  it('calculates markup from the original amount before combining fees', () => {
    expect(calculateFees(10_000n, providerRule, {
      mode: 'percentage', percentageScaled: 10_000n,
    })).toEqual({
      providerFeeMinor: 300n,
      platformMarkupMinor: 100n,
      combinedFeesMinor: 400n,
    })
  })

  it('supports percentage plus fixed platform markup', () => {
    expect(calculateFees(10_000n, providerRule, {
      mode: 'percentage-plus-fixed', percentageScaled: 10_000n, amountMinor: 50n,
    })).toEqual({
      providerFeeMinor: 300n,
      platformMarkupMinor: 150n,
      combinedFeesMinor: 450n,
    })
  })

  it('rounds provider and markup percentage fees separately before adding them', () => {
    // Each 50% fee on one minor unit rounds from half a unit to one unit.
    expect(calculateFees(1n,
      { mode: 'percentage', percentageScaled: 500_000n },
      { mode: 'percentage', percentageScaled: 500_000n },
    )).toEqual({ providerFeeMinor: 1n, platformMarkupMinor: 1n, combinedFeesMinor: 2n })
  })

  it('retains configured fixed fees for a zero transaction amount', () => {
    expect(calculateFees(0n, providerRule, {
      mode: 'percentage-plus-fixed', percentageScaled: 10_000n, amountMinor: 50n,
    })).toEqual({ providerFeeMinor: 100n, platformMarkupMinor: 50n, combinedFeesMinor: 150n })
  })

  it('returns zero for percentage-only fees on a zero amount', () => {
    expect(calculateFees(0n,
      { mode: 'percentage', percentageScaled: 20_000n },
      { mode: 'percentage', percentageScaled: 10_000n },
    )).toEqual({ providerFeeMinor: 0n, platformMarkupMinor: 0n, combinedFeesMinor: 0n })
  })

  it('accepts combined fees exactly at the prototype limit', () => {
    expect(calculateFees(0n,
      { mode: 'fixed', amountMinor: 9_007_199_254_740_990n },
      { mode: 'fixed', amountMinor: 1n },
    )).toEqual({
      providerFeeMinor: 9_007_199_254_740_990n,
      platformMarkupMinor: 1n,
      combinedFeesMinor: 9_007_199_254_740_991n,
    })
  })

  it('rejects oversized combined fees when both components are within bounds', () => {
    expect(() => calculateFees(0n,
      { mode: 'fixed', amountMinor: 9_007_199_254_740_991n },
      { mode: 'fixed', amountMinor: 1n },
    )).toThrow(MoneyError)
  })

  it.each([-1n, 9_007_199_254_740_992n])('rejects invalid original amount %s with no markup', (amount) => {
    expect(() => calculateFees(amount, providerRule, { mode: 'none' })).toThrow(MoneyError)
  })

  it.each([-1n, 9_007_199_254_740_992n])('rejects invalid fixed markup %s', (amount) => {
    expect(() => calculateFees(10_000n, providerRule, {
      mode: 'fixed', amountMinor: amount,
    })).toThrow(MoneyError)
  })

  it.each([-1n, 1_000_001n])('rejects invalid markup percentage %s', (rate) => {
    expect(() => calculateFees(10_000n, providerRule, {
      mode: 'percentage', percentageScaled: rate,
    })).toThrow(MoneyError)
  })

  it('validates the provider fee when markup is none', () => {
    expect(() => calculateFees(100n,
      { mode: 'fixed', amountMinor: -1n }, { mode: 'none' },
    )).toThrow(MoneyError)
  })

  it('rejects an unsupported markup mode at runtime', () => {
    // @ts-expect-error Check untrusted runtime data despite the markup-rule type.
    expect(() => calculateFees(100n, providerRule, { mode: 'unknown' })).toThrow(MoneyError)
  })
})
