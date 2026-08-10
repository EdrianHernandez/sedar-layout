import type { ContractRequest } from '../types/contractRequest'

const STORAGE_KEY = 'sedar-marketing-contract-requests'
const read = (): ContractRequest[] => { try { const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); return Array.isArray(parsed) ? parsed.filter((item): item is ContractRequest => Boolean(item && typeof item === 'object' && typeof (item as Partial<ContractRequest>).id === 'string')) : [] } catch { return [] } }
const persist = (items: ContractRequest[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items))

export const contractRequestRepository = {
  getAll: read,
  getByQuotationId(quotationId: string): ContractRequest | undefined { return read().find((item) => item.quotationId === quotationId && !['Completed', 'Cancelled'].includes(item.status)) },
  create(input: Pick<ContractRequest, 'quotationId' | 'serviceRequestId' | 'customerId' | 'requestedBy'>): ContractRequest {
    const items = read(); const existing = items.find((item) => item.quotationId === input.quotationId && !['Completed', 'Cancelled'].includes(item.status)); if (existing) return existing
    const now = new Date().toISOString(); const next = Math.max(0, ...items.map((item) => Number(item.referenceNumber.match(/(\d+)$/)?.[1] ?? 0))) + 1
    const request: ContractRequest = { ...input, id: globalThis.crypto?.randomUUID?.() ?? `CR-${Date.now()}`, referenceNumber: `CR-${new Date().getFullYear()}-${String(next).padStart(3, '0')}`, status: 'Requested', createdAt: now, updatedAt: now }
    persist([request, ...items]); return request
  },
}
