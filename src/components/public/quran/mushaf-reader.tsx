'use client'

import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowLeft, ZoomIn, ZoomOut, X,
  ChevronLeft, ChevronRight, List,
  Star, Play, Pause, Copy, Check, Share2, Maximize, Loader2, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import type { MushafEdition, AyahBox, SuraAudioUrls, QuranAyahDetail } from '@/types'
import { bn } from '@/lib/bengali-numerals'
import { getBookmarks, toggleBookmark, removeBookmark, BOOKMARKS_CHANGED_EVENT, type QuranBookmark } from '@/lib/quran-bookmarks'
import { getPageBookmarks, togglePageBookmark, removePageBookmark, type MushafPageBookmark } from '@/lib/mushaf-bookmarks'

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

const AYAH_COUNTS = [
  7, 286, 200, 176, 120, 165, 206, 75, 129, 109,
  123, 111, 43, 52, 99, 128, 111, 110, 98, 135,
  112, 78, 118, 64, 77, 227, 93, 88, 69, 60,
  34, 30, 73, 54, 45, 83, 182, 88, 75, 85,
  54, 53, 89, 59, 37, 35, 38, 29, 18, 45,
  60, 49, 62, 55, 78, 96, 29, 22, 24, 13,
  14, 11, 11, 18, 12, 12, 30, 52, 52, 44,
  28, 28, 20, 56, 40, 31, 50, 40, 46, 42,
  29, 19, 36, 25, 22, 17, 19, 26, 30, 20,
  15, 21, 11, 8, 8, 19, 5, 8, 8, 11,
  11, 8, 3, 9, 5, 4, 7, 3, 6, 3,
  5, 4, 5, 6,
]

const PARA_NAMES = [
  'আলিফ লাম মীম', 'সাইয়াকূল', 'তিলকার রুসুল', 'লান তানা-লু', 'ওয়াল মুহসানাত',
  'লা ইউহিব্বুল্লাহ', 'ওয়া ইযা সামিউ', 'ওয়া লাও আন্নানা', 'ক্বা-লাল মালাউ', 'ওয়া\'লামূ',
  'ইয়া\'তাযিরূন', 'ওয়ামা মিন দা-ব্বাহ', 'ওয়ামা উবাররিউ', 'রুবামা', 'সুবহা-নাল্লাযী',
  'ক্বা-লা আলাম', 'ইক্বতারাবা', 'ক্বাদ আফলাহা', 'ওয়া ক্বা-লাল্লাযীনা', 'আম্মান খালাক্বা',
  'উতলু মা ঊহিয়া', 'ওয়া মাই ইয়াক্বনুত', 'ওয়া মা-লিয়া', 'ফামান আযলামু', 'ইলাইহি ইউরাদ্দু',
  'হা-মীম', 'ক্বা-লা ফামা খাতবুকুম', 'ক্বাদ সামি\'আল্লাহু', 'তাবা-রাকাল্লাযী', 'আম্মা',
]

// First (sura, ayah) of each of the 30 paras — same source data as the mobile app.
const PARA_STARTS: [number, number][] = [
  [2, 1], [2, 142], [2, 253], [3, 93], [4, 24],
  [4, 148], [5, 83], [6, 111], [7, 88], [8, 41],
  [9, 93], [11, 6], [12, 53], [15, 1], [17, 1],
  [18, 75], [21, 1], [23, 1], [25, 21], [27, 60],
  [29, 46], [33, 31], [36, 22], [39, 32], [41, 47],
  [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],
]

const DEFAULT_RECITER = 'qari-maher-al-muaiqly'
const RECITER_KEY = 'quran_selected_reciter'

function paraOfSuraAyah(sura: number, ayah: number): number {
  let para = 1
  PARA_STARTS.forEach(([s, a], i) => {
    if (sura > s || (sura === s && ayah >= a)) para = i + 1
  })
  return para
}

const DRAWER_TABS = [
  { id: 'surah', label: 'সূরা' },
  { id: 'juz', label: 'পারা' },
  { id: 'bookmarks', label: 'বুকমার্ক' },
] as const

