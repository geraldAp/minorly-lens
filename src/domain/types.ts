import type { SupportedCurrency } from 'minorly'
import type { CALCULATION_MODES } from './constants'

// Amounts are integer minor units in the calculation's currency.
// Percentages are scaled integers: 1% = 10,000n. Validation will enforce their limits.
export type FeeRule =
  | { mode: typeof CALCULATION_MODES.fee.FIXED; amountMinor: bigint }
  | { mode: typeof CALCULATION_MODES.fee.PERCENTAGE; percentageScaled: bigint }
  | { mode: typeof CALCULATION_MODES.fee.PERCENTAGE_PLUS_FIXED; percentageScaled: bigint; amountMinor: bigint }

export type PlatformMarkupRule = { mode: typeof CALCULATION_MODES.markup.NONE } | FeeRule

// One rule applies to the combined provider fee and platform markup.
// Only the buyer's percentage is needed; the seller gets the fee remainder.
export type FeeAllocation =
  | { mode: typeof CALCULATION_MODES.allocation.BUYER_PAYS_ALL }
  | { mode: typeof CALCULATION_MODES.allocation.SELLER_PAYS_ALL }
  | { mode: typeof CALCULATION_MODES.allocation.CUSTOM; buyerPercentageScaled: bigint }

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
