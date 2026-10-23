export const CALCULATION_MODES = {
  fee: {
    FIXED: 'fixed',
    PERCENTAGE: 'percentage',
    PERCENTAGE_PLUS_FIXED: 'percentage-plus-fixed',
  },
  allocation: {
    BUYER_PAYS_ALL: 'buyer-pays-all',
    SELLER_PAYS_ALL: 'seller-pays-all',
    CUSTOM: 'custom',
  },
  markup: {
    NONE: 'none',
  },
} as const

// Derive the runtime validation list from the canonical mode values.
export const FEE_MODE_VALUES: readonly string[] = Object.values(CALCULATION_MODES.fee)
