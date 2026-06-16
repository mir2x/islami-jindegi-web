'use client'

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, ZoomIn, ZoomOut, BookOpen, X,
  ChevronLeft, ChevronRight, List,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MushafEdition, AyahBox } from '@/types'

// ─── Static data ──────────────────────────────────────────────────────────────

const SURA_NAMES = [
  'আল-ফাতিহা', 'আল-বাকারা', 'আলে-ইমরান', 'আন-নিসা', 'আল-মায়েদা',
  'আল-আনআম', 'আল-আরাফ', 'আল-আনফাল', 'আত-তাওবা', 'ইউনুস',
  'হুদ', 'ইউসুফ', 'আর-রাদ', 'ইবরাহীম', 'আল-হিজর',
  'আন-নাহল', 'আল-ইসরা', 'আল-কাহফ', 'মারইয়াম', 'ত্বাহা',
  'আল-আম্বিয়া', 'আল-হাজ্জ', 'আল-মুমিনুন', 'আন-নুর', 'আল-ফুরকান',
  'আশ-শুআরা', 'আন-নামল', 'আল-কাসাস', 'আল-আনকাবুত', 'আর-রুম',
  'লুকমান', 'আস-সাজদা', 'আল-আহযাব', 'সাবা', 'ফাতির',
  'ইয়া-সীন', 'আস-সাফফাত', 'সাদ', 'আয-যুমার', 'গাফির',
  'ফুসসিলাত', 'আশ-শুরা', 'আয-যুখরুফ', 'আদ-দুখান', 'আল-জাসিয়া',
  'আল-আহকাফ', 'মুহাম্মদ', 'আল-ফাতহ', 'আল-হুজুরাত', 'কাফ',
  'আয-যারিয়াত', 'আত-তুর', 'আন-নাজম', 'আল-কামার', 'আর-রাহমান',
  'আল-ওয়াকিয়া', 'আল-হাদীদ', 'আল-মুজাদিলা', 'আল-হাশর', 'আল-মুমতাহিনা',
  'আস-সাফ', 'আল-জুমুআ', 'আল-মুনাফিকুন', 'আত-তাগাবুন', 'আত-তালাক',
  'আত-তাহরীম', 'আল-মুলক', 'আল-কালাম', 'আল-হাক্কা', 'আল-মাআরিজ',
  'নুহ', 'আল-জিন', 'আল-মুযযাম্মিল', 'আল-মুদ্দাসসির', 'আল-কিয়ামা',
  'আল-ইনসান', 'আল-মুরসালাত', 'আন-নাবা', 'আন-নাযিআত', 'আবাসা',
  'আত-তাকবীর', 'আল-ইনফিতার', 'আল-মুতাফফিফীন', 'আল-ইনশিকাক', 'আল-বুরুজ',
  'আত-তারিক', 'আল-আলা', 'আল-গাশিয়া', 'আল-ফাজর', 'আল-বালাদ',
  'আশ-শামস', 'আল-লাইল', 'আদ-দুহা', 'আশ-শারহ', 'আত-তীন',
  'আল-আলাক', 'আল-কাদর', 'আল-বাইয়্যিনা', 'আয-যালযালা', 'আল-আদিয়াত',
  'আল-কারিয়া', 'আত-তাকাসুর', 'আল-আসর', 'আল-হুমাযা', 'আল-ফীল',
  'কুরাইশ', 'আল-মাউন', 'আল-কাওসার', 'আল-কাফিরুন', 'আন-নাসর',
  'আল-মাসাদ', 'আল-ইখলাস', 'আল-ফালাক', 'আন-নাস',
]

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  edition: MushafEdition
  initialPage: number
}

