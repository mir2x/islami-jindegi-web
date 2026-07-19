// Backend-driven Hijri date, mirroring the app's adjusted_hijri_date.dart 1:1:
//  1. Ask the dotnet API (/api/hijri/date) for today's and tomorrow's Hijri date —
//     sighting-aware, country-specific — and cache both in localStorage.
//  2. The Islamic day begins at Maghrib: after it, display tomorrow's date
//     (never today's as a stand-in for tomorrow).
//  3. If the backend is unreachable and the cache is stale, fall back to the
//     local tabular calculation (toHijri), which applies the user's manual
//     hijriAdjustment itself.
// The user's hijriAdjustment shifts the *query* date sent to the backend, same
// as the app's hijriLocalAdjustment.

import { toHijri, calcPrayerSlots, HIJRI_MONTHS_EN } from './prayer-times'
import { getSettings } from './settings'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''
const CACHE_KEY = 'ij_hijri_cache'

export interface HijriDisplayDate {
  day: number
  month: number
  year: number
  monthBn: string
  monthEn: string
  source: 'backend' | 'local'
}

interface BackendDay {
  hijriYear: number
  hijriMonth: number
  hijriDay: number
  monthNameBn: string
}

function dateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function readCache(): Record<string, BackendDay> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function writeCache(entries: Record<string, BackendDay>) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(entries)) } catch { /* ignore */ }
}

const COUNTRY_KEY = 'ij_country_code'

/** Reverse-geocodes coords to an ISO country code (mirrors the app's geolocated
 *  countryCode), remembering the last success; falls back to BD. */
export async function resolveCountryCode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=3`)
    const d = await res.json()
    const cc = d?.address?.country_code?.toUpperCase()
    if (cc) {
      try { localStorage.setItem(COUNTRY_KEY, cc) } catch { /* ignore */ }
      return cc
    }
  } catch { /* ignore */ }
  try { return localStorage.getItem(COUNTRY_KEY) || 'BD' } catch { return 'BD' }
}

async function fetchDay(date: string, countryCode: string): Promise<BackendDay | null> {
  try {
    const res = await fetch(`${API_BASE}/api/hijri/date?date=${date}&country-code=${countryCode}`)
    if (!res.ok) return null
    const json = await res.json()
    // data === null means the backend signalled fallback — treat as unavailable.
    return json?.data ?? null
  } catch {
    return null
  }
}

export async function getHijriToday(lat: number, lng: number, country?: string): Promise<HijriDisplayDate> {
  // Callers with known-default coords pass 'BD' explicitly to skip the geocode.
  const countryCode = country ?? await resolveCountryCode(lat, lng)
  const now = new Date()
  const adjustment = getSettings().hijriAdjustment

  const maghrib = calcPrayerSlots(lat, lng, now).find(s => s.key === 'maghrib')?.start ?? null
  const pastMaghrib = maghrib !== null && now > maghrib

  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate() + adjustment)
  const next = new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1)
  const todayKey = `${countryCode}:${dateStr(base)}`
  const tomorrowKey = `${countryCode}:${dateStr(next)}`

  const cache = readCache()
  let today = cache[todayKey] ?? null
  let tomorrow = cache[tomorrowKey] ?? null

  if (!today || !tomorrow) {
    const [a, b] = await Promise.all([
      fetchDay(dateStr(base), countryCode),
      fetchDay(dateStr(next), countryCode),
    ])
    today = a ?? today
    tomorrow = b ?? tomorrow
    // Keeping only the two current keys also prunes stale entries.
    const fresh: Record<string, BackendDay> = {}
    if (today) fresh[todayKey] = today
    if (tomorrow) fresh[tomorrowKey] = tomorrow
    if (Object.keys(fresh).length) writeCache(fresh)
  }

  const chosen = pastMaghrib ? tomorrow : today
  if (chosen) {
    return {
      day: chosen.hijriDay,
      month: chosen.hijriMonth,
      year: chosen.hijriYear,
      monthBn: chosen.monthNameBn,
      monthEn: HIJRI_MONTHS_EN[chosen.hijriMonth - 1] ?? '',
      source: 'backend',
    }
  }

  const fallback = toHijri(new Date(now.getFullYear(), now.getMonth(), now.getDate() + (pastMaghrib ? 1 : 0)))
  return { ...fallback, source: 'local' }
}
