import type { EngineId } from './engineLog'

export type PMSInterval = '250H' | '500H' | '1000H' | '6000H' | '12000H'

// 3-state condition reporting per task: pending until the technician picks one of the
// three outcomes. `issue` carries the findings textarea + photographic evidence.
export type TaskCondition = 'pending' | 'done' | 'issue' | 'na'

export interface PMSTask {
  id: string
  label: string
  condition: TaskCondition
  findings?: string
  photoDataUrl?: string
}

export interface PMSChecklist {
  id: string
  interval: PMSInterval
  engineId: EngineId
  engineScope: string
  tasks: PMSTask[]
  // Explicit sign-off (not derived from tasks): locks the routine until the next
  // multiple of its interval on the odometer — see completedOdometer below.
  isDone: boolean
  // Odometer reading captured at sign-off, in the current drydock epoch. Drives the
  // recurring (modulo) unlock: next due at (floor(completed / hours) + 1) * hours.
  completedOdometer?: number
  completedAt?: string
}
