export type EngineId = 'ME-PORT' | 'ME-STBD' | 'AUX-1' | 'AUX-2'

export type EngineClass = 'main' | 'auxiliary'

export interface EngineLog {
  id: string
  engineId: EngineId
  engineClass: EngineClass
  label: string
  date: string
  timeStart: string | null
  timeStop: string | null
  rpm: number
  oilPressure: number
  waterTemp: number
  fuelRobStart: number
  fuelRobStop: number
  meterPrevious: number
  meterCurrent: number
  lastOverhaulMeter: number
}

export type WatchLogStatus = 'verified' | 'pending'

export interface WatchLogSummary {
  id: string
  date: string
  timeRange: string
  preparedBy: string
  status: WatchLogStatus
}

export interface WatchLogHistoryEntry {
  id: string
  dateISO: string
  timeRange: string
  preparedBy: string
  totalRunningHours: number
  fuelConsumed: number
  status: WatchLogStatus
}
