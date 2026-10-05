import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, CircleCheckBig, Eye, FileSignature, Loader2, Undo2 } from 'lucide-react'
import { DailyEngineMonitorCard } from '../../components/chief-engineer/DailyEngineMonitorCard'
import { DailyLogSummary } from '../../components/chief-engineer/DailyLogSummary'
import { WatchLogSignoffModal } from '../../components/chief-engineer/WatchLogSignoffModal'
import { consoleTitle, crewByVessel, masterRobByVessel, type MonitorTabId } from '../../data/chiefEngineerMockData'
import { useEngineRoom } from '../../context/engineRoomStore'
import type { WatchLogReviewStatus } from '../../types/engineLog'
import { useChiefEngineer } from './chiefEngineerOutlet'

interface ChiefEngineerMonitoringPageProps {
  reviewStatus: WatchLogReviewStatus
  onReviewStatusChange: (status: WatchLogReviewStatus) => void
}

type ViewMode = 'edit' | 'review'

const DISABLED_CLS = 'disabled:cursor-not-allowed disabled:opacity-60'

export function ChiefEngineerMonitoringPage({ reviewStatus, onReviewStatusChange }: ChiefEngineerMonitoringPageProps) {
  const { activeVessel, logs, updateLog, notify, now } = useChiefEngineer()
  const { hydraulicOilAdded, robReceived, signoff, setSignoff } = useEngineRoom()
  const [activeTab, setActiveTab] = useState<MonitorTabId>('ME-PORT')
  const [isWorking, setIsWorking] = useState(false)
  const [stopError, setStopError] = useState(false)
  const [signoffOpen, setSignoffOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => (reviewStatus === 'approved' ? 'review' : 'edit'))
  const timersRef = useRef<number[]>([])
  const log = (activeTab === 'VESSEL-FLUIDS' ? null : logs.find((item) => item.engineId === activeTab)) ?? logs[0]
  const dateLabel = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

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

  // Validation gate: an open-ended log cannot enter Review mode — every OPERATED engine needs
  // START and STOP (cut-off) times; standby / no-operation rows are never required. The Sign-off
  // modal is NOT raised here: the reviewer reads the whole summary first and opens it manually
  // via SIGN OFF & SUBMIT.
  const hasOpenOperatedLog = logs.some((item) => item.status === 'operated' && (!item.timeStart || !item.timeStop))
  const handleReview = () => {
    if (hasOpenOperatedLog) {
      setStopError(true)
      notify('Stop (cut-off) time is required for running engines before opening the review.')
      return
    }
    setStopError(false)
    setViewMode('review')
  }

  // The modal's two-step flow (Submit Report → Security Check) is the single final action: it
  // records the sign-off pair (plus optional handover remarks), then locks the log straight to
  // approved (no duty→chief hand-off).
  const handleSignoff = (preparedBy: string, remarks: string) => {
    if (isWorking) return
    const crew = crewByVessel[activeVessel.id]
    setSignoffOpen(false)
    setSignoff({
      preparedBy,
      verifiedBy: crew.chiefEngineer,
      signedAt: new Date().toISOString(),
      remarks: remarks.trim() || undefined,
    })
    runAction('approved', `Watch log signed by ${preparedBy}, verified by ${crew.chiefEngineer}, and locked.`)
  }

  const isReadOnly = reviewStatus === 'pending' || reviewStatus === 'approved'
  // Approved logs always open the review view (A4 print prep), no matter what mode was stored.
  const isReviewing = viewMode === 'review' || reviewStatus === 'approved'
  const isEditable = reviewStatus === 'draft' || reviewStatus === 'returned'

  let primaryAction: React.ReactNode
  if (isReviewing) {
    // TODO (Print layout): viewing an approved log should render DailyLogSummary as a printable
    // A4 sheet; the Prepared By / Verified By strip at its foot is populated from the sign-off
    // recorded by the Sign-off modal. See the comment inside DailyLogSummary.
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
        {isEditable && (
          <button
            type="button"
            onClick={() => setSignoffOpen(true)}
            disabled={isWorking}
            aria-live="polite"
            title="Open the sign-off sheet (prepared by, verified by) and submit with the chief's PIN"
            className={`button button-primary button-lg ${DISABLED_CLS} ${isWorking ? 'cursor-wait opacity-80' : ''}`}
          >
            {isWorking ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <FileSignature size={15} strokeWidth={2.5} aria-hidden="true" />}
            {isWorking ? 'LOCKING…' : 'SIGN OFF & SUBMIT'}
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
  } else if (reviewStatus === 'pending') {
    // Dormant legacy branch: nothing sets 'pending' in the kiosk flow, but approve/return
    // remains available should a log land in the pending state (e.g. from imported data).
    primaryAction = (
      <>
        <button
          type="button"
          onClick={() => runAction('approved', 'Watch log approved.')}
          disabled={isWorking}
          aria-live="polite"
          title="Approve the signed watch log"
          className={`button button-success button-lg ${DISABLED_CLS}`}
        >
          <CircleCheckBig size={15} strokeWidth={2.5} aria-hidden="true" /> APPROVE
        </button>
        <button
          type="button"
          onClick={() => runAction('returned', 'Watch log returned for correction.')}
          disabled={isWorking}
          aria-live="polite"
          title="Return the watch log for correction"
          className={`button button-danger-outline button-lg ${DISABLED_CLS}`}
        >
          <Undo2 size={15} strokeWidth={2.5} aria-hidden="true" /> RETURN FOR CORRECTION
        </button>
      </>
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
            {consoleTitle} · Shared Vessel Account · {isReviewing ? 'Review & Confirmation' : 'Daily Operations'}
          </span>
          <h1>{isReviewing ? 'Review & Confirmation' : 'Daily Engine Monitoring'}</h1>
          <p>
            {isReviewing ? (
              <>
                {activeVessel.name} · {dateLabel} · Verify all entries for typos before final submission.
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
        <DailyLogSummary
          logs={logs}
          hydraulicOilAdded={hydraulicOilAdded}
          masterRob={masterRobByVessel[activeVessel.id]}
          robReceived={robReceived}
          signoff={signoff}
        />
      ) : (
        <DailyEngineMonitorCard
          log={log}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onUpdate={updateLog}
          readOnly={isReadOnly}
          stopError={stopError}
        />
      )}

      {signoffOpen && (
        <WatchLogSignoffModal onClose={() => setSignoffOpen(false)} onSubmit={handleSignoff} />
      )}
    </>
  )
}
