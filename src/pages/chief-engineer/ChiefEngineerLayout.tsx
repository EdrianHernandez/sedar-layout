import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import {
  assignedVessels,
  consoleTitle,
  createInitialEngineLogs,
  createInitialPmsChecklists,
  defaultVesselId,
} from '../../data/chiefEngineerMockData'
import type { EngineLog } from '../../types/engineLog'
import type { PMSChecklist } from '../../types/pmsChecklist'
import type { Vessel } from '../../types/vessel'
import type { ChiefEngineerOutletContext } from './chiefEngineerOutlet'

interface ChiefEngineerLayoutProps {
  onNotify: (message: string) => void
}

function buildByVessel<T>(create: (vessel: Vessel) => T[]): Record<string, T[]> {
  return Object.fromEntries(assignedVessels.map((vessel) => [vessel.id, create(vessel)]))
}

export function ChiefEngineerLayout({ onNotify }: ChiefEngineerLayoutProps) {
  const location = useLocation()
  const [activeVesselId, setActiveVesselId] = useState(defaultVesselId)
  const [logsByVessel, setLogsByVessel] = useState<Record<string, EngineLog[]>>(() => buildByVessel(createInitialEngineLogs))
  const [checklistsByVessel, setChecklistsByVessel] = useState<Record<string, PMSChecklist[]>>(() => buildByVessel(createInitialPmsChecklists))
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const clock = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(clock)
  }, [])

  const activeVessel = assignedVessels.find((vessel) => vessel.id === activeVesselId) ?? assignedVessels[0]
  const logs = logsByVessel[activeVesselId] ?? []
  const checklists = checklistsByVessel[activeVesselId] ?? []

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

  const outletContext: ChiefEngineerOutletContext = {
    vessels: assignedVessels,
    activeVesselId,
    activeVessel,
    selectVessel,
    now,
    notify: onNotify,
    logs,
    checklists,
    updateLog,
    toggleTask,
    saveRemark,
  }

  const path = location.pathname.replace(/\/+$/, '')
  const onHome = path === '/chief-engineer'
  const dateLabel = now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
  const timeLabel = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

  return (
    <main className="technical-dashboard">
      {onHome && (
        <header className="tech-dashboard-header">
          <div className="tech-header-text">
            <span className="tech-header-kicker">{consoleTitle}</span>
            <h1>{activeVessel.name}</h1>
          </div>
          <div className="tech-header-actions">
            <div className="text-right">
              <span className="block text-[11px] font-bold uppercase tracking-[.14em] text-[#5f6873]">{dateLabel}</span>
              <strong className="block text-3xl font-bold tabular-nums leading-tight text-[#152f48]">{timeLabel}</strong>
            </div>
          </div>
        </header>
      )}

      <Outlet context={outletContext} />
    </main>
  )
}
