import { StaticPage, staticPageMetadata } from '@/components/public/static-page'

// Renders the CMS page with slug 'privacy-policy' (admin → Pages).
const SLUG = 'privacy-policy'
const NAMESPACE = 'PrivacyPolicyPage'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return staticPageMetadata(locale, NAMESPACE)
}

export default async function PrivacyPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <StaticPage locale={locale} slug={SLUG} namespace={NAMESPACE} />
}
