'use client'

import { useEffect, useCallback, useRef, useState } from 'react'
import { useEditor, EditorContent, type Editor, Extension } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontSize } from '@tiptap/extension-font-size'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import { cn } from '@/lib/utils'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Minus,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Table as TableIcon, Image as ImageIcon, Link as LinkIcon,
  Undo, Redo, RowsIcon, Columns3, Trash2,
  Eye, PenLine,
} from 'lucide-react'

// Custom text-direction extension — adds dir="ltr"|"rtl" to block nodes
const TEXT_DIR_TYPES = ['paragraph', 'heading', 'listItem', 'bulletList', 'orderedList']
const TextDirection = Extension.create({
  name: 'textDirection',
  addGlobalAttributes() {
    return [{
      types: TEXT_DIR_TYPES,
      attributes: {
        dir: {
          default: null,
          parseHTML: el => el.getAttribute('dir') || null,
          renderHTML: attrs => attrs.dir ? { dir: attrs.dir } : {},
        },
      },
    }]
  },
  addCommands() {
    return {
      setTextDirection: (dir: 'ltr' | 'rtl') => ({ commands }: { commands: any }) => {
        return TEXT_DIR_TYPES.every(type => commands.updateAttributes(type, { dir }))
      },
      unsetTextDirection: () => ({ commands }: { commands: any }) => {
        return TEXT_DIR_TYPES.every(type => commands.updateAttributes(type, { dir: null }))
      },
    } as any
  },
})

const FONT_SIZES = ['10', '11', '12', '13', '14', '15', '16', '18', '20', '22', '24', '28', '32', '36', '48', '72']

