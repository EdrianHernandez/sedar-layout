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

export type Department = 'marketing' | 'technical'

export interface DepartmentConfig {
  id: Department
  label: string
  sublabel: string
  routePrefix: string
  defaultPath: string
}

export type RequestFilter = 'ALL' | 'ACTIVE' | 'DRAFTS'

export interface Metric {
  label: string
  value: number
  detail?: string
  icon: LucideIcon
}
