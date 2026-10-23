import { useEffect, useRef } from 'react'
import { formatAmount } from '../../domain/money'
import type { CalculationResult as Result } from '../../domain/types'

export function CalculationResult({ result, onEdit }: { result: Result; onEdit: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus() }, [])
  const money = (value: bigint) => formatAmount(value, result.currency)
  const breakdown: [string, bigint][] = [
    ['Original amount', result.originalAmountMinor],
    ['Provider fee', result.providerFeeMinor],
    ['Platform markup', result.platformMarkupMinor],
    ['Combined fees', result.combinedFeesMinor],
    ['Buyer fee share', result.buyerFeeShareMinor],
    ['Seller fee share', result.sellerFeeShareMinor],
  ]
  return (
    <section id="calculation-result" aria-labelledby="result-heading">
      <h2 id="result-heading" ref={heading} tabIndex={-1}>Your estimate</h2>
      <div className="result-total buyer-total">
        <span>Buyer pays</span><strong>{money(result.buyerTotalMinor)}</strong>
      </div>
      <div className="result-total seller-total">
        <span>Seller receives</span><strong>{money(result.sellerNetMinor)}</strong>
      </div>
      <h3>Fee breakdown</h3>
      <dl className="breakdown">
        {breakdown.map(([label, value]) => (
          <div key={label} className={label === 'Combined fees' ? 'combined-fees' : undefined}>
            <dt>{label}</dt><dd>{money(value)}</dd>
          </div>
        ))}
      </dl>
      <p className="section-note">Platform markup is revenue before other costs.</p>
      <button type="button" className="primary-action" onClick={onEdit}>
        <span aria-hidden="true">← </span>Edit inputs
      </button>
    </section>
  )
}
