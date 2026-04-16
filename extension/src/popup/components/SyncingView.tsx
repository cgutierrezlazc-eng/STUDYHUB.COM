import type { PlatformDetection, SyncProgress } from '@shared/types';
import { safeHostname } from '@shared/utils';
import { HelpTrigger } from './HelpOverlay';

interface Props {
  platform?: PlatformDetection;
  progress?: SyncProgress;
}

const STEP_LABELS: Record<string, string> = {
  courses: 'Detectando asignaturas',
  files: 'Descargando documentos',
  calendar: 'Sincronizando calendario',
  grades: 'Importando calificaciones',
};

const STEPS = ['courses', 'files', 'calendar', 'grades'] as const;

export function SyncingView({ platform, progress }: Props) {
  const currentStepIdx = progress ? Math.max(0, STEPS.indexOf(progress.step)) : 0;

  const percentage =
    progress && progress.total > 0
      ? Math.round(((currentStepIdx * 100 + (progress.current / progress.total) * 100) / STEPS.length))
      : 0;

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

      <h3 className="section-header">Sincronizando...</h3>
      <p className="section-sub">No cierres esta pestana mientras se completa</p>

      <div className="sync-progress">
        {STEPS.map((step, idx) => {
          let state: 'done' | 'active' | 'pending' = 'pending';
          if (idx < currentStepIdx) state = 'done';
          else if (idx === currentStepIdx) state = 'active';

          return (
            <div key={step} className={`sync-step ${state}`}>
              <span className="sync-step-icon">
                {state === 'done' ? '✓' : state === 'active' ? '⟳' : '○'}
              </span>
              <span className="sync-step-text">
                {STEP_LABELS[step]}
                {state === 'active' && progress && progress.total > 0 && (
                  <> ({progress.current}/{progress.total})</>
                )}
              </span>
            </div>
          );
        })}
      </div>

      <div className="sync-bar">
        <div className="sync-bar-fill" style={{ width: `${percentage}%` }} />
      </div>
      <div className="sync-percentage" aria-live="polite">{percentage}% completado</div>

      {progress?.currentItem && (
        <div className="sync-current-item">{progress.currentItem}</div>
      )}

      <div style={{ textAlign: 'center', marginTop: 12 }}>
        <HelpTrigger helpKey="sync" />
      </div>
    </div>
  );
}
