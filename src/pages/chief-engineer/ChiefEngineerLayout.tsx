import { Outlet, useLocation } from 'react-router-dom'
import { consoleTitle } from '../../data/chiefEngineerMockData'
import { useEngineRoom } from '../../context/engineRoomStore'
import type { ChiefEngineerOutletContext } from './chiefEngineerOutlet'

interface ChiefEngineerLayoutProps {
  onNotify: (message: string) => void
}

export function ChiefEngineerLayout({ onNotify }: ChiefEngineerLayoutProps) {
  const location = useLocation()
  const {
    vessels,
    activeVesselId,
    activeVessel,
    selectVessel,
    now,
    logs,
    checklists,
    updateLog,
    toggleTask,
    saveRemark,
  } = useEngineRoom()

  const outletContext: ChiefEngineerOutletContext = {
    vessels,
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
