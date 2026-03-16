import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ChevronLeft, Wand2, CheckCircle } from 'lucide-react'
import { api } from '../api/client'
import ContractTypeSelector from '../components/ContractTypeSelector'
import type { ContractType } from '../types'

type Step = 1 | 2 | 3

interface WizardState {
  contractType: ContractType
  title: string
  partyAName: string
  partyAAddress: string
  partyAJurisdiction: string
  partyBName: string
  partyBAddress: string
  partyBJurisdiction: string
  effectiveDate: string
  termMonths: number
  governingLaw: string
  sampleContractIds: string
  analysisId: string
  customInstructions: string
}

const defaults: WizardState = {
  contractType: 'generic',
  title: '',
  partyAName: '',
  partyAAddress: '',
  partyAJurisdiction: '',
  partyBName: '',
  partyBAddress: '',
  partyBJurisdiction: '',
  effectiveDate: '',
  termMonths: 12,
  governingLaw: '',
  sampleContractIds: '',
  analysisId: '',
  customInstructions: '',
}

const STEP_LABELS = ['Contract Details', 'Reference Data', 'Review & Generate']

export default function Generate() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [state, setState] = useState<WizardState>(defaults)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const update = (field: keyof WizardState, value: string | number) =>
    setState((prev) => ({ ...prev, [field]: value }))

  const handleGenerate = async () => {
    setLoading(true)
    setError('')

    const sampleIds = state.sampleContractIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    try {
      const res = await api.generateContract({
        contract_type: state.contractType,
        title: state.title || undefined,
        sample_contract_ids: sampleIds,
        analysis_id: state.analysisId || undefined,
        party_info: {
          party_a: {
            name: state.partyAName,
            address: state.partyAAddress,
            jurisdiction: state.partyAJurisdiction,
          },
          party_b: {
            name: state.partyBName,
            address: state.partyBAddress,
            jurisdiction: state.partyBJurisdiction,
          },
        },
        effective_date: state.effectiveDate || undefined,
        term_months: state.termMonths,
        governing_law: state.governingLaw || undefined,
        custom_instructions: state.customInstructions || undefined,
      })
      navigate(`/contracts/${res.contractId}`)
    } catch (e) {
      setError((e as Error).message)
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Generate Contract</h1>
        <p className="text-gray-500 text-sm mt-1">AI-powered contract drafting in 3 steps</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {([1, 2, 3] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step > s ? 'bg-brand-600 text-white' : step === s ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {step > s ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
            <span className={`text-sm hidden sm:block ${step === s ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
              {STEP_LABELS[i]}
            </span>
            {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      {/* Steps */}
      {step === 1 && (
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Contract Details</h2>

          <div>
            <label className="label">Contract Type</label>
            <ContractTypeSelector value={state.contractType} onChange={(t) => update('contractType', t)} />
          </div>

          <div>
            <label className="label" htmlFor="gen-title">Title</label>
            <input id="gen-title" className="input" placeholder="e.g. Master Services Agreement – Acme Corp" value={state.title} onChange={(e) => update('title', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Effective Date</label>
              <input type="date" className="input" value={state.effectiveDate} onChange={(e) => update('effectiveDate', e.target.value)} />
            </div>
            <div>
              <label className="label">Term (months)</label>
              <input type="number" className="input" min={1} max={120} value={state.termMonths} onChange={(e) => update('termMonths', parseInt(e.target.value) || 12)} />
            </div>
          </div>

          <div>
            <label className="label">Governing Law / Jurisdiction</label>
            <input className="input" placeholder="e.g. State of New York, USA" value={state.governingLaw} onChange={(e) => update('governingLaw', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[
              { prefix: 'partyA', label: 'Party A (Client / Buyer)' },
              { prefix: 'partyB', label: 'Party B (Provider / Vendor)' },
            ].map(({ prefix, label }) => (
              <div key={prefix} className="space-y-2">
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <input className="input" placeholder="Legal name *" value={(state as never)[`${prefix}Name`]} onChange={(e) => update(`${prefix}Name` as keyof WizardState, e.target.value)} />
                <input className="input" placeholder="Address" value={(state as never)[`${prefix}Address`]} onChange={(e) => update(`${prefix}Address` as keyof WizardState, e.target.value)} />
                <input className="input" placeholder="Jurisdiction" value={(state as never)[`${prefix}Jurisdiction`]} onChange={(e) => update(`${prefix}Jurisdiction` as keyof WizardState, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Reference Data</h2>
          <p className="text-sm text-gray-500">Link existing sample contracts and usage analysis to improve output quality.</p>

          <div>
            <label className="label">Sample Contract IDs (comma-separated)</label>
            <input
              className="input"
              placeholder="abc123, def456, ..."
              value={state.sampleContractIds}
              onChange={(e) => update('sampleContractIds', e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Contract IDs from the Upload step. Used as style references.</p>
          </div>

          <div>
            <label className="label">Usage Analysis ID</label>
            <input
              className="input"
              placeholder="analysis-id from Analyze step"
              value={state.analysisId}
              onChange={(e) => update('analysisId', e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Analysis ID from the Analyze Patterns step.</p>
          </div>

          <div>
            <label className="label">Custom Instructions</label>
            <textarea
              className="input h-28 resize-none"
              placeholder="Any specific clauses, requirements, or style preferences..."
              value={state.customInstructions}
              onChange={(e) => update('customInstructions', e.target.value)}
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Review & Generate</h2>

          <div className="bg-gray-50 rounded-lg divide-y divide-gray-200 text-sm">
            {[
              ['Contract Type', state.contractType],
              ['Title', state.title || '(auto-generated)'],
              ['Party A', state.partyAName || '—'],
              ['Party B', state.partyBName || '—'],
              ['Governing Law', state.governingLaw || '—'],
              ['Term', `${state.termMonths} months`],
              ['Sample IDs', state.sampleContractIds || 'none'],
              ['Analysis ID', state.analysisId || 'none'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between px-4 py-2.5">
                <span className="text-gray-500">{k}</span>
                <span className="text-gray-900 font-medium text-right max-w-[60%] truncate">{v}</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <p className="text-xs text-gray-500">
            Generation may take 30–60 seconds depending on contract complexity.
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
          disabled={step === 1}
          className="btn-secondary"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {step < 3 ? (
          <button type="button" onClick={() => setStep((s) => Math.min(3, s + 1) as Step)} className="btn-primary">
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button type="button" onClick={handleGenerate} disabled={loading} className="btn-primary">
            {loading ? (
              <><Wand2 className="w-4 h-4 animate-pulse" /> Generating...</>
            ) : (
              <><Wand2 className="w-4 h-4" /> Generate Contract</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
