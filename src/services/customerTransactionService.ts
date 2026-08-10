import { financeTransactionSummaries } from '../data/financeTransactionSummaryMockData'
import { contractRepository } from '../repositories/contractRepository'
import { quotationRepository } from '../repositories/quotationRepository'
import { serviceRequestRepository } from '../repositories/serviceRequestRepository'
import type { CustomerTransaction, RelatedTransactionRecord } from '../types/customerTransaction'
import { normalizeTransactionStatus } from '../utils/transactionStatus'
import { getTransactionSummary } from '../utils/transactionSummary'
import { getEffectiveQuotationStatus } from '../utils/quotationStatus'
import { getEffectiveContractStatus } from '../utils/contractStatus'

const contractRequestSummary: CustomerTransaction = {
  id: 'contract-request:CR-PROTOTYPE-001', customerId: 'CUS-001', contactId: 'CUS-001-CON-002', occurredAt: '2026-07-30T06:00:00.000Z', type: 'Contract Request', reference: 'CR-2026-001', description: 'Contract preparation requested', status: 'Under Review', sourceStatus: 'Under Document Control preparation', visibility: 'Internal',
  source: { department: 'Document Control', kind: 'contract-request', id: 'CR-PROTOTYPE-001', route: '/marketing/contract-requests/CR-PROTOTYPE-001' }, customerContext: { customerId: 'CUS-001', contactId: 'CUS-001-CON-002' }, relatedRecords: [{ sourceKind: 'service-request', sourceId: 'REQ-PROTOTYPE-014' }, { sourceKind: 'quotation', sourceId: 'QUO-PROTOTYPE-014' }, { sourceKind: 'contract', sourceId: 'CON-PROTOTYPE-018' }], recordedBy: 'Andrea Santos', updatedAt: '2026-07-30T06:00:00.000Z',
}

const related = (...records: Array<RelatedTransactionRecord | undefined>): RelatedTransactionRecord[] => records.filter((record): record is RelatedTransactionRecord => Boolean(record))

