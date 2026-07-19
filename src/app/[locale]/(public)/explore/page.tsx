import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import {
  BookOpen, Mic, ScrollText, HelpCircle, Sparkles,
  Newspaper, Rss, School, Clock, ArrowRight, BookMarked, ChevronLeft,
} from 'lucide-react'
import {
  getRecentBooks, getRecentBayans, getRecentArticles,
  getRecentNews, getRecentMalfuzat,
} from '@/lib/public-api'
import { getTranslations } from 'next-intl/server'

function SectionHeading({ title, href, viewAllLabel }: { title: string; href: string; viewAllLabel: string }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-foreground">{title}</h2>
      <Link
        href={href}
        className="flex items-center gap-1.5 text-base font-medium text-primary hover:gap-2 transition-all"
      >
        {viewAllLabel} <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

function BookCard({ book }: { book: Awaited<ReturnType<typeof getRecentBooks>>[number] }) {
  return (
    <Link href={`/books/${book.id}`} className="group shrink-0 w-40 snap-start">
      <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-muted mb-3 shadow-sm group-hover:shadow-md transition-all duration-200">
        {book.coverUrl ? (
          <Image
            src={book.coverUrl}
            alt={book.title}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
            sizes="160px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 bg-primary/5">
            <BookOpen className="w-12 h-12" />
          </div>
        )}
      </div>
      <p className="text-[15px] font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
        {book.title}
      </p>
      {book.authors[0] && (
        <p className="text-sm text-muted-foreground mt-1 truncate">{book.authors[0].name}</p>
      )}
    </Link>
  )
}

function BayanCard({ bayan }: { bayan: Awaited<ReturnType<typeof getRecentBayans>>[number] }) {
  return (
    <Link href={`/bayan/${bayan.id}`} className="group shrink-0 w-72 snap-start">
      <div className="h-full bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-sm transition-all duration-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Mic className="w-5 h-5" />
          </div>
          <p className="text-sm text-muted-foreground truncate">{bayan.author?.name}</p>
        </div>
        <p className="text-base font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {bayan.title}
        </p>
        {bayan.location && (
          <p className="text-sm text-muted-foreground mt-2 truncate">{bayan.location}</p>
        )}
      </div>
    </Link>
  )
}

function MalfuzatCard({ item }: { item: Awaited<ReturnType<typeof getRecentMalfuzat>>[number] }) {
  return (
    <Link href={`/malfuzat/${item.id}`} className="group shrink-0 w-80 snap-start">
      <div className="h-full bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:shadow-sm transition-all duration-200">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <ScrollText className="w-4 h-4" />
          </div>
          <p className="text-sm text-muted-foreground truncate">{item.author?.name}</p>
        </div>
        <p className="text-base font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </p>
        {item.excerpt && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{item.excerpt}</p>
        )}
      </div>
    </Link>
  )
}

