import { CONTRACT_STATUSES, SIGNATURE_STATUSES, SIGNATURE_VERIFICATION_STATUSES } from '../data/contractOptions'
import { initialContracts } from '../data/contractMockData'
import type { Contract, ContractCorrectionRequest, ContractInput, ContractRequestDetails, ContractSignature, ContractSignatureInput, ContractTerminationRequestInput, SendForSignatureInput } from '../types/contract'
import { customerActivityRepository } from './customerActivityRepository'
import { PROTOTYPE_ACTIVITY_ACTOR } from '../types/customerActivity'
import { quotationRepository } from './quotationRepository'
import { serviceRequestRepository } from './serviceRequestRepository'
import { contractRequestRepository } from './contractRequestRepository'
import { getContractDisplayStatus, isQuotationEligibleForContractRequest } from '../utils/contractWorkflow'

const STORAGE_KEY = 'sedar-marketing-contracts'
const uuid = (prefix: string): string => globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
const storageAvailable = (): boolean => typeof localStorage !== 'undefined'

const isDate = (value: unknown): value is string => typeof value === 'string' && !Number.isNaN(Date.parse(value))
const isSignature = (value: unknown): value is ContractSignature => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<ContractSignature>
  return typeof item.id === 'string' && (item.party === 'SEDAR' || item.party === 'Customer') && typeof item.signatoryId === 'string' && typeof item.signatoryName === 'string' && typeof item.organization === 'string' && typeof item.position === 'string' && typeof item.signedAt === 'string' && SIGNATURE_VERIFICATION_STATUSES.includes(item.verificationStatus as ContractSignature['verificationStatus'])
}
const isContract = (value: unknown): value is Contract => {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<Contract>
  return typeof item.id === 'string' && typeof item.contractNumber === 'string' && typeof item.customerId === 'string' && typeof item.contactId === 'string' && typeof item.quotationId === 'string' && typeof item.serviceRequestId === 'string' && typeof item.serviceType === 'string' && typeof item.vesselName === 'string' && typeof item.contractValue === 'number' && Number.isFinite(item.contractValue) && (item.currency === 'PHP' || item.currency === 'USD') && CONTRACT_STATUSES.includes(item.status as Contract['status']) && SIGNATURE_STATUSES.includes(item.signatureStatus as Contract['signatureStatus']) && isDate(item.effectiveDate) && isDate(item.expirationDate) && Array.isArray(item.signatures) && item.signatures.every(isSignature)
}

const persist = (contracts: Contract[]): void => {
  if (!storageAvailable()) return
  // Prototype browser storage only. Replace this repository with the production backend integration.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts))
}

const verifiedParty = (signatures: ContractSignature[], party: ContractSignature['party']): boolean => signatures.some((item) => item.party === party && item.verificationStatus === 'Verified' && Boolean(item.signedAt))
const nextNumber = (contracts: Contract[]) => `CT-${new Date().getFullYear()}-${String(contracts.reduce((max, item) => Math.max(max, Number(item.contractNumber.match(/(\d+)$/)?.[1] ?? 0)), 0) + 1).padStart(3, '0')}`
const copyInput = (source: Contract): ContractInput => {
  const { id: _id, status: _status, signatureStatus: _signatureStatus, signatures: _signatures, submittedForInternalReviewAt: _submitted, sentForSignatureAt: _sent, terminationRequest: _termination, terminatedAt: _terminated, terminationEffectiveDate: _terminationDate, createdAt: _created, updatedAt: _updated, ...input } = source
  void _id; void _status; void _signatureStatus; void _signatures; void _submitted; void _sent; void _termination; void _terminated; void _terminationDate; void _created; void _updated
  return input
}

