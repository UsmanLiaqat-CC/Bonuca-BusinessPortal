import { useEffect, useRef, useState } from 'react'
import { MapPin, Search } from 'lucide-react'
import { env } from '@/lib/env'
import { Input } from '@/components/ui/Field'

export interface PickedPlace {
  address: string
  lat?: number
  lng?: number
}

interface Suggestion {
  id: string
  label: string
  lat?: number
  lng?: number
}

/** Google Places (New) autocomplete when VITE_GOOGLE_MAPS_API_KEY is set; otherwise free OpenStreetMap search. */
async function searchPlaces(query: string, signal: AbortSignal): Promise<Suggestion[]> {
  if (env.googleMapsKey) {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': env.googleMapsKey },
      body: JSON.stringify({ input: query }),
    })
    if (!res.ok) throw new Error('Google Places search failed.')
    const data = (await res.json()) as { suggestions?: { placePrediction?: { placeId: string; text: { text: string } } }[] }
    return (data.suggestions ?? []).flatMap((s) => (s.placePrediction ? [{ id: s.placePrediction.placeId, label: s.placePrediction.text.text }] : []))
  }
  const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=0&limit=6&q=${encodeURIComponent(query)}`, { signal })
  if (!res.ok) throw new Error('Place search failed.')
  const rows = (await res.json()) as { place_id: number; display_name: string; lat: string; lon: string }[]
  return rows.map((r) => ({ id: String(r.place_id), label: r.display_name, lat: Number(r.lat), lng: Number(r.lon) }))
}

async function placeCoordinates(id: string): Promise<{ lat?: number; lng?: number }> {
  if (!env.googleMapsKey) return {}
  const res = await fetch(`https://places.googleapis.com/v1/places/${id}?fields=location`, { headers: { 'X-Goog-Api-Key': env.googleMapsKey } })
  if (!res.ok) return {}
  const data = (await res.json()) as { location?: { latitude: number; longitude: number } }
  return { lat: data.location?.latitude, lng: data.location?.longitude }
}

/** Place picker: type an address, pick a search result; the address (and coordinates) are filled in. */
export function PlaceSearch({ value, onPick, id }: { value: string; onPick: (place: PickedPlace) => void; id?: string }) {
  const [text, setText] = useState(value)
  const [results, setResults] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const skip = useRef(true)

  useEffect(() => {
    if (skip.current) {
      skip.current = false
      return
    }
    if (text.trim().length < 3) return
    const ctrl = new AbortController()
    const timer = setTimeout(() => {
      searchPlaces(text.trim(), ctrl.signal)
        .then((r) => {
          setResults(r)
          setError(null)
          setOpen(true)
        })
        .catch((e: unknown) => {
          if ((e as Error).name !== 'AbortError') setError('Search is unavailable right now. You can type the address manually.')
        })
    }, 350)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [text])

  const choose = async (s: Suggestion) => {
    skip.current = true
    setText(s.label)
    setOpen(false)
    const coords = s.lat !== undefined ? { lat: s.lat, lng: s.lng } : await placeCoordinates(s.id)
    onPick({ address: s.label, ...coords })
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" aria-hidden />
      <Input
        id={id}
        className="pl-9"
        autoComplete="off"
        placeholder="Search a place or address"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          if (e.target.value.trim().length < 3) setResults([])
          onPick({ address: e.target.value })
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        aria-expanded={open}
        aria-controls="place-results"
      />
      {open && results.length > 0 && (
        <ul id="place-results" aria-label="Search results" className="absolute z-40 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-[var(--shadow-pop)]">
          {results.map((r) => (
            <li key={r.id}>
              <button type="button" className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-canvas" onClick={() => void choose(r)}>
                <MapPin className="mt-0.5 size-4 shrink-0 text-faint" aria-hidden />
                <span>{r.label}</span>
              </button>
            </li>
          ))}
          <li className="px-3 py-1.5 text-[11px] text-faint">{env.googleMapsKey ? 'Results by Google Places' : 'Results by OpenStreetMap'}</li>
        </ul>
      )}
      {error && <p className="hint mt-1 text-warning">{error}</p>}
    </div>
  )
}
