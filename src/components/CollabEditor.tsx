import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Collaboration from '@tiptap/extension-collaboration';
import FontFamily from '@tiptap/extension-font-family';
import Link from '@tiptap/extension-link';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

interface Props {
  content: string;
  onUpdate: (html: string) => void;
  editable?: boolean;
  docId?: string;
  userName?: string;
  userColor?: string;
}

function getWsUrl(): string {
  const apiBase =
    localStorage.getItem('conniku_server_url') ||
    (import.meta as any).env?.VITE_API_URL ||
    'https://studyhub-api-bpco.onrender.com';
  return apiBase.replace(/^http/, 'ws');
}

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72];

const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: "'Times New Roman', serif" },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier New', value: "'Courier New', monospace" },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Trebuchet MS', value: "'Trebuchet MS', sans-serif" },
  { label: 'Garamond', value: 'Garamond, serif' },
  { label: 'Comic Sans MS', value: "'Comic Sans MS', cursive" },
];

const COLOR_PALETTE = [
  // Row 1 - Blacks/Grays
  '#000000',
  '#434343',
  '#666666',
  '#999999',
  '#b7b7b7',
  '#cccccc',
  '#d9d9d9',
  '#efefef',
  // Row 2 - Dark colors
  '#ffffff',
  '#ff0000',
  '#ff9900',
  '#ffff00',
  '#00ff00',
  '#00ffff',
  '#4a86e8',
  '#9900ff',
  // Row 3 - Medium
  '#ff00ff',
  '#980000',
  '#ff0000',
  '#ff9900',
  '#ffff00',
  '#00ff00',
  '#00ffff',
  '#0000ff',
  // Row 4 - More
  '#9900ff',
  '#ff00ff',
  '#e6b8a2',
  '#f4cccc',
  '#fce5cd',
  '#fff2cc',
  '#d9ead3',
  '#d0e0e3',
  // Row 5 - Light
  '#c9daf8',
  '#cfe2f3',
  '#d9d2e9',
  '#ead1dc',
  '#dd7e6b',
  '#ea9999',
  '#f9cb9c',
  '#ffe599',
  // Row 6 - More light
  '#b6d7a8',
  '#a2c4c9',
  '#a4c2f4',
  '#9fc5e8',
  '#b4a7d6',
  '#d5a6bd',
  '#cc4125',
  '#e06666',
  // Row 7 - Dark saturated
  '#f6b26b',
  '#ffd966',
  '#93c47d',
  '#76a5af',
  '#6d9eeb',
  '#6fa8dc',
  '#8e7cc3',
  '#c27ba0',
  // Row 8 - Darkest
  '#a61c00',
  '#cc0000',
  '#e69138',
  '#f1c232',
  '#6aa84f',
  '#45818e',
  '#3c78d8',
  '#3d85c8',
];

const HIGHLIGHT_COLORS = [
  '#ffff00',
  '#00ff00',
  '#00ffff',
  '#ff00ff',
  '#ff0000',
  '#ffd966',
  '#93c47d',
  '#76a5af',
  '#e06666',
  '#b4a7d6',
  '#ffe599',
  '#b6d7a8',
  '#a2c4c9',
  '#ea9999',
  '#d5a6bd',
  '#ffffff',
  '#cccccc',
  '#000000',
];

