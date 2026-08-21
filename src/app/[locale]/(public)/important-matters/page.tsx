import { StaticPage, staticPageMetadata } from '@/components/public/static-page'

// Renders the CMS page with slug 'important-matters' (admin → Pages).
const SLUG = 'important-matters'
const NAMESPACE = 'ImportantMattersPage'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return staticPageMetadata(locale, NAMESPACE)
}

export default async function ImportantMattersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <StaticPage locale={locale} slug={SLUG} namespace={NAMESPACE} />
}
