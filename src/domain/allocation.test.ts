import { MoneyError } from 'minorly'
import { describe, expect, it } from 'vitest'
import { allocateFees } from './allocation'

describe('allocateFees', () => {
  it('assigns all combined fees to the buyer', () => {
    expect(allocateFees(400n, { mode: 'buyer-pays-all' })).toEqual({
      buyerFeeShareMinor: 400n,
      sellerFeeShareMinor: 0n,
    })
  })

  it('assigns all combined fees to the seller', () => {
    expect(allocateFees(400n, { mode: 'seller-pays-all' })).toEqual({
      buyerFeeShareMinor: 0n,
      sellerFeeShareMinor: 400n,
    })
  })

  it.each([
    { mode: 'buyer-pays-all' },
    { mode: 'seller-pays-all' },
    { mode: 'custom', buyerPercentageScaled: 500_000n },
  ] as const)('allocates zero fees with $mode', (allocation) => {
    expect(allocateFees(0n, allocation)).toEqual({ buyerFeeShareMinor: 0n, sellerFeeShareMinor: 0n })
  })

  it.each([
    [400n, 500_000n, 200n, 200n],
    [401n, 500_000n, 201n, 200n],
    [1n, 500_000n, 1n, 0n],
    [1n, 499_999n, 0n, 1n],
    [1n, 500_001n, 1n, 0n],
    [400n, 0n, 0n, 400n],
    [400n, 1_000_000n, 400n, 0n],
    [300n, 333_333n, 100n, 200n],
  ] as const)('splits fee %s at buyer rate %s into %s and %s', (fee, rate, buyerShare, sellerShare) => {
    expect(allocateFees(fee, { mode: 'custom', buyerPercentageScaled: rate })).toEqual({
      buyerFeeShareMinor: buyerShare,
      sellerFeeShareMinor: sellerShare,
    })
  })

  it('preserves precision while splitting the maximum fee', () => {
    expect(allocateFees(9_007_199_254_740_991n, {
      mode: 'custom', buyerPercentageScaled: 500_000n,
    })).toEqual({
      buyerFeeShareMinor: 4_503_599_627_370_496n,
      sellerFeeShareMinor: 4_503_599_627_370_495n,
    })
  })

  it.each([0n, 1n, 3n, 400n, 401n, 9_007_199_254_740_991n])(
    'keeps shares non-negative and preserves total fees of %s',
    (fee) => {
      for (const rate of [0n, 1n, 12_750n, 333_333n, 500_000n, 999_999n, 1_000_000n]) {
        const shares = allocateFees(fee, { mode: 'custom', buyerPercentageScaled: rate })

        expect(shares.buyerFeeShareMinor + shares.sellerFeeShareMinor).toBe(fee)
        expect(shares.buyerFeeShareMinor >= 0n).toBe(true)
        expect(shares.sellerFeeShareMinor >= 0n).toBe(true)
      }
    },
  )

  it.each([-1n, 9_007_199_254_740_992n])('rejects fee %s outside the bounds for every mode', (fee) => {
    expect(() => allocateFees(fee, { mode: 'buyer-pays-all' })).toThrow(MoneyError)
    expect(() => allocateFees(fee, { mode: 'seller-pays-all' })).toThrow(MoneyError)
    expect(() => allocateFees(fee, {
      mode: 'custom', buyerPercentageScaled: 500_000n,
    })).toThrow(MoneyError)
  })

  it.each([-1n, 1_000_001n])('rejects buyer percentage %s even when fees are zero', (rate) => {
    expect(() => allocateFees(0n, {
      mode: 'custom', buyerPercentageScaled: rate,
    })).toThrow(MoneyError)
    expect(() => allocateFees(400n, {
      mode: 'custom', buyerPercentageScaled: rate,
    })).toThrow(MoneyError)
  })

  it('rejects an unsupported allocation mode even when fees are zero', () => {
    // @ts-expect-error Check untrusted runtime data despite the allocation type.
    expect(() => allocateFees(0n, { mode: 'platform-pays-all' })).toThrow(MoneyError)
  })
})
