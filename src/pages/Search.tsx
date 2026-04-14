import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/auth';
import { api } from '../services/api';
import { useI18n } from '../services/i18n';
import {
  FolderOpen,
  Search as SearchIcon,
  FileText,
  Trash2,
  Brain,
  Link,
  Download,
  Save,
  Hourglass,
  GraduationCap,
} from '../components/Icons';

interface Props {
  onNavigate: (path: string) => void;
  initialQuery?: string;
}

export default function Search({ onNavigate, initialQuery }: Props) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [query, setQuery] = useState(initialQuery || '');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [downloads, setDownloads] = useState<any[]>([]);
  const [showDownloads, setShowDownloads] = useState(false);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [downloading, setDownloading] = useState<string>('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (initialQuery) handleSearch();
  }, [initialQuery]);

  const handleSearch = async (p: number = 1) => {
    if (!query.trim()) return;
    setLoading(true);
    setAiSummary('');
    setPage(p);
    try {
      const data = await api.searchWeb(query, p);
      setResults(data.results || []);
      if (data.message) setAiSummary(data.message);
    } catch (err: any) {
      alert(err.message || t('search.errorSearch'));
    }
    setLoading(false);
  };

  const handleAiSummary = async () => {
    if (!results.length) return;
    setLoadingSummary(true);
    try {
      const data = await api.getAiSearchSummary(query, results);
      setAiSummary(data.summary || '');
    } catch (err: any) {
      setAiSummary(t('search.errorSummary'));
    }
    setLoadingSummary(false);
  };

  const handleDownloadToConniku = async (url: string, title: string) => {
    setDownloading(url);
    try {
      const result = await api.downloadToConniku(url, title);
      alert(
        `${t('search.savedToConniku')}: ${result.filename} (${result.sizeFormatted}). ${t('search.storage')}: ${result.storagePercent}%`
      );
      setStorageInfo({
        used: result.storageUsed,
        limit: result.storageLimit,
        percent: result.storagePercent,
      });
    } catch (err: any) {
      alert(err.message || t('search.errorDownload'));
    }
    setDownloading('');
  };

  const loadDownloads = async () => {
    try {
      const data = await api.getMyDownloads();
      setDownloads(data.downloads || []);
      setStorageInfo({
        used: data.storageUsed,
        limit: data.storageLimit,
        percent: data.storagePercent,
      });
    } catch (err: any) {
      console.error('Failed to load downloads:', err);
    }
  };

  const handleDeleteDownload = async (id: string) => {
    try {
      const result = await api.deleteDownload(id);
      setDownloads((prev) => prev.filter((d) => d.id !== id));
      setStorageInfo((prev: any) => (prev ? { ...prev, used: result.storageUsed } : prev));
    } catch (err: any) {
      console.error('Failed to delete download:', err);
    }
  };

  const fmtSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <>
      <div className="page-header page-enter">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {SearchIcon({ size: 20 })} {t('search.title')}
            </h2>
            <p>{t('search.subtitle')}</p>
          </div>
          <button
            className={`btn btn-sm ${showDownloads ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setShowDownloads(!showDownloads);
              if (!showDownloads) loadDownloads();
            }}
          >
            {FolderOpen({ size: 16 })} {t('search.myDownloads')}{' '}
            {storageInfo ? `(${storageInfo.percent}%)` : ''}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('search.placeholder')}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 12,
              border: '2px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: 15,
            }}
            autoFocus
          />
          <button
            className="btn btn-primary"
            onClick={() => handleSearch()}
            disabled={loading}
            style={{ padding: '12px 24px' }}
          >
            {loading ? Hourglass() : SearchIcon()} {t('search.searchBtn')}
          </button>
        </div>
      </div>

      <div className="page-body">
        {/* Downloads Panel */}
        {showDownloads && (
          <div className="u-card" style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <h3
                style={{ margin: 0, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                {FolderOpen({ size: 16 })} {t('search.myDownloads')}
              </h3>
              {storageInfo && (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {fmtSize(storageInfo.used)} / {fmtSize(storageInfo.limit)} ({storageInfo.percent}
                  %)
                </span>
              )}
            </div>
            {storageInfo && (
              <div
                style={{
                  height: 6,
                  background: 'var(--bg-hover)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(storageInfo.percent, 100)}%`,
                    background:
                      storageInfo.percent > 90
                        ? 'var(--accent-red)'
                        : storageInfo.percent > 70
                          ? 'var(--accent-orange)'
                          : 'var(--accent)',
                    borderRadius: 3,
                    transition: 'width 0.3s',
                  }}
                />
              </div>
            )}
            {downloads.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
                {t('search.noSavedFiles')}
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {downloads.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 12px',
                      background: 'var(--bg-secondary)',
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{FileText()}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {d.filename}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {d.sizeFormatted} · {d.createdAt?.split('T')[0]}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDownload(d.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--accent-red)',
                        fontSize: 14,
                      }}
                      title={t('search.deleteTooltip')}
                    >
                      {Trash2({ size: 14 })}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Smart Summary */}
        {aiSummary && (
          <div
            className="u-card"
            style={{ marginBottom: 16, borderLeft: '4px solid var(--accent)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>{Brain()}</span>
              <strong style={{ fontSize: 14 }}>{t('search.aiSummary')}</strong>
            </div>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.7,
                color: 'var(--text-secondary)',
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}
            >
              {aiSummary}
            </p>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        ) : results.length > 0 ? (
          <>
            {!aiSummary && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {results.length} {t('search.resultsFor')} "{query}"
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleAiSummary}
                  disabled={loadingSummary}
                >
                  {loadingSummary ? (
                    <>
                      {Hourglass()} {t('search.analyzing')}
                    </>
                  ) : (
                    <>
                      {Brain()} {t('search.summarizeAi')}
                    </>
                  )}
                </button>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {results.map((r, i) => (
                <div key={i} className="u-card hover-lift">
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: 'var(--accent)',
                      textDecoration: 'none',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    {r.title}
                  </a>
                  <div style={{ fontSize: 12, color: 'var(--accent-green)', marginBottom: 6 }}>
                    {r.displayUrl}
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      color: 'var(--text-secondary)',
                      margin: '0 0 8px',
                      lineHeight: 1.6,
                    }}
                  >
                    {r.snippet}
                  </p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-xs"
                    >
                      {Link()} {t('search.open')}
                    </a>
                    {r.fileFormat && (
                      <button
                        className="btn btn-secondary btn-xs"
                        onClick={() => {
                          if (confirm(t('search.saveWherePrompt'))) {
                            handleDownloadToConniku(r.url, r.title);
                          } else {
                            window.open(r.url, '_blank');
                          }
                        }}
                      >
                        {Download()} {t('search.download')} {r.fileFormat}
                      </button>
                    )}
                    <button
                      className="btn btn-secondary btn-xs"
                      onClick={() => handleDownloadToConniku(r.url, `${r.title || 'pagina'}.html`)}
                      disabled={downloading === r.url}
                    >
                      {downloading === r.url ? Hourglass() : Save()} {t('search.saveToConniku')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {results.length >= 10 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                {page > 1 && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleSearch(page - 1)}
                  >
                    {t('search.previous')}
                  </button>
                )}
                <span style={{ padding: '8px 16px', fontSize: 13 }}>
                  {t('search.page')} {page}
                </span>
                <button className="btn btn-secondary btn-sm" onClick={() => handleSearch(page + 1)}>
                  {t('search.next')}
                </button>
              </div>
            )}
          </>
        ) : (
          !loading &&
          query && (
            <div className="empty-state" style={{ padding: 40 }}>
              <div className="empty-state-icon">{SearchIcon({ size: 48 })}</div>
              <h3>{t('search.noResults')}</h3>
              <p>{t('search.tryOtherKeywords')}</p>
            </div>
          )
        )}

        {/* Empty state */}
        {!loading && !query && results.length === 0 && (
          <div className="empty-state" style={{ padding: 40 }}>
            <div className="empty-state-icon">{GraduationCap({ size: 48 })}</div>
            <h3>{t('search.emptyTitle')}</h3>
            <p>{t('search.emptyDesc')}</p>
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 16,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {[
                'Integrales dobles',
                'Machine Learning tutorial',
                'Historia de Chile PDF',
                'Anatomia cardiovascular',
              ].map((s) => (
                <button
                  key={s}
                  className="btn btn-secondary btn-xs empty-state-cta"
                  onClick={() => {
                    setQuery(s);
                    setTimeout(() => handleSearch(), 100);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
