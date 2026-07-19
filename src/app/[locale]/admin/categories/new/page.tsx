'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CategoryForm } from '@/components/admin/category-form'

function NewCategoryContent() {
  const searchParams = useSearchParams()
  const parentId = searchParams.get('parentId') ?? undefined
  return <CategoryForm defaultParentId={parentId} />
}

export default function NewCategoryPage() {
  return (
    <Suspense>
      <NewCategoryContent />
    </Suspense>
  )
}
