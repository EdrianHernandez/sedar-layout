import { PROTOTYPE_DOCUMENT_USER, type CustomerDocument, type PrototypeDocumentUser } from '../types/customerDocument'

const ownsMarketingUpload = (document: CustomerDocument, user: PrototypeDocumentUser): boolean => document.department === user.department && document.source === 'Uploaded'
const activeMarketingUpload = (document: CustomerDocument, user: PrototypeDocumentUser): boolean => document.status !== 'Archived' && ownsMarketingUpload(document, user)

export const canEditMetadata = (document: CustomerDocument, user = PROTOTYPE_DOCUMENT_USER): boolean => activeMarketingUpload(document, user)
export const canUploadVersion = (document: CustomerDocument, user = PROTOTYPE_DOCUMENT_USER): boolean => activeMarketingUpload(document, user)
export const canReplace = (document: CustomerDocument, user = PROTOTYPE_DOCUMENT_USER): boolean => activeMarketingUpload(document, user)
export const canChangeVisibility = (document: CustomerDocument, user = PROTOTYPE_DOCUMENT_USER): boolean => user.role === 'Marketing Manager' && activeMarketingUpload(document, user)
export const canArchive = (document: CustomerDocument, user = PROTOTYPE_DOCUMENT_USER): boolean => user.role === 'Marketing Manager' && activeMarketingUpload(document, user)
export const canDelete = (document: CustomerDocument, user = PROTOTYPE_DOCUMENT_USER): boolean => user.role === 'Marketing Manager' && document.status === 'Archived' && ownsMarketingUpload(document, user)
