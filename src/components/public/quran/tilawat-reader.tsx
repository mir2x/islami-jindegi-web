'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, X, Copy, Share2, Bookmark, BookOpenText, Settings, Type } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { QuranSurahDetail, QuranSurah } from '@/types'
import { TafsirModal } from './tafsir-modal'
import { isBookmarked, toggleBookmark } from '@/lib/quran-bookmarks'
import { setLastRead } from '@/lib/quran-last-read'
import { ARABIC_FONTS, ARABIC_FONT_KEY, arabicFontFamily as resolveArabicFont } from '@/lib/quran-fonts'
import { bn } from '@/lib/bengali-numerals'

const ARABIC_SIZE_KEY = 'quran_arabic_font_size'
const ARABIC_SIZE_MIN = 22
const ARABIC_SIZE_MAX = 48
const ARABIC_SIZE_DEFAULT = 30

interface Props {
  surah: QuranSurahDetail
  allSurahs: QuranSurah[]
}

export function TilawatReader({ surah, allSurahs }: Props) {
  const [selectedAyah, setSelectedAyah] = useState<number | null>(null)
  const [tafsirAyah, setTafsirAyah] = useState<number | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)

  const [arabicFontKey, setArabicFontKey] = useState(() =>
    (typeof window !== 'undefined' && localStorage.getItem(ARABIC_FONT_KEY)) || ARABIC_FONTS[0].key
  )
  const [arabicSize, setArabicSize] = useState(() => {
    const saved = typeof window !== 'undefined' ? Number(localStorage.getItem(ARABIC_SIZE_KEY)) : NaN
    return saved >= ARABIC_SIZE_MIN && saved <= ARABIC_SIZE_MAX ? saved : ARABIC_SIZE_DEFAULT
  })
  const arabicFontFamily = resolveArabicFont(arabicFontKey)

  useEffect(() => { localStorage.setItem(ARABIC_FONT_KEY, arabicFontKey) }, [arabicFontKey])
  useEffect(() => { localStorage.setItem(ARABIC_SIZE_KEY, String(arabicSize)) }, [arabicSize])

  useEffect(() => {
    if (selectedAyah !== null) setBookmarked(isBookmarked(surah.surahNumber, selectedAyah))
  }, [selectedAyah, surah.surahNumber])

  useEffect(() => {
    setLastRead({ surahNumber: surah.surahNumber, surahName: surah.nameBengali, ayahNumber: 1 })
  }, [surah.surahNumber, surah.nameBengali])

  const prevSurah = surah.surahNumber > 1 ? allSurahs.find(s => s.number === surah.surahNumber - 1) : null
  const nextSurah = surah.surahNumber < 114 ? allSurahs.find(s => s.number === surah.surahNumber + 1) : null
  const selected = selectedAyah !== null ? surah.ayahs.find(a => a.number === selectedAyah) ?? null : null

  function handleCopy() {
    if (!selected) return
    navigator.clipboard.writeText(selected.arabic)
  }

  function handleShare() {
    if (!selected) return
    if (navigator.share) navigator.share({ text: selected.arabic })
    else navigator.clipboard.writeText(window.location.href)
  }

  function handleBookmarkToggle() {
    if (!selected) return
    setBookmarked(toggleBookmark({
      surahNumber: surah.surahNumber, ayahNumber: selected.number,
      surahName: surah.nameBengali, arabic: selected.arabic,
    }))
  }

  return (
    <div className="flex flex-col bg-background h-svh">
      {/* Top bar */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-background z-10">
        <Link href="/quran?mode=tilawat" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-foreground text-base leading-tight truncate">{surah.nameBengali}</h1>
          <p className="text-xs text-muted-foreground">তিলাওয়াত মোড · {bn(surah.totalAyahs)} আয়াত</p>
        </div>
        <Link
          href={`/quran/surah/${surah.surahNumber}`}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="সূরা মোডে দেখুন"
        >
          <BookOpen className="w-5 h-5" />
        </Link>
        <button
          onClick={() => setShowSettings(s => !s)}
          className={cn('p-1.5 rounded-lg transition-colors', showSettings ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted')}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {showSettings && (
        <div className="shrink-0 border-b border-border bg-muted/30 px-4 py-4">
          <div className="max-w-2xl mx-auto space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">আরবী ফন্ট</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {ARABIC_FONTS.map(f => (
                <button
                  key={f.key}
                  onClick={() => setArabicFontKey(f.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm transition-colors',
                    arabicFontKey === f.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted border border-border text-muted-foreground hover:text-foreground'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Type className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <button
                onClick={() => setArabicSize(s => Math.max(ARABIC_SIZE_MIN, s - 2))}
                className="w-7 h-7 rounded-lg bg-muted border border-border text-foreground hover:bg-muted/70 transition-colors"
              >−</button>
              <span className="text-xs text-muted-foreground w-8 text-center tabular-nums">{bn(arabicSize)}</span>
              <button
                onClick={() => setArabicSize(s => Math.min(ARABIC_SIZE_MAX, s + 2))}
                className="w-7 h-7 rounded-lg bg-muted border border-border text-foreground hover:bg-muted/70 transition-colors"
              >+</button>
            </div>
          </div>
        </div>
      )}

      {/* Continuous flowing text — a simplified analog of the app's ruled-line tilawat
          pagination: no attempt at print-accurate page breaks, just uninterrupted
          justified RTL flow with inline ayah-number markers. */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-8 py-10">
          {surah.surahNumber !== 1 && surah.surahNumber !== 9 && (
            <p className="text-center text-xl text-foreground mb-8" style={{ fontFamily: arabicFontFamily, direction: 'rtl' }}>
              بِسۡمِ اللّٰہِ الرَّحۡمٰنِ الرَّحِیۡمِ
            </p>
          )}
          <p
            dir="rtl"
            className="text-justify leading-[2.6]"
            style={{ fontFamily: arabicFontFamily, direction: 'rtl', fontSize: `${arabicSize}px` }}
          >
            {surah.ayahs.map(ayah => (
              <span key={ayah.number}>
                {ayah.arabic}{' '}
                <button
                  onClick={() => setSelectedAyah(ayah.number)}
                  className="inline-flex items-center justify-center w-7 h-7 mx-1 rounded-full bg-muted text-primary text-xs font-bold align-middle hover:bg-primary/20 transition-colors"
                  style={{ fontFamily: 'sans-serif' }}
                >
                  {bn(ayah.number)}
                </button>{' '}
              </span>
            ))}
          </p>
        </div>

        {/* Prev / Next surah */}
        <div className="max-w-3xl mx-auto w-full px-4 pb-10 grid grid-cols-2 gap-3">
          {prevSurah ? (
            <Link
              href={`/quran/tilawat/${prevSurah.number}`}
              className="flex items-center gap-2 p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">আগের সূরা</p>
                <p className="text-sm font-semibold truncate">{prevSurah.nameBengali}</p>
              </div>
            </Link>
          ) : <div />}
          {nextSurah && (
            <Link
              href={`/quran/tilawat/${nextSurah.number}`}
              className="flex items-center justify-end gap-2 p-3.5 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <div className="min-w-0 text-right">
                <p className="text-xs text-muted-foreground">পরের সূরা</p>
                <p className="text-sm font-semibold truncate">{nextSurah.nameBengali}</p>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Ayah action sheet */}
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={() => setSelectedAyah(null)} />
          <div className="relative w-full sm:max-w-md sm:mb-6 sm:rounded-2xl bg-background border border-border shadow-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">আয়াত {bn(selected.number)}</p>
              <button onClick={() => setSelectedAyah(null)} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleCopy} className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl bg-muted hover:bg-muted/70 transition-colors text-xs text-muted-foreground">
                <Copy className="w-4 h-4" /> কপি
              </button>
              <button onClick={handleShare} className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl bg-muted hover:bg-muted/70 transition-colors text-xs text-muted-foreground">
                <Share2 className="w-4 h-4" /> শেয়ার
              </button>
              <button
                onClick={handleBookmarkToggle}
                className={cn(
                  'flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl transition-colors text-xs',
                  bookmarked ? 'bg-primary/10 text-primary' : 'bg-muted hover:bg-muted/70 text-muted-foreground'
                )}
              >
                <Bookmark className={cn('w-4 h-4', bookmarked && 'fill-current')} /> বুকমার্ক
              </button>
              <button
                onClick={() => { setTafsirAyah(selected.number); setSelectedAyah(null) }}
                className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl bg-muted hover:bg-muted/70 transition-colors text-xs text-muted-foreground"
              >
                <BookOpenText className="w-4 h-4" /> তাফসীর
              </button>
            </div>
          </div>
        </div>
      )}

      {tafsirAyah !== null && (
        <TafsirModal
          surahNumber={surah.surahNumber}
          surahName={surah.nameBengali}
          ayahNumber={tafsirAyah}
          onClose={() => setTafsirAyah(null)}
        />
      )}
    </div>
  )
}
