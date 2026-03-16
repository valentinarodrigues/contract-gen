import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, Copy, CheckCheck, RefreshCw, FileText } from 'lucide-react'
import { api } from '../api/client'
import ContractStatusBadge from '../components/ContractStatusBadge'
import type { ContractDetail } from '../types'

const TYPE_LABELS: Record<string, string> = {
  vendor: 'Vendor / Supplier',
  sla: 'Consumer / SLA',
  nda: 'NDA / Confidentiality',
  generic: 'General Agreement',
}

export default function ContractView() {
  const { contractId } = useParams<{ contractId: string }>()
  const [contract, setContract] = useState<ContractDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!contractId) return
    setLoading(true)
    api
      .getContract(contractId)
      .then(setContract)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [contractId])

  const copyToClipboard = async () => {
    if (!contract?.content) return
    await navigator.clipboard.writeText(contract.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadTxt = () => {
    if (!contract?.content) return
    const blob = new Blob([contract.content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${contract.title.replace(/[^a-z0-9]/gi, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !contract) {
    return (
      <div className="p-8">
        <div className="card p-6 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{error || 'Contract not found'}</p>
          <Link to="/dashboard" className="btn-secondary mt-4 inline-flex">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const meta = contract.metadata

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{contract.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-gray-500">{TYPE_LABELS[contract.type] ?? contract.type}</span>
              <ContractStatusBadge status={contract.status} />
              {contract.wordCount ? (
                <span className="text-xs text-gray-400">{contract.wordCount.toLocaleString()} words</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={copyToClipboard} className="btn-secondary">
            {copied ? <CheckCheck className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          {contract.downloadUrl ? (
            <a href={contract.downloadUrl} download className="btn-secondary">
              <Download className="w-4 h-4" /> Download
            </a>
          ) : (
            <button onClick={downloadTxt} className="btn-secondary">
              <Download className="w-4 h-4" /> Download
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Contract content */}
        <div className="flex-1 min-w-0 card">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Contract Text</p>
            <p className="text-xs text-gray-400">Generated {new Date(contract.createdAt).toLocaleString()}</p>
          </div>
          <pre className="p-6 text-sm text-gray-800 whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto max-h-[75vh] overflow-y-auto">
            {contract.content || 'Contract content is loading or not available.'}
          </pre>
        </div>

        {/* Metadata sidebar */}
        <aside className="w-64 flex-shrink-0 space-y-4">
          <div className="card p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Details</p>
            <dl className="space-y-2 text-sm">
              {[
                ['Party A', meta?.party_a?.name],
                ['Party B', meta?.party_b?.name],
                ['Governing Law', meta?.governing_law],
                ['Term', meta?.term_months ? `${meta.term_months} months` : null],
                ['Effective Date', meta?.effective_date],
              ]
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="text-gray-500">{k}</dt>
                    <dd className="font-medium text-gray-900">{v as string}</dd>
                  </div>
                ))}
            </dl>
          </div>

          {contract.analysisId && (
            <div className="card p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Analysis</p>
              <p className="text-xs font-mono text-gray-600 break-all">{contract.analysisId}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
