import type { ContractStatus } from '../types'

const config: Record<ContractStatus, { label: string; className: string }> = {
  PROCESSING: { label: 'Processing', className: 'bg-yellow-100 text-yellow-800' },
  READY: { label: 'Ready', className: 'bg-blue-100 text-blue-800' },
  GENERATING: { label: 'Generating', className: 'bg-purple-100 text-purple-800' },
  GENERATED: { label: 'Generated', className: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Failed', className: 'bg-red-100 text-red-800' },
}

export default function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const { label, className } = config[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
