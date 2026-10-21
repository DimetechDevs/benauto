import FinanceCalculator from '../components/FinanceCalculator'
import LeadForm from '../components/LeadForm'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export default function Finance() {
  useDocumentTitle('Car finance')
  return (
    <div className="container-x py-10">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Car finance made simple</h1>
        <p className="mt-3 text-lg text-slate-600">Work out what you can afford, then apply in two minutes. We work with lenders to find a plan that suits you.</p>
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-xl font-bold text-ink">Repayment calculator</h2>
          <FinanceCalculator />
        </div>
        <div>
          <h2 className="mb-4 text-xl font-bold text-ink">Apply for finance</h2>
          <div className="card p-6">
            <LeadForm
              type="finance"
              submitLabel="Send application"
              successText="Thanks! Our finance team will contact you shortly."
              extra={
                <div className="grid gap-4 sm:grid-cols-2">
                  <div><label className="label" htmlFor="f-budget">Car budget (USD)</label><input id="f-budget" name="d_budget_usd" type="number" min={0} className="input" /></div>
                  <div><label className="label" htmlFor="f-dep">Deposit (USD)</label><input id="f-dep" name="d_deposit_usd" type="number" min={0} className="input" /></div>
                  <div><label className="label" htmlFor="f-term">Preferred term</label>
                    <select id="f-term" name="d_term_months" className="input" defaultValue="24">{[6, 12, 18, 24, 36, 48, 60].map((m) => <option key={m} value={m}>{m} months</option>)}</select>
                  </div>
                  <div><label className="label" htmlFor="f-inc">Monthly income (USD)</label><input id="f-inc" name="d_monthly_income_usd" type="number" min={0} className="input" /></div>
                  <div className="sm:col-span-2"><label className="label" htmlFor="f-emp">Employer</label><input id="f-emp" name="d_employer" maxLength={120} className="input" /></div>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}