export const contractRepository = {
  getAll(): Contract[] {
    if (!storageAvailable()) return [...initialContracts]
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return [...initialContracts]
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed) || !parsed.every(isContract)) return [...initialContracts]
      const ids = new Set(parsed.map((item) => item.id))
      return [...parsed, ...initialContracts.filter((item) => !ids.has(item.id))]
    } catch {
      return [...initialContracts]
    }
  },
  getById(id: string): Contract | undefined { return this.getAll().find((item) => item.id === id) },
  getByCustomerId(customerId: string): Contract[] { return this.getAll().filter((item) => item.customerId === customerId) },
  getByQuotationId(quotationId: string): Contract | undefined { return this.getAll().find((item) => item.quotationId === quotationId) },
  create(input: ContractInput): Contract {
    const now = new Date().toISOString()
    const id = uuid('CON')
    const contract: Contract = { ...input, id, status: input.status ?? 'Draft', signatureStatus: input.signatureStatus ?? 'Not Started', signatures: input.signatures ?? [], createdAt: now, updatedAt: now }
    persist([contract, ...this.getAll()])
    customerActivityRepository.appendOnce({ customerId: contract.customerId, module: 'Contracts', action: 'Created', description: 'Contract created.', actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Contract', id: contract.id, referenceNumber: contract.contractNumber }, visibility: 'Internal', sourceEventKey: `contract:${contract.id}:created`, systemGenerated: true, eventSource: 'contractRepository' })
    return contract
  },
  requestFromQuotation(quotationId: string, details: ContractRequestDetails): Contract | undefined {
    const contracts = this.getAll(); const quotation = quotationRepository.getById(quotationId); if (!quotation || !isQuotationEligibleForContractRequest(quotation, contracts) || contractRequestRepository.getByQuotationId(quotationId)) return undefined
    const request = serviceRequestRepository.findById(quotation.serviceRequestId); if (!request) return undefined
    const handoff = contractRequestRepository.create({ quotationId: quotation.id, serviceRequestId: quotation.serviceRequestId, customerId: quotation.customerId, requestedBy: PROTOTYPE_ACTIVITY_ACTOR.name })
    const now = new Date().toISOString()
    const contract = this.create({ contractNumber: nextNumber(contracts), contractRequestNumber: handoff.referenceNumber, customerId: quotation.customerId, contactId: quotation.contactId, quotationId: quotation.id, serviceRequestId: quotation.serviceRequestId, serviceType: request.service.type, vesselName: request.vessel.name, title: `${details.contractType} · ${request.vessel.name}`, description: details.serviceCoverage, contractType: details.contractType, serviceCoverage: details.serviceCoverage, startDate: details.requestedEffectiveDate, endDate: details.requestedExpirationDate, effectiveDate: new Date(`${details.requestedEffectiveDate}T00:00:00.000Z`).toISOString(), expirationDate: new Date(`${details.requestedExpirationDate}T23:59:59.999Z`).toISOString(), requestedEffectiveDate: details.requestedEffectiveDate, requestedExpirationDate: details.requestedExpirationDate, contractValue: quotation.totalAmount, currency: quotation.currency, customerSignatoryName: details.customerSignatoryName, customerSignatoryPosition: details.customerSignatoryPosition, customerEmail: details.customerEmail, billingAddress: details.billingAddress, specialCustomerRequirements: details.specialCustomerRequirements, requiredCompletionDate: details.requiredCompletionDate, marketingNotes: details.marketingNotes, supportingDocumentNames: details.supportingDocumentNames, preparedBy: quotation.preparedBy, managedBy: quotation.assignedRepresentativeId ?? quotation.preparedBy, assignedRepresentativeId: quotation.assignedRepresentativeId ?? quotation.preparedBy, status: 'Requested', signatureStatus: 'Not Ready for Signature', operationsReviewStatus: 'Approved', financeReviewStatus: 'Not Started', legalReviewStatus: 'Not Started', managementApprovalStatus: 'Not Started', requestedAt: now })
    return contract
  },
  update(id: string, changes: Partial<Contract>): Contract | undefined {
    const contracts = this.getAll()
    const index = contracts.findIndex((item) => item.id === id)
    if (index < 0) return undefined
    const current = contracts[index]
    const updated: Contract = { ...current, ...changes, id: current.id, createdAt: current.createdAt, updatedAt: new Date().toISOString() }
    if (!isContract(updated)) return undefined
    contracts[index] = updated
    persist(contracts)
    const base = { customerId: updated.customerId, module: 'Contracts' as const, actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Contract', id: updated.id, referenceNumber: updated.contractNumber }, visibility: 'Internal' as const, systemGenerated: true, eventSource: 'contractRepository' }
    if (current.status !== updated.status) {
      const action = updated.status === 'For Internal Review' ? 'Submitted' : updated.status === 'Terminated' ? 'Cancelled' : 'Status Changed'
      customerActivityRepository.appendOnce({ ...base, action, description: `Contract status changed to ${updated.status}.`, changes: [{ field: 'status', previousValue: current.status, newValue: updated.status }], sourceEventKey: `contract:${id}:status:${updated.status}:${updated.updatedAt}` })
    } else if (current.signatureStatus !== updated.signatureStatus) customerActivityRepository.appendOnce({ ...base, action: 'Status Changed', description: `Contract signature status changed to ${updated.signatureStatus}.`, changes: [{ field: 'signatureStatus', previousValue: current.signatureStatus, newValue: updated.signatureStatus }], sourceEventKey: `contract:${id}:signature-status:${updated.signatureStatus}` })
    return updated
  },
  submitForInternalReview(id: string): Contract | undefined { const contract = this.getById(id); if (!contract || !['Drafting', 'Draft'].includes(getContractDisplayStatus(contract))) return undefined; return this.update(id, { status: 'Internal Review', financeReviewStatus: 'Pending', legalReviewStatus: 'Pending', managementApprovalStatus: 'Pending', submittedForInternalReviewAt: new Date().toISOString() }) },
  sendForSignature(id: string, input: SendForSignatureInput): Contract | undefined {
    const current = this.getById(id); if (!current || getContractDisplayStatus(current) !== 'Approved for Signature') return undefined
    const now = new Date().toISOString()
    return this.update(id, { status: 'Awaiting Signatures', contactId: input.customerContactId, selectedCustomerContactId: input.customerContactId, signatories: [input.sedarSignatoryName, input.customerSignatoryName], sentForSignatureAt: now })
  },
  recordSignature(id: string, signature: ContractSignatureInput): Contract | undefined {
    const contract = this.getById(id)
    if (!contract) return undefined
    const recorded: ContractSignature = { ...signature, id: signature.id ?? uuid('SIG') }
    const signatures = contract.signatures.some((item) => item.id === recorded.id) ? contract.signatures.map((item) => item.id === recorded.id ? recorded : item) : [...contract.signatures, recorded]
    const sedarSigned = verifiedParty(signatures, 'SEDAR')
    const customerSigned = verifiedParty(signatures, 'Customer')
    const fullyExecuted = sedarSigned && customerSigned
    const effective = new Date(contract.effectiveDate)
    const active = fullyExecuted && !Number.isNaN(effective.getTime()) && effective.getTime() <= Date.now()
    const signatureStatus = fullyExecuted ? 'Fully Executed' : sedarSigned ? 'SEDAR Signed' : customerSigned ? 'Customer Signed' : signatures.some((item) => item.verificationStatus === 'Rejected') ? 'Declined' : 'Not Started'
    return this.update(id, { signatures, signatureStatus, status: active ? 'Active' : 'Awaiting Signatures', fullyExecutedAt: fullyExecuted ? new Date().toISOString() : contract.fullyExecutedAt })
  },
  recordCustomerSignedCopy(id: string, input: Omit<ContractSignatureInput, 'party'>): Contract | undefined { const contract = this.getById(id); if (!contract || !['Sent for Signature', 'Partially Signed'].includes(getContractDisplayStatus(contract))) return undefined; return this.recordSignature(id, { ...input, party: 'Customer' }) },
  sendSigningReminder(id: string): Contract | undefined { const contract = this.getById(id); if (!contract || !['Sent for Signature', 'Partially Signed'].includes(getContractDisplayStatus(contract))) return undefined; const now = new Date().toISOString(); const updated = this.update(id, { lastReminderAt: now }); if (updated) customerActivityRepository.append({ customerId: updated.customerId, module: 'Contracts', action: 'Contacted', description: 'Signing reminder sent to the customer.', actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Contract', id: updated.id, referenceNumber: updated.contractNumber }, visibility: 'Internal', systemGenerated: true, eventSource: 'contractRepository' }); return updated },
  withdrawRequest(id: string): Contract | undefined { const contract = this.getById(id); if (!contract || !['Requested', 'Drafting'].includes(getContractDisplayStatus(contract))) return undefined; return this.update(id, { status: 'Terminated' }) },
  requestCorrection(id: string, details: Omit<ContractCorrectionRequest, 'id' | 'requestedBy' | 'requestedAt' | 'status'>): Contract | undefined { const contract = this.getById(id); if (!contract || !['Requested', 'Drafting', 'Internal Review'].includes(getContractDisplayStatus(contract))) return undefined; const request: ContractCorrectionRequest = { ...details, id: uuid('CORR'), requestedBy: PROTOTYPE_ACTIVITY_ACTOR.name, requestedAt: new Date().toISOString(), status: 'Requested' }; const updated = this.update(id, { correctionRequests: [...(contract.correctionRequests ?? []), request] }); if (updated) customerActivityRepository.append({ customerId: updated.customerId, module: 'Contracts', action: 'Submitted', description: `Marketing correction requested for ${details.section}.`, actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Contract', id: updated.id, referenceNumber: updated.contractNumber }, visibility: 'Internal', reason: details.reason, metadata: { priority: details.priority }, systemGenerated: false, eventSource: 'contractRepository' }); return updated },
  respondToInformationRequest(id: string, response: string): Contract | undefined { const contract = this.getById(id); if (!contract || getContractDisplayStatus(contract) !== 'Internal Review' || !response.trim()) return undefined; const updated = this.update(id, { marketingNotes: [contract.marketingNotes, response.trim()].filter(Boolean).join('\n') }); if (updated) customerActivityRepository.append({ customerId: updated.customerId, module: 'Contracts', action: 'Updated', description: 'Marketing responded to an internal-review information request.', actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Contract', id: updated.id, referenceNumber: updated.contractNumber }, visibility: 'Internal', internalNote: response.trim(), systemGenerated: false, eventSource: 'contractRepository' }); return updated },
  addInternalNote(id: string, note: string): boolean { const contract = this.getById(id); if (!contract || !note.trim()) return false; customerActivityRepository.append({ customerId: contract.customerId, module: 'Contracts', action: 'Note Added', description: 'Internal contract note added.', actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Contract', id: contract.id, referenceNumber: contract.contractNumber }, visibility: 'Internal', internalNote: note.trim(), systemGenerated: false, eventSource: 'contractRepository' }); return true },
  requestAmendment(id: string, details?: { reason?: string; section?: string; requestedChange?: string; requestedEffectiveDate?: string; priority?: string; supportingDocumentName?: string; internalNotes?: string }): Contract | undefined { const source = this.getById(id); if (!source || !['Active', 'Fully Executed'].includes(getContractDisplayStatus(source))) return undefined; const now = new Date().toISOString(); const created = this.create({ ...copyInput(source), contractNumber: nextNumber(this.getAll()), contractRequestNumber: undefined, contractType: 'Amendment', title: `Amendment · ${source.title}`, description: details?.requestedChange ?? source.description, requestedEffectiveDate: details?.requestedEffectiveDate ?? source.effectiveDate.slice(0,10), marketingNotes: details?.internalNotes ?? details?.reason, supportingDocumentNames: details?.supportingDocumentName ? [details.supportingDocumentName] : [], status: 'Requested', signatureStatus: 'Not Ready for Signature', signatures: [], fullyExecutedAt: undefined, selectedCustomerContactId: undefined, signatories: undefined, supersedesContractId: source.id, amendmentRequestedAt: now }); this.update(source.id, { amendmentRequestedAt: now }); customerActivityRepository.appendOnce({ customerId: source.customerId, module: 'Contracts', action: 'Submitted', description: 'Contract amendment requested.', actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Contract', id: source.id, referenceNumber: source.contractNumber }, visibility: 'Internal', metadata: { amendmentId: created.id }, sourceEventKey: `contract:${source.id}:amendment:${created.id}`, systemGenerated: true, eventSource: 'contractRepository' }); return created },
  requestRenewal(id: string, details?: { proposedStartDate?: string; proposedEndDate?: string; customerConfirmation?: string; serviceChanges?: string; pricingReviewRequired?: boolean; operationalRequirements?: string; marketingNotes?: string; supportingDocumentName?: string }): Contract | undefined { const source = this.getById(id); if (!source || !['Active', 'Expiring Soon', 'Expired'].includes(getContractDisplayStatus(source))) return undefined; const start = details?.proposedStartDate ? new Date(`${details.proposedStartDate}T00:00:00Z`) : new Date(source.expirationDate); if (!details?.proposedStartDate) start.setUTCDate(start.getUTCDate() + 1); const end = details?.proposedEndDate ? new Date(`${details.proposedEndDate}T23:59:59Z`) : new Date(start); if (!details?.proposedEndDate) { end.setUTCFullYear(end.getUTCFullYear() + 1); end.setUTCDate(end.getUTCDate() - 1) } const created = this.create({ ...copyInput(source), contractNumber: nextNumber(this.getAll()), contractRequestNumber: undefined, contractType: 'Renewal', title: `Renewal · ${source.title}`, description: details?.serviceChanges ?? source.description, startDate: start.toISOString().slice(0,10), endDate: end.toISOString().slice(0,10), effectiveDate: start.toISOString(), expirationDate: end.toISOString(), marketingNotes: details?.marketingNotes, specialCustomerRequirements: details?.operationalRequirements, supportingDocumentNames: details?.supportingDocumentName ? [details.supportingDocumentName] : [], status: 'Requested', signatureStatus: 'Not Ready for Signature', signatures: [], fullyExecutedAt: undefined, selectedCustomerContactId: undefined, signatories: undefined, supersedesContractId: source.id, renewalRequestedAt: new Date().toISOString() }); customerActivityRepository.appendOnce({ customerId: source.customerId, module: 'Contracts', action: 'Submitted', description: 'Contract renewal requested.', actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Contract', id: source.id, referenceNumber: source.contractNumber }, visibility: 'Internal', metadata: { renewalId: created.id, pricingReviewRequired: details?.pricingReviewRequired ?? true, customerConfirmation: details?.customerConfirmation ?? 'Pending' }, sourceEventKey: `contract:${source.id}:renewal:${created.id}`, systemGenerated: true, eventSource: 'contractRepository' }); return created },
  requestTermination(id: string, request: ContractTerminationRequestInput): Contract | undefined {
    const contract = this.getById(id)
    if (!contract) return undefined
    const requestedAt = request.requestedAt ?? new Date().toISOString()
    const terminationRequestId = request.id ?? uuid('TERM')
    const updated = this.update(id, { terminationRequest: { ...request, id: terminationRequestId, requestedAt, status: request.status ?? 'Pending Review' }, terminationEffectiveDate: request.requestedTerminationDate })
    if (updated) customerActivityRepository.appendOnce({ customerId: updated.customerId, module: 'Contracts', action: 'Submitted', description: 'Contract termination request submitted.', actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Contract', id: updated.id, referenceNumber: updated.contractNumber }, visibility: 'Internal', sourceEventKey: `contract:${id}:termination-request:${terminationRequestId}`, systemGenerated: true, eventSource: 'contractRepository' })
    return updated
  },
}

export { STORAGE_KEY as CONTRACT_STORAGE_KEY }
