'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react'
import { useMadrasahStore } from '@/store/madrasah-store'
import { RichEditor } from '@/components/admin/rich-editor'
import { MediaField } from '@/components/admin/media-field'
import { PublicViewButton } from '@/components/admin/public-view-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { MadrasahDetail, MadrasahInfoItem, MadrasahPhotoItem } from '@/types'

interface Props {
  madrasah?: MadrasahDetail | null
}

type DraftInfo = { key: string; label: string; info: string }
type DraftPhoto = { key: string; title: string; imageUrl: string }

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function MadrasahForm({ madrasah }: Props) {
  const router = useRouter()
  const { create, update } = useMadrasahStore()

  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [introduction, setIntroduction] = useState('')
  const [position, setPosition] = useState('')
  const [infos, setInfos] = useState<DraftInfo[]>([])
  const [photos, setPhotos] = useState<DraftPhoto[]>([])

  const isEdit = !!madrasah

  useEffect(() => {
    if (madrasah) {
      setTitle(madrasah.title)
      setExcerpt(madrasah.excerpt ?? '')
      setIntroduction(madrasah.introduction)
      setPosition(String(madrasah.position))
      setInfos(madrasah.infos.map(i => ({ key: crypto.randomUUID(), label: i.label, info: stripHtml(i.info) })))
      setPhotos(madrasah.photos.map(p => ({ key: crypto.randomUUID(), title: p.title, imageUrl: p.imageUrl })))
    }
  }, [madrasah])

  function addInfo() {
    setInfos(prev => [...prev, { key: crypto.randomUUID(), label: '', info: '' }])
  }

  function updateInfo(key: string, field: 'label' | 'info', value: string) {
    setInfos(prev => prev.map(i => i.key === key ? { ...i, [field]: value } : i))
  }

  function removeInfo(key: string) {
    setInfos(prev => prev.filter(i => i.key !== key))
  }

  function addPhoto() {
    setPhotos(prev => [...prev, { key: crypto.randomUUID(), title: '', imageUrl: '' }])
  }

  function updatePhoto(key: string, field: 'title' | 'imageUrl', value: string) {
    setPhotos(prev => prev.map(p => p.key === key ? { ...p, [field]: value } : p))
  }

  function removePhoto(key: string) {
    setPhotos(prev => prev.filter(p => p.key !== key))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { toast.error('Title is required'); return }
    if (!introduction.trim()) { toast.error('Introduction is required'); return }

    const infoPayload: MadrasahInfoItem[] = infos
      .filter(i => i.label.trim() && i.info.trim())
      .map((i, idx) => ({ id: null, label: i.label.trim(), info: i.info.trim(), position: idx + 1 }))

    const photoPayload: MadrasahPhotoItem[] = photos
      .filter(p => p.imageUrl.trim())
      .map((p, idx) => ({ id: null, title: p.title.trim(), imageUrl: p.imageUrl.trim(), position: idx + 1 }))

    setLoading(true)
    try {
      const payload = {
        title: title.trim(),
        excerpt: excerpt || null,
        introduction: introduction.trim(),
        position: position ? parseInt(position) : undefined,
        infos: infoPayload,
        photos: photoPayload,
      }
      if (isEdit) {
        await update(madrasah.id, payload)
        toast.success('Madrasah updated')
        router.push('/admin/madrasah')
      } else {
        await create(payload)
        toast.success('Madrasah created')
        router.push('/admin/madrasah')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to madrasahs
          </button>
          {madrasah && <PublicViewButton href={`/madrasah/${madrasah.id}`} />}
        </div>
        <h1 className="text-lg font-semibold">{isEdit ? 'Edit Madrasah' : 'Add Madrasah'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic Info */}
        <div className="bg-card border rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</h2>

          <div className="space-y-1.5">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Madrasah name" maxLength={200} />
          </div>

          <div className="space-y-1.5">
            <Label>
              Excerpt
              <span className="ml-2 text-xs text-muted-foreground font-normal">short description</span>
            </Label>
            <Textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Brief summary..." rows={2} maxLength={300} />
          </div>

          <div className="space-y-1.5">
            <Label>Introduction <span className="text-destructive">*</span></Label>
            <RichEditor value={introduction} onChange={setIntroduction} placeholder="Full introduction..." editorKey={madrasah?.id} />
          </div>

          <div className="w-40 space-y-1.5">
            <Label>Position</Label>
            <Input type="number" value={position} onChange={e => setPosition(e.target.value)} placeholder="Auto" min={1} />
          </div>
        </div>

        {/* Infos (key-value facts) */}
        <div className="bg-card border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Info Fields</h2>
            <Button type="button" variant="outline" size="sm" onClick={addInfo} className="gap-1.5 h-8">
              <Plus className="w-3.5 h-3.5" />
              Add field
            </Button>
          </div>

          {infos.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No info fields yet. Add key-value facts about this madrasah.</p>
          )}

          {infos.map((info, idx) => (
            <div key={info.key} className="flex gap-2 items-start">
              <GripVertical className="w-4 h-4 text-muted-foreground/40 mt-2.5 shrink-0" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                <Input
                  value={info.label}
                  onChange={e => updateInfo(info.key, 'label', e.target.value)}
                  placeholder={`Label ${idx + 1} (e.g. Founded)`}
                  maxLength={100}
                />
                <Input
                  value={info.info}
                  onChange={e => updateInfo(info.key, 'info', e.target.value)}
                  placeholder="Value"
                  maxLength={300}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeInfo(info.key)}
                className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Photos */}
        <div className="bg-card border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Photos</h2>
            <Button type="button" variant="outline" size="sm" onClick={addPhoto} className="gap-1.5 h-8">
              <Plus className="w-3.5 h-3.5" />
              Add photo
            </Button>
          </div>

          {photos.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No photos yet.</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {photos.map((photo) => (
              <div key={photo.key} className="bg-muted/20 border rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Input
                    value={photo.title}
                    onChange={e => updatePhoto(photo.key, 'title', e.target.value)}
                    placeholder="Photo caption"
                    maxLength={200}
                    className="h-8 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePhoto(photo.key)}
                    className="h-8 w-8 ml-2 text-muted-foreground hover:text-destructive shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <MediaField
                  accept="image"
                  value={photo.imageUrl}
                  onChange={url => updatePhoto(photo.key, 'imageUrl', url)}
                  placeholder="Select photo"
                  compact
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="sm:px-8">
            {loading ? 'Saving...' : isEdit ? 'Update Madrasah' : 'Create Madrasah'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