function ArticleRow({ item, locale }: { item: Awaited<ReturnType<typeof getRecentArticles>>[number]; locale: string }) {
  const date = item.publishedAt ?? item.createdAt
  return (
    <Link
      href={`/articles/${item.id}`}
      className="group flex gap-4 py-4 border-b border-border/50 last:border-0"
    >
      <span className="text-xs text-muted-foreground tabular-nums shrink-0 mt-1 w-14">
        {new Date(date).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short' })}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {item.title}
        </p>
        {item.author && (
          <p className="text-sm text-muted-foreground mt-1">{item.author.name}</p>
        )}
      </div>
    </Link>
  )
}

function NewsRow({ item, locale }: { item: Awaited<ReturnType<typeof getRecentNews>>[number]; locale: string }) {
  const date = item.publishedAt ?? item.createdAt
  return (
    <Link
      href={`/news/${item.id}`}
      className="group flex gap-4 py-4 border-b border-border/50 last:border-0"
    >
      <span className="text-xs text-muted-foreground tabular-nums shrink-0 mt-1 w-14">
        {new Date(date).toLocaleDateString(locale === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short' })}
      </span>
      <p className="text-base font-semibold leading-snug line-clamp-2 group-hover:text-primary transition-colors flex-1 min-w-0">
        {item.title}
      </p>
    </Link>
  )
}

export default async function ExplorePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const [books, bayans, malfuzat, articles, news] = await Promise.all([
    getRecentBooks(10),
    getRecentBayans(10),
    getRecentMalfuzat(8),
    getRecentArticles(6),
    getRecentNews(6),
  ])

  const t = await getTranslations({ locale, namespace: 'ExplorePage' })
  const tNav = await getTranslations({ locale, namespace: 'Nav' })
  const tCommon = await getTranslations({ locale, namespace: 'Common' })
  const tMeta = await getTranslations({ locale, namespace: 'Metadata' })

  const SECTIONS = [
    { label: tNav('quran'), sub: t('subQuran'), href: '/quran', icon: BookMarked },
    { label: tNav('books'), sub: t('subBooks'), href: '/books', icon: BookOpen },
    { label: tNav('bayan'), sub: t('subBayan'), href: '/bayan', icon: Mic },
    { label: tNav('malfuzat'), sub: t('subMalfuzat'), href: '/malfuzat', icon: ScrollText },
    { label: tNav('masail'), sub: t('subMasail'), href: '/masail', icon: HelpCircle },
    { label: tNav('dua'), sub: t('subDua'), href: '/dua', icon: Sparkles },
    { label: tNav('articles'), sub: t('subArticles'), href: '/articles', icon: Newspaper },
    { label: tNav('news'), sub: t('subNews'), href: '/news', icon: Rss },
    { label: tNav('madrasah'), sub: t('subMadrasah'), href: '/madrasah', icon: School },
    { label: tNav('namazTimes'), sub: t('subNamazTimes'), href: '/namaz-times', icon: Clock },
  ]

  return (
    <div className="pb-8">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-primary/5 to-transparent border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="flex justify-start mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> {t('backToClassic')}
            </Link>
          </div>
          <p className="text-center text-2xl text-muted-foreground mb-3" style={{ fontFamily: 'serif' }}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </p>
          <h1 className="text-center text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground mt-4">
            {tMeta('title')}
          </h1>
          <p className="text-center text-xl text-muted-foreground mt-3">
            {tMeta('description')}
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Section nav grid ────────────────────────────────────────────── */}
        <section className="py-10">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {SECTIONS.map(({ label, sub, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col gap-3 p-5 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/15 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[18px] text-foreground leading-tight">{label}</p>
                  <p className="text-[13px] text-muted-foreground mt-1 leading-tight">{sub}</p>
                </div>
                <div className="mt-auto flex items-center gap-1 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {t('viewLabel')} <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Recent Books ─────────────────────────────────────────────────── */}
        {books.length > 0 && (
          <section className="py-8 border-t border-border/40">
            <SectionHeading title={t('recentBooksHeading')} href="/books" viewAllLabel={tCommon('viewAll')} />
            <div className="flex gap-5 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
              {books.map(b => <BookCard key={b.id} book={b} />)}
              <Link
                href="/books"
                className="shrink-0 w-40 snap-start flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors aspect-[3/4]"
              >
                <ArrowRight className="w-6 h-6" />
                <span className="text-sm font-medium">{tCommon('viewAll')}</span>
              </Link>
            </div>
          </section>
        )}

        {/* ── Recent Bayans ────────────────────────────────────────────────── */}
        {bayans.length > 0 && (
          <section className="py-8 border-t border-border/40">
            <SectionHeading title={t('recentBayansHeading')} href="/bayan" viewAllLabel={tCommon('viewAll')} />
            <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
              {bayans.map(b => <BayanCard key={b.id} bayan={b} />)}
            </div>
          </section>
        )}

        {/* ── Recent Malfuzat ──────────────────────────────────────────────── */}
        {malfuzat.length > 0 && (
          <section className="py-8 border-t border-border/40">
            <SectionHeading title={t('recentMalfuzatHeading')} href="/malfuzat" viewAllLabel={tCommon('viewAll')} />
            <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
              {malfuzat.map(m => <MalfuzatCard key={m.id} item={m} />)}
            </div>
          </section>
        )}

        {/* ── Articles + News ──────────────────────────────────────────────── */}
        {(articles.length > 0 || news.length > 0) && (
          <section className="py-8 border-t border-border/40">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">

              {articles.length > 0 && (
                <div>
                  <SectionHeading title={t('recentArticlesHeading')} href="/articles" viewAllLabel={tCommon('viewAll')} />
                  <div>{articles.map(a => <ArticleRow key={a.id} item={a} locale={locale} />)}</div>
                </div>
              )}

              {news.length > 0 && (
                <div>
                  <SectionHeading title={t('recentNewsHeading')} href="/news" viewAllLabel={tCommon('viewAll')} />
                  <div>{news.map(n => <NewsRow key={n.id} item={n} locale={locale} />)}</div>
                </div>
              )}

            </div>
          </section>
        )}

      </div>
    </div>
  )
}
