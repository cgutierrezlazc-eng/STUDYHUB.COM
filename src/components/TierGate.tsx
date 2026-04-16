import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useTier } from '../hooks/useTier';
import UpgradeModal from './UpgradeModal';

/** Nombres legibles de features para el modal */
const FEATURE_LABELS: Record<string, string> = {
  concept_map: 'Mapas Conceptuales',
  study_plan: 'Planes de Estudio',
  exam_predictor: 'Predictor de Examen',
  video_youtube: 'Notas de YouTube',
  video_upload: 'Notas de Video',
  audio_to_notes: 'Audio a Apuntes',
  exam_night: 'Modo Noche de Examen',
  explain_visual: 'Explicación Visual',
  search_ai: 'Búsqueda Inteligente',
  biblioteca_clone: 'Clonar Libro',
  can_export: 'Exportar Documentos',
  can_download_docs: 'Descargar Documentos',
  can_create_conference: 'Crear Conferencia',
  can_create_study_room: 'Crear Sala de Estudio',
  can_lms_sync_docs: 'Sincronizar Documentos LMS',
  can_lms_sync_calendar: 'Sincronizar Calendario LMS',
  can_detect_ai: 'Detección de Contenido',
  contribution_metrics: 'Métricas de Contribución',
  executive_showcase: 'Showcase Ejecutivo',
  attendance_log: 'Registro de Asistencia',
  cv_coach: 'Coach de CV',
};

interface TierGateProps {
  /** Feature key from tier-limits.json (ai or features section) */
  feature: string;
  /** Content to render — will be overlayed if blocked */
  children: React.ReactNode;
  /** Optional: custom label for the upgrade modal */
  label?: string;
  /** Optional: callback for navigation (to /suscripcion) */
  onNavigate?: (path: string) => void;
  /** Optional: render nothing instead of overlay when blocked */
  hidden?: boolean;
}

/**
 * Wrapper que bloquea visualmente features no disponibles en el tier actual.
 *
 * Uso: <TierGate feature="concept_map"><Button>Mapa Conceptual</Button></TierGate>
 *
 * - Si el usuario tiene acceso → renderiza children normalmente
 * - Si está bloqueado → overlay semitransparente + badge PRO + click abre UpgradeModal
 */
export default function TierGate({ feature, children, label, onNavigate, hidden }: TierGateProps) {
  const { isBlocked } = useTier();
  const [showModal, setShowModal] = useState(false);

  const blocked = isBlocked(feature);

  // Si no está bloqueado, renderizar normalmente
  if (!blocked) return <>{children}</>;

  // Si hidden=true, no renderizar nada
  if (hidden) return null;

  const featureLabel = label || FEATURE_LABELS[feature] || feature;

  return (
    <>
      <div
        style={{ position: 'relative', display: 'inline-flex', cursor: 'pointer' }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowModal(true);
        }}
        title={`${featureLabel} — disponible con Conniku PRO`}
      >
        {/* Children rendered but non-interactive */}
        <div
          style={{
            opacity: 0.45,
            pointerEvents: 'none',
            filter: 'grayscale(30%)',
            userSelect: 'none',
          }}
        >
          {children}
        </div>

        {/* PRO badge */}
        <div
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            color: '#fff',
            fontSize: 9,
            fontWeight: 700,
            padding: '2px 5px',
            borderRadius: 4,
            lineHeight: 1.2,
            letterSpacing: 0.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            zIndex: 2,
          }}
        >
          <Lock size={8} />
          PRO
        </div>
      </div>

      <UpgradeModal
        open={showModal}
        onClose={() => setShowModal(false)}
        featureLabel={featureLabel}
        onNavigate={onNavigate}
      />
    </>
  );
}
