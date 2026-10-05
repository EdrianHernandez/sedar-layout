import { jsPDF } from 'jspdf'
import autoTable, { type CellDef, type RowInput } from 'jspdf-autotable'
import type { EngineLog, EngineStatus } from '../types/engineLog'
import type { MasterRob } from '../data/chiefEngineerMockData'
import { computeRunningHours, formatTimeOnly, fuelConsumedBy } from './engineLog'

// Dynamic Daily Engine Log PDF (Download-Before-Submit compliance). Landscape A4, strictly
// ONE page: compact fixed styling sized against the page budget, a dynamic scale retry if a
// render ever overflows, and a remarks clamp so long notes can never push a page break.
// Layout mirrors the on-screen review summary — two-tier grouped headers (OPERATIONS /
// FUEL OIL / ADDED FLUIDS / PARAMETERS), subtotal rows, Vessel R.O.B., remarks and a
// 2-column signature block — and reuses the SAME shared helpers (fuelConsumedBy /
// computeRunningHours / formatTimeOnly) so printed figures can never diverge from the form.

export interface DailyEngineLogPdfData {
  vesselName: string
  logDate: string
  logs: EngineLog[]
  masterRob: MasterRob
  robReceived: MasterRob
  hydraulicOilAdded: number
  preparedBy: string
  verifiedBy: string
  remarks: string
}

const STATUS_LABEL: Record<EngineStatus, string> = {
  operated: 'Operated',
  'no-operation': 'No Operation',
  standby: 'Standby',
}

const NAVY: [number, number, number] = [21, 47, 72]
const INK: [number, number, number] = [40, 55, 70]
const MUTED: [number, number, number] = [95, 104, 115]
const LINE: [number, number, number] = [210, 220, 230]
const HEAD_LIGHT: [number, number, number] = [232, 238, 244]
const GROUP_RULE: [number, number, number] = [148, 163, 184]

const MARGIN = 10
const BOTTOM_LIMIT = 200 // 210 − 10: hard content floor (footer sits at pageH − 6).
const SCALE_STEPS = [1, 0.92, 0.85]

// Columns where a grouped super-header begins (left rule mirrors the UI's border-l dividers).
const GROUP_START_COLS = new Set([2, 5, 8, 10])

interface LogTotals {
  consumed: number
  lube: number
  fw: number
}

function totalsOf(rows: EngineLog[]): LogTotals {
  return {
    consumed: rows.reduce((sum, log) => sum + fuelConsumedBy(log), 0),
    lube: rows.reduce((sum, log) => sum + log.lubeOilAdded, 0),
    fw: rows.reduce((sum, log) => sum + log.fwCoolantAdded, 0),
  }
}

function engineRow(log: EngineLog): RowInput {
  return [
    log.label,
    STATUS_LABEL[log.status],
    formatTimeOnly(log.timeStart),
    formatTimeOnly(log.timeStop, log.timeStart ? 'ongoing' : '—'),
    (computeRunningHours(log) ?? 0).toFixed(1),
    log.fuelRobStart.toLocaleString(),
    log.fuelRobStop.toLocaleString(),
    fuelConsumedBy(log).toLocaleString(),
    log.lubeOilAdded.toLocaleString(),
    log.fwCoolantAdded.toLocaleString(),
    String(log.rpm),
    log.oilPressure.toFixed(1),
    String(log.waterTemp),
  ]
}

// Subtotal row mirrors the review tfoot: label across the identity/time columns, then the
// consumable sums (Running Hours is intentionally never summed across engines).
function subtotalRow(label: string, totals: LogTotals): RowInput {
  return [
    { content: label, colSpan: 5, styles: { halign: 'left', fontStyle: 'bold' } },
    { content: '', styles: { fontStyle: 'bold' } },
    { content: '', styles: { fontStyle: 'bold' } },
    { content: totals.consumed.toLocaleString(), styles: { fontStyle: 'bold', halign: 'right' } },
    { content: totals.lube.toLocaleString(), styles: { fontStyle: 'bold', halign: 'right' } },
    { content: totals.fw.toLocaleString(), styles: { fontStyle: 'bold', halign: 'right' } },
    { content: '' }, { content: '' }, { content: '' },
  ]
}

// Two-tier header exactly as grouped in the UI: row 1 = identity (rowSpan 2) + super-headers
// (colSpan); row 2 = the sub-headers with units.
function engineHead(s: number): RowInput[] {
  const tier1 = (content: string, colSpan?: number, rowSpan?: number): CellDef => ({
    content,
    ...(colSpan !== undefined ? { colSpan } : {}),
    ...(rowSpan !== undefined ? { rowSpan } : {}),
    styles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', valign: 'middle', fontSize: 6.5 * s },
  })
  return [
    [
      tier1('Engine', undefined, 2),
      tier1('Status', undefined, 2),
      tier1('OPERATIONS', 3),
      tier1('FUEL OIL', 3),
      tier1('ADDED FLUIDS', 2),
      tier1('PARAMETERS', 3),
    ],
    ['Start', 'Stop', 'Total (h)', 'Start (L)', 'Stop (L)', 'Consumed (L)', 'L.O. (L)', 'F.W./C. (L)', 'RPM', 'Oil (bar)', 'Water (°C)'],
  ]
}

