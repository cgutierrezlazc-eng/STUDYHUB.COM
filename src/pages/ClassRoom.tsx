import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { api } from '../services/api';

const PostClassExam = lazy(() => import('../components/PostClassExam'));

// ─── T&C Text for Objection ────────────────────────────────────────────────
const OBJECTION_TERMS = `TÉRMINOS Y CONDICIONES DE OBJECIÓN DE CLASE/TUTORÍA — CONNIKU SpA

Al enviar una objeción formal, el estudiante declara conocer y aceptar los siguientes términos:

1. NATURALEZA DEL PROCESO. Una objeción es una solicitud formal de revisión ante Conniku SpA (RUT 78.395.702-7). No constituye una demanda legal ni garantiza automáticamente un reembolso. Conniku actuará como árbitro imparcial entre estudiante y tutor.

2. VERACIDAD DE LA DECLARACIÓN. El estudiante declara que toda la información proporcionada en el formulario de objeción es verídica y precisa. La presentación de información falsa, engañosa o malintencionada podrá resultar en la suspensión permanente de la cuenta y restricción de acceso a la plataforma.

3. ALCANCE. Esta objeción puede referirse a: (a) incumplimiento del tutor en contenido prometido; (b) conducta inapropiada, irrespetuosa o discriminatoria; (c) ausencia o retraso injustificado del tutor; (d) calidad del servicio sustancialmente inferior a lo acordado; (e) problemas técnicos imputables al tutor. No aplica a: diferencias de opinión académica, dificultades de aprendizaje del estudiante, o problemas técnicos de red ajenos al tutor.

4. RETENCIÓN DE PAGO. El pago de la clase quedará en estado de retención (hold) desde el momento de la objeción y hasta la resolución final por parte de Conniku. Ninguna de las partes recibirá o perderá fondos durante este período.

5. PLAZO DE RESOLUCIÓN. Conniku SpA resolverá la objeción en un plazo máximo de 7 (siete) días hábiles contados desde la recepción de la misma. La resolución será comunicada por correo electrónico y notificación en la plataforma a ambas partes.

6. PROCESO DE REVISIÓN. Conniku podrá solicitar evidencia adicional (capturas de pantalla, registros de chat, grabaciones si existen) a cualquiera de las partes. Ambas partes tendrán la oportunidad de presentar su versión de los hechos.

7. RESOLUCIÓN Y EFECTOS. La resolución de Conniku podrá contemplar: (a) reembolso total al estudiante; (b) reembolso parcial; (c) pago total al tutor; (d) medidas disciplinarias contra cualquiera de las partes. La resolución es final en el contexto de la plataforma.

8. POLÍTICA DE REEMBOLSO. En caso de resolución favorable al estudiante, el reembolso se procesará en un plazo de 7 días hábiles adicionales mediante el mismo método de pago original.

9. CONFIDENCIALIDAD. Los detalles de la objeción y su resolución son confidenciales entre las partes involucradas y Conniku SpA. No serán divulgados públicamente.

10. CONSECUENCIAS DEL ABUSO. El uso reiterado o abusivo del sistema de objeciones sin fundamento podrá resultar en restricciones al acceso de clases o tutorías en la plataforma.

Al presionar "Enviar Objeción", el estudiante confirma haber leído, entendido y aceptado íntegramente estos términos.`;

// ─── Types ─────────────────────────────────────────────────────────────────
interface ClassRoomProps {
  classId: string;
  onNavigate: (path: string) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────
const ClassRoom: React.FC<ClassRoomProps> = ({ classId, onNavigate }) => {
  const [classData, setClassData] = useState<any>(null);
  const [jitsiInfo, setJitsiInfo] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // End class
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [endingClass, setEndingClass] = useState(false);
  const [classEnded, setClassEnded] = useState(false);

  // Start class (tutor only)
  const [startingClass, setStartingClass] = useState(false);

  // Post-class panel (ratings + exam + summary)
  const [showPostClass, setShowPostClass] = useState(false);
  const [showExam, setShowExam] = useState(false);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitting, setRatingSubmitting] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [summaryText, setSummaryText] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Objection modal
  const [showObjection, setShowObjection] = useState(false);
  const [objectionText, setObjectionText] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [submittingObjection, setSubmittingObjection] = useState(false);
  const [objectionSubmitted, setObjectionSubmitted] = useState(false);
  const [objectionError, setObjectionError] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const wordCount = objectionText.trim() ? objectionText.trim().split(/\s+/).length : 0;
  const wordCountOk = wordCount >= 30 && wordCount <= 500;

