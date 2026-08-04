export const profileTabs = ['Overview', 'Contacts', 'Service Requests', 'Quotations', 'Contracts', 'Transaction History', 'Appointments', 'Documents', 'Activity Log'] as const
export type ProfileTab = typeof profileTabs[number]
export const profileTabSlugs: Record<ProfileTab, string> = { Overview: 'overview', Contacts: 'contacts', 'Service Requests': 'service-requests', Quotations: 'quotations', Contracts: 'contracts', 'Transaction History': 'transactions', Appointments: 'appointments', Documents: 'documents', 'Activity Log': 'activity' }
