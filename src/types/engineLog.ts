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
}
