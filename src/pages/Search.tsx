import React, { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { api } from '../services/api'

interface Props {
  onNavigate: (path: string) => void
  initialQuery?: string
}

export default function Search({ onNavigate, initialQuery }: Props) {
  const { user } = useAuth()
  const [query, setQuery] = useState(initialQuery || '')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [aiSummary, setAiSummary] = useState('')
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [downloads, setDownloads] = useState<any[]>([])
  const [showDownloads, setShowDownloads] = useState(false)
  const [storageInfo, setStorageInfo] = useState<any>(null)
  const [downloading, setDownloading] = useState<string>('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (initialQuery) handleSearch()
  }, [initialQuery])

  const handleSearch = async (p: number = 1) => {
    if (!query.trim()) return
    setLoading(true)
    setAiSummary('')
    setPage(p)
    try {
      const data = await api.searchWeb(query, p)
      setResults(data.results || [])
      if (data.message) setAiSummary(data.message)
    } catch (err: any) {
      alert(err.message || 'Error en la búsqueda')
    }
    setLoading(false)
  }

  const handleAiSummary = async () => {
    if (!results.length) return
    setLoadingSummary(true)
    try {
      const data = await api.getAiSearchSummary(query, results)
      setAiSummary(data.summary || '')
    } catch (err: any) {
      setAiSummary('No se pudo generar el resumen. Requiere Plan Pro o superior.')
    }
    setLoadingSummary(false)
  }

  const handleDownloadToConniku = async (url: string, title: string) => {
    setDownloading(url)
    try {
      const result = await api.downloadToConniku(url, title)
      alert(`Guardado en Conniku: ${result.filename} (${result.sizeFormatted}). Almacenamiento: ${result.storagePercent}%`)
      setStorageInfo({ used: result.storageUsed, limit: result.storageLimit, percent: result.storagePercent })
    } catch (err: any) {
      alert(err.message || 'Error al descargar')
    }
    setDownloading('')
  }

  const loadDownloads = async () => {
    try {
      const data = await api.getMyDownloads()
      setDownloads(data.downloads || [])
      setStorageInfo({ used: data.storageUsed, limit: data.storageLimit, percent: data.storagePercent })
    } catch {}
  }

  const handleDeleteDownload = async (id: string) => {
    try {
      const result = await api.deleteDownload(id)
      setDownloads(prev => prev.filter(d => d.id !== id))
      setStorageInfo((prev: any) => prev ? { ...prev, used: result.storageUsed } : prev)
    } catch {}
  }

  const fmtSize = (bytes: number) => bytes < 1024*1024 ? `${(bytes/1024).toFixed(1)} KB` : `${(bytes/(1024*1024)).toFixed(1)} MB`

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>🔍 Búsqueda Académica</h2>
            <p>Encuentra recursos de estudio en toda la web — contenido seguro y académico</p>
          </div>
          <button className={`btn btn-sm ${showDownloads ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setShowDownloads(!showDownloads); if (!showDownloads) loadDownloads() }}>
            📁 Mis Descargas {storageInfo ? `(${storageInfo.percent}%)` : ''}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar artículos, PDFs, tutoriales, investigaciones..."
            style={{
              flex: 1, padding: '12px 16px', borderRadius: 12,
              border: '2px solid var(--border)', background: 'var(--bg-card)',
              color: 'var(--text-primary)', fontSize: 15,
            }}
            autoFocus
          />
          <button className="btn btn-primary" onClick={() => handleSearch()} disabled={loading} style={{ padding: '12px 24px' }}>
            {loading ? '⏳' : '🔍'} Buscar
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Downloads Panel */}
        {showDownloads && (
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 15 }}>📁 Mis Descargas</h3>
              {storageInfo && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {fmtSize(storageInfo.used)} / {fmtSize(storageInfo.limit)} ({storageInfo.percent}%)
                </span>
              )}
            </div>
            {storageInfo && (
              <div style={{ height: 6, background: 'var(--bg-hover)', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ height: '100%', width: `${Math.min(storageInfo.percent, 100)}%`, background: storageInfo.percent > 90 ? 'var(--accent-red)' : storageInfo.percent > 70 ? 'var(--accent-orange)' : 'var(--accent)', borderRadius: 3, transition: 'width 0.3s' }} />
              </div>
            )}
            {downloads.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>No tienes archivos guardados</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {downloads.map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                    <span style={{ fontSize: 18 }}>📄</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.filename}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.sizeFormatted} · {d.createdAt?.split('T')[0]}</div>
                    </div>
                    <button onClick={() => handleDeleteDownload(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)', fontSize: 14 }} title="Eliminar">🗑</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* AI Summary */}
        {aiSummary && (
          <div className="card" style={{ padding: 20, marginBottom: 16, borderLeft: '4px solid var(--accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>🤖</span>
              <strong style={{ fontSize: 14 }}>Resumen IA</strong>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0, whiteSpace: 'pre-wrap' }}>{aiSummary}</p>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="loading-dots"><span /><span /><span /></div>
        ) : results.length > 0 ? (
          <>
            {!aiSummary && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{results.length} resultados para "{query}"</span>
                <button className="btn btn-secondary btn-sm" onClick={handleAiSummary} disabled={loadingSummary}>
                  {loadingSummary ? '⏳ Analizando...' : '🤖 Resumir con IA'}
                </button>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {results.map((r, i) => (
                <div key={i} className="card" style={{ padding: 16 }}>
                  <a href={r.url} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 16, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', display: 'block', marginBottom: 4 }}>
                    {r.title}
                  </a>
                  <div style={{ fontSize: 12, color: 'var(--accent-green)', marginBottom: 6 }}>{r.displayUrl}</div>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 8px', lineHeight: 1.6 }}>{r.snippet}</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-xs">
                      🔗 Abrir
                    </a>
                    {r.fileFormat && (
                      <button className="btn btn-secondary btn-xs" onClick={() => {
                        if (confirm('¿Dónde quieres guardar?\n\n• OK = Guardar en Conniku (usa tu almacenamiento)\n• Cancelar = Descargar a tu computador')) {
                          handleDownloadToConniku(r.url, r.title)
                        } else {
                          window.open(r.url, '_blank')
                        }
                      }}>
                        📥 Descargar {r.fileFormat}
                      </button>
                    )}
                    <button className="btn btn-secondary btn-xs"
                      onClick={() => handleDownloadToConniku(r.url, `${r.title || 'pagina'}.html`)}
                      disabled={downloading === r.url}>
                      {downloading === r.url ? '⏳' : '💾'} Guardar en Conniku
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {results.length >= 10 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                {page > 1 && <button className="btn btn-secondary btn-sm" onClick={() => handleSearch(page - 1)}>← Anterior</button>}
                <span style={{ padding: '8px 16px', fontSize: 13 }}>Página {page}</span>
                <button className="btn btn-secondary btn-sm" onClick={() => handleSearch(page + 1)}>Siguiente →</button>
              </div>
            )}
          </>
        ) : !loading && query && (
          <div className="empty-state" style={{ padding: 40 }}>
            <div style={{ fontSize: 48 }}>🔍</div>
            <h3>No se encontraron resultados</h3>
            <p>Intenta con otras palabras clave o verifica tu búsqueda</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !query && results.length === 0 && (
          <div className="empty-state" style={{ padding: 40 }}>
            <div style={{ fontSize: 48 }}>🎓</div>
            <h3>Buscador Académico de Conniku</h3>
            <p>Busca artículos, PDFs, tutoriales, investigaciones y recursos de estudio</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['Integrales dobles', 'Machine Learning tutorial', 'Historia de Chile PDF', 'Anatomía cardiovascular'].map(s => (
                <button key={s} className="btn btn-secondary btn-xs" onClick={() => { setQuery(s); setTimeout(() => handleSearch(), 100) }}>{s}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
