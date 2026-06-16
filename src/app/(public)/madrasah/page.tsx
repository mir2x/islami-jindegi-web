import { MadrasahClient } from '@/components/public/madrasah/madrasah-client'
import { getMadrasahs } from '@/lib/public-api'

export const metadata = { title: 'মাদ্রাসা' }

export default async function MadrasahPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const search = sp.q ?? ''
  const page = Number(sp.page ?? 1)

  const result = await getMadrasahs({ search: search || undefined, page })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">মাদ্রাসা</h1>
        <p className="text-muted-foreground text-sm mt-1">ইসলামি শিক্ষা প্রতিষ্ঠানের তথ্য</p>
      </div>
      <MadrasahClient
        initialItems={result?.data ?? []}
        initialTotal={result?.total ?? 0}
        initialSearch={search}
      />
    </div>
  )
}