export default function CollabEditor({
  content,
  onUpdate,
  editable = true,
  docId,
  userName,
  userColor,
}: Props) {
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const contentSetRef = useRef(false);

  // Dropdown state
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const [fontSizeInputValue, setFontSizeInputValue] = useState('11');
  const [textColorPickerOpen, setTextColorPickerOpen] = useState(false);
  const [highlightPickerOpen, setHighlightPickerOpen] = useState(false);
  const [activeTextColor, setActiveTextColor] = useState('#000000');
  const [activeHighlightColor, setActiveHighlightColor] = useState('#ffff00');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const styleDropdownRef = useRef<HTMLDivElement>(null);
  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const textColorRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  const { ydoc, provider } = useMemo(() => {
    if (!docId) return { ydoc: null, provider: null };
    const doc = new Y.Doc();
    const token = localStorage.getItem('conniku_token') || '';
    const wsUrl = getWsUrl();
    const prov = new WebsocketProvider(wsUrl, `ws/doc/${docId}`, doc, {
      params: { token },
      connect: true,
      WebSocketPolyfill: WebSocket as any,
    });
    ydocRef.current = doc;
    providerRef.current = prov;
    return { ydoc: doc, provider: prov };
  }, [docId]);

  useEffect(() => {
    if (!provider) return;
    let messageHandler: ((event: MessageEvent) => void) | null = null;
    const attach = () => {
      const socket = (provider as any).ws;
      if (socket) {
        messageHandler = (event: MessageEvent) => {
          if (typeof event.data === 'string') {
            try {
              const msg = JSON.parse(event.data);
              if (msg.type === 'presence') setOnlineUsers(msg.users || []);
            } catch {
              /* binary or non-JSON */
            }
          }
        };
        socket.addEventListener('message', messageHandler);
      }
    };
    provider.on('status', ({ status }: any) => {
      if (status === 'connected') attach();
    });
    attach();
    return () => {
      const socket = (provider as any).ws;
      if (socket && messageHandler) socket.removeEventListener('message', messageHandler);
    };
  }, [provider]);

  useEffect(() => {
    return () => {
      providerRef.current?.destroy();
      ydocRef.current?.destroy();
    };
  }, []);

  const extensions = useMemo(() => {
    const base = [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        horizontalRule: {},
        ...(docId ? { history: false } : {}),
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
      FontFamily.configure({ types: ['textStyle'] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'editor-link' } }),
    ];
    if (ydoc) {
      base.push(Collaboration.configure({ document: ydoc }) as any);
    }
    return base;
  }, [docId, ydoc, provider, userName, userColor]);

  const editor = useEditor(
    {
      extensions,
      content: docId ? undefined : content,
      editable,
      onUpdate: ({ editor }) => {
        onUpdate(editor.getHTML());
        // Update word/char count
        const text = editor.getText();
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        setWordCount(words);
        setCharCount(text.length);
      },
    },
    [extensions]
  );

  useEffect(() => {
    if (!editor || !docId || contentSetRef.current) return;
    const timer = setTimeout(() => {
      if (!contentSetRef.current && editor.isEmpty && content) {
        editor.commands.setContent(content);
        contentSetRef.current = true;
      }
    }, 1500);
    contentSetRef.current = true;
    return () => clearTimeout(timer);
  }, [editor, docId, content]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (styleDropdownRef.current && !styleDropdownRef.current.contains(e.target as Node))
        setStyleDropdownOpen(false);
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(e.target as Node))
        setFontDropdownOpen(false);
      if (textColorRef.current && !textColorRef.current.contains(e.target as Node))
        setTextColorPickerOpen(false);
      if (highlightRef.current && !highlightRef.current.contains(e.target as Node))
        setHighlightPickerOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addImage = useCallback(() => {
    if (!editor) return;
    const url = prompt('URL de la imagen:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const addTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = prompt('URL del enlace:', previousUrl || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const changeFontSize = useCallback(
    (delta: number) => {
      if (!editor) return;
      const current = parseInt(fontSizeInputValue, 10) || 11;
      const newSize = Math.max(8, Math.min(72, current + delta));
      setFontSizeInputValue(String(newSize));
      editor
        .chain()
        .focus()
        .setMark('textStyle', { fontSize: `${newSize}px` })
        .run();
    },
    [editor, fontSizeInputValue]
  );

  const applyFontSize = useCallback(
    (size: number) => {
      if (!editor) return;
      setFontSizeInputValue(String(size));
      editor
        .chain()
        .focus()
        .setMark('textStyle', { fontSize: `${size}px` })
        .run();
    },
    [editor]
  );

  const getActiveStyle = () => {
    if (!editor) return 'Texto normal';
    if (editor.isActive('heading', { level: 1 })) return 'Título 1';
    if (editor.isActive('heading', { level: 2 })) return 'Título 2';
    if (editor.isActive('heading', { level: 3 })) return 'Título 3';
    return 'Texto normal';
  };

  const getActiveFont = () => {
    if (!editor) return 'Arial';
    const attrs = editor.getAttributes('textStyle');
    if (attrs?.fontFamily) {
      const found = FONT_FAMILIES.find((f) => f.value === attrs.fontFamily);
      return found ? found.label : 'Arial';
    }
    return 'Arial';
  };

  if (!editor) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-primary)',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* ─── Toolbar ─────────────────────────────────────────────── */}
      {editable && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border)',
            position: 'sticky',
            top: 0,
            zIndex: 20,
            userSelect: 'none',
          }}
        >
          {/* Toolbar Row */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 1,
              padding: '6px 8px',
            }}
          >
            {/* Undo / Redo */}
            <ToolbarBtn
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Deshacer (Ctrl+Z)"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 7v6h6" />
                <path d="M3 13C5.333 7 9.667 4 16 4c3.5 0 6 1.5 7.5 4.5" />
              </svg>
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Rehacer (Ctrl+Y)"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 7v6h-6" />
                <path d="M21 13C18.667 7 14.333 4 8 4c-3.5 0-6 1.5-7.5 4.5" />
              </svg>
            </ToolbarBtn>

            <TBSep />

            {/* Style Dropdown */}
            <div ref={styleDropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setStyleDropdownOpen((v) => !v);
                  setFontDropdownOpen(false);
                  setTextColorPickerOpen(false);
                  setHighlightPickerOpen(false);
                }}
                style={{
                  height: 28,
                  minWidth: 120,
                  padding: '0 8px',
                  border: '1px solid transparent',
                  borderRadius: 4,
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 13,
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ flex: 1, textAlign: 'left' }}>{getActiveStyle()}</span>
                <svg viewBox="0 0 10 6" width="10" height="6" fill="currentColor">
                  <path d="M0 0l5 6 5-6z" />
                </svg>
              </button>
              {styleDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    zIndex: 100,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    minWidth: 200,
                    overflow: 'hidden',
                    animation: 'dropdownIn 0.12s ease',
                  }}
                >
                  {[
                    {
                      label: 'Texto normal',
                      action: () => editor.chain().focus().setParagraph().run(),
                      style: { fontSize: 14 },
                    },
                    {
                      label: 'Título 1',
                      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
                      style: { fontSize: 28, fontWeight: 700 },
                    },
                    {
                      label: 'Título 2',
                      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
                      style: { fontSize: 22, fontWeight: 600 },
                    },
                    {
                      label: 'Título 3',
                      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
                      style: { fontSize: 18, fontWeight: 600 },
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        item.action();
                        setStyleDropdownOpen(false);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '10px 16px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        ...item.style,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <TBSep />

            {/* Font Family Dropdown */}
            <div ref={fontDropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setFontDropdownOpen((v) => !v);
                  setStyleDropdownOpen(false);
                  setTextColorPickerOpen(false);
                  setHighlightPickerOpen(false);
                }}
                style={{
                  height: 28,
                  minWidth: 130,
                  padding: '0 8px',
                  border: '1px solid transparent',
                  borderRadius: 4,
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 13,
                  whiteSpace: 'nowrap',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    fontFamily:
                      FONT_FAMILIES.find((f) => f.label === getActiveFont())?.value || 'Arial',
                  }}
                >
                  {getActiveFont()}
                </span>
                <svg viewBox="0 0 10 6" width="10" height="6" fill="currentColor">
                  <path d="M0 0l5 6 5-6z" />
                </svg>
              </button>
              {fontDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    zIndex: 100,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                    minWidth: 180,
                    overflow: 'hidden',
                    animation: 'dropdownIn 0.12s ease',
                  }}
                >
                  {FONT_FAMILIES.map((font) => (
                    <button
                      key={font.value}
                      onClick={() => {
                        editor.chain().focus().setFontFamily(font.value).run();
                        setFontDropdownOpen(false);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '9px 16px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontFamily: font.value,
                        fontSize: 14,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <TBSep />

            {/* Font Size */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ToolbarBtn onClick={() => changeFontSize(-1)} title="Reducir tamaño">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M5 11h14v2H5z" />
                </svg>
              </ToolbarBtn>
              <input
                type="text"
                value={fontSizeInputValue}
                onChange={(e) => setFontSizeInputValue(e.target.value)}
                onBlur={() => {
                  const n = parseInt(fontSizeInputValue, 10);
                  if (!isNaN(n) && n >= 8 && n <= 72) applyFontSize(n);
                  else setFontSizeInputValue('11');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const n = parseInt(fontSizeInputValue, 10);
                    if (!isNaN(n) && n >= 8 && n <= 72) applyFontSize(n);
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                style={{
                  width: 36,
                  height: 28,
                  textAlign: 'center',
                  border: '1px solid var(--border)',
                  borderRadius: 4,
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <ToolbarBtn onClick={() => changeFontSize(1)} title="Aumentar tamaño">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" />
                </svg>
              </ToolbarBtn>
            </div>

            <TBSep />

            {/* Bold */}
            <ToolbarBtn
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Negrita (Ctrl+B)"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M15.6 11.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 7.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
              </svg>
            </ToolbarBtn>

            {/* Italic */}
            <ToolbarBtn
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Cursiva (Ctrl+I)"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
              </svg>
            </ToolbarBtn>

            {/* Underline */}
            <ToolbarBtn
              active={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Subrayado (Ctrl+U)"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
              </svg>
            </ToolbarBtn>

            {/* Strikethrough */}
            <ToolbarBtn
              active={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Tachado"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z" />
              </svg>
            </ToolbarBtn>

            <TBSep />

            {/* Text Color */}
            <div ref={textColorRef} style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setTextColorPickerOpen((v) => !v);
                  setHighlightPickerOpen(false);
                  setStyleDropdownOpen(false);
                  setFontDropdownOpen(false);
                }}
                title="Color de texto"
                style={{
                  width: 28,
                  height: 28,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  borderRadius: 4,
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 2,
                  gap: 1,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--text-primary)">
                  <path d="M11.16 3L3 21h3.6l1.71-4.5h7.58L17.4 21H21L12.84 3h-1.68zm-1.33 10.5L12 7.67l2.17 5.83H9.83z" />
                </svg>
                <div
                  style={{ width: 16, height: 3, borderRadius: 1, background: activeTextColor }}
                />
              </button>
              {textColorPickerOpen && (
                <ColorPickerDropdown
                  colors={COLOR_PALETTE}
                  onSelect={(color) => {
                    editor.chain().focus().setColor(color).run();
                    setActiveTextColor(color);
                    setTextColorPickerOpen(false);
                  }}
                  onReset={() => {
                    editor.chain().focus().unsetColor().run();
                    setActiveTextColor('#000000');
                    setTextColorPickerOpen(false);
                  }}
                />
              )}
            </div>

            {/* Highlight Color */}
            <div ref={highlightRef} style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setHighlightPickerOpen((v) => !v);
                  setTextColorPickerOpen(false);
                  setStyleDropdownOpen(false);
                  setFontDropdownOpen(false);
                }}
                title="Resaltar texto"
                style={{
                  width: 28,
                  height: 28,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  borderRadius: 4,
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 2,
                  gap: 1,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="var(--text-primary)">
                  <path d="M15.5 3.5c-.83 0-1.5.67-1.5 1.5v1H10V4c0-.55-.45-1-1-1s-1 .45-1 1v1H5v2h1l1 10h10l1-10h1V6h-3V5c0-.83-.67-1.5-1.5-1.5zm-5 0h3V5h-3V3.5zm5.5 4.5l-.83 8H8.83L8 8h7z" />
                </svg>
                <div
                  style={{
                    width: 16,
                    height: 3,
                    borderRadius: 1,
                    background: activeHighlightColor,
                  }}
                />
              </button>
              {highlightPickerOpen && (
                <ColorPickerDropdown
                  colors={HIGHLIGHT_COLORS}
                  onSelect={(color) => {
                    editor.chain().focus().setHighlight({ color }).run();
                    setActiveHighlightColor(color);
                    setHighlightPickerOpen(false);
                  }}
                  onReset={() => {
                    editor.chain().focus().unsetHighlight().run();
                    setHighlightPickerOpen(false);
                  }}
                  columns={6}
                />
              )}
            </div>

            <TBSep />

            {/* Link */}
            <ToolbarBtn
              active={editor.isActive('link')}
              onClick={addLink}
              title="Insertar enlace (Ctrl+K)"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </ToolbarBtn>

            {/* Image */}
            <ToolbarBtn onClick={addImage} title="Insertar imagen">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </ToolbarBtn>

            {/* Table */}
            <ToolbarBtn onClick={addTable} title="Insertar tabla">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
              </svg>
            </ToolbarBtn>

            <TBSep />

            {/* Align Left */}
            <ToolbarBtn
              active={editor.isActive({ textAlign: 'left' })}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              title="Alinear a la izquierda"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z" />
              </svg>
            </ToolbarBtn>

            {/* Align Center */}
            <ToolbarBtn
              active={editor.isActive({ textAlign: 'center' })}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              title="Centrar"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z" />
              </svg>
            </ToolbarBtn>

            {/* Align Right */}
            <ToolbarBtn
              active={editor.isActive({ textAlign: 'right' })}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              title="Alinear a la derecha"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z" />
              </svg>
            </ToolbarBtn>

            {/* Justify */}
            <ToolbarBtn
              active={editor.isActive({ textAlign: 'justify' })}
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              title="Justificar"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z" />
              </svg>
            </ToolbarBtn>

            <TBSep />

            {/* Bullet List */}
            <ToolbarBtn
              active={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Lista con viñetas"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z" />
              </svg>
            </ToolbarBtn>

            {/* Ordered List */}
            <ToolbarBtn
              active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Lista numerada"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M2 17h2v.5H3v1h1v.5H2v1h3v-4H2v1zm1-9h1V4H2v1h1v3zm-1 3h1.8L2 13.1v.9h3v-1H3.2L5 10.9V10H2v1zm5-6v2h14V5H7zm0 14h14v-2H7v2zm0-6h14v-2H7v2z" />
              </svg>
            </ToolbarBtn>

            {/* Task List */}
            <ToolbarBtn
              active={editor.isActive('taskList')}
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              title="Lista de tareas"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </ToolbarBtn>

            <TBSep />

            {/* Indent Decrease */}
            <ToolbarBtn
              onClick={() => editor.chain().focus().liftListItem('listItem').run()}
              title="Reducir sangría"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M11 17h10v-2H11v2zm-8-5l4 4V8l-4 4zm0 9h18v-2H3v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z" />
              </svg>
            </ToolbarBtn>

            {/* Indent Increase */}
            <ToolbarBtn
              onClick={() => editor.chain().focus().sinkListItem('listItem').run()}
              title="Aumentar sangría"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M3 21h18v-2H3v2zM3 8v8l4-4-4-4zm8 9h10v-2H11v2zM3 3v2h18V3H3zm8 6h10V7H11v2zm0 4h10v-2H11v2z" />
              </svg>
            </ToolbarBtn>

            <TBSep />

            {/* Blockquote */}
            <ToolbarBtn
              active={editor.isActive('blockquote')}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              title="Cita"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
              </svg>
            </ToolbarBtn>

            {/* Code Block */}
            <ToolbarBtn
              active={editor.isActive('codeBlock')}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              title="Bloque de código"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </ToolbarBtn>

            {/* Horizontal Rule */}
            <ToolbarBtn
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Línea horizontal"
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
              </svg>
            </ToolbarBtn>

            {/* Clear Formatting */}
            <ToolbarBtn
              onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
              title="Limpiar formato"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M3.27 5L2 6.27l6.97 6.97L6.5 19h3l1.57-3.66L16.73 21 18 19.73 3.27 5zM6 5v.18L8.82 8h2.4l-.72 1.68 2.1 2.1L14.21 8H20V5H6z" />
              </svg>
            </ToolbarBtn>

            {/* Spacer + Online users */}
            <div style={{ flex: 1 }} />
            {docId && onlineUsers.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ display: 'flex' }}>
                  {onlineUsers.map((u, i) => (
                    <div
                      key={u.userId || i}
                      title={u.name}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        background: u.color || '#666',
                        border: '2px solid var(--bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 700,
                        marginLeft: i > 0 ? -8 : 0,
                        overflow: 'hidden',
                        zIndex: onlineUsers.length - i,
                        position: 'relative',
                      }}
                    >
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        (u.name?.[0] || '?').toUpperCase()
                      )}
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {onlineUsers.length} en línea
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Paper Container ─────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          background: '#f0f0f0',
          padding: '32px 0 48px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 816,
            minHeight: 1056,
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
            borderRadius: 2,
            padding: '96px 96px 128px',
            boxSizing: 'border-box',
            position: 'relative',
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* ─── Status Bar ──────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '4px 16px',
          background: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border)',
          fontSize: 12,
          color: 'var(--text-muted)',
        }}
      >
        <span>
          {wordCount.toLocaleString('es-CL')} {wordCount === 1 ? 'palabra' : 'palabras'}
        </span>
        <span style={{ color: 'var(--border)' }}>|</span>
        <span>{charCount.toLocaleString('es-CL')} caracteres</span>
        <div style={{ flex: 1 }} />
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: editable ? 'var(--text-secondary)' : 'var(--text-muted)',
          }}
        >
          {editable ? (
            <>
              <svg
                viewBox="0 0 24 24"
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edición
            </>
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Solo lectura
            </>
          )}
        </span>
      </div>

      {/* ─── Styles ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .tiptap {
          outline: none;
          min-height: 800px;
          font-size: 11pt;
          line-height: 1.75;
          color: #1a1a1a;
          font-family: Arial, sans-serif;
          caret-color: #1a1a1a;
        }
        .tiptap p {
          margin: 0 0 12px;
          color: #1a1a1a;
        }
        .tiptap h1 {
          font-size: 26pt;
          font-weight: 700;
          margin: 28px 0 12px;
          color: #1a1a1a;
          line-height: 1.3;
        }
        .tiptap h2 {
          font-size: 20pt;
          font-weight: 600;
          margin: 24px 0 10px;
          color: #1a1a1a;
          line-height: 1.35;
        }
        .tiptap h3 {
          font-size: 15pt;
          font-weight: 600;
          margin: 20px 0 8px;
          color: #1a1a1a;
          line-height: 1.4;
        }
        .tiptap ul,
        .tiptap ol {
          padding-left: 28px;
          margin: 6px 0 12px;
          color: #1a1a1a;
        }
        .tiptap li {
          margin: 3px 0;
          line-height: 1.75;
        }
        .tiptap blockquote {
          border-left: 3px solid #4285f4;
          padding-left: 18px;
          margin: 16px 0;
          color: #555;
          font-style: italic;
        }
        .tiptap pre {
          background: #f8f9fa;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 14px 18px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          overflow-x: auto;
          margin: 14px 0;
          color: #333;
        }
        .tiptap code {
          background: #f1f3f4;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 12px;
          font-family: 'Courier New', monospace;
          color: #c0392b;
        }
        .tiptap pre code {
          background: none;
          padding: 0;
          color: inherit;
          font-size: inherit;
        }
        .tiptap img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 14px 0;
        }
        .tiptap table {
          border-collapse: collapse;
          width: 100%;
          margin: 16px 0;
        }
        .tiptap th,
        .tiptap td {
          border: 1px solid #c0c0c0;
          padding: 8px 12px;
          text-align: left;
          min-width: 40px;
          vertical-align: top;
          color: #1a1a1a;
        }
        .tiptap th {
          background: #f2f3f4;
          font-weight: 600;
        }
        .tiptap .selectedCell:after {
          background: rgba(66, 133, 244, 0.15);
          content: "";
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }
        .tiptap ul[data-type="taskList"] {
          list-style: none;
          padding-left: 4px;
        }
        .tiptap ul[data-type="taskList"] li {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }
        .tiptap ul[data-type="taskList"] li > label {
          margin-top: 4px;
          flex-shrink: 0;
        }
        .tiptap ul[data-type="taskList"] li > label input[type="checkbox"] {
          width: 14px;
          height: 14px;
          cursor: pointer;
          accent-color: #4285f4;
        }
        .tiptap ul[data-type="taskList"] li > div {
          flex: 1;
        }
        .tiptap mark {
          padding: 1px 0;
          border-radius: 2px;
        }
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #b0b0b0;
          pointer-events: none;
          height: 0;
        }
        .tiptap hr {
          border: none;
          border-top: 1px solid #dadce0;
          margin: 24px 0;
        }
        .tiptap a.editor-link {
          color: #1155cc;
          text-decoration: underline;
          cursor: pointer;
        }
        .tiptap a.editor-link:hover {
          color: #0842a0;
        }
        .ProseMirror-focused {
          outline: none;
        }

        @media print {
          .tiptap { min-height: unset; }
        }
      `}</style>
    </div>
  );
}

/* ─── Helper Components ───────────────────────────────────────── */

function TBSep() {
  return (
    <div
      style={{
        width: 1,
        height: 20,
        background: 'var(--border)',
        margin: '0 4px',
        flexShrink: 0,
      }}
    />
  );
}

function ToolbarBtn({
  children,
  active,
  disabled,
  onClick,
  title,
}: {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 28,
        height: 28,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        borderRadius: 4,
        border: 'none',
        background: active ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
        color: active ? '#4285f4' : disabled ? 'var(--text-muted)' : 'var(--text-secondary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background 0.1s, color 0.1s',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        if (!disabled && !active)
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--border)';
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
    >
      {children}
    </button>
  );
}

function ColorPickerDropdown({
  colors,
  onSelect,
  onReset,
  columns = 8,
}: {
  colors: string[];
  onSelect: (color: string) => void;
  onReset: () => void;
  columns?: number;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        zIndex: 100,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
        padding: '10px',
        minWidth: columns * 22 + 20,
        animation: 'dropdownIn 0.12s ease',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 18px)`,
          gap: 3,
          marginBottom: 8,
        }}
      >
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onSelect(color)}
            title={color}
            style={{
              width: 18,
              height: 18,
              borderRadius: 2,
              border: '1px solid rgba(0,0,0,0.15)',
              background: color,
              cursor: 'pointer',
              padding: 0,
              transition: 'transform 0.1s, box-shadow 0.1s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.2)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          />
        ))}
      </div>
      <button
        onClick={onReset}
        style={{
          width: '100%',
          padding: '5px 8px',
          border: '1px solid var(--border)',
          borderRadius: 4,
          background: 'transparent',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: 12,
          textAlign: 'center',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        Predeterminado
      </button>
    </div>
  );
}
