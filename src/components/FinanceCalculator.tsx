import { useEffect, useState } from 'react'
import { formatUsd, monthlyPayment } from '../lib/format'

interface Props { price?: number | null; compact?: boolean }

export default function FinanceCalculator({ price, compact = false }: Props) {
  const [carPrice, setCarPrice] = useState(price ? Number(price) : 15000)
  const [depositPct, setDepositPct] = useState(30)
  const [months, setMonths] = useState(24)
  const [rate, setRate] = useState(15)
  useEffect(() => { if (price) setCarPrice(Number(price)) }, [price])

  const deposit = Math.round((carPrice * depositPct) / 100)
  const loan = Math.max(carPrice - deposit, 0)
  const monthly = monthlyPayment(loan, rate, months)
  const total = monthly * months + deposit

  return (
    <div className={compact ? '' : 'card p-6'}>
      <div className="grid gap-5">
        {!price && (
          <div>
            <label className="label" htmlFor="fc-price">Car price (USD)</label>
            <input id="fc-price" type="number" min={500} step={100} value={carPrice} onChange={(e) => setCarPrice(Math.max(0, Number(e.target.value)))} className="input" />
          </div>
        )}
        <Range id="fc-dep" label="Deposit" value={depositPct} min={10} max={80} step={5} onChange={setDepositPct} display={`${depositPct}% · ${formatUsd(deposit)}`} />
        <Range id="fc-term" label="Repayment period" value={months} min={6} max={60} step={6} onChange={setMonths} display={`${months} months`} />
        <Range id="fc-rate" label="Interest rate (per year)" value={rate} min={0} max={35} step={0.5} onChange={setRate} display={`${rate}%`} />
      </div>
      <div className="mt-6 rounded-lg bg-ink p-5 text-white">
        <p className="text-sm text-neutral-300">Estimated monthly payment</p>
        <p className="mt-1 text-3xl font-bold text-white">{formatUsd(Math.round(monthly))}<span className="text-base font-medium text-neutral-300"> /month</span></p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-300">
          <p>Amount financed: <span className="font-semibold text-white">{formatUsd(loan)}</span></p>
          <p>Total cost: <span className="font-semibold text-white">{formatUsd(Math.round(total))}</span></p>
        </div>
      </div>
      <p className="mt-3 text-xs text-neutral-500">This is an estimate only. Final terms depend on the lender and your application.</p>
    </div>
  )
}

function Range(p: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void; display: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-neutral-700" htmlFor={p.id}>{p.label}</label>
        <span className="text-sm font-semibold text-ink">{p.display}</span>
      </div>
      <input id={p.id} type="range" min={p.min} max={p.max} step={p.step} value={p.value} onChange={(e) => p.onChange(Number(e.target.value))} className="w-full accent-ink" />
    </div>
  )
}
