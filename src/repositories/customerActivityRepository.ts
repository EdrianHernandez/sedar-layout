import { initialCustomerActivities } from '../data/customerActivityMockData'
import { ACTIVITY_ACTIONS, ACTIVITY_ACTOR_TYPES, ACTIVITY_MODULES, ACTIVITY_VISIBILITIES, type CustomerActivity, type CustomerActivityInput, type CustomerActivityOnceInput } from '../types/customerActivity'
import { sanitizeActivityChanges, sanitizeActivityMetadata } from '../utils/activityRedaction'

const STORAGE_KEY = 'sedar-marketing-customer-activities'
const id = (): string => globalThis.crypto?.randomUUID?.() ?? `ACT-${Date.now()}-${Math.random().toString(36).slice(2)}`
const valid = (item: unknown): item is CustomerActivity => { if (!item || typeof item !== 'object') return false; const value = item as CustomerActivity; return typeof value.id === 'string' && typeof value.customerId === 'string' && typeof value.occurredAt === 'string' && ACTIVITY_MODULES.includes(value.module) && ACTIVITY_ACTIONS.includes(value.action) && ACTIVITY_ACTOR_TYPES.includes(value.actor?.type) && ACTIVITY_VISIBILITIES.includes(value.visibility) }
const sanitize = (item: CustomerActivity): CustomerActivity => ({ ...item, description: item.description.slice(0, 500), actor: { ...item.actor, name: item.actor.name.slice(0, 120), department: item.actor.department?.slice(0, 80) }, changes: sanitizeActivityChanges(item.changes), metadata: sanitizeActivityMetadata(item.metadata) })
const load = (): CustomerActivity[] => { if (typeof localStorage === 'undefined') return initialCustomerActivities.map(sanitize); const raw = localStorage.getItem(STORAGE_KEY); if (raw === null) return initialCustomerActivities.map(sanitize); try { const parsed: unknown = JSON.parse(raw); return Array.isArray(parsed) && parsed.every(valid) ? parsed.map(sanitize) : [] } catch { return [] } }
// Prototype repository only. Replace with the decentralized backend and immutable audit services.
const persist = (items: CustomerActivity[]) => { if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map(sanitize))) }
const make = (input: CustomerActivityInput): CustomerActivity => { const now = new Date().toISOString(); return sanitize({ ...input, id: id(), occurredAt: input.occurredAt ?? now, recordedAt: input.recordedAt ?? now, changes: sanitizeActivityChanges(input.changes), metadata: sanitizeActivityMetadata(input.metadata) }) }
const getAll = () => load().sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
const getByCustomerId = (customerId: string) => getAll().filter((item) => item.customerId === customerId)
const getById = (activityId: string) => getAll().find((item) => item.id === activityId)
export const customerActivityReader = { getAll, getByCustomerId, getById }
export const customerActivityRepository = { getAll, getByCustomerId, getById, append(input: CustomerActivityInput) { const item = make(input); persist([item, ...load()]); return item }, appendOnce(input: CustomerActivityOnceInput) { const existing = load().find((item) => item.sourceEventKey === input.sourceEventKey); if (existing) return existing; const item = make(input); persist([item, ...load()]); return item } }
export { STORAGE_KEY as CUSTOMER_ACTIVITY_STORAGE_KEY }
