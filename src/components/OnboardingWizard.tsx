import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  GraduationCap,
  BookOpen,
  Upload,
  Sparkles,
  Check,
  ChevronRight,
  ChevronLeft,
  Clock,
  FileText,
  Brain,
  Lightbulb,
  ClipboardList,
  Star,
  Zap,
  CheckCircle,
} from './Icons';

// ─── Types ──────────────────────────────────────────────────
interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface StepProps {
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
}

// ─── Constants ──────────────────────────────────────────────
const UNIVERSITIES = [
  'U. de Chile',
  'PUC',
  'UDP',
  'USACH',
  'UAI',
  'U. de Concepción',
  'UTFSM',
  'U. Austral',
  'UNAB',
  'UTAL',
  'UBB',
  'UCN',
  'PUCV',
  'UACh',
  'UVM',
  'DUOC UC',
  'INACAP',
  'IP Chile',
  'Otra',
];

const PRESET_COLORS = [
  { value: '#2563eb', label: 'Azul' },
  { value: '#16a34a', label: 'Verde' },
  { value: '#dc2626', label: 'Rojo' },
  { value: '#9333ea', label: 'Morado' },
  { value: '#ea580c', label: 'Naranja' },
  { value: '#0891b2', label: 'Cyan' },
];

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.txt'];

const SAMPLE_QUESTIONS = [
  {
    question: '¿Cuál es la derivada de f(x) = 3x² + 2x?',
    options: ['6x + 2', '3x + 2', '6x²', 'x² + 2'],
    correct: 0,
  },
  {
    question: '¿Qué método se usa para resolver ecuaciones diferenciales de primer orden?',
    options: [
      'Integración por partes',
      'Separación de variables',
      "Regla de L'Hôpital",
      'Series de Taylor',
    ],
    correct: 1,
  },
  {
    question: '¿Cuánto es el límite de sen(x)/x cuando x → 0?',
    options: ['0', 'Infinito', '1', 'No existe'],
    correct: 2,
  },
];

const TOTAL_STEPS = 4;
const TIMER_SECONDS = 60;

// ─── Styles ─────────────────────────────────────────────────
const styles = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 10000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    padding: 16,
  },
  card: {
    position: 'relative' as const,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90vh',
    overflow: 'auto',
    background: 'var(--bg-primary)',
    borderRadius: 20,
    padding: '32px 28px 24px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
    border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    background: 'var(--bg-hover)',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden' as const,
  },
  progressBarFill: (pct: number) => ({
    width: `${pct}%`,
    height: '100%',
    background: 'var(--accent)',
    borderRadius: 2,
    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  }),
  stepLabel: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginBottom: 20,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timer: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: 'var(--text-muted)',
    opacity: 0.7,
  },
  contentWrapper: {
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  slideContainer: (direction: 'left' | 'right' | 'none') => ({
    animation: direction === 'none' ? 'none' : `onbw-slide-${direction} 0.35s ease forwards`,
  }),
  title: {
    fontSize: 22,
    fontWeight: 700 as const,
    color: 'var(--text-primary)',
    marginBottom: 6,
    marginTop: 0,
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--text-muted)',
    marginBottom: 24,
    lineHeight: 1.5,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600 as const,
    color: 'var(--text-primary)',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid var(--border-color, rgba(128,128,128,0.2))',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: '1px solid var(--border-color, rgba(128,128,128,0.2))',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
    cursor: 'pointer',
    boxSizing: 'border-box' as const,
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    gap: 12,
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 22px',
    borderRadius: 10,
    border: 'none',
    background: 'var(--accent)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600 as const,
    cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 18px',
    borderRadius: 10,
    border: '1px solid var(--border-color, rgba(128,128,128,0.2))',
    background: 'transparent',
    color: 'var(--text-primary)',
    fontSize: 14,
    fontWeight: 500 as const,
    cursor: 'pointer',
    transition: 'background 0.15s',
  },
  skipBtn: {
    display: 'block',
    margin: '16px auto 0',
    padding: '6px 16px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: 13,
    cursor: 'pointer',
    textDecoration: 'underline' as const,
    opacity: 0.7,
    transition: 'opacity 0.15s',
  },
  iconCircle: (color: string) => ({
    width: 56,
    height: 56,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `${color}15`,
    color,
    marginBottom: 16,
  }),
};

