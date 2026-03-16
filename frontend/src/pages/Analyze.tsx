import { useState } from 'react'
import { CheckCircle, Plus, Trash2, BarChart2 } from 'lucide-react'
import { api } from '../api/client'
import ContractTypeSelector from '../components/ContractTypeSelector'
import type { ContractType, UsagePattern } from '../types'

const defaultPattern: UsagePattern = {
  service_name: '',
  volume: '',
  frequency: '',
  peak_usage: '',
  notes: '',
}

export default function Analyze() {
  const [title, setTitle] = useState('')
  const [contractType, setContractType] = useState<ContractType>('generic')
  const [patterns, setPatterns] = useState<UsagePattern[]>([{ ...defaultPattern }])
  const [partyA, setPartyA] = useState({ name: '', address: '', jurisdiction: '', contact_email: '' })
  const [partyB, setPartyB] = useState({ name: '', address: '', jurisdiction: '', contact_email: '' })
  const [rawLogs, setRawLogs] = useState('[]')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ analysisId: string; summary: string } | null>(null)
  const [error, setError] = useState('')

  const updatePattern = (idx: number, field: keyof UsagePattern, value: string) => {
    setPatterns((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  const addPattern = () => setPatterns((prev) => [...prev, { ...defaultPattern }])
  const removePattern = (idx: number) => setPatterns((prev) => prev.filter((_, i) => i !== idx))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    let usageLogs: unknown[] = []
    try {
      usageLogs = JSON.parse(rawLogs)
    } catch {
      setError('Usage logs must be valid JSON array')
      setLoading(false)
      return
    }

    try {
      const res = await api.analyzePatterns({
        title: title || undefined,
        contract_type: contractType,
        usage_logs: usageLogs as Record<string, unknown>[],
        service_patterns: patterns.filter((p) => p.service_name.trim()),
        party_info: { party_a: partyA, party_b: partyB },
      })
      setResult(res)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analyze Usage Patterns</h1>
        <p className="text-gray-500 text-sm mt-1">
          Input service usage data and party details to guide contract generation.
        </p>
      </div>

      {result && (
        <div className="card p-5 mb-6 flex items-start gap-3 bg-green-50 border-green-200">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-900">Analysis stored</p>
            <p className="text-sm text-green-700 mt-1">
              Analysis ID: <code className="text-xs font-mono bg-green-100 px-1 rounded">{result.analysisId}</code>
            </p>
            <p className="text-xs text-green-600 mt-1">{result.summary}</p>
            <p className="text-xs text-green-600 mt-1">Use this ID in the Generate Contract step.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title + type */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">General Info</h2>
          <div>
            <label className="label">Analysis Title</label>
            <input className="input" placeholder="e.g. Q4 2024 API Usage Analysis" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="label">Contract Type</label>
            <ContractTypeSelector value={contractType} onChange={setContractType} />
          </div>
        </div>

        {/* Parties */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Party Information</h2>
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'Party A (Client / Buyer)', state: partyA, setter: setPartyA },
              { label: 'Party B (Provider / Vendor)', state: partyB, setter: setPartyB },
            ].map(({ label, state, setter }) => (
              <div key={label} className="space-y-3">
                <p className="text-sm font-medium text-gray-700">{label}</p>
                {(['name', 'address', 'jurisdiction', 'contact_email'] as const).map((field) => (
                  <input
                    key={field}
                    className="input"
                    placeholder={field.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    value={state[field]}
                    onChange={(e) => setter((prev) => ({ ...prev, [field]: e.target.value }))}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Service Patterns */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Service Patterns</h2>
            <button type="button" onClick={addPattern} className="btn-secondary text-xs">
              <Plus className="w-3 h-3" /> Add Service
            </button>
          </div>
          <div className="space-y-4">
            {patterns.map((p, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-500 uppercase">Service {i + 1}</p>
                  {patterns.length > 1 && (
                    <button type="button" onClick={() => removePattern(i)} className="text-gray-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input className="input" placeholder="Service name *" value={p.service_name} onChange={(e) => updatePattern(i, 'service_name', e.target.value)} />
                  <input className="input" placeholder="Volume (e.g. 1M req/month)" value={p.volume ?? ''} onChange={(e) => updatePattern(i, 'volume', e.target.value)} />
                  <input className="input" placeholder="Frequency (e.g. continuous)" value={p.frequency ?? ''} onChange={(e) => updatePattern(i, 'frequency', e.target.value)} />
                  <input className="input" placeholder="Peak usage (e.g. 50k req/hr)" value={p.peak_usage ?? ''} onChange={(e) => updatePattern(i, 'peak_usage', e.target.value)} />
                </div>
                <input className="input" placeholder="Notes" value={p.notes ?? ''} onChange={(e) => updatePattern(i, 'notes', e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        {/* Raw Usage Logs */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Usage Logs (JSON)</h2>
          <p className="text-xs text-gray-500 mb-3">Paste raw usage log entries as a JSON array. Example: <code>[{`{"date":"2024-01","api_calls":150000}`}]</code></p>
          <textarea
            className="input font-mono text-xs h-36 resize-none"
            value={rawLogs}
            onChange={(e) => setRawLogs(e.target.value)}
            placeholder='[{"date": "2024-01", "api_calls": 150000, "errors": 12}]'
          />
        </div>

        {error && <p className="text-sm text-red-600 px-1">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
          {loading ? (
            <><BarChart2 className="w-4 h-4 animate-pulse" /> Analyzing...</>
          ) : (
            <><BarChart2 className="w-4 h-4" /> Save Analysis</>
          )}
        </button>
      </form>
    </div>
  )
}
