import type { Customer, CustomerStatus, CustomerType } from '../types/customer'

export const customerStatuses: CustomerStatus[] = ['Prospect', 'Active', 'Inactive', 'Restricted']

export const customerTypes: CustomerType[] = [
  'Shipping Company',
  'Vessel Owner',
  'Port Operator',
  'Maritime Agency',
  'Industrial Client',
  'Government Agency',
]

// These companies and contacts are fictional prototype data and are not represented as SEDAR clients.
export const initialCustomers: Customer[] = [
  {
    id: 'CUS-001', companyName: 'Batangas Marine Logistics', companyInitials: 'BML',
    primaryContact: { name: 'Mara Villanueva', position: 'Operations Manager', email: 'mara.villanueva@example.test', phone: '+63 917 555 0101' },
    customerType: 'Shipping Company', activeRequests: 4, activeContracts: 2, lastInteraction: '2026-08-02', status: 'Active', assignedRepresentative: 'Andrea Santos', needsFollowUp: false,
    profileDetails: { taxIdentificationNumber: '000-000-001-001', businessAddress: 'Pier Access Road, Barangay Sta. Clara', cityProvince: 'Batangas City, Batangas', country: 'Philippines', companyEmail: 'operations@batangasmarine.example.test', companyPhone: '+63 43 555 0101', website: 'https://batangasmarine.example.test', dateAdded: '2024-03-12', leadSource: 'Industry Event', customerSince: '2024-04-01', nextFollowUpDate: '2026-08-12', relationshipStatus: 'Established' },
  },
  {
    id: 'CUS-002', companyName: 'Southern Port Agency', companyInitials: 'SPA',
    primaryContact: { name: 'Luis Mercado', position: 'Agency Director', email: 'luis.mercado@example.test', phone: '+63 917 555 0102' },
    customerType: 'Maritime Agency', activeRequests: 1, activeContracts: 0, lastInteraction: '2026-07-30', status: 'Prospect', assignedRepresentative: 'Miguel Reyes', needsFollowUp: true,
  },
  {
    id: 'CUS-003', companyName: 'Pacific Vessel Holdings', companyInitials: 'PVH',
    primaryContact: { name: 'Celia Navarro', position: 'Fleet Coordinator', email: 'celia.navarro@example.test', phone: '+63 917 555 0103' },
    customerType: 'Vessel Owner', activeRequests: 1, activeContracts: 1, lastInteraction: '2026-07-28', status: 'Active', assignedRepresentative: 'Andrea Santos', needsFollowUp: true,
  },
  {
    id: 'CUS-004', companyName: 'Luzon Harbor Services', companyInitials: 'LHS',
    primaryContact: { name: 'Paolo de Vera', position: 'Port Services Lead', email: 'paolo.devera@example.test', phone: '+63 917 555 0104' },
    customerType: 'Port Operator', activeRequests: 1, activeContracts: 1, lastInteraction: '2026-07-21', status: 'Inactive', assignedRepresentative: 'Bianca Flores', needsFollowUp: false,
  },
  {
    id: 'CUS-005', companyName: 'Archipelago Shipping Partners', companyInitials: 'ASP',
    primaryContact: { name: 'Nina Aguilar', position: 'Commercial Manager', email: 'nina.aguilar@example.test', phone: '+63 917 555 0105' },
    customerType: 'Shipping Company', activeRequests: 1, activeContracts: 3, lastInteraction: '2026-08-01', status: 'Active', assignedRepresentative: 'Miguel Reyes', needsFollowUp: false,
  },
  {
    id: 'CUS-006', companyName: 'Verde Island Marine Transport', companyInitials: 'VIM',
    primaryContact: { name: 'Ramon Castillo', position: 'General Manager', email: 'ramon.castillo@example.test', phone: '+63 917 555 0106' },
    customerType: 'Vessel Owner', activeRequests: 1, activeContracts: 0, lastInteraction: '2026-07-18', status: 'Prospect', assignedRepresentative: 'Bianca Flores', needsFollowUp: true,
  },
  {
    id: 'CUS-007', companyName: 'Calabarzon Industrial Cargo', companyInitials: 'CIC',
    primaryContact: { name: 'Elena Ramos', position: 'Supply Chain Director', email: 'elena.ramos@example.test', phone: '+63 917 555 0107' },
    customerType: 'Industrial Client', activeRequests: 1, activeContracts: 1, lastInteraction: '2026-07-25', status: 'Restricted', assignedRepresentative: 'Andrea Santos', needsFollowUp: true,
  },
  {
    id: 'CUS-008', companyName: 'Philippine Coastal Towing Agency', companyInitials: 'PCT',
    primaryContact: { name: 'Diego Mendoza', position: 'Marine Operations Head', email: 'diego.mendoza@example.test', phone: '+63 917 555 0108' },
    customerType: 'Government Agency', activeRequests: 1, activeContracts: 2, lastInteraction: '2026-07-31', status: 'Active', assignedRepresentative: 'Miguel Reyes', needsFollowUp: false,
  },
]
