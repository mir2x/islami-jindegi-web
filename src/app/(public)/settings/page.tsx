import type { Metadata } from 'next'
import { SettingsClient } from '@/components/public/settings/settings-client'

export const metadata: Metadata = {
  title: 'সেটিংস | ইসলামী যিন্দেগী',
  description: 'ইসলামী যিন্দেগী — সেটিংস',
}

export default function SettingsPage() {
  return <SettingsClient />
}
