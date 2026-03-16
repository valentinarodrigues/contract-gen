import { useState } from 'react'
import { CheckCircle, Upload as UploadIcon } from 'lucide-react'
import { api } from '../api/client'
import DropZone from '../components/DropZone'
import ContractTypeSelector from '../components/ContractTypeSelector'
import type { ContractType } from '../types'

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [contractType, setContractType] = useState<ContractType>('generic')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ contractId: string; title: string } | null>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) { setError('Please select a file'); return }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await api.uploadContract(file, contractType, title || file.name)
      setResult(res)
      setFile(null)
      setTitle('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Upload Sample Contract</h1>
        <p className="text-gray-500 text-sm mt-1">
          Upload existing contracts as reference samples for style and clause alignment.
        </p>
      </div>

      {result && (
        <div className="card p-5 mb-6 flex items-start gap-3 bg-green-50 border-green-200">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-900">Contract uploaded successfully</p>
            <p className="text-sm text-green-700 mt-1">
              <strong>{result.title}</strong> — ID: <code className="text-xs">{result.contractId}</code>
            </p>
            <p className="text-xs text-green-600 mt-1">
              Text extraction is processing. You can use this contract ID in the Generate step.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div>
          <label className="label">Contract Document</label>
          <DropZone
            onFileSelect={setFile}
            selectedFile={file}
          />
        </div>

        <div>
          <label className="label" htmlFor="title">Title (optional)</label>
          <input
            id="title"
            type="text"
            className="input"
            placeholder="e.g. AWS Service Agreement 2024"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Contract Type</label>
          <ContractTypeSelector value={contractType} onChange={setContractType} />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !file}
          className="btn-primary w-full justify-center py-2.5"
        >
          {loading ? (
            <>
              <UploadIcon className="w-4 h-4 animate-bounce" /> Uploading & Extracting...
            </>
          ) : (
            <>
              <UploadIcon className="w-4 h-4" /> Upload Contract
            </>
          )}
        </button>
      </form>
    </div>
  )
}
