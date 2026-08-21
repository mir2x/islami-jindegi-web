import { StaticPage, staticPageMetadata } from '@/components/public/static-page'

// Renders the CMS page with slug 'about' (admin → Pages).
const SLUG = 'about'
const NAMESPACE = 'AboutPage'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return staticPageMetadata(locale, NAMESPACE)
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <StaticPage locale={locale} slug={SLUG} namespace={NAMESPACE} />
}
