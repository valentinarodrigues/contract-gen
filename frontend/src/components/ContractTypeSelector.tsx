import type { ContractType } from '../types'

const types: { value: ContractType; label: string; description: string }[] = [
  { value: 'vendor', label: 'Vendor / Supplier', description: 'Agreements with external vendors for services or goods' },
  { value: 'sla', label: 'Consumer / SLA', description: 'Service-level agreements and consumer-facing terms' },
  { value: 'nda', label: 'NDA / Confidentiality', description: 'Non-disclosure and data protection agreements' },
  { value: 'generic', label: 'Generic', description: 'Flexible contract for any business relationship' },
]

interface ContractTypeSelectorProps {
  value: ContractType
  onChange: (type: ContractType) => void
}

export default function ContractTypeSelector({ value, onChange }: ContractTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {types.map((type) => (
        <button
          key={type.value}
          type="button"
          onClick={() => onChange(type.value)}
          className={`text-left p-4 rounded-lg border-2 transition-all ${
            value === type.value
              ? 'border-brand-500 bg-brand-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <p className={`font-medium text-sm ${value === type.value ? 'text-brand-700' : 'text-gray-900'}`}>
            {type.label}
          </p>
          <p className="text-xs text-gray-500 mt-1">{type.description}</p>
        </button>
      ))}
    </div>
  )
}