// ─── Keyframes (injected once) ──────────────────────────────
const KEYFRAMES_ID = 'onbw-keyframes';
function injectKeyframes() {
  if (document.getElementById(KEYFRAMES_ID)) return;
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes onbw-slide-left {
      from { transform: translateX(40px); opacity: 0; }
      to   { transform: translateX(0); opacity: 1; }
    }
    @keyframes onbw-slide-right {
      from { transform: translateX(-40px); opacity: 0; }
      to   { transform: translateX(0); opacity: 1; }
    }
    @keyframes onbw-check-draw {
      from { stroke-dashoffset: 48; }
      to   { stroke-dashoffset: 0; }
    }
    @keyframes onbw-fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes onbw-scale-in {
      from { transform: scale(0); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }
    @keyframes onbw-progress-fill {
      from { width: 0; }
    }
    @keyframes onbw-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
  `;
  document.head.appendChild(style);
}

// ─── Step 1: ¿Qué estudias? ────────────────────────────────
function Step1(_props: StepProps) {
  const [university, setUniversity] = useState('');
  const [career, setCareer] = useState('');
  const [semester, setSemester] = useState('');

  return (
    <div>
      <div style={styles.iconCircle('#2563eb')}>{GraduationCap({ size: 28 })}</div>
      <h2 style={styles.title}>¿Qué estudias?</h2>
      <p style={styles.subtitle}>Cuéntanos sobre ti para personalizar tu experiencia</p>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Universidad</label>
        <select
          style={styles.select}
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
        >
          <option value="">Selecciona tu universidad</option>
          {UNIVERSITIES.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Carrera</label>
        <input
          style={styles.input}
          type="text"
          placeholder="Ej: Ingeniería Civil, Medicina, Derecho"
          value={career}
          onChange={(e) => setCareer(e.target.value)}
        />
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Semestre actual</label>
        <select
          style={styles.select}
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
        >
          <option value="">Selecciona semestre</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={String(i + 1)}>
              {i + 1}° semestre
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── Step 2: Crea tu primera asignatura ─────────────────────
function Step2(_props: StepProps) {
  const [subjectName, setSubjectName] = useState('');
  const [subjectSemester, setSubjectSemester] = useState('2026-1');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);

  return (
    <div>
      <div style={styles.iconCircle('#16a34a')}>{BookOpen({ size: 28 })}</div>
      <h2 style={styles.title}>Crea tu primera asignatura</h2>
      <p style={styles.subtitle}>Organiza tus materiales por ramo para estudiar mejor</p>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Nombre de la asignatura</label>
        <input
          style={styles.input}
          type="text"
          placeholder="Ej: Cálculo II, Anatomía, Derecho Civil"
          value={subjectName}
          onChange={(e) => setSubjectName(e.target.value)}
        />
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Semestre</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {['2026-1', '2026-2'].map((sem) => (
            <button
              key={sem}
              onClick={() => setSubjectSemester(sem)}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: 10,
                border:
                  subjectSemester === sem
                    ? '2px solid var(--accent)'
                    : '1px solid var(--border-color, rgba(128,128,128,0.2))',
                background: subjectSemester === sem ? 'var(--accent)12' : 'var(--bg-secondary)',
                color: subjectSemester === sem ? 'var(--accent)' : 'var(--text-primary)',
                fontSize: 14,
                fontWeight: subjectSemester === sem ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {sem}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Color</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setSelectedColor(c.value)}
              title={c.label}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border:
                  selectedColor === c.value
                    ? '3px solid var(--text-primary)'
                    : '2px solid transparent',
                background: c.value,
                cursor: 'pointer',
                transition: 'transform 0.15s, border-color 0.2s',
                transform: selectedColor === c.value ? 'scale(1.15)' : 'scale(1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              {selectedColor === c.value && (
                <span style={{ color: '#fff', fontSize: 16, lineHeight: 1 }}>
                  {Check({ size: 16, color: '#fff' })}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Sube tu primer documento ───────────────────────
function Step3(_props: StepProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadDone, setUploadDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const simulateUpload = useCallback((fileName: string) => {
    setUploadedFile(fileName);
    setUploadProgress(0);
    setUploadDone(false);
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => setUploadDone(true), 300);
      }
      setUploadProgress(Math.min(progress, 100));
    }, 200);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) simulateUpload(file.name);
    },
    [simulateUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) simulateUpload(file.name);
    },
    [simulateUpload]
  );

  const generatedItems = [
    { icon: FileText, label: 'Resumen', color: '#2563eb' },
    { icon: Brain, label: 'Flashcards', color: '#9333ea' },
    { icon: ClipboardList, label: 'Quiz', color: '#ea580c' },
    { icon: Lightbulb, label: 'Guía de estudio', color: '#16a34a' },
  ];

  return (
    <div>
      <div style={styles.iconCircle('#ea580c')}>{Upload({ size: 28 })}</div>
      <h2 style={styles.title}>Sube tu primer documento</h2>
      <p style={styles.subtitle}>Konni generará automáticamente material de estudio</p>

      {!uploadedFile ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border-color, rgba(128,128,128,0.25))'}`,
            borderRadius: 14,
            padding: '32px 20px',
            textAlign: 'center' as const,
            cursor: 'pointer',
            background: dragOver ? 'var(--accent)08' : 'var(--bg-secondary)',
            transition: 'all 0.2s',
          }}
        >
          <div
            style={{
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}
          >
            {Upload({ size: 32 })}
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Arrastra tu archivo aquí
          </p>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            o haz clic para seleccionar · PDF, DOCX, PPTX, TXT
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(',')}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      ) : (
        <div>
          {/* File & progress */}
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 12,
              padding: '14px 16px',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 10,
              }}
            >
              {FileText({ size: 18, color: 'var(--accent)' })}
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {uploadedFile}
              </span>
              {uploadDone && <span style={{ color: '#16a34a' }}>{CheckCircle({ size: 18 })}</span>}
            </div>
            <div
              style={{
                width: '100%',
                height: 6,
                borderRadius: 3,
                background: 'var(--bg-hover)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  borderRadius: 3,
                  background: uploadDone ? '#16a34a' : 'var(--accent)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <span
              style={{
                fontSize: 11,
                color: 'var(--text-muted)',
                marginTop: 4,
                display: 'block',
              }}
            >
              {uploadDone ? '¡Listo!' : `Subiendo... ${Math.round(uploadProgress)}%`}
            </span>
          </div>

          {/* What Konni generates */}
          {uploadDone && (
            <div
              style={{
                animation: 'onbw-fade-in 0.4s ease forwards',
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: 10,
                }}
              >
                Konni generará automáticamente:
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                }}
              >
                {generatedItems.map((item, idx) => (
                  <div
                    key={item.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: `${item.color}10`,
                      animation: `onbw-fade-in 0.3s ease ${idx * 0.1}s both`,
                    }}
                  >
                    {item.icon({ size: 16, color: item.color })}
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Step 4: ¡Listo! ────────────────────────────────────────
function Step4(_props: StepProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (qIdx: number, optIdx: number) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
    if (Object.keys(selectedAnswers).length + 1 >= SAMPLE_QUESTIONS.length) {
      setTimeout(() => setShowResults(true), 400);
    }
  };

  return (
    <div>
      {/* Success animation */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: '#16a34a18',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'onbw-scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16a34a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline
              points="20 6 9 17 4 12"
              style={{
                strokeDasharray: 48,
                strokeDashoffset: 0,
                animation: 'onbw-check-draw 0.6s ease 0.3s both',
              }}
            />
          </svg>
        </div>
      </div>

      <h2 style={{ ...styles.title, textAlign: 'center' as const }}>
        ¡Listo! Mira lo que Konni puede hacer
      </h2>

      {/* Stats */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          marginBottom: 20,
          flexWrap: 'wrap',
        }}
      >
        {[
          { icon: Brain, n: '12', label: 'Flashcards', color: '#9333ea' },
          { icon: Lightbulb, n: '5', label: 'Conceptos clave', color: '#ea580c' },
          { icon: ClipboardList, n: '3', label: 'Preguntas', color: '#2563eb' },
        ].map((s, idx) => (
          <div
            key={s.label}
            style={{
              textAlign: 'center' as const,
              animation: `onbw-fade-in 0.3s ease ${idx * 0.12}s both`,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: `${s.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 6px',
              }}
            >
              {s.icon({ size: 18, color: s.color })}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              {s.n}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Sample quiz */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 14,
          padding: '14px 16px',
          maxHeight: 220,
          overflowY: 'auto' as const,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 12,
          }}
        >
          {Zap({ size: 14, color: 'var(--accent)' })}
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            Quiz de prueba
          </span>
        </div>

        {SAMPLE_QUESTIONS.map((q, qIdx) => (
          <div
            key={qIdx}
            style={{
              marginBottom: qIdx < SAMPLE_QUESTIONS.length - 1 ? 14 : 0,
              animation: `onbw-fade-in 0.3s ease ${qIdx * 0.1}s both`,
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: '0 0 6px',
              }}
            >
              {qIdx + 1}. {q.question}
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 4,
              }}
            >
              {q.options.map((opt, optIdx) => {
                const isSelected = selectedAnswers[qIdx] === optIdx;
                const isCorrect = showResults && optIdx === q.correct;
                const isWrong = showResults && isSelected && optIdx !== q.correct;

                let bg = 'var(--bg-hover)';
                let borderColor = 'transparent';
                if (isSelected && !showResults) {
                  bg = 'var(--accent)18';
                  borderColor = 'var(--accent)';
                } else if (isCorrect) {
                  bg = '#16a34a18';
                  borderColor = '#16a34a';
                } else if (isWrong) {
                  bg = '#dc262618';
                  borderColor = '#dc2626';
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleAnswer(qIdx, optIdx)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: 8,
                      border: `1.5px solid ${borderColor}`,
                      background: bg,
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      cursor: showResults ? 'default' : 'pointer',
                      textAlign: 'left' as const,
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {isCorrect && (
                      <span style={{ flexShrink: 0 }}>{Check({ size: 12, color: '#16a34a' })}</span>
                    )}
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Wizard Component ──────────────────────────────────
const STEP_COMPONENTS = [Step1, Step2, Step3, Step4];

export default function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | 'none'>('none');
  const [timer, setTimer] = useState(TIMER_SECONDS);

  // Inject keyframes on mount
  useEffect(() => {
    injectKeyframes();
  }, []);

  // Countdown timer (visual only)
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Keyboard navigation
  const handleNext = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      setSlideDir('left');
      setTimeout(() => setStep((s) => s + 1), 50);
    } else {
      onComplete();
    }
  }, [step, onComplete]);

  const handleBack = useCallback(() => {
    if (step > 0) {
      setSlideDir('right');
      setTimeout(() => setStep((s) => s - 1), 50);
    }
  }, [step]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleBack();
      } else if (e.key === 'Escape') {
        onSkip();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleNext, handleBack, onSkip]);

  // Reset animation direction after transition
  useEffect(() => {
    if (slideDir !== 'none') {
      const t = setTimeout(() => setSlideDir('none'), 360);
      return () => clearTimeout(t);
    }
  }, [slideDir, step]);

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const StepComponent = STEP_COMPONENTS[step];

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        {/* Progress bar */}
        <div style={styles.progressBarContainer}>
          <div style={styles.progressBarFill(progress)} />
        </div>

        {/* Step counter + timer */}
        <div style={styles.stepLabel}>
          <span>
            Paso {step + 1} de {TOTAL_STEPS}
          </span>
          <span style={styles.timer}>
            {Clock({ size: 12 })}
            {formatTime(timer)}
          </span>
        </div>

        {/* Step content with slide animation */}
        <div style={styles.contentWrapper}>
          <div key={step} style={styles.slideContainer(slideDir)}>
            <StepComponent
              onNext={handleNext}
              onBack={handleBack}
              isFirst={step === 0}
              isLast={step === TOTAL_STEPS - 1}
            />
          </div>
        </div>

        {/* Navigation buttons */}
        <div style={styles.actions}>
          {step > 0 ? (
            <button
              style={styles.btnSecondary}
              onClick={handleBack}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              {ChevronLeft({ size: 16 })}
              Atrás
            </button>
          ) : (
            <div />
          )}
          <button
            style={{
              ...styles.btnPrimary,
              ...(step === TOTAL_STEPS - 1
                ? {
                    background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                    animation: 'onbw-pulse 2s ease infinite',
                  }
                : {}),
            }}
            onClick={handleNext}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.transform = 'scale(1.03)';
              (e.target as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(37,99,235,0.3)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.transform = 'scale(1)';
              (e.target as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            {step === TOTAL_STEPS - 1 ? (
              <>
                {Star({ size: 16 })}
                Comenzar a estudiar
              </>
            ) : (
              <>
                Siguiente
                {ChevronRight({ size: 16 })}
              </>
            )}
          </button>
        </div>

        {/* Skip button */}
        <button
          style={styles.skipBtn}
          onClick={onSkip}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.opacity = '0.7';
          }}
        >
          Saltar por ahora
        </button>
      </div>
    </div>
  );
}
