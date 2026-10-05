import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  assignedVessels,
  createInitialEngineLogs,
  createInitialPmsChecklists,
  defaultVesselId,
  PMS_INTERVAL_HOURS,
  robReceivedByVessel as robReceivedSeed,
} from '../data/chiefEngineerMockData'
import type { EngineLog, WatchLogReviewStatus } from '../types/engineLog'
import type { MasterRob } from '../data/chiefEngineerMockData'
import type { PMSChecklist, TaskCondition } from '../types/pmsChecklist'
import type { Vessel } from '../types/vessel'
import { displayMeterOf, isRoutineDue, pmsOdometer } from '../utils/engineLog'
import { EngineRoomContext, type EngineRoomContextValue, type WatchLogSignoff } from './engineRoomStore'

function buildByVessel<T>(create: (vessel: Vessel) => T[]): Record<string, T[]> {
  return Object.fromEntries(assignedVessels.map((vessel) => [vessel.id, create(vessel)]))
}

// Start a fresh execution cycle for a routine: tasks back to pending, sign-off cleared.
// completedOdometer is intentionally KEPT — it anchors the next due multiple (modulo).
function withFreshCycle(checklist: PMSChecklist): PMSChecklist {
  return {
    ...checklist,
    isDone: false,
    tasks: checklist.tasks.map((task) => ({
      ...task,
      condition: 'pending' as TaskCondition,
      findings: undefined,
      photoDataUrl: undefined,
    })),
  }
}

