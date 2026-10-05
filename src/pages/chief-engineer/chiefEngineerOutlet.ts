import { useOutletContext } from 'react-router-dom'
import type { EngineLog } from '../../types/engineLog'
import type { PMSChecklist, TaskCondition } from '../../types/pmsChecklist'
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
  setTaskCondition: (checklistId: string, taskId: string, condition: TaskCondition) => void
  setTaskIssue: (checklistId: string, taskId: string, findings: string, photoDataUrl?: string) => void
  signoffChecklist: (checklistId: string) => void
}

export function useChiefEngineer(): ChiefEngineerOutletContext {
  return useOutletContext<ChiefEngineerOutletContext>()
}
