import { useEffect, useState } from 'react';

// ═══════════════════════════════════════════════════════════════
// HELP OVERLAY — Sistema "Aprende aqui"
// Cada boton/modulo tiene un HelpTrigger que abre este overlay
// con informacion educativa sobre como funciona esa seccion
// ═══════════════════════════════════════════════════════════════

interface HelpOverlayProps {
  title: string;
  content: string[];
  onClose: () => void;
}

export function HelpOverlay({ title, content, onClose }: HelpOverlayProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="help-overlay" onClick={onClose} role="presentation">
      <div
        className="help-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
      >
        <div className="help-modal-header">
          <span className="help-modal-icon" aria-hidden="true">?</span>
          <h3 className="help-modal-title" id="help-modal-title">{title}</h3>
          <button className="help-modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="help-modal-body">
          {content.map((paragraph, i) => (
            <p key={i} className="help-paragraph">{paragraph}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Trigger — boton "Aprende aqui" ──────────────────────────

interface HelpTriggerProps {
  helpKey: string;
  label?: string;
}

export function HelpTrigger({ helpKey, label = 'Aprende aqui' }: HelpTriggerProps) {
  const [open, setOpen] = useState(false);
  const helpData = HELP_CONTENT[helpKey];

  if (!helpData) return null;

  return (
    <>
      <button className="help-trigger" onClick={() => setOpen(true)}>
        <span className="help-trigger-icon">?</span>
        <span className="help-trigger-text">{label}</span>
      </button>

      {open && (
        <HelpOverlay
          title={helpData.title}
          content={helpData.content}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// CONTENIDO DE AYUDA — Registro centralizado
// Cada key corresponde a un modulo/boton/seccion de la extension
// ═══════════════════════════════════════════════════════════════

interface HelpEntry {
  title: string;
  content: string[];
}

const HELP_CONTENT: Record<string, HelpEntry> = {
  login: {
    title: 'Iniciar sesion',
    content: [
      'Usa tu cuenta de Conniku (conniku.com) para conectar la extension. Si aun no tienes cuenta, puedes crear una gratis.',
      'Tu sesion se mantiene activa hasta que cierres sesion manualmente. Tus datos se transmiten de forma segura.',
    ],
  },
  detection: {
    title: 'Deteccion de campus',
    content: [
      'Conniku detecta automaticamente cuando navegas a una plataforma educativa como Moodle, Canvas, Blackboard, Brightspace o Sakai.',
      'Solo necesitas abrir tu campus virtual en el navegador. La extension reconocera la plataforma y te mostrara tus asignaturas disponibles.',
      'La deteccion es pasiva: no envia informacion hasta que tu lo autorices.',
    ],
  },
  courses: {
    title: 'Seleccion de asignaturas',
    content: [
      'Aqui ves las asignaturas detectadas en tu campus virtual. Las asignaturas del semestre actual aparecen primero.',
      'Selecciona las que quieres sincronizar. Conniku creara automaticamente una asignatura en tu cuenta por cada una que elijas.',
      'Los documentos, calendario y notas de cada asignatura se importaran a tu espacio en Conniku.',
      'Puedes agregar o quitar asignaturas en cualquier momento.',
    ],
  },
  sync: {
    title: 'Sincronizacion',
    content: [
      'Durante la sincronizacion, Conniku descarga los documentos de tus cursos (PDFs, presentaciones, guias) y los organiza en tus asignaturas.',
      'Tambien importa los eventos del calendario (examenes, entregas, clases) y tus calificaciones publicadas.',
      'No cierres la pestana de tu campus virtual mientras se completa el proceso.',
      'La sincronizacion respeta tu sesion: solo accede a los datos que tu mismo puedes ver en tu campus.',
    ],
  },
  update: {
    title: 'Actualizar datos',
    content: [
      'Cuando presionas "Actualizar", Conniku busca documentos nuevos que tu profesor haya subido desde la ultima vez.',
      'Solo se descargan los archivos nuevos — no se duplican los que ya tienes.',
      'El calendario y las notas tambien se actualizan con la informacion mas reciente.',
    ],
  },
  grades: {
    title: 'Notas y calificaciones',
    content: [
      'Conniku importa las notas parciales que tu universidad publica en la plataforma.',
      'Puedes ver tus notas por asignatura, con el promedio calculado automaticamente.',
      'El simulador te permite calcular que nota necesitas en tus proximas evaluaciones para alcanzar el promedio que deseas.',
      'Las notas se actualizan cada vez que sincronizas.',
    ],
  },
  privacy: {
    title: 'Privacidad y seguridad',
    content: [
      'Conniku NUNCA ve tu contrasena de la universidad. La extension solo usa la sesion activa de tu navegador (las cookies que ya existen).',
      'Tus datos se transmiten de forma cifrada (HTTPS) a los servidores de Conniku.',
      'Solo accedemos a datos academicos: cursos, documentos, calendario y notas. Nada mas.',
      'Puedes desconectar tu campus en cualquier momento y eliminar todos los datos sincronizados.',
    ],
  },
  platforms: {
    title: 'Plataformas compatibles',
    content: [
      'Conniku funciona con las plataformas educativas mas usadas en universidades de todo el mundo:',
      'Moodle — la mas comun en Latinoamerica y Europa.',
      'Canvas — popular en universidades de Estados Unidos y algunas de LATAM.',
      'Blackboard, Brightspace (D2L) y Sakai — soporte para las demas plataformas principales.',
      'Si tu universidad usa otra plataforma, escribenos a contacto@conniku.com.',
    ],
  },
  disclaimer: {
    title: 'Uso responsable',
    content: [
      'Conniku accede a tus datos academicos en tu nombre, utilizando tu sesion activa. Es equivalente a que tu navegues tu campus virtual manualmente.',
      'Al usar esta extension, confirmas que cumples con las politicas de uso aceptable de tu universidad.',
      'Conniku es una herramienta de organizacion estudiantil. No modifica, altera ni publica datos en tu plataforma universitaria — solo los lee.',
      'Si tu universidad tiene restricciones sobre el uso de herramientas externas, consulta con tu departamento de TI antes de sincronizar.',
    ],
  },
  disconnect: {
    title: 'Desconectar campus',
    content: [
      'Al desconectar tu campus virtual, Conniku dejara de sincronizar datos de esa plataforma.',
      'Tus datos academicos almacenados en Conniku se eliminaran en un plazo maximo de 30 dias.',
      'Puedes volver a conectar tu campus en cualquier momento.',
      'Para eliminar tu cuenta completa de Conniku, visita conniku.com/configuracion.',
    ],
  },
};
