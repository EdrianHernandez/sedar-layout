import { createContext, useContext } from 'react'
import type { EngineLog, WatchLogReviewStatus } from '../types/engineLog'
import type { PMSChecklist } from '../types/pmsChecklist'
import type { Vessel } from '../types/vessel'

export interface WatchLogSignoff {
  preparedBy: string
  verifiedBy: string
  signedAt: string
}

export interface EngineRoomContextValue {
  reviewStatus: WatchLogReviewStatus
  setReviewStatus: (status: WatchLogReviewStatus) => void
  watchStart: string
  watchStop: string
  setWatchStart: (value: string) => void
  setWatchStop: (value: string) => void
  hydraulicOilAdded: number
  setHydraulicOilAdded: (value: number) => void
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
  signoff: WatchLogSignoff | null
  setSignoff: (signoff: WatchLogSignoff) => void
}

export const EngineRoomContext = createContext<EngineRoomContextValue | null>(null)

export function useEngineRoom(): EngineRoomContextValue {
  const context = useContext(EngineRoomContext)
  if (!context) throw new Error('useEngineRoom must be used within EngineRoomProvider')
  return context
}
