import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, CircleCheckBig, Eye, Loader2, Send, Undo2 } from 'lucide-react'
import { DailyEngineMonitorCard } from '../../components/chief-engineer/DailyEngineMonitorCard'
import { DailyLogSummary } from '../../components/chief-engineer/DailyLogSummary'
import { consoleTitle } from '../../data/chiefEngineerMockData'
import { useEngineRoom, type EngineRole } from '../../context/engineRoomStore'
import type { EngineId, WatchLogReviewStatus } from '../../types/engineLog'
import { useChiefEngineer } from './chiefEngineerOutlet'
import { formatWatchWindow } from '../../utils/engineLog'

interface ChiefEngineerMonitoringPageProps {
  currentRole: EngineRole
  reviewStatus: WatchLogReviewStatus
  onReviewStatusChange: (status: WatchLogReviewStatus) => void
}

type ViewMode = 'edit' | 'review'

const DISABLED_CLS = 'disabled:cursor-not-allowed disabled:opacity-60'

export function ChiefEngineerMonitoringPage({ currentRole, reviewStatus, onReviewStatusChange }: ChiefEngineerMonitoringPageProps) {
  const { activeVessel, logs, updateLog, notify, now } = useChiefEngineer()
  const { watchStart, watchStop } = useEngineRoom()
  const [engineId, setEngineId] = useState<EngineId>('ME-PORT')
  const [isWorking, setIsWorking] = useState(false)
  const [stopError, setStopError] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => (reviewStatus === 'approved' ? 'review' : 'edit'))
  const timersRef = useRef<number[]>([])
  const log = logs.find((item) => item.engineId === engineId) ?? logs[0]
  const dateLabel = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const windowLabel = formatWatchWindow(watchStart, watchStop)

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const runAction = (target: WatchLogReviewStatus, message: string, onDone?: () => void) => {
    if (isWorking) return
    setIsWorking(true)
    const timer = window.setTimeout(() => {
      onReviewStatusChange(target)
      notify(message)
      setIsWorking(false)
      onDone?.()
    }, 1800)
    timersRef.current.push(timer)
  }

  // Validation gate: an open-ended log cannot enter Review mode — WATCH STOP (cut-off) is mandatory.
  // TODO (cross-check): flag when (watchStop − watchStart) does not roughly match "Hours for this Watch".
  const handleReview = () => {
    if (!watchStop) {
      setStopError(true)
      notify('Watch stop (cut-off) time is required before opening the review.')
      return
    }
    setStopError(false)
    setViewMode('review')
  }

  const handleConfirmAndSubmit = () => {
    if (!watchStop) {
      setStopError(true)
      setViewMode('edit')
      notify('Watch stop (cut-off) time is required before submitting the log.')
      return
    }
    runAction('pending', 'Watch log submitted to Chief Engineer for approval.', () => setViewMode('edit'))
  }

  const isChief = currentRole === 'Chief Engineer'
  const isReadOnly = reviewStatus === 'pending' || reviewStatus === 'approved'
  // Approved logs always open the review view (A4 print prep), no matter what mode was stored.
  const isReviewing = viewMode === 'review' || reviewStatus === 'approved'
  const isEditable = reviewStatus === 'draft' || reviewStatus === 'returned'

  let primaryAction: React.ReactNode
  if (isReviewing) {
    // TODO (Print layout): "APPROVE, SAVE & PRINT" (and viewing an approved log) should render
    // DailyLogSummary as a printable A4 sheet with signature blocks at the bottom:
    // Prepared by: [Name], Approved by: [Name]. See the comment inside DailyLogSummary.
    primaryAction = (
      <>
        {reviewStatus !== 'approved' && (
          <button
            type="button"
            className="button button-secondary button-lg"
            onClick={() => setViewMode('edit')}
            title="Return to the form to fix mistakes"
          >
            <ArrowLeft size={15} aria-hidden="true" /> BACK TO EDIT
          </button>
        )}
        {isEditable && isChief && (
          <button
            type="button"
            onClick={() => runAction('approved', 'Watch log approved and saved for print.')}
            disabled={isWorking}
            aria-live="polite"
            title="Approve, save and prepare the watch log for printing"
            className={`button button-success button-lg ${DISABLED_CLS} ${isWorking ? 'cursor-wait opacity-80' : ''}`}
          >
            {isWorking ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <CircleCheckBig size={15} strokeWidth={2.5} aria-hidden="true" />}
            {isWorking ? 'APPROVING…' : 'APPROVE, SAVE & PRINT'}
          </button>
        )}
        {isEditable && !isChief && (
          <button
            type="button"
            onClick={handleConfirmAndSubmit}
            disabled={isWorking}
            aria-live="polite"
            title="Confirm this log and submit it to the Chief Engineer"
            className={`button button-primary button-lg ${DISABLED_CLS} ${isWorking ? 'cursor-wait opacity-80' : ''}`}
          >
            {isWorking ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Send size={15} strokeWidth={2.5} aria-hidden="true" />}
            {isWorking ? 'SUBMITTING…' : 'CONFIRM & SUBMIT TO CHIEF'}
          </button>
        )}
        {reviewStatus === 'approved' && (
          <button type="button" disabled className={`button button-success button-lg ${DISABLED_CLS}`} aria-live="polite">
            <CircleCheckBig size={15} strokeWidth={2.5} aria-hidden="true" /> APPROVED ✓
          </button>
        )}
      </>
    )
  } else if (isEditable) {
    primaryAction = (
      <button
        type="button"
        onClick={handleReview}
        title="Review all entries before final submission"
        className="button button-review button-lg"
      >
        <Eye size={15} aria-hidden="true" /> REVIEW LOG
      </button>
    )
  } else if (isChief && reviewStatus === 'pending') {
    // Pending review (Chief Engineer): a Duty Engineer submitted this log (status 'pending'),
    // so the Chief reviews the read-only data and either approves it or returns it for correction.
    primaryAction = (
      <>
        <button
          type="button"
          onClick={() => runAction('approved', 'Watch log approved.')}
          disabled={isWorking}
          aria-live="polite"
          title="Approve the watch log submitted by the Duty Engineer"
          className={`button button-success button-lg ${DISABLED_CLS}`}
        >
          <CircleCheckBig size={15} strokeWidth={2.5} aria-hidden="true" /> APPROVE
        </button>
        <button
          type="button"
          onClick={() => runAction('returned', 'Watch log returned for correction.')}
          disabled={isWorking}
          aria-live="polite"
          title="Return the log to the Duty Engineer for correction"
          className={`button button-danger-outline button-lg ${DISABLED_CLS}`}
        >
          <Undo2 size={15} strokeWidth={2.5} aria-hidden="true" /> RETURN FOR CORRECTION
        </button>
      </>
    )
  } else if (reviewStatus === 'pending') {
    primaryAction = (
      <button type="button" disabled className={`button button-primary button-lg ${DISABLED_CLS}`} aria-live="polite">
        <CircleCheckBig size={15} strokeWidth={2.5} aria-hidden="true" /> SUBMITTED ✓
      </button>
    )
  } else {
    primaryAction = (
      <button type="button" disabled className={`button button-success button-lg ${DISABLED_CLS}`} aria-live="polite">
        <CircleCheckBig size={15} strokeWidth={2.5} aria-hidden="true" /> APPROVED ✓
      </button>
    )
  }

  return (
    <>
      <div className="tech-dashboard-header tech-header-centered sticky top-0 z-20 bg-white">
        <div className="tech-header-text">
          <span className="tech-header-kicker">
            {consoleTitle} · {currentRole} · {isReviewing ? 'Review & Confirmation' : 'Daily Operations'}
          </span>
          <h1>{isReviewing ? 'Review & Confirmation' : 'Daily Engine Monitoring'}</h1>
          <p>
            {isReviewing ? (
              <>
                {activeVessel.name} · {dateLabel} · Watch window:{' '}
                <strong className="font-bold text-slate-700">{windowLabel}</strong> · Verify all entries for typos before final
                submission.
              </>
            ) : (
              <>
                {activeVessel.name} · Capture running hour meter readings and watch parameters.
              </>
            )}
          </p>
        </div>
        <div className="tech-header-actions">
          {primaryAction}
        </div>
      </div>

      {isReviewing ? (
        <DailyLogSummary logs={logs} watchStart={watchStart} watchStop={watchStop} />
      ) : (
        <DailyEngineMonitorCard log={log} onEngineChange={setEngineId} onUpdate={updateLog} readOnly={isReadOnly} stopError={stopError} />
      )}
    </>
  )
}