  // ── Load class data ──
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [cls, jitsi] = await Promise.allSettled([
          api.getTutorClass(classId),
          api.getClassJitsiRoom(classId),
        ]);
        if (cancelled) return;
        if (cls.status === 'fulfilled') setClassData(cls.value);
        else setError('No se pudo cargar la clase.');
        if (jitsi.status === 'fulfilled') setJitsiInfo(jitsi.value);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [classId]);

  // ── Load + poll messages ──
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.getClassMessages(classId, 1);
        setMessages(res.messages || []);
      } catch {
        /* silent */
      }
    };
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 8000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [classId]);

  // ── Scroll to bottom on new messages ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isTutor = jitsiInfo?.is_tutor === true;

  // ── Start class (tutor) ──
  const handleStartClass = async () => {
    setStartingClass(true);
    try {
      await api.startClassSession(classId);
      const updated = await api.getTutorClass(classId);
      setClassData(updated);
      const jitsi = await api.getClassJitsiRoom(classId);
      setJitsiInfo(jitsi);
    } catch (err: any) {
      alert(err?.message || 'Error al iniciar la clase');
    } finally {
      setStartingClass(false);
    }
  };

  // ── Send message ──
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSendingMsg(true);
    try {
      await api.sendClassMessage(classId, newMessage.trim());
      setNewMessage('');
      const res = await api.getClassMessages(classId, 1);
      setMessages(res.messages || []);
    } catch {
      /* silent */
    } finally {
      setSendingMsg(false);
    }
  };

  // ── Terminar Clase ──
  const handleEndClass = async () => {
    setEndingClass(true);
    try {
      if (isTutor) {
        await api.confirmClassCompletion(classId);
      } else {
        await api.studentConfirmClass(classId);
      }
      setClassEnded(true);
      setConfirmingEnd(false);
      setShowPostClass(true);
      const updated = await api.getTutorClass(classId);
      setClassData(updated);
    } catch (err: any) {
      alert(err?.message || 'Error al terminar la clase');
    } finally {
      setEndingClass(false);
    }
  };

  // ── Submit Objection ──
  const handleSubmitObjection = async () => {
    if (!termsAccepted) {
      setObjectionError('Debes aceptar los términos y condiciones.');
      return;
    }
    if (!wordCountOk) {
      setObjectionError(`Escribe entre 30 y 500 palabras (tienes ${wordCount}).`);
      return;
    }
    setObjectionError('');
    setSubmittingObjection(true);
    try {
      await api.objectToClass(classId, objectionText, true);
      setObjectionSubmitted(true);
    } catch (err: any) {
      setObjectionError(err?.message || 'Error al enviar la objeción.');
    } finally {
      setSubmittingObjection(false);
    }
  };

  // ── Submit rating ──
  const handleSubmitRating = async () => {
    if (!ratingValue) {
      setRatingError('Selecciona una calificación.');
      return;
    }
    setRatingSubmitting(true);
    setRatingError('');
    try {
      await api.rateTutorClass(classId, { rating: ratingValue, comment: ratingComment });
      setRatingSubmitted(true);
    } catch (err: any) {
      setRatingError(err?.message || 'Error al enviar la calificación');
    } finally {
      setRatingSubmitting(false);
    }
  };

  // ── Generate smart summary ──
  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await api.generateClassSummary(classId);
      setSummaryText(res.summary || '');
    } catch {
      setSummaryText('No se pudo generar el resumen. Intenta de nuevo.');
    } finally {
      setSummaryLoading(false);
    }
  };

  // ── Status helpers ──
  const statusLabel = (s: string) => {
    const m: Record<string, string> = {
      published: 'Publicada',
      confirmed: 'Confirmada',
      in_progress: 'En curso',
      completed: 'Completada',
      cancelled: 'Cancelada',
      disputed: 'Objetada',
    };
    return m[s] || s;
  };

  const statusColor = (s: string) => {
    const m: Record<string, string> = {
      in_progress: '#22c55e',
      confirmed: '#3b82f6',
      published: '#f59e0b',
      completed: '#8b5cf6',
      disputed: '#ef4444',
      cancelled: '#6b7280',
    };
    return m[s] || '#6b7280';
  };

  const fmtTime = (iso: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  };

  // ─── Loading / Error ─────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-muted)' }}>Cargando sala de clases…</p>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>❌</div>
        <h3>{error || 'Clase no encontrada'}</h3>
        <button
          onClick={() => onNavigate('/my-tutor/clases')}
          style={{
            marginTop: 16,
            padding: '8px 20px',
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          Volver
        </button>
      </div>
    );
  }

  const status = classData.status || 'unknown';
  const canJoin = ['in_progress', 'confirmed', 'published'].includes(status);
  const canEnd = ['in_progress', 'confirmed', 'published'].includes(status) && !classEnded;
  const canObject =
    !isTutor &&
    ['in_progress', 'confirmed', 'completed', 'disputed'].includes(status) &&
    !classEnded &&
    !objectionSubmitted;

  // ─── Main render ────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 60px)',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div
        className="card"
        style={{
          borderRadius: 0,
          borderLeft: 'none',
          borderRight: 'none',
          borderTop: 'none',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <button
          onClick={() => onNavigate('/my-tutor/clases')}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          ← Salir
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 15,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {classData.title || classData.subject || 'Sala de Clase'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {isTutor ? '👤 Eres el tutor' : '🎓 Estudiante'} ·{' '}
            <span style={{ color: statusColor(status), fontWeight: 700 }}>
              {statusLabel(status)}
            </span>
          </div>
        </div>

        {/* Tutor: Start Class button */}
        {isTutor && status === 'confirmed' && (
          <button
            onClick={handleStartClass}
            disabled={startingClass}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#22c55e',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              opacity: startingClass ? 0.7 : 1,
            }}
          >
            {startingClass ? 'Iniciando…' : '▶ Iniciar Clase'}
          </button>
        )}

        {/* Action buttons */}
        {canEnd && (
          <button
            onClick={() => setConfirmingEnd(true)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#3b82f6',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ✓ Terminar Clase
          </button>
        )}
        {classEnded && (
          <span
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              background: '#22c55e22',
              color: '#22c55e',
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            ✓ Clase terminada
          </span>
        )}
        {canObject && (
          <button
            onClick={() => setShowObjection(true)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #ef4444',
              background: 'transparent',
              color: '#ef4444',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            ⚠ Objetar
          </button>
        )}
        {objectionSubmitted && (
          <span
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              background: '#ef444422',
              color: '#ef4444',
              fontWeight: 700,
              fontSize: 12,
            }}
          >
            Objeción enviada
          </span>
        )}
      </div>

      {/* ── Body: Video + Chat ─────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', gap: 0 }}>
        {/* Jitsi video panel */}
        <div style={{ flex: 1, position: 'relative', background: '#0a0a0a', minWidth: 0 }}>
          {canJoin && jitsiInfo?.jitsi_url ? (
            <iframe
              src={jitsiInfo.jitsi_url}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Sala de video"
            />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#fff',
                gap: 16,
              }}
            >
              <div style={{ fontSize: 60 }}>🎥</div>
              {status === 'completed' ? (
                <>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>Clase completada</div>
                  <div style={{ fontSize: 14, color: '#aaa' }}>
                    La sesión de video ha finalizado.
                  </div>
                  <button
                    onClick={() => onNavigate('/my-tutor/clases')}
                    style={{
                      padding: '10px 24px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#3b82f6',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Ver mis clases
                  </button>
                </>
              ) : status === 'disputed' ? (
                <>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>Clase en revisión</div>
                  <div style={{ fontSize: 14, color: '#aaa' }}>
                    Se ha enviado una objeción. El equipo de Conniku resolverá en máx. 7 días
                    hábiles.
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>Sala no disponible</div>
                  <div style={{ fontSize: 14, color: '#aaa' }}>
                    {isTutor
                      ? 'Cuando estés listo, presiona "Iniciar Clase" para abrir la sala.'
                      : 'El tutor aún no ha iniciado la sesión. Por favor espera.'}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Chat panel */}
        <div
          style={{
            width: 300,
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid var(--border)',
            background: 'var(--bg-primary)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--border)',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            💬 Chat de clase
          </div>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {messages.length === 0 ? (
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  textAlign: 'center',
                  marginTop: 40,
                }}
              >
                Sin mensajes aún. Sé el primero en escribir.
              </p>
            ) : (
              messages.map((msg: any) => (
                <div
                  key={msg.id}
                  style={{ maxWidth: '90%', alignSelf: msg.is_own ? 'flex-end' : 'flex-start' }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--text-muted)',
                      marginBottom: 2,
                      textAlign: msg.is_own ? 'right' : 'left',
                    }}
                  >
                    {msg.sender_name} · {fmtTime(msg.created_at)}
                  </div>
                  <div
                    style={{
                      padding: '7px 11px',
                      borderRadius: 12,
                      fontSize: 13,
                      background: msg.is_own ? 'var(--accent)' : 'var(--bg-secondary)',
                      color: msg.is_own ? '#fff' : 'var(--text-primary)',
                      wordBreak: 'break-word',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '8px 10px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: 6,
            }}
          >
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje…"
              disabled={sendingMsg}
              style={{
                flex: 1,
                padding: '7px 10px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={sendingMsg || !newMessage.trim()}
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--accent)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 13,
                opacity: sendingMsg || !newMessage.trim() ? 0.5 : 1,
              }}
            >
              ➤
            </button>
          </form>
        </div>
      </div>

      {/* ── Confirm End Class Modal ─────────────────────────────── */}
      {confirmingEnd && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{ maxWidth: 420, width: '100%', padding: 28, textAlign: 'center' }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h3 style={{ margin: '0 0 8px' }}>¿Terminar la clase?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
              {isTutor
                ? 'Confirmarás que la clase fue completada. Cuando el estudiante también confirme, se liberará el pago.'
                : 'Confirmarás que la clase ocurrió correctamente. Podrás calificarla una vez que el tutor también confirme.'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button
                onClick={() => setConfirmingEnd(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleEndClass}
                disabled={endingClass}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#22c55e',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: endingClass ? 0.7 : 1,
                }}
              >
                {endingClass ? 'Procesando…' : 'Sí, terminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Objection Modal ─────────────────────────────────────── */}
      {showObjection && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '20px 16px',
            overflowY: 'auto',
          }}
        >
          <div
            className="card"
            style={{ maxWidth: 560, width: '100%', padding: 28, marginTop: 20 }}
          >
            {objectionSubmitted ? (
              /* ── Success state ── */
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 50, marginBottom: 16 }}>📋</div>
                <h3 style={{ margin: '0 0 12px', color: '#22c55e' }}>Objeción registrada</h3>
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 14,
                    lineHeight: 1.6,
                    marginBottom: 8,
                  }}
                >
                  Tu objeción ha sido enviada al equipo de Conniku y al tutor.
                </p>
                <p
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 24,
                  }}
                >
                  En un máximo de <span style={{ color: 'var(--accent)' }}>7 días hábiles</span>{' '}
                  recibirás una resolución por correo y notificación en la plataforma.
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
                  El pago queda retenido hasta la resolución final. Puedes cerrar esta ventana.
                </p>
                <button
                  onClick={() => setShowObjection(false)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Cerrar
                </button>
              </div>
            ) : (
              /* ── Form state ── */
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16 }}>⚠ Objetar Clase/Tutoría</h3>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      {classData.title || 'Esta clase'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowObjection(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 20,
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                </div>

                <div
                  style={{
                    background: '#ef444411',
                    border: '1px solid #ef444433',
                    borderRadius: 8,
                    padding: '10px 14px',
                    marginBottom: 18,
                    fontSize: 13,
                  }}
                >
                  <strong>Importante:</strong> Esta objeción será enviada inmediatamente al tutor y
                  al equipo de Conniku. El pago quedará retenido hasta la resolución (máx. 7 días
                  hábiles).
                </div>

                <label style={{ fontSize: 13, fontWeight: 700, display: 'block', marginBottom: 6 }}>
                  Explica el motivo de tu objeción *
                </label>
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginBottom: 8,
                    marginTop: 0,
                  }}
                >
                  Describe con detalle qué ocurrió. Mínimo 30 palabras, máximo 500 palabras.
                </p>
                <textarea
                  value={objectionText}
                  onChange={(e) => {
                    setObjectionText(e.target.value);
                    setObjectionError('');
                  }}
                  placeholder="Ej: La clase no se realizó según lo acordado porque el tutor no apareció en la sala hasta 30 minutos después de la hora pactada, y cuando entró no estaba preparado para el tema…"
                  rows={7}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: `1px solid ${wordCount > 0 && !wordCountOk ? '#ef4444' : 'var(--border)'}`,
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color:
                      wordCount > 500
                        ? '#ef4444'
                        : wordCount < 30 && wordCount > 0
                          ? '#f59e0b'
                          : 'var(--text-muted)',
                    marginBottom: 18,
                    marginTop: 4,
                  }}
                >
                  <span>{wordCount} palabras</span>
                  <span>
                    {wordCount < 30
                      ? `Mínimo 30 palabras (faltan ${30 - wordCount})`
                      : wordCount > 500
                        ? `Máximo 500 palabras (excedes por ${wordCount - 500})`
                        : '✓ Longitud correcta'}
                  </span>
                </div>

                {/* T&C */}
                <div
                  style={{ border: '1px solid var(--border)', borderRadius: 8, marginBottom: 16 }}
                >
                  <button
                    onClick={() => setShowTerms((v) => !v)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      color: 'var(--text-primary)',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    <span>📄 Términos y Condiciones de Objeción</span>
                    <span>{showTerms ? '▲' : '▼'}</span>
                  </button>
                  {showTerms && (
                    <div style={{ padding: '0 14px 14px', maxHeight: 220, overflowY: 'auto' }}>
                      <pre
                        style={{
                          fontSize: 11,
                          lineHeight: 1.6,
                          color: 'var(--text-muted)',
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'inherit',
                          margin: 0,
                        }}
                      >
                        {OBJECTION_TERMS}
                      </pre>
                    </div>
                  )}
                </div>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    cursor: 'pointer',
                    fontSize: 13,
                    marginBottom: 20,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      setObjectionError('');
                    }}
                    style={{
                      marginTop: 2,
                      accentColor: 'var(--accent)',
                      width: 16,
                      height: 16,
                      flexShrink: 0,
                    }}
                  />
                  <span>
                    He leído y acepto los{' '}
                    <button
                      onClick={() => setShowTerms(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: 'var(--accent)',
                        cursor: 'pointer',
                        fontSize: 13,
                        textDecoration: 'underline',
                      }}
                    >
                      Términos y Condiciones de Objeción
                    </button>
                    . Declaro que la información proporcionada es verídica.
                  </span>
                </label>

                {objectionError && (
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: '#ef444422',
                      color: '#ef4444',
                      fontSize: 13,
                      marginBottom: 16,
                    }}
                  >
                    {objectionError}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowObjection(false)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSubmitObjection}
                    disabled={submittingObjection || !termsAccepted || !wordCountOk}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#ef4444',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                      opacity: submittingObjection || !termsAccepted || !wordCountOk ? 0.5 : 1,
                    }}
                  >
                    {submittingObjection ? 'Enviando…' : 'Enviar Objeción'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Post-Class Panel ─────────────────────────────────────── */}
      {showPostClass && !showExam && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div className="card" style={{ maxWidth: 480, width: '100%', padding: 28 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>🎓</div>
              <h3 style={{ margin: '0 0 4px' }}>Clase terminada</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                {isTutor
                  ? 'Gracias por tu clase. Sube tu boleta para recibir el pago.'
                  : '¡Bien hecho! Completa las siguientes acciones.'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Rating (student only) */}
              {!isTutor && (
                <div className="card" style={{ padding: 16, background: 'var(--bg-secondary)' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
                    ⭐ Califica al tutor
                  </div>
                  {ratingSubmitted ? (
                    <p style={{ color: '#22c55e', fontSize: 13, margin: 0 }}>
                      ✓ Calificación enviada. ¡Gracias!
                    </p>
                  ) : (
                    <>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            onClick={() => setRatingValue(n)}
                            style={{
                              fontSize: 24,
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              opacity: n <= ratingValue ? 1 : 0.3,
                              transition: 'opacity 0.15s',
                            }}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={ratingComment}
                        onChange={(e) => setRatingComment(e.target.value)}
                        placeholder="Comentario opcional…"
                        rows={2}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--bg-primary)',
                          color: 'var(--text-primary)',
                          fontSize: 12,
                          resize: 'none',
                          boxSizing: 'border-box',
                          fontFamily: 'inherit',
                          marginBottom: 8,
                        }}
                      />
                      {ratingError && (
                        <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 6 }}>
                          {ratingError}
                        </p>
                      )}
                      <button
                        onClick={handleSubmitRating}
                        disabled={ratingSubmitting || !ratingValue}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          border: 'none',
                          background: 'var(--accent)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                          opacity: ratingSubmitting || !ratingValue ? 0.5 : 1,
                        }}
                      >
                        {ratingSubmitting ? 'Enviando…' : 'Enviar calificación'}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Exam (student only) */}
              {!isTutor && (
                <button
                  onClick={() => setShowExam(true)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 10,
                    border: '2px solid var(--accent)',
                    background: 'transparent',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  📝 Rendir examen post-clase
                  <span
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 400,
                      color: 'var(--text-muted)',
                      marginTop: 2,
                    }}
                  >
                    Máx. 3 intentos. El tercero muestra advertencia de garantía.
                  </span>
                </button>
              )}

              {/* Smart Summary */}
              <div className="card" style={{ padding: 16, background: 'var(--bg-secondary)' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: summaryText ? 10 : 0,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    🤖 Resumen inteligente de la clase
                  </div>
                  <button
                    onClick={handleGenerateSummary}
                    disabled={summaryLoading}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'var(--accent)',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      opacity: summaryLoading ? 0.6 : 1,
                    }}
                  >
                    {summaryLoading ? 'Generando…' : summaryText ? 'Regenerar' : 'Generar'}
                  </button>
                </div>
                {summaryText && (
                  <div
                    style={{
                      fontSize: 12,
                      lineHeight: 1.7,
                      color: 'var(--text-primary)',
                      maxHeight: 180,
                      overflowY: 'auto',
                      whiteSpace: 'pre-wrap',
                      marginTop: 8,
                      padding: '8px 10px',
                      background: 'var(--bg-primary)',
                      borderRadius: 6,
                    }}
                  >
                    {summaryText}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button
                onClick={() => {
                  setShowPostClass(false);
                  onNavigate('/my-tutor/clases');
                }}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#6b7280',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Volver a Mis Clases
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Post-Class Exam Modal ────────────────────────────────── */}
      {showExam && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            className="card"
            style={{ maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 14 }}>📝 Examen post-clase</span>
              <button
                onClick={() => setShowExam(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 20,
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                ×
              </button>
            </div>
            <Suspense
              fallback={
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </div>
              }
            >
              <PostClassExam classId={classId} onClose={() => setShowExam(false)} />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassRoom;
