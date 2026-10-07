import { createContext, useContext } from 'react'
import type { EngineLog, WatchLogReviewStatus } from '../types/engineLog'
import type { PMSChecklist, TaskCondition } from '../types/pmsChecklist'
import type { Vessel } from '../types/vessel'
import type { MasterRob } from '../data/chiefEngineerMockData'

export interface WatchLogSignoff {
  preparedBy: string
  verifiedBy: string
  signedAt: string
  remarks?: string
}

export interface EngineRoomContextValue {
  reviewStatus: WatchLogReviewStatus
  setReviewStatus: (status: WatchLogReviewStatus) => void
  hydraulicOilAdded: number
  setHydraulicOilAdded: (value: number) => void
  robReceived: MasterRob
  setRobReceived: (field: keyof MasterRob, value: number) => void
  vessels: Vessel[]
  activeVesselId: string
  activeVessel: Vessel
  selectVessel: (vesselId: string) => void
  now: Date
  logs: EngineLog[]
  checklists: PMSChecklist[]
  updateLog: (updated: EngineLog) => void
  // Binary condition reporting: first pick stamps the task's logged time; picking a
  // non-issue condition drops the photographic evidence (the timestamp survives
  // switches/overrides, and optional remarks survive into the Done state).
  setTaskCondition: (checklistId: string, taskId: string, condition: TaskCondition) => void
  // Condition-agnostic remarks capture: writes findings/photo WITHOUT touching the
  // task's condition (optional notes on Done, mandatory defect text on Issue).
  setTaskRemarks: (checklistId: string, taskId: string, findings: string, photoDataUrl?: string) => void
  // Manual timestamp override — backdate to when the physical inspection happened.
  setTaskLoggedAt: (checklistId: string, taskId: string, loggedAt: string) => void
  // Explicit sign-off: snapshots the odometer for the recurring modulo unlock; the
  // 12000H drydock tier additionally resets the engine's odometer epoch to 0.
  signoffChecklist: (checklistId: string) => void
  signoff: WatchLogSignoff | null
  setSignoff: (signoff: WatchLogSignoff) => void
}

export const EngineRoomContext = createContext<EngineRoomContextValue | null>(null)

export function useEngineRoom(): EngineRoomContextValue {
  const context = useContext(EngineRoomContext)
  if (!context) throw new Error('useEngineRoom must be used within EngineRoomProvider')
  return context
}