export function EngineRoomProvider({ children }: { children: React.ReactNode }) {
  const [activeVesselId, setActiveVesselId] = useState(defaultVesselId)
  const [logsByVessel, setLogsByVessel] = useState<Record<string, EngineLog[]>>(() => buildByVessel(createInitialEngineLogs))
  const [checklistsByVessel, setChecklistsByVessel] = useState<Record<string, PMSChecklist[]>>(() => buildByVessel(createInitialPmsChecklists))
  const [reviewStatus, setReviewStatus] = useState<WatchLogReviewStatus>('draft')
  // Vessel-level hydraulic oil (steering gear & winch), tracked per vessel like the engine logs.
  const [hydraulicOilByVessel, setHydraulicOilByVessel] = useState<Record<string, number>>(() =>
    Object.fromEntries(assignedVessels.map((vessel) => [vessel.id, 0])),
  )
  // Received during the watch (bunkering / drum deliveries) — feeds the R.O.B. received column.
  const [robReceivedByVessel, setRobReceivedByVessel] = useState<Record<string, MasterRob>>(robReceivedSeed)
  // Per-vessel sign-off record written by the kiosk two-step flow (details → Security Check PIN).
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

  const setRobReceived = useCallback(
    (field: keyof MasterRob, value: number) =>
      setRobReceivedByVessel((current) => ({
        ...current,
        [activeVesselId]: { ...(current[activeVesselId] ?? robReceivedSeed[activeVesselId]), [field]: value },
      })),
    [activeVesselId],
  )

  // Odometer writes happen ONLY here (reconciliation, status/time edits), so this is
  // the single choke point for the recurring cycle rollover: if this write crossed the
  // next multiple of a signed routine's interval, the routine is due again — start a
  // fresh execution cycle (tasks pending, sign-off cleared) while KEEPING
  // completedOdometer so the next due multiple advances. Identity-preserving (same
  // state object when nothing expired), so it can never cascade.
  const updateLog = useCallback(
    (updated: EngineLog) => {
      setLogsByVessel((current) => ({
        ...current,
        [activeVesselId]: (current[activeVesselId] ?? []).map((log) => (log.engineId === updated.engineId ? updated : log)),
      }))
      setChecklistsByVessel((current) => {
        const list = current[activeVesselId] ?? []
        const odometer = pmsOdometer(updated)
        let changed = false
        const next = list.map((checklist) => {
          if (checklist.engineId !== updated.engineId) return checklist
          if (!checklist.isDone || checklist.completedOdometer === undefined) return checklist
          if (!isRoutineDue(odometer, PMS_INTERVAL_HOURS[checklist.interval], checklist.completedOdometer)) return checklist
          changed = true
          return withFreshCycle(checklist)
        })
        if (!changed) return current
        return { ...current, [activeVesselId]: next }
      })
    },
    [activeVesselId],
  )

  const setTaskCondition = useCallback(
    (checklistId: string, taskId: string, condition: TaskCondition) => {
      setChecklistsByVessel((current) => ({
        ...current,
        [activeVesselId]: (current[activeVesselId] ?? []).map((checklist) => {
          if (checklist.id !== checklistId) return checklist
          return {
            ...checklist,
            tasks: checklist.tasks.map((task) => {
              if (task.id !== taskId) return task
              // Auto-timestamp fires only on the first pick (pending → resolved) so
              // later Done↔Issue switches and manual overrides keep their logged time.
              const loggedAt = task.condition === 'pending' ? task.loggedAt ?? new Date().toISOString() : task.loggedAt
              return condition === 'issue'
                ? { ...task, condition, loggedAt }
                : // Leaving (or never entering) the issue state discards defect data.
                  { ...task, condition, loggedAt, findings: undefined, photoDataUrl: undefined }
            }),
          }
        }),
      }))
    },
    [activeVesselId],
  )

  const setTaskIssue = useCallback(
    (checklistId: string, taskId: string, findings: string, photoDataUrl?: string) => {
      setChecklistsByVessel((current) => ({
        ...current,
        [activeVesselId]: (current[activeVesselId] ?? []).map((checklist) => {
          if (checklist.id !== checklistId) return checklist
          return {
            ...checklist,
            tasks: checklist.tasks.map((task) =>
              task.id === taskId
                ? { ...task, condition: 'issue' as TaskCondition, findings: findings || undefined, photoDataUrl: photoDataUrl || undefined }
                : task,
            ),
          }
        }),
      }))
    },
    [activeVesselId],
  )

  const setTaskLoggedAt = useCallback(
    (checklistId: string, taskId: string, loggedAt: string) => {
      setChecklistsByVessel((current) => ({
        ...current,
        [activeVesselId]: (current[activeVesselId] ?? []).map((checklist) => {
          if (checklist.id !== checklistId) return checklist
          return {
            ...checklist,
            tasks: checklist.tasks.map((task) => (task.id === taskId ? { ...task, loggedAt } : task)),
          }
        }),
      }))
    },
    [activeVesselId],
  )

  // Explicit sign-off. Snapshots the odometer (modulo anchor) and, for the master
  // 12,000-H Drydocking tier, resets the engine's odometer epoch: the lifetime-meter
  // base moves to the current display meter (odometer → 0) and every OTHER routine
  // for that engine starts a fresh cycle (old snapshots would be meaningless).
  const signoffChecklist = useCallback(
    (checklistId: string) => {
      const checklist = (checklistsByVessel[activeVesselId] ?? []).find((item) => item.id === checklistId)
      if (!checklist) return
      if (checklist.tasks.some((task) => task.condition === 'pending')) return
      const log = (logsByVessel[activeVesselId] ?? []).find((item) => item.engineId === checklist.engineId)
      if (!log) return
      const odometer = pmsOdometer(log)
      const isDrydock = checklist.interval === '12000H'
      const stamp = new Date().toISOString()

      setChecklistsByVessel((current) => ({
        ...current,
        [activeVesselId]: (current[activeVesselId] ?? []).map((item) => {
          if (item.id === checklistId) {
            return {
              ...item,
              isDone: true,
              completedAt: stamp,
              // Fresh epoch on drydock: anchor at 0 so the next drydock is due at 12,000 again.
              completedOdometer: isDrydock ? 0 : odometer,
            }
          }
          if (isDrydock && item.engineId === checklist.engineId) {
            // Fresh epoch for EVERY OTHER routine on this engine: old snapshots are
            // meaningless once the odometer returns to 0 (they would wrongly delay
            // the next cycle's due point).
            return { ...withFreshCycle(item), completedOdometer: undefined, completedAt: undefined }
          }
          return item
        }),
      }))

      if (isDrydock) {
        setLogsByVessel((current) => ({
          ...current,
          [activeVesselId]: (current[activeVesselId] ?? []).map((item) =>
            item.engineId === checklist.engineId ? { ...item, lastDrydockMeter: displayMeterOf(item) } : item,
          ),
        }))
      }
    },
    [activeVesselId, checklistsByVessel, logsByVessel],
  )

  const value = useMemo<EngineRoomContextValue>(() => {
    const logs = logsByVessel[activeVesselId] ?? []
    const checklists = checklistsByVessel[activeVesselId] ?? []
    return {
      reviewStatus,
      setReviewStatus,
      hydraulicOilAdded: hydraulicOilByVessel[activeVesselId] ?? 0,
      setHydraulicOilAdded,
      robReceived: robReceivedByVessel[activeVesselId] ?? robReceivedSeed[activeVesselId],
      setRobReceived,
      vessels: assignedVessels,
      activeVesselId,
      activeVessel,
      selectVessel,
      now,
      logs,
      checklists,
      updateLog,
      setTaskCondition,
      setTaskIssue,
      setTaskLoggedAt,
      signoffChecklist,
      signoff: signoffByVessel[activeVesselId] ?? null,
      setSignoff,
    }
  }, [reviewStatus, hydraulicOilByVessel, setHydraulicOilAdded, robReceivedByVessel, setRobReceived, logsByVessel, checklistsByVessel, activeVesselId, activeVessel, selectVessel, now, updateLog, setTaskCondition, setTaskIssue, setTaskLoggedAt, signoffChecklist, signoffByVessel, setSignoff])

  return <EngineRoomContext.Provider value={value}>{children}</EngineRoomContext.Provider>
}
