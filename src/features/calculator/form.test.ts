import { describe, expect, it } from 'vitest'
import { calculateTransaction } from '../../domain/calculator'
import { defaultValues, parseCalculatorForm } from './form'
import type { CalculatorFormValues } from './form'

const example: CalculatorFormValues = {
  ...defaultValues, originalAmount: '100',
  providerPercentage: '2', providerFixed: '1',
  markupMode: 'percentage', markupPercentage: '1',
  allocationMode: 'custom', buyerPercentage: '50',
}

function input(overrides: Partial<CalculatorFormValues> = {}) {
  const parsed = parseCalculatorForm({ ...example, ...overrides })
  if (parsed.ok === false) throw new Error(JSON.stringify(parsed.errors))
  return parsed.input
}

function errors(overrides: Partial<CalculatorFormValues>) {
  const parsed = parseCalculatorForm({ ...example, ...overrides })
  if (parsed.ok === true) throw new Error('Expected field errors')
  return parsed.errors
}

describe('parseCalculatorForm', () => {
  it('requires an original amount and the active provider fields, without inventing defaults', () => {
    const parsed = parseCalculatorForm(defaultValues)
    expect(parsed.ok).toBe(false)
    if (parsed.ok === false) {
      expect(Object.keys(parsed.errors).sort()).toEqual(['originalAmount', 'providerFixed', 'providerPercentage'])
    }
  })

  it('converts the example strings to exact domain inputs', () => {
    expect(input()).toEqual({
      currency: 'GHS', originalAmountMinor: 10_000n,
      providerFee: { mode: 'percentage-plus-fixed', percentageScaled: 20_000n, amountMinor: 100n },
      platformMarkup: { mode: 'percentage', percentageScaled: 10_000n },
      allocation: { mode: 'custom', buyerPercentageScaled: 500_000n },
    })
  })

  it.each(['USD', 'EUR', 'GBP', 'GHS', 'NGN', 'JPY'])('supports %s using its currency metadata', currency => {
    const parsed = input({ currency })
    expect(parsed.originalAmountMinor).toBe(currency === 'JPY' ? 100n : 10_000n)
    expect(parsed.currency).toBe(currency)
  })

  it.each([
    ['fixed', { mode: 'fixed', amountMinor: 100n }],
    ['percentage', { mode: 'percentage', percentageScaled: 20_000n }],
    ['percentage-plus-fixed', { mode: 'percentage-plus-fixed', percentageScaled: 20_000n, amountMinor: 100n }],
  ] as const)('parses the provider %s rule', (mode, expected) => {
    expect(input({ providerMode: mode }).providerFee).toEqual(expected)
  })

  it.each([
    ['none', { mode: 'none' }],
    ['fixed', { mode: 'fixed', amountMinor: 25n }],
    ['percentage', { mode: 'percentage', percentageScaled: 10_000n }],
    ['percentage-plus-fixed', { mode: 'percentage-plus-fixed', percentageScaled: 10_000n, amountMinor: 25n }],
  ] as const)('parses the markup %s rule', (mode, expected) => {
    expect(input({ markupMode: mode, markupFixed: '0.25' }).platformMarkup).toEqual(expected)
  })

  it.each(['buyer-pays-all', 'seller-pays-all'] as const)('ignores an inactive buyer percentage for %s', mode => {
    expect(input({ allocationMode: mode, buyerPercentage: 'invalid' }).allocation).toEqual({ mode })
  })

  it.each(['0', '100', '49.9999'])('parses an exact custom allocation of %s%%', buyerPercentage => {
    const allocation = input({ buyerPercentage }).allocation
    expect(allocation).toEqual({
      mode: 'custom', buyerPercentageScaled: { '0': 0n, '100': 1_000_000n, '49.9999': 499_999n }[buyerPercentage],
    })
  })

  it('ignores hidden fee fields, including malformed values from a previous mode', () => {
    expect(input({
      providerMode: 'fixed', providerPercentage: 'invalid',
      markupMode: 'none', markupPercentage: '-1', markupFixed: 'bad',
    }).providerFee).toEqual({ mode: 'fixed', amountMinor: 100n })
    expect(input({ providerMode: 'percentage', providerFixed: 'bad' }).providerFee)
      .toEqual({ mode: 'percentage', percentageScaled: 20_000n })
    expect(input({ markupMode: 'fixed', markupFixed: '0', markupPercentage: 'bad' }).platformMarkup)
      .toEqual({ mode: 'fixed', amountMinor: 0n })
    expect(input({ markupMode: 'percentage', markupFixed: 'bad' }).platformMarkup)
      .toEqual({ mode: 'percentage', percentageScaled: 10_000n })
  })

  it('collects errors for every invalid active field', () => {
    expect(Object.keys(errors({
      originalAmount: '1,000', providerPercentage: '1.23456', providerFixed: '-1',
      markupPercentage: '101', buyerPercentage: 'bad',
    })).sort()).toEqual(['buyerPercentage', 'markupPercentage', 'originalAmount', 'providerFixed', 'providerPercentage'])
  })

  it.each([
    ['originalAmount', ''], ['originalAmount', '-1'], ['originalAmount', '1.001'],
    ['originalAmount', '1e3'], ['originalAmount', '9'.repeat(33)],
    ['originalAmount', '90071992547409.92'],
    ['providerPercentage', ''], ['providerPercentage', '100.0001'],
    ['providerPercentage', '1.23456'], ['providerPercentage', '0'.repeat(9)],
    ['providerFixed', ''], ['providerFixed', 'GHS 1'], ['providerFixed', '1,000'],
    ['markupPercentage', '-1'], ['buyerPercentage', '101'],
  ] as const)('reports an error for %s containing %s', (field, value) => {
    expect(errors({ [field]: value })[field]).toBeTruthy()
  })

  it.each(['XXX', 'constructor', '__proto__', ''])('rejects unsupported currency %s', currency => {
    expect(errors({ currency })).toEqual({ currency: 'Choose a supported currency.' })
  })

  it('rejects manipulated rule and allocation modes', () => {
    const invalid = { providerMode: 'none', markupMode: 'unknown', allocationMode: 'unknown' } as unknown as Partial<CalculatorFormValues>
    expect(Object.keys(errors(invalid)).sort()).toEqual(['allocationMode', 'markupMode', 'providerMode'])
  })

  it('revalidates currency precision for active original and fixed amounts', () => {
    const invalid = errors({ currency: 'JPY', originalAmount: '1.25', providerFixed: '0.01' })
    expect(invalid.originalAmount).toBeTruthy()
    expect(invalid.providerFixed).toBeTruthy()
  })

  it('does not change the raw form strings', () => {
    const values = { ...example, originalAmount: ' 100.00 ', providerPercentage: ' 2 ' }
    const before = { ...values }
    expect(parseCalculatorForm(values).ok).toBe(true)
    expect(values).toEqual(before)
  })

  it('passes the exact maximum amount through without float coercion', () => {
    expect(input({ originalAmount: '90071992547409.91' }).originalAmountMinor).toBe(9_007_199_254_740_991n)
  })

  it('accepts zero values and lets the calculator validate seller funds', () => {
    const parsed = input({ originalAmount: '0', providerMode: 'fixed', providerFixed: '1', markupMode: 'none' })
    expect(() => calculateTransaction(parsed)).toThrow('Seller fee share exceeds the original amount.')
    expect(calculateTransaction({ ...parsed, allocation: { mode: 'buyer-pays-all' } }).buyerTotalMinor).toBe(100n)
  })
})
