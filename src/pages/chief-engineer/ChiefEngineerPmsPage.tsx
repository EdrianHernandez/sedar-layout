import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PMSTaskManager } from '../../components/chief-engineer/PMSTaskManager'
import { consoleTitle } from '../../data/chiefEngineerMockData'
import { useChiefEngineer } from './chiefEngineerOutlet'

export function ChiefEngineerPmsPage() {
  const { activeVessel, checklists, toggleTask, saveRemark } = useChiefEngineer()

  return (
    <>
      <div className="tech-dashboard-header">
        <div className="tech-header-text">
          <span className="tech-header-kicker">{consoleTitle} · Planned Maintenance</span>
          <h1>PMS Checklist</h1>
          <p>{activeVessel.name} · Complete interval tasks and report defects.</p>
        </div>
        <div className="tech-header-actions">
          <Link to="/chief-engineer" className="button button-secondary button-lg">
            <ArrowLeft size={15} aria-hidden="true" /> Back to Console
          </Link>
        </div>
      </div>

      <PMSTaskManager checklists={checklists} onToggleTask={toggleTask} onSaveRemark={saveRemark} />
    </>
  )
}
