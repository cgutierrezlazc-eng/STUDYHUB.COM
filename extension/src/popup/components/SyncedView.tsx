import type { PlatformDetection, SyncStats } from '@shared/types';
import { safeHostname, timeAgo } from '@shared/utils';
import { HelpTrigger } from './HelpOverlay';

interface Props {
  platform?: PlatformDetection;
  stats?: SyncStats;
  lastSync?: number;
  onUpdate: () => void;
  onOpenConniku: () => void;
  onLogout: () => void;
}

export function SyncedView({ platform, stats, lastSync, onUpdate, onOpenConniku, onLogout }: Props) {
  return (
    <div className="popup-body">
      {platform && (
        <div className="platform-banner">
          <div className="platform-icon">🎓</div>
          <div className="platform-info">
            <div className="platform-name">
              {platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)} — {platform.siteName}
            </div>
            <div className="platform-url">{safeHostname(platform.baseUrl)}</div>
          </div>
        </div>
      )}

      <div className="synced-summary">
        <div className="summary-card">
          <div className="summary-number">{stats?.courses ?? 0}</div>
          <div className="summary-label">Asignaturas</div>
        </div>
        <div className="summary-card">
          <div className="summary-number">{stats?.files ?? 0}</div>
          <div className="summary-label">Documentos</div>
        </div>
        <div className="summary-card">
          <div className="summary-number">{stats?.events ?? 0}</div>
          <div className="summary-label">Eventos</div>
        </div>
        <div className="summary-card">
          <div className="summary-number">{stats?.grades ?? 0}</div>
          <div className="summary-label">Notas</div>
        </div>
      </div>

      <div className="last-sync">Ultima sincronizacion: {timeAgo(lastSync)}</div>

      {stats?.newFiles != null && stats.newFiles > 0 && (
        <div className="new-items-badge">
          {stats.newFiles} documento{stats.newFiles !== 1 ? 's' : ''} nuevo{stats.newFiles !== 1 ? 's' : ''} detectado{stats.newFiles !== 1 ? 's' : ''}
        </div>
      )}

      <button className="btn-primary" onClick={onUpdate}>
        Actualizar ahora
      </button>
      <button className="btn-secondary" onClick={onOpenConniku}>
        Abrir Mi Universidad
      </button>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 12 }}>
        <HelpTrigger helpKey="update" />
        <HelpTrigger helpKey="grades" label="Sobre notas" />
        <HelpTrigger helpKey="privacy" label="Privacidad" />
      </div>

      <button className="btn-link-danger" onClick={onLogout} style={{ marginTop: 12 }}>
        Desconectar y cerrar sesion
      </button>
    </div>
  );
}
