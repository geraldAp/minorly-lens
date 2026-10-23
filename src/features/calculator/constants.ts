export const FEE_SOURCE = {
  PROVIDER: 'provider',
  MARKUP: 'markup',
} as const

export type FeeSource = (typeof FEE_SOURCE)[keyof typeof FEE_SOURCE]
