'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { useNamazTimeStore } from '@/store/namaz-time-store'
import { RichEditor } from '@/components/admin/rich-editor'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { NamazTimeDetail } from '@/types'

interface Props {
  namazTime?: NamazTimeDetail | null
}

export function NamazTimeForm({ namazTime }: Props) {
  const router = useRouter()
  const { create, update } = useNamazTimeStore()

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [titleBn, setTitleBn] = useState('')
  const [masail, setMasail] = useState('')
  const [fazail, setFazail] = useState('')
  const [position, setPosition] = useState('')

  const isEdit = !!namazTime

  useEffect(() => {
    if (namazTime) {
      setTitle(namazTime.title)
      setTitleBn(namazTime.titleBn ?? '')
      setMasail(namazTime.masail)
      setFazail(namazTime.fazail ?? '')
      setPosition(String(namazTime.position))
    }
  }, [namazTime])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { toast.error('Title is required'); return }
    if (!masail.trim()) { toast.error('Masail is required'); return }

    setLoading(true)
    try {
      const payload = {
        title: title.trim(),
        titleBn: titleBn || null,
        masail: masail.trim(),
        fazail: fazail || null,
        position: position ? parseInt(position) : undefined,
      }
      if (isEdit) {
        await update(namazTime.id, payload)
        toast.success('Namaz time updated')
        router.push('/admin/namaz-times')
      } else {
        await create(payload)
        toast.success('Namaz time created')
        router.push('/admin/namaz-times')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to namaz times
        </button>
        <h1 className="text-lg font-semibold">{isEdit ? 'Edit Namaz Time' : 'Add Namaz Time'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-card border rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Title (English) <span className="text-destructive">*</span></Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Fajr" maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label>Title (Bangla)</Label>
              <Input value={titleBn} onChange={e => setTitleBn(e.target.value)} placeholder="e.g. ফজর" maxLength={100} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Position</Label>
            <Input type="number" value={position} onChange={e => setPosition(e.target.value)} placeholder="Auto" min={1} className="w-40" />
          </div>
        </div>

        <div className="bg-card border rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content</h2>

          <div className="space-y-1.5">
            <Label>
              Masail
              <span className="ml-2 text-xs text-muted-foreground font-normal">legal rulings</span>
              <span className="text-destructive ml-1">*</span>
            </Label>
            <RichEditor value={masail} onChange={setMasail} placeholder="Write masail content..." editorKey={namazTime?.id} />
          </div>

          <div className="space-y-1.5">
            <Label>
              Fazail
              <span className="ml-2 text-xs text-muted-foreground font-normal">virtues</span>
            </Label>
            <RichEditor value={fazail} onChange={setFazail} placeholder="Write fazail content..." editorKey={namazTime?.id ? `${namazTime.id}-fazail` : undefined} />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="sm:px-8">
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
