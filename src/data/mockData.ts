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
  ReceiptText,
} from 'lucide-react'
import type { Metric, NavigationGroup } from '../types'

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
