import { CONTRACT_STATUSES, SIGNATURE_STATUSES, SIGNATURE_VERIFICATION_STATUSES } from '../data/contractOptions'
import { initialContracts } from '../data/contractMockData'
import type { Contract, ContractInput, ContractSignature, ContractSignatureInput, ContractTerminationRequestInput, SendForSignatureInput } from '../types/contract'

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
  return typeof item.id === 'string' && typeof item.contractNumber === 'string' && typeof item.customerId === 'string' && typeof item.contactId === 'string' && typeof item.quotationId === 'string' && typeof item.serviceRequestId === 'string' && typeof item.serviceType === 'string' && typeof item.vesselName === 'string' && typeof item.contractValue === 'number' && Number.isFinite(item.contractValue) && item.currency === 'PHP' && CONTRACT_STATUSES.includes(item.status as Contract['status']) && SIGNATURE_STATUSES.includes(item.signatureStatus as Contract['signatureStatus']) && isDate(item.effectiveDate) && isDate(item.expirationDate) && Array.isArray(item.signatures) && item.signatures.every(isSignature)
}

const persist = (contracts: Contract[]): void => {
  if (!storageAvailable()) return
  // Prototype browser storage only. Replace this repository with the production backend integration.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contracts))
}

const verifiedParty = (signatures: ContractSignature[], party: ContractSignature['party']): boolean => signatures.some((item) => item.party === party && item.verificationStatus === 'Verified' && Boolean(item.signedAt))

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
    return updated
  },
  submitForInternalReview(id: string): Contract | undefined { return this.update(id, { status: 'For Internal Review', submittedForInternalReviewAt: new Date().toISOString() }) },
  sendForSignature(id: string, input: SendForSignatureInput): Contract | undefined {
    if (!this.getById(id)) return undefined
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
  requestTermination(id: string, request: ContractTerminationRequestInput): Contract | undefined {
    if (!this.getById(id)) return undefined
    const requestedAt = request.requestedAt ?? new Date().toISOString()
    return this.update(id, { terminationRequest: { ...request, id: request.id ?? uuid('TERM'), requestedAt, status: request.status ?? 'Pending Review' }, terminationEffectiveDate: request.requestedTerminationDate })
  },
}

export { STORAGE_KEY as CONTRACT_STORAGE_KEY }