const getAll = (): CustomerTransaction[] => {
  const requests = serviceRequestRepository.getAll().map<CustomerTransaction>((request) => ({
    id: `${request.status === 'Completed' ? 'completed-service' : 'service-request'}:${request.id}`, customerId: request.customerId, contactId: request.contactId, occurredAt: request.updatedAt, type: request.status === 'Completed' ? 'Completed Service' : 'Service Request', reference: request.referenceNumber, description: request.status === 'Completed' ? `${request.service.type} service completed` : request.service.description, status: normalizeTransactionStatus(request.status), sourceStatus: request.status, visibility: 'Customer Visible', vesselName: request.vessel.name, serviceType: request.service.type, location: request.schedule.portOrOperatingArea, purchaseOrderReference: request.service.purchaseOrderReference, recordedBy: request.assignedMarketingRepresentative, updatedAt: request.updatedAt,
    source: { department: request.status === 'Completed' ? 'Operations' : 'Marketing', kind: 'service-request', id: request.id, route: `/marketing/service-requests/${request.id}` }, customerContext: { customerId: request.customerId, contactId: request.contactId }, relatedRecords: [],
  }))
  const quotations = quotationRepository.getAll().map<CustomerTransaction>((quotation) => ({
    id: `quotation:${quotation.id}`, customerId: quotation.customerId, contactId: quotation.contactId, occurredAt: quotation.updatedAt, type: 'Quotation', reference: quotation.quotationNumber, description: quotation.subject, status: normalizeTransactionStatus(getEffectiveQuotationStatus(quotation)), sourceStatus: getEffectiveQuotationStatus(quotation), amount: quotation.totalAmount, currency: quotation.currency, visibility: ['Draft', 'For Internal Approval', 'For Approval', 'Ready to Send', 'Approved', 'Superseded', 'Withdrawn'].includes(quotation.status) ? 'Internal' : 'Customer Visible', vesselName: quotation.vesselName, serviceType: quotation.serviceType, purchaseOrderReference: quotation.purchaseOrderReference, recordedBy: quotation.preparedBy, updatedAt: quotation.updatedAt,
    source: { department: 'Marketing', kind: 'quotation', id: quotation.id, route: `/marketing/quotations/${quotation.id}` }, customerContext: { customerId: quotation.customerId, contactId: quotation.contactId }, relatedRecords: related({ sourceKind: 'service-request', sourceId: quotation.serviceRequestId }, quotation.supersedesQuotationId ? { sourceKind: 'quotation', sourceId: quotation.supersedesQuotationId } : undefined, quotation.supersededByQuotationId ? { sourceKind: 'quotation', sourceId: quotation.supersededByQuotationId } : undefined), quotation: { familyId: quotation.originalQuotationId, revisionNumber: quotation.revisionNumber, superseded: quotation.status === 'Superseded' || Boolean(quotation.supersededByQuotationId) },
  }))
  const contracts = contractRepository.getAll().map<CustomerTransaction>((contract) => ({
    id: `contract:${contract.id}`, customerId: contract.customerId, contactId: contract.contactId, occurredAt: contract.updatedAt, type: 'Contract', reference: contract.contractNumber, description: contract.title, status: normalizeTransactionStatus(getEffectiveContractStatus(contract)), sourceStatus: getEffectiveContractStatus(contract), amount: contract.contractValue, currency: contract.currency, visibility: ['Draft', 'For Internal Review', 'Superseded'].includes(contract.status) ? 'Internal' : 'Customer Visible', vesselName: contract.vesselName, serviceType: contract.serviceType, recordedBy: contract.managedBy, updatedAt: contract.updatedAt,
    source: { department: 'Document Control', kind: 'contract', id: contract.id, route: `/marketing/contracts/${contract.id}` }, customerContext: { customerId: contract.customerId, contactId: contract.contactId }, relatedRecords: related({ sourceKind: 'service-request', sourceId: contract.serviceRequestId }, { sourceKind: 'quotation', sourceId: contract.quotationId }, contract.supersedesContractId ? { sourceKind: 'contract', sourceId: contract.supersedesContractId } : undefined, contract.supersededByContractId ? { sourceKind: 'contract', sourceId: contract.supersededByContractId } : undefined),
  }))
  const finance = financeTransactionSummaries.map<CustomerTransaction>((item) => ({
    id: `finance-summary:${item.id}`, customerId: item.customerId, occurredAt: item.occurredAt, type: item.type, reference: item.reference, description: item.description, status: normalizeTransactionStatus(item.status), sourceStatus: item.status, amount: item.amount, currency: item.currency, visibility: item.visibility,
    source: { department: 'Finance', kind: 'finance-summary', id: item.id, route: `/finance/transactions/${item.id}` }, customerContext: { customerId: item.customerId }, relatedRecords: related(...item.relatedFinanceSummaryIds.map((sourceId) => ({ sourceKind: 'finance-summary' as const, sourceId })), item.type === 'Invoice' ? { sourceKind: 'contract', sourceId: 'CON-PROTOTYPE-012' } : undefined), documentId: item.id, updatedAt: item.occurredAt,
  }))
  return [...requests, ...quotations, ...contracts, contractRequestSummary, ...finance]
}

export const customerTransactionService = {
  getByCustomerId(customerId: string): CustomerTransaction[] {
    return getAll().filter((item) => item.customerId === customerId).sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt))
  },
  getById(id: string): CustomerTransaction | undefined { return getAll().find((item) => item.id === id) },
  getRelatedRecords(id: string): CustomerTransaction[] {
    const all = getAll()
    const transaction = all.find((item) => item.id === id)
    if (!transaction) return []
    const keys = new Set([`${transaction.source.kind}:${transaction.source.id}`, ...transaction.relatedRecords.map((item) => `${item.sourceKind}:${item.sourceId}`)])
    let changed = true
    while (changed) {
      changed = false
      for (const item of all) {
        const itemKey = `${item.source.kind}:${item.source.id}`
        const touchesChain = keys.has(itemKey) || item.relatedRecords.some((record) => keys.has(`${record.sourceKind}:${record.sourceId}`))
        if (!touchesChain) continue
        if (!keys.has(itemKey)) { keys.add(itemKey); changed = true }
        for (const record of item.relatedRecords) { const key = `${record.sourceKind}:${record.sourceId}`; if (!keys.has(key)) { keys.add(key); changed = true } }
      }
    }
    return all.filter((item) => item.id !== transaction.id && keys.has(`${item.source.kind}:${item.source.id}`)).sort((left, right) => Date.parse(left.occurredAt) - Date.parse(right.occurredAt))
  },
  getSummary(customerId: string) { return getTransactionSummary(this.getByCustomerId(customerId)) },
}
