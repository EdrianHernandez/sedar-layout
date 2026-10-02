import { useOutletContext } from 'react-router-dom'
import type { EngineLog } from '../../types/engineLog'
import type { PMSChecklist } from '../../types/pmsChecklist'
import type { Vessel } from '../../types/vessel'

export interface ChiefEngineerOutletContext {
  vessels: Vessel[]
  activeVesselId: string
  activeVessel: Vessel
  selectVessel: (vesselId: string) => void
  now: Date
  notify: (message: string) => void
  logs: EngineLog[]
  checklists: PMSChecklist[]
  updateLog: (log: EngineLog) => void
  toggleTask: (checklistId: string, taskId: string) => void
  saveRemark: (checklistId: string, taskId: string, remark: string, hasPhoto: boolean) => void
}

export function useChiefEngineer(): ChiefEngineerOutletContext {
  return useOutletContext<ChiefEngineerOutletContext>()
}
