import { StaticPage, staticPageMetadata } from '@/components/public/static-page'

// Renders the CMS page with slug 'contact' (admin → Pages).
const SLUG = 'contact'
const NAMESPACE = 'ContactPage'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return staticPageMetadata(locale, NAMESPACE)
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <StaticPage locale={locale} slug={SLUG} namespace={NAMESPACE} />
}
