import { useCallback, useState } from 'react'
import { Upload, FileText, X } from 'lucide-react'

interface DropZoneProps {
  onFileSelect: (file: File) => void
  accept?: string
  maxSizeMB?: number
  selectedFile?: File | null
}

export default function DropZone({
  onFileSelect,
  accept = '.pdf,.docx',
  maxSizeMB = 10,
  selectedFile,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')

  const validate = (file: File): string => {
    if (file.size > maxSizeMB * 1024 * 1024) return `File too large (max ${maxSizeMB}MB)`
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|docx)$/i)) {
      return 'Only PDF and DOCX files are supported'
    }
    return ''
  }

  const handleFile = useCallback((file: File) => {
    const err = validate(file)
    if (err) { setError(err); return }
    setError('')
    onFileSelect(file)
  }, [onFileSelect])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  if (selectedFile) {
    return (
      <div className="flex items-center gap-3 p-4 bg-brand-50 border border-brand-200 rounded-lg">
        <FileText className="w-8 h-8 text-brand-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
          <p className="text-xs text-gray-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
        </div>
        <button
          onClick={() => onFileSelect(null as unknown as File)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div>
      <label
        className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          isDragging ? 'border-brand-500 bg-brand-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <Upload className={`w-8 h-8 mb-2 ${isDragging ? 'text-brand-500' : 'text-gray-400'}`} />
        <p className="text-sm text-gray-600">
          <span className="font-medium text-brand-600">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF or DOCX up to {maxSizeMB}MB</p>
        <input type="file" className="hidden" accept={accept} onChange={onInputChange} />
      </label>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
