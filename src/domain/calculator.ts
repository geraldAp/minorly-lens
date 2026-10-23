import { CURRENCIES, MoneyError } from 'minorly'
import { allocateFees } from './allocation'
import { calculateFees } from './fees'
import { MAX_AMOUNT_MINOR } from './limits'
import type { CalculationInput, CalculationResult } from './types'

export function calculateTransaction(input: CalculationInput): CalculationResult {
  if (!Object.hasOwn(CURRENCIES, input.currency)) {
    throw new MoneyError('Unsupported currency.')
  }

  const fees = calculateFees(input.originalAmountMinor, input.providerFee, input.platformMarkup)
  const shares = allocateFees(fees.combinedFeesMinor, input.allocation)

  if (shares.sellerFeeShareMinor > input.originalAmountMinor) {
    throw new MoneyError('Seller fee share exceeds the original amount.')
  }

  const buyerTotalMinor = input.originalAmountMinor + shares.buyerFeeShareMinor
  const sellerNetMinor = input.originalAmountMinor - shares.sellerFeeShareMinor

  if (buyerTotalMinor > MAX_AMOUNT_MINOR) {
    throw new MoneyError('Buyer total exceeds the prototype limit.')
  }

  return {
    currency: input.currency,
    originalAmountMinor: input.originalAmountMinor,
    ...fees,
    ...shares,
    buyerTotalMinor,
    sellerNetMinor,
  }
}
