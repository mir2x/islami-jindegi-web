import {
  Coordinates,
  CalculationMethod,
  PrayerTimes,
  Madhab,
  Prayer,
} from 'adhan'
import umalqura from '@umalqura/core'
import { getSettings } from './settings'

export interface PrayerSlot {
  key: string
  nameBn: string
  nameEn: string
  start: Date
  end: Date
  isForbidden: boolean
  /** matches NamazTime.Title (English) for linking to detail page */
  titleKey: string
  /** alternate title spellings to try */
  aliases?: string[]
}

type MethodKey = keyof typeof CalculationMethod

function buildParams() {
  const s = getSettings()
  const factory = CalculationMethod[s.method as MethodKey] ?? CalculationMethod.Karachi
  const p = factory()
  p.madhab = s.madhab === 'shafi' ? Madhab.Shafi : Madhab.Hanafi
  p.adjustments.fajr = s.fajr
  p.adjustments.sunrise = s.sunrise
  p.adjustments.dhuhr = s.dhuhr
  p.adjustments.asr = s.asr
  p.adjustments.maghrib = s.maghrib
  p.adjustments.isha = s.isha
  return p
}

function addMins(d: Date, m: number) {
  return new Date(d.getTime() + m * 60000)
}
function subMins(d: Date, m: number) {
  return new Date(d.getTime() - m * 60000)
}

export function calcPrayerSlots(lat: number, lng: number, date = new Date()): PrayerSlot[] {
  const coords = new Coordinates(lat, lng)
  const params = buildParams()
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const pt = new PrayerTimes(coords, d, params)
  const ptNext = new PrayerTimes(coords, addMins(d, 24 * 60), params)

  return [
    {
      key: 'tahajjud',
      nameBn: 'তাহাজ্জুদ, সাহরী শেষ',
      nameEn: 'Tahajjud / Sehri',
      start: subMins(pt.fajr, 10),
      end: subMins(pt.fajr, 10),
      isForbidden: false,
      titleKey: 'Tahajjud',
    },
    {
      key: 'fajr',
      nameBn: 'ফজর',
      nameEn: 'Fajr',
      start: pt.fajr,
      end: subMins(pt.sunrise, 1),
      isForbidden: false,
      titleKey: 'Fajr',
    },
    {
      key: 'sunrise',
      nameBn: 'সূর্যোদয়',
      nameEn: 'Sunrise',
      start: pt.sunrise,
      end: addMins(pt.sunrise, 14),
      isForbidden: true,
      titleKey: 'Sunrise',
    },
    {
      key: 'ishraq',
      nameBn: 'ইশরাক, চাশত',
      nameEn: 'Ishraq / Chasht',
      start: addMins(pt.sunrise, 15),
      end: subMins(pt.dhuhr, 1),
      isForbidden: false,
      titleKey: 'Ishraq',
    },
    {
      key: 'midday',
      nameBn: 'দ্বিপ্রহর',
      nameEn: 'Midday',
      start: pt.dhuhr,
      end: addMins(pt.dhuhr, 4),
      isForbidden: true,
      titleKey: 'Midday',
    },
    {
      key: 'dhuhr',
      nameBn: 'যুহর, যাওয়াল',
      nameEn: 'Dhuhr / Zuhr',
      start: addMins(pt.dhuhr, 5),
      end: subMins(pt.asr, 1),
      isForbidden: false,
      titleKey: 'Dhuhr',
      aliases: ['Zuhr', 'Dhuhr/Zuhr', 'Zuhr/Dhuhr'],
    },
    {
      key: 'asr',
      nameBn: 'আসর',
      nameEn: 'Asr',
      start: pt.asr,
      end: subMins(pt.maghrib, 4),
      isForbidden: false,
      titleKey: 'Asr',
    },
    {
      key: 'sunset',
      nameBn: 'সূর্যাস্ত',
      nameEn: 'Sunset',
      start: subMins(pt.maghrib, 3),
      end: subMins(pt.maghrib, 1),
      isForbidden: true,
      titleKey: 'Sunset',
    },
    {
      key: 'maghrib',
      nameBn: 'মাগরিব, ইফতার',
      nameEn: 'Maghrib / Iftar',
      start: pt.maghrib,
      end: subMins(pt.isha, 1),
      isForbidden: false,
      titleKey: 'Maghrib',
    },
    {
      key: 'isha',
      nameBn: 'ইশা',
      nameEn: 'Isha',
      start: pt.isha,
      end: subMins(ptNext.fajr, 10),
      isForbidden: false,
      titleKey: 'Isha',
    },
  ]
}

