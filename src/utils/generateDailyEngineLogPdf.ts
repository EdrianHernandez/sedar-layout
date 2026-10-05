import { jsPDF } from 'jspdf'
import autoTable, { type CellDef, type RowInput } from 'jspdf-autotable'
import type { EngineLog, EngineStatus } from '../types/engineLog'
import type { MasterRob } from '../data/chiefEngineerMockData'
import { computeRunningHours, formatTimeOnly, fuelConsumedBy } from './engineLog'

// Dynamic Daily Engine Monitoring Report PDF (Download-Before-Submit compliance).
// Landscape A4, strictly ONE page: compact fixed styling sized against the page budget,
// a dynamic scale retry if a render ever overflows, and clamps so long text can never push
// a page break. Layout follows the printed form: Helvetica letterhead (logo centered above
// the company block + underlined NAME OF VESSEL / DATE), two-tier grouped engine tables (OPERATIONS /
// FUEL OIL / ADDED FLUIDS / PARAMETERS), Vessel R.O.B. beside a matching REMARKS box
// (2/3 + 1/3), and a bottom signature block — name above the rule (caps, bold), fixed
// position below it (caps, regular). Reuses the SAME shared helpers (fuelConsumedBy /
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
const LINE: [number, number, number] = [210, 220, 230]
const HEAD_LIGHT: [number, number, number] = [232, 238, 244]
const GROUP_RULE: [number, number, number] = [148, 163, 184]
const NEAR_BLACK: [number, number, number] = [17, 24, 32]

const MARGIN = 10
const BOTTOM_LIMIT = 200 // 210 − 10: hard content floor (footer sits at pageH − 6).
const SCALE_STEPS = [1, 0.92, 0.85]
const ROB_GAP = 5 // mm between the R.O.B. table and the REMARKS box.
const LOGO_ASPECT = 500 / 500 // intrinsic /report-logo.png dimensions (square).

// Columns where a grouped super-header begins (left rule mirrors the UI's border-l dividers).
const GROUP_START_COLS = new Set([2, 5, 8, 10])

// The report's dedicated emblem (/report-logo.png), embedded as a data URL. Any failure
// degrades to a text-only letterhead — the download must never be blocked by the logo.
async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch('/report-logo.png')
    if (!response.ok) return null
    const blob = await response.blob()
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

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

