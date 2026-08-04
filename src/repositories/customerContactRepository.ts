import { initialCustomerContacts } from '../data/customerContactMockData'
import type { CustomerContact } from '../types/customerContact'

const STORAGE_KEY = 'sedar-marketing-customer-contacts'
const validContact = (value: unknown): value is CustomerContact => Boolean(value && typeof value === 'object' && typeof (value as CustomerContact).id === 'string' && typeof (value as CustomerContact).customerId === 'string' && Array.isArray((value as CustomerContact).contactTypes))

export const customerContactRepository = {
  getAll(): CustomerContact[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return [...initialCustomerContacts]
      const parsed: unknown = JSON.parse(stored)
      return Array.isArray(parsed) && parsed.every(validContact) ? parsed : [...initialCustomerContacts]
    } catch { return [...initialCustomerContacts] }
  },
  getByCustomer(customerId: string): CustomerContact[] { return this.getAll().filter((contact) => contact.customerId === customerId) },
  save(contact: CustomerContact): void {
    const contacts = this.getAll()
    const index = contacts.findIndex((item) => item.id === contact.id)
    if (index >= 0) contacts[index] = contact
    else contacts.push(contact)
    // Prototype storage only. Replace this repository with the decentralized backend.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts))
  },
  setPrimary(customerId: string, contactId: string): CustomerContact[] {
    const now = new Date().toISOString()
    const contacts = this.getAll().map((contact) => contact.customerId === customerId ? { ...contact, isPrimary: contact.id === contactId, updatedAt: now } : contact)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts))
    return contacts.filter((contact) => contact.customerId === customerId)
  },
}
