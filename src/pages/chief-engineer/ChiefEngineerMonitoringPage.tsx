import { useEffect, useRef, useState } from 'react'
import { CircleCheckBig, Loader2, Printer, RadioTower } from 'lucide-react'
import { DailyEngineMonitorCard } from '../../components/chief-engineer/DailyEngineMonitorCard'
import { consoleTitle } from '../../data/chiefEngineerMockData'
import type { EngineId } from '../../types/engineLog'
import { useChiefEngineer } from './chiefEngineerOutlet'

type SubmitState = 'idle' | 'submitting' | 'success'

export function ChiefEngineerMonitoringPage() {
  const { activeVessel, logs, updateLog, notify } = useChiefEngineer()
  const [engineId, setEngineId] = useState<EngineId>('ME-PORT')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const timersRef = useRef<number[]>([])
  const log = logs.find((item) => item.engineId === engineId) ?? logs[0]

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const handleSubmit = () => {
    if (submitState !== 'idle') return
    setSubmitState('submitting')
    const submitTimer = window.setTimeout(() => {
      setSubmitState('success')
      notify('Watch log submitted for approval.')
      const resetTimer = window.setTimeout(() => setSubmitState('idle'), 3200)
      timersRef.current.push(resetTimer)
    }, 1800)
    timersRef.current.push(submitTimer)
  }

  const submitLabel =
    submitState === 'submitting' ? 'SUBMITTING…' : submitState === 'success' ? 'SUBMITTED ✓' : 'SUBMIT FOR APPROVAL'

  return (
    <>
      <div className="tech-dashboard-header tech-header-centered sticky top-0 z-20 bg-white">
        <div className="tech-header-text">
          <span className="tech-header-kicker">{consoleTitle} · Daily Operations</span>
          <h1>Daily Engine Monitoring</h1>
          <p>{activeVessel.name} · Capture running hour meter readings and watch parameters.</p>
        </div>
        <div className="tech-header-actions">
          {/* TODO: generates an auto-filled physical watch log form based on the current state data. */}
          <button
            type="button"
            className="button button-secondary button-lg"
            title="Generates an auto-filled physical form from the current state data"
            onClick={() => notify('Print Watch Log will be implemented later.')}
          >
            <Printer size={15} aria-hidden="true" /> PRINT WATCH LOG
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitState === 'submitting'}
            aria-live="polite"
            className={`button button-primary button-lg ${submitState === 'submitting' ? 'cursor-wait opacity-80' : ''}`}
            style={submitState === 'success' ? { background: '#116437', borderColor: '#0f5132' } : undefined}
          >
            {submitState === 'submitting' && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
            {submitState === 'success' && <CircleCheckBig size={15} strokeWidth={2.5} aria-hidden="true" />}
            {submitState === 'idle' && <RadioTower size={15} strokeWidth={2.5} aria-hidden="true" />}
            {submitLabel}
          </button>
        </div>
      </div>

      <DailyEngineMonitorCard log={log} onEngineChange={setEngineId} onUpdate={updateLog} />
    </>
  )
}