type DrawerTab = typeof DRAWER_TABS[number]['id']

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
  const [drawerTab, setDrawerTab] = useState<DrawerTab>('surah')
  const [navSurah, setNavSurah] = useState(1)
  const [navPara, setNavPara] = useState(1)
  const [bookmarkTab, setBookmarkTab] = useState<'ayah' | 'page'>('ayah')
  const [ayahBookmarks, setAyahBookmarks] = useState<QuranBookmark[]>([])
  const [pageBookmarks, setPageBookmarks] = useState<MushafPageBookmark[]>([])
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const [editingPage, setEditingPage] = useState(false)
  const [pageInput, setPageInput] = useState('')

  // Ayah menu action state
  const [playingAyah, setPlayingAyah] = useState<{ sura: number; ayah: number } | null>(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [actionBusy, setActionBusy] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const pageInputRef = useRef<HTMLInputElement>(null)
  const touchStartX = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrlCache = useRef<{ key: string; urls: string[]; at: number } | null>(null)

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

  // ── Bookmarks ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = () => setAyahBookmarks(getBookmarks())
    load()
    window.addEventListener(BOOKMARKS_CHANGED_EVENT, load)
    return () => window.removeEventListener(BOOKMARKS_CHANGED_EVENT, load)
  }, [])

  useEffect(() => {
    setPageBookmarks(getPageBookmarks(edition.id))
  }, [edition.id])

  // ── Mappings derived from ayah boxes (mirrors the mobile app's logic) ──────
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

  const ayahFirstPage = useMemo(() => {
    const map = new Map<string, number>()
    for (const box of allBoxes) {
      const key = `${box.sura_number}:${box.ayah_number}`
      const cur = map.get(key)
      if (cur === undefined || box.page_number < cur) map.set(key, box.page_number)
    }
    // Known off-by-one corrections in older Hafizi ayah_boxes data (same as the app);
    // only triggers on the exact bad values, so other editions are unaffected.
    if (map.get('9:93') === 203) map.set('9:93', 204)
    if (map.get('15:1') === 263) map.set('15:1', 264)
    return map
  }, [allBoxes])

  const paraFirstPage = useMemo(() => {
    const map = new Map<number, number>()
    PARA_STARTS.forEach(([s, a], i) => {
      const p = ayahFirstPage.get(`${s}:${a}`)
      if (p !== undefined) map.set(i + 1, p)
    })
    return map
  }, [ayahFirstPage])

  const paraPageRanges = useMemo(() => {
    const map = new Map<number, number[]>()
    for (let i = 1; i <= 30; i++) {
      const start = paraFirstPage.get(i)
      const nextStart = paraFirstPage.get(i + 1)
      const end = i < 30 ? (nextStart !== undefined ? nextStart - 1 : undefined) : edition.totalPages
      if (start !== undefined && end !== undefined && start <= end) {
        map.set(i, Array.from({ length: end - start + 1 }, (_, k) => start + k))
      }
    }
    return map
  }, [paraFirstPage, edition.totalPages])

  const currentPara = useMemo(() => {
    for (const [para, pages] of paraPageRanges) {
      if (pages.includes(page)) return para
    }
    return null
  }, [paraPageRanges, page])

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

  function goToAyah(sura: number, ayah: number) {
    const target = ayahFirstPage.get(`${sura}:${ayah}`)
    if (target === undefined) return
    goTo(target)
    setSelectedAyah({ sura, ayah })
    setDrawerOpen(false)
  }

  function openDrawer() {
    const cs = boxesByPage.get(page)?.[0]?.sura_number
    if (cs) setNavSurah(cs)
    if (currentPara) setNavPara(currentPara)
    setDrawerOpen(true)
  }

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

  // ── Keyboard navigation (RTL: left arrow = forward) ───────────────────────
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

  // ── Touch swipe (RTL: swipe right = forward, like flipping a mushaf page) ──
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || scale > 1) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 50) {
      if (delta > 0) next(); else prev()
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
    } else if (selectedAyah) {
      setSelectedAyah(null)
    } else {
      setBarsVisible(v => !v)
    }
  }

  // ── Ayah menu actions ──────────────────────────────────────────────────────
  const fetchArabic = useCallback(async (sura: number, ayah: number): Promise<string> => {
    try {
      const res = await api.get<QuranAyahDetail>(`/api/quran/surahs/${sura}/ayahs/${ayah}?tafsirs=none&translations=none&words=false`)
      return res.arabic ?? ''
    } catch {
      return ''
    }
  }, [])

  const selectedBookmarked = selectedAyah
    ? ayahBookmarks.some(b => b.surahNumber === selectedAyah.sura && b.ayahNumber === selectedAyah.ayah)
    : false

  async function handleBookmarkAyah() {
    if (!selectedAyah || actionBusy) return
    const { sura, ayah } = selectedAyah
    setActionBusy(true)
    const arabic = selectedBookmarked ? '' : await fetchArabic(sura, ayah)
    toggleBookmark({ surahNumber: sura, ayahNumber: ayah, surahName: SURA_NAMES[sura - 1], arabic })
    setActionBusy(false)
  }

  async function handlePlayAyah() {
    if (!selectedAyah) return
    const { sura, ayah } = selectedAyah
    if (playingAyah?.sura === sura && playingAyah?.ayah === ayah) {
      audioRef.current?.pause()
      return
    }
    setAudioLoading(true)
    try {
      const reciterId = localStorage.getItem(RECITER_KEY) || DEFAULT_RECITER
      const cacheKey = `${reciterId}:${sura}`
      let urls: string[]
      // Presigned URLs expire after 5 min — reuse for 4
      if (audioUrlCache.current?.key === cacheKey && Date.now() - audioUrlCache.current.at < 4 * 60_000) {
        urls = audioUrlCache.current.urls
      } else {
        const res = await api.post<SuraAudioUrls>('/api/quran/sura-audio-urls', { reciterId, sura })
        urls = res.urls
        audioUrlCache.current = { key: cacheKey, urls, at: Date.now() }
      }
      const url = urls[ayah - 1]
      if (!url || !audioRef.current) throw new Error('audio url missing')
      audioRef.current.src = url
      await audioRef.current.play()
      setPlayingAyah({ sura, ayah })
    } catch {
      setPlayingAyah(null)
    } finally {
      setAudioLoading(false)
    }
  }

  async function handleCopyAyah() {
    if (!selectedAyah || actionBusy) return
    setActionBusy(true)
    const arabic = await fetchArabic(selectedAyah.sura, selectedAyah.ayah)
    setActionBusy(false)
    if (!arabic) return
    await navigator.clipboard.writeText(arabic)
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
      setSelectedAyah(null)
    }, 900)
  }

  async function handleShareAyah() {
    if (!selectedAyah || actionBusy) return
    const { sura, ayah } = selectedAyah
    setActionBusy(true)
    const arabic = await fetchArabic(sura, ayah)
    setActionBusy(false)
    const text = arabic || `সূরা ${SURA_NAMES[sura - 1]}, আয়াত ${bn(ayah)}`
    if (navigator.share) {
      await navigator.share({ text }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(text)
    }
    setSelectedAyah(null)
  }

  // ── Page bookmark ──────────────────────────────────────────────────────────
  const currentPageBookmarked = pageBookmarks.some(b => b.page === page)

  function handleTogglePageBookmark() {
    const cs = boxesByPage.get(page)?.[0]?.sura_number ?? 1
    togglePageBookmark({ editionId: edition.id, page, sura: cs, para: currentPara })
    setPageBookmarks(getPageBookmarks(edition.id))
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

  // Ayah menu anchor: just above the top-most highlight box, in rendered coordinates
  let menuTop: number | null = null
  if (selectedAyah && imgBounds && highlightBoxes.length > 0) {
    const minY = Math.min(...highlightBoxes.map(b => b.min_y))
    const fy = minY / edition.height
    const rendered = imgBounds.y + imgBounds.h / 2 + (fy - 0.5) * imgBounds.h * scale
    menuTop = Math.min(Math.max(110, rendered - 10), containerSize.h - 16)
  }

  const selectedIsPlaying = !!(selectedAyah && playingAyah
    && playingAyah.sura === selectedAyah.sura && playingAyah.ayah === selectedAyah.ayah)

  return (
    <div
      ref={containerRef}
      className="relative h-dvh w-full bg-neutral-200 dark:bg-neutral-900 overflow-hidden select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <audio
        ref={audioRef}
        onEnded={() => setPlayingAyah(null)}
        onPause={() => setPlayingAyah(null)}
      />

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
            alt={`পৃষ্ঠা ${bn(page)}`}
            className="w-full h-full block bg-white shadow-[0_4px_32px_rgba(0,0,0,0.25)]"
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
          {bn(Math.round(scale * 100))}%
        </span>
        <button
          onClick={zoomIn}
          disabled={scale >= 3}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4.5 h-4.5" />
        </button>

        {/* Navigation drawer */}
        <button
          onClick={openDrawer}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Navigation"
        >
          <List className="w-5 h-5" />
        </button>
      </div>

      {/* ── Bottom nav bar — RTL: next on the left, prev on the right ── */}
      <div className={cn(
        'absolute bottom-0 inset-x-0 z-30 flex items-center justify-between gap-4 px-4 py-3',
        'bg-gradient-to-t from-black/70 to-transparent',
        'transition-all duration-300',
        barsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none translate-y-2'
      )}>
        <button
          onClick={next}
          disabled={page >= edition.totalPages}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition-colors text-sm font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          পরে
        </button>

        {/* Page indicator + page bookmark */}
        <div className="flex-1 flex items-center justify-center gap-2">
          <button onClick={startEditingPage}>
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
                <span className="font-semibold text-white">{bn(page)}</span>
                <span className="mx-1">/</span>
                {bn(edition.totalPages)}
              </span>
            )}
          </button>
          <button
            onClick={handleTogglePageBookmark}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
              currentPageBookmarked ? 'text-amber-400' : 'text-white/60 hover:text-white hover:bg-white/10'
            )}
            title="পৃষ্ঠা বুকমার্ক"
          >
            <Star className={cn('w-4 h-4', currentPageBookmarked && 'fill-current')} />
          </button>
        </div>

        <button
          onClick={prev}
          disabled={page <= 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 transition-colors text-sm font-medium"
        >
          আগে
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Ayah menu — centered, floating just above the selected ayah ── */}
      {selectedAyah && menuTop !== null && (
        <div
          className="absolute z-40 left-1/2"
          style={{ top: menuTop, transform: 'translate(-50%, -100%)' }}
        >
          <div className="flex items-center gap-0.5 bg-background/95 backdrop-blur-md border border-border rounded-2xl shadow-xl px-1.5 py-1">
            <span className="px-2 text-xs font-semibold text-muted-foreground whitespace-nowrap tabular-nums">
              {bn(selectedAyah.sura)}:{bn(selectedAyah.ayah)}
            </span>

            <button
              onClick={handleBookmarkAyah}
              disabled={actionBusy}
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-xl transition-colors disabled:opacity-50',
                selectedBookmarked ? 'text-amber-500' : 'text-foreground hover:bg-muted'
              )}
              title="বুকমার্ক"
            >
              <Star className={cn('w-4.5 h-4.5', selectedBookmarked && 'fill-current')} />
            </button>

            <button
              onClick={handlePlayAyah}
              disabled={audioLoading}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              title="আয়াতটি শুনুন"
            >
              {audioLoading
                ? <Loader2 className="w-4.5 h-4.5 animate-spin" />
                : selectedIsPlaying
                  ? <Pause className="w-4.5 h-4.5" />
                  : <Play className="w-4.5 h-4.5" />}
            </button>

            <button
              onClick={handleCopyAyah}
              disabled={actionBusy}
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-xl transition-colors disabled:opacity-50',
                copied ? 'text-primary' : 'text-foreground hover:bg-muted'
              )}
              title="কপি করুন"
            >
              {copied ? <Check className="w-4.5 h-4.5" /> : <Copy className="w-4.5 h-4.5" />}
            </button>

            <button
              onClick={handleShareAyah}
              disabled={actionBusy}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              title="শেয়ার করুন"
            >
              <Share2 className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={() => { setBarsVisible(false); setSelectedAyah(null) }}
              className="flex items-center justify-center w-9 h-9 rounded-xl text-foreground hover:bg-muted transition-colors"
              title="ফুলস্ক্রিন"
            >
              <Maximize className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── Navigation drawer (left, like the text reader) ── */}
      <div className={cn(
        'absolute inset-y-0 left-0 z-50 w-80 max-w-[85vw] flex flex-col bg-background border-r border-border shadow-2xl',
        'transition-transform duration-300',
        drawerOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Tabs + X in one row */}
        <div className="flex items-center border-b border-border shrink-0">
          {DRAWER_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setDrawerTab(tab.id)}
              className={cn(
                'flex-1 py-3 text-xs font-semibold transition-colors',
                drawerTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={() => setDrawerOpen(false)}
            className="px-3 py-3 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {boxesLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <p className="text-sm">আয়াত ডেটা লোড হচ্ছে…</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* ── সূরা tab: surah list + ayah numbers ── */}
            {drawerTab === 'surah' && (
              <div className="flex flex-1 overflow-hidden">
                <div className="flex-[3] flex flex-col overflow-hidden border-r border-border">
                  <p className="shrink-0 py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60">সূরা</p>
                  <div className="flex-1 overflow-y-auto">
                    {SURA_NAMES.map((name, i) => {
                      const suraNum = i + 1
                      const isSelected = navSurah === suraNum
                      return (
                        <button
                          key={suraNum}
                          onClick={() => setNavSurah(suraNum)}
                          disabled={!suraFirstPage.has(suraNum)}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted border-b border-border/40',
                            'disabled:opacity-40',
                            isSelected && 'bg-primary/10'
                          )}
                        >
                          <span className={cn('text-sm truncate', isSelected ? 'font-bold text-primary' : 'text-foreground')}>
                            {bn(suraNum)}. {name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex-[2] flex flex-col overflow-hidden">
                  <p className="shrink-0 py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60">আয়াত</p>
                  <div className="flex-1 overflow-y-auto">
                    {Array.from({ length: AYAH_COUNTS[navSurah - 1] }, (_, k) => k + 1).map(n => {
                      const isCurrent = selectedAyah?.sura === navSurah && selectedAyah?.ayah === n
                      const hasPage = ayahFirstPage.has(`${navSurah}:${n}`)
                      return (
                        <button
                          key={n}
                          onClick={() => goToAyah(navSurah, n)}
                          disabled={!hasPage}
                          className={cn(
                            'w-full py-2.5 text-sm text-center transition-colors hover:bg-muted border-b border-border/40 disabled:opacity-40',
                            isCurrent ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground'
                          )}
                        >
                          {bn(n)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── পারা tab: para list + page numbers within the para ── */}
            {drawerTab === 'juz' && (
              <div className="flex flex-1 overflow-hidden">
                <div className="flex-[3] flex flex-col overflow-hidden border-r border-border">
                  <p className="shrink-0 py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60">পারা</p>
                  <div className="flex-1 overflow-y-auto">
                    {PARA_NAMES.map((name, i) => {
                      const paraNum = i + 1
                      const isSelected = navPara === paraNum
                      return (
                        <button
                          key={paraNum}
                          onClick={() => setNavPara(paraNum)}
                          disabled={!paraPageRanges.has(paraNum)}
                          className={cn(
                            'w-full px-3 py-2.5 text-left transition-colors hover:bg-muted border-b border-border/40 disabled:opacity-40',
                            isSelected && 'bg-primary/10'
                          )}
                        >
                          <p className={cn('text-sm', isSelected ? 'font-bold text-primary' : 'text-foreground')}>পারা {bn(paraNum)}</p>
                          <p className={cn('text-xs truncate', isSelected ? 'text-primary/80' : 'text-muted-foreground')}>{name}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex-[2] flex flex-col overflow-hidden">
                  <p className="shrink-0 py-2 text-center text-[11px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/60">পাতা</p>
                  <div className="flex-1 overflow-y-auto">
                    {(paraPageRanges.get(navPara) ?? []).map((actualPage, idx) => {
                      const isCurrent = actualPage === page
                      return (
                        <button
                          key={actualPage}
                          onClick={() => { goTo(actualPage); setDrawerOpen(false) }}
                          className={cn(
                            'w-full py-2.5 text-sm text-center transition-colors hover:bg-muted border-b border-border/40',
                            isCurrent ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground'
                          )}
                        >
                          {bn(idx + 1)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── বুকমার্ক tab: ayah + page bookmarks ── */}
            {drawerTab === 'bookmarks' && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex border-b border-border shrink-0">
                  {([['ayah', 'আয়াত'], ['page', 'পৃষ্ঠা']] as const).map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setBookmarkTab(id)}
                      className={cn(
                        'flex-1 py-2.5 text-xs font-semibold transition-colors',
                        bookmarkTab === id
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto">
                  {bookmarkTab === 'ayah' && (
                    ayahBookmarks.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-16 px-4">কোনো আয়াত বুকমার্ক করা নেই।</p>
                    ) : (
                      ayahBookmarks.map((b, i) => {
                        const pg = ayahFirstPage.get(`${b.surahNumber}:${b.ayahNumber}`)
                        const para = paraOfSuraAyah(b.surahNumber, b.ayahNumber)
                        return (
                          <div key={`${b.surahNumber}:${b.ayahNumber}`} className="flex items-center border-b border-border/40">
                            <button
                              onClick={() => { if (pg !== undefined) goToAyah(b.surahNumber, b.ayahNumber) }}
                              disabled={pg === undefined}
                              className="flex-1 min-w-0 px-3 py-2.5 text-left hover:bg-muted transition-colors disabled:opacity-50"
                            >
                              <p className="text-sm font-medium text-foreground truncate">
                                {bn(i + 1)}. {b.surahName}, আয়াত {bn(b.ayahNumber)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                পারা {bn(para)}{pg !== undefined ? `, পৃষ্ঠা ${bn(pg)}` : ''}
                              </p>
                            </button>
                            <button
                              onClick={() => removeBookmark(b.surahNumber, b.ayahNumber)}
                              className="shrink-0 p-2.5 text-muted-foreground hover:text-destructive transition-colors"
                              title="মুছুন"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )
                      })
                    )
                  )}

                  {bookmarkTab === 'page' && (
                    pageBookmarks.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-16 px-4">কোনো পৃষ্ঠা বুকমার্ক করা নেই।</p>
                    ) : (
                      pageBookmarks.map((b, i) => (
                        <div key={b.page} className="flex items-center border-b border-border/40">
                          <button
                            onClick={() => { goTo(b.page); setDrawerOpen(false) }}
                            className="flex-1 min-w-0 px-3 py-2.5 text-left hover:bg-muted transition-colors"
                          >
                            <p className="text-sm font-medium text-foreground truncate">
                              {bn(i + 1)}. {SURA_NAMES[b.sura - 1] ?? ''}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {b.para ? `পারা ${bn(b.para)}, ` : ''}পৃষ্ঠা {bn(b.page)}
                            </p>
                          </button>
                          <button
                            onClick={() => { removePageBookmark(edition.id, b.page); setPageBookmarks(getPageBookmarks(edition.id)) }}
                            className="shrink-0 p-2.5 text-muted-foreground hover:text-destructive transition-colors"
                            title="মুছুন"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )
                  )}
                </div>
              </div>
            )}

          </div>
        )}
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
