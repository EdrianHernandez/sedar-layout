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
  // 3-state condition reporting: picking a non-issue condition clears issue data.
  setTaskCondition: (checklistId: string, taskId: string, condition: TaskCondition) => void
  setTaskIssue: (checklistId: string, taskId: string, findings: string, photoDataUrl?: string) => void
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
