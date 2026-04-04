import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'
import { SharedDoc } from '../types'

interface Props {
  onNavigate: (path: string) => void
}

export default function Marketplace({ onNavigate }: Props) {
  const { user } = useAuth()
  const [documents, setDocuments] = useState<SharedDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterUniversity, setFilterUniversity] = useState('')
  const [showShare, setShowShare] = useState(false)
  const [shareTitle, setShareTitle] = useState('')
  const [shareDesc, setShareDesc] = useState('')
  const [shareCourse, setShareCourse] = useState('')
  const [shareFile, setShareFile] = useState<string>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    loadDocuments()
  }, [page])

  const loadDocuments = async () => {
    try {
      const data = await api.getMarketplaceDocuments(search || undefined, filterUniversity || undefined, undefined, page)
      setDocuments(data.documents || [])
      setTotal(data.total || 0)
    } catch (err: any) {
      console.error('Error loading marketplace:', err)
    }
    setLoading(false)
  }

  const handleSearch = () => {
    setPage(1)
    loadDocuments()
  }

  const handleShare = async () => {
    if (!shareTitle.trim() || !shareFile) return
    try {
      await api.shareDocument({
        title: shareTitle.trim(),
        description: shareDesc,
        course_name: shareCourse,
        file_path: shareFile,
      })
      setShowShare(false)
      setShareTitle(''); setShareDesc(''); setShareCourse(''); setShareFile('')
      loadDocuments()
      alert('¡Documento compartido! Gracias por contribuir a la comunidad.')
    } catch (err: any) {
      alert(err.message || 'Error al compartir')
    }
  }

  const handleRate = async (docId: string, rating: number) => {
    try {
      const result = await api.rateDocument(docId, rating)
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, rating: result.rating, ratingCount: result.count } : d))
    } catch (err: any) {
      alert(err.message || 'Error al calificar')
    }
  }

  const handleDownload = async (docId: string) => {
    try {
      await api.downloadDocument(docId)
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, downloads: d.downloads + 1 } : d))
    } catch (err: any) { console.error('Download failed:', err) }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setShareFile(reader.result as string)
    reader.readAsDataURL(file)
  }

  const renderStars = (rating: number, docId: string) => (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} onClick={() => handleRate(docId, star)} style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 0,
          color: star <= rating ? '#fbbf24' : 'var(--text-muted)',
        }}>★</button>
      ))}
    </div>
  )

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>📚 Marketplace de Apuntes</h2>
            <p>Comparte y descubre material de estudio de otros estudiantes</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowShare(true)}>+ Compartir Apuntes</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar por título o materia..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          />
          <input
            value={filterUniversity}
            onChange={e => setFilterUniversity(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Universidad..."
            style={{ width: 180, padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          />
          <button className="btn btn-primary" onClick={handleSearch}>Buscar</button>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading-dots"><span /><span /><span /></div>
        ) : documents.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <div style={{ fontSize: 48 }}>📚</div>
            <h3>No hay apuntes todavía</h3>
            <p>Sé el primero en compartir material de estudio con la comunidad</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowShare(true)}>
              Compartir mis apuntes
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {documents.map(doc => (
                <div key={doc.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px', fontSize: 15 }}>{doc.title}</h4>
                      {doc.courseName && <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>{doc.courseName}</div>}
                    </div>
                    <span style={{
                      background: 'var(--accent-primary)22', color: 'var(--accent)',
                      padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                    }}>{doc.fileType.toUpperCase()}</span>
                  </div>
                  {doc.description && <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 8px' }}>{doc.description.slice(0, 100)}</p>}
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                    {doc.university && <span>🏫 {doc.university}</span>}
                    {doc.career && <span> · 🎓 {doc.career}</span>}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    {renderStars(doc.rating, doc.id)}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {doc.rating > 0 ? `${doc.rating}/5` : 'Sin calificar'} ({doc.ratingCount})
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {doc.author && (
                        <button onClick={() => onNavigate(`/user/${doc.author!.id}`)} style={{
                          background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                          color: 'var(--text-muted)', fontSize: 12,
                        }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10,
                            overflow: 'hidden',
                          }}>
                            {doc.author.avatar ? <img src={doc.author.avatar} alt="" style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} /> : doc.author.firstName?.[0]}
                          </div>
                          {doc.author.firstName}
                        </button>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>📥 {doc.downloads}</span>
                    </div>
                    <button className="btn btn-primary btn-xs" onClick={() => handleDownload(doc.id)}>
                      Descargar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {total > 20 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
                <span style={{ padding: '8px 16px', fontSize: 13 }}>Página {page} de {Math.ceil(total / 20)}</span>
                <button className="btn btn-secondary btn-sm" disabled={page >= Math.ceil(total / 20)} onClick={() => setPage(p => p + 1)}>Siguiente →</button>
              </div>
            )}
          </>
        )}

        {showShare && (
          <div className="modal-overlay" onClick={() => setShowShare(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>Compartir Apuntes</h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Comparte tus apuntes y gana XP por cada descarga. ¡Ayuda a otros estudiantes!
              </p>
              <div className="auth-field">
                <label>Título *</label>
                <input value={shareTitle} onChange={e => setShareTitle(e.target.value)} placeholder="Ej: Resumen Cálculo II - Integrales" autoFocus />
              </div>
              <div className="auth-field">
                <label>Materia</label>
                <input value={shareCourse} onChange={e => setShareCourse(e.target.value)} placeholder="Ej: Cálculo II" />
              </div>
              <div className="auth-field">
                <label>Descripción</label>
                <input value={shareDesc} onChange={e => setShareDesc(e.target.value)} placeholder="Breve descripción del contenido..." />
              </div>
              <div className="auth-field">
                <label>Archivo *</label>
                <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" onChange={handleFileSelect} />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={() => setShowShare(false)}>Cancelar</button>
                <button className="btn btn-primary" onClick={handleShare} disabled={!shareTitle.trim() || !shareFile}>Compartir</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
