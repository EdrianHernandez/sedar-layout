import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { EngineRoomContext, type EngineRoomContextValue, type WatchLogSignoff } from './engineRoomStore'

function buildByVessel<T>(create: (vessel: Vessel) => T[]): Record<string, T[]> {
  return Object.fromEntries(assignedVessels.map((vessel) => [vessel.id, create(vessel)]))
}

export function EngineRoomProvider({ children }: { children: React.ReactNode }) {
  const [activeVesselId, setActiveVesselId] = useState(defaultVesselId)
  const [logsByVessel, setLogsByVessel] = useState<Record<string, EngineLog[]>>(() => buildByVessel(createInitialEngineLogs))
  const [checklistsByVessel, setChecklistsByVessel] = useState<Record<string, PMSChecklist[]>>(() => buildByVessel(createInitialPmsChecklists))
  const [reviewStatus, setReviewStatus] = useState<WatchLogReviewStatus>('draft')
  const [watchStart, setWatchStart] = useState(currentClockTime)
  const [watchStop, setWatchStop] = useState('')
  // Vessel-level hydraulic oil (steering gear & winch), tracked per vessel like the engine logs.
  const [hydraulicOilByVessel, setHydraulicOilByVessel] = useState<Record<string, number>>(() =>
    Object.fromEntries(assignedVessels.map((vessel) => [vessel.id, 0])),
  )
  // Per-vessel sign-off record written by the kiosk SUBMIT & LOCK flow (prepared/verified/PIN).
  const [signoffByVessel, setSignoffByVessel] = useState<Record<string, WatchLogSignoff>>({})
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(clock)
  }, [])

  const activeVessel = assignedVessels.find((vessel) => vessel.id === activeVesselId) ?? assignedVessels[0]

  const selectVessel = useCallback((vesselId: string) => setActiveVesselId(vesselId), [])

  const setSignoff = useCallback(
    (signoff: WatchLogSignoff) => setSignoffByVessel((current) => ({ ...current, [activeVesselId]: signoff })),
    [activeVesselId],
  )

  const setHydraulicOilAdded = useCallback(
    (value: number) => setHydraulicOilByVessel((current) => ({ ...current, [activeVesselId]: value })),
    [activeVesselId],
  )

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
      reviewStatus,
      setReviewStatus,
      watchStart,
      watchStop,
      setWatchStart,
      setWatchStop,
      hydraulicOilAdded: hydraulicOilByVessel[activeVesselId] ?? 0,
      setHydraulicOilAdded,
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
      signoff: signoffByVessel[activeVesselId] ?? null,
      setSignoff,
    }
  }, [reviewStatus, watchStart, watchStop, hydraulicOilByVessel, setHydraulicOilAdded, logsByVessel, checklistsByVessel, activeVesselId, activeVessel, selectVessel, now, updateLog, toggleTask, saveRemark, signoffByVessel, setSignoff])

  return <EngineRoomContext.Provider value={value}>{children}</EngineRoomContext.Provider>
}
