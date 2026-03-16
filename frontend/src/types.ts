export type ContractType = 'vendor' | 'sla' | 'nda' | 'generic'
export type ContractStatus = 'PROCESSING' | 'READY' | 'GENERATING' | 'GENERATED' | 'FAILED'

export interface PartyInfo {
  name: string
  address?: string
  jurisdiction?: string
  contact_email?: string
}

export interface UsagePattern {
  service_name: string
  volume?: string
  frequency?: string
  peak_usage?: string
  sla_requirements?: Record<string, unknown>
  notes?: string
}

export interface ContractMetadata {
  party_a: PartyInfo
  party_b: PartyInfo
  effective_date?: string
  term_months?: number
  governing_law?: string
  additional_clauses?: string[]
  usage_patterns?: UsagePattern[]
  custom_instructions?: string
}

export interface ContractSummary {
  contractId: string
  title: string
  type: ContractType
  status: ContractStatus
  createdAt: string
  updatedAt: string
  wordCount?: number
}

export interface ContractDetail extends ContractSummary {
  content: string
  downloadUrl: string
  metadata: ContractMetadata
  analysisId?: string
}

export interface AnalysisRecord {
  analysisId: string
  title: string
  contractType: ContractType
  summary: string
  createdAt: string
}

export interface GenerateRequest {
  contract_type: ContractType
  title?: string
  sample_contract_ids?: string[]
  analysis_id?: string
  party_info?: {
    party_a: PartyInfo
    party_b: PartyInfo
  }
  effective_date?: string
  term_months?: number
  governing_law?: string
  additional_clauses?: string[]
  custom_instructions?: string
}

export interface AnalyzeRequest {
  title?: string
  contract_type?: ContractType
  usage_logs?: Record<string, unknown>[]
  service_patterns?: UsagePattern[]
  party_info?: {
    party_a?: PartyInfo
    party_b?: PartyInfo
  }
}
