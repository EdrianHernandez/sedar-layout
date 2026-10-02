import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { DailyEngineMonitorCard } from '../../components/chief-engineer/DailyEngineMonitorCard'
import type { EngineId } from '../../types/engineLog'
import { useChiefEngineer } from './chiefEngineerOutlet'

export function ChiefEngineerMonitoringPage() {
  const { activeVessel, now, logs, updateLog } = useChiefEngineer()
  const [engineId, setEngineId] = useState<EngineId>('ME-PORT')
  const log = logs.find((item) => item.engineId === engineId) ?? logs[0]

  return (
    <>
      <div className="tech-dashboard-header">
        <div className="tech-header-text">
          <span className="tech-header-kicker">Chief Engineer Console · Daily Operations</span>
          <h1>Daily Engine Monitoring</h1>
          <p>{activeVessel.name} · Capture start/stop times and watch parameters.</p>
        </div>
        <div className="tech-header-actions">
          <Link to="/chief-engineer" className="button button-secondary button-lg">
            <ArrowLeft size={15} aria-hidden="true" /> Back to Console
          </Link>
        </div>
      </div>

      <DailyEngineMonitorCard log={log} now={now} onEngineChange={setEngineId} onUpdate={updateLog} />
    </>
  )
}
