const date=new Intl.DateTimeFormat('en-PH',{month:'short',day:'numeric',year:'numeric'})
export const formatReportDate=(value?:string)=>value&&!Number.isNaN(Date.parse(value))?date.format(new Date(value)):'Not available'
export const formatDateRange=(from:string,to:string)=>`${formatReportDate(`${from}T00:00:00`)} – ${formatReportDate(`${to}T00:00:00`)}`
export const formatPercentage=(value:number)=>Number.isFinite(value)?`${value.toFixed(1)}%`:'0.0%'
export const formatDuration=(minutes:number)=>minutes>=60?`${Math.floor(minutes/60)}h ${minutes%60}m`:`${minutes} min`
export function calculatePeriodComparison(current:number,previous:number){if(previous===0)return{change:null,label:current>0?'New activity':'No change',direction:'neutral' as const};const change=((current-previous)/Math.abs(previous))*100;return{change,label:`${change>=0?'+':''}${change.toFixed(1)}% from previous period`,direction:change>0?'up' as const:change<0?'down' as const:'neutral' as const}}
