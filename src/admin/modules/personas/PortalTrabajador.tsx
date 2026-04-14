/**
 * PortalTrabajador.tsx
 * Portal de documentos del trabajador con firma FES (Ley 19.799).
 * Accesible desde /admin-panel/hr/mi-portal
 * El trabajador ve sus documentos, firma el contrato con FES y sube documentos requeridos.
 */
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../../services/api';
import { useAuth } from '../../../services/auth';

// ─── Tipos ────────────────────────────────────────────────────────
interface EmployeeDoc {
  id: string;
  document_type: string;
  name: string;
  fes_signed: boolean;
  fes_signed_at: string | null;
  fes_signer_name: string | null;
  fes_signer_username: string | null;
  fes_employee_number: string | null;
  fes_verification_code: string | null;
  locked: boolean;
  signed: boolean;
  created_at: string;
}

interface Employee {
  id: string;
  full_name: string;
  position: string;
  employee_number: string | null;
  corporate_email: string | null;
  rut: string;
  department: string;
}

// ─── Etiquetas de tipos de documento ────────────────────────────
const DOC_TYPE_LABELS: Record<string, string> = {
  contrato: 'Contrato de Trabajo',
  anexo: 'Anexo de Contrato',
  liquidacion: 'Liquidación de Sueldo',
  finiquito: 'Finiquito',
  amonestacion: 'Carta de Amonestación',
  certificado: 'Certificado',
  ci: 'Cédula de Identidad',
  afp: 'Certificado AFP',
  isapre: 'Certificado Salud',
  antecedentes: 'Antecedentes',
  academico: 'Documentos Académicos',
  bancario: 'Datos Bancarios',
  riohs: 'RIOHS / Reglamento Interno',
  etica: 'Código de Ética',
  equipos: 'Acta de Equipos',
  otro: 'Otro Documento',
};

const DOC_TYPE_ICONS: Record<string, string> = {
  contrato: '📄',
  liquidacion: '💰',
  finiquito: '🏁',
  amonestacion: '⚠️',
  certificado: '🏅',
  ci: '🪪',
  afp: '🏦',
  isapre: '🏥',
  antecedentes: '🔍',
  academico: '🎓',
  bancario: '💳',
  riohs: '📋',
  etica: '⚖️',
  equipos: '💻',
  otro: '📁',
};

