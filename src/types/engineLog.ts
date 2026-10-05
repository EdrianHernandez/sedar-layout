export type EngineId = 'ME-PORT' | 'ME-STBD' | 'AUX-1' | 'AUX-2'

export type EngineClass = 'main' | 'auxiliary'

// Watch-log status of one engine row. Explicit (not derived from the time window) so a typed
// cut-off time never flips the chip: Operated rows keep their status while a stop is entered.
export type EngineStatus = 'operated' | 'no-operation' | 'standby'

export interface EngineLog {
  id: string
  engineId: EngineId
  engineClass: EngineClass
  label: string
  date: string
  status: EngineStatus
  timeStart: string | null
  timeStop: string | null
  rpm: number
  oilPressure: number
  waterTemp: number
  fuelRobStart: number
  fuelRobStop: number
  lubeOilAdded: number
  fwCoolantAdded: number
  meterPrevious: number
  meterCurrent: number
  lastOverhaulMeter: number
}

export type WatchLogStatus = 'verified' | 'pending'

export type WatchLogReviewStatus = 'draft' | 'pending' | 'approved' | 'returned'

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
