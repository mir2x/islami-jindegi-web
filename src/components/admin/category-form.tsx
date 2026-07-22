'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { useCategoryStore } from '@/store/category-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Category } from '@/types'

interface Props {
  category?: Category | null
  defaultParentId?: string
}

export function CategoryForm({ category, defaultParentId }: Props) {
  const router = useRouter()
  const { categories, fetch: fetchCategories, create, update } = useCategoryStore()
  const isEdit = !!category

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState(category?.title ?? '')
  const [position, setPosition] = useState(category ? String(category.position) : '')
  const [parentId, setParentId] = useState(category?.parentId ?? defaultParentId ?? '')

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const parentCategories = categories.filter(c => !c.parentId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { toast.error('Title is required'); return }
    setLoading(true)
    try {
      const payload = {
        title: title.trim(),
        position: position ? parseInt(position) : undefined,
        parentId: parentId || null,
      }
      if (isEdit) {
        await update(category.id, payload)
        toast.success('Category updated')
      } else {
        await create(payload)
        toast.success('Category created')
      }
      router.back()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 sm:p-5">
      <div className="mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Category' : 'Add New Category'}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isEdit ? `Editing "${category.title}"` : 'Fill in the details to add a new category'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="bg-card border rounded-xl p-4 sm:p-5 space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Details</h2>

            <div className="space-y-1.5">
              <Label>Title <span className="text-destructive">*</span></Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Category title" maxLength={100} />
            </div>

            <div className="space-y-1.5">
              <Label>Parent Category</Label>
              <Select value={parentId || 'none'} onValueChange={v => setParentId(!v || v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Top-level category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Top-level category</SelectItem>
                  {parentCategories
                    .filter(p => !isEdit || p.id !== category.id)
                    .map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Position</Label>
              <Input
                type="number"
                value={position}
                onChange={e => setPosition(e.target.value)}
                placeholder="Auto"
                min={1}
                className="w-40"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="sm:px-8">
              {loading ? 'Saving...' : isEdit ? 'Update Category' : 'Create Category'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
