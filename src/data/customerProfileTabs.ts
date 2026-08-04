export const profileTabs = ['Overview', 'Contacts', 'Service Requests', 'Quotations', 'Contracts', 'Transaction History', 'Appointments', 'Documents', 'Activity Log'] as const
export type ProfileTab = typeof profileTabs[number]
