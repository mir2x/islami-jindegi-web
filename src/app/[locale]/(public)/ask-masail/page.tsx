import { StaticPage, staticPageMetadata } from '@/components/public/static-page'

// Renders the CMS page with slug 'ask-masail' (admin → Pages).
const SLUG = 'ask-masail'
const NAMESPACE = 'AskMasailPage'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return staticPageMetadata(locale, NAMESPACE)
}

export default async function AskMasailPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <StaticPage locale={locale} slug={SLUG} namespace={NAMESPACE} />
}
