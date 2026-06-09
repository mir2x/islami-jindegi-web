'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { useEffect, useRef } from 'react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold, Italic, UnderlineIcon, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Heading2, Heading3, Undo, Redo,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'h-7 w-7 flex items-center justify-center rounded text-sm transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
        disabled && 'opacity-30 pointer-events-none'
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-5 bg-border mx-0.5 shrink-0" />
}

export function RichTextEditor({ value, onChange, placeholder, className, minHeight = '180px' }: Props) {
  const lastValueRef = useRef<string>(value)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: placeholder ?? 'Write here...' }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'outline-none px-4 py-3 text-sm leading-relaxed [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_p]:my-1 [&_strong]:font-semibold [&_em]:italic [&_s]:line-through [&_u]:underline [&_a]:text-primary [&_a]:underline',
      },
    },
    immediatelyRender: false,
  })

  // Sync external value changes (e.g. when edit form data loads asynchronously)
  useEffect(() => {
    if (!editor) return
    if (value !== lastValueRef.current) {
      lastValueRef.current = value
      const current = editor.getHTML()
      const isEmpty = current === '<p></p>' && !value
      if (!isEmpty && current !== value) {
        editor.commands.setContent(value || '')
      }
    }
  }, [editor, value])

  if (!editor) return null

  return (
    <div className={cn('rounded-xl border bg-card overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-muted/30">
        <ToolbarButton title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}><Bold className="w-3.5 h-3.5" /></ToolbarButton>
        <ToolbarButton title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}><Italic className="w-3.5 h-3.5" /></ToolbarButton>
        <ToolbarButton title="Underline" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}><UnderlineIcon className="w-3.5 h-3.5" /></ToolbarButton>
        <ToolbarButton title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')}><Strikethrough className="w-3.5 h-3.5" /></ToolbarButton>

        <Divider />

        <ToolbarButton title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}><Heading2 className="w-3.5 h-3.5" /></ToolbarButton>
        <ToolbarButton title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })}><Heading3 className="w-3.5 h-3.5" /></ToolbarButton>

        <Divider />

        <ToolbarButton title="Bullet list" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}><List className="w-3.5 h-3.5" /></ToolbarButton>
        <ToolbarButton title="Numbered list" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}><ListOrdered className="w-3.5 h-3.5" /></ToolbarButton>

        <Divider />

        <ToolbarButton title="Align left" onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })}><AlignLeft className="w-3.5 h-3.5" /></ToolbarButton>
        <ToolbarButton title="Align center" onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })}><AlignCenter className="w-3.5 h-3.5" /></ToolbarButton>
        <ToolbarButton title="Align right" onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })}><AlignRight className="w-3.5 h-3.5" /></ToolbarButton>
        <ToolbarButton title="Justify" onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })}><AlignJustify className="w-3.5 h-3.5" /></ToolbarButton>

        <Divider />

        <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo className="w-3.5 h-3.5" /></ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo className="w-3.5 h-3.5" /></ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent
        editor={editor}
        style={{ minHeight }}
        className="cursor-text [&_.tiptap]:min-h-[inherit] [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground/50 [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0"
      />
    </div>
  )
}
