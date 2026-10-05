import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

// Strict PMS Report PDF (Download-Before-Sign-off compliance). Portrait A4: formal
// Helvetica letterhead (logo centered over the company block), an underlined metadata
// block (vessel / engine / routine interval / odometer at execution), a plain three
// column task table — Task Description | Condition (Done / Issue Found) | Time & Date
// Logged — and the Prepared By / Verified By signature blocks at the foot. The task
// interface deliberately accepts ONLY the label, the binary condition and the logged
// timestamp: remarks, findings and photographic evidence cannot flow into this file.

export interface PmsReportTask {
  label: string
  condition: 'done' | 'issue'
  loggedAt?: string
}

export interface PmsReportPdfData {
  vesselName: string
  engineName: string
  intervalLabel: string
  odometer: number
  tasks: PmsReportTask[]
  preparedBy: string
  verifiedBy: string
}

const NAVY: [number, number, number] = [21, 47, 72]
const INK: [number, number, number] = [40, 55, 70]
const LINE: [number, number, number] = [210, 220, 230]
const NEAR_BLACK: [number, number, number] = [17, 24, 32]

const MARGIN = 14
const LOGO_ASPECT = 500 / 500 // intrinsic /report-logo.png dimensions (square).

const CONDITION_LABEL: Record<'done' | 'issue', string> = {
  done: 'Done',
  issue: 'Issue Found',
}

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

// "05 Oct 2026, 10:45" — 24-hour en-GB stamp for the Time & Date Logged column.
function formatLoggedStamp(iso?: string): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const slugify = (value: string) => value.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')

function renderPmsReportPdf(data: PmsReportPdfData, logoDataUrl: string | null): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const contentW = pageW - MARGIN * 2
  const lastTableY = (): number =>
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 0

  // ---- Corporate letterhead (Helvetica — same family as the tables) ------
  const logoH = 11
  const logoW = logoH * LOGO_ASPECT
  if (logoDataUrl) {
    try {
      doc.addImage(logoDataUrl, 'PNG', (pageW - logoW) / 2, 6, logoW, logoH)
    } catch {
      console.warn('[PmsReportPdf] logo embed failed; rendering text-only letterhead')
    }
  }

  doc.setTextColor(...NEAR_BLACK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('SEDAR TUG SERVICES CORP.', pageW / 2, 22.5, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('RIZAL AVE. EXT. STA CLARA BATANGAS CITY', pageW / 2, 27, { align: 'center' })
  doc.text('Tel. No. (043) 723 - 1507', pageW / 2, 30.5, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('PMS MAINTENANCE REPORT', pageW / 2, 37, { align: 'center' })

  // ---- Metadata block — bold values sitting on their own form rules. -----
  const valueRule = 1.3
  const underlined = (label: string, value: string, x: number, y: number, rightAligned = false): void => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...NEAR_BLACK)
    doc.setDrawColor(...NEAR_BLACK)
    doc.setLineWidth(0.3)
    const labelW = doc.getTextWidth(label)
    const valueW = doc.getTextWidth(value)
    const startX = rightAligned ? x - (labelW + valueW) : x
    doc.text(label, startX, y)
    doc.text(value, startX + labelW, y)
    doc.line(startX + labelW, y + valueRule, startX + labelW + valueW, y + valueRule)
  }

  const generated = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const rowGap = 6.5
  let metaY = 44
  underlined('NAME OF VESSEL: ', data.vesselName, MARGIN, metaY)
  underlined('DATE: ', generated.toUpperCase(), pageW - MARGIN, metaY, true)
  metaY += rowGap
  underlined('ENGINE: ', data.engineName, MARGIN, metaY)
  underlined('ROUTINE: ', data.intervalLabel, pageW - MARGIN, metaY, true)
  metaY += rowGap
  underlined('ODOMETER AT EXECUTION: ', `${data.odometer.toFixed(1)} HRS`, MARGIN, metaY)

  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, metaY + 4, pageW - MARGIN, metaY + 4)

  // ---- Task table — description · binary condition · logged stamp --------
  autoTable(doc, {
    head: [['Task Description', 'Condition (Done / Issue Found)', 'Time & Date Logged']],
    body: data.tasks.map((task) => [task.label, CONDITION_LABEL[task.condition], formatLoggedStamp(task.loggedAt)]),
    startY: metaY + 10,
    theme: 'striped',
    margin: { left: MARGIN, right: MARGIN, top: 8, bottom: 12 },
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 2,
      textColor: INK,
      lineColor: LINE,
      lineWidth: 0.1,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 90, fontStyle: 'bold', halign: 'left' },
      1: { cellWidth: 45, halign: 'center' },
      2: { cellWidth: 47, halign: 'center' },
    },
  })

  // ---- Signature blocks (mirrors the printed form): label on top, the
  //      name above the rule (caps bold), the role fixed below it (caps regular).
  const y = lastTableY() + 10
  const blockH = 29
  const boxW = (contentW - 6) / 2
  const sigTop = Math.min(y, pageH - 20 - blockH)
  if (y + blockH > pageH - 20) {
    console.warn('[PmsReportPdf] signature block clamped to fit the page', { y: Math.round(y) })
  }
  const boxes = [
    {
      title: 'PREPARED BY:',
      name: (data.preparedBy || '—').toUpperCase(),
      // The roster offers the chief directly; otherwise the preparer is the duty engineer.
      role: data.preparedBy === data.verifiedBy ? 'CHIEF ENGINEER' : 'DUTY ENGINEER',
      x: MARGIN,
    },
    { title: 'VERIFIED BY:', name: (data.verifiedBy || '—').toUpperCase(), role: 'CHIEF ENGINEER', x: MARGIN + boxW + 6 },
  ]
  for (const box of boxes) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...NAVY)
    doc.text(box.title, box.x + 4, sigTop + 4)

    const lineY = sigTop + 20
    const centerX = box.x + boxW / 2
    let nameSize = 9.5
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...NEAR_BLACK)
    doc.setFontSize(nameSize)
    while (nameSize > 6 && doc.getTextWidth(box.name) > boxW - 8) {
      nameSize -= 0.5
      doc.setFontSize(nameSize)
    }
    doc.text(box.name, centerX, lineY - 3, { align: 'center' })
    doc.setDrawColor(60, 70, 80)
    doc.setLineWidth(0.25)
    doc.line(box.x + 4, lineY, box.x + boxW - 4, lineY)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...INK)
    doc.text(box.role, centerX, lineY + 5.5, { align: 'center' })
  }

  return doc
}

export async function generatePmsReportPdf(data: PmsReportPdfData): Promise<void> {
  const logoDataUrl = await loadLogoDataUrl()
  const doc = renderPmsReportPdf(data, logoDataUrl)

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const stamp = new Date().toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const pageCount = doc.getNumberOfPages()
  if (pageCount !== 1) {
    console.warn('[PmsReportPdf] Report spilled onto extra pages', { pages: pageCount })
  }
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(140, 150, 160)
    doc.text(`PMS Maintenance Report · ${data.vesselName} · generated ${stamp}`, MARGIN, pageH - 6)
    doc.text(`Page ${page} of ${pageCount}`, pageW - MARGIN, pageH - 6, { align: 'right' })
  }

  const isoDate = new Date().toISOString().slice(0, 10)
  doc.save(`PMS-Report_${slugify(data.vesselName)}_${slugify(data.intervalLabel)}_${isoDate}.pdf`)
}
