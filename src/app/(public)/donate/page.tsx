import type { Metadata } from 'next'
import { getPageBySlug } from '@/lib/public-api'

// Mirrors the old site's /donation route, which renders the CMS page with slug 'donation'.
const SLUG = 'donation'

export const metadata: Metadata = {
  title: 'অনুদান | ইসলামী যিন্দেগী',
  description: 'ইসলামী যিন্দেগী — অনুদান',
}

export default async function DonatePage() {
  const page = await getPageBySlug(SLUG)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-bold text-foreground mb-6">অনুদান</h1>

      {page?.body ? (
        <div
          className="prose-content text-[15px] leading-relaxed text-foreground"
          dangerouslySetInnerHTML={{ __html: page.body }}
        />
      ) : (
        <p className="text-muted-foreground py-16 text-center">
          অনুদানের তথ্য এই মুহূর্তে পাওয়া যাচ্ছে না। পরে আবার চেষ্টা করুন।
        </p>
      )}
    </div>
  )
}
