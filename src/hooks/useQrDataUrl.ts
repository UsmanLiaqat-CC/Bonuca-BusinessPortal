import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

/** Renders `text` as a QR code PNG data URL (null while rendering or when text is empty). */
export function useQrDataUrl(text: string | null, size = 256): string | null {
  const [state, setState] = useState<{ key: string; url: string } | null>(null)
  const key = `${size}|${text ?? ''}`
  useEffect(() => {
    if (!text) return
    let cancelled = false
    QRCode.toDataURL(text, { width: size, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => !cancelled && setState({ key, url }))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [text, size, key])
  return text && state?.key === key ? state.url : null
}