function MushafReaderInner({ edition, initialPage }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── State ──────────────────────────────────────────────────────────────────
  const [page, setPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`mushaf_${edition.id}`)
      if (saved) return Math.max(1, Math.min(edition.totalPages, Number(saved)))
    }
    return initialPage
  })
  const [scale, setScale] = useState(1)
  const [barsVisible, setBarsVisible] = useState(true)
  const [allBoxes, setAllBoxes] = useState<AyahBox[]>([])
  const [boxesLoading, setBoxesLoading] = useState(true)
  const [selectedAyah, setSelectedAyah] = useState<{ sura: number; ayah: number } | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const [editingPage, setEditingPage] = useState(false)
  const [pageInput, setPageInput] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)
  const pageInputRef = useRef<HTMLInputElement>(null)
  const touchStartX = useRef<number | null>(null)

  // ── Container size ─────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setContainerSize({ w: width, h: height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Computed image bounds ──────────────────────────────────────────────────
  const imgBounds = useMemo(() => {
    const { w: cW, h: cH } = containerSize
    if (!cW || !cH) return null
    const imageAR = edition.width / edition.height
    const containerAR = cW / cH
    let imgW: number, imgH: number
    if (containerAR > imageAR) {
      imgH = cH; imgW = cH * imageAR
    } else {
      imgW = cW; imgH = cW / imageAR
    }
    return { w: imgW, h: imgH, x: (cW - imgW) / 2, y: (cH - imgH) / 2 }
  }, [containerSize, edition.width, edition.height])

  // ── Load ayah boxes via same-origin proxy (avoids CDN CORS issues) ────────
  useEffect(() => {
    setBoxesLoading(true)
    fetch(`/api/quran/mushaf/${edition.id}/ayah-boxes`)
      .then(r => r.json())
      .then((data: AyahBox[]) => { setAllBoxes(data); setBoxesLoading(false) })
      .catch(e => { console.error('Failed to load ayah boxes:', e); setBoxesLoading(false) })
  }, [edition.id])

  const boxesByPage = useMemo(() => {
    const map = new Map<number, AyahBox[]>()
    for (const box of allBoxes) {
      if (!map.has(box.page_number)) map.set(box.page_number, [])
      map.get(box.page_number)!.push(box)
    }
    return map
  }, [allBoxes])

  const suraFirstPage = useMemo(() => {
    const map = new Map<number, number>()
    for (const box of allBoxes) {
      const cur = map.get(box.sura_number)
      if (cur === undefined || box.page_number < cur) map.set(box.sura_number, box.page_number)
    }
    return map
  }, [allBoxes])

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goTo = useCallback((p: number) => {
    const n = Math.max(1, Math.min(edition.totalPages, p))
    setPage(n)
    setSelectedAyah(null)
    localStorage.setItem(`mushaf_${edition.id}`, String(n))
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(n))
    router.replace(`?${params}`, { scroll: false })
  }, [edition, searchParams, router])

  const prev = useCallback(() => goTo(page - 1), [page, goTo])
  const next = useCallback(() => goTo(page + 1), [page, goTo])

  // ── Preload adjacent pages ─────────────────────────────────────────────────
  useEffect(() => {
    [-2, -1, 1, 2].forEach(offset => {
      const p = page + offset
      if (p >= 1 && p <= edition.totalPages) {
        const img = new window.Image()
        img.src = `${edition.pagesBaseUrl}/qm${p}.${edition.ext}`
      }
    })
  }, [page, edition])

  // ── Keyboard navigation ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingPage || drawerOpen) return
      if (e.key === 'ArrowLeft')  next()
      if (e.key === 'ArrowRight') prev()
      if (e.key === 'Escape') { setSelectedAyah(null); setDrawerOpen(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next, editingPage, drawerOpen])

  // ── Touch swipe ────────────────────────────────────────────────────────────
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || scale > 1) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 50) {
      if (delta > 0) prev(); else next()
    }
    touchStartX.current = null
  }

  // ── Ayah hit detection ─────────────────────────────────────────────────────
  function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    // getBoundingClientRect returns visual (scaled) bounds — correct for our use
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = e.clientX - rect.left
    const relY = e.clientY - rect.top
    // Map rendered → original image coordinates
    const origX = (relX / rect.width)  * edition.width
    const origY = (relY / rect.height) * edition.height

    const pageBoxes = boxesByPage.get(page) ?? []
    const hit = pageBoxes.find(b =>
      origX >= b.min_x && origX <= b.max_x &&
      origY >= b.min_y && origY <= b.max_y
    )

    if (hit) {
      // Toggle: tap same ayah again to deselect
      if (selectedAyah?.sura === hit.sura_number && selectedAyah?.ayah === hit.ayah_number) {
        setSelectedAyah(null)
      } else {
        setSelectedAyah({ sura: hit.sura_number, ayah: hit.ayah_number })
        setBarsVisible(true)
      }
    } else {
      setSelectedAyah(null)
      setBarsVisible(v => !v)
    }
  }

  // ── Page input ─────────────────────────────────────────────────────────────
  function startEditingPage() {
    setPageInput(String(page))
    setEditingPage(true)
    setTimeout(() => pageInputRef.current?.select(), 50)
  }

  function commitPageInput() {
    const n = parseInt(pageInput, 10)
    if (!isNaN(n)) goTo(n)
    setEditingPage(false)
  }

  // ── Zoom ───────────────────────────────────────────────────────────────────
  const zoomIn  = () => setScale(s => Math.min(parseFloat((s + 0.25).toFixed(2)), 3))
  const zoomOut = () => setScale(s => Math.max(parseFloat((s - 0.25).toFixed(2)), 0.75))

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const pageUrl = `${edition.pagesBaseUrl}/qm${page}.${edition.ext}`
  const pageBoxes = boxesByPage.get(page) ?? []
  const currentSura = pageBoxes[0]?.sura_number

  // All boxes for the selected ayah on this page (may span multiple lines)
  const highlightBoxes = selectedAyah
    ? pageBoxes.filter(b => b.sura_number === selectedAyah.sura && b.ayah_number === selectedAyah.ayah)
    : []

  return (
    <div
      ref={containerRef}
      className="relative h-dvh w-full bg-neutral-950 overflow-hidden select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >

      {/* ── Page image + highlight ── */}
      {imgBounds && (
        <div
          className="absolute transition-transform duration-200 cursor-pointer"
          style={{
            left: imgBounds.x,
            top: imgBounds.y,
            width: imgBounds.w,
            height: imgBounds.h,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
          onClick={handleImageClick}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={pageUrl}
            src={pageUrl}
            alt={`পৃষ্ঠা ${page}`}
            className="w-full h-full block"
            draggable={false}
          />

          {/* Ayah highlight — one overlay per box (ayah may span multiple lines) */}
          {highlightBoxes.map(box => (
            <div
              key={box.box_id}
              className="absolute rounded-[3px] pointer-events-none"
              style={{
                left:   `${(box.min_x / edition.width)  * 100}%`,
                top:    `${(box.min_y / edition.height) * 100}%`,
                width:  `${((box.max_x - box.min_x) / edition.width)  * 100}%`,
                height: `${((box.max_y - box.min_y) / edition.height) * 100}%`,
                background: 'rgba(34,197,94,0.22)',
                border: '1.5px solid rgba(34,197,94,0.6)',
              }}
            />
          ))}
        </div>
      )}

      {/* ── Top toolbar ── */}
      <div className={cn(
        'absolute top-0 inset-x-0 z-30 flex items-center gap-3 px-3 py-2.5',
        'bg-gradient-to-b from-black/70 to-transparent',
        'transition-all duration-300',
        barsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none -translate-y-2'
      )}>
        <button
          onClick={() => router.push('/quran')}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{edition.title}</p>
          {currentSura && (
            <p className="text-white/60 text-xs">{SURA_NAMES[currentSura - 1]}</p>
          )}
        </div>

        {/* Zoom */}
        <button
          onClick={zoomOut}
          disabled={scale <= 0.75}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4.5 h-4.5" />
        </button>
        <span className="text-white/60 text-xs w-9 text-center tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={zoomIn}
          disabled={scale >= 3}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4.5 h-4.5" />
        </button>

        {/* Sura list */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Sura list"
        >
          <List className="w-5 h-5" />
        </button>
      </div>

      {/* ── Bottom nav bar ── */}
      <div className={cn(
        'absolute bottom-0 inset-x-0 z-30 flex items-center justify-between gap-4 px-4 py-3',
        'bg-gradient-to-t from-black/70 to-transparent',
        'transition-all duration-300',
        barsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none translate-y-2'
      )}>
        <button
          onClick={prev}
          disabled={page <= 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition-colors text-sm font-medium"
        >
          <ChevronRight className="w-4 h-4" />
          আগে
        </button>

        {/* Page indicator */}
        <button onClick={startEditingPage} className="flex-1 flex justify-center">
          {editingPage ? (
            <input
              ref={pageInputRef}
              value={pageInput}
              onChange={e => setPageInput(e.target.value)}
              onBlur={commitPageInput}
              onKeyDown={e => { if (e.key === 'Enter') commitPageInput() }}
              className="w-24 text-center text-white bg-white/10 border border-white/30 rounded-lg px-2 py-1.5 text-sm tabular-nums outline-none focus:border-white/60"
              type="number"
              min={1}
              max={edition.totalPages}
            />
          ) : (
            <span className="text-white/80 text-sm tabular-nums hover:text-white transition-colors">
              <span className="font-semibold text-white">{page}</span>
              <span className="mx-1">/</span>
              {edition.totalPages}
            </span>
          )}
        </button>

        <button
          onClick={next}
          disabled={page >= edition.totalPages}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition-colors text-sm font-medium"
        >
          পরে
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* ── Ayah info popup ── */}
      {selectedAyah && (
        <div
          className={cn(
            'absolute inset-x-4 z-40 transition-all duration-200',
            barsVisible ? 'bottom-20' : 'bottom-6'
          )}
        >
          <div className="bg-background/95 backdrop-blur-md border border-border rounded-2xl p-4 shadow-xl flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-0.5">
                সূরা {selectedAyah.sura} — {SURA_NAMES[selectedAyah.sura - 1]}
              </p>
              <p className="text-base font-semibold text-foreground">
                আয়াত {selectedAyah.ayah}
              </p>
            </div>
            <button
              onClick={() => setSelectedAyah(null)}
              className="shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Sura navigation drawer ── */}
      <div className={cn(
        'absolute inset-y-0 right-0 z-50 w-72 flex flex-col bg-background border-l border-border shadow-2xl',
        'transition-transform duration-300',
        drawerOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 text-foreground">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">সূরা তালিকা</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {boxesLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm">আয়াত ডেটা লোড হচ্ছে…</p>
            </div>
          ) : (
            SURA_NAMES.map((name, i) => {
              const suraNum = i + 1
              const suraPage = suraFirstPage.get(suraNum)
              const isActive = currentSura === suraNum
              return (
                <button
                  key={suraNum}
                  onClick={() => { if (suraPage) { goTo(suraPage); setDrawerOpen(false) } }}
                  disabled={!suraPage}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 text-left transition-colors',
                    'border-b border-border/40 last:border-0',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted text-foreground disabled:text-muted-foreground/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      {suraNum}
                    </span>
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                  {suraPage && (
                    <span className="text-xs text-muted-foreground tabular-nums">পৃ. {suraPage}</span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Drawer backdrop */}
      {drawerOpen && (
        <div
          className="absolute inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
          onClick={() => setDrawerOpen(false)}
        />
      )}
    </div>
  )
}

// Wrap in Suspense because useSearchParams requires it
export function MushafReader(props: Props) {
  return (
    <Suspense>
      <MushafReaderInner {...props} />
    </Suspense>
  )
}
