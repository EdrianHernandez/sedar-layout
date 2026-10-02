import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SubmitActionFAB } from '../../components/chief-engineer/SubmitActionFAB'
import {
  assignedVessels,
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

  const handleSubmitted = useCallback(() => {
    onNotify('Engine logs and PMS checklist submitted to HQ successfully.')
  }, [onNotify])

  const outletContext: ChiefEngineerOutletContext = {
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

  const onHome = location.pathname.replace(/\/+$/, '') === '/chief-engineer'
  const dateLabel = now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
  const timeLabel = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

  return (
    <main className={`technical-dashboard ${onHome ? '' : 'pb-24'}`}>
      <header className="tech-dashboard-header">
        <div className="tech-header-text">
          <span className="tech-header-kicker">Chief Engineer Console</span>
          <h1>{activeVessel.name}</h1>
          <p>{activeVessel.imo} · Engine Room Watch Log</p>
        </div>
        <div className="tech-header-actions">
          <div className="rounded-md border border-[#d4d4d4] bg-white px-4 py-2 text-right">
            <span className="block text-[11px] font-bold uppercase tracking-[.14em] text-[#5f6873]">{dateLabel}</span>
            <strong className="block text-base font-bold tabular-nums leading-tight text-[#111820]">{timeLabel}</strong>
          </div>
        </div>
      </header>

      <Outlet context={outletContext} />

      {!onHome && <SubmitActionFAB onSubmitted={handleSubmitted} />}
    </main>
  )
}
