'use client'

import { useState, useEffect } from 'react'
import { X, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import type { QuranAyahDetail, QuranTafsir } from '@/types'
import { bn } from '@/lib/bengali-numerals'

interface Props {
  surahNumber: number
  surahName: string
  ayahNumber: number
  onClose: () => void
}

export function TafsirModal({ surahNumber, surahName, ayahNumber, onClose }: Props) {
  const [tafsirs, setTafsirs] = useState<QuranTafsir[] | null>(null)
  const [error, setError] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setTafsirs(null)
    setError(false)
    setOpenId(null)

    api.get<QuranAyahDetail>(`/api/quran/surahs/${surahNumber}/ayahs/${ayahNumber}?tafsirs=all&translations=none&words=false`)
      .then(res => {
        if (cancelled) return
        setTafsirs(res.tafsirs)
        setOpenId(res.tafsirs[0]?.id ?? null)
      })
      .catch(() => { if (!cancelled) setError(true) })

    return () => { cancelled = true }
  }, [surahNumber, ayahNumber])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" onClick={onClose} />

      <div className="relative w-full sm:max-w-2xl sm:mx-4 max-h-[85vh] flex flex-col bg-background rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-3.5 border-b border-border">
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">তাফসীর</p>
            <p className="text-xs text-muted-foreground truncate">{surahName} · আয়াত {bn(ayahNumber)}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {error && (
            <p className="text-center text-sm text-destructive py-12">তাফসীর লোড করা যায়নি। আবার চেষ্টা করুন।</p>
          )}

          {!error && tafsirs === null && (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <p className="text-sm">তাফসীর লোড হচ্ছে…</p>
            </div>
          )}

          {!error && tafsirs !== null && tafsirs.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-12">এই আয়াতের জন্য কোনো তাফসীর পাওয়া যায়নি।</p>
          )}

          {!error && tafsirs !== null && tafsirs.map(t => {
            const isOpen = openId === t.id
            return (
              <div key={t.id} className="border-b border-border/60 last:border-0">
                <button
                  onClick={() => setOpenId(isOpen ? null : t.id)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-semibold text-foreground">{t.name}</span>
                  <ChevronDown className={cn('w-4 h-4 text-muted-foreground shrink-0 transition-transform', isOpen && 'rotate-180')} />
                </button>
                {isOpen && (
                  <p className="px-4 pb-4 text-[15px] leading-relaxed text-muted-foreground whitespace-pre-line">
                    {t.text}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
