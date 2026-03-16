import type {
  ContractSummary,
  ContractDetail,
  AnalysisRecord,
  GenerateRequest,
  AnalyzeRequest,
} from '../types'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`)
  }
  return data as T
}

export const api = {
  // Contracts
  listContracts: (status?: string): Promise<{ contracts: ContractSummary[]; count: number }> => {
    const q = status ? `?status=${status}` : ''
    return request(`/contracts${q}`)
  },

  getContract: (contractId: string): Promise<ContractDetail> =>
    request(`/contracts/${contractId}`),

  uploadContract: async (
    file: File,
    contractType: string,
    title: string
  ): Promise<{ contractId: string; status: string; title: string }> => {
    const form = new FormData()
    form.append('file', file)
    form.append('type', contractType)
    form.append('title', title)

    const res = await fetch(`${BASE_URL}/contracts/upload`, {
      method: 'POST',
      body: form,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return data
  },

  analyzePatterns: (body: AnalyzeRequest): Promise<AnalysisRecord> =>
    request('/contracts/analyze', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  generateContract: (
    body: GenerateRequest
  ): Promise<{ contractId: string; content: string; downloadUrl: string; wordCount: number }> =>
    request('/contracts/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}