function renderDailyEngineLogPdf(data: DailyEngineLogPdfData, scale: number): jsPDF {
  const s = scale
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const contentW = pageW - MARGIN * 2
  const lastTableY = (): number =>
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0

  const sectionTitle = (text: string, y: number): number => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8 * s)
    doc.setTextColor(...NAVY)
    doc.text(text.toUpperCase(), MARGIN, y)
    return y + 3.5 * s
  }

  // ---- Letterhead (compact band, scales with the layout) -----------------
  const bandH = 16 * s
  doc.setFillColor(243, 246, 249)
  doc.rect(0, 0, pageW, bandH, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6 * s)
  doc.setTextColor(49, 93, 130)
  doc.text('SEDAR · ENGINE ROOM CONSOLE · REVIEW & CONFIRMATION', MARGIN, 4.8 * s)
  doc.setFontSize(14 * s)
  doc.setTextColor(...NAVY)
  doc.text('DAILY ENGINE LOG', MARGIN, 12 * s)
  doc.setFontSize(8 * s)
  doc.setTextColor(...MUTED)
  doc.text(`${data.vesselName} · ${data.logDate}`, pageW - MARGIN, 12 * s, { align: 'right' })

  let y = bandH + 6 * s

  // ---- Engine tables (two-tier grouped headers) --------------------------
  const engineSections: { title: string; rows: EngineLog[] }[] = [
    { title: 'Main Engines', rows: data.logs.filter((log) => log.engineClass === 'main') },
    { title: 'Auxiliary Generators', rows: data.logs.filter((log) => log.engineClass === 'auxiliary') },
  ]

  for (const section of engineSections) {
    y = sectionTitle(section.title, y)
    autoTable(doc, {
      head: engineHead(s),
      body: [...section.rows.map(engineRow), subtotalRow(`Subtotal (${section.title})`, totalsOf(section.rows))],
      startY: y,
      theme: 'striped',
      margin: { left: MARGIN, right: MARGIN, top: 8, bottom: 10 },
      styles: {
        font: 'helvetica',
        fontSize: 7 * s,
        cellPadding: 1.4 * s,
        textColor: INK,
        lineColor: LINE,
        lineWidth: 0.1,
        overflow: 'linebreak',
      },
      headStyles: { fillColor: HEAD_LIGHT, textColor: NAVY, fontStyle: 'bold', fontSize: 6.5 * s, halign: 'center' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 26, fontStyle: 'bold' },
        1: { cellWidth: 22, halign: 'center' },
        2: { cellWidth: 14, halign: 'center' },
        3: { cellWidth: 16, halign: 'center' },
        4: { cellWidth: 15, halign: 'right' },
        10: { halign: 'right' },
        11: { halign: 'right' },
        12: { halign: 'right' },
      },
      // Heavier left rule where each super-header group begins (UI border-l equivalent).
      didDrawCell: (hook) => {
        if (hook.section === 'foot') return
        if (!GROUP_START_COLS.has(hook.column.index)) return
        doc.setLineWidth(0.3)
        doc.setDrawColor(...GROUP_RULE)
        doc.line(hook.cell.x, hook.cell.y, hook.cell.x, hook.cell.y + hook.cell.height)
      },
    })
    y = lastTableY() + 4 * s
  }

  // ---- Vessel R.O.B. (title row inside the table, as in the UI box) ------
  const grandTotals = totalsOf(data.logs)
  const robRows: RowInput[] = [
    ['Fuel Oil (Diesel)', data.masterRob.fuelOil.toLocaleString(), data.robReceived.fuelOil.toLocaleString(), grandTotals.consumed.toLocaleString(),
      Math.max(0, data.masterRob.fuelOil + data.robReceived.fuelOil - grandTotals.consumed).toLocaleString()],
    ['Lube Oil (SA40 / 15W-40)', data.masterRob.lubeOil.toLocaleString(), data.robReceived.lubeOil.toLocaleString(), grandTotals.lube.toLocaleString(),
      Math.max(0, data.masterRob.lubeOil + data.robReceived.lubeOil - grandTotals.lube).toLocaleString()],
    ['Hydraulic Oil (68 / 100 / 46)', data.masterRob.hydraulicOil.toLocaleString(), data.robReceived.hydraulicOil.toLocaleString(), data.hydraulicOilAdded.toLocaleString(),
      Math.max(0, data.masterRob.hydraulicOil + data.robReceived.hydraulicOil - data.hydraulicOilAdded).toLocaleString()],
    ['Fresh Water (F.W.)', data.masterRob.freshWater.toLocaleString(), data.robReceived.freshWater.toLocaleString(), grandTotals.fw.toLocaleString(),
      Math.max(0, data.masterRob.freshWater + data.robReceived.freshWater - grandTotals.fw).toLocaleString()],
  ]
  autoTable(doc, {
    head: [
      [{ content: 'VESSEL R.O.B. (REMAINING ON BOARD)', colSpan: 5, styles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left', fontSize: 7 * s } }],
      ['Fluid / Lubricant', 'Starting R.O.B. (L)', 'Received (L)', 'Consumed (L)', 'Final R.O.B. (L)'],
    ],
    body: robRows,
    startY: y,
    theme: 'striped',
    margin: { left: MARGIN, right: MARGIN, top: 8, bottom: 10 },
    styles: { font: 'helvetica', fontSize: 7 * s, cellPadding: 1.4 * s, textColor: INK, lineColor: LINE, lineWidth: 0.1 },
    headStyles: { fillColor: HEAD_LIGHT, textColor: NAVY, fontStyle: 'bold', fontSize: 6.5 * s, halign: 'center' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 74, fontStyle: 'bold' }, 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } },
  })
  y = lastTableY() + 4 * s

  // ---- Remarks (clamped to the space left above the signature block) -----
  y = sectionTitle('Remarks / Handover Notes', y)
  const sigH = 27 * s
  const sigGap = 4 * s
  const lineH = 3.8 * s
  const remarkText = data.remarks.trim() || 'None recorded.'
  let remarkLines = doc.splitTextToSize(remarkText, contentW) as string[]
  const maxLines = Math.max(1, Math.floor((BOTTOM_LIMIT - y - 1 * s - sigGap - sigH) / lineH))
  if (remarkLines.length > maxLines) {
    remarkLines = remarkLines.slice(0, maxLines)
    const last = remarkLines[maxLines - 1]
    let trimmed = last
    while (trimmed.length > 1 && doc.getTextWidth(`${trimmed} …`) > contentW) trimmed = trimmed.slice(0, -1)
    remarkLines[maxLines - 1] = `${trimmed} …`
  }
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5 * s)
  doc.setTextColor(...INK)
  doc.text(remarkLines, MARGIN, y + 1 * s)
  y += 1 * s + remarkLines.length * lineH + sigGap

  // ---- Signature block: 2 columns below the remarks — ruled line first,
  //      then the dynamically injected name (physical signing on print). --
  const boxW = (contentW - 6 * s) / 2
  const stripH = 7 * s
  const boxes = [
    { title: 'PREPARED BY:', name: data.preparedBy, x: MARGIN },
    { title: 'VERIFIED BY:', name: data.verifiedBy, x: MARGIN + boxW + 6 * s },
  ]
  for (const box of boxes) {
    doc.setDrawColor(...NAVY)
    doc.setLineWidth(0.4)
    doc.rect(box.x, y, boxW, sigH)
    doc.setFillColor(...NAVY)
    doc.rect(box.x, y, boxW, stripH, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7 * s)
    doc.setTextColor(255, 255, 255)
    doc.text(box.title, box.x + 3, y + stripH * 0.68)
    doc.setDrawColor(60, 70, 80)
    doc.setLineWidth(0.25)
    doc.line(box.x + 3, y + stripH + 8 * s, box.x + boxW - 3, y + stripH + 8 * s)
    doc.setFontSize(9 * s)
    doc.setTextColor(17, 24, 32)
    doc.text(box.name, box.x + 3, y + stripH + 16 * s)
  }

  return doc
}

