import { MoneyError } from 'minorly'
import { CALCULATION_MODES } from './constants'
import { MAX_AMOUNT_MINOR, MAX_PERCENTAGE_SCALED } from './limits'
import { roundHalfUp } from './rounding'
import type { FeeAllocation } from './types'

export function allocateFees(combinedFeesMinor: bigint, allocation: FeeAllocation) {
  if (combinedFeesMinor < 0n || combinedFeesMinor > MAX_AMOUNT_MINOR) {
    throw new MoneyError('Combined fees are outside the supported range.')
  }

  if (allocation.mode === CALCULATION_MODES.allocation.BUYER_PAYS_ALL) {
    return { buyerFeeShareMinor: combinedFeesMinor, sellerFeeShareMinor: 0n }
  }

  if (allocation.mode === CALCULATION_MODES.allocation.SELLER_PAYS_ALL) {
    return { buyerFeeShareMinor: 0n, sellerFeeShareMinor: combinedFeesMinor }
  }

  if (allocation.mode !== CALCULATION_MODES.allocation.CUSTOM) {
    throw new MoneyError('Unsupported allocation mode.')
  }

  const { buyerPercentageScaled } = allocation

  if (buyerPercentageScaled < 0n || buyerPercentageScaled > MAX_PERCENTAGE_SCALED) {
    throw new MoneyError('Buyer percentage must be between 0 and 100.')
  }

  const buyerFeeShareMinor = roundHalfUp(
    combinedFeesMinor * buyerPercentageScaled,
    MAX_PERCENTAGE_SCALED,
  )

  // Only the buyer's share is rounded; the seller gets the exact remainder.
  const sellerFeeShareMinor = combinedFeesMinor - buyerFeeShareMinor

  return { buyerFeeShareMinor, sellerFeeShareMinor }
}
