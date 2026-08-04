import { initialCustomerContacts } from '../data/customerContactMockData'
import type { CustomerContact } from '../types/customerContact'
import { customerActivityRepository } from './customerActivityRepository'
import { PROTOTYPE_ACTIVITY_ACTOR } from '../types/customerActivity'

const STORAGE_KEY = 'sedar-marketing-customer-contacts'
const validContact = (value: unknown): value is CustomerContact => Boolean(value && typeof value === 'object' && typeof (value as CustomerContact).id === 'string' && typeof (value as CustomerContact).customerId === 'string' && Array.isArray((value as CustomerContact).contactTypes))

export const customerContactRepository = {
  getAll(): CustomerContact[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return [...initialCustomerContacts]
      const parsed: unknown = JSON.parse(stored)
      if (!Array.isArray(parsed) || !parsed.every(validContact)) return [...initialCustomerContacts]
      const storedIds = new Set(parsed.map((contact) => contact.id))
      return [...parsed, ...initialCustomerContacts.filter((contact) => !storedIds.has(contact.id))]
    } catch { return [...initialCustomerContacts] }
  },
  getByCustomer(customerId: string): CustomerContact[] { return this.getAll().filter((contact) => contact.customerId === customerId) },
  save(contact: CustomerContact): void {
    const contacts = this.getAll()
    const index = contacts.findIndex((item) => item.id === contact.id)
    const current = index >= 0 ? contacts[index] : undefined
    if (index >= 0) contacts[index] = contact
    else contacts.push(contact)
    // Prototype storage only. Replace this repository with the decentralized backend.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts))
    const base = { customerId: contact.customerId, module: 'Contacts' as const, actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Contact', id: contact.id, referenceNumber: contact.id }, visibility: 'Internal' as const, systemGenerated: true, eventSource: 'customerContactRepository' }
    if (!current) customerActivityRepository.appendOnce({ ...base, action: 'Created', description: 'Customer contact created.', sourceEventKey: `contact:${contact.id}:created` })
    else {
      const changes = [
        current.isPrimary !== contact.isPrimary ? { field: 'isPrimary', previousValue: current.isPrimary, newValue: contact.isPrimary } : undefined,
        current.status !== contact.status ? { field: 'status', previousValue: current.status, newValue: contact.status } : undefined,
      ].filter((change): change is NonNullable<typeof change> => Boolean(change))
      if (changes.length) customerActivityRepository.append({ ...base, action: 'Updated', description: 'Customer contact details updated.', changes })
    }
  },
  setPrimary(customerId: string, contactId: string): CustomerContact[] {
    const now = new Date().toISOString()
    const contacts = this.getAll().map((contact) => contact.customerId === customerId ? { ...contact, isPrimary: contact.id === contactId, updatedAt: now } : contact)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts))
    const selected = contacts.find((contact) => contact.customerId === customerId && contact.id === contactId)
    if (selected) customerActivityRepository.append({ customerId, module: 'Contacts', action: 'Updated', description: 'Primary customer contact changed.', actor: PROTOTYPE_ACTIVITY_ACTOR, relatedRecord: { type: 'Contact', id: contactId, referenceNumber: contactId }, visibility: 'Internal', changes: [{ field: 'isPrimary', newValue: true }], systemGenerated: true, eventSource: 'customerContactRepository' })
    return contacts.filter((contact) => contact.customerId === customerId)
  },
}