export function findActiveSlot(slots: PrayerSlot[], now: Date): string | null {
  for (const s of slots) {
    if (now >= s.start && now < s.end) return s.key
  }
  // Slots are built per calendar day, so before Sehri end the running slot is
  // *yesterday's* Isha (it spans midnight) and isn't in the list.
  const first = slots[0]
  if (first && now < first.start) return 'isha'
  // Between Sehri end (the zero-width tahajjud marker) and Fajr.
  const fajr = slots.find(s => s.key === 'fajr')
  if (fajr && now < fajr.start) return 'tahajjud'
  return null
}

export function findNextSlot(slots: PrayerSlot[], now: Date): PrayerSlot | null {
  for (const s of slots) {
    if (s.start > now) return s
  }
  return slots[1] ?? null // fajr
}

// ── Hijri date ────────────────────────────────────────────────────────────────
const HIJRI_MONTHS_BN = [
  // Canonical Bangla spellings, shared 1:1 with the dotnet API's
  // HijriService.MonthNames and the app's l10n — keep all three in sync.
  'মুহাররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি',
  'জুমাদাল উলা', 'জুমাদাল উখরা', 'রজব', 'শাবান',
  'রমাযান', 'শাউয়াল', 'যিলক্বদ', 'যিলহাজ্জ',
]

export function toHijri(date: Date): { day: number; month: number; year: number; monthBn: string } {
  // Umm al-Qura shifted one day back — Bangladesh's default relationship to the
  // Saudi calendar (mirrors the dotnet API's default_offset=+1 on month starts) —
  // plus the user's manual adjustment. This is the instant-render/offline value;
  // the sighting-aware backend date (src/lib/hijri.ts) replaces it when available,
  // and matches it exactly whenever no per-month override exists.
  const shifted = new Date(
    date.getFullYear(), date.getMonth(),
    date.getDate() + getSettings().hijriAdjustment - 1,
  )
  const u = umalqura(shifted)
  return { day: u.hd, month: u.hm, year: u.hy, monthBn: HIJRI_MONTHS_BN[u.hm - 1] ?? '' }
}

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
export function toBnNum(n: number) {
  return String(n).split('').map(c => BN_DIGITS[+c] ?? c).join('')
}

export function formatTimeBn(d: Date) {
  const h = d.getHours() % 12 || 12
  const m = d.getMinutes().toString().padStart(2, '0')
  const ampm = d.getHours() < 12 ? 'AM' : 'PM'
  return `${toBnNum(h)}:${m.split('').map(c => BN_DIGITS[+c] ?? c).join('')} ${ampm}`
}

// ── Bangla (Bengali solar) calendar ──────────────────────────────────────────
const BANGLA_MONTHS_BN = [
  'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন',
  'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র',
]

// [gregMonth, gregDay] when each Bangla month starts (Bangladesh official calendar)
const BANGLA_STARTS: [number, number][] = [
  [4, 14], [5, 15], [6, 16], [7, 16], [8, 16], [9, 16],
  [10, 16], [11, 15], [12, 15], [1, 14], [2, 13], [3, 14],
]

export function toBanglaDate(date: Date): { day: number; monthBn: string; year: number; monthIdx: number } {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()

  // Remap months so Bangla year (starting April) runs 4→15 instead of wrapping at 12
  const seq = (gm: number) => (gm < 4 ? gm + 12 : gm)
  const seqM = seq(m)

  let banglaMonthIdx = 0
  let startYear = y
  let startMonth = 4
  let startDay = 14

  for (let i = BANGLA_STARTS.length - 1; i >= 0; i--) {
    const [sm, sd] = BANGLA_STARTS[i]
    const seqSM = seq(sm)
    if (seqM > seqSM || (seqM === seqSM && d >= sd)) {
      banglaMonthIdx = i
      // The matched start month can fall in the previous Gregorian year (e.g. today
      // is Jan 5, but the active Bangla month পৌষ started the previous December).
      startYear = sm > m ? y - 1 : y
      startMonth = sm
      startDay = sd
      break
    }
  }

  // Day-of-month subtraction (d - sd) only works when today and the start date
  // share a Gregorian month; otherwise it crosses a month boundary and goes
  // negative. Diff actual dates instead so the month length is accounted for.
  const banglaDay = Math.round(
    (Date.UTC(y, m - 1, d) - Date.UTC(startYear, startMonth - 1, startDay)) / 86400000
  ) + 1

  const banglaYear = m >= 4 ? y - 593 : y - 594
  return { day: banglaDay, monthBn: BANGLA_MONTHS_BN[banglaMonthIdx], year: banglaYear, monthIdx: banglaMonthIdx }
}

export function countdownText(target: Date, now: Date): string {
  let diff = target.getTime() - now.getTime()
  if (diff < 0) diff += 86400000
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 0) return `${toBnNum(h)} ঘণ্টা ${toBnNum(m)} মিনিট বাকি`
  return `${toBnNum(m)} মিনিট বাকি`
}