function FontSizeSelector({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false)
  const [inputVal, setInputVal] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const currentSize = editor.getAttributes('textStyle').fontSize?.replace('px', '') ?? ''

  const apply = (size: string) => {
    const num = parseInt(size)
    if (!isNaN(num) && num >= 1 && num <= 400) {
      editor.chain().focus().setFontSize(`${num}px`).run()
    }
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <div className={cn(
        'flex items-center h-7 border rounded overflow-hidden transition-colors',
        open ? 'border-primary' : 'border-border'
      )}>
        <input
          type="text"
          value={open ? inputVal : currentSize}
          placeholder="—"
          onFocus={() => { setOpen(true); setInputVal(currentSize) }}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); apply(inputVal) }
            if (e.key === 'Escape') setOpen(false)
          }}
          className="w-9 h-full text-center text-xs bg-transparent text-foreground outline-none placeholder:text-muted-foreground/50"
        />
      </div>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-popover border border-border rounded-md shadow-lg py-1 min-w-[52px] max-h-52 overflow-y-auto">
          {FONT_SIZES.map(size => (
            <button
              key={size}
              type="button"
              onMouseDown={e => { e.preventDefault(); apply(size) }}
              className={cn(
                'w-full px-3 py-[3px] text-xs text-left hover:bg-muted transition-colors',
                size === currentSize && 'bg-primary/10 text-primary font-semibold'
              )}
            >
              {size}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const BASE = process.env.NEXT_PUBLIC_API_URL

interface RichEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  editorKey?: string | number
  className?: string
}

function ToolbarButton({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      disabled={disabled}
      title={title}
      className={cn(
        'flex items-center justify-center w-7 h-7 rounded text-sm transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-0.5 shrink-0" />
}

export function RichEditor({ value, onChange, placeholder = 'Start writing...', editorKey, className }: RichEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [, forceRender] = useState(0)
  const prevValue = useRef(value)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        bulletList: { keepMarks: true },
        orderedList: { keepMarks: true },
      }),
      Underline,
      TextStyle,
      FontSize,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextDirection,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ allowBase64: false, inline: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const newVal = html === '<p></p>' ? '' : html
      prevValue.current = newVal
      onChange(newVal)
    },
  }, [editorKey])

  // Sync external value changes (e.g. when editing a different record or async loads)
  const prevKey = useRef(editorKey)
  useEffect(() => {
    if (!editor) return
    if (prevKey.current !== editorKey) {
      prevKey.current = editorKey
      prevValue.current = value
      editor.commands.setContent(value || '')
    } else if (value !== prevValue.current) {
      prevValue.current = value
      const currentHtml = editor.getHTML()
      const isEditorEmpty = currentHtml === '<p></p>' || currentHtml === ''
      const isValueEmpty = !value || value === '<p></p>'
      if (value !== currentHtml && !(isEditorEmpty && isValueEmpty)) {
        editor.commands.setContent(value || '')
      }
    }
  }, [editor, editorKey, value])

  // Re-render toolbar on every selection or state change
  useEffect(() => {
    if (!editor) return
    const update = () => forceRender(n => n + 1)
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
    }
  }, [editor])

  const insertTable = useCallback(() => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  const addRow = useCallback(() => {
    editor?.chain().focus().addRowAfter().run()
  }, [editor])

  const addColumn = useCallback(() => {
    editor?.chain().focus().addColumnAfter().run()
  }, [editor])

  const deleteTable = useCallback(() => {
    editor?.chain().focus().deleteTable().run()
  }, [editor])

  const setLink = useCallback(() => {
    const url = window.prompt('Enter URL')
    if (!url) return
    if (url === '') { editor?.chain().focus().unsetLink().run(); return }
    editor?.chain().focus().setLink({ href: url }).run()
  }, [editor])

  const handleImageUpload = useCallback(async (file: File) => {
    if (!BASE) return
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch(`${BASE}/api/upload/image`, { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      editor?.chain().focus().setImage({ src: url }).run()
    } catch (e) {
      console.error('Image upload error', e)
    }
  }, [editor])

  if (!editor) return null

  const inTable = editor.isActive('table')

  return (
    <div className="border border-border rounded-lg bg-card">
      {/* Toolbar — sticky so it stays visible while page scrolls */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-card/95 backdrop-blur-sm rounded-t-lg">
        {/* History */}
        <ToolbarButton title="Undo (Ctrl+Z)" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Redo (Ctrl+Y)" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo className="w-3.5 h-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Headings */}
        <ToolbarButton title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
          <Heading1 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="w-3.5 h-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Font size */}
        <FontSizeSelector editor={editor} />

        <Divider />

        {/* Inline marks */}
        <ToolbarButton title="Bold (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Italic (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Underline (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Link" active={editor.isActive('link')} onClick={setLink}>
          <LinkIcon className="w-3.5 h-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Alignment */}
        <ToolbarButton title="Align Left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}>
          <AlignLeft className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Align Center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}>
          <AlignCenter className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Align Right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}>
          <AlignRight className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Justify" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>
          <AlignJustify className="w-3.5 h-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Text direction (LTR / RTL) */}
        <ToolbarButton
          title="Left to Right (LTR)"
          active={editor.isActive({ dir: 'ltr' })}
          onClick={() => (editor as any).chain().focus().setTextDirection('ltr').run()}
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="4" x2="10" y2="4" />
            <line x1="1" y1="8" x2="8"  y2="8" />
            <line x1="1" y1="12" x2="10" y2="12" />
            <polyline points="12,6 15,8 12,10" fill="currentColor" stroke="none" />
            <line x1="11" y1="8" x2="15" y2="8" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          title="Right to Left (RTL) — Arabic / Urdu"
          active={editor.isActive({ dir: 'rtl' })}
          onClick={() => (editor as any).chain().focus().setTextDirection('rtl').run()}
        >
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="6"  y1="4" x2="15" y2="4" />
            <line x1="8"  y1="8" x2="15" y2="8" />
            <line x1="6"  y1="12" x2="15" y2="12" />
            <polyline points="4,6 1,8 4,10" fill="currentColor" stroke="none" />
            <line x1="1" y1="8" x2="5" y2="8" />
          </svg>
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton title="Bullet List" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Numbered List" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Code Block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          <Code className="w-3.5 h-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Horizontal Rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="w-3.5 h-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Table */}
        <ToolbarButton title="Insert Table" active={inTable} onClick={insertTable}>
          <TableIcon className="w-3.5 h-3.5" />
        </ToolbarButton>
        {inTable && (
          <>
            <ToolbarButton title="Add Row" onClick={addRow}>
              <RowsIcon className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton title="Add Column" onClick={addColumn}>
              <Columns3 className="w-3.5 h-3.5" />
            </ToolbarButton>
            <ToolbarButton title="Delete Table" onClick={deleteTable}>
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </ToolbarButton>
          </>
        )}

        <Divider />

        {/* Image */}
        <ToolbarButton title="Insert Image" onClick={() => fileRef.current?.click()}>
          <ImageIcon className="w-3.5 h-3.5" />
        </ToolbarButton>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleImageUpload(file)
            e.target.value = ''
          }}
        />

        {/* Spacer + Edit/Preview toggle */}
        <div className="ml-auto flex items-center gap-0.5 border border-border rounded-md p-0.5">
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setMode('edit') }}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors',
              mode === 'edit'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <PenLine className="w-3 h-3" />
            Edit
          </button>
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); setMode('preview') }}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors',
              mode === 'preview'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Eye className="w-3 h-3" />
            Preview
          </button>
        </div>
      </div>

      {/* Editor — fixed height, scrolls internally */}
      <div className={cn('overflow-y-auto', className || 'h-[640px]', mode === 'preview' && 'hidden')}>
        <EditorContent editor={editor} />
      </div>

      {/* Preview — same fixed height */}
      {mode === 'preview' && (
        <div className={cn('overflow-y-auto bg-background/50 rounded-b-lg', className || 'h-[640px]')}>
          <div
            className="prose-content p-5"
            dangerouslySetInnerHTML={{
              __html: editor.getHTML() === '<p></p>'
                ? '<p style="color:var(--muted-foreground);opacity:0.6;font-size:0.875rem">Nothing to preview yet...</p>'
                : editor.getHTML()
            }}
          />
        </div>
      )}
    </div>
  )
}
