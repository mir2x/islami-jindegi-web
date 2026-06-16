import {
  Coordinates,
  CalculationMethod,
  PrayerTimes,
  Madhab,
  Prayer,
} from 'adhan'

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

const OFFSETS = {
  fajrAdjust: 5,
  maghribAdjust: 3,
}

function buildParams() {
  const p = CalculationMethod.Karachi()
  p.madhab = Madhab.Hanafi
  p.adjustments.fajr = OFFSETS.fajrAdjust
  p.adjustments.maghrib = OFFSETS.maghribAdjust
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
  'মুহাররম', 'সফর', 'রবিউল আউয়াল', 'রবিউল আখির',
  'জমাদিউল আউয়াল', 'জমাদিউল আখির', 'রজব', 'শাবান',
  'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ',
]

export function toHijri(date: Date): { day: number; month: number; year: number; monthBn: string } {
  const jd = Math.floor(date.getTime() / 86400000) + 2440588
  const L = jd - 1948440 + 10632
  const N = Math.floor((L - 1) / 10631)
  const L2 = L - 10631 * N + 354
  const J =
    Math.floor((10985 - L2) / 5316) * Math.floor((50 * L2) / 17719) +
    Math.floor(L2 / 5670) * Math.floor((43 * L2) / 15238)
  const L3 =
    L2 -
    Math.floor((30 - J) / 15) * Math.floor((17719 * J) / 50) -
    Math.floor(J / 16) * Math.floor((15238 * J) / 43) +
    29
  const month = Math.floor((24 * L3) / 709)
  const day = L3 - Math.floor((709 * month) / 24)
  const year = 30 * N + J - 30
  return { day, month, year, monthBn: HIJRI_MONTHS_BN[month - 1] ?? '' }
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

export function toBanglaDate(date: Date): { day: number; monthBn: string; year: number } {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()

  // Remap months so Bangla year (starting April) runs 4→15 instead of wrapping at 12
  const seq = (gm: number) => (gm < 4 ? gm + 12 : gm)
  const seqM = seq(m)

  let banglaMonthIdx = 0
  let banglaDay = 1

  for (let i = BANGLA_STARTS.length - 1; i >= 0; i--) {
    const [sm, sd] = BANGLA_STARTS[i]
    const seqSM = seq(sm)
    if (seqM > seqSM || (seqM === seqSM && d >= sd)) {
      banglaMonthIdx = i
      banglaDay = d - sd + 1
      break
    }
  }

  const banglaYear = m >= 4 ? y - 593 : y - 594
  return { day: banglaDay, monthBn: BANGLA_MONTHS_BN[banglaMonthIdx], year: banglaYear }
}

export function countdownText(target: Date, now: Date): string {
  let diff = target.getTime() - now.getTime()
  if (diff < 0) diff += 86400000
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 0) return `${toBnNum(h)} ঘণ্টা ${toBnNum(m)} মিনিট বাকি`
  return `${toBnNum(m)} মিনিট বাকি`
}
