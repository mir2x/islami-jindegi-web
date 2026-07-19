'use client'

import { useState, useRef, useCallback } from 'react'
import {
  Play, Pause, Download, MapPin, Calendar,
  Clock, Share2, Mic, Check,
} from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import type { BayanListItem } from '@/types'

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDate(d: string, locale: string) {
  return new Date(d).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface Props {
  bayan: BayanListItem
  className?: string
}

export function BayanPlayerCard({ bayan, className }: Props) {
  const t = useTranslations('BayanDetail')
  const locale = useLocale()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [audioError, setAudioError] = useState(false)
  const [copied, setCopied] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<HTMLDivElement | null>(null)

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => setAudioError(true))
    }
  }

  const seek = useCallback((clientX: number) => {
    const el = progressRef.current
    const audio = audioRef.current
    if (!el || !audio || !duration) return
    const rect = el.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    audio.currentTime = ratio * duration
    setCurrentTime(audio.currentTime)
  }, [duration])

  const handleShare = async () => {
    const url = `${window.location.origin}/bayan/${bayan.id}`
    if (navigator.share) {
      try { await navigator.share({ title: bayan.title, url }); return } catch { /* fall through */ }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const progressPct = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className={className}>
      {bayan.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {bayan.categories.map(c => (
            <span key={c.id} className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {c.title}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-snug">{bayan.title}</h1>
        <button
          onClick={handleShare}
          className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={t('share')}
        >
          {copied ? <Check className="w-4.5 h-4.5 text-primary" /> : <Share2 className="w-4.5 h-4.5" />}
        </button>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Mic className="w-3.5 h-3.5" />
        </div>
        <span className="font-medium text-foreground">{bayan.author.name}</span>
      </div>

      {bayan.excerpt && (
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{bayan.excerpt}</p>
      )}

      {bayan.audioUrl ? (
        <div className="mt-7">
          <audio
            ref={audioRef}
            src={bayan.audioUrl}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
            onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
            onError={() => setAudioError(true)}
          />

          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="w-14 h-14 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity shadow-sm"
            >
              {isPlaying ? <Pause className="w-5.5 h-5.5" /> : <Play className="w-5.5 h-5.5 ml-0.5" />}
            </button>

            <div className="flex-1 min-w-0">
              <div
                ref={progressRef}
                onClick={e => seek(e.clientX)}
                className="relative h-2 rounded-full bg-muted cursor-pointer group"
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width]"
                  style={{ width: `${progressPct}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 rounded-full bg-primary shadow opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `${progressPct}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5 text-xs text-muted-foreground tabular-nums">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {audioError && (
            <p className="text-xs text-destructive mt-3">{t('audioError')}</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mt-7">{t('noAudio')}</p>
      )}

      {/* Meta info */}
      <div className="mt-7 pt-6 border-t border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        {bayan.location && (
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">{t('location')}</p>
              <p className="text-foreground font-medium">{bayan.location}</p>
            </div>
          </div>
        )}
        <div className="flex items-start gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">{t('date')}</p>
            <p className="text-foreground font-medium">{formatDate(bayan.publishedAt, locale)}</p>
          </div>
        </div>
        {duration > 0 && (
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-muted-foreground">{t('audioDuration')}</p>
              <p className="text-foreground font-medium">{formatTime(duration)}</p>
            </div>
          </div>
        )}
      </div>

      {bayan.audioUrl && (
        <a
          href={bayan.audioUrl}
          download
          className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          <Download className="w-4 h-4" /> {t('download')}
        </a>
      )}
    </div>
  )
}

// re-export helper for consumers that need consistent date formatting
export { formatDate as formatBayanDate }
