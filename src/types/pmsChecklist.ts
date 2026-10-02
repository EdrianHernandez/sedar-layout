export type PMSInterval = '250H' | '500H' | '1000H' | '6000H'

export interface PMSTask {
  id: string
  label: string
  isDone: boolean
  remark?: string
  hasPhoto?: boolean
}

export interface PMSChecklist {
  id: string
  interval: PMSInterval
  engineScope: string
  tasks: PMSTask[]
  isDone: boolean
}
