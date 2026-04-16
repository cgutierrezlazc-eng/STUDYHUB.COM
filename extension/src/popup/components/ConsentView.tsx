import { useState } from 'react';
import type { PlatformDetection } from '@shared/types';

// ═══════════════════════════════════════════════════════════════
// CONSENT VIEW — Flujo de consentimiento explicito (GDPR + Ley 19.628)
// Se muestra ANTES de la primera sincronizacion.
// Bloquea toda extraccion hasta que el usuario acepte.
// Registra timestamp y version del consentimiento.
// ═══════════════════════════════════════════════════════════════

interface Props {
  platform?: PlatformDetection;
  onAccept: () => void;
  onDecline: () => void;
  isUpdate?: boolean;
}

const CONSENT_VERSION = '1.0';

const DATA_CATEGORIES = [
  { label: 'Asignaturas inscritas', desc: 'Nombres y fechas de tus cursos' },
  { label: 'Documentos de curso', desc: 'PDFs, presentaciones y guias que tus profesores publican' },
  { label: 'Calendario academico', desc: 'Fechas de examenes, entregas y clases' },
  { label: 'Calificaciones', desc: 'Notas parciales y finales publicadas por la universidad' },
];

export function ConsentView({ platform, onAccept, onDecline, isUpdate }: Props) {
  const [checked, setChecked] = useState(false);

  const handleAccept = async () => {
    if (!checked) return;

    // Registrar consentimiento con timestamp y version
    await chrome.storage.local.set({
      connikuConsent: {
        accepted: true,
        version: CONSENT_VERSION,
        timestamp: Date.now(),
        platform: platform?.platform || 'unknown',
        baseUrl: platform?.baseUrl || '',
      },
    });

    onAccept();
  };

  return (
    <div className="popup-body consent-body">
      {platform && (
        <div className="platform-banner">
          <div className="platform-icon">🎓</div>
          <div className="platform-info">
            <div className="platform-name">
              {platform.platform.charAt(0).toUpperCase() + platform.platform.slice(1)} — {platform.siteName}
            </div>
            <div className="platform-url">
              {(() => { try { return new URL(platform.baseUrl).hostname; } catch { return platform.baseUrl; } })()}
            </div>
          </div>
        </div>
      )}

      <h3 className="consent-title">
        {isUpdate ? 'Politica actualizada' : 'Autorizacion de datos'}
      </h3>
      <p className="consent-intro">
        {isUpdate
          ? 'Hemos actualizado nuestra politica de privacidad. Revisa los cambios y confirma para continuar sincronizando.'
          : 'Para sincronizar tu campus virtual, Conniku necesita acceder a los siguientes datos de tu cuenta universitaria:'}
      </p>

      <div className="consent-categories">
        {DATA_CATEGORIES.map((cat) => (
          <div key={cat.label} className="consent-category">
            <div className="consent-cat-label">{cat.label}</div>
            <div className="consent-cat-desc">{cat.desc}</div>
          </div>
        ))}
      </div>

      <div className="consent-guarantees">
        <p className="consent-guarantee">Conniku NUNCA accede a tu contrasena universitaria</p>
        <p className="consent-guarantee">Tus datos se transmiten cifrados (HTTPS)</p>
        <p className="consent-guarantee">Puedes eliminar tus datos en cualquier momento</p>
      </div>

      <div className="consent-legal">
        <p>
          Responsable: Conniku SpA (RUT 78.395.702-7), Chile.{' '}
          <a href="https://conniku.com/privacidad" target="_blank" rel="noopener noreferrer">
            Politica de privacidad
          </a>{' '}
          |{' '}
          <a href="https://conniku.com/terminos" target="_blank" rel="noopener noreferrer">
            Terminos de servicio
          </a>
        </p>
      </div>

      <label className="consent-checkbox-label">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="consent-checkbox"
        />
        <span>
          Autorizo a Conniku a acceder y almacenar mis datos academicos para sincronizarlos
          con mi cuenta, de acuerdo con la politica de privacidad.
        </span>
      </label>

      <button
        className="btn-primary"
        onClick={handleAccept}
        disabled={!checked}
      >
        Aceptar y sincronizar
      </button>

      <button className="btn-secondary" onClick={onDecline}>
        No, gracias
      </button>
    </div>
  );
}

/** Verifica si el usuario ya dio consentimiento valido */
export async function hasValidConsent(): Promise<boolean> {
  const result = await chrome.storage.local.get('connikuConsent');
  const consent = result.connikuConsent;
  return consent?.accepted === true && consent?.version === CONSENT_VERSION;
}

/** Verifica si hay consentimiento viejo que necesita re-aprobacion */
export async function needsConsentUpdate(): Promise<boolean> {
  const result = await chrome.storage.local.get('connikuConsent');
  const consent = result.connikuConsent;
  return consent?.accepted === true && consent?.version !== CONSENT_VERSION;
}

export { CONSENT_VERSION };
