// User-facing site settings, mirroring the old Ember site's local-storage settings
// (islamic-jindegi-web/app/storages/settings.js + app/components/display/settings).
// Consumed by prayer-times.ts for calculation, and by the /settings page for editing.

export type MadhabSetting = 'hanafi' | 'shafi'

export interface AppSettings {
  /** whole-day shift applied to the calculated Hijri date, -2..+2 */
  hijriAdjustment: number
  madhab: MadhabSetting
  /** key of an adhan CalculationMethod */
  method: string
  /** per-prayer minute adjustments */
  fajr: number
  sunrise: number
  dhuhr: number
  asr: number
  maghrib: number
  isha: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  hijriAdjustment: 0,
  madhab: 'hanafi',
  method: 'Karachi',
  fajr: 5,
  sunrise: 0,
  dhuhr: 0,
  asr: 0,
  maghrib: 3,
  isha: 0,
}

export const HIJRI_ADJUSTMENTS = [-2, -1, 0, 1, 2]

export const MADHABS: { value: MadhabSetting; label: string }[] = [
  { value: 'hanafi', label: 'হানাফী' },
  { value: 'shafi', label: 'শাফেয়ী / মালেকী / হাম্বলী' },
]

export const CALCULATION_METHODS: { value: string; label: string }[] = [
  { value: 'Karachi', label: 'করাচি' },
  { value: 'MuslimWorldLeague', label: 'মুসলিম ওয়ার্ল্ড লীগ' },
  { value: 'UmmAlQura', label: 'উম্মুল কুরা, মক্কা' },
  { value: 'MoonsightingCommittee', label: 'মুনসাইটিং কমিটি (উত্তর আমেরিকা ও যুক্তরাজ্য)' },
  { value: 'Egyptian', label: 'মিশর' },
  { value: 'Dubai', label: 'দুবাই' },
  { value: 'Qatar', label: 'কাতার' },
  { value: 'Kuwait', label: 'কুয়েত' },
  { value: 'Singapore', label: 'সিঙ্গাপুর, মালয়েশিয়া ও ইন্দোনেশিয়া' },
  { value: 'Turkey', label: 'তুরস্ক' },
  { value: 'Tehran', label: 'তেহরান' },
  { value: 'NorthAmerica', label: 'উত্তর আমেরিকা (ISNA)' },
]

/** the per-prayer minute-offset fields, in display order */
export const PRAYER_OFFSETS = [
  { key: 'fajr', label: 'ফজর' },
  { key: 'sunrise', label: 'সূর্যোদয়' },
  { key: 'dhuhr', label: 'যুহর' },
  { key: 'asr', label: 'আসর' },
  { key: 'maghrib', label: 'মাগরিব' },
  { key: 'isha', label: 'ইশা' },
] as const

export type PrayerOffsetKey = (typeof PRAYER_OFFSETS)[number]['key']

const KEY = 'ij-settings'

/** Reads saved settings, falling back to defaults (also on the server, where there's no storage). */
export function getSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(patch: Partial<AppSettings>): AppSettings {
  const next = { ...getSettings(), ...patch }
  if (typeof window !== 'undefined') {
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* ignore */ }
  }
  return next
}
