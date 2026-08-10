import {
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  FileText,
  FileSignature,
  LayoutDashboard,
  Package,
  ReceiptText,
  AlertTriangle,
  History,
  Anchor,
  CalendarCheck,
} from 'lucide-react'
import type { DepartmentConfig, Metric, NavigationGroup } from '../types'

export const departments: DepartmentConfig[] = [
  { id: 'marketing', label: 'Marketing', sublabel: 'Marketing ERP', routePrefix: '/marketing', defaultPath: '/marketing/dashboard' },
  { id: 'technical', label: 'Technical', sublabel: 'Technical & Maintenance', routePrefix: '/technical', defaultPath: '/technical/dashboard' },
]

export const marketingNavigationGroups: NavigationGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/marketing/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Customer Operations',
    items: [
      { label: 'Service Requests', path: '/marketing/service-requests', icon: ClipboardList },
      { label: 'Customers', path: '/marketing/customers', icon: Building2 },
    ],
  },
  {
    label: 'Sales Documents',
    items: [
      { label: 'Quotations', path: '/marketing/quotations', icon: ReceiptText },
      { label: 'Contracts', path: '/marketing/contracts', icon: FileSignature },
    ],
  },
  {
    label: 'Planning',
    items: [
      { label: 'Appointments', path: '/marketing/appointments', icon: CalendarDays },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Reports', path: '/marketing/reports', icon: BarChart3 },
    ],
  },
]

export const metrics: Metric[] = [
  { label: 'PENDING REQUEST', value: 0, detail: '0 Urgent', icon: FileText },
  { label: 'CUSTOMER APPROVAL', value: 0, icon: Clock3 },
  { label: 'PENDING CONTRACTS', value: 0, icon: ClipboardCheck },
  { label: "TODAY'S SCHEDULE", value: 0, icon: CalendarDays },
]

export const technicalNavigationGroups: NavigationGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/technical/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Maintenance',
    items: [
      { label: 'Planned Maintenance', path: '/technical/maintenance', icon: CalendarCheck },
      { label: 'Work Orders', path: '/technical/work-orders', icon: ClipboardList },
      { label: 'Defects & Repairs', path: '/technical/defects', icon: AlertTriangle },
    ],
  },
  {
    label: 'Vessel Management',
    items: [
      { label: 'Equipment History', path: '/technical/equipment', icon: History },
      { label: 'Dry Dock Planning', path: '/technical/dry-dock', icon: Anchor },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { label: 'Spare Parts', path: '/technical/spare-parts', icon: Package },
    ],
  },
  {
    label: 'Reports',
    items: [
      { label: 'Maintenance Reports', path: '/technical/reports', icon: BarChart3 },
    ],
  },
]
