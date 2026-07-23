'use client'

import { Link } from '@/i18n/navigation'
import { Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAuthStore } from '@/store/auth-store'

type EditableEntity = 'articles' | 'bayan' | 'books' | 'chapters' | 'subchapters' | 'dua' | 'malfuzat' | 'masail' | 'news'

interface Props {
  entity: EditableEntity
  id: string
}

export function AdminEditButton({ entity, id }: Props) {
  const t = useTranslations('Common')
  const token = useAuthStore((s) => s.token)

  if (!token) return null

  return (
    <Link
      href={`/admin/${entity}/${id}/edit`}
      className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity"
    >
      <Pencil className="w-4 h-4" />
      <span className="text-sm font-medium">{t('edit')}</span>
    </Link>
  )
}
