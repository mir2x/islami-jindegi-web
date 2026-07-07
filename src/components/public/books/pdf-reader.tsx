'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import {
  ArrowLeft, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, Download, Maximize, Minimize, BookOpen, AlignLeft,
  Square, Columns, LayoutList, BookMarked,
} from 'lucide-react'
import type { BookDetail } from '@/types'
import { cn } from '@/lib/utils'

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

type LayoutMode = 'single' | 'double'
type NavMode = 'continuous' | 'flip'

interface Props {
  book: BookDetail
  pdfUrl: string
  onSwitchToText?: () => void
}

const ZOOM_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5, 3.0]
const SCROLL_BUFFER = 3

export function PdfReader({ book, pdfUrl, onSwitchToText }: Props) {
  const [numPages, setNumPages] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [scaleIdx, setScaleIdx] = useState(2)
  const [pageInputValue, setPageInputValue] = useState('1')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('single')
  const [navMode, setNavMode] = useState<NavMode>('flip')
  const [vpSize, setVpSize] = useState({ w: 0, h: 0 })
  const [scrollRendered, setScrollRendered] = useState<Set<number>>(new Set([1, 2, 3]))

  const viewportRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollPageRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollObserversRef = useRef<IntersectionObserver[]>([])

  const scale = ZOOM_STEPS[scaleIdx]
  const proxiedUrl = `/api/pdf?url=${encodeURIComponent(pdfUrl)}`

  // ── Measure viewport ──────────────────────────────────────
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setVpSize({ w: entry.contentRect.width, h: entry.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Keyboard navigation ────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      const step = layoutMode === 'double' ? 2 : 1
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        if (navMode !== 'continuous') setPageNumber(p => Math.max(1, p - step))
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        if (navMode !== 'continuous') setPageNumber(p => Math.min(numPages, p + step))
      } else if (e.key === '+' || e.key === '=') {
        setScaleIdx(i => Math.min(ZOOM_STEPS.length - 1, i + 1))
      } else if (e.key === '-') {
        setScaleIdx(i => Math.max(0, i - 1))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [numPages, layoutMode, navMode])

  useEffect(() => { setPageInputValue(String(pageNumber)) }, [pageNumber])

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  // ── Continuous mode: lazy render + page tracking ──────────
  useEffect(() => {
    if (navMode !== 'continuous' || numPages === 0) return

    scrollObserversRef.current.forEach(o => o.disconnect())
    scrollObserversRef.current = []

    scrollPageRefs.current.slice(0, numPages).forEach((el, i) => {
      if (!el) return
      const pNum = i + 1

      const obs = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return
        if (entry.intersectionRatio >= 0.3) setPageNumber(pNum)
        setScrollRendered(prev => {
          const next = new Set(prev)
          for (let j = Math.max(1, pNum - SCROLL_BUFFER); j <= Math.min(numPages, pNum + SCROLL_BUFFER); j++) {
            next.add(j)
          }
          if ([...next].every(x => prev.has(x))) return prev
          return next
        })
      }, { rootMargin: '400px 0px', threshold: [0, 0.3] })

      obs.observe(el)
      scrollObserversRef.current.push(obs)
    })

    return () => {
      scrollObserversRef.current.forEach(o => o.disconnect())
      scrollObserversRef.current = []
    }
  }, [navMode, numPages])

  const onLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n)
  }, [])

  // ── Navigation ────────────────────────────────────────────
  const step = layoutMode === 'double' ? 2 : 1
  const prevPage = () => setPageNumber(p => Math.max(1, p - step))
  const nextPage = () => setPageNumber(p => Math.min(numPages, p + step))
  const zoomOut = () => setScaleIdx(i => Math.max(0, i - 1))
  const zoomIn = () => setScaleIdx(i => Math.min(ZOOM_STEPS.length - 1, i + 1))

  const commitPageInput = () => {
    const n = parseInt(pageInputValue, 10)
    if (!isNaN(n) && n >= 1 && n <= numPages) {
      setPageNumber(n)
      if (navMode === 'continuous') {
        scrollPageRefs.current[n - 1]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    } else {
      setPageInputValue(String(pageNumber))
    }
  }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement && containerRef.current) {
      await containerRef.current.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  }

  const switchNavMode = (mode: NavMode) => {
    if (mode === 'continuous') {
      setScrollRendered(new Set(
        Array.from({ length: SCROLL_BUFFER * 2 + 1 }, (_, i) =>
          Math.max(1, Math.min(numPages || 999, pageNumber - SCROLL_BUFFER + i))
        )
      ))
    }
    setNavMode(mode)
  }

  const switchLayoutMode = (mode: LayoutMode) => {
    if (mode === 'double' && pageNumber % 2 === 0) {
      setPageNumber(p => Math.max(1, p - 1))
    }
    setLayoutMode(mode)
  }

  // ── Derived dimensions ─────────────────────────────────────
  const fitH = vpSize.h > 0 ? (vpSize.h - 48) * scale : undefined
  const estimatedW = fitH ? fitH * 0.707 : 300

  const leftPage = pageNumber % 2 === 0 ? pageNumber - 1 : pageNumber
  const rightPage = leftPage + 1

  // ── Render ────────────────────────────────────────────────
  return (
    <div ref={containerRef} className="flex flex-col bg-background overflow-hidden h-screen">

      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-border bg-background shrink-0 flex-wrap gap-y-2">

        {/* Back / switch to text */}
        {onSwitchToText ? (
          <button onClick={onSwitchToText} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0 mr-1">
            <AlignLeft className="w-4 h-4" />
            <span className="hidden sm:inline">পাঠ্য</span>
          </button>
        ) : (
          <Link href="/books" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0 mr-1">
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">কিতাব</span>
          </Link>
        )}

        {/* Book info */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {book.coverUrl ? (
            <div className="w-7 h-9 relative shrink-0 rounded overflow-hidden shadow-sm">
              <Image src={book.coverUrl} alt={book.title} fill className="object-cover" sizes="28px" />
            </div>
          ) : (
            <div className="w-7 h-9 shrink-0 rounded bg-primary/10 flex items-center justify-center text-primary">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{book.title}</p>
            {book.authors[0] && <p className="text-xs text-muted-foreground truncate">{book.authors[0].name}</p>}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-0.5 shrink-0">

          {/* Layout: single / double */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <ModeBtn active={layoutMode === 'single'} onClick={() => switchLayoutMode('single')} title="একক পৃষ্ঠা">
              <Square className="w-3.5 h-3.5" />
            </ModeBtn>
            <ModeBtn active={layoutMode === 'double'} onClick={() => switchLayoutMode('double')} title="দুই পৃষ্ঠা">
              <Columns className="w-3.5 h-3.5" />
            </ModeBtn>
          </div>

          {/* Nav: continuous / flip */}
          <div className="flex items-center border border-border rounded-lg overflow-hidden ml-1">
            <ModeBtn active={navMode === 'continuous'} onClick={() => switchNavMode('continuous')} title="ক্রমাগত স্ক্রল">
              <LayoutList className="w-3.5 h-3.5" />
            </ModeBtn>
            <ModeBtn active={navMode === 'flip'} onClick={() => switchNavMode('flip')} title="পাতা উল্টানো">
              <BookMarked className="w-3.5 h-3.5" />
            </ModeBtn>
          </div>

          <Divider />

          {/* Zoom */}
          <ToolBtn onClick={zoomOut} disabled={scaleIdx === 0} title="জুম আউট (-)">
            <ZoomOut className="w-4 h-4" />
          </ToolBtn>
          <button
            onClick={() => setScaleIdx(2)}
            className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors min-w-[3rem] text-center tabular-nums"
            title="রিসেট করুন"
          >
            {Math.round(scale * 100)}%
          </button>
          <ToolBtn onClick={zoomIn} disabled={scaleIdx === ZOOM_STEPS.length - 1} title="জুম ইন (+)">
            <ZoomIn className="w-4 h-4" />
          </ToolBtn>

          <Divider />

          {/* Page nav */}
          <ToolBtn onClick={prevPage} disabled={pageNumber <= 1} title="আগের পাতা (←)">
            <ChevronLeft className="w-4 h-4" />
          </ToolBtn>
          <div className="flex items-center gap-1 text-sm">
            <input
              type="text"
              value={pageInputValue}
              onChange={e => setPageInputValue(e.target.value)}
              onBlur={commitPageInput}
              onKeyDown={e => { if (e.key === 'Enter') commitPageInput() }}
              className="w-10 text-center rounded-md border border-border bg-muted text-foreground text-xs py-1 focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="পাতা নম্বর"
            />
            <span className="text-muted-foreground text-xs whitespace-nowrap">/ {numPages || '—'}</span>
          </div>
          <ToolBtn onClick={nextPage} disabled={pageNumber >= numPages || numPages === 0} title="পরের পাতা (→)">
            <ChevronRight className="w-4 h-4" />
          </ToolBtn>

          <Divider />

          {/* Download */}
          <a href={pdfUrl} download className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="ডাউনলোড">
            <Download className="w-4 h-4" />
          </a>

          {/* Fullscreen */}
          <ToolBtn onClick={toggleFullscreen} title={isFullscreen ? 'সাধারণ দেখুন' : 'পূর্ণ পর্দা'}>
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </ToolBtn>
        </div>
      </div>

      {/* ── PDF viewport ─────────────────────────────────────── */}
      <div
        ref={viewportRef}
        className={cn(
          'flex-1 relative',
          navMode === 'continuous'
            ? 'overflow-auto bg-muted/20 dark:bg-muted/10'
            : 'overflow-hidden bg-muted/20 dark:bg-muted/10 flex items-center justify-center'
        )}
      >
        <Document
          file={proxiedUrl}
          onLoadSuccess={onLoadSuccess}
          loading={<PdfLoading />}
          error={<PdfError url={pdfUrl} />}
          className={cn(
            navMode === 'continuous'
              ? 'flex flex-col items-center gap-4 py-6 px-4 w-full'
              : 'flex flex-col items-center py-6 px-4'
          )}
        >

          {/* ─ Flip mode ─ */}
          {navMode === 'flip' && fitH !== undefined && (
            layoutMode === 'single' ? (
              <Page
                pageNumber={pageNumber}
                height={fitH}
                renderTextLayer
                renderAnnotationLayer
                className="shadow-xl rounded-lg overflow-hidden"
                loading={
                  <div className="bg-card rounded-lg shadow-xl animate-pulse" style={{ height: fitH, width: fitH * 0.707 }} />
                }
              />
            ) : (
              <div className="flex items-start gap-2 sm:gap-4">
                <Page
                  pageNumber={leftPage}
                  height={fitH}
                  renderTextLayer
                  renderAnnotationLayer
                  className="shadow-xl rounded-r overflow-hidden"
                  loading={<div className="bg-card rounded shadow-xl animate-pulse" style={{ height: fitH, width: estimatedW }} />}
                />
                {rightPage <= numPages && (
                  <Page
                    pageNumber={rightPage}
                    height={fitH}
                    renderTextLayer
                    renderAnnotationLayer
                    className="shadow-xl rounded-l overflow-hidden"
                    loading={<div className="bg-card rounded shadow-xl animate-pulse" style={{ height: fitH, width: estimatedW }} />}
                  />
                )}
              </div>
            )
          )}

          {/* ─ Continuous scroll ─ */}
          {navMode === 'continuous' && fitH !== undefined && numPages > 0 &&
            Array.from({ length: numPages }, (_, i) => {
              const pNum = i + 1
              return (
                <div
                  key={pNum}
                  ref={el => { scrollPageRefs.current[i] = el }}
                  style={{ minHeight: fitH }}
                  className="flex items-center justify-center w-full"
                >
                  {scrollRendered.has(pNum) ? (
                    <Page
                      pageNumber={pNum}
                      height={fitH}
                      renderTextLayer
                      renderAnnotationLayer
                      className="shadow-xl rounded-lg overflow-hidden"
                      loading={
                        <div className="bg-card rounded-lg shadow-xl animate-pulse" style={{ height: fitH, width: estimatedW }} />
                      }
                    />
                  ) : (
                    <div className="rounded-lg bg-card/40" style={{ height: fitH, width: estimatedW }} />
                  )}
                </div>
              )
            })
          }
        </Document>

        {/* ─ Flip click zones ─ */}
        {navMode === 'flip' && numPages > 0 && (
          <>
            <button
              onClick={prevPage}
              disabled={pageNumber <= 1}
              aria-label="আগের পাতা"
              className="absolute left-0 top-0 h-full w-[15%] flex items-center justify-start pl-3 group disabled:pointer-events-none"
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-full p-2">
                <ChevronLeft className="w-6 h-6 text-white drop-shadow" />
              </div>
            </button>
            <button
              onClick={nextPage}
              disabled={pageNumber >= numPages}
              aria-label="পরের পাতা"
              className="absolute right-0 top-0 h-full w-[15%] flex items-center justify-end pr-3 group disabled:pointer-events-none"
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-full p-2">
                <ChevronRight className="w-6 h-6 text-white drop-shadow" />
              </div>
            </button>
          </>
        )}
      </div>

      {/* ── Mobile bottom nav (flip only) ───────────────────── */}
      {navMode === 'flip' && (
        <div className="lg:hidden flex items-center justify-between px-5 py-3 border-t border-border bg-background shrink-0">
          <button
            onClick={prevPage}
            disabled={pageNumber <= 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted text-sm font-medium disabled:opacity-40 hover:bg-muted/70 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> আগের
          </button>
          <span className="text-sm text-muted-foreground tabular-nums">
            {layoutMode === 'double' ? `${leftPage}–${Math.min(rightPage, numPages)}` : pageNumber} / {numPages || '—'}
          </span>
          <button
            onClick={nextPage}
            disabled={pageNumber >= numPages || numPages === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-muted text-sm font-medium disabled:opacity-40 hover:bg-muted/70 transition-colors"
          >
            পরের <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function ToolBtn({ children, onClick, disabled, title }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

function ModeBtn({ children, active, onClick, title }: {
  children: React.ReactNode; active: boolean; onClick: () => void; title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-1" />
}

function PdfLoading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-sm">পিডিএফ লোড হচ্ছে...</p>
    </div>
  )
}

function PdfError({ url }: { url: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center max-w-sm mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground/40">
        <BookOpen className="w-8 h-8" />
      </div>
      <div>
        <p className="text-lg font-semibold text-foreground">পিডিএফ লোড হয়নি</p>
        <p className="text-sm text-muted-foreground mt-1">ফাইলটি সঠিকভাবে লোড করা যায়নি।</p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Download className="w-4 h-4" /> সরাসরি ডাউনলোড করুন
      </a>
    </div>
  )
}