// ─── Bloque FES visual ────────────────────────────────────────────
const FESBlock = ({ doc }: { doc: EmployeeDoc }) => (
  <div
    style={{
      marginTop: 12,
      border: '2px solid #16a34a',
      borderRadius: 8,
      overflow: 'hidden',
      fontFamily: 'monospace',
      fontSize: 11,
    }}
  >
    <div
      style={{
        background: '#15803d',
        color: '#fff',
        padding: '5px 12px',
        fontWeight: 700,
        letterSpacing: 1,
      }}
    >
      ✅ FIRMA ELECTRÓNICA SIMPLE — Ley 19.799 — Conniku SpA
    </div>
    <div style={{ background: '#f0fdf4', padding: '8px 12px', lineHeight: 1.7 }}>
      <div>
        <strong>Firmante:</strong> {doc.fes_signer_name}
      </div>
      <div>
        <strong>Usuario:</strong> {doc.fes_signer_username}
      </div>
      <div>
        <strong>N° Empleado:</strong> {doc.fes_employee_number}
      </div>
      <div>
        <strong>Fecha/hora:</strong>{' '}
        {doc.fes_signed_at
          ? new Date(doc.fes_signed_at).toLocaleString('es-CL', { timeZone: 'America/Santiago' }) +
            ' CLT'
          : '—'}
      </div>
      <div>
        <strong>Hash SHA-256:</strong>{' '}
        <span style={{ fontSize: 10, color: '#555' }}>Registro interno</span>
      </div>
      {doc.fes_verification_code && (
        <div style={{ marginTop: 4 }}>
          <strong>Verificar en:</strong>{' '}
          <a
            href={`https://conniku.com/verify/${doc.fes_verification_code}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#15803d' }}
          >
            conniku.com/verify/{doc.fes_verification_code}
          </a>
        </div>
      )}
    </div>
  </div>
);

// ─── Componente principal ─────────────────────────────────────────
export default function PortalTrabajador() {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [documents, setDocuments] = useState<EmployeeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadType, setPendingUploadType] = useState<string>('otro');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Cargar empleado y documentos
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Buscar el empleado vinculado a este usuario
        const emps = await api.getEmployees();
        const emp = (emps?.employees || []).find((e: any) => e.user_id === user?.id);
        if (!emp) {
          setError('No tienes un perfil de colaborador asociado a tu cuenta.');
          setLoading(false);
          return;
        }
        setEmployee(emp);
        const docsRes = await api.getEmployeeDocuments(emp.id);
        setDocuments(docsRes?.documents || []);
      } catch {
        setError('Error al cargar tus documentos.');
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) load();
  }, [user?.id]);

  // Firmar con FES
  const handleFesSign = async (doc: EmployeeDoc) => {
    if (
      !window.confirm(
        `¿Confirmas que deseas firmar el documento "${doc.name}" con tu Firma Electrónica Simple?\n\n` +
          `Al confirmar:\n• El documento quedará firmado con tu identidad y hora actual\n` +
          `• No podrá ser modificado ni vuelto a firmar\n• Tendrá pleno valor legal (Ley 19.799)`
      )
    )
      return;

    setSigning(doc.id);
    try {
      const res = await api.fesSignDocument(doc.id);
      if (res?.document) {
        setDocuments((prev) => prev.map((d) => (d.id === doc.id ? { ...d, ...res.document } : d)));
        showToast('✅ Documento firmado exitosamente con FES. Queda bloqueado para tu protección.');
      }
    } catch (e: any) {
      showToast('❌ Error al firmar: ' + (e?.detail || e?.message || 'Intenta nuevamente'));
    } finally {
      setSigning(null);
    }
  };

  // Subir documento
  const handleUpload = async (file: File) => {
    if (!employee || !pendingUploadType) return;
    setUploadingFor(pendingUploadType);
    try {
      const res = await api.uploadEmployeeFile(employee.id, file, pendingUploadType, file.name);
      if (res?.document) {
        setDocuments((prev) => [res.document, ...prev]);
        showToast('📎 Documento subido correctamente.');
      }
    } catch {
      showToast('❌ Error al subir el documento.');
    } finally {
      setUploadingFor(null);
      setPendingUploadType('otro');
    }
  };

  if (loading)
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
          <div>Cargando tu portal de documentos…</div>
        </div>
      </div>
    );

  if (error)
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#dc2626' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
        <div>{error}</div>
      </div>
    );

  if (!employee) return null;

  const pendingFes = documents.filter(
    (d) => !d.fes_signed && !d.locked && d.document_type === 'contrato'
  );
  const allDocs = documents.filter(
    (d) => d.document_type !== 'contrato' || d.fes_signed || d.locked
  );
  const contractDocs = documents.filter((d) => d.document_type === 'contrato');

  return (
    <div style={{ maxWidth: 840, margin: '0 auto', padding: '24px 20px' }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            background: '#0f172a',
            color: '#fff',
            borderRadius: 10,
            padding: '12px 20px',
            fontSize: 13,
            fontWeight: 500,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          {toast}
        </div>
      )}

      {/* Cabecera — perfil del trabajador */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0d2a6b 0%, #1a56db 100%)',
          borderRadius: 16,
          padding: '24px 28px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          color: '#fff',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 28,
            flexShrink: 0,
          }}
        >
          👤
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>{employee.full_name}</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            {employee.position} · {employee.department}
          </div>
          {employee.employee_number && (
            <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>
              N° Empleado: <strong>{employee.employee_number}</strong>
              {employee.corporate_email && ` · ${employee.corporate_email}`}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, opacity: 0.6 }}>
          <div>RUT: {employee.rut}</div>
          <div style={{ marginTop: 2 }}>Conniku SpA</div>
        </div>
      </div>

      {/* ─── FIRMA PENDIENTE ───────────────────────────────────────── */}
      {pendingFes.length > 0 && (
        <div
          style={{
            background: '#fffbeb',
            border: '2px solid #f59e0b',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 24,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: '#92400e' }}>
            ✍️ Tienes documentos pendientes de firma
          </div>
          <p style={{ fontSize: 13, color: '#78350f', marginBottom: 14 }}>
            Lee el documento completo y firma con tu Firma Electrónica Simple (FES) para que el
            contrato tenga pleno valor legal. Una vez firmado, el documento quedará bloqueado y no
            podrá ser modificado.
          </p>
          {pendingFes.map((doc) => (
            <div
              key={doc.id}
              style={{
                background: '#fff',
                borderRadius: 8,
                padding: '12px 16px',
                border: '1px solid #fcd34d',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>📄 {doc.name}</div>
                <div style={{ fontSize: 11, color: '#78350f', marginTop: 2 }}>
                  Creado: {new Date(doc.created_at).toLocaleDateString('es-CL')}
                </div>
              </div>
              <button
                onClick={() => handleFesSign(doc)}
                disabled={signing === doc.id}
                style={{
                  padding: '8px 18px',
                  background: signing === doc.id ? '#94a3b8' : '#15803d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  cursor: signing === doc.id ? 'default' : 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {signing === doc.id ? 'Firmando…' : '✍️ Firmar con FES'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ─── CONTRATOS ─────────────────────────────────────────────── */}
      <Section title="📄 Contrato de Trabajo">
        {contractDocs.length === 0 && <EmptyState msg="No hay contratos en tu carpeta aún." />}
        {contractDocs.map((doc) => (
          <DocCard
            key={doc.id}
            doc={doc}
            onSign={() => handleFesSign(doc)}
            signing={signing === doc.id}
          />
        ))}
      </Section>

      {/* ─── TODOS MIS DOCUMENTOS ───────────────────────────────────── */}
      <Section
        title="📁 Mis Documentos"
        action={
          <label
            style={{
              padding: '6px 14px',
              background: 'var(--accent)',
              color: '#fff',
              borderRadius: 7,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            + Subir documento
            <input
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
                e.target.value = '';
              }}
            />
          </label>
        }
      >
        {allDocs.length === 0 && !pendingFes.length && (
          <EmptyState msg="No hay documentos en tu carpeta." />
        )}
        {allDocs.map((doc) => (
          <DocCard
            key={doc.id}
            doc={doc}
            onSign={() => handleFesSign(doc)}
            signing={signing === doc.id}
          />
        ))}
      </Section>

      {/* ─── INFO LEGAL ─────────────────────────────────────────────── */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '14px 18px',
          fontSize: 12,
          color: 'var(--text-muted)',
          marginTop: 8,
        }}
      >
        <strong style={{ color: 'var(--text-secondary)' }}>ℹ️ Información legal</strong>
        <p style={{ marginTop: 6, lineHeight: 1.6 }}>
          Los documentos firmados con <strong>Firma Electrónica Simple (FES)</strong> tienen pleno
          valor legal en Chile conforme a la <strong>Ley 19.799</strong>. Una vez firmado, cada
          documento queda bloqueado con hash SHA-256, identificación del firmante, timestamp y
          código de verificación. Todos los documentos son conservados por mínimo 5 años desde el
          término del contrato.
        </p>
      </div>

      {/* Input oculto para subir documentos por tipo */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleUpload(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────
function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div
      style={{
        padding: '20px',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: 13,
        background: 'var(--bg-secondary)',
        borderRadius: 8,
      }}
    >
      {msg}
    </div>
  );
}

function DocCard({
  doc,
  onSign,
  signing,
}: {
  doc: EmployeeDoc;
  onSign: () => void;
  signing: boolean;
}) {
  const [open, setOpen] = useState(false);
  const icon = DOC_TYPE_ICONS[doc.document_type] || '📄';
  const label = DOC_TYPE_LABELS[doc.document_type] || doc.document_type;

  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        border: `1px solid ${doc.locked ? '#86efac' : doc.fes_signed ? '#86efac' : 'var(--border)'}`,
        borderRadius: 10,
        marginBottom: 8,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          cursor: 'pointer',
          gap: 12,
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <span style={{ fontSize: 22 }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 13,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {doc.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {label} · {new Date(doc.created_at).toLocaleDateString('es-CL')}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {doc.locked && (
            <span
              style={{
                fontSize: 11,
                background: '#dcfce7',
                color: '#15803d',
                borderRadius: 20,
                padding: '2px 10px',
                fontWeight: 700,
              }}
            >
              ✅ Firmado FES
            </span>
          )}
          {!doc.locked && !doc.fes_signed && doc.document_type === 'contrato' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSign();
              }}
              disabled={signing}
              style={{
                fontSize: 11,
                padding: '4px 12px',
                background: '#15803d',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: signing ? 'default' : 'pointer',
                fontWeight: 600,
              }}
            >
              {signing ? '…' : '✍️ Firmar'}
            </button>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
          {doc.fes_signed && <FESBlock doc={doc} />}
          {!doc.fes_signed && !doc.locked && (
            <div style={{ padding: '10px 0', fontSize: 12, color: 'var(--text-muted)' }}>
              {doc.document_type === 'contrato'
                ? 'Este documento está pendiente de tu firma FES.'
                : 'Documento sin firma electrónica.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
