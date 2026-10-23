import { MoneyError } from 'minorly'
import { describe, expect, it } from 'vitest'
import { parsePercentage } from './percentage'

describe('parsePercentage', () => {
  it.each([
    ['0', 0n],
    ['0.0000', 0n],
    ['0.0001', 1n],
    ['0.1', 1_000n],
    ['1', 10_000n],
    ['1.275', 12_750n],
    ['1.0001', 10_001n],
    ['2.5', 25_000n],
    ['9.9999', 99_999n],
    ['99.9999', 999_999n],
    ['100', 1_000_000n],
    ['100.0000', 1_000_000n],
    ['00001.25', 12_500n],
  ] as const)('parses %s into %s scaled units exactly', (input, expected) => {
    expect(parsePercentage(input)).toBe(expected)
  })

  it.each([
    [' 1', 10_000n],
    ['1 ', 10_000n],
    ['\t1\n', 10_000n],
    [' 1.275 ', 12_750n],
    [' 0 ', 0n],
  ] as const)('accepts surrounding whitespace in %j', (input, expected) => {
    expect(parsePercentage(input)).toBe(expected)
  })

  it.each([
    '',
    ' ',
    '\t\r\n',
    '1 0',
    '1\t0',
    '-1',
    '-0',
    ' -1 ',
    '+1',
    '1,25',
    '1,000',
    '1%',
    '%1',
    '$1',
    '.5',
    '1.',
    '1.2.3',
    '1e1',
    '0x10',
    'NaN',
    'Infinity',
    '١',
  ])('rejects malformed or negative input %j', (input) => {
    expect(() => parsePercentage(input)).toThrow(MoneyError)
  })

  it.each(['0.00001', '1.00000', '0.00000', '12.00000'])(
    'rejects more than four decimal places in %s instead of rounding',
    (input) => {
      expect(() => parsePercentage(input)).toThrow(MoneyError)
    },
  )

  it.each(['100.0001', '100.1', '101', '99999999'])('rejects %s above 100%%', (input) => {
    expect(() => parsePercentage(input)).toThrow(MoneyError)
  })

  it('accepts an eight-character input within the percentage range', () => {
    expect(parsePercentage('00000001')).toBe(10_000n)
  })

  it('rejects a nine-character input even when its value is within range', () => {
    expect(() => parsePercentage('000000001')).toThrow(MoneyError)
  })

  it('counts surrounding whitespace toward the raw input-length limit', () => {
    expect(parsePercentage(' '.repeat(7) + '1')).toBe(10_000n)
    expect(() => parsePercentage(' '.repeat(8) + '1')).toThrow(MoneyError)
    expect(() => parsePercentage('100.0000 ')).toThrow(MoneyError)
  })
})
