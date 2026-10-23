import { MoneyError, type SupportedCurrency } from 'minorly'
import { describe, expect, it } from 'vitest'
import { parseAmount } from './money'

const twoDecimalCurrencies: SupportedCurrency[] = ['USD', 'EUR', 'GBP', 'GHS', 'NGN']

describe('parseAmount', () => {
  it.each(twoDecimalCurrencies)('parses a two-decimal amount in %s exactly', (currency) => {
    expect(parseAmount('100.25', currency)).toBe(10_025n)
  })

  it.each([
    ['0', 0n],
    ['0.00', 0n],
    ['100', 10_000n],
    ['1.5', 150n],
    ['0.01', 1n],
    ['0.29', 29n],
    ['19.78', 1_978n],
    ['0001.20', 120n],
  ] as const)('parses %s GHS into %s minor units', (input, expected) => {
    expect(parseAmount(input, 'GHS')).toBe(expected)
  })

  it('parses whole yen without assuming two decimal places', () => {
    expect(parseAmount('100', 'JPY')).toBe(100n)
    expect(parseAmount('0', 'JPY')).toBe(0n)
  })

  it.each([
    [' 1', 100n],
    ['1 ', 100n],
    ['1\n', 100n],
    ['1\r\n', 100n],
    ['1\t', 100n],
    [' \t100.25\r\n', 10_025n],
    [' 0.00 ', 0n],
  ] as const)('accepts surrounding whitespace in %j', (input, expected) => {
    expect(parseAmount(input, 'GHS')).toBe(expected)
  })

  it('allows Minorly to trim a whole-yen amount', () => {
    expect(parseAmount(' \t100\n', 'JPY')).toBe(100n)
  })

  it.each([
    '',
    ' ',
    '\t\r\n',
    '1 0',
    '1\n0',
    '-1',
    '-0',
    ' -1 ',
    '\t-0\n',
    '+1',
    '1,000.00',
    '1,00',
    ' 1,000 ',
    ' 1,00 ',
    'GHS 100',
    '$100',
    '.50',
    '1.',
    '1.2.3',
    '1e2',
    '0x10',
    'NaN',
    'Infinity',
    '١٠',
  ])('rejects malformed or negative input %j', (input) => {
    expect(() => parseAmount(input, 'GHS')).toThrow(MoneyError)
  })

  it.each(twoDecimalCurrencies)('rejects excess decimal precision for %s', (currency) => {
    expect(() => parseAmount('1.001', currency)).toThrow(MoneyError)
  })

  it.each(['1.0', '1.5', '0.00', ' 1.0 '])('rejects fractional notation %s for JPY', (input) => {
    expect(() => parseAmount(input, 'JPY')).toThrow(MoneyError)
  })

  it('accepts the maximum safe minor-unit amount exactly', () => {
    expect(parseAmount('90071992547409.91', 'GHS')).toBe(9_007_199_254_740_991n)
    expect(parseAmount('9007199254740991', 'JPY')).toBe(9_007_199_254_740_991n)
  })

  it('rejects one minor unit above the safe-integer limit', () => {
    expect(() => parseAmount('90071992547409.92', 'GHS')).toThrow(MoneyError)
    expect(() => parseAmount('9007199254740992', 'JPY')).toThrow(MoneyError)
  })

  it('accepts a 32-character input when its value is within bounds', () => {
    expect(parseAmount('0'.repeat(31) + '1', 'GHS')).toBe(100n)
  })

  it('rejects a 33-character input even when its value is within bounds', () => {
    expect(() => parseAmount('0'.repeat(32) + '1', 'GHS')).toThrow(MoneyError)
  })

  it('counts surrounding whitespace toward the raw input-length limit', () => {
    expect(parseAmount(' '.repeat(31) + '1', 'GHS')).toBe(100n)
    expect(() => parseAmount(' '.repeat(32) + '1', 'GHS')).toThrow(MoneyError)
  })

  it.each(['CAD', 'toString'])('rejects unsupported runtime currency %s', (currency) => {
    // @ts-expect-error Check untrusted runtime data despite the currency type.
    expect(() => parseAmount('100', currency)).toThrow(MoneyError)
  })
})
