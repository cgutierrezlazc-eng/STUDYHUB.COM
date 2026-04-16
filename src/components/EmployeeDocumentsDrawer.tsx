/**
 * EmployeeDocumentsDrawer — Módulo aislado de documentación de empleados.
 * Drawer lateral para gestión de documentos de contratación.
 *
 * INDEPENDIENTE: No depende de otros componentes del proyecto.
 * Si otro módulo falla, este sigue funcionando.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface EmployeeDoc {
  id: string;
  document_type: string;
  name: string;
  signed: boolean;
  fes_signed: boolean;
  created_at: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  employeeRut?: string;
  salary?: number;
  afpName?: string;
  afpRate?: number;
  healthPlan?: string;
  healthRate?: number;
}

// Documentos obligatorios para contratación en Chile
const REQUIRED_DOCS = [
  { type: 'ci', label: 'Cédula de Identidad', icon: '🪪', required: true },
  { type: 'afp', label: 'Certificado AFP', icon: '🏦', required: true },
  { type: 'isapre', label: 'Certificado Isapre/Fonasa', icon: '🏥', required: true },
  { type: 'antecedentes', label: 'Certificado de Antecedentes', icon: '📋', required: true },
  { type: 'academico', label: 'Certificado de Estudios / Título', icon: '🎓', required: false },
  { type: 'residencia', label: 'Certificado de Residencia', icon: '🏠', required: false },
  { type: 'foto_carnet', label: 'Foto Carnet', icon: '📷', required: false },
  {
    type: 'finiquito_anterior',
    label: 'Finiquito Empleador Anterior',
    icon: '📄',
    required: false,
  },
  { type: 'situacion_militar', label: 'Situación Militar', icon: '🎖️', required: false },
  { type: 'cargas_familiares', label: 'Cargas Familiares', icon: '👨‍👩‍👧', required: false },
  { type: 'cuenta_bancaria', label: 'Datos Cuenta Bancaria', icon: '💳', required: true },
  { type: 'examen_preocupacional', label: 'Examen Pre-ocupacional', icon: '🩺', required: false },
];

export default function EmployeeDocumentsDrawer({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  employeeRut,
  salary = 0,
  afpName = 'No especificada',
  afpRate = 11.44,
  healthPlan = 'Fonasa',
  healthRate = 7,
}: Props) {
  const [docs, setDocs] = useState<EmployeeDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [additionalDocs, setAdditionalDocs] = useState<{ name: string; type: string }[]>([]);
  const [newDocName, setNewDocName] = useState('');

  // Cargar documentos existentes
  const loadDocs = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await api.getEmployeeDocuments(employeeId);
      setDocs(Array.isArray(res) ? res : res.documents || []);
    } catch {
      setDocs([]);
    }
    setLoading(false);
  }, [employeeId]);

  useEffect(() => {
    if (isOpen && employeeId) loadDocs();
  }, [isOpen, employeeId, loadDocs]);

  // Upload de un documento
  const handleUpload = async (docType: string, file: File) => {
    setUploading(docType);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', docType);
      formData.append('name', file.name);

      const token = localStorage.getItem('conniku_token');
      const base =
        (import.meta as any).env?.VITE_API_URL || 'https://studyhub-api-bpco.onrender.com';
      const res = await fetch(`${base}/hr/employees/${employeeId}/documents`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Error ${res.status}`);
      }
      await loadDocs();
    } catch (e: any) {
      setError(e.message || 'Error al subir documento');
    }
    setUploading(null);
  };

  // Agregar documento adicional
  const addAdditionalDoc = () => {
    if (!newDocName.trim()) return;
    setAdditionalDocs((prev) => [...prev, { name: newDocName.trim(), type: 'adicional' }]);
    setNewDocName('');
  };

  // Verificar si un tipo de documento ya fue subido
  const isUploaded = (docType: string) => docs.some((d) => d.document_type === docType);
  const uploadedCount = REQUIRED_DOCS.filter((d) => isUploaded(d.type)).length;
  const totalRequired = REQUIRED_DOCS.filter((d) => d.required).length;
  const requiredComplete = REQUIRED_DOCS.filter((d) => d.required && isUploaded(d.type)).length;

  // Proyección liquidación
  const grossSalary = salary || 0;
  const gratificacion = Math.min(grossSalary * 0.25, (4.75 * 460000) / 12); // tope legal
  const totalImponible = grossSalary + gratificacion;
  const afpDiscount = Math.round(totalImponible * (afpRate / 100));
  const healthDiscount = Math.round(totalImponible * (healthRate / 100));
  const unemploymentInsurance = Math.round(totalImponible * 0.006);
  const totalDiscounts = afpDiscount + healthDiscount + unemploymentInsurance;
  const netSalary = totalImponible - totalDiscounts;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 9998,
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 'min(600px, 90vw)',
          height: '100vh',
          background: 'var(--bg-primary)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              📁 Documentación — {employeeName}
            </h3>
            {employeeRut && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>RUT: {employeeRut}</span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>
              Progreso: {uploadedCount}/{REQUIRED_DOCS.length} documentos
            </span>
            <span
              style={{
                fontSize: 11,
                color: requiredComplete === totalRequired ? '#10B981' : '#F59E0B',
                fontWeight: 600,
              }}
            >
              {requiredComplete === totalRequired
                ? '✅ Obligatorios completos'
                : `⚠️ ${totalRequired - requiredComplete} obligatorios pendientes`}
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: 'var(--bg-secondary)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(uploadedCount / REQUIRED_DOCS.length) * 100}%`,
                height: '100%',
                background: requiredComplete === totalRequired ? '#10B981' : 'var(--accent)',
                borderRadius: 3,
                transition: 'width 0.3s',
              }}
            />
          </div>
        </div>

        {/* Content - scrollable */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {error && (
            <div
              style={{
                padding: '8px 12px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 8,
                color: '#EF4444',
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              Cargando documentos...
            </div>
          ) : (
            <>
              {/* Documentos obligatorios y opcionales */}
              <h4 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, marginTop: 0 }}>
                Documentos de Contratación
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {REQUIRED_DOCS.map((doc) => {
                  const uploaded = isUploaded(doc.type);
                  const isCurrentlyUploading = uploading === doc.type;

                  return (
                    <div
                      key={doc.type}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid',
                        borderColor: uploaded ? 'rgba(16,185,129,0.3)' : 'var(--border-color)',
                        background: uploaded ? 'rgba(16,185,129,0.05)' : 'var(--bg-secondary)',
                      }}
                    >
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{doc.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          {doc.label}
                          {doc.required && (
                            <span style={{ color: '#EF4444', marginLeft: 4 }}>*</span>
                          )}
                        </div>
                        {uploaded && (
                          <span style={{ fontSize: 11, color: '#10B981' }}>✅ Subido</span>
                        )}
                      </div>
                      {uploaded ? (
                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                          }}
                        >
                          Ver
                        </span>
                      ) : (
                        <label
                          style={{
                            padding: '4px 12px',
                            borderRadius: 6,
                            background: 'var(--accent)',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: isCurrentlyUploading ? 'wait' : 'pointer',
                            opacity: isCurrentlyUploading ? 0.6 : 1,
                          }}
                        >
                          {isCurrentlyUploading ? '⏳' : '📤 Subir'}
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            style={{ display: 'none' }}
                            disabled={isCurrentlyUploading}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUpload(doc.type, f);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Documentos adicionales */}
              <h4 style={{ fontSize: 13, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>
                Documentos Adicionales
              </h4>
              {additionalDocs.map((ad, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 18 }}>📎</span>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{ad.name}</div>
                  <label
                    style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      background: 'var(--accent)',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    📤 Subir
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload('adicional', f);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addAdditionalDoc()}
                  placeholder="Nombre del documento adicional..."
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                  }}
                />
                <button
                  onClick={addAdditionalDoc}
                  disabled={!newDocName.trim()}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: 'none',
                    background: newDocName.trim() ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: newDocName.trim() ? '#fff' : 'var(--text-muted)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: newDocName.trim() ? 'pointer' : 'default',
                  }}
                >
                  + Agregar
                </button>
              </div>

              {/* Proyección liquidación */}
              {salary > 0 && (
                <>
                  <h4 style={{ fontSize: 13, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>
                    💰 Proyección de Liquidación
                  </h4>
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      fontSize: 13,
                    }}
                  >
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}
                    >
                      <span>Sueldo Base</span>
                      <span style={{ fontWeight: 600 }}>
                        ${grossSalary.toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}
                    >
                      <span>Gratificación</span>
                      <span style={{ fontWeight: 600 }}>
                        ${Math.round(gratificacion).toLocaleString('es-CL')}
                      </span>
                    </div>
                    <div
                      style={{
                        borderTop: '1px solid var(--border-color)',
                        margin: '8px 0',
                        paddingTop: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 700,
                      }}
                    >
                      <span>Total Imponible</span>
                      <span>${totalImponible.toLocaleString('es-CL')}</span>
                    </div>

                    <div style={{ marginTop: 12, color: 'var(--text-secondary)' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                        Descuentos:
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}
                      >
                        <span>
                          AFP {afpName} ({afpRate}%)
                        </span>
                        <span style={{ color: '#EF4444' }}>
                          -${afpDiscount.toLocaleString('es-CL')}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}
                      >
                        <span>
                          Salud {healthPlan} ({healthRate}%)
                        </span>
                        <span style={{ color: '#EF4444' }}>
                          -${healthDiscount.toLocaleString('es-CL')}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 4,
                        }}
                      >
                        <span>Seguro Cesantía (0.6%)</span>
                        <span style={{ color: '#EF4444' }}>
                          -${unemploymentInsurance.toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        borderTop: '2px solid var(--accent)',
                        margin: '12px 0 0',
                        paddingTop: 10,
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 800,
                        fontSize: 15,
                      }}
                    >
                      <span>Líquido a Pagar</span>
                      <span style={{ color: '#10B981' }}>${netSalary.toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
