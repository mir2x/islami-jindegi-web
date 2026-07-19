// Mirrors the font choices in islami-jindegi-app's font_change_dialog.dart, backed by the
// same font files (copied into public/fonts/, declared in globals.css).

export interface FontOption {
  key: string
  label: string
  family: string
  isDefault?: boolean
}

// `label` is the font's proper name (not translated). Consumers append a localized
// "(Default)" suffix themselves for the entry with `isDefault: true`.
export const ARABIC_FONTS: FontOption[] = [
  { key: 'noorehuda', label: 'Noorehuda', family: '"Noorehuda", serif', isDefault: true },
  { key: 'al-mushaf', label: 'Al Mushaf Quran', family: '"AlMushafQuran", serif' },
  { key: 'al-qalam-kolkatta', label: 'Al Qalam Kolkatta Quranic', family: '"AlQalamKolkatta", serif' },
  { key: 'al-qalam-quran', label: 'Al Qalam Quran', family: '"AlQalamQuran", serif' },
  { key: 'al-qalam-quran-majeed', label: 'Al Qalam Quran Majeed', family: '"AlQalamQuranMajeed", serif' },
  { key: 'uthman', label: 'Uthman', family: '"Uthman", serif' },
  { key: 'uthmani', label: 'Uthmani', family: '"Uthmani", serif' },
  { key: 'me-quran', label: 'Me-Quran', family: '"MeQuran", serif' },
  { key: 'kitab', label: 'Kitab', family: '"Kitab", serif' },
]

export const BENGALI_FONTS: FontOption[] = [
  { key: 'solaimanlipi', label: 'SolaimanLipi', family: '"SolaimanLipi", sans-serif', isDefault: true },
  { key: 'kalpurush', label: 'Kalpurush', family: '"Kalpurush", sans-serif' },
  { key: 'noto-sans-bengali', label: 'Noto Sans Bengali', family: '"NotoSansBengali", sans-serif' },
  { key: 'siyamrupali', label: 'Siyam Rupali', family: '"SiyamRupali", sans-serif' },
  { key: 'bensenhandwriting', label: 'Ben Sen Handwriting', family: '"BenSenHandwriting", sans-serif' },
]

export const DEFAULT_ARABIC_FONT = ARABIC_FONTS[0].family
export const DEFAULT_BENGALI_FONT = BENGALI_FONTS[0].family

// Font choices are stored per-family under these keys, shared by the Quran readers
// and the /settings page — keep reads/writes going through here so they stay in sync.
export const ARABIC_FONT_KEY = 'quran_arabic_font_family'
export const BENGALI_FONT_KEY = 'quran_bengali_font_family'

export function getArabicFontKey(): string {
  if (typeof window === 'undefined') return ARABIC_FONTS[0].key
  return localStorage.getItem(ARABIC_FONT_KEY) || ARABIC_FONTS[0].key
}

export function getBengaliFontKey(): string {
  if (typeof window === 'undefined') return BENGALI_FONTS[0].key
  return localStorage.getItem(BENGALI_FONT_KEY) || BENGALI_FONTS[0].key
}

export function arabicFontFamily(key: string): string {
  return ARABIC_FONTS.find(f => f.key === key)?.family ?? DEFAULT_ARABIC_FONT
}

export function bengaliFontFamily(key: string): string {
  return BENGALI_FONTS.find(f => f.key === key)?.family ?? DEFAULT_BENGALI_FONT
}
