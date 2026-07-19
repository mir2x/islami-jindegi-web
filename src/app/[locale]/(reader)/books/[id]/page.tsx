import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { ArrowLeft, BookOpen, Tag, User } from 'lucide-react'
import { getBook } from '@/lib/public-api'
import { BookReaderWrapper } from '@/components/public/books/book-reader-wrapper'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale, id } = await params
  const book = await getBook(id)
  const t = await getTranslations({ locale, namespace: 'BookReader' })
  const tMeta = await getTranslations({ locale, namespace: 'Metadata' })
  return {
    title: `${book ? book.title : t('defaultTitle')} | ${tMeta('title')}`,
    description: book?.excerpt ?? undefined,
  }
}

export default async function BookReaderPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale, id } = await params
  const t = await getTranslations({ locale, namespace: 'BookReader' })
  const book = await getBook(id)
  if (!book || !book.published) notFound()

  const hasChapters = book.chapters.some(c => c.body || c.subChapters.some(s => s.body))
  const hasPdf = Boolean(book.documentUrl)

  if (hasChapters || hasPdf) {
    return <BookReaderWrapper book={book} hasChapters={hasChapters} hasPdf={hasPdf} />
  }

  // Fallback: book detail / description page
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href="/books"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" /> {t('allBooks')}
      </Link>

      <div className="flex flex-col sm:flex-row gap-8">
        {/* Cover */}
        <div className="shrink-0 w-40 sm:w-48">
          <div className="aspect-[3/4] relative rounded-xl overflow-hidden bg-muted shadow-md">
            {book.coverUrl ? (
              <Image src={book.coverUrl} alt={book.title} fill className="object-cover" sizes="192px" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                <BookOpen className="w-12 h-12" />
              </div>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-foreground leading-snug mb-2">{book.title}</h1>
          {book.authors.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <User className="w-4 h-4 shrink-0" />
              {book.authors.map(a => a.name).join(', ')}
            </div>
          )}
          {book.categories.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
              {book.categories.map(c => (
                <span key={c.id} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  {c.title}
                </span>
              ))}
            </div>
          )}
          {book.publisher && (
            <p className="text-sm text-muted-foreground mb-1">{t('publisher', { name: book.publisher })}</p>
          )}
          {book.price && (
            <p className="text-sm text-muted-foreground mb-4">{t('price', { price: book.price })}</p>
          )}
          {book.excerpt && (
            <div
              className="prose-content mt-4"
              dangerouslySetInnerHTML={{ __html: book.excerpt }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
