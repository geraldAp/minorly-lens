// Applies to input amounts and every monetary value in a calculation result.
// Minorly's conversion API returns numbers within this safe-integer boundary.
export const MAX_AMOUNT_MINOR = 9_007_199_254_740_991n

export const PERCENTAGE_DECIMAL_PLACES = 4

// One percentage point: 1% = 10,000 scaled units.
export const PERCENTAGE_SCALE = 10_000n

// Represents 100%; also the denominator when applying a scaled percentage.
export const MAX_PERCENTAGE_SCALED = 100n * PERCENTAGE_SCALE

export const MAX_AMOUNT_INPUT_LENGTH = 32
export const MAX_PERCENTAGE_INPUT_LENGTH = 8 // Fits "100.0000".
