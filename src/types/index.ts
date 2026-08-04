import type { LucideIcon } from 'lucide-react'

export interface NavigationItem {
  label: string
  path: string
  icon: LucideIcon
}

export interface NavigationGroup {
  label: string
  items: NavigationItem[]
}

export type RequestFilter = 'ALL' | 'ACTIVE' | 'DRAFTS'

export interface Metric {
  label: string
  value: number
  detail?: string
  icon: LucideIcon
}
