import { useCallback, useEffect, useState } from 'react'
import { Camera, Check, CheckCheck, ClipboardPen, Paperclip, X } from 'lucide-react'
import type { PMSInterval, PMSChecklist, PMSTask } from '../../types/pmsChecklist'
import { PMS_INTERVALS } from '../../data/chiefEngineerMockData'

interface PMSTaskManagerProps {
  checklists: PMSChecklist[]
  onToggleTask: (checklistId: string, taskId: string) => void
  onSaveRemark: (checklistId: string, taskId: string, remark: string, hasPhoto: boolean) => void
}

interface RemarkDrawerProps {
  task: PMSTask
  onSave: (remark: string, hasPhoto: boolean) => void
  onClose: () => void
}

function RemarkDrawer({ task, onSave, onClose }: RemarkDrawerProps) {
  const [remark, setRemark] = useState(task.remark ?? '')
  const [hasPhoto, setHasPhoto] = useState(task.hasPhoto ?? false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="remark-drawer-title">
      <button type="button" aria-label="Close remark drawer" onClick={onClose} className="absolute inset-0 bg-[rgba(3,15,29,.55)]" />
      <aside className="relative flex h-full w-full max-w-md flex-col bg-white shadow-[-12px_0_36px_rgba(0,0,0,.2)]">
        <header className="flex items-center justify-between gap-3 border-b border-[#ddd] px-4 py-4">
          <div className="min-w-0">
            <span className="tech-header-kicker">Defect Reporting</span>
            <h3 id="remark-drawer-title" className="truncate text-base font-bold text-[#152f48]">Remarks / Photo</h3>
          </div>
          <button
            type="button"
            aria-label="Close remark drawer"
            onClick={onClose}
            className="grid size-11 shrink-0 place-items-center rounded-md border border-[#ccd3d8] bg-white text-[#576775] transition hover:bg-[#f4f6f7]"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <p className="rounded-lg border border-[#e2e7ea] bg-[#f9fafb] p-3 text-sm font-bold leading-relaxed text-[#465560]">
            {task.label}
          </p>

          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#5f6873]">Remarks</span>
            <textarea
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              rows={7}
              placeholder="Describe defect, finding, or follow-up action…"
              className="w-full resize-none rounded-md border border-[#cdd3d8] bg-white p-3 text-sm font-medium text-[#293b4a] outline-none placeholder:text-[#a4abb1] focus:border-[#4b718f]"
            />
          </label>

          <button
            type="button"
            onClick={() => setHasPhoto((value) => !value)}
            aria-pressed={hasPhoto}
            className={`flex min-h-16 items-center justify-center gap-3 rounded-lg border text-sm font-bold uppercase tracking-wider transition ${
              hasPhoto
                ? 'border-[#a8d9bc] bg-[#d9f1e3] text-[#116437]'
                : 'border-[#cdd3d8] bg-white text-[#283746] hover:bg-[#f4f6f7]'
            }`}
          >
            {hasPhoto ? <Paperclip size={20} aria-hidden="true" /> : <Camera size={20} aria-hidden="true" />}
            {hasPhoto ? 'Photo Attached (1)' : 'Attach Photo'}
          </button>
        </div>

        <footer className="flex gap-3 border-t border-[#ddd] bg-[#fafafa] p-4">
          <button type="button" onClick={onClose} className="button button-secondary button-lg flex-1">
            Cancel
          </button>
          <button type="button" onClick={() => onSave(remark.trim(), hasPhoto)} className="button button-primary button-lg flex-[2]">
            Save Report
          </button>
        </footer>
      </aside>
    </div>
  )
}