// Printed-form table head: a full-width CENTERED title band over the two-tier grouped
// headers — row 1 = title (colSpan 13); row 2 = identity (rowSpan 2) + super-headers
// (colSpan); row 3 = the sub-headers with units.
function engineHead(s: number, title: string): RowInput[] {
  const tier1 = (content: string, colSpan?: number, rowSpan?: number): CellDef => ({
    content,
    ...(colSpan !== undefined ? { colSpan } : {}),
    ...(rowSpan !== undefined ? { rowSpan } : {}),
    styles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', valign: 'middle', fontSize: 6.5 * s },
  })
  return [
    [{ content: title, colSpan: 13, styles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', valign: 'middle', fontSize: 7.5 * s } }],
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

function renderDailyEngineLogPdf(data: DailyEngineLogPdfData, scale: number, logoDataUrl: string | null): jsPDF {
  const s = scale
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const contentW = pageW - MARGIN * 2
  const lastTableY = (): number =>
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0

  // ---- Corporate letterhead (Helvetica — same family as the tables) ------
  // Logo centered on top of the company block, then the form rules below.
  const logoH = 11 * s
  const logoW = logoH * LOGO_ASPECT
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', (pageW - logoW) / 2, 3 * s, logoW, logoH)
    } catch {
      console.warn('[DailyEngineLogPdf] logo embed failed; rendering text-only letterhead')
    }
  }

  doc.setTextColor(...NEAR_BLACK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11 * s)
  doc.text('SEDAR TUG SERVICES CORP.', pageW / 2, 19.5 * s, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9 * s)
  doc.text('RIZAL AVE. EXT. STA CLARA BATANGAS CITY', pageW / 2, 24 * s, { align: 'center' })
  doc.text('Tel. No. (043) 723 - 1507', pageW / 2, 27.5 * s, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12 * s)
  doc.text('DAILY ENGINE MONITORING REPORT', pageW / 2, 33 * s, { align: 'center' })

  // NAME OF VESSEL / DATE row — bold values sitting on their own form rules.
  const rowY = 38.5 * s
  const valueRule = 1.3 * s
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9 * s)
  doc.setTextColor(...NEAR_BLACK)
  doc.setDrawColor(...NEAR_BLACK)
  doc.setLineWidth(0.3)

  const vesselLabel = 'NAME OF VESSEL: '
  doc.text(vesselLabel, MARGIN, rowY)
  const vesselX = MARGIN + doc.getTextWidth(vesselLabel)
  doc.text(data.vesselName, vesselX, rowY)
  doc.line(vesselX, rowY + valueRule, vesselX + doc.getTextWidth(data.vesselName), rowY + valueRule)

  const dateLabel = 'DATE: '
  const dateValue = data.logDate.toUpperCase()
  const dateValueX = pageW - MARGIN - doc.getTextWidth(dateValue)
  doc.text(dateValue, dateValueX, rowY)
  doc.text(dateLabel, dateValueX - doc.getTextWidth(dateLabel), rowY)
  doc.line(dateValueX, rowY + valueRule, dateValueX + doc.getTextWidth(dateValue), rowY + valueRule)

  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, 41 * s, pageW - MARGIN, 41 * s)
  let y = 46.5 * s

  // ---- Engine tables (centered title band + two-tier grouped headers) ----
  const engineSections: { title: string; rows: EngineLog[] }[] = [
    { title: 'Main Engines', rows: data.logs.filter((log) => log.engineClass === 'main') },
    { title: 'Auxiliary Generators', rows: data.logs.filter((log) => log.engineClass === 'auxiliary') },
  ]

  for (const section of engineSections) {
    autoTable(doc, {
      head: engineHead(s, section.title.toUpperCase()),
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

  // ---- Vessel R.O.B. (left 2/3) beside REMARKS (right 1/3) --------------
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
  const leftW = (contentW - ROB_GAP) * (2 / 3)
  const rightW = contentW - ROB_GAP - leftW
  const robTop = y
  let titleBarH = 7 * s
  autoTable(doc, {
    head: [
      [{ content: 'VESSEL R.O.B. (REMAINING ON BOARD)', colSpan: 5, styles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', halign: 'left', fontSize: 7 * s } }],
      ['Fluid / Lubricant', 'Starting R.O.B. (L)', 'Received (L)', 'Consumed (L)', 'Final R.O.B. (L)'],
    ],
    body: robRows,
    startY: robTop,
    theme: 'striped',
    tableWidth: leftW,
    margin: { left: MARGIN, right: pageW - MARGIN - leftW, top: 8, bottom: 10 },
    styles: { font: 'helvetica', fontSize: 7 * s, cellPadding: 1.4 * s, textColor: INK, lineColor: LINE, lineWidth: 0.1 },
    headStyles: { fillColor: HEAD_LIGHT, textColor: NAVY, fontStyle: 'bold', fontSize: 6.5 * s, halign: 'center' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: { 0: { cellWidth: 58, fontStyle: 'bold' }, 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } },
    // Capture the title-row height so the REMARKS box matches the R.O.B. container exactly.
    didDrawCell: (hook) => {
      if (hook.section === 'head' && hook.row.index === 0) titleBarH = hook.cell.height
    },
  })
  const robBottom = lastTableY()

  // Matching container borders (the R.O.B. table and the REMARKS box read as sibling boxes).
  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.4)
  doc.rect(MARGIN, robTop, leftW, robBottom - robTop)

  const remarksX = MARGIN + leftW + ROB_GAP
  const remarksH = robBottom - robTop
  doc.rect(remarksX, robTop, rightW, remarksH)
  doc.setFillColor(...NAVY)
  doc.rect(remarksX, robTop, rightW, titleBarH, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7 * s)
  doc.setTextColor(255, 255, 255)
  doc.text('REMARKS / HANDOVER NOTES', remarksX + 3, robTop + titleBarH * 0.7)

  const innerTop = robTop + titleBarH + 3
  const innerBottom = robBottom - 3
  const lineH = 3.8 * s
  const firstBaseline = innerTop + 3
  const maxLines = Math.max(1, Math.floor((innerBottom - firstBaseline) / lineH) + 1)
  const remarkText = data.remarks.trim() || 'None recorded.'
  let remarkLines = doc.splitTextToSize(remarkText, rightW - 6) as string[]
  if (remarkLines.length > maxLines) {
    remarkLines = remarkLines.slice(0, maxLines)
    const last = remarkLines[maxLines - 1]
    let trimmed = last
    while (trimmed.length > 1 && doc.getTextWidth(`${trimmed} …`) > rightW - 6) trimmed = trimmed.slice(0, -1)
    remarkLines[maxLines - 1] = `${trimmed} …`
  }
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5 * s)
  doc.setTextColor(...INK)
  doc.text(remarkLines, remarksX + 3, firstBaseline)

  y = robBottom + 8 * s

  // ---- Signature block (no containers): plain left-aligned label on top, a clear
  //      signature space, then the name centered above the rule (caps bold) and the
  //      fixed position centered below it (caps, regular). Flows under the R.O.B./
  //      REMARKS row; the clamp only engages on pathological data so the block can
  //      never slide off the page.
  const blockH = 29 * s
  const boxW = (contentW - 6 * s) / 2
  const sigTop = Math.min(y, BOTTOM_LIMIT - blockH)
  if (y + blockH > BOTTOM_LIMIT) {
    console.warn('[DailyEngineLogPdf] signature block clamped to fit the page', { y: Math.round(y) })
  }
  const boxes = [
    { title: 'PREPARED BY:', name: (data.preparedBy || '—').toUpperCase(), role: '2ND/3RD ENGINEER/OILER', x: MARGIN },
    { title: 'VERIFIED BY:', name: (data.verifiedBy || '—').toUpperCase(), role: 'CHIEF ENGINEER', x: MARGIN + boxW + 6 * s },
  ]
  for (const box of boxes) {
    // Label: plain, left-aligned — no strip, no border.
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8 * s)
    doc.setTextColor(...NAVY)
    doc.text(box.title, box.x + 4, sigTop + 4 * s)

    const lineY = sigTop + 20 * s
    const centerX = box.x + boxW / 2
    // Name centered, hugging the rule from above — shrink-to-fit within the column.
    let nameSize = 9.5 * s
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NEAR_BLACK)
    doc.setFontSize(nameSize)
    while (nameSize > 6 && doc.getTextWidth(box.name) > boxW - 8) {
      nameSize -= 0.5
      doc.setFontSize(nameSize)
    }
    doc.text(box.name, centerX, lineY - 3 * s, { align: 'center' })
    doc.setDrawColor(60, 70, 80)
    doc.setLineWidth(0.25)
    doc.line(box.x + 4, lineY, box.x + boxW - 4, lineY)
    // Fixed position below the rule: centered, plain caps, never bold.
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5 * s)
    doc.setTextColor(...INK)
    doc.text(box.role, centerX, lineY + 5.5 * s, { align: 'center' })
  }

  return doc
}

export async function generateDailyEngineLogPdf(data: DailyEngineLogPdfData): Promise<void> {
  const logoDataUrl = await loadLogoDataUrl()

  // Dynamic scale: render the full sheet and retry smaller only if a render ever spilled
  // onto a second page (e.g., cell wrapping from unexpected data), guaranteeing one page.
  let doc = renderDailyEngineLogPdf(data, SCALE_STEPS[0], logoDataUrl)
  for (const scale of SCALE_STEPS.slice(1)) {
    if (doc.getNumberOfPages() === 1) break
    doc = renderDailyEngineLogPdf(data, scale, logoDataUrl)
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
    doc.text(`Daily Engine Monitoring Report · ${data.vesselName} · generated ${stamp}`, MARGIN, pageH - 6)
    doc.text(`Page ${page} of ${pageCount}`, pageW - MARGIN, pageH - 6, { align: 'right' })
  }

  const slug = data.vesselName.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')
  const isoDate = new Date().toISOString().slice(0, 10)
  doc.save(`Daily-Engine-Log_${slug}_${isoDate}.pdf`)
}
