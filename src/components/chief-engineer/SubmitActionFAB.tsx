import { useEffect, useRef, useState } from 'react'
import { CircleCheckBig, Loader2, RadioTower } from 'lucide-react'

interface SubmitActionFABProps {
  onSubmitted: () => void
}

type SubmitState = 'idle' | 'submitting' | 'success'

export function SubmitActionFAB({ onSubmitted }: SubmitActionFABProps) {
  const [state, setState] = useState<SubmitState>('idle')
  const timersRef = useRef<number[]>([])

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  const handleSubmit = () => {
    if (state !== 'idle') return
    setState('submitting')
    const submitTimer = window.setTimeout(() => {
      setState('success')
      onSubmitted()
      const resetTimer = window.setTimeout(() => setState('idle'), 3200)
      timersRef.current.push(resetTimer)
    }, 1800)
    timersRef.current.push(submitTimer)
  }

  const tone =
    state === 'success'
      ? 'border-[#0f5132] bg-[#116437] text-white'
      : 'border-[#e94227] bg-[#ff4d2f] text-white hover:bg-[#e94227]'

  return (
    <div
      className={`fixed inset-x-4 z-40 flex justify-center transition-all md:left-auto md:right-8 md:justify-end ${
        state === 'success' ? 'bottom-28' : 'bottom-5'
      }`}
    >
      <button
        type="button"
        onClick={handleSubmit}
        disabled={state === 'submitting'}
        aria-live="polite"
        className={`flex min-h-16 w-full max-w-xl items-center justify-center gap-3 rounded-[10px] border px-6 text-base font-bold uppercase tracking-[.1em] shadow-[0_10px_28px_rgba(6,29,55,.18)] transition active:translate-y-0.5 md:w-[26rem] md:text-lg ${tone} ${state === 'submitting' ? 'cursor-wait opacity-80' : ''}`}
      >
        {state === 'submitting' && <Loader2 size={24} className="animate-spin" aria-hidden="true" />}
        {state === 'success' && <CircleCheckBig size={24} strokeWidth={2.5} aria-hidden="true" />}
        {state === 'idle' && <RadioTower size={24} strokeWidth={2.5} aria-hidden="true" />}
        <span>
          {state === 'submitting' ? 'Syncing to HQ…' : state === 'success' ? 'Logs Synced ✓' : 'Submit Logs to HQ'}
        </span>
      </button>
    </div>
  )
}