export function generateDailyEngineLogPdf(data: DailyEngineLogPdfData): void {
  // Dynamic scale: render the full sheet and retry smaller only if a render ever spilled
  // onto a second page (e.g., cell wrapping from unexpected data), guaranteeing one page.
  let doc = renderDailyEngineLogPdf(data, SCALE_STEPS[0])
  for (const scale of SCALE_STEPS.slice(1)) {
    if (doc.getNumberOfPages() === 1) break
    doc = renderDailyEngineLogPdf(data, scale)
  }
  if (doc.getNumberOfPages() !== 1) {
    console.warn('[DailyEngineLogPdf] Report exceeded one page at minimum scale', {
      pages: doc.getNumberOfPages(),
      scale: SCALE_STEPS[SCALE_STEPS.length - 1],
    })
  }

  // ---- Footer (single page) ---------------------------------------------
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const stamp = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const pageCount = doc.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(140, 150, 160)
    doc.text(`Daily Engine Log · ${data.vesselName} · generated ${stamp}`, MARGIN, pageH - 6)
    doc.text(`Page ${page} of ${pageCount}`, pageW - MARGIN, pageH - 6, { align: 'right' })
  }

  const slug = data.vesselName.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')
  const isoDate = new Date().toISOString().slice(0, 10)
  doc.save(`Daily-Engine-Log_${slug}_${isoDate}.pdf`)
}
