import { createContext, useContext } from 'react'
import type { EngineLog, WatchLogReviewStatus } from '../types/engineLog'
import type { PMSChecklist } from '../types/pmsChecklist'
import type { Vessel } from '../types/vessel'

export type EngineRole = 'Duty Engineer' | 'Chief Engineer'

export interface EngineRoomContextValue {
  currentRole: EngineRole
  reviewStatus: WatchLogReviewStatus
  setReviewStatus: (status: WatchLogReviewStatus) => void
  watchStart: string
  watchStop: string
  setWatchStart: (value: string) => void
  setWatchStop: (value: string) => void
  vessels: Vessel[]
  activeVesselId: string
  activeVessel: Vessel
  selectVessel: (vesselId: string) => void
  now: Date
  logs: EngineLog[]
  checklists: PMSChecklist[]
  updateLog: (updated: EngineLog) => void
  toggleTask: (checklistId: string, taskId: string) => void
  saveRemark: (checklistId: string, taskId: string, remark: string, hasPhoto: boolean) => void
}

export const EngineRoomContext = createContext<EngineRoomContextValue | null>(null)

export function useEngineRoom(): EngineRoomContextValue {
  const context = useContext(EngineRoomContext)
  if (!context) throw new Error('useEngineRoom must be used within EngineRoomProvider')
  return context
}
