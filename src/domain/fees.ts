import { MoneyError } from 'minorly'
import { MAX_AMOUNT_MINOR, MAX_PERCENTAGE_SCALED } from './limits'
import type { FeeRule, PlatformMarkupRule } from './types'

export function calculateFee(originalAmountMinor: bigint, rule: FeeRule): bigint {
  if (originalAmountMinor < 0n || originalAmountMinor > MAX_AMOUNT_MINOR) {
    throw new MoneyError('Original amount is outside the supported range.')
  }

  if (!['fixed', 'percentage', 'percentage-plus-fixed'].includes(rule.mode)) {
    throw new MoneyError('Unsupported fee mode.')
  }

  const fixedFeeMinor = rule.mode === 'percentage' ? 0n : rule.amountMinor
  const percentageScaled = rule.mode === 'fixed' ? 0n : rule.percentageScaled

  if (fixedFeeMinor < 0n || fixedFeeMinor > MAX_AMOUNT_MINOR) {
    throw new MoneyError('Fixed fee is outside the supported range.')
  }

  if (percentageScaled < 0n || percentageScaled > MAX_PERCENTAGE_SCALED) {
    throw new MoneyError('Percentage must be between 0 and 100.')
  }

  // For non-negative fees, adding half the denominator rounds ties upward.
  const percentageFeeMinor = (
    originalAmountMinor * percentageScaled + MAX_PERCENTAGE_SCALED / 2n
  ) / MAX_PERCENTAGE_SCALED

  const feeMinor = percentageFeeMinor + fixedFeeMinor

  if (feeMinor > MAX_AMOUNT_MINOR) {
    throw new MoneyError('Calculated fee exceeds the prototype limit.')
  }

  return feeMinor
}

export function calculateFees(
  originalAmountMinor: bigint,
  providerRule: FeeRule,
  markupRule: PlatformMarkupRule,
) {
  const providerFeeMinor = calculateFee(originalAmountMinor, providerRule)
  const platformMarkupMinor = markupRule.mode === 'none'
    ? 0n
    : calculateFee(originalAmountMinor, markupRule)
  const combinedFeesMinor = providerFeeMinor + platformMarkupMinor

  if (combinedFeesMinor > MAX_AMOUNT_MINOR) {
    throw new MoneyError('Combined fees exceed the prototype limit.')
  }

  return { providerFeeMinor, platformMarkupMinor, combinedFeesMinor }
}
