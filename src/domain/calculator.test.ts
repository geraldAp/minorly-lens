import { MoneyError } from 'minorly'
import { describe, expect, it } from 'vitest'
import { calculateTransaction } from './calculator'
import { formatAmount, parseAmount } from './money'
import { parsePercentage } from './percentage'
import type { CalculationInput, FeeAllocation, FeeRule, PlatformMarkupRule } from './types'

const exampleInput: CalculationInput = {
  currency: 'GHS',
  originalAmountMinor: 10_000n,
  providerFee: { mode: 'percentage-plus-fixed', percentageScaled: 20_000n, amountMinor: 100n },
  platformMarkup: { mode: 'percentage', percentageScaled: 10_000n },
  allocation: { mode: 'custom', buyerPercentageScaled: 500_000n },
}

describe('calculateTransaction', () => {
  it('returns the full breakdown for the GHS 100 example', () => {
    expect(calculateTransaction(exampleInput)).toEqual({
      currency: 'GHS',
      originalAmountMinor: 10_000n,
      providerFeeMinor: 300n,
      platformMarkupMinor: 100n,
      combinedFeesMinor: 400n,
      buyerFeeShareMinor: 200n,
      sellerFeeShareMinor: 200n,
      buyerTotalMinor: 10_200n,
      sellerNetMinor: 9_800n,
    })
  })

  it.each([
    {
      label: 'buyer pays all', allocation: { mode: 'buyer-pays-all' },
      buyerTotal: 10_400n, sellerNet: 10_000n,
    },
    {
      label: 'seller pays all', allocation: { mode: 'seller-pays-all' },
      buyerTotal: 10_000n, sellerNet: 9_600n,
    },
    {
      label: '75/25 split', allocation: { mode: 'custom', buyerPercentageScaled: 750_000n },
      buyerTotal: 10_300n, sellerNet: 9_900n,
    },
    {
      label: '0% buyer share', allocation: { mode: 'custom', buyerPercentageScaled: 0n },
      buyerTotal: 10_000n, sellerNet: 9_600n,
    },
    {
      label: '100% buyer share', allocation: { mode: 'custom', buyerPercentageScaled: 1_000_000n },
      buyerTotal: 10_400n, sellerNet: 10_000n,
    },
  ] as const)('calculates totals for $label', ({ allocation, buyerTotal, sellerNet }) => {
    const result = calculateTransaction({ ...exampleInput, allocation })
    expect(result.buyerTotalMinor).toBe(buyerTotal)
    expect(result.sellerNetMinor).toBe(sellerNet)
  })

  it('assigns an odd allocation remainder to the buyer without losing a minor unit', () => {
    const result = calculateTransaction({
      ...exampleInput,
      originalAmountMinor: 100n,
      providerFee: { mode: 'fixed', amountMinor: 1n },
      platformMarkup: { mode: 'none' },
    })
    expect(result.buyerFeeShareMinor).toBe(1n)
    expect(result.sellerFeeShareMinor).toBe(0n)
    expect(result.buyerTotalMinor).toBe(101n)
    expect(result.sellerNetMinor).toBe(100n)
  })

  it.each([
    { mode: 'buyer-pays-all' },
    { mode: 'seller-pays-all' },
    { mode: 'custom', buyerPercentageScaled: 500_000n },
  ] as const)('accepts zero amounts and zero fees with $mode', (allocation) => {
    const result = calculateTransaction({
      ...exampleInput,
      originalAmountMinor: 0n,
      providerFee: { mode: 'fixed', amountMinor: 0n },
      platformMarkup: { mode: 'none' },
      allocation,
    })
    expect(result.combinedFeesMinor).toBe(0n)
    expect(result.buyerTotalMinor).toBe(0n)
    expect(result.sellerNetMinor).toBe(0n)
  })

  it('allows the buyer to cover fixed fees on a zero transaction', () => {
    const result = calculateTransaction({
      ...exampleInput,
      originalAmountMinor: 0n,
      providerFee: { mode: 'fixed', amountMinor: 100n },
      platformMarkup: { mode: 'fixed', amountMinor: 50n },
      allocation: { mode: 'buyer-pays-all' },
    })
    expect(result.combinedFeesMinor).toBe(150n)
    expect(result.buyerTotalMinor).toBe(150n)
    expect(result.sellerNetMinor).toBe(0n)
  })

  it.each([
    { mode: 'seller-pays-all' },
    { mode: 'custom', buyerPercentageScaled: 500_000n },
  ] as const)('rejects seller-funded fees on a zero transaction with $mode', (allocation) => {
    expect(() => calculateTransaction({
      ...exampleInput,
      originalAmountMinor: 0n,
      providerFee: { mode: 'fixed', amountMinor: 100n },
      platformMarkup: { mode: 'none' },
      allocation,
    })).toThrow('Seller fee share exceeds the original amount.')
  })

  it('allows a seller receipt of exactly zero', () => {
    const result = calculateTransaction({
      ...exampleInput,
      originalAmountMinor: 100n,
      providerFee: { mode: 'fixed', amountMinor: 100n },
      platformMarkup: { mode: 'none' },
      allocation: { mode: 'seller-pays-all' },
    })
    expect(result.buyerTotalMinor).toBe(100n)
    expect(result.sellerNetMinor).toBe(0n)
  })

  it('allows combined fees above the original amount when the seller share fits', () => {
    const result = calculateTransaction({
      ...exampleInput,
      originalAmountMinor: 100n,
      providerFee: { mode: 'fixed', amountMinor: 201n },
      platformMarkup: { mode: 'none' },
    })
    expect(result.buyerFeeShareMinor).toBe(101n)
    expect(result.sellerFeeShareMinor).toBe(100n)
    expect(result.buyerTotalMinor).toBe(201n)
    expect(result.sellerNetMinor).toBe(0n)
  })

  it('rejects a seller fee share one unit above the original amount instead of clamping', () => {
    expect(() => calculateTransaction({
      ...exampleInput,
      originalAmountMinor: 100n,
      providerFee: { mode: 'fixed', amountMinor: 101n },
      platformMarkup: { mode: 'none' },
      allocation: { mode: 'seller-pays-all' },
    })).toThrow('Seller fee share exceeds the original amount.')
  })

  it('accepts a buyer total exactly at the prototype limit', () => {
    const result = calculateTransaction({
      ...exampleInput,
      originalAmountMinor: 9_007_199_254_740_990n,
      providerFee: { mode: 'fixed', amountMinor: 1n },
      platformMarkup: { mode: 'none' },
      allocation: { mode: 'buyer-pays-all' },
    })
    expect(result.buyerTotalMinor).toBe(9_007_199_254_740_991n)
    expect(result.sellerNetMinor).toBe(9_007_199_254_740_990n)
  })

  it('accepts the maximum original amount when the seller covers the fee', () => {
    const result = calculateTransaction({
      ...exampleInput,
      originalAmountMinor: 9_007_199_254_740_991n,
      providerFee: { mode: 'fixed', amountMinor: 1n },
      platformMarkup: { mode: 'none' },
      allocation: { mode: 'seller-pays-all' },
    })
    expect(result.buyerTotalMinor).toBe(9_007_199_254_740_991n)
    expect(result.sellerNetMinor).toBe(9_007_199_254_740_990n)
  })

  it('rejects buyer-total overflow even when the original amount and fee are valid', () => {
    expect(() => calculateTransaction({
      ...exampleInput,
      originalAmountMinor: 9_007_199_254_740_991n,
      providerFee: { mode: 'fixed', amountMinor: 1n },
      platformMarkup: { mode: 'none' },
      allocation: { mode: 'buyer-pays-all' },
    })).toThrow('Buyer total exceeds the prototype limit.')
  })

  it.each([-1n, 9_007_199_254_740_992n])('rejects out-of-bounds original amount %s', (amount) => {
    expect(() => calculateTransaction({ ...exampleInput, originalAmountMinor: amount }))
      .toThrow(MoneyError)
  })

  it.each(['CAD', 'toString'])('rejects unsupported runtime currency %s', (currency) => {
    // @ts-expect-error Check untrusted runtime data despite the currency type.
    expect(() => calculateTransaction({ ...exampleInput, currency })).toThrow(MoneyError)
  })

  it('rejects combined fee overflow through the composed calculator', () => {
    expect(() => calculateTransaction({
      ...exampleInput,
      originalAmountMinor: 0n,
      providerFee: { mode: 'fixed', amountMinor: 9_007_199_254_740_991n },
      platformMarkup: { mode: 'fixed', amountMinor: 1n },
    })).toThrow(MoneyError)
  })

  it('validates allocation even when the original amount and fees are zero', () => {
    expect(() => calculateTransaction({
      ...exampleInput,
      originalAmountMinor: 0n,
      providerFee: { mode: 'fixed', amountMinor: 0n },
      platformMarkup: { mode: 'none' },
      allocation: { mode: 'custom', buyerPercentageScaled: 1_000_001n },
    })).toThrow(MoneyError)
  })

  it.each([100n, 10_000n, 1_000_000n])('preserves the accounting invariant for original amount %s', (amount) => {
    const providers: FeeRule[] = [
      { mode: 'fixed', amountMinor: 0n },
      { mode: 'fixed', amountMinor: 1n },
      { mode: 'percentage', percentageScaled: 20_000n },
      { mode: 'percentage-plus-fixed', percentageScaled: 12_750n, amountMinor: 1n },
    ]
    const markups: PlatformMarkupRule[] = [
      { mode: 'none' },
      { mode: 'fixed', amountMinor: 1n },
      { mode: 'percentage', percentageScaled: 10_000n },
      { mode: 'percentage-plus-fixed', percentageScaled: 2_500n, amountMinor: 1n },
    ]
    const allocations: FeeAllocation[] = [
      { mode: 'buyer-pays-all' },
      { mode: 'seller-pays-all' },
      { mode: 'custom', buyerPercentageScaled: 333_333n },
      { mode: 'custom', buyerPercentageScaled: 500_000n },
    ]

    for (const providerFee of providers) {
      for (const platformMarkup of markups) {
        for (const allocation of allocations) {
          const result = calculateTransaction({
            currency: 'GHS', originalAmountMinor: amount, providerFee, platformMarkup, allocation,
          })

          expect(result.buyerTotalMinor).toBe(
            result.sellerNetMinor + result.providerFeeMinor + result.platformMarkupMinor,
          )
          expect(result.buyerFeeShareMinor + result.sellerFeeShareMinor).toBe(result.combinedFeesMinor)
          expect(result.sellerNetMinor >= 0n).toBe(true)
          expect(result.buyerTotalMinor <= 9_007_199_254_740_991n).toBe(true)
        }
      }
    }
  })

  it.each([
    ['GHS', 'GHS 102.00', 'GHS 98.00'],
    ['JPY', 'JPY 102', 'JPY 98'],
  ] as const)('calculates from input strings through formatted results in %s', (currency, buyer, seller) => {
    const result = calculateTransaction({
      currency,
      originalAmountMinor: parseAmount('100', currency),
      providerFee: {
        mode: 'percentage-plus-fixed',
        percentageScaled: parsePercentage('2'),
        amountMinor: parseAmount('1', currency),
      },
      platformMarkup: { mode: 'percentage', percentageScaled: parsePercentage('1') },
      allocation: { mode: 'custom', buyerPercentageScaled: parsePercentage('50') },
    })

    expect(formatAmount(result.buyerTotalMinor, currency)).toBe(buyer)
    expect(formatAmount(result.sellerNetMinor, currency)).toBe(seller)
  })
})
