import { SettingsClient } from '@/components/public/settings/settings-client'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'SettingsPage' })
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default function SettingsPage() {
  return <SettingsClient />
}
