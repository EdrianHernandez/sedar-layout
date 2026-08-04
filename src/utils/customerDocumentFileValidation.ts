import { ACCEPTED_DOCUMENT_EXTENSIONS, MAX_DOCUMENT_FILE_SIZE_BYTES } from '../types/customerDocument'

export interface DocumentFileMetadata { name: string; size: number; type?: string }
export interface DocumentFileValidationResult { valid: boolean; errors: string[] }

export const validateDocumentFileMetadata = (file: DocumentFileMetadata): DocumentFileValidationResult => {
  const errors: string[] = []
  const name = file.name.trim()
  if (!name) errors.push('Filename is required.')
  const extension = name.includes('.') ? name.split('.').pop()?.toLowerCase() : undefined
  if (name && (!extension || !ACCEPTED_DOCUMENT_EXTENSIONS.includes(extension as typeof ACCEPTED_DOCUMENT_EXTENSIONS[number]))) errors.push('File must be PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, or JPEG.')
  if (!Number.isFinite(file.size) || file.size < 0) errors.push('File size is invalid.')
  else if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) errors.push('File must not exceed 25 MB.')
  return { valid: errors.length === 0, errors }
}
