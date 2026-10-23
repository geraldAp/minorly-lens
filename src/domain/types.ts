import type { SupportedCurrency } from 'minorly'

// Amounts are integer minor units in the calculation's currency.
// Percentages are scaled integers: 1% = 10,000n. Validation will enforce their limits.
export type FeeRule =
  | { mode: 'fixed'; amountMinor: bigint }
  | { mode: 'percentage'; percentageScaled: bigint }
  | { mode: 'percentage-plus-fixed'; percentageScaled: bigint; amountMinor: bigint }

export type PlatformMarkupRule = { mode: 'none' } | FeeRule

// One rule applies to the combined provider fee and platform markup.
// Only the buyer's percentage is needed; the seller gets the fee remainder.
export type FeeAllocation =
  | { mode: 'buyer-pays-all' }
  | { mode: 'seller-pays-all' }
  | { mode: 'custom'; buyerPercentageScaled: bigint }

// React form strings must be parsed and validated before calculation.
export interface CalculationInput {
  currency: SupportedCurrency
  originalAmountMinor: bigint
  providerFee: FeeRule
  platformMarkup: PlatformMarkupRule
  allocation: FeeAllocation
}

export interface CalculationResult {
  currency: SupportedCurrency
  originalAmountMinor: bigint
  providerFeeMinor: bigint
  platformMarkupMinor: bigint
  combinedFeesMinor: bigint
  buyerFeeShareMinor: bigint
  sellerFeeShareMinor: bigint
  buyerTotalMinor: bigint
  sellerNetMinor: bigint
}
