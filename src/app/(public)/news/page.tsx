import { NewsClient } from '@/components/public/news/news-client'
import { getNewsList } from '@/lib/public-api'

export const metadata = { title: 'সংবাদ' }

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const search = sp.q ?? ''
  const page = Number(sp.page ?? 1)

  const result = await getNewsList({ search: search || undefined, page })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">সংবাদ</h1>
        <p className="text-muted-foreground text-sm mt-1">ইসলামি সংবাদ ও তথ্য</p>
      </div>
      <NewsClient
        initialItems={result?.data ?? []}
        initialTotal={result?.total ?? 0}
        initialSearch={search}
      />
    </div>
  )
}
