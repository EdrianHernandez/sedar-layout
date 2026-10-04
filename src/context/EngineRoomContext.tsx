import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  assignedVessels,
  createInitialEngineLogs,
  createInitialPmsChecklists,
  defaultVesselId,
} from '../data/chiefEngineerMockData'
import type { EngineLog, WatchLogReviewStatus } from '../types/engineLog'
import type { PMSChecklist } from '../types/pmsChecklist'
import type { Vessel } from '../types/vessel'
import { currentClockTime } from '../utils/engineLog'
import { EngineRoomContext, type EngineRole, type EngineRoomContextValue } from './engineRoomStore'

function buildByVessel<T>(create: (vessel: Vessel) => T[]): Record<string, T[]> {
  return Object.fromEntries(assignedVessels.map((vessel) => [vessel.id, create(vessel)]))
}

export function EngineRoomProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [activeVesselId, setActiveVesselId] = useState(defaultVesselId)
  const [logsByVessel, setLogsByVessel] = useState<Record<string, EngineLog[]>>(() => buildByVessel(createInitialEngineLogs))
  const [checklistsByVessel, setChecklistsByVessel] = useState<Record<string, PMSChecklist[]>>(() => buildByVessel(createInitialPmsChecklists))
  const [reviewStatus, setReviewStatus] = useState<WatchLogReviewStatus>('draft')
  const [watchStart, setWatchStart] = useState(currentClockTime)
  const [watchStop, setWatchStop] = useState('')
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(clock)
  }, [])

  const currentRole: EngineRole = location.pathname.startsWith('/duty-engineer') ? 'Duty Engineer' : 'Chief Engineer'

  const activeVessel = assignedVessels.find((vessel) => vessel.id === activeVesselId) ?? assignedVessels[0]

  const selectVessel = useCallback((vesselId: string) => setActiveVesselId(vesselId), [])

  const updateLog = useCallback((updated: EngineLog) => {
    setLogsByVessel((current) => ({
      ...current,
      [activeVesselId]: (current[activeVesselId] ?? []).map((log) => (log.engineId === updated.engineId ? updated : log)),
    }))
  }, [activeVesselId])

  const toggleTask = useCallback((checklistId: string, taskId: string) => {
    setChecklistsByVessel((current) => ({
      ...current,
      [activeVesselId]: (current[activeVesselId] ?? []).map((checklist) => {
        if (checklist.id !== checklistId) return checklist
        const tasks = checklist.tasks.map((task) => (task.id === taskId ? { ...task, isDone: !task.isDone } : task))
        return { ...checklist, tasks, isDone: tasks.every((task) => task.isDone) }
      }),
    }))
  }, [activeVesselId])

  const saveRemark = useCallback((checklistId: string, taskId: string, remark: string, hasPhoto: boolean) => {
    setChecklistsByVessel((current) => ({
      ...current,
      [activeVesselId]: (current[activeVesselId] ?? []).map((checklist) => {
        if (checklist.id !== checklistId) return checklist
        return {
          ...checklist,
          tasks: checklist.tasks.map((task) => (task.id === taskId ? { ...task, remark: remark || undefined, hasPhoto } : task)),
        }
      }),
    }))
  }, [activeVesselId])

  const value = useMemo<EngineRoomContextValue>(() => {
    const logs = logsByVessel[activeVesselId] ?? []
    const checklists = checklistsByVessel[activeVesselId] ?? []
    return {
      currentRole,
      reviewStatus,
      setReviewStatus,
      watchStart,
      watchStop,
      setWatchStart,
      setWatchStop,
      vessels: assignedVessels,
      activeVesselId,
      activeVessel,
      selectVessel,
      now,
      logs,
      checklists,
      updateLog,
      toggleTask,
      saveRemark,
    }
  }, [currentRole, reviewStatus, watchStart, watchStop, logsByVessel, checklistsByVessel, activeVesselId, activeVessel, selectVessel, now, updateLog, toggleTask, saveRemark])

  return <EngineRoomContext.Provider value={value}>{children}</EngineRoomContext.Provider>
}
