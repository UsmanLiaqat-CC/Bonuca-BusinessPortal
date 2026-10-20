import QRCode from 'qrcode'

/** Print placements (spec §4.4 table/counter/sticker/flyer/window; §4.2 campaign cup/flyer/sticker/poster). */
export const PLACEMENTS = {
  table: { label: 'Table', format: [105, 148] as [number, number] },
  counter: { label: 'Counter', format: [148, 210] as [number, number] },
  sticker: { label: 'Sticker', format: [80, 80] as [number, number] },
  flyer: { label: 'Flyer', format: [148, 210] as [number, number] },
  window: { label: 'Window', format: [210, 297] as [number, number] },
  cup: { label: 'Cup', format: [50, 50] as [number, number] },
  poster: { label: 'Poster', format: [297, 420] as [number, number] },
} as const
export type Placement = keyof typeof PLACEMENTS

function triggerDownload(href: string, filename: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export async function downloadQrPng(text: string, filename: string): Promise<void> {
  const url = await QRCode.toDataURL(text, { width: 1024, margin: 2, errorCorrectionLevel: 'M' })
  triggerDownload(url, `${filename}.png`)
}

export async function downloadQrPdf(text: string, filename: string, placement: Placement, title: string, subtitle: string): Promise<void> {
  const { jsPDF } = await import('jspdf')
  const [w, h] = PLACEMENTS[placement].format
  const doc = new jsPDF({ unit: 'mm', format: [w, h], orientation: w > h ? 'landscape' : 'portrait' })
  const qr = await QRCode.toDataURL(text, { width: 1024, margin: 1, errorCorrectionLevel: 'M' })
  const size = Math.min(w, h) * 0.62
  const small = Math.min(w, h) < 90
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(small ? 8 : 18)
  doc.text(title, w / 2, small ? 6 : 22, { align: 'center', maxWidth: w - 10 })
  doc.addImage(qr, 'PNG', (w - size) / 2, small ? 9 : 32, size, size)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(small ? 6 : 11)
  doc.text(subtitle, w / 2, (small ? 9 : 32) + size + (small ? 4 : 10), { align: 'center', maxWidth: w - 10 })
  doc.save(`${filename}-${placement}.pdf`)
}
