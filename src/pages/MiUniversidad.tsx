import React, { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { api } from '../services/api';

// Profile embebido para el formulario de conexión LMS
const Profile = lazy(() => import('./Profile'));

interface Props {
  onNavigate?: (path: string) => void;
}

// ── Tipos ──────────────────────────────────────────────────────────────────────
interface CourseItem {
  id: string;
  name: string;
  display_name: string;
  short_name: string;
  semester: string;
  startdate: number;
  enddate: number;
  is_current: boolean;
  new_items: number;
  total_items: number;
  last_checked: string | null;
  conniku_project_id: string | null;
}

interface NewItemEntry {
  id: string;
  item_name: string;
  item_type: string;
  topic_name: string;
  detected_at: string;
}

interface NewByCourse {
  [courseId: string]: { course_name: string; items: NewItemEntry[] };
}

interface HubData {
  connected: boolean;
  connection?: {
    id: string;
    platform_type: string;
    platform_name: string;
    api_url: string;
    status: string;
    last_scan: string | null;
  };
  current_courses: CourseItem[];
  past_courses: CourseItem[];
  new_items_by_course: NewByCourse;
  total_new: number;
}

interface TopicItem {
  id: string;
  item_name: string;
  item_type: string;
  item_url: string;
  mime_type: string;
  file_size: number;
  module_name: string;
  status: string;
  detected_at: string;
}

interface Topic {
  name: string;
  order: number;
  items: TopicItem[];
}

// ── Helpers visuales ───────────────────────────────────────────────────────────
const TYPE_ICON: Record<string, string> = {
  file: '📄',
  url: '🔗',
  assignment: '📝',
  quiz: '🧩',
  page: '📰',
};
const MIME_ICON: Record<string, string> = {
  'application/pdf': '📕',
  'application/vnd.ms-powerpoint': '📊',
  'application/vnd.openxmlformats-officedocument.presentationml': '📊',
  'application/msword': '📘',
  'application/vnd.openxmlformats-officedocument.wordprocessingml': '📘',
  'application/vnd.ms-excel': '📗',
  'application/vnd.openxmlformats-officedocument.spreadsheetml': '📗',
  'application/zip': '🗜️',
};
function itemIcon(type: string, mime: string): string {
  if (type === 'assignment') return '📝';
  if (type === 'quiz') return '🧩';
  if (type === 'url') return '🔗';
  if (type === 'page') return '📰';
  for (const [k, v] of Object.entries(MIME_ICON)) {
    if (mime.startsWith(k)) return v;
  }
  return '📄';
}
function formatSize(bytes: number): string {
  if (!bytes || bytes === 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
function timeAgo(iso: string | null): string {
  if (!iso) return 'Nunca sincronizado';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'hace un momento';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days} día${days !== 1 ? 's' : ''}`;
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function MiUniversidad({ onNavigate }: Props) {
  const [view, setView] = useState<'hub' | 'course'>('hub');
  const [hub, setHub] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState('');
  // Configuración de conexión embebida dentro del módulo
  const [showConfig, setShowConfig] = useState(false);

  // Vista de asignatura
  const [selectedCourse, setSelectedCourse] = useState<CourseItem | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [openTopics, setOpenTopics] = useState<Set<string>>(new Set());
  const [courseTab, setCourseTab] = useState<'modulos' | 'todo' | 'chat' | 'quizzes'>('modulos');
  // Chat de asignatura
  const [chatMessages, setChatMessages] = useState<
    { role: 'user' | 'assistant'; content: string }[]
  >([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  // Quiz de asignatura
  const [qsAvg, setQsAvg] = useState<any>(null);
  const [qsSched, setQsSched] = useState<any[]>([]);
  const [qsLoaded, setQsLoaded] = useState(false);
  const [diagMode, setDiagMode] = useState<'idle' | 'loading' | 'active' | 'done'>('idle');
  const [diagQs, setDiagQs] = useState<any[]>([]);
  const [diagIdx, setDiagIdx] = useState(0);
  const [diagAns, setDiagAns] = useState<Record<number, number>>({});
  const [diagRes, setDiagRes] = useState<any>(null);
  const [schedActive, setSchedActive] = useState<{
    quizId: string;
    num: number;
    questions: any[];
    answers: Record<number, number>;
    idx: number;
    mode: 'loading' | 'active' | 'done';
    result: any;
  } | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [quizNumQuestions, setQuizNumQuestions] = useState<5 | 10 | 15>(10);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizHistory, setQuizHistory] = useState<any[]>([]);

  // Modal agregar asignaturas
  const [showAddModal, setShowAddModal] = useState(false);
  const [available, setAvailable] = useState<{ en_curso: any[]; anteriores: any[] } | null>(null);
  const [availableLoading, setAvailableLoading] = useState(false);
  const [addTab, setAddTab] = useState<'en_curso' | 'anteriores'>('en_curso');
  const [selectedToAdd, setSelectedToAdd] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [addProgress, setAddProgress] = useState<string[]>([]);

  // Novedades + secciones colapsables
  const [novedadesOpen, setNovedadesOpen] = useState(true);
  const [pastOpen, setPastOpen] = useState(false);
  const [openNovedades, setOpenNovedades] = useState<Set<string>>(new Set());

  // Renombrar asignatura (inline)
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Auto-link + import
  const [linking, setLinking] = useState(false);
  const [importingItemId, setImportingItemId] = useState('');
  const [bulkImporting, setBulkImporting] = useState('');
  const [bulkImportMsg, setBulkImportMsg] = useState('');

  // ── Calendario universitario ────────────────────────────────
  const [calEvents, setCalEvents] = useState<any[]>([]);
  const [calPrefs, setCalPrefs] = useState({ cal_push: true, cal_inapp: true, cal_email: true });
  const [calSyncing, setCalSyncing] = useState(false);
  const [calMsg, setCalMsg] = useState('');
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [, setTick] = useState(0); // fuerza re-render cada minuto para countdowns

  // ── Carga hub ───────────────────────────────────────────────
  const loadHub = useCallback(async () => {
    setLoading(true);
    try {
      const data: any = await api.lmsGetHub();
      setHub(data);
    } catch {
      setHub({
        connected: false,
        current_courses: [],
        past_courses: [],
        new_items_by_course: {},
        total_new: 0,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHub();
    api.lmsMarkVisited().catch(() => {});
    // Cargar eventos del calendario universitario
    api
      .lmsGetCalendar()
      .then((d: any) => {
        setCalEvents(d?.events || []);
        if (d?.prefs) setCalPrefs(d.prefs);
      })
      .catch(() => {});
    // Tick cada minuto para actualizar countdowns
    const timer = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(timer);
  }, [loadHub]);

  // Reset quiz state when switching courses
  useEffect(() => {
    setQsAvg(null);
    setQsSched([]);
    setQsLoaded(false);
    setDiagMode('idle');
    setDiagQs([]);
    setDiagIdx(0);
    setDiagAns({});
    setDiagRes(null);
    setSchedActive(null);
    setQuizQuestions([]);
    setQuizCurrentIndex(0);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizResult(null);
    setIsGeneratingQuiz(false);
  }, [selectedCourse?.id]);

  // Cargar datos de quizzes cuando se abre el tab
  useEffect(() => {
    if (courseTab !== 'quizzes' || !selectedCourse?.conniku_project_id || qsLoaded) return;
    setQsLoaded(true);
    const pid = selectedCourse.conniku_project_id;
    Promise.all([
      api.getSubjectAverage(pid).catch(() => null),
      api.getScheduledQuizzes(pid).catch(() => []),
    ]).then(([avg, sched]) => {
      setQsAvg(avg || null);
      setQsSched(Array.isArray(sched) ? sched : []);
    });
    try {
      const all = JSON.parse(localStorage.getItem('conniku_quiz_history') || '[]');
      setQuizHistory(all.filter((h: any) => h.projectId === pid).slice(0, 8));
    } catch {}
  }, [courseTab, selectedCourse?.conniku_project_id, qsLoaded]);

  // ── Escanear material nuevo ─────────────────────────────────
  const handleScan = async () => {
    setScanning(true);
    setScanMsg('⏳ Buscando material nuevo en tu campus...');
    try {
      const res: any = await api.lmsScan();
      setScanMsg(
        res.total_new > 0
          ? `✅ ${res.total_new} archivo${res.total_new !== 1 ? 's' : ''} nuevo${res.total_new !== 1 ? 's' : ''} encontrado${res.total_new !== 1 ? 's' : ''}`
          : '✅ Todo está al día — sin novedades'
      );
      await loadHub();
    } catch {
      setScanMsg('⚠ No se pudo conectar con el campus virtual');
    } finally {
      setScanning(false);
      setTimeout(() => setScanMsg(''), 4000);
    }
  };

  // ── Abrir asignatura ────────────────────────────────────────
  const openCourse = async (course: CourseItem) => {
    setSelectedCourse(course);
    setView('course');
    setTopicsLoading(true);
    setTopics([]);
    try {
      const data: any = await api.lmsGetTopics(course.id);
      setTopics(data.topics || []);
      // Abrir primer tema por defecto
      if (data.topics?.length > 0) {
        setOpenTopics(new Set([data.topics[0].name]));
      }
    } catch {
      setTopics([]);
    } finally {
      setTopicsLoading(false);
    }
  };

  // ── Modal Agregar asignaturas ───────────────────────────────
  const openAddModal = async () => {
    if (!hub?.connection) return;
    setShowAddModal(true);
    setAvailableLoading(true);
    setAvailable(null);
    setSelectedToAdd(new Set());
    try {
      const data: any = await api.lmsGetAvailable(hub.connection.id);
      setAvailable(data);
      if ((data.en_curso?.length || 0) === 0 && (data.anteriores?.length || 0) > 0) {
        setAddTab('anteriores');
      }
    } catch {
      setAvailable({ en_curso: [], anteriores: [] });
    } finally {
      setAvailableLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedToAdd((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddCourses = async () => {
    if (!hub?.connection || selectedToAdd.size === 0) return;
    setAdding(true);
    setAddProgress(['⏳ Iniciando sincronización...']);
    const ids = Array.from(selectedToAdd);
    const allCourses = [...(available?.en_curso || []), ...(available?.anteriores || [])];

    for (let i = 0; i < ids.length; i++) {
      const course = allCourses.find((c: any) => c.id === ids[i]);
      if (course) {
        setAddProgress((prev) => [...prev, `📥 Importando: "${course.name}"…`]);
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    try {
      const res: any = await api.lmsAddCourses(hub.connection.id, ids);
      setAddProgress((prev) => [
        ...prev,
        `✅ ${res.activated} asignatura${res.activated !== 1 ? 's' : ''} agregada${res.activated !== 1 ? 's' : ''} · ${res.total_new_items} archivos importados`,
      ]);
      await loadHub();
      setTimeout(() => {
        setShowAddModal(false);
        setAdding(false);
        setAddProgress([]);
      }, 1800);
    } catch {
      setAddProgress((prev) => [...prev, '⚠ Ocurrió un error al agregar las asignaturas']);
      setAdding(false);
    }
  };

  // ── Re-escanear asignatura individual ─────────────────────
  const rescanCourse = async (courseId: string) => {
    try {
      setScanMsg('⏳ Actualizando asignatura...');
      await api.lmsScanCourse(courseId);
      const data: any = await api.lmsGetTopics(courseId);
      setTopics(data.topics || []);
      setScanMsg('✅ Material actualizado');
      setTimeout(() => setScanMsg(''), 3000);
    } catch {
      setScanMsg('⚠ No se pudo actualizar');
    }
  };

  // ── Auto-vincular asignatura → crea proyecto Conniku automáticamente ──
  const handleAutoLink = async (courseId: string) => {
    setLinking(true);
    try {
      const res: any = await api.lmsAutoLink(courseId);
      if (res.project_id) {
        // Actualizar estado local del curso
        setSelectedCourse((prev) =>
          prev ? { ...prev, conniku_project_id: res.project_id } : prev
        );
        setHub((prev) => {
          if (!prev) return prev;
          const update = (list: CourseItem[]) =>
            list.map((c) => (c.id === courseId ? { ...c, conniku_project_id: res.project_id } : c));
          return {
            ...prev,
            current_courses: update(prev.current_courses),
            past_courses: update(prev.past_courses),
          };
        });
        setScanMsg(
          res.already_linked
            ? '✅ Asignatura ya vinculada'
            : '✅ Asignatura vinculada — Chat inteligente, Quizzes e importación activados'
        );
        setTimeout(() => setScanMsg(''), 4000);
      }
    } catch {
      setScanMsg('⚠ No se pudo vincular la asignatura');
      setTimeout(() => setScanMsg(''), 4000);
    } finally {
      setLinking(false);
    }
  };

  // ── Importar un archivo individual al proyecto vinculado ──
  const handleImportItem = async (item: TopicItem) => {
    if (!selectedCourse) return;
    let projectId = selectedCourse.conniku_project_id;
    // Auto-link if needed
    if (!projectId) {
      setLinking(true);
      try {
        const res: any = await api.lmsAutoLink(selectedCourse.id);
        projectId = res.project_id;
        setSelectedCourse((prev) => (prev ? { ...prev, conniku_project_id: projectId } : prev));
        setHub((prev) => {
          if (!prev) return prev;
          const update = (list: CourseItem[]) =>
            list.map((c) =>
              c.id === selectedCourse.id ? { ...c, conniku_project_id: projectId } : c
            );
          return {
            ...prev,
            current_courses: update(prev.current_courses),
            past_courses: update(prev.past_courses),
          };
        });
      } catch {
        setScanMsg('⚠ No se pudo vincular la asignatura');
        setLinking(false);
        return;
      } finally {
        setLinking(false);
      }
    }
    if (!projectId) return;
    setImportingItemId(item.id);
    try {
      const res: any = await api.lmsSyncItem(item.id, projectId);
      if (res.has_content && res.content_b64) {
        await api.importDocumentB64(projectId, res.filename, res.content_b64, res.file_type);
      }
      setScanMsg(`✅ "${item.item_name}" importado al proyecto`);
      setTimeout(() => setScanMsg(''), 3000);
    } catch {
      setScanMsg(`⚠ No se pudo importar "${item.item_name}"`);
      setTimeout(() => setScanMsg(''), 3000);
    } finally {
      setImportingItemId('');
    }
  };

  // ── Bulk import: importar todos los archivos de un curso ──
  const handleBulkImport = async (courseId: string) => {
    setBulkImporting(courseId);
    setBulkImportMsg('⏳ Importando archivos...');
    try {
      const res: any = await api.lmsBulkImport(courseId);
      const msg =
        res.imported > 0
          ? `✅ ${res.imported} archivo${res.imported !== 1 ? 's' : ''} importado${res.imported !== 1 ? 's' : ''}${res.errors > 0 ? ` (${res.errors} error${res.errors !== 1 ? 'es' : ''})` : ''}`
          : '✅ No hay archivos nuevos para importar';
      setBulkImportMsg(msg);
      // Actualizar hub y estado del curso
      if (res.project_id) {
        setHub((prev) => {
          if (!prev) return prev;
          const update = (list: CourseItem[]) =>
            list.map((c) => (c.id === courseId ? { ...c, conniku_project_id: res.project_id } : c));
          return {
            ...prev,
            current_courses: update(prev.current_courses),
            past_courses: update(prev.past_courses),
          };
        });
      }
      await loadHub();
      setTimeout(() => setBulkImportMsg(''), 5000);
    } catch {
      setBulkImportMsg('⚠ Error al importar archivos');
      setTimeout(() => setBulkImportMsg(''), 4000);
    } finally {
      setBulkImporting('');
    }
  };

  // ── Chat de asignatura ─────────────────────────────────────
  // Si la asignatura tiene proyecto Conniku vinculado: usa /projects/{id}/chat (Claude + documentos del curso)
  // Si no: usa /support/chat con contexto de asignatura (Konni con detección automática de intención)
  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading || !selectedCourse) return;
    const msg = chatInput.trim();
    setChatInput('');
    const newHistory: { role: 'user' | 'assistant'; content: string }[] = [
      ...chatMessages,
      { role: 'user', content: msg },
    ];
    setChatMessages(newHistory);
    setChatLoading(true);
    try {
      let reply = '';
      if (selectedCourse.conniku_project_id) {
        const res: any = await api.chat(selectedCourse.conniku_project_id, msg);
        reply = res?.reply || res?.message || '';
      } else {
        const history = chatMessages.map((m) => ({ role: m.role, content: m.content }));
        const res: any = await api.supportChat(
          msg,
          history,
          `asignatura:${selectedCourse.display_name || selectedCourse.name}`
        );
        reply = res?.reply || res?.message || '';
      }
      setChatMessages([
        ...newHistory,
        { role: 'assistant', content: reply || 'Sin respuesta del servidor.' },
      ]);
    } catch {
      setChatMessages([
        ...newHistory,
        { role: 'assistant', content: '⚠ No se pudo procesar tu consulta. Intenta nuevamente.' },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Marcar novedades como vistas ───────────────────────────
  const markNewSeen = async () => {
    await api.lmsMarkVisited().catch(() => {});
    setHub((prev) => (prev ? { ...prev, new_items_by_course: {}, total_new: 0 } : prev));
  };

  // ── Renombrar asignatura ────────────────────────────────────
  const handleRename = async (courseId: string) => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    try {
      await api.lmsRenameCourse(courseId, trimmed);
      setHub((prev) => {
        if (!prev) return prev;
        const update = (list: CourseItem[]) =>
          list.map((c) => (c.id === courseId ? { ...c, display_name: trimmed } : c));
        return {
          ...prev,
          current_courses: update(prev.current_courses),
          past_courses: update(prev.past_courses),
        };
      });
    } catch {
      /* silencioso */
    }
    setRenamingId(null);
  };

  // ── Sincronizar calendario universitario ───────────────────
  const handleSyncCalendar = async () => {
    setCalSyncing(true);
    setCalMsg('⏳ Sincronizando calendario...');
    try {
      const res: any = await api.lmsSyncCalendar();
      setCalMsg(`✅ ${res.total} eventos sincronizados`);
      const d: any = await api.lmsGetCalendar();
      setCalEvents(d?.events || []);
    } catch {
      setCalMsg('⚠ No se pudo sincronizar el calendario');
    } finally {
      setCalSyncing(false);
      setTimeout(() => setCalMsg(''), 4000);
    }
  };

  // ── Actualizar preferencias de notificación ─────────────────
  const updatePref = async (key: string, val: boolean) => {
    const next = { ...calPrefs, [key]: val };
    setCalPrefs(next as any);
    await api.lmsUpdateCalendarPrefs({ [key]: val }).catch(() => {});
  };

  // ── Click en evento del calendario ─────────────────────────
  // Clases (Zoom/BBB): navega a la asignatura + abre el link de la sala
  // Resto (tareas, exámenes, etc.): abre directamente el URL del LMS
  const handleCalEventClick = useCallback(
    (ev: any) => {
      if (ev.event_type === 'class') {
        // Navegar a la asignatura dentro de Conniku
        if (ev.lms_course_id) {
          const course = hub?.current_courses.find((c: CourseItem) => c.id === ev.lms_course_id);
          if (course) openCourse(course);
        }
        // También abrir el link de la sala si existe
        if (ev.item_url) window.open(ev.item_url, '_blank', 'noopener,noreferrer');
      } else if (ev.item_url) {
        window.open(ev.item_url, '_blank', 'noopener,noreferrer');
      }
    },
    [hub, openCourse]
  );

  // ──────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────

  if (loading)
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 320,
          gap: 16,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid var(--border)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%',
            animation: 'spin 0.9s linear infinite',
          }}
        />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Cargando tu universidad…</p>
      </div>
    );

  // Formulario de configuración/conexión embebido (sin salir del módulo)
  if (showConfig || !hub?.connected)
    return (
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 0 60px' }}>
        {hub?.connected && (
          <button
            onClick={() => setShowConfig(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              padding: '0 0 16px',
              marginBottom: 8,
            }}
          >
            ← Volver a Mi Universidad
          </button>
        )}
        <Suspense
          fallback={
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: 32,
                color: 'var(--text-muted)',
                fontSize: 14,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  border: '2px solid var(--border)',
                  borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                  animation: 'spin 0.9s linear infinite',
                }}
              />
              Cargando configuración…
            </div>
          }
        >
          <Profile
            embedded
            initialSection="universidad"
            onNavigate={(path) => {
              // Si navegan a /mi-universidad desde el form (tras conectar exitosamente), recargar el hub
              if (path === '/mi-universidad') {
                setShowConfig(false);
                loadHub();
              } else {
                onNavigate?.(path);
              }
            }}
          />
        </Suspense>
      </div>
    );

  // ── Vista detalle de asignatura ─────────────────────────────
  if (view === 'course' && selectedCourse) {
    return (
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 0 60px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => {
              setView('hub');
              setSelectedCourse(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              padding: '6px 10px',
              borderRadius: 8,
            }}
            className="btn-ghost"
          >
            ← Mi Universidad
          </button>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '20px 24px',
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <h2
                style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}
              >
                {selectedCourse.name}
              </h2>
              {selectedCourse.short_name && (
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                  {selectedCourse.short_name}
                </p>
              )}
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                {topics.length} módulo{topics.length !== 1 ? 's' : ''} ·{' '}
                {topics.reduce((a, t) => a + t.items.length, 0)} archivo
                {topics.reduce((a, t) => a + t.items.length, 0) !== 1 ? 's' : ''}
                {selectedCourse.last_checked &&
                  ` · Actualizado ${timeAgo(selectedCourse.last_checked)}`}
              </p>
            </div>
            <button
              onClick={() => rescanCourse(selectedCourse.id)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '8px 14px',
                fontSize: 13,
                cursor: 'pointer',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
              }}
            >
              ↻ Actualizar
            </button>
          </div>
          {scanMsg && (
            <p style={{ marginTop: 10, fontSize: 13, color: 'var(--text-muted)' }}>{scanMsg}</p>
          )}
        </div>

        {/* Banner: vincular asignatura si no tiene proyecto */}
        {!selectedCourse.conniku_project_id && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
              background:
                'linear-gradient(135deg, rgba(79,140,255,0.12) 0%, rgba(124,58,237,0.10) 100%)',
              border: '1px solid rgba(79,140,255,0.25)',
              borderRadius: 12,
              padding: '12px 18px',
              marginBottom: 16,
            }}
          >
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                Vincula esta asignatura para desbloquear todas las funciones
              </p>
              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                }}
              >
                Chat inteligente con tu material, Quizzes adaptativos, importar archivos al proyecto
                y mas.
              </p>
            </div>
            <button
              onClick={() => handleAutoLink(selectedCourse.id)}
              disabled={linking}
              style={{
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '9px 20px',
                fontSize: 13,
                fontWeight: 700,
                cursor: linking ? 'not-allowed' : 'pointer',
                opacity: linking ? 0.6 : 1,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {linking ? '⏳ Vinculando…' : '⚡ Vincular ahora'}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 16,
            background: 'var(--bg-secondary)',
            borderRadius: 10,
            padding: 4,
            width: 'fit-content',
          }}
        >
          {(
            [
              { key: 'modulos', label: '📚 Por módulo' },
              { key: 'todo', label: '📋 Todo el material' },
              { key: 'chat', label: '💬 Chat' },
              { key: 'quizzes', label: '🧩 Quizzes' },
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setCourseTab(key);
                if (key === 'chat' && chatMessages.length === 0) setChatMessages([]);
              }}
              style={{
                padding: '7px 18px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: courseTab === key ? 600 : 400,
                background: courseTab === key ? 'var(--bg-card)' : 'transparent',
                color: courseTab === key ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: courseTab === key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {topicsLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: 32,
              color: 'var(--text-muted)',
              fontSize: 14,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                border: '2px solid var(--border)',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 0.9s linear infinite',
              }}
            />
            Cargando material de la asignatura… Esto puede tomar unos segundos dependiendo de la
            cantidad de archivos.
          </div>
        ) : courseTab === 'chat' ? (
          // Vista Chat — consulta sobre el material de la asignatura
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 420,
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: 20 }}>💬</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Chat — {selectedCourse.display_name || selectedCourse.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>
                  {selectedCourse.conniku_project_id
                    ? 'Responde usando el material sincronizado de esta asignatura'
                    : 'Consulta sobre esta asignatura — vincula el curso para respuestas más precisas'}
                </div>
              </div>
            </div>
            {/* Mensajes */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                minHeight: 280,
              }}
            >
              {chatMessages.length === 0 && (
                <div
                  style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px' }}
                >
                  <p style={{ fontSize: 28, marginBottom: 10 }}>💬</p>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: 6,
                    }}
                  >
                    ¿En qué te puedo ayudar?
                  </p>
                  <p style={{ fontSize: 12, lineHeight: 1.6 }}>
                    Pregunta sobre el contenido de la asignatura,
                    <br />
                    pide que te explique un tema, o consulta sobre las tareas.
                  </p>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      justifyContent: 'center',
                      marginTop: 16,
                    }}
                  >
                    {[
                      'Explícame el tema más reciente',
                      'Resume los conceptos clave',
                      '¿Qué entra en el próximo examen?',
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setChatInput(q);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)',
                          fontSize: 11,
                          cursor: 'pointer',
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '10px 14px',
                      borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-secondary)',
                      color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                      fontSize: 13,
                      lineHeight: 1.55,
                      border: m.role === 'assistant' ? '1px solid var(--border-subtle)' : 'none',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '14px 14px 14px 4px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      gap: 4,
                      alignItems: 'center',
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'var(--text-muted)',
                          animation: `bounce 1.2s infinite ${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Input */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-end',
              }}
            >
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendChatMessage();
                  }
                }}
                placeholder="Escribe tu consulta…"
                rows={1}
                style={{
                  flex: 1,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '9px 12px',
                  fontSize: 13,
                  color: 'var(--text-primary)',
                  resize: 'none',
                  outline: 'none',
                  lineHeight: 1.5,
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={sendChatMessage}
                disabled={chatLoading || !chatInput.trim()}
                style={{
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '9px 16px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: chatLoading || !chatInput.trim() ? 'not-allowed' : 'pointer',
                  opacity: chatLoading || !chatInput.trim() ? 0.5 : 1,
                  flexShrink: 0,
                }}
              >
                ↑ Enviar
              </button>
            </div>
          </div>
        ) : courseTab === 'quizzes' ? (
          // ── Vista Quizzes ──────────────────────────────────────
          <div style={{ padding: '4px 0' }}>
            {!selectedCourse.conniku_project_id ? (
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 16,
                  padding: 40,
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: 36, marginBottom: 12 }}>🧩</p>
                <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>
                  Vincula esta asignatura para activar los Quizzes
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    margin: '0 0 16px',
                    lineHeight: 1.6,
                  }}
                >
                  Los quizzes adaptativos y el diagnóstico inicial están disponibles
                  <br />
                  al vincular la asignatura con un proyecto Conniku.
                </p>
                <button
                  onClick={() => onNavigate?.('/proyectos')}
                  style={{
                    background: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '9px 20px',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Ver mis proyectos →
                </button>
              </div>
            ) : (
              <>
                {/* ── DIAGNÓSTICO ACTIVO ── */}
                {diagMode === 'active' && diagQs.length > 0 && (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 16,
                      }}
                    >
                      <span
                        style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}
                      >
                        Diagnóstico · Pregunta {diagIdx + 1} de {diagQs.length}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {Object.keys(diagAns).length}/{diagQs.length} respondidas
                      </span>
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: 'var(--bg-tertiary)',
                        borderRadius: 2,
                        marginBottom: 20,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 2,
                          background: 'var(--accent)',
                          transition: 'width 0.3s',
                          width: `${((diagIdx + 1) / diagQs.length) * 100}%`,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        padding: 24,
                        marginBottom: 20,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: 8,
                        }}
                      >
                        Tema: {diagQs[diagIdx]?.topic}
                      </div>
                      <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 16, lineHeight: 1.5 }}>
                        {diagQs[diagIdx]?.question}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {diagQs[diagIdx]?.options?.map((opt: string, i: number) => {
                          const sel = diagAns[diagIdx] === i;
                          return (
                            <button
                              key={i}
                              onClick={() => setDiagAns((prev) => ({ ...prev, [diagIdx]: i }))}
                              style={{
                                padding: '12px 16px',
                                borderRadius: 8,
                                border: sel ? '2px solid var(--accent)' : '1px solid var(--border)',
                                background: sel ? 'rgba(99,102,241,0.1)' : 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontSize: 14,
                                lineHeight: 1.4,
                                transition: 'all 0.15s',
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 600,
                                  marginRight: 10,
                                  color: sel ? 'var(--accent)' : 'var(--text-muted)',
                                }}
                              >
                                {String.fromCharCode(65 + i)}.
                              </span>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <button
                        disabled={diagIdx === 0}
                        onClick={() => setDiagIdx((i) => i - 1)}
                        style={{
                          padding: '8px 18px',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          cursor: diagIdx === 0 ? 'not-allowed' : 'pointer',
                          opacity: diagIdx === 0 ? 0.5 : 1,
                          fontSize: 13,
                        }}
                      >
                        ← Anterior
                      </button>
                      {diagIdx < diagQs.length - 1 ? (
                        <button
                          onClick={() => setDiagIdx((i) => i + 1)}
                          style={{
                            padding: '8px 18px',
                            borderRadius: 8,
                            border: 'none',
                            background: 'var(--accent)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          Siguiente →
                        </button>
                      ) : (
                        <button
                          disabled={Object.keys(diagAns).length < diagQs.length}
                          style={{
                            padding: '8px 18px',
                            borderRadius: 8,
                            border: 'none',
                            background: 'var(--accent)',
                            color: '#fff',
                            cursor:
                              Object.keys(diagAns).length < diagQs.length
                                ? 'not-allowed'
                                : 'pointer',
                            opacity: Object.keys(diagAns).length < diagQs.length ? 0.5 : 1,
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                          onClick={async () => {
                            const pid = selectedCourse.conniku_project_id!;
                            try {
                              const res = await api.submitDiagnostic(pid, diagAns, diagQs);
                              setDiagRes(res);
                              setDiagMode('done');
                              const [avg, sched] = await Promise.all([
                                api.getSubjectAverage(pid).catch(() => null),
                                api.getScheduledQuizzes(pid).catch(() => []),
                              ]);
                              setQsAvg(avg || null);
                              setQsSched(Array.isArray(sched) ? sched : []);
                            } catch {
                              alert('Error al enviar diagnóstico');
                            }
                          }}
                        >
                          Ver Resultado
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ── QUIZ PROGRAMADO ACTIVO ── */}
                {schedActive?.mode === 'active' && schedActive.questions.length > 0 && (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 16,
                      }}
                    >
                      <span
                        style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}
                      >
                        Quiz {schedActive.num} · Pregunta {schedActive.idx + 1} de{' '}
                        {schedActive.questions.length}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {Object.keys(schedActive.answers).length}/{schedActive.questions.length}{' '}
                        respondidas
                      </span>
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: 'var(--bg-tertiary)',
                        borderRadius: 2,
                        marginBottom: 20,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 2,
                          background: '#8B5CF6',
                          transition: 'width 0.3s',
                          width: `${((schedActive.idx + 1) / schedActive.questions.length) * 100}%`,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        padding: 24,
                        marginBottom: 20,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: 8,
                        }}
                      >
                        Tema: {schedActive.questions[schedActive.idx]?.topic}
                      </div>
                      <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 16, lineHeight: 1.5 }}>
                        {schedActive.questions[schedActive.idx]?.question}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {schedActive.questions[schedActive.idx]?.options?.map(
                          (opt: string, i: number) => {
                            const sel = schedActive.answers[schedActive.idx] === i;
                            return (
                              <button
                                key={i}
                                onClick={() =>
                                  setSchedActive((prev) =>
                                    prev
                                      ? { ...prev, answers: { ...prev.answers, [prev.idx]: i } }
                                      : prev
                                  )
                                }
                                style={{
                                  padding: '12px 16px',
                                  borderRadius: 8,
                                  border: sel ? '2px solid #8B5CF6' : '1px solid var(--border)',
                                  background: sel ? 'rgba(139,92,246,0.1)' : 'var(--bg-secondary)',
                                  color: 'var(--text-primary)',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  fontSize: 14,
                                  lineHeight: 1.4,
                                  transition: 'all 0.15s',
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 600,
                                    marginRight: 10,
                                    color: sel ? '#8B5CF6' : 'var(--text-muted)',
                                  }}
                                >
                                  {String.fromCharCode(65 + i)}.
                                </span>
                                {opt}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <button
                        disabled={schedActive.idx === 0}
                        onClick={() =>
                          setSchedActive((prev) => (prev ? { ...prev, idx: prev.idx - 1 } : prev))
                        }
                        style={{
                          padding: '8px 18px',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          cursor: schedActive.idx === 0 ? 'not-allowed' : 'pointer',
                          opacity: schedActive.idx === 0 ? 0.5 : 1,
                          fontSize: 13,
                        }}
                      >
                        ← Anterior
                      </button>
                      {schedActive.idx < schedActive.questions.length - 1 ? (
                        <button
                          onClick={() =>
                            setSchedActive((prev) => (prev ? { ...prev, idx: prev.idx + 1 } : prev))
                          }
                          style={{
                            padding: '8px 18px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#8B5CF6',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          Siguiente →
                        </button>
                      ) : (
                        <button
                          disabled={
                            Object.keys(schedActive.answers).length < schedActive.questions.length
                          }
                          style={{
                            padding: '8px 18px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#8B5CF6',
                            color: '#fff',
                            cursor:
                              Object.keys(schedActive.answers).length < schedActive.questions.length
                                ? 'not-allowed'
                                : 'pointer',
                            opacity:
                              Object.keys(schedActive.answers).length < schedActive.questions.length
                                ? 0.5
                                : 1,
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                          onClick={async () => {
                            const pid = selectedCourse.conniku_project_id!;
                            try {
                              const res = await api.submitScheduledQuiz(
                                schedActive.quizId,
                                schedActive.answers,
                                schedActive.questions
                              );
                              setSchedActive((prev) =>
                                prev ? { ...prev, result: res, mode: 'done' } : prev
                              );
                              const [avg, sched] = await Promise.all([
                                api.getSubjectAverage(pid).catch(() => null),
                                api.getScheduledQuizzes(pid).catch(() => []),
                              ]);
                              setQsAvg(avg || null);
                              setQsSched(Array.isArray(sched) ? sched : []);
                            } catch {
                              alert('Error al enviar quiz');
                            }
                          }}
                        >
                          Ver Resultado
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ── RESULTADO QUIZ PROGRAMADO ── */}
                {schedActive?.mode === 'done' && schedActive.result && (
                  <div
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: 24,
                      marginBottom: 20,
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 48, marginBottom: 12 }}>
                      {schedActive.result.score >= 7
                        ? '🎉'
                        : schedActive.result.score >= 5
                          ? '📚'
                          : '💪'}
                    </div>
                    <h2 style={{ margin: '0 0 4px' }}>Quiz {schedActive.num} completado</h2>
                    <div
                      style={{
                        fontSize: 42,
                        fontWeight: 800,
                        color:
                          schedActive.result.score >= 7
                            ? 'var(--accent-green)'
                            : schedActive.result.score >= 5
                              ? 'var(--accent-orange)'
                              : 'var(--accent-red)',
                        margin: '8px 0',
                      }}
                    >
                      {schedActive.result.score}
                      <span style={{ fontSize: 22 }}>/10</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px' }}>
                      {schedActive.result.correct}/{schedActive.result.total} respuestas correctas
                    </p>
                    {schedActive.result.topicsScores &&
                      Object.keys(schedActive.result.topicsScores).length > 0 && (
                        <div style={{ textAlign: 'left', marginBottom: 16 }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginBottom: 8,
                            }}
                          >
                            Puntaje por tema
                          </div>
                          {Object.entries(schedActive.result.topicsScores).map(([t, s]: any) => (
                            <div
                              key={t}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 6,
                                fontSize: 13,
                              }}
                            >
                              <span
                                style={{
                                  flex: 1,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {t}
                              </span>
                              <div
                                style={{
                                  width: 80,
                                  height: 4,
                                  background: 'var(--bg-tertiary)',
                                  borderRadius: 2,
                                  flexShrink: 0,
                                  overflow: 'hidden',
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${(s / 10) * 100}%`,
                                    background:
                                      s >= 7
                                        ? 'var(--accent-green)'
                                        : s >= 5
                                          ? 'var(--accent-orange)'
                                          : 'var(--accent-red)',
                                    borderRadius: 2,
                                  }}
                                />
                              </div>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color:
                                    s >= 7
                                      ? 'var(--accent-green)'
                                      : s >= 5
                                        ? 'var(--accent-orange)'
                                        : 'var(--accent-red)',
                                  width: 28,
                                  textAlign: 'right',
                                }}
                              >
                                {s}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    <button
                      onClick={() => setSchedActive(null)}
                      style={{
                        padding: '8px 20px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-secondary)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: 13,
                      }}
                    >
                      ← Volver
                    </button>
                  </div>
                )}

                {/* ── SETUP: sin quiz activo ── */}
                {quizQuestions.length === 0 &&
                  !isGeneratingQuiz &&
                  diagMode !== 'active' &&
                  schedActive?.mode !== 'active' &&
                  schedActive?.mode !== 'done' && (
                    <div>
                      {/* Barra de promedio */}
                      {qsAvg && qsAvg.quizCount > 0 && (
                        <div
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 16,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                          }}
                        >
                          <div
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: 12,
                              flexShrink: 0,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background:
                                qsAvg.average >= 7
                                  ? 'rgba(16,185,129,0.12)'
                                  : qsAvg.average >= 5
                                    ? 'rgba(245,158,11,0.12)'
                                    : 'rgba(239,68,68,0.12)',
                            }}
                          >
                            <span
                              style={{
                                fontSize: 22,
                                fontWeight: 800,
                                lineHeight: 1,
                                color:
                                  qsAvg.average >= 7
                                    ? 'var(--accent-green)'
                                    : qsAvg.average >= 5
                                      ? 'var(--accent-orange)'
                                      : 'var(--accent-red)',
                              }}
                            >
                              {qsAvg.average}
                            </span>
                            <span
                              style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}
                            >
                              / 10
                            </span>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
                              Nota promedio de la asignatura
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {qsAvg.quizCount} quiz{qsAvg.quizCount !== 1 ? 'zes' : ''} completado
                              {qsAvg.quizCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                          {qsAvg.topicsAverage && Object.keys(qsAvg.topicsAverage).length > 0 && (
                            <div
                              style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 180 }}
                            >
                              {Object.entries(qsAvg.topicsAverage)
                                .slice(0, 4)
                                .map(([t, s]: any) => (
                                  <span
                                    key={t}
                                    style={{
                                      fontSize: 10,
                                      padding: '2px 7px',
                                      borderRadius: 20,
                                      fontWeight: 600,
                                      background:
                                        s >= 7
                                          ? 'rgba(16,185,129,0.15)'
                                          : s >= 5
                                            ? 'rgba(245,158,11,0.15)'
                                            : 'rgba(239,68,68,0.15)',
                                      color:
                                        s >= 7
                                          ? 'var(--accent-green)'
                                          : s >= 5
                                            ? 'var(--accent-orange)'
                                            : 'var(--accent-red)',
                                    }}
                                  >
                                    {t.length > 14 ? t.slice(0, 14) + '…' : t} {s}
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Diagnóstico */}
                      {diagMode === 'idle' && (
                        <div
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderLeft: '4px solid var(--accent)',
                            borderRadius: 12,
                            padding: 20,
                            marginBottom: 16,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                          }}
                        >
                          <div style={{ fontSize: 32, flexShrink: 0 }}>🔬</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, marginBottom: 4 }}>
                              Prueba Diagnóstica
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                              15 preguntas para evaluar tu nivel inicial en{' '}
                              {selectedCourse.display_name || selectedCourse.name}.
                            </div>
                          </div>
                          <button
                            style={{
                              padding: '7px 16px',
                              borderRadius: 8,
                              border: 'none',
                              background: 'var(--accent)',
                              color: '#fff',
                              cursor: 'pointer',
                              fontSize: 13,
                              fontWeight: 600,
                              flexShrink: 0,
                            }}
                            onClick={async () => {
                              setDiagMode('loading');
                              const pid = selectedCourse.conniku_project_id!;
                              try {
                                const res = await api.generateDiagnostic(
                                  pid,
                                  selectedCourse.display_name || selectedCourse.name,
                                  16
                                );
                                setDiagQs(res.questions || []);
                                setDiagIdx(0);
                                setDiagAns({});
                                setDiagMode('active');
                                if (res.scheduledQuizzes?.length && qsSched.length === 0)
                                  setQsSched(res.scheduledQuizzes);
                              } catch {
                                alert('Error al generar diagnóstico');
                                setDiagMode('idle');
                              }
                            }}
                          >
                            Iniciar
                          </button>
                        </div>
                      )}
                      {diagMode === 'loading' && (
                        <div
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderLeft: '4px solid var(--accent)',
                            borderRadius: 12,
                            padding: 20,
                            marginBottom: 16,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                          }}
                        >
                          <div style={{ fontSize: 32, flexShrink: 0 }}>🔬</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, marginBottom: 4 }}>
                              Generando diagnóstico...
                            </div>
                            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                              Creando preguntas para{' '}
                              {selectedCourse.display_name || selectedCourse.name}
                            </div>
                          </div>
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              border: '2px solid var(--border)',
                              borderTopColor: 'var(--accent)',
                              borderRadius: '50%',
                              animation: 'spin 0.8s linear infinite',
                              flexShrink: 0,
                            }}
                          />
                        </div>
                      )}
                      {diagMode === 'done' && diagRes && (
                        <div
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderLeft: `4px solid ${diagRes.score >= 7 ? 'var(--accent-green)' : diagRes.score >= 5 ? 'var(--accent-orange)' : 'var(--accent-red)'}`,
                            borderRadius: 12,
                            padding: 20,
                            marginBottom: 16,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              marginBottom: 12,
                            }}
                          >
                            <div style={{ fontSize: 32 }}>🔬</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 700 }}>Diagnóstico completado</div>
                              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                                Nivel inicial evaluado
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div
                                style={{
                                  fontSize: 28,
                                  fontWeight: 800,
                                  color:
                                    diagRes.score >= 7
                                      ? 'var(--accent-green)'
                                      : diagRes.score >= 5
                                        ? 'var(--accent-orange)'
                                        : 'var(--accent-red)',
                                  lineHeight: 1,
                                }}
                              >
                                {diagRes.score}
                                <span style={{ fontSize: 14 }}>/10</span>
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                {diagRes.correct}/{diagRes.total} correctas
                              </div>
                            </div>
                          </div>
                          {(diagRes.weakTopics?.length > 0 || diagRes.strongTopics?.length > 0) && (
                            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                              {diagRes.weakTopics?.slice(0, 3).map((t: string) => (
                                <span
                                  key={t}
                                  style={{
                                    fontSize: 11,
                                    padding: '2px 8px',
                                    borderRadius: 20,
                                    background: 'rgba(239,68,68,0.12)',
                                    color: 'var(--accent-red)',
                                    fontWeight: 600,
                                  }}
                                >
                                  ⚠ {t}
                                </span>
                              ))}
                              {diagRes.strongTopics?.slice(0, 3).map((t: string) => (
                                <span
                                  key={t}
                                  style={{
                                    fontSize: 11,
                                    padding: '2px 8px',
                                    borderRadius: 20,
                                    background: 'rgba(16,185,129,0.12)',
                                    color: 'var(--accent-green)',
                                    fontWeight: 600,
                                  }}
                                >
                                  ✓ {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Quizzes Programados */}
                      {qsSched.length > 0 && (
                        <div style={{ marginBottom: 16 }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginBottom: 10,
                            }}
                          >
                            Quizzes Programados del Semestre
                          </div>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                              gap: 10,
                            }}
                          >
                            {qsSched.map((sq: any) => {
                              const st = sq.status || 'pending';
                              const color =
                                st === 'completed'
                                  ? 'var(--accent-green)'
                                  : st === 'available'
                                    ? '#8B5CF6'
                                    : st === 'overdue'
                                      ? 'var(--accent-red)'
                                      : 'var(--text-muted)';
                              const bg =
                                st === 'completed'
                                  ? 'rgba(16,185,129,0.08)'
                                  : st === 'available'
                                    ? 'rgba(139,92,246,0.08)'
                                    : st === 'overdue'
                                      ? 'rgba(239,68,68,0.08)'
                                      : 'var(--bg-secondary)';
                              const label =
                                st === 'completed'
                                  ? '✓ Completado'
                                  : st === 'available'
                                    ? '📝 Disponible'
                                    : st === 'overdue'
                                      ? '⏰ Vencido'
                                      : '🔒 Pendiente';
                              const dateStr = sq.scheduledDate
                                ? new Date(sq.scheduledDate).toLocaleDateString('es-CL', {
                                    day: 'numeric',
                                    month: 'short',
                                  })
                                : '';
                              return (
                                <div
                                  key={sq.id || sq.quizNumber}
                                  style={{
                                    background: bg,
                                    border: `1px solid ${color}30`,
                                    borderRadius: 12,
                                    padding: 16,
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'flex-start',
                                      marginBottom: 8,
                                    }}
                                  >
                                    <div style={{ fontSize: 20, fontWeight: 800, color }}>
                                      Q{sq.quizNumber}
                                    </div>
                                    <span
                                      style={{
                                        fontSize: 10,
                                        fontWeight: 700,
                                        padding: '2px 7px',
                                        borderRadius: 20,
                                        background: `${color}20`,
                                        color,
                                      }}
                                    >
                                      {label}
                                    </span>
                                  </div>
                                  {dateStr && (
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: 'var(--text-muted)',
                                        marginBottom: 8,
                                      }}
                                    >
                                      {dateStr}
                                    </div>
                                  )}
                                  {sq.score != null && (
                                    <div
                                      style={{
                                        fontSize: 16,
                                        fontWeight: 700,
                                        color,
                                        marginBottom: 8,
                                      }}
                                    >
                                      {sq.score}/10
                                    </div>
                                  )}
                                  {(st === 'available' || st === 'overdue') && (
                                    <button
                                      style={{
                                        width: '100%',
                                        padding: '7px 0',
                                        borderRadius: 8,
                                        border: 'none',
                                        background: '#8B5CF6',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontSize: 12,
                                        fontWeight: 600,
                                      }}
                                      onClick={async () => {
                                        setSchedActive({
                                          quizId: sq.id,
                                          num: sq.quizNumber,
                                          questions: [],
                                          answers: {},
                                          idx: 0,
                                          mode: 'loading',
                                          result: null,
                                        });
                                        try {
                                          const res = await api.generateScheduledQuiz(sq.id);
                                          setSchedActive({
                                            quizId: sq.id,
                                            num: sq.quizNumber,
                                            questions: res.questions || [],
                                            answers: {},
                                            idx: 0,
                                            mode: 'active',
                                            result: null,
                                          });
                                        } catch {
                                          alert('Error al generar quiz');
                                          setSchedActive(null);
                                        }
                                      }}
                                    >
                                      Iniciar Quiz {sq.quizNumber}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Separador Quiz Libre */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          margin: '20px 0 16px',
                        }}
                      >
                        <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Quiz Libre
                        </span>
                        <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                      </div>

                      {/* Config quiz libre */}
                      <div
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          padding: 24,
                          marginBottom: 20,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 20,
                          }}
                        >
                          <span style={{ fontSize: 28 }}>🧠</span>
                          <div>
                            <h3 style={{ margin: 0, fontSize: 16 }}>
                              Quiz de {selectedCourse.display_name || selectedCourse.name}
                            </h3>
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                              {topics.length} módulo{topics.length !== 1 ? 's' : ''} · genera
                              preguntas del material de la asignatura
                            </p>
                          </div>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                          <label
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              display: 'block',
                              marginBottom: 8,
                            }}
                          >
                            Dificultad
                          </label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {(
                              [
                                {
                                  val: 'easy',
                                  label: 'Fácil',
                                  color: 'var(--accent-green)',
                                  emoji: '🟢',
                                },
                                {
                                  val: 'medium',
                                  label: 'Media',
                                  color: 'var(--accent-orange)',
                                  emoji: '🟡',
                                },
                                {
                                  val: 'hard',
                                  label: 'Difícil',
                                  color: 'var(--accent-red)',
                                  emoji: '🔴',
                                },
                              ] as const
                            ).map((d) => (
                              <button
                                key={d.val}
                                onClick={() => setQuizDifficulty(d.val)}
                                style={{
                                  flex: 1,
                                  padding: '10px 8px',
                                  borderRadius: 10,
                                  fontSize: 13,
                                  fontWeight: quizDifficulty === d.val ? 700 : 500,
                                  border:
                                    quizDifficulty === d.val
                                      ? `2px solid ${d.color}`
                                      : '1px solid var(--border)',
                                  background:
                                    quizDifficulty === d.val
                                      ? d.color + '18'
                                      : 'var(--bg-secondary)',
                                  color:
                                    quizDifficulty === d.val ? d.color : 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                }}
                              >
                                {d.emoji} {d.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={{ marginBottom: 20 }}>
                          <label
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              display: 'block',
                              marginBottom: 8,
                            }}
                          >
                            Número de preguntas
                          </label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {([5, 10, 15] as const).map((n) => (
                              <button
                                key={n}
                                onClick={() => setQuizNumQuestions(n)}
                                style={{
                                  flex: 1,
                                  padding: '10px 8px',
                                  borderRadius: 10,
                                  fontSize: 15,
                                  fontWeight: quizNumQuestions === n ? 700 : 500,
                                  border:
                                    quizNumQuestions === n
                                      ? '2px solid var(--accent)'
                                      : '1px solid var(--border)',
                                  background:
                                    quizNumQuestions === n
                                      ? 'rgba(99,102,241,0.1)'
                                      : 'var(--bg-secondary)',
                                  color:
                                    quizNumQuestions === n
                                      ? 'var(--accent)'
                                      : 'var(--text-secondary)',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s',
                                }}
                              >
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button
                          style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: 15,
                            border: 'none',
                            borderRadius: 10,
                            background: 'var(--accent)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: 700,
                          }}
                          onClick={async () => {
                            const pid = selectedCourse.conniku_project_id!;
                            setIsGeneratingQuiz(true);
                            try {
                              const data = await api.generateQuiz(
                                pid,
                                quizNumQuestions,
                                quizDifficulty
                              );
                              setQuizQuestions(data?.questions || []);
                              setQuizCurrentIndex(0);
                              setQuizAnswers({});
                              setQuizSubmitted(false);
                              setQuizScore(0);
                            } catch (e) {
                              console.error('Error generating quiz:', e);
                            } finally {
                              setIsGeneratingQuiz(false);
                            }
                          }}
                        >
                          ✨ Generar Quiz · {quizNumQuestions} preguntas
                        </button>
                      </div>

                      {/* Historial */}
                      {quizHistory.length > 0 && (
                        <div>
                          <h4
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              margin: '0 0 10px',
                            }}
                          >
                            Historial
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {quizHistory.map((h: any, i: number) => {
                              const pct = Math.round((h.score / h.total) * 100);
                              const color =
                                pct >= 70
                                  ? 'var(--accent-green)'
                                  : pct >= 40
                                    ? 'var(--accent-orange)'
                                    : 'var(--accent-red)';
                              return (
                                <div
                                  key={i}
                                  style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 10,
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 44,
                                      height: 44,
                                      borderRadius: 10,
                                      flexShrink: 0,
                                      background: color + '18',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexDirection: 'column',
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 14,
                                        fontWeight: 800,
                                        color,
                                        lineHeight: 1,
                                      }}
                                    >
                                      {pct}%
                                    </span>
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                                      {h.score}/{h.total} correctas
                                      {h.difficulty && (
                                        <span
                                          style={{
                                            marginLeft: 8,
                                            fontSize: 11,
                                            color: 'var(--text-muted)',
                                            fontWeight: 400,
                                          }}
                                        >
                                          ·{' '}
                                          {h.difficulty === 'easy'
                                            ? 'Fácil'
                                            : h.difficulty === 'medium'
                                              ? 'Media'
                                              : 'Difícil'}
                                        </span>
                                      )}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: 'var(--text-muted)',
                                        marginTop: 2,
                                      }}
                                    >
                                      {h.completedAt
                                        ? new Date(h.completedAt).toLocaleDateString('es-CL', {
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })
                                        : ''}
                                    </div>
                                  </div>
                                  <div
                                    style={{
                                      height: 4,
                                      width: 60,
                                      background: 'var(--bg-tertiary)',
                                      borderRadius: 2,
                                      flexShrink: 0,
                                      overflow: 'hidden',
                                    }}
                                  >
                                    <div
                                      style={{
                                        height: '100%',
                                        width: `${pct}%`,
                                        background: color,
                                        borderRadius: 2,
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                {/* ── GENERANDO QUIZ ── */}
                {isGeneratingQuiz && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '60px 20px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 16 }}>🧠</div>
                    <h3 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>
                      Generando quiz...
                    </h3>
                    <p style={{ fontSize: 13, margin: 0 }}>
                      Analizando el material de {selectedCourse.display_name || selectedCourse.name}
                    </p>
                  </div>
                )}

                {/* ── PREGUNTAS QUIZ LIBRE ── */}
                {quizQuestions.length > 0 && !quizSubmitted && !isGeneratingQuiz && (
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 16,
                      }}
                    >
                      <span
                        style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}
                      >
                        Pregunta {quizCurrentIndex + 1} de {quizQuestions.length}
                      </span>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background:
                              quizDifficulty === 'easy'
                                ? 'rgba(5,150,105,0.12)'
                                : quizDifficulty === 'medium'
                                  ? 'rgba(217,119,6,0.12)'
                                  : 'rgba(220,38,38,0.12)',
                            color:
                              quizDifficulty === 'easy'
                                ? 'var(--accent-green)'
                                : quizDifficulty === 'medium'
                                  ? 'var(--accent-orange)'
                                  : 'var(--accent-red)',
                          }}
                        >
                          {quizDifficulty === 'easy'
                            ? 'Fácil'
                            : quizDifficulty === 'medium'
                              ? 'Media'
                              : 'Difícil'}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {Object.keys(quizAnswers).length}/{quizQuestions.length} respondidas
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        height: 4,
                        background: 'var(--bg-tertiary)',
                        borderRadius: 2,
                        marginBottom: 20,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          borderRadius: 2,
                          background: 'var(--accent)',
                          transition: 'width 0.3s',
                          width: `${((quizCurrentIndex + 1) / quizQuestions.length) * 100}%`,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        padding: 24,
                        marginBottom: 20,
                      }}
                    >
                      <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 16, lineHeight: 1.5 }}>
                        {quizQuestions[quizCurrentIndex].question}
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {quizQuestions[quizCurrentIndex].options.map(
                          (option: string, idx: number) => {
                            const isSelected = quizAnswers[quizCurrentIndex] === idx;
                            return (
                              <button
                                key={idx}
                                onClick={() =>
                                  setQuizAnswers((prev) => ({ ...prev, [quizCurrentIndex]: idx }))
                                }
                                style={{
                                  padding: '12px 16px',
                                  borderRadius: 8,
                                  border: isSelected
                                    ? '2px solid var(--accent)'
                                    : '1px solid var(--border)',
                                  background: isSelected
                                    ? 'rgba(99,102,241,0.1)'
                                    : 'var(--bg-secondary)',
                                  color: 'var(--text-primary)',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  fontSize: 14,
                                  lineHeight: 1.4,
                                  transition: 'all 0.15s',
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 600,
                                    marginRight: 10,
                                    color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                                  }}
                                >
                                  {String.fromCharCode(65 + idx)}.
                                </span>
                                {option}
                              </button>
                            );
                          }
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <button
                        disabled={quizCurrentIndex === 0}
                        onClick={() => setQuizCurrentIndex((i) => i - 1)}
                        style={{
                          padding: '8px 18px',
                          borderRadius: 8,
                          border: '1px solid var(--border)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          cursor: quizCurrentIndex === 0 ? 'not-allowed' : 'pointer',
                          opacity: quizCurrentIndex === 0 ? 0.5 : 1,
                          fontSize: 13,
                        }}
                      >
                        ← Anterior
                      </button>
                      {quizCurrentIndex < quizQuestions.length - 1 ? (
                        <button
                          onClick={() => setQuizCurrentIndex((i) => i + 1)}
                          style={{
                            padding: '8px 18px',
                            borderRadius: 8,
                            border: 'none',
                            background: 'var(--accent)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          Siguiente →
                        </button>
                      ) : (
                        <button
                          disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                          style={{
                            padding: '8px 18px',
                            borderRadius: 8,
                            border: 'none',
                            background: 'var(--accent)',
                            color: '#fff',
                            cursor:
                              Object.keys(quizAnswers).length < quizQuestions.length
                                ? 'not-allowed'
                                : 'pointer',
                            opacity:
                              Object.keys(quizAnswers).length < quizQuestions.length ? 0.5 : 1,
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                          onClick={() => {
                            let correct = 0;
                            quizQuestions.forEach((q: any, i: number) => {
                              if (quizAnswers[i] === q.correctAnswer) correct++;
                            });
                            setQuizScore(correct);
                            setQuizSubmitted(true);
                            setQuizResult({ score: correct, total: quizQuestions.length });
                            try {
                              const pid = selectedCourse.conniku_project_id!;
                              const entry = {
                                projectId: pid,
                                projectName: selectedCourse.display_name || selectedCourse.name,
                                score: correct,
                                total: quizQuestions.length,
                                difficulty: quizDifficulty,
                                completedAt: new Date().toISOString(),
                              };
                              const prev = JSON.parse(
                                localStorage.getItem('conniku_quiz_history') || '[]'
                              );
                              const updated = [entry, ...prev].slice(0, 50);
                              localStorage.setItem('conniku_quiz_history', JSON.stringify(updated));
                              setQuizHistory(
                                updated.filter((h: any) => h.projectId === pid).slice(0, 8)
                              );
                            } catch {}
                          }}
                        >
                          Ver Resultados
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ── RESULTADOS QUIZ LIBRE ── */}
                {quizSubmitted && quizQuestions.length > 0 && (
                  <div>
                    <div
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        padding: 24,
                        marginBottom: 20,
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 48, marginBottom: 8 }}>
                        {quizScore / quizQuestions.length >= 0.7
                          ? '🎉'
                          : quizScore / quizQuestions.length >= 0.4
                            ? '📚'
                            : '💪'}
                      </div>
                      <h2 style={{ margin: '0 0 8px' }}>
                        {quizScore} / {quizQuestions.length} correctas
                      </h2>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 800,
                          color:
                            quizScore / quizQuestions.length >= 0.7
                              ? 'var(--accent-green)'
                              : quizScore / quizQuestions.length >= 0.4
                                ? 'var(--accent-orange)'
                                : 'var(--accent-red)',
                          marginBottom: 8,
                        }}
                      >
                        {Math.round((quizScore / quizQuestions.length) * 100)}%
                      </div>
                      <p style={{ color: 'var(--text-secondary)', margin: '0 0 20px' }}>
                        {quizScore / quizQuestions.length >= 0.7
                          ? '¡Excelente trabajo! Dominas bien el material.'
                          : quizScore / quizQuestions.length >= 0.4
                            ? 'Buen intento. Repasa los temas donde fallaste.'
                            : 'Necesitas repasar más. ¡No te rindas!'}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          gap: 12,
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          onClick={() => {
                            setQuizCurrentIndex(0);
                            setQuizAnswers({});
                            setQuizSubmitted(false);
                            setQuizScore(0);
                            setQuizResult(null);
                          }}
                          style={{
                            padding: '8px 18px',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: 13,
                          }}
                        >
                          ↺ Reintentar
                        </button>
                        <button
                          onClick={() => {
                            setQuizQuestions([]);
                            setQuizCurrentIndex(0);
                            setQuizAnswers({});
                            setQuizSubmitted(false);
                            setQuizScore(0);
                            setQuizResult(null);
                          }}
                          style={{
                            padding: '8px 18px',
                            borderRadius: 8,
                            border: '1px solid var(--border)',
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: 13,
                          }}
                        >
                          Cambiar config
                        </button>
                        <button
                          style={{
                            padding: '8px 18px',
                            borderRadius: 8,
                            border: 'none',
                            background: 'var(--accent)',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                          onClick={async () => {
                            setQuizQuestions([]);
                            setQuizCurrentIndex(0);
                            setQuizAnswers({});
                            setQuizSubmitted(false);
                            setQuizScore(0);
                            setQuizResult(null);
                            const pid = selectedCourse.conniku_project_id!;
                            setIsGeneratingQuiz(true);
                            try {
                              const data = await api.generateQuiz(
                                pid,
                                quizNumQuestions,
                                quizDifficulty
                              );
                              setQuizQuestions(data?.questions || []);
                            } catch (e) {
                              console.error(e);
                            } finally {
                              setIsGeneratingQuiz(false);
                            }
                          }}
                        >
                          ✨ Nuevo Quiz
                        </button>
                      </div>
                    </div>
                    <h3 style={{ marginBottom: 12, fontSize: 14, fontWeight: 700 }}>
                      Detalle de Respuestas
                    </h3>
                    {quizQuestions.map((q: any, i: number) => {
                      const userAnswer = quizAnswers[i];
                      const isCorrect = userAnswer === q.correctAnswer;
                      return (
                        <div
                          key={i}
                          style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderLeft: `4px solid ${isCorrect ? '#22c55e' : '#ef4444'}`,
                            borderRadius: 10,
                            padding: 20,
                            marginBottom: 12,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              marginBottom: 12,
                            }}
                          >
                            <h4 style={{ margin: 0, fontSize: 14, lineHeight: 1.5, flex: 1 }}>
                              {i + 1}. {q.question}
                            </h4>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: 6,
                                marginLeft: 12,
                                whiteSpace: 'nowrap',
                                background: isCorrect
                                  ? 'rgba(34,197,94,0.15)'
                                  : 'rgba(239,68,68,0.15)',
                                color: isCorrect ? '#22c55e' : '#ef4444',
                              }}
                            >
                              {isCorrect ? '✓ Correcta' : '✗ Incorrecta'}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, marginBottom: 8 }}>
                            <span style={{ color: 'var(--text-muted)' }}>Tu respuesta: </span>
                            <span
                              style={{ color: isCorrect ? '#22c55e' : '#ef4444', fontWeight: 500 }}
                            >
                              {String.fromCharCode(65 + userAnswer)}. {q.options[userAnswer]}
                            </span>
                          </div>
                          {!isCorrect && (
                            <div style={{ fontSize: 13, marginBottom: 8 }}>
                              <span style={{ color: 'var(--text-muted)' }}>
                                Respuesta correcta:{' '}
                              </span>
                              <span style={{ color: '#22c55e', fontWeight: 500 }}>
                                {String.fromCharCode(65 + q.correctAnswer)}.{' '}
                                {q.options[q.correctAnswer]}
                              </span>
                            </div>
                          )}
                          {q.explanation && (
                            <div
                              style={{
                                fontSize: 13,
                                color: 'var(--text-secondary)',
                                background: 'var(--bg-secondary)',
                                padding: '10px 12px',
                                borderRadius: 8,
                                marginTop: 8,
                                lineHeight: 1.5,
                              }}
                            >
                              💡 {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        ) : topics.length === 0 ? (
          <div
            style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}
          >
            <p style={{ fontSize: 32, marginBottom: 8 }}>📭</p>
            <p>No se encontró material en esta asignatura aún.</p>
            <button
              onClick={() => rescanCourse(selectedCourse.id)}
              style={{
                marginTop: 12,
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 18px',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Buscar material ahora
            </button>
          </div>
        ) : courseTab === 'modulos' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {topics.map((topic) => (
              <TopicAccordion
                key={topic.name}
                topic={topic}
                open={openTopics.has(topic.name)}
                onImport={handleImportItem}
                importingId={importingItemId}
                onToggle={() =>
                  setOpenTopics((prev) => {
                    const next = new Set(prev);
                    if (next.has(topic.name)) next.delete(topic.name);
                    else next.add(topic.name);
                    return next;
                  })
                }
              />
            ))}
          </div>
        ) : (
          // Vista "todo el material" — lista plana
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              overflow: 'hidden',
            }}
          >
            {topics
              .flatMap((t) => t.items)
              .map((item, idx) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  borderTop={idx > 0}
                  onImport={handleImportItem}
                  importing={importingItemId === item.id}
                />
              ))}
          </div>
        )}
      </div>
    );
  }

  // ── Hub principal ───────────────────────────────────────────
  const { connection, current_courses, past_courses, new_items_by_course, total_new } = hub!;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 0 60px' }}>
      {/* ── Barra de plataforma conectada — SIEMPRE ARRIBA ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, rgba(10,30,70,0.7) 0%, rgba(26,86,219,0.5) 100%)',
          border: '1px solid rgba(59,130,246,0.25)',
          borderRadius: 12,
          padding: '10px 16px',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#10b981',
              flexShrink: 0,
              boxShadow: '0 0 6px #10b981',
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
            {connection?.platform_name}
          </span>
          {connection?.last_scan && (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              · {timeAgo(connection.last_scan)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={handleScan}
            disabled={scanning}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              padding: '5px 13px',
              fontSize: 12,
              cursor: scanning ? 'not-allowed' : 'pointer',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            {scanning ? '⏳' : '↻'} Sincronizar
          </button>
          <button
            onClick={() => setShowConfig(true)}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              padding: '5px 13px',
              fontSize: 12,
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            ⚙ Cambiar plataforma
          </button>
        </div>
      </div>

      {/* Título del módulo */}
      <h1
        style={{
          margin: '0 0 20px',
          fontSize: 22,
          fontWeight: 700,
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        🎓 Mi Universidad
      </h1>

      {(scanMsg || bulkImportMsg) && (
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '10px 16px',
            marginBottom: 16,
            fontSize: 13,
            color: 'var(--text-muted)',
          }}
        >
          {scanMsg || bulkImportMsg}
        </div>
      )}

      {/* ── Layout 2 columnas: contenido principal + sidebar calendario ── */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 284px', gap: 20, alignItems: 'start' }}
      >
        <div>
          {/* ── COLUMNA PRINCIPAL ── */}

          {/* ── Semestre actual: Asignaturas ──────────────────────── */}
          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                📅 Semestre actual — en curso
                {current_courses.length > 0 && (
                  <span
                    style={{
                      background: 'var(--accent)',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 8px',
                      borderRadius: 99,
                    }}
                  >
                    {current_courses.length}
                  </span>
                )}
              </div>
              <button
                onClick={openAddModal}
                style={{
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 9,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                + Agregar
              </button>
            </div>

            {current_courses.length === 0 ? (
              <div
                style={{
                  background: 'var(--bg-card)',
                  border: '2px dashed var(--border)',
                  borderRadius: 14,
                  padding: '36px 24px',
                  textAlign: 'center',
                }}
              >
                <p style={{ fontSize: 28, margin: '0 0 8px' }}>🎓</p>
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    margin: '0 0 6px',
                  }}
                >
                  Aquí van tus asignaturas
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>
                  Agrega las asignaturas del semestre actual para ver su material organizado.
                </p>
                <button
                  onClick={openAddModal}
                  style={{
                    background: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 22px',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  + Agregar asignaturas
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                  gap: 12,
                }}
              >
                {current_courses.map((c) => (
                  <CourseCard
                    key={c.id}
                    course={c}
                    onClick={() => openCourse(c)}
                    renamingId={renamingId}
                    renameValue={renameValue}
                    onStartRename={(id, current) => {
                      setRenamingId(id);
                      setRenameValue(current);
                    }}
                    onRenameChange={setRenameValue}
                    onRenameSubmit={handleRename}
                    onRenameCancel={() => setRenamingId(null)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Semestres anteriores (colapsable) ─────────────────── */}
          {past_courses.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <button
                onClick={() => setPastOpen((p) => !p)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px 0',
                  marginBottom: pastOpen ? 12 : 0,
                  width: '100%',
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                  }}
                >
                  🗂 Semestres anteriores ({past_courses.length})
                </span>
                <span
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 11,
                    marginLeft: 4,
                    transform: pastOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s',
                    display: 'inline-block',
                  }}
                >
                  ▼
                </span>
                <div
                  style={{ flex: 1, height: 1, background: 'var(--border-subtle)', marginLeft: 8 }}
                />
              </button>
              {pastOpen && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 10,
                  }}
                >
                  {past_courses.map((c) => (
                    <CourseCard
                      key={c.id}
                      course={c}
                      onClick={() => openCourse(c)}
                      muted
                      renamingId={renamingId}
                      renameValue={renameValue}
                      onStartRename={(id, current) => {
                        setRenamingId(id);
                        setRenameValue(current);
                      }}
                      onRenameChange={setRenameValue}
                      onRenameSubmit={handleRename}
                      onRenameCancel={() => setRenamingId(null)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Material nuevo detectado (agrupado por asignatura) ── */}
          {total_new > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  📥 Material nuevo detectado
                  <span
                    style={{
                      background: 'var(--accent)',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 8px',
                      borderRadius: 99,
                    }}
                  >
                    {total_new} archivo{total_new !== 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={markNewSeen}
                  style={{
                    background: 'none',
                    border: '1px solid var(--border)',
                    borderRadius: 7,
                    padding: '4px 12px',
                    fontSize: 11,
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                >
                  ✓ Marcar todo visto
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(new_items_by_course).map(([courseId, group]) => {
                  const linkedCourse = [...current_courses, ...past_courses].find(
                    (c) => c.id === courseId
                  );
                  const isLinked = !!linkedCourse?.conniku_project_id;
                  const isOpen = openNovedades.has(courseId);
                  const displayLabel =
                    linkedCourse?.display_name || linkedCourse?.name || group.course_name;
                  return (
                    <div
                      key={courseId}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 13,
                        overflow: 'hidden',
                      }}
                    >
                      {/* Header del grupo */}
                      <button
                        onClick={() =>
                          setOpenNovedades((prev) => {
                            const s = new Set(prev);
                            s.has(courseId) ? s.delete(courseId) : s.add(courseId);
                            return s;
                          })
                        }
                        style={{
                          width: '100%',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '13px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <span style={{ fontSize: 16 }}>📘</span>
                          <span
                            style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}
                          >
                            {displayLabel}
                          </span>
                          <span
                            style={{
                              background: 'var(--accent)',
                              color: '#fff',
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 99,
                            }}
                          >
                            {group.items.length} nuevo{group.items.length !== 1 ? 's' : ''}
                          </span>
                          {group.items[0]?.detected_at && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                              {new Date(group.items[0].detected_at).toLocaleDateString('es-CL', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          )}
                        </div>
                        <span
                          style={{
                            color: 'var(--text-muted)',
                            fontSize: 11,
                            transform: isOpen ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s',
                            display: 'inline-block',
                          }}
                        >
                          ▼
                        </span>
                      </button>

                      {/* Cuerpo del grupo */}
                      {isOpen && (
                        <div style={{ padding: '0 16px 14px' }}>
                          {/* Preview de archivos (máx 4) */}
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4,
                              marginBottom: 12,
                            }}
                          >
                            {group.items.slice(0, 4).map((item) => (
                              <div
                                key={item.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 9,
                                  padding: '6px 10px',
                                  borderRadius: 8,
                                  background: 'var(--bg-secondary)',
                                }}
                              >
                                <span style={{ fontSize: 14, flexShrink: 0 }}>
                                  {TYPE_ICON[item.item_type] || '📄'}
                                </span>
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: 'var(--text-primary)',
                                    flex: 1,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {item.item_name}
                                </span>
                                {item.topic_name && (
                                  <span
                                    style={{
                                      fontSize: 10,
                                      color: 'var(--text-muted)',
                                      background: 'var(--bg-card)',
                                      borderRadius: 5,
                                      padding: '1px 6px',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {item.topic_name}
                                  </span>
                                )}
                              </div>
                            ))}
                            {group.items.length > 4 && (
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 12,
                                  color: 'var(--text-muted)',
                                  padding: '4px 10px',
                                  fontStyle: 'italic',
                                }}
                              >
                                + {group.items.length - 4} archivo
                                {group.items.length - 4 !== 1 ? 's' : ''} más...
                              </p>
                            )}
                          </div>
                          {/* Botones de acción */}
                          {bulkImporting === courseId && bulkImportMsg && (
                            <p
                              style={{
                                margin: '0 0 8px',
                                fontSize: 12,
                                color: 'var(--text-muted)',
                              }}
                            >
                              {bulkImportMsg}
                            </p>
                          )}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              onClick={() => handleBulkImport(courseId)}
                              disabled={bulkImporting === courseId}
                              style={{
                                flex: 1,
                                padding: '8px 14px',
                                borderRadius: 8,
                                border: 'none',
                                background:
                                  bulkImporting === courseId
                                    ? 'var(--bg-secondary)'
                                    : isLinked
                                      ? 'var(--accent)'
                                      : 'var(--accent-orange, #f97316)',
                                color: bulkImporting === courseId ? 'var(--text-muted)' : '#fff',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: bulkImporting === courseId ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 5,
                              }}
                            >
                              {bulkImporting === courseId
                                ? '⏳ Importando...'
                                : isLinked
                                  ? `📌 Importar a ${displayLabel}`
                                  : '🚀 Importar asignatura'}
                            </button>
                            <button
                              onClick={() => linkedCourse && openCourse(linkedCourse)}
                              style={{
                                padding: '8px 14px',
                                borderRadius: 8,
                                border: '1px solid var(--border)',
                                background: 'transparent',
                                color: 'var(--text-muted)',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Ver todos
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {/* /columna principal */}

        {/* ══ SIDEBAR DERECHO — CALENDARIO ══════════════════════════ */}
        <CalendarSidebar
          events={calEvents}
          prefs={calPrefs}
          syncing={calSyncing}
          msg={calMsg}
          month={calMonth}
          onMonthChange={setCalMonth}
          onSync={handleSyncCalendar}
          onPrefChange={updatePref}
          onEventClick={handleCalEventClick}
        />
      </div>
      {/* /grid */}

      {/* ── Modal agregar asignaturas ──────────────────────────── */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 18,
              width: '100%',
              maxWidth: 520,
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
            }}
          >
            {/* Modal header */}
            <div
              style={{
                padding: '20px 24px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Agregar asignaturas</h3>
              <button
                onClick={() => !adding && setShowAddModal(false)}
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

            {/* Progress overlay */}
            {adding && (
              <div style={{ padding: '16px 24px' }}>
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: 16 }}>
                  {addProgress.map((msg, i) => (
                    <p
                      key={i}
                      style={{
                        margin: i === 0 ? 0 : '6px 0 0',
                        fontSize: 13,
                        color: 'var(--text-muted)',
                      }}
                    >
                      {msg}
                    </p>
                  ))}
                  <p style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                    💡 Este proceso puede tomar 30–90 segundos dependiendo de la cantidad de
                    archivos y la velocidad de tu campus virtual.
                  </p>
                </div>
              </div>
            )}

            {!adding && (
              <>
                {/* Tabs */}
                <div
                  style={{
                    padding: '14px 24px 0',
                    display: 'flex',
                    gap: 4,
                    background: 'var(--bg-secondary)',
                    margin: '14px 24px 0',
                    borderRadius: 10,
                  }}
                >
                  {(['en_curso', 'anteriores'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setAddTab(t)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: addTab === t ? 600 : 400,
                        background: addTab === t ? 'var(--bg-card)' : 'transparent',
                        color: addTab === t ? 'var(--text-primary)' : 'var(--text-muted)',
                      }}
                    >
                      {t === 'en_curso'
                        ? `📚 En curso (${available?.en_curso?.length ?? '…'})`
                        : `📦 Anteriores (${available?.anteriores?.length ?? '…'})`}
                    </button>
                  ))}
                </div>

                {/* Lista */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px' }}>
                  {availableLoading ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '24px 0',
                        color: 'var(--text-muted)',
                        fontSize: 13,
                      }}
                    >
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          border: '2px solid var(--border)',
                          borderTopColor: 'var(--accent)',
                          borderRadius: '50%',
                          animation: 'spin 0.9s linear infinite',
                        }}
                      />
                      Obteniendo asignaturas desde tu campus virtual…
                    </div>
                  ) : (
                    (() => {
                      const list =
                        addTab === 'en_curso'
                          ? available?.en_curso || []
                          : available?.anteriores || [];
                      if (list.length === 0)
                        return (
                          <p
                            style={{
                              color: 'var(--text-muted)',
                              fontSize: 13,
                              padding: '24px 0',
                              textAlign: 'center',
                            }}
                          >
                            {addTab === 'en_curso'
                              ? 'No hay asignaturas en curso sin agregar.'
                              : 'No hay asignaturas anteriores disponibles.'}
                          </p>
                        );
                      return list.map((c: any) => (
                        <label
                          key={c.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 0',
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedToAdd.has(c.id)}
                            onChange={() => toggleSelect(c.id)}
                            style={{
                              width: 16,
                              height: 16,
                              accentColor: 'var(--accent)',
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                margin: 0,
                                fontSize: 13,
                                fontWeight: 500,
                                color: 'var(--text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {c.name}
                            </p>
                            {c.short_name && (
                              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                                {c.short_name}
                              </p>
                            )}
                          </div>
                        </label>
                      ));
                    })()
                  )}
                </div>

                {/* Info */}
                <div
                  style={{
                    padding: '10px 24px',
                    background: 'rgba(59,130,246,0.06)',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
                    ℹ️ Importará todo el material (archivos, tareas, URLs) organizado por módulos.
                    Puede tomar 30–90 segundos según la cantidad de archivos.
                  </p>
                </div>

                {/* Footer */}
                <div
                  style={{
                    padding: '14px 24px',
                    display: 'flex',
                    gap: 10,
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <button
                    onClick={() => setShowAddModal(false)}
                    style={{
                      flex: 1,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      padding: 10,
                      fontSize: 14,
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddCourses}
                    disabled={selectedToAdd.size === 0}
                    style={{
                      flex: 2,
                      background:
                        selectedToAdd.size === 0 ? 'var(--bg-secondary)' : 'var(--accent)',
                      color: selectedToAdd.size === 0 ? 'var(--text-muted)' : '#fff',
                      border: 'none',
                      borderRadius: 10,
                      padding: 10,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: selectedToAdd.size === 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Agregar{' '}
                    {selectedToAdd.size > 0
                      ? `${selectedToAdd.size} asignatura${selectedToAdd.size !== 1 ? 's' : ''}`
                      : 'asignaturas'}{' '}
                    →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function CourseCard({
  course,
  onClick,
  muted,
  renamingId,
  renameValue,
  onStartRename,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}: {
  course: CourseItem;
  onClick: () => void;
  muted?: boolean;
  renamingId: string | null;
  renameValue: string;
  onStartRename: (id: string, current: string) => void;
  onRenameChange: (val: string) => void;
  onRenameSubmit: (id: string) => void;
  onRenameCancel: () => void;
}) {
  const isRenaming = renamingId === course.id;
  const isLinked = !!course.conniku_project_id;
  const displayLabel = course.display_name || course.name;
  const showOriginal = !!(course.display_name && course.display_name !== course.name);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${isLinked ? '#10b981' : '#f97316'}`,
        borderRadius: 14,
        overflow: 'hidden',
        opacity: muted ? 0.75 : 1,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)')}
    >
      {/* Cuerpo de la card */}
      <div style={{ padding: '14px 14px 10px', flex: 1 }}>
        {/* Fila superior: ícono + badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 22 }}>📘</span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            {course.new_items > 0 && (
              <span
                style={{
                  background: '#3b82f6',
                  color: '#fff',
                  borderRadius: 20,
                  padding: '2px 8px',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {course.new_items} nuevo{course.new_items !== 1 ? 's' : ''}
              </span>
            )}
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 20,
                background: isLinked ? 'rgba(16,185,129,0.12)' : 'rgba(249,115,22,0.12)',
                color: isLinked ? '#10b981' : '#f97316',
              }}
            >
              {isLinked ? '✓ Vinculada' : '⚡ Sin importar'}
            </span>
          </div>
        </div>

        {/* Nombre / input renombrar */}
        {isRenaming ? (
          <div style={{ marginBottom: 6 }}>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onRenameSubmit(course.id);
                if (e.key === 'Escape') onRenameCancel();
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: 8,
                border: '1.5px solid var(--accent)',
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 13,
                fontWeight: 600,
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRenameSubmit(course.id);
                }}
                style={{
                  flex: 1,
                  background: 'var(--accent)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 7,
                  padding: '5px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Guardar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRenameCancel();
                }}
                style={{
                  flex: 1,
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                  borderRadius: 7,
                  padding: '5px',
                  fontSize: 11,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginBottom: 4 }}>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 700,
                color: 'var(--text-primary)',
                lineHeight: 1.35,
                flex: 1,
              }}
            >
              {displayLabel.length > 50 ? displayLabel.slice(0, 50) + '…' : displayLabel}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartRename(course.id, displayLabel);
              }}
              title="Renombrar asignatura"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '1px 3px',
                borderRadius: 4,
                fontSize: 12,
                lineHeight: 1,
                flexShrink: 0,
                marginTop: 1,
                opacity: 0.55,
              }}
            >
              ✎
            </button>
          </div>
        )}

        {/* Nombre original (clave de sync) — sólo si el usuario renombró */}
        {!isRenaming && showOriginal && (
          <p
            style={{
              margin: '0 0 6px',
              fontSize: 10,
              color: 'var(--text-muted)',
              fontFamily: 'monospace',
              letterSpacing: '0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            🔗 {course.name}
          </p>
        )}

        {/* Stats */}
        {!isRenaming && (
          <div
            style={{
              display: 'flex',
              gap: 10,
              fontSize: 11,
              color: 'var(--text-muted)',
              marginTop: 6,
            }}
          >
            <span>📄 {course.total_items} arch.</span>
            {course.last_checked && <span>↻ {timeAgo(course.last_checked)}</span>}
          </div>
        )}
      </div>

      {/* Botón de acción inferior */}
      {!isRenaming && (
        <button
          onClick={onClick}
          style={{
            width: '100%',
            border: 'none',
            borderTop: '1px solid var(--border)',
            background: isLinked ? 'rgba(16,185,129,0.07)' : 'rgba(249,115,22,0.07)',
            color: isLinked ? '#10b981' : '#f97316',
            padding: '9px 14px',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          {isLinked ? 'Ver asignatura →' : '🚀 Importar'}
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CALENDARIO SIDEBAR
// ══════════════════════════════════════════════════════════════

const EV_ICON: Record<string, string> = {
  deadline: '📝',
  exam: '🧩',
  class: '🎥',
  forum: '💬',
  task: '📋',
};
const EV_COLOR: Record<string, string> = {
  deadline: '#f59e0b',
  exam: '#ef4444',
  class: '#3b82f6',
  forum: '#10b981',
  task: '#4f8cff',
};

// ── Detección de plataforma para botón branded ─────────────────
type Platform = 'zoom' | 'bbb' | 'teams' | 'meet' | null;
function detectPlatform(url: string): Platform {
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes('zoom.us') || u.includes('zoom.com')) return 'zoom';
  if (u.includes('bigbluebutton') || u.includes('/bbb/') || u.includes('bbb.')) return 'bbb';
  if (u.includes('teams.microsoft') || u.includes('teams.live.com')) return 'teams';
  if (u.includes('meet.google') || u.includes('meet.jit.si')) return 'meet';
  return null;
}
const PLATFORM_LABEL: Record<NonNullable<Platform>, string> = {
  zoom: '🎥 Unirse a Zoom',
  bbb: '🎥 Unirse a BigBlueButton',
  teams: '🎥 Unirse a Teams',
  meet: '🎥 Unirse a Meet',
};
const PLATFORM_COLOR: Record<NonNullable<Platform>, string> = {
  zoom: '#2D8CFF',
  bbb: '#467fcf',
  teams: '#5059C9',
  meet: '#00897B',
};

// ── Badge de estado de entrega ─────────────────────────────────
function SubmissionBadge({ status }: { status: string }) {
  if (!status || status === 'unknown') return null;
  const cfg: Record<string, { label: string; bg: string; color: string }> = {
    submitted: { label: '✓ Entregado', bg: 'rgba(16,185,129,.15)', color: '#10b981' },
    draft: { label: '📝 Borrador', bg: 'rgba(245,158,11,.14)', color: '#f59e0b' },
    nosubmission: { label: '✗ Sin entregar', bg: 'rgba(239,68,68,.12)', color: '#ef4444' },
  };
  const c = cfg[status];
  if (!c) return null;
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        padding: '2px 6px',
        borderRadius: 4,
        background: c.bg,
        color: c.color,
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {c.label}
    </span>
  );
}

function countdown(isoDate: string): {
  label: string;
  pct: number;
  urgency: 'urgent' | 'warning' | 'ok';
} {
  const ms = new Date(isoDate).getTime() - Date.now();
  if (ms <= 0) return { label: 'Vencido', pct: 100, urgency: 'urgent' };
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(ms / 86400000);
  const label =
    days > 1 ? `${days}d ${hours % 24}h` : hours > 0 ? `${hours}h ${mins % 60}m` : `${mins}m`;
  const urgency: 'urgent' | 'warning' | 'ok' =
    ms < 3600000 * 6 ? 'urgent' : ms < 3600000 * 26 ? 'warning' : 'ok';
  const maxWindow = 7 * 86400000;
  const pct = Math.min(100, Math.round(100 - (ms / maxWindow) * 100));
  return { label, pct, urgency };
}

function MiniCalendar({
  year,
  month,
  events,
  onMonthChange,
}: {
  year: number;
  month: number;
  events: any[];
  onMonthChange: (m: { year: number; month: number }) => void;
}) {
  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  const today = new Date();

  // Calcular días del mes
  const firstDay = new Date(year, month, 1).getDay(); // 0=Dom
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // lunes primero
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  // Índice de eventos por día
  const eventDays = new Map<string, string[]>();
  events.forEach((ev) => {
    const d = new Date(ev.due_date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = d.getDate().toString();
      if (!eventDays.has(key)) eventDays.set(key, []);
      eventDays.get(key)!.push(ev.event_type);
    }
  });

  const cells: { day: number; thisMonth: boolean; types: string[] }[] = [];
  for (let i = 0; i < startOffset; i++)
    cells.push({ day: daysInPrev - startOffset + 1 + i, thisMonth: false, types: [] });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ day: d, thisMonth: true, types: eventDays.get(d.toString()) || [] });
  while (cells.length % 7 !== 0)
    cells.push({ day: cells.length - startOffset - daysInMonth + 1, thisMonth: false, types: [] });

  const prev = () =>
    month === 0
      ? onMonthChange({ year: year - 1, month: 11 })
      : onMonthChange({ year, month: month - 1 });
  const next = () =>
    month === 11
      ? onMonthChange({ year: year + 1, month: 0 })
      : onMonthChange({ year, month: month + 1 });

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '13px 14px 10px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            {monthNames[month]} {year}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
            {
              events.filter((e) => {
                const d = new Date(e.due_date);
                return d.getFullYear() === year && d.getMonth() === month;
              }).length
            }{' '}
            eventos este mes
          </div>
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          {[
            ['‹', prev],
            ['›', next],
          ].map(([lbl, fn]) => (
            <button
              key={lbl as string}
              onClick={fn as () => void}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: 16,
                padding: '2px 7px',
                borderRadius: 6,
                lineHeight: 1,
              }}
            >
              {lbl as string}
            </button>
          ))}
        </div>
      </div>
      {/* Grid */}
      <div style={{ padding: '10px 12px 12px' }}>
        {/* DOW headers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 4 }}>
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center',
                fontSize: 9,
                fontWeight: 700,
                color: 'var(--text-muted)',
                padding: '2px 0',
                textTransform: 'uppercase',
              }}
            >
              {d}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
          {cells.map((cell, i) => {
            const isToday =
              cell.thisMonth &&
              cell.day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();
            const dotColor = cell.types.includes('exam')
              ? '#ef4444'
              : cell.types.includes('deadline')
                ? '#f59e0b'
                : cell.types.includes('class')
                  ? '#3b82f6'
                  : cell.types.length > 0
                    ? '#10b981'
                    : null;
            return (
              <div
                key={i}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 7,
                  fontSize: 11,
                  fontWeight: isToday ? 800 : 500,
                  color: isToday
                    ? '#fff'
                    : cell.thisMonth
                      ? 'var(--text-secondary)'
                      : 'var(--text-muted)',
                  background: isToday ? 'var(--accent)' : 'transparent',
                  opacity: cell.thisMonth ? 1 : 0.35,
                  boxShadow: isToday ? '0 2px 8px rgba(26,86,219,.3)' : 'none',
                }}
              >
                {cell.day}
                {dotColor && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 2,
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: isToday ? 'rgba(255,255,255,.8)' : dotColor,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Leyenda */}
      <div style={{ display: 'flex', gap: 10, padding: '0 12px 12px', flexWrap: 'wrap' }}>
        {[
          ['#f59e0b', 'Tarea'],
          ['#ef4444', 'Examen'],
          ['#3b82f6', 'Clase'],
          ['#10b981', 'Foro'],
        ].map(([c, l]) => (
          <div
            key={l}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10,
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

function CalendarSidebar({
  events,
  prefs,
  syncing,
  msg,
  month,
  onMonthChange,
  onSync,
  onPrefChange,
  onEventClick,
}: {
  events: any[];
  prefs: any;
  syncing: boolean;
  msg: string;
  month: { year: number; month: number };
  onMonthChange: (m: { year: number; month: number }) => void;
  onSync: () => void;
  onPrefChange: (key: string, val: boolean) => void;
  onEventClick: (ev: any) => void;
}) {
  const upcoming = [...events]
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, 6);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 20 }}>
      {/* Mini calendario */}
      <MiniCalendar
        year={month.year}
        month={month.month}
        events={events}
        onMonthChange={onMonthChange}
      />

      {/* Botón sincronizar */}
      <button
        onClick={onSync}
        disabled={syncing}
        style={{
          width: '100%',
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 10,
          padding: '9px 0',
          fontSize: 12,
          fontWeight: 700,
          cursor: syncing ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          opacity: syncing ? 0.7 : 1,
        }}
      >
        {syncing ? '⏳' : '📅'}{' '}
        {syncing ? 'Sincronizando...' : 'Sincronizar calendario universitario'}
      </button>
      {msg && (
        <p
          style={{
            margin: '-8px 0 0',
            fontSize: 12,
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}
        >
          {msg}
        </p>
      )}

      {/* Próximos eventos con countdown */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px 10px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            ⏱ Próximos eventos
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {events.length} pendientes
          </span>
        </div>

        {upcoming.length === 0 ? (
          <div style={{ padding: '24px 14px', textAlign: 'center' }}>
            <p style={{ fontSize: 22, marginBottom: 6 }}>📭</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Sin eventos próximos.
              <br />
              Sincroniza tu calendario universitario.
            </p>
          </div>
        ) : (
          upcoming.map((ev) => {
            const { label, pct, urgency } = countdown(ev.due_date);
            const color =
              urgency === 'urgent' ? '#ef4444' : urgency === 'warning' ? '#f59e0b' : '#10b981';
            const d = new Date(ev.due_date);
            const dateStr =
              d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' }) +
              ' ' +
              d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
            const isClickable = !!(ev.item_url || (ev.event_type === 'class' && ev.lms_course_id));
            // ① Detección de plataforma para clases
            const platform = ev.event_type === 'class' ? detectPlatform(ev.item_url || '') : null;
            const btnBg = platform
              ? PLATFORM_COLOR[platform]
              : EV_COLOR[ev.event_type] || '#4f8cff';
            const btnLabel = platform
              ? PLATFORM_LABEL[platform]
              : ev.event_type === 'deadline'
                ? '📤 Ir a entregar'
                : ev.event_type === 'exam'
                  ? '🧩 Ir al examen'
                  : ev.event_type === 'forum'
                    ? '💬 Participar'
                    : '🔗 Ver actividad';
            const isBrandedBtn = !!platform; // fondo sólido vs translúcido
            return (
              <div
                key={ev.id}
                style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      flexShrink: 0,
                      background: (EV_COLOR[ev.event_type] || '#4f8cff') + '18',
                    }}
                  >
                    {EV_ICON[ev.event_type] || '📋'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Título clickeable + ② badge de entrega */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                      <div
                        onClick={() => isClickable && onEventClick(ev)}
                        title={
                          isClickable
                            ? ev.event_type === 'class'
                              ? 'Ir a la asignatura y unirse a la clase'
                              : 'Abrir en el campus virtual'
                            : undefined
                        }
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: isClickable ? 'var(--accent)' : 'var(--text-primary)',
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: isClickable ? 'pointer' : 'default',
                          textDecoration: isClickable ? 'underline' : 'none',
                          textDecorationColor: 'var(--accent)',
                          textUnderlineOffset: 2,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        {ev.title}
                        {isClickable && ' ↗'}
                      </div>
                      {/* ② Badge estado de entrega */}
                      <SubmissionBadge status={ev.submission_status || ''} />
                    </div>
                    {ev.course_name && (
                      <div
                        style={{
                          fontSize: 10,
                          color: 'var(--text-muted)',
                          marginTop: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ev.course_name}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>
                      {dateStr}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: color + '18',
                      color,
                      flexShrink: 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {urgency === 'urgent' ? '🔴' : urgency === 'warning' ? '⚠️' : '🟢'} {label}
                  </span>
                </div>
                {/* Barra countdown */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: isClickable ? 8 : 0,
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      height: 4,
                      borderRadius: 99,
                      background: 'var(--border)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        borderRadius: 99,
                        background: color,
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, color, flexShrink: 0 }}>
                    {label}
                  </span>
                </div>
                {/* ① Botón branded (sólido para plataformas, translúcido para el resto) */}
                {isClickable && ev.submission_status !== 'submitted' && (
                  <button
                    onClick={() => onEventClick(ev)}
                    style={{
                      width: '100%',
                      padding: '5px 0',
                      borderRadius: 7,
                      border: 'none',
                      background: isBrandedBtn ? btnBg : btnBg + '22',
                      color: isBrandedBtn ? '#fff' : btnBg,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {btnLabel}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Configuración de alertas */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '14px',
        }}
      >
        <div
          style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}
        >
          🔔 Alertas automáticas
        </div>
        {[
          { key: 'cal_push', icon: '📱', label: 'Push (app)' },
          { key: 'cal_inapp', icon: '🔔', label: 'In-app' },
          { key: 'cal_email', icon: '✉️', label: 'Email' },
        ].map(({ key, icon, label }) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '7px 0',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 12,
                color: 'var(--text-secondary)',
              }}
            >
              <span style={{ fontSize: 14 }}>{icon}</span>
              {label}
            </div>
            <button
              onClick={() => onPrefChange(key, !(prefs as any)[key])}
              style={{
                width: 34,
                height: 18,
                borderRadius: 99,
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                position: 'relative',
                background: (prefs as any)[key] ? 'var(--accent)' : 'var(--border)',
                transition: 'background .2s',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  width: 13,
                  height: 13,
                  background: '#fff',
                  borderRadius: '50%',
                  top: 2.5,
                  left: (prefs as any)[key] ? 18.5 : 2.5,
                  transition: 'left .2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                }}
              />
            </button>
          </div>
        ))}
        <div
          style={{
            marginTop: 10,
            padding: '8px 10px',
            borderRadius: 8,
            background: 'rgba(26,86,219,.07)',
            border: '1px solid rgba(26,86,219,.15)',
            fontSize: 11,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}
        >
          ℹ️ Tareas y exámenes: <strong>24h antes</strong>. Clases sincrónicas:{' '}
          <strong>15 min antes</strong>.
        </div>
      </div>
    </div>
  );
}

function TopicAccordion({
  topic,
  open,
  onToggle,
  onImport,
  importingId,
}: {
  topic: Topic;
  open: boolean;
  onToggle: () => void;
  onImport?: (item: TopicItem) => void;
  importingId?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '13px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14 }}>📁</span>
          <span
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: 'var(--text-primary)',
              textAlign: 'left',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {topic.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {topic.items.length} archivo{topic.items.length !== 1 ? 's' : ''}
          </span>
          <span
            style={{
              color: 'var(--text-muted)',
              fontSize: 11,
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          >
            ▼
          </span>
        </div>
      </button>
      {open && (
        <div style={{ borderTop: '1px solid var(--border)' }}>
          {topic.items.map((item, idx) => (
            <ItemRow
              key={item.id}
              item={item}
              borderTop={idx > 0}
              onImport={onImport}
              importing={importingId === item.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemRow({
  item,
  borderTop,
  onImport,
  importing,
}: {
  item: TopicItem;
  borderTop: boolean;
  onImport?: (item: TopicItem) => void;
  importing?: boolean;
}) {
  const isFile = item.item_type === 'file';
  // For files: use proxy download (avoids exposing LMS tokens)
  // For URLs/pages: open directly (no auth needed)
  const downloadUrl = isFile ? api.lmsDownloadUrl(item.id) : item.item_url;
  const token = localStorage.getItem('token');

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        borderTop: borderTop ? '1px solid var(--border)' : 'none',
      }}
    >
      <span style={{ fontSize: 16, flexShrink: 0 }}>
        {itemIcon(item.item_type, item.mime_type)}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            color: 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.item_name}
        </p>
        {item.module_name && item.module_name !== item.item_name && (
          <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{item.module_name}</p>
        )}
      </div>
      {item.file_size > 0 && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
          {formatSize(item.file_size)}
        </span>
      )}
      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
        {/* Import button — for files only */}
        {isFile && onImport && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onImport(item);
            }}
            disabled={importing}
            style={{
              background: importing ? 'var(--bg-secondary)' : 'var(--accent)',
              color: importing ? 'var(--text-muted)' : '#fff',
              border: 'none',
              borderRadius: 7,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 600,
              cursor: importing ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {importing ? '⏳' : '↓ Importar'}
          </button>
        )}
        {/* Open/Download button */}
        {downloadUrl &&
          (isFile ? (
            <a
              href={`${downloadUrl}${downloadUrl.includes('?') ? '&' : '?'}token=${token}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 7,
                padding: '4px 10px',
                fontSize: 11,
                color: 'var(--text-muted)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Abrir
            </a>
          ) : (
            <a
              href={item.item_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderRadius: 7,
                padding: '4px 10px',
                fontSize: 11,
                color: 'var(--text-muted)',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
              }}
            >
              Abrir
            </a>
          ))}
      </div>
    </div>
  );
}
