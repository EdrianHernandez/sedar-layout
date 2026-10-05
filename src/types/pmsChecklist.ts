import type { EngineId } from './engineLog'

export type PMSInterval = '250H' | '500H' | '1000H' | '6000H' | '12000H'

// Binary condition reporting per task: pending until the technician picks exactly one
// of the two outcomes. `issue` carries the mandatory remarks + photographic evidence.
export type TaskCondition = 'pending' | 'done' | 'issue'

export interface PMSTask {
  id: string
  label: string
  condition: TaskCondition
  // ISO capture time of the first Done/Issue pick — may be manually overridden
  // (backdated) to the actual time the physical inspection was conducted.
  loggedAt?: string
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
