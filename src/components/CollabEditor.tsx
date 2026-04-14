import React, { useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Image from '@tiptap/extension-image'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'

interface Props {
  content: string
  onUpdate: (html: string) => void
  editable?: boolean
}

export default function CollabEditor({ content, onUpdate, editable = true }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder: 'Comienza a escribir tu documento...' }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image,
      TextStyle,
      Color,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML())
    },
  })

  const addImage = useCallback(() => {
    if (!editor) return
    const url = prompt('URL de la imagen:')
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }, [editor])

  const addTable = useCallback(() => {
    if (!editor) return
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }, [editor])

  if (!editor) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      {editable && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 2, padding: '8px 12px',
          borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          {/* Text format */}
          <ToolbarGroup>
            <TBtn
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Negrita"
            >
              <b>B</b>
            </TBtn>
            <TBtn
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Cursiva"
            >
              <i>I</i>
            </TBtn>
            <TBtn
              active={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Subrayado"
            >
              <u>U</u>
            </TBtn>
            <TBtn
              active={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Tachado"
            >
              <s>S</s>
            </TBtn>
            <TBtn
              active={editor.isActive('highlight')}
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              title="Resaltar"
            >
              <span style={{ background: '#FBBF24', padding: '0 3px', borderRadius: 2 }}>H</span>
            </TBtn>
          </ToolbarGroup>

          <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />

          {/* Headings */}
          <ToolbarGroup>
            <TBtn
              active={editor.isActive('heading', { level: 1 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              title="Titulo 1"
            >
              H1
            </TBtn>
            <TBtn
              active={editor.isActive('heading', { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              title="Titulo 2"
            >
              H2
            </TBtn>
            <TBtn
              active={editor.isActive('heading', { level: 3 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              title="Titulo 3"
            >
              H3
            </TBtn>
          </ToolbarGroup>

          <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />

          {/* Lists */}
          <ToolbarGroup>
            <TBtn
              active={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Lista"
            >
              &bull;
            </TBtn>
            <TBtn
              active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Lista numerada"
            >
              1.
            </TBtn>
            <TBtn
              active={editor.isActive('taskList')}
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              title="Lista de tareas"
            >
              &#9745;
            </TBtn>
          </ToolbarGroup>

          <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />

          {/* Alignment */}
          <ToolbarGroup>
            <TBtn
              active={editor.isActive({ textAlign: 'left' })}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              title="Izquierda"
            >
              &#8676;
            </TBtn>
            <TBtn
              active={editor.isActive({ textAlign: 'center' })}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              title="Centro"
            >
              &#8596;
            </TBtn>
            <TBtn
              active={editor.isActive({ textAlign: 'right' })}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              title="Derecha"
            >
              &#8677;
            </TBtn>
          </ToolbarGroup>

          <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />

          {/* Blocks */}
          <ToolbarGroup>
            <TBtn
              active={editor.isActive('blockquote')}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              title="Cita"
            >
              &ldquo;
            </TBtn>
            <TBtn
              active={editor.isActive('codeBlock')}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              title="Bloque de codigo"
            >
              {'</>'}
            </TBtn>
            <TBtn onClick={addTable} title="Insertar tabla">
              &#9638;
            </TBtn>
            <TBtn onClick={addImage} title="Insertar imagen">
              &#128247;
            </TBtn>
          </ToolbarGroup>

          <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />

          {/* Undo/Redo */}
          <ToolbarGroup>
            <TBtn
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Deshacer"
            >
              &#8630;
            </TBtn>
            <TBtn
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Rehacer"
            >
              &#8631;
            </TBtn>
          </ToolbarGroup>
        </div>
      )}

      {/* Editor content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
        <EditorContent editor={editor} />
      </div>

      {/* Editor styles */}
      <style>{`
        .tiptap {
          outline: none;
          min-height: 400px;
          font-size: 15px;
          line-height: 1.7;
          color: var(--text-primary);
        }
        .tiptap p { margin: 0 0 8px; }
        .tiptap h1 { font-size: 28px; font-weight: 700; margin: 24px 0 12px; }
        .tiptap h2 { font-size: 22px; font-weight: 600; margin: 20px 0 10px; }
        .tiptap h3 { font-size: 18px; font-weight: 600; margin: 16px 0 8px; }
        .tiptap ul, .tiptap ol { padding-left: 24px; margin: 8px 0; }
        .tiptap li { margin: 4px 0; }
        .tiptap blockquote {
          border-left: 3px solid var(--accent);
          padding-left: 16px;
          margin: 12px 0;
          color: var(--text-secondary);
          font-style: italic;
        }
        .tiptap pre {
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 12px 16px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          overflow-x: auto;
          margin: 12px 0;
        }
        .tiptap code {
          background: var(--bg-primary);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 13px;
          font-family: 'JetBrains Mono', monospace;
        }
        .tiptap pre code { background: none; padding: 0; }
        .tiptap img {
          max-width: 100%;
          border-radius: 8px;
          margin: 12px 0;
        }
        .tiptap table {
          border-collapse: collapse;
          width: 100%;
          margin: 12px 0;
        }
        .tiptap th, .tiptap td {
          border: 1px solid var(--border);
          padding: 8px 12px;
          text-align: left;
        }
        .tiptap th {
          background: var(--bg-primary);
          font-weight: 600;
        }
        .tiptap ul[data-type="taskList"] {
          list-style: none;
          padding-left: 0;
        }
        .tiptap ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .tiptap ul[data-type="taskList"] li label {
          margin-top: 3px;
        }
        .tiptap mark { background: #FBBF24; padding: 0 2px; border-radius: 2px; }
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--text-muted);
          pointer-events: none;
          height: 0;
        }
        .tiptap hr {
          border: none;
          border-top: 1px solid var(--border);
          margin: 20px 0;
        }
      `}</style>
    </div>
  )
}

/* ─── Toolbar helpers ─────────────────────────────────────────── */

function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 2 }}>{children}</div>
}

function TBtn({ children, active, disabled, onClick, title }: {
  children: React.ReactNode
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 6, border: 'none',
        background: active ? 'var(--accent-muted, rgba(45,98,200,0.15))' : 'transparent',
        color: active ? 'var(--accent, #2D62C8)' : disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 14, fontWeight: active ? 700 : 500,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {children}
    </button>
  )
}
