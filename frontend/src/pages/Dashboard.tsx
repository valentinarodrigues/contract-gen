import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Upload, Wand2, BarChart2, ExternalLink, RefreshCw } from 'lucide-react'
import { api } from '../api/client'
import ContractStatusBadge from '../components/ContractStatusBadge'
import type { ContractSummary } from '../types'

const TYPE_LABELS: Record<string, string> = {
  vendor: 'Vendor',
  sla: 'SLA',
  nda: 'NDA',
  generic: 'Generic',
}

export default function Dashboard() {
  const [contracts, setContracts] = useState<ContractSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.listContracts()
      setContracts(res.contracts)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const generated = contracts.filter((c) => c.status === 'GENERATED').length
  const samples = contracts.filter((c) => c.status === 'READY').length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and generate AI-powered contracts</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Total Contracts', value: contracts.length, icon: FileText, color: 'text-brand-600 bg-brand-50' },
          { label: 'Generated', value: generated, icon: Wand2, color: 'text-green-600 bg-green-50' },
          { label: 'Sample Uploads', value: samples, icon: Upload, color: 'text-blue-600 bg-blue-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { to: '/upload', icon: Upload, label: 'Upload Sample Contract', desc: 'Add reference contracts for style alignment' },
          { to: '/analyze', icon: BarChart2, label: 'Analyze Usage Patterns', desc: 'Input service logs and usage data' },
          { to: '/generate', icon: Wand2, label: 'Generate Contract', desc: 'Create a new AI-powered contract' },
        ].map(({ to, icon: Icon, label, desc }) => (
          <Link key={to} to={to} className="card p-5 hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center mb-3 group-hover:bg-brand-100 transition-colors">
              <Icon className="w-5 h-5 text-brand-600" />
            </div>
            <p className="font-medium text-gray-900 text-sm">{label}</p>
            <p className="text-xs text-gray-500 mt-1">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Contracts table */}
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Recent Contracts</h2>
        </div>

        {error && (
          <div className="p-5 text-sm text-red-600 bg-red-50 border-b border-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading...
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-10 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No contracts yet</p>
            <Link to="/generate" className="btn-primary mt-4 inline-flex">
              <Wand2 className="w-4 h-4" /> Generate your first contract
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase tracking-wider bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium">Title</th>
                  <th className="text-left px-5 py-3 font-medium">Type</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Words</th>
                  <th className="text-left px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contracts.map((c) => (
                  <tr key={c.contractId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900 max-w-xs truncate">{c.title}</td>
                    <td className="px-5 py-3 text-gray-600">{TYPE_LABELS[c.type] ?? c.type}</td>
                    <td className="px-5 py-3">
                      <ContractStatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3 text-gray-600">{c.wordCount ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {c.status === 'GENERATED' && (
                        <Link
                          to={`/contracts/${c.contractId}`}
                          className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 text-xs font-medium"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
