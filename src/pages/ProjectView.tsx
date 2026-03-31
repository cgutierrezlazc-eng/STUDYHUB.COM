import React, { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Project, Document, ChatMessage } from '../types'
import { api } from '../services/api'

interface VideoDoc {
  id: string
  title: string
  sourceType: 'youtube' | 'file'
  sourceUrl?: string
  status: 'pending' | 'processing' | 'done' | 'error'
  transcription?: string
}

interface Props {
  projects: Project[]
  onUpdate: (project: Project) => void
  onDelete: (id: string) => void
}

const DOC_ICONS: Record<string, string> = {
  pdf: 'PDF', docx: 'DOC', xlsx: 'XLS', pptx: 'PPT', txt: 'TXT', csv: 'CSV', image: 'IMG', other: '?',
}

function getFileType(name: string): Document['type'] {
  const ext = name.split('.').pop()?.toLowerCase() || ''
  if (ext === 'pdf') return 'pdf'
  if (['doc', 'docx'].includes(ext)) return 'docx'
  if (['xls', 'xlsx'].includes(ext)) return 'xlsx'
  if (['ppt', 'pptx'].includes(ext)) return 'pptx'
  if (ext === 'txt') return 'txt'
  if (ext === 'csv') return 'csv'
  if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return 'image'
  return 'other'
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function ProjectView({ projects, onUpdate, onDelete }: Props) {
  const { id } = useParams<{ id: string }>()
  const project = projects.find(p => p.id === id)
  const [tab, setTab] = useState<'docs' | 'chat' | 'guide' | 'quiz' | 'live'>('docs')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [guide, setGuide] = useState<string | null>(null)
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false)
  const [videos, setVideos] = useState<VideoDoc[]>([])
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [addingVideo, setAddingVideo] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [zoomLink, setZoomLink] = useState('')
  const [savedZoomLink, setSavedZoomLink] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [liveTranscription, setLiveTranscription] = useState('')
  const [savingTranscription, setSavingTranscription] = useState(false)
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const [quizResult, setQuizResult] = useState<any>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<number | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (id) {
      api.getVideos(id).then(setVideos).catch(() => {})
    }
  }, [id])

  useEffect(() => {
    if (!showProjectMenu) return
    const handleClickOutside = () => setShowProjectMenu(false)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showProjectMenu])

  if (!project) {
    return (
      <div className="empty-state" style={{ marginTop: 100 }}>
        <h3>Asignatura no encontrada</h3>
      </div>
    )
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !project) return

    const newDocs: Document[] = Array.from(files).map(file => ({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      name: file.name,
      type: getFileType(file.name),
      path: URL.createObjectURL(file),
      size: file.size,
      uploadedAt: new Date().toISOString(),
      processed: false,
    }))

    const updated = {
      ...project,
      documents: [...project.documents, ...newDocs],
      updatedAt: new Date().toISOString(),
    }
    onUpdate(updated)

    // Try to upload to backend for processing
    for (const file of Array.from(files)) {
      try {
        await api.uploadDocument(project.id, file)
        // Mark as processed
        const doc = newDocs.find(d => d.name === file.name)
        if (doc) doc.processed = true
      } catch {
        // Backend not running yet, doc stored locally
      }
    }
    onUpdate({ ...updated, documents: [...updated.documents] })

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleElectronFileSelect = async () => {
    try {
      const electronAPI = (window as any).electronAPI
      if (electronAPI?.selectFiles) {
        const paths: string[] = await electronAPI.selectFiles()
        if (paths.length === 0) return

        const newDocs: Document[] = paths.map(p => {
          const name = p.split('/').pop() || p
          return {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            name,
            type: getFileType(name),
            path: p,
            size: 0,
            uploadedAt: new Date().toISOString(),
            processed: false,
          }
        })

        const updated = {
          ...project,
          documents: [...project.documents, ...newDocs],
          updatedAt: new Date().toISOString(),
        }
        onUpdate(updated)

        for (const p of paths) {
          try {
            await api.uploadDocumentFromPath(project.id, p)
          } catch { /* backend offline */ }
        }
      } else {
        fileInputRef.current?.click()
      }
    } catch {
      fileInputRef.current?.click()
    }
  }

  const handleDeleteDoc = (docId: string) => {
    const updated = {
      ...project,
      documents: project.documents.filter(d => d.id !== docId),
      updatedAt: new Date().toISOString(),
    }
    onUpdate(updated)
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date().toISOString(),
      projectId: project.id,
    }
    setMessages(prev => [...prev, userMsg])
    setChatInput('')
    setIsLoading(true)

    try {
      const res = await api.chat(project.id, userMsg.content)
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.response,
        timestamp: new Date().toISOString(),
        projectId: project.id,
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ No se pudo conectar con el backend. Asegúrate de que el servidor esté corriendo (npm run backend:start).',
        timestamp: new Date().toISOString(),
        projectId: project.id,
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportDocx = async (content: string) => {
    try {
      await api.exportDocx(project.id, content, `${project.name}-respuesta`)
    } catch {
      alert('No se pudo exportar. Verifica que el backend esté corriendo.')
    }
  }

  const handleAddYoutube = async () => {
    if (!youtubeUrl.trim()) return
    setAddingVideo(true)
    try {
      const vid = await api.addYoutubeVideo(project.id, youtubeUrl.trim())
      setVideos(prev => [...prev, vid])
      setYoutubeUrl('')
      setShowVideoModal(false)
    } catch {
      alert('No se pudo agregar el video. Verifica la URL.')
    } finally {
      setAddingVideo(false)
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAddingVideo(true)
    try {
      const vid = await api.uploadVideo(project.id, file)
      setVideos(prev => [...prev, vid])
      setShowVideoModal(false)
    } catch {
      alert('No se pudo subir el video.')
    } finally {
      setAddingVideo(false)
      if (videoInputRef.current) videoInputRef.current.value = ''
    }
  }

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      recordingChunksRef.current = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunksRef.current.push(e.data)
      }
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' })
        setRecordedBlob(blob)
        stream.getTracks().forEach(t => t.stop())
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      }
      mediaRecorder.start(1000)
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      setRecordingTime(0)
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    } catch {
      alert('No se pudo acceder al micrófono. Verifica los permisos.')
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleDownloadRecording = () => {
    if (!recordedBlob) return
    const url = URL.createObjectURL(recordedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${project.name}-clase-${new Date().toISOString().slice(0, 10)}.webm`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleTranscribeAndSave = async () => {
    if (!recordedBlob || !project) return
    setSavingTranscription(true)
    try {
      const file = new File([recordedBlob], 'recording.webm', { type: 'audio/webm' })
      const vid = await api.uploadVideo(project.id, file)
      setVideos(prev => [...prev, vid])
      setLiveTranscription('Grabación enviada para transcripción. Aparecerá en la pestaña Documentos cuando esté lista.')
    } catch {
      setLiveTranscription('No se pudo enviar la grabación. Verifica que el backend esté corriendo.')
    } finally {
      setSavingTranscription(false)
    }
  }

  const formatRecTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  const handleGenerateGuide = async () => {
    if (project.documents.length === 0) return
    setIsGeneratingGuide(true)
    try {
      const res = await api.generateGuide(project.id)
      setGuide(res.guide)
    } catch {
      setGuide('⚠️ No se pudo generar la guía. Verifica que el backend esté corriendo.')
    } finally {
      setIsGeneratingGuide(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 8,
              background: project.color + '22', color: project.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, fontWeight: 700,
            }}>
              {project.icon}
            </div>
            <div>
              <h2>{project.name}</h2>
              {project.description && <p>{project.description}</p>}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); setShowProjectMenu(!showProjectMenu) }} style={{ fontSize: 18, lineHeight: 1, padding: '4px 10px' }}>
              &#8942;
            </button>
            {showProjectMenu && (
              <div className="wa-dropdown-menu" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, minWidth: 180, zIndex: 10 }}>
                <button disabled style={{ opacity: 0.5 }}>
                  ✏️ Renombrar
                </button>
                <button className="wa-danger" onClick={() => {
                  if (confirm('¿Eliminar esta asignatura y todos sus documentos?')) {
                    setShowProjectMenu(false)
                    onDelete(project.id)
                  }
                }}>
                  🗑 Eliminar Asignatura
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="tabs" style={{ marginTop: 16 }}>
          <button className={`tab ${tab === 'docs' ? 'active' : ''}`} onClick={() => setTab('docs')}>
            Documentos ({project.documents.length})
          </button>
          <button className={`tab ${tab === 'chat' ? 'active' : ''}`} onClick={() => setTab('chat')}>
            Chat con tus Documentos
          </button>
          <button className={`tab ${tab === 'guide' ? 'active' : ''}`} onClick={() => setTab('guide')}>
            Guía de Estudio
          </button>
          <button className={`tab ${tab === 'quiz' ? 'active' : ''}`} onClick={() => setTab('quiz')}>
            Quiz
          </button>
          <button className={`tab ${tab === 'live' ? 'active' : ''}`} onClick={() => setTab('live')}>
            Clases en Vivo
          </button>
        </div>

        {/* Study Progress */}
        <div style={{ margin: '12px 0 0', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Progreso de Estudio</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {(() => {
                let steps = 0, done = 0
                steps++ // docs uploaded
                if (project.documents.length > 0) done++
                steps++ // guide generated
                if (guide) done++
                steps++ // quiz taken
                if (quizResult) done++
                return `${done}/${steps} completado (${Math.round(done / steps * 100)}%)`
              })()}
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              borderRadius: 3,
              background: 'var(--accent)',
              transition: 'width 0.3s',
              width: `${(() => {
                let steps = 0, done = 0
                steps++; if (project.documents.length > 0) done++
                steps++; if (guide) done++
                steps++; if (quizResult) done++
                return Math.round(done / steps * 100)
              })()}%`,
            }} />
          </div>
        </div>
      </div>

      <div className="page-body">
        {tab === 'docs' && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <div className="upload-zone" onClick={handleElectronFileSelect}>
              <div className="upload-zone-icon">📄</div>
              <h3>Arrastra archivos aquí o haz click para seleccionar</h3>
              <p>PDF, Word, Excel, PowerPoint, TXT, CSV, Imágenes</p>
            </div>

            {project.documents.length > 0 && (
              <div className="doc-list" style={{ marginTop: 20 }}>
                {project.documents.map(doc => (
                  <div key={doc.id} className="doc-item">
                    <div className={`doc-icon ${doc.type}`}>
                      {DOC_ICONS[doc.type] || '?'}
                    </div>
                    <div className="doc-info">
                      <div className="doc-name">{doc.name}</div>
                      <div className="doc-meta">
                        {doc.size > 0 ? formatSize(doc.size) + ' • ' : ''}
                        {new Date(doc.uploadedAt).toLocaleDateString('es')}
                      </div>
                    </div>
                    <span className={`doc-status ${doc.processed ? 'processed' : 'processing'}`}>
                      {doc.processed ? 'Procesado' : 'Pendiente'}
                    </span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteDoc(doc.id)}
                      style={{ marginLeft: 8 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Videos / YouTube */}
            <div style={{ marginTop: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ margin: 0 }}>🎬 Videos y Clases</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => setShowVideoModal(true)}>
                  + Agregar Video
                </button>
              </div>

              {showVideoModal && (
                <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                  <h4 style={{ marginTop: 0 }}>Agregar video o clase</h4>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="Pega un link de YouTube..."
                      value={youtubeUrl}
                      onChange={e => setYoutubeUrl(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddYoutube()}
                    />
                    <button className="btn btn-primary btn-sm" onClick={handleAddYoutube} disabled={addingVideo}>
                      {addingVideo ? '...' : 'Agregar'}
                    </button>
                  </div>
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, margin: '8px 0' }}>
                    — o sube un archivo de video/audio —
                  </div>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept=".mp4,.mp3,.wav,.m4a,.webm,.ogg,.avi,.mkv"
                    style={{ display: 'none' }}
                    onChange={handleVideoUpload}
                  />
                  <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => videoInputRef.current?.click()} disabled={addingVideo}>
                    📁 Seleccionar archivo
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => setShowVideoModal(false)}>
                    Cancelar
                  </button>
                </div>
              )}

              {videos.length > 0 ? (
                <div className="doc-list">
                  {videos.map(v => (
                    <div key={v.id} className="doc-item">
                      <div className="doc-icon" style={{ background: 'var(--accent-primary)22', color: 'var(--accent-primary)' }}>
                        {v.sourceType === 'youtube' ? '▶' : '🎥'}
                      </div>
                      <div className="doc-info">
                        <div className="doc-name">{v.title || 'Video sin título'}</div>
                        <div className="doc-meta">{v.sourceType === 'youtube' ? 'YouTube' : 'Archivo local'}</div>
                      </div>
                      <span className={`doc-status ${v.status === 'done' ? 'processed' : 'processing'}`}>
                        {v.status === 'done' ? 'Transcrito' : v.status === 'processing' ? 'Procesando...' : v.status === 'error' ? 'Error' : 'Pendiente'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : !showVideoModal && (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
                  Agrega videos de clases o YouTube para incluirlos en el chat
                </p>
              )}
            </div>
          </>
        )}

        {tab === 'chat' && (
          <div className="chat-container" style={{ height: 'calc(100vh - 240px)' }}>
            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon">💬</div>
                  <h3>Chatea sobre tus documentos</h3>
                  <p>Hazme preguntas sobre el material de {project.name}</p>
                </div>
              )}
              {messages.map(msg => (
                <div key={msg.id} className={`chat-message ${msg.role}`}>
                  {msg.content}
                  {msg.role === 'assistant' && !msg.content.startsWith('⚠️') && (
                    <button
                      className="btn btn-secondary btn-xs chat-export-btn"
                      onClick={() => handleExportDocx(msg.content)}
                      title="Descargar como Word"
                    >
                      📥 Word
                    </button>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="chat-message assistant">
                  <div className="loading-dots">
                    <span /><span /><span />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="chat-input-area">
              <textarea
                className="chat-input"
                placeholder={`Pregunta algo sobre ${project.name}...`}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                rows={1}
              />
              <button className="btn btn-primary" onClick={handleSendMessage} disabled={isLoading}>
                Enviar
              </button>
            </div>
          </div>
        )}

        {tab === 'guide' && (
          <>
            {!guide ? (
              <div className="empty-state">
                <div className="empty-state-icon">📖</div>
                <h3>Genera una guía de estudio</h3>
                <p>Conniku analizará todos los documentos de {project.name} y creará material de estudio personalizado</p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 16 }}
                  onClick={handleGenerateGuide}
                  disabled={isGeneratingGuide || project.documents.length === 0}
                >
                  {isGeneratingGuide ? 'Generando...' : 'Generar Guía de Estudio'}
                </button>
                {project.documents.length === 0 && (
                  <p style={{ marginTop: 8, color: 'var(--accent-orange)', fontSize: 13 }}>
                    Sube documentos primero para generar la guía
                  </p>
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <button className="btn btn-secondary btn-sm" onClick={handleGenerateGuide}>
                    Regenerar
                  </button>
                </div>
                <div className="guide-content card" dangerouslySetInnerHTML={{ __html: guide }} />
              </div>
            )}
          </>
        )}

        {tab === 'quiz' && (
          <div className="empty-state">
            <div className="empty-state-icon">🧠</div>
            <h3>Quiz de Repaso</h3>
            <p>Genera preguntas automáticas basadas en tus documentos</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} disabled>
              Próximamente
            </button>
          </div>
        )}

        {tab === 'live' && (
          <div className="live-class-container">
            {/* Zoom / Meeting Link */}
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ marginTop: 0 }}>🔗 Enlace de Clase en Vivo</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
                Pega el enlace de Zoom, Google Meet u otra plataforma para acceder a tu clase directamente
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="https://zoom.us/j/123456789 o meet.google.com/..."
                  value={zoomLink}
                  onChange={e => setZoomLink(e.target.value)}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    if (zoomLink.trim()) {
                      setSavedZoomLink(zoomLink.trim())
                    }
                  }}
                >
                  Guardar
                </button>
              </div>
              {savedZoomLink && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <a
                    href={savedZoomLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    🎥 Unirse a la Clase
                  </a>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, wordBreak: 'break-all' }}>
                    {savedZoomLink}
                  </span>
                </div>
              )}
            </div>

            {/* Recording */}
            <div className="card" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ marginTop: 0 }}>🎙️ Grabar Clase</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
                Graba el audio de tu clase para transcribirlo y agregarlo como material de estudio
              </p>

              {!isRecording && !recordedBlob && (
                <button className="btn btn-primary" onClick={handleStartRecording}>
                  ⏺ Iniciar Grabación
                </button>
              )}

              {isRecording && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="recording-indicator">
                    <span className="recording-dot" />
                    <span style={{ fontWeight: 600, fontSize: 18 }}>{formatRecTime(recordingTime)}</span>
                  </div>
                  <button className="btn btn-danger" onClick={handleStopRecording}>
                    ⏹ Detener
                  </button>
                </div>
              )}

              {recordedBlob && !isRecording && (
                <div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    <button className="btn btn-secondary" onClick={handleDownloadRecording}>
                      💾 Guardar en mi Computador
                    </button>
                    <button className="btn btn-primary" onClick={handleTranscribeAndSave} disabled={savingTranscription}>
                      {savingTranscription ? 'Enviando...' : '📝 Transcribir y Guardar en esta Asignatura'}
                    </button>
                    <button className="btn btn-secondary" onClick={() => { setRecordedBlob(null); setLiveTranscription('') }}>
                      🗑 Descartar
                    </button>
                  </div>
                  <audio controls src={URL.createObjectURL(recordedBlob!)} style={{ width: '100%', marginTop: 8 }} />
                </div>
              )}

              {liveTranscription && (
                <div className="card" style={{ marginTop: 16, padding: 12, background: 'var(--bg-hover)' }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>{liveTranscription}</p>
                </div>
              )}
            </div>

            {/* Save transcription to project selector */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ marginTop: 0 }}>📋 Transcripciones de Clases</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Las grabaciones transcritas aparecerán automáticamente en la pestaña <strong>Documentos</strong> de esta asignatura
                y estarán disponibles en el <strong>Chat con tus Documentos</strong> para consultar el contenido de tus clases.
              </p>
              {videos.filter(v => v.status === 'done').length > 0 ? (
                <div className="doc-list" style={{ marginTop: 12 }}>
                  {videos.filter(v => v.status === 'done').map(v => (
                    <div key={v.id} className="doc-item">
                      <div className="doc-icon" style={{ background: 'var(--accent-green)22', color: 'var(--accent-green)' }}>📝</div>
                      <div className="doc-info">
                        <div className="doc-name">{v.title || 'Transcripción de clase'}</div>
                        <div className="doc-meta">Transcripción disponible</div>
                      </div>
                      <span className="doc-status processed">Listo</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 12 }}>
                  Aún no hay transcripciones. Graba una clase o sube un video para comenzar.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