export function PMSTaskManager({ checklists, onToggleTask, onSaveRemark }: PMSTaskManagerProps) {
  const [activeInterval, setActiveInterval] = useState<PMSInterval>(PMS_INTERVALS[0])
  const [openTask, setOpenTask] = useState<PMSTask | null>(null)

  const closeDrawer = useCallback(() => setOpenTask(null), [])

  const checklist = checklists.find((item) => item.interval === activeInterval)
  const doneCount = checklist ? checklist.tasks.filter((task) => task.isDone).length : 0
  const total = checklist ? checklist.tasks.length : 0
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0
  const activeTask = openTask && checklist ? checklist.tasks.find((task) => task.id === openTask.id) ?? null : null

  return (
    <section className="tech-panel" aria-labelledby="pms-title">
      <header className="tech-panel-header">
        <div>
          <h2 id="pms-title">PMS Task Manager</h2>
          <p>Planned maintenance intervals · engine running hours</p>
        </div>
        {checklist?.isDone && (
          <span className="tech-status-badge tech-status-completed inline-flex items-center gap-1.5">
            <CheckCheck size={13} aria-hidden="true" /> Signed Off
          </span>
        )}
      </header>

      <div className="grid gap-4 p-4 sm:p-5">
        <div className="profile-tabs" role="tablist" aria-label="Maintenance intervals">
          {PMS_INTERVALS.map((interval) => {
            const active = interval === activeInterval
            const list = checklists.find((item) => item.interval === interval)
            const complete = list?.isDone ?? false
            return (
              <button
                key={interval}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveInterval(interval)}
                className={active ? 'active flex items-center justify-center gap-2' : 'flex items-center justify-center gap-2'}
              >
                [{interval.slice(0, -1)} HRS]
                {complete && <Check size={15} strokeWidth={4} aria-hidden="true" />}
              </button>
            )
          })}
        </div>

        {checklist && (
          <div role="tabpanel" aria-label={`${activeInterval} maintenance checklist`} className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e2e7ea] bg-[#f9fafb] px-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold uppercase tracking-widest text-[#526675]">{checklist.engineScope}</p>
                <p className="mt-0.5 text-xs font-medium text-[#7c8994]">Interval {checklist.interval} · engine hours</p>
              </div>
              <span className="tech-status-badge tech-status-completed shrink-0">{doneCount}/{total} DONE</span>
            </div>
            <div className="h-4 overflow-hidden rounded-full border border-[#d4d4d4] bg-[#eceff1]">
              <div className="h-full rounded-full bg-[#20a05a] transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>

            <ul className="grid gap-3">
              {checklist.tasks.map((task) => (
                <li key={task.id} className="flex items-stretch gap-2">
                  <button
                    type="button"
                    aria-pressed={task.isDone}
                    onClick={() => onToggleTask(checklist.id, task.id)}
                    className={`flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-lg px-3 text-left text-sm font-bold leading-tight transition ${
                      task.isDone
                        ? 'border border-[#a8d9bc] bg-[#d9f1e3] text-[#116437]'
                        : 'border border-[#cdd3d8] bg-[#edf0f2] text-[#4f5d68] hover:border-[#b8c0c7]'
                    }`}
                  >
                    <span className={`grid size-8 shrink-0 place-items-center rounded border ${task.isDone ? 'border-[#177342] bg-[#177342] text-white' : 'border-[#b8c0c7] bg-white text-transparent'}`}>
                      <Check size={18} strokeWidth={4} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">{task.label}</span>
                    <span className={`hidden shrink-0 text-[9px] font-bold tracking-widest sm:block ${task.isDone ? 'text-[#116437]/70' : 'text-[#7c8994]'}`}>
                      {task.isDone ? 'DONE' : 'PENDING'}
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Remarks and photo for: ${task.label}`}
                    onClick={() => setOpenTask(task)}
                    className={`grid size-14 shrink-0 place-items-center rounded-lg border transition ${
                      task.remark || task.hasPhoto
                        ? 'border-[#efd181] bg-[#fff0bd] text-[#775000]'
                        : 'border-[#cdd3d8] bg-white text-[#526475] hover:bg-[#f4f6f7]'
                    }`}
                  >
                    {task.remark || task.hasPhoto ? <ClipboardPen size={22} strokeWidth={2.5} /> : <Camera size={22} strokeWidth={2.5} />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {activeTask && checklist && (
        <RemarkDrawer
          task={activeTask}
          onClose={closeDrawer}
          onSave={(remark, hasPhoto) => {
            onSaveRemark(checklist.id, activeTask.id, remark, hasPhoto)
            closeDrawer()
          }}
        />
      )}
    </section>
  )
}
