import { Link } from 'react-router-dom'
import { ArrowLeft, ClipboardList } from 'lucide-react'
import { consoleTitle } from '../../data/chiefEngineerMockData'
import { useChiefEngineer } from './chiefEngineerOutlet'

type PmsHistoryScope = 'Main Engine' | 'Transmission' | 'Generator'

interface ChiefEngineerPmsHistoryPageProps {
  scope: PmsHistoryScope
}

export function ChiefEngineerPmsHistoryPage({ scope }: ChiefEngineerPmsHistoryPageProps) {
  const { activeVessel } = useChiefEngineer()

  return (
    <>
      <div className="tech-dashboard-header">
        <div className="tech-header-text">
          <span className="tech-header-kicker">{consoleTitle} · PMS History</span>
          <h1>PMS History: {scope}</h1>
          <p>{activeVessel.name}</p>
        </div>
        <div className="tech-header-actions">
          <Link to="/chief-engineer" className="button button-secondary button-lg">
            <ArrowLeft size={15} aria-hidden="true" /> Back to Console
          </Link>
        </div>
      </div>

      <section className="flex flex-col items-center gap-4 rounded-[10px] border border-slate-200 bg-white px-6 py-16 text-center">
        <span className="grid size-14 place-items-center rounded-[10px] bg-[#f2f5f8] text-[#315d82]">
          <ClipboardList size={26} aria-hidden="true" />
        </span>
        <strong className="text-base text-slate-900">No records yet</strong>
        <p className="max-w-md text-sm leading-relaxed text-slate-600">
          Verified {scope} PMS checklists will appear here once submitted by the engineering team.
        </p>
        <Link to="/chief-engineer/pms" className="button button-primary button-lg">
          OPEN PMS CHECKLIST
        </Link>
      </section>
    </>
  )
}
