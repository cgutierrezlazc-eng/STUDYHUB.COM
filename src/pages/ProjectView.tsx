import React, { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Project, Document, ChatMessage } from '../types';
import ChatMessageRenderer from '../components/ChatMessageRenderer';
import { api } from '../services/api';
import {
  FileText,
  FileUp,
  Pencil,
  Trash2,
  Upload,
  Film,
  FolderOpen,
  PlayCircle,
  Video,
  Download,
  MessageSquare,
  Brain,
  BookOpen,
  Rocket,
  Hourglass,
  Lightbulb,
  Camera,
  Mic,
  Save,
  ClipboardList,
  SquareFunction,
  Map,
  RotateCcw,
  Dumbbell,
  AlertTriangle,
  Sparkles,
  Link,
} from '../components/Icons';

interface VideoDoc {
  id: string;
  title: string;
  sourceType: 'youtube' | 'file';
  sourceUrl?: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  transcription?: string;
}

interface Props {
  projects: Project[];
  onUpdate: (project: Project) => void;
  onDelete: (id: string) => void;
}

const DOC_ICONS: Record<string, string> = {
  pdf: 'PDF',
  docx: 'DOC',
  xlsx: 'XLS',
  pptx: 'PPT',
  txt: 'TXT',
  csv: 'CSV',
  image: 'IMG',
  other: '?',
};

function getFileType(name: string): Document['type'] {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'docx';
  if (['xls', 'xlsx'].includes(ext)) return 'xlsx';
  if (['ppt', 'pptx'].includes(ext)) return 'pptx';
  if (ext === 'txt') return 'txt';
  if (ext === 'csv') return 'csv';
  if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return 'image';
  return 'other';
}

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function ProjectView({ projects, onUpdate, onDelete }: Props) {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const project = projects.find((p) => p.id === id);
  const initialTab = (
    ['docs', 'chat', 'guide', 'quiz', 'flashcards', 'summary', 'live'].includes(
      searchParams.get('tab') || ''
    )
      ? searchParams.get('tab')
      : 'docs'
  ) as 'docs' | 'chat' | 'guide' | 'quiz' | 'flashcards' | 'summary' | 'live';
  const [tab, setTab] = useState<
    'docs' | 'chat' | 'guide' | 'quiz' | 'flashcards' | 'summary' | 'live'
  >(initialTab);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [guide, setGuide] = useState<string | null>(null);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [videos, setVideos] = useState<VideoDoc[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [addingVideo, setAddingVideo] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [zoomLink, setZoomLink] = useState('');
  const [savedZoomLink, setSavedZoomLink] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [liveTranscription, setLiveTranscription] = useState('');
  const [savingTranscription, setSavingTranscription] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [quizResult, setQuizResult] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizCurrentIndex, setQuizCurrentIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDifficulty, setQuizDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [quizNumQuestions, setQuizNumQuestions] = useState<5 | 10 | 15>(10);
  const [quizHistory, setQuizHistory] = useState<any[]>(() => {
    try {
      const all = JSON.parse(localStorage.getItem('conniku_quiz_history') || '[]');
      return all.filter((h: any) => h.projectId === id).slice(0, 8);
    } catch {
      return [];
    }
  });

  // ─── Quiz System (diagnóstico + programados) ───────────────
  const [qsAvg, setQsAvg] = useState<any>(null);
  const [qsSched, setQsSched] = useState<any[]>([]);
  const [qsLoaded, setQsLoaded] = useState(false);
  // Diagnóstico
  type DiagMode = 'idle' | 'loading' | 'active' | 'done';
  const [diagMode, setDiagMode] = useState<DiagMode>('idle');
  const [diagQs, setDiagQs] = useState<any[]>([]);
  const [diagIdx, setDiagIdx] = useState(0);
  const [diagAns, setDiagAns] = useState<Record<number, number>>({});
  const [diagRes, setDiagRes] = useState<any>(null);
  // Quiz programado activo
  const [schedActive, setSchedActive] = useState<{
    quizId: string;
    num: number;
    questions: any[];
    answers: Record<number, number>;
    idx: number;
    mode: 'loading' | 'active' | 'done';
    result: any;
  } | null>(null);

  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [showFlashcardAnswer, setShowFlashcardAnswer] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [socraticMode, setSocraticMode] = useState(false);
  // Summary / advanced
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryDetailLevel, setSummaryDetailLevel] = useState<
    'brief' | 'standard' | 'comprehensive'
  >('comprehensive');
  const [conceptMap, setConceptMap] = useState<any>(null);
  const [isGeneratingMap, setIsGeneratingMap] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState('');

  // ─── Biblioteca sharing prompt ─────────────────────────────
  const [sharePrompt, setSharePrompt] = useState<{ docId: string; docName: string } | null>(null);
  const [shareForm, setShareForm] = useState<{
    title: string;
    description: string;
    category: string;
  } | null>(null);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // ─── Math Panel ────────────────────────────────────────────────────────────
  type MathPanelMode = 'hidden' | 'solve' | 'verify' | 'graph';
  const [mathPanelMode, setMathPanelMode] = useState<MathPanelMode>('hidden');
  const [mathExpr, setMathExpr] = useState('');
  const [mathStepByStep, setMathStepByStep] = useState(true);
  const [mathResult, setMathResult] = useState<any>(null);
  const [mathLoading, setMathLoading] = useState(false);
  const [mathError, setMathError] = useState('');
  // Verify mode
  const [mathVerifyProblem, setMathVerifyProblem] = useState('');
  const [mathVerifyAnswer, setMathVerifyAnswer] = useState('');
  const [mathVerifyResult, setMathVerifyResult] = useState<any>(null);
  // Graph mode
  const [mathGraphExpr, setMathGraphExpr] = useState('');
  const [mathGraphVar, setMathGraphVar] = useState('x');
  const [mathGraphMin, setMathGraphMin] = useState('-10');
  const [mathGraphMax, setMathGraphMax] = useState('10');
  const [mathGraphImg, setMathGraphImg] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (id) {
      api
        .getVideos(id)
        .then(setVideos)
        .catch(() => {});
    }
  }, [id]);

  useEffect(() => {
    if (!showProjectMenu) return;
    const handleClickOutside = () => setShowProjectMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showProjectMenu]);

  // Cargar quiz system al entrar al tab quiz
  useEffect(() => {
    if (tab !== 'quiz' || !id || qsLoaded) return;
    Promise.all([
      api.getSubjectAverage(id).catch(() => null),
      api.getScheduledQuizzes(id).catch(() => []),
    ]).then(([avg, sched]) => {
      setQsAvg(avg || null);
      setQsSched(Array.isArray(sched) ? sched : []);
      // Si ya hizo el diagnóstico, marcarlo como done
      if (avg?.history?.some((h: any) => h.type === 'diagnostic')) {
        setDiagMode('done');
        setDiagRes(avg.history.find((h: any) => h.type === 'diagnostic') || null);
      }
      setQsLoaded(true);
    });
  }, [tab, id, qsLoaded]);

  if (!project) {
    return (
      <div className="empty-state" style={{ marginTop: 100 }}>
        <h3>Asignatura no encontrada</h3>
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !project) return;

    const newDocs: Document[] = Array.from(files).map((file) => ({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      name: file.name,
      type: getFileType(file.name),
      path: URL.createObjectURL(file),
      size: file.size,
      uploadedAt: new Date().toISOString(),
      processed: false,
    }));

    const updated = {
      ...project,
      documents: [...project.documents, ...newDocs],
      updatedAt: new Date().toISOString(),
    };
    onUpdate(updated);

    // Upload to backend for processing (XHR for progress tracking)
    for (const file of Array.from(files)) {
      const doc = newDocs.find((d) => d.name === file.name);
      setUploadingFileName(file.name);
      setUploadProgress(0);
      try {
        const result = await api.uploadDocumentWithProgress(project.id, file, (pct) => {
          setUploadProgress(pct);
        });
        if (doc) {
          doc.processed = true;
          doc.id = result.id || doc.id;
        }
        // Preguntar si quiere compartir con la Biblioteca (solo PDFs y docs)
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (['pdf', 'docx', 'doc', 'txt'].includes(ext) && doc) {
          setSharePrompt({ docId: doc.id, docName: file.name });
        }
      } catch (err: any) {
        if (doc) {
          doc.processed = false;
          doc.uploadError = err?.message || 'Error al subir';
        }
        const errMsg = err?.message || 'Error al subir el archivo';
        alert(`No se pudo subir "${file.name}": ${errMsg}`);
      } finally {
        setUploadProgress(null);
        setUploadingFileName('');
      }
    }
    onUpdate({ ...updated, documents: updated.documents.map((d) => ({ ...d })) });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleElectronFileSelect = async () => {
    try {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.selectFiles) {
        const paths: string[] = await electronAPI.selectFiles();
        if (paths.length === 0) return;

        const newDocs: Document[] = paths.map((p) => {
          const name = p.split('/').pop() || p;
          return {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            name,
            type: getFileType(name),
            path: p,
            size: 0,
            uploadedAt: new Date().toISOString(),
            processed: false,
          };
        });

        const updated = {
          ...project,
          documents: [...project.documents, ...newDocs],
          updatedAt: new Date().toISOString(),
        };
        onUpdate(updated);

        for (const p of paths) {
          try {
            await api.uploadDocumentFromPath(project.id, p);
          } catch {
            /* backend offline */
          }
        }
      } else {
        fileInputRef.current?.click();
      }
    } catch {
      fileInputRef.current?.click();
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('¿Eliminar este documento? Esta acción no se puede deshacer.')) return;
    try {
      await api.deleteProjectDocument(project.id, docId);
      const updated = {
        ...project,
        documents: project.documents.filter((d) => d.id !== docId),
        updatedAt: new Date().toISOString(),
      };
      onUpdate(updated);
    } catch (err) {
      console.error('Error al eliminar documento:', err);
      alert('No se pudo eliminar el documento. Intenta de nuevo.');
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date().toISOString(),
      projectId: project.id,
    };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsLoading(true);

    try {
      const res = await api.chat(
        project.id,
        userMsg.content,
        undefined,
        undefined,
        undefined,
        socraticMode
      );
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.response,
        timestamp: new Date().toISOString(),
        projectId: project.id,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          '⚠️ No se pudo conectar con el backend. Asegúrate de que el servidor esté corriendo (npm run backend:start).',
        timestamp: new Date().toISOString(),
        projectId: project.id,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportDocx = async (content: string) => {
    try {
      await api.exportDocx(project.id, content, `${project.name}-respuesta`);
    } catch {
      alert('No se pudo exportar. Verifica que el backend esté corriendo.');
    }
  };

  const handleExportChatPdf = async () => {
    try {
      const chatMessages = messages.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));
      await api.exportChatPdf(project.id, chatMessages, `${project.name}-chat`);
    } catch {
      alert('No se pudo exportar. Verifica que el backend esté corriendo.');
    }
  };

  const handleClearChat = () => {
    if (messages.length === 0) return;
    if (window.confirm('¿Limpiar toda la conversación? No se puede deshacer.')) {
      setMessages([]);
    }
  };

  const handleExportChatWord = async () => {
    if (messages.length === 0) return;
    const content = messages
      .map((m) => `${m.role === 'user' ? 'Tú' : 'Conniku'}: ${m.content}`)
      .join('\n\n');
    try {
      await api.exportDocx(project.id, content, `${project.name}-chat`);
    } catch {
      alert('No se pudo exportar a Word. Verifica que el backend esté corriendo.');
    }
  };

  const handleExportChatExcel = () => {
    if (messages.length === 0) return;
    const rows = [
      ['Hora', 'Remitente', 'Mensaje'],
      ...messages.map((m) => [
        m.timestamp ? new Date(m.timestamp).toLocaleString('es-CL') : '',
        m.role === 'user' ? 'Tú' : 'Conniku',
        m.content.replace(/"/g, '""'),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}-chat.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleAddYoutube = async () => {
    if (!youtubeUrl.trim()) return;
    setAddingVideo(true);
    try {
      const vid = await api.addYoutubeVideo(project.id, youtubeUrl.trim());
      setVideos((prev) => [...prev, vid]);
      setYoutubeUrl('');
      setShowVideoModal(false);
    } catch {
      alert('No se pudo agregar el video. Verifica la URL.');
    } finally {
      setAddingVideo(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAddingVideo(true);
    try {
      const vid = await api.uploadVideo(project.id, file);
      setVideos((prev) => [...prev, vid]);
      setShowVideoModal(false);
    } catch {
      alert('No se pudo subir el video.');
    } finally {
      setAddingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recordingChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordingChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      };
      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      alert('No se pudo acceder al micrófono. Verifica los permisos.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleDownloadRecording = () => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}-clase-${new Date().toISOString().slice(0, 10)}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTranscribeAndSave = async () => {
    if (!recordedBlob || !project) return;
    setSavingTranscription(true);
    try {
      const file = new File([recordedBlob], 'recording.webm', { type: 'audio/webm' });
      const vid = await api.uploadVideo(project.id, file);
      setVideos((prev) => [...prev, vid]);
      setLiveTranscription(
        'Grabación enviada para transcripción. Aparecerá en la pestaña Documentos cuando esté lista.'
      );
    } catch {
      setLiveTranscription(
        'No se pudo enviar la grabación. Verifica que el backend esté corriendo.'
      );
    } finally {
      setSavingTranscription(false);
    }
  };

  const formatRecTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleGenerateGuide = async () => {
    if (project.documents.length === 0) return;
    setIsGeneratingGuide(true);
    try {
      const res = await api.generateGuide(project.id);
      setGuide(res.guide);
    } catch {
      setGuide('⚠️ No se pudo generar la guía. Verifica que el backend esté corriendo.');
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  // ─── Math Panel Handlers ──────────────────────────────────────────────────
  const handleMathSolve = async () => {
    if (!mathExpr.trim()) return;
    setMathLoading(true);
    setMathError('');
    setMathResult(null);
    try {
      const res = await api.mathNatural(mathExpr.trim(), mathStepByStep);
      setMathResult(res);
    } catch (e: any) {
      setMathError(e?.message || 'Error al resolver la expresión');
    } finally {
      setMathLoading(false);
    }
  };

  const handleMathVerify = async () => {
    if (!mathVerifyProblem.trim() || !mathVerifyAnswer.trim()) return;
    setMathLoading(true);
    setMathError('');
    setMathVerifyResult(null);
    try {
      const res = await api.mathVerify(mathVerifyProblem.trim(), mathVerifyAnswer.trim());
      setMathVerifyResult(res);
    } catch (e: any) {
      setMathError(e?.message || 'Error al verificar');
    } finally {
      setMathLoading(false);
    }
  };

  const handleMathGraph = async () => {
    if (!mathGraphExpr.trim()) return;
    setMathLoading(true);
    setMathError('');
    setMathGraphImg('');
    try {
      const res = await api.mathGraph(
        mathGraphExpr.trim(),
        mathGraphVar || 'x',
        parseFloat(mathGraphMin) || -10,
        parseFloat(mathGraphMax) || 10
      );
      if (res.success && res.image_base64) {
        setMathGraphImg(res.image_base64);
      } else {
        setMathError(res.error || 'No se pudo generar el gráfico');
      }
    } catch (e: any) {
      setMathError(e?.message || 'Error al graficar');
    } finally {
      setMathLoading(false);
    }
  };

  const sendMathResultToChat = () => {
    if (!mathResult) return;
    const lines: string[] = [];
    if (mathResult.original_query) lines.push(`**Consulta:** ${mathResult.original_query}`);
    if (mathResult.extracted_expression)
      lines.push(`**Expresión:** \`${mathResult.extracted_expression}\``);
    if (mathResult.result_latex) lines.push(`**Resultado:** $${mathResult.result_latex}$`);
    if (mathResult.explanation) lines.push(`\n${mathResult.explanation}`);
    if (mathResult.steps?.length) {
      lines.push('\n**Pasos:**');
      mathResult.steps.forEach((s: string) => lines.push(`- ${s}`));
    }
    const content = lines.join('\n') || JSON.stringify(mathResult);
    const msg: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date().toISOString(),
      projectId: project.id,
    };
    setMessages((prev) => [...prev, msg]);
    setMathPanelMode('hidden');
    setTab('chat');
  };

  // ─── Share to Biblioteca ─────────────────────────────────────
  const BIBLIOTECA_CATEGORIES = [
    { value: 'matematicas', label: 'Matemáticas' },
    { value: 'ciencias', label: 'Ciencias' },
    { value: 'programacion', label: 'Programación' },
    { value: 'ingenieria', label: 'Ingeniería' },
    { value: 'medicina', label: 'Medicina' },
    { value: 'derecho', label: 'Derecho' },
    { value: 'negocios', label: 'Negocios' },
    { value: 'humanidades', label: 'Humanidades' },
    { value: 'idiomas', label: 'Idiomas' },
    { value: 'arte', label: 'Arte y Diseño' },
    { value: 'psicologia', label: 'Psicología' },
  ];

  const handleShareToBiblioteca = async () => {
    if (!shareForm || !sharePrompt || !project) return;
    if (!shareForm.title.trim() || !shareForm.category) return;
    setShareLoading(true);
    try {
      await api.shareToBiblioteca({
        project_id: project.id,
        doc_id: sharePrompt.docId,
        title: shareForm.title.trim(),
        description: shareForm.description,
        category: shareForm.category,
      });
      setShareSuccess(true);
      setTimeout(() => {
        setSharePrompt(null);
        setShareForm(null);
        setShareSuccess(false);
      }, 2500);
    } catch {
      setShareLoading(false);
    }
    setShareLoading(false);
  };

  return (
    <>
      <div className="page-header page-enter">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: project.color + '22',
                color: project.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              {project.icon}
            </div>
            <div>
              <h2>{project.name}</h2>
              {project.description && <p>{project.description}</p>}
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setShowProjectMenu(!showProjectMenu);
              }}
              style={{ fontSize: 18, lineHeight: 1, padding: '4px 10px' }}
            >
              &#8942;
            </button>
            {showProjectMenu && (
              <div
                className="wa-dropdown-menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 4,
                  minWidth: 180,
                  zIndex: 10,
                }}
              >
                <button
                  onClick={() => {
                    setRenameValue(project.name);
                    setShowRenameModal(true);
                    setShowProjectMenu(false);
                  }}
                >
                  {Pencil()} Renombrar
                </button>
                <button
                  className="wa-danger"
                  onClick={() => {
                    if (confirm('¿Eliminar esta asignatura y todos sus documentos?')) {
                      setShowProjectMenu(false);
                      onDelete(project.id);
                    }
                  }}
                >
                  {Trash2()} Eliminar Asignatura
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="tabs" style={{ marginTop: 16 }}>
          <button
            className={`tab ${tab === 'docs' ? 'active' : ''}`}
            onClick={() => setTab('docs')}
          >
            Documentos ({project.documents.length})
          </button>
          <button
            className={`tab ${tab === 'chat' ? 'active' : ''}`}
            onClick={() => setTab('chat')}
          >
            Chat con tus Documentos
          </button>
          <button
            className={`tab ${tab === 'guide' ? 'active' : ''}`}
            onClick={() => setTab('guide')}
          >
            Guía de Estudio
          </button>
          <button
            className={`tab ${tab === 'quiz' ? 'active' : ''}`}
            onClick={() => setTab('quiz')}
          >
            Quiz
          </button>
          <button
            className={`tab ${tab === 'flashcards' ? 'active' : ''}`}
            onClick={() => setTab('flashcards')}
          >
            Flashcards
          </button>
          <button
            className={`tab ${tab === 'summary' ? 'active' : ''}`}
            onClick={() => setTab('summary')}
          >
            Resumen
          </button>
          <button
            className={`tab ${tab === 'live' ? 'active' : ''}`}
            onClick={() => setTab('live')}
          >
            Clases en Vivo
          </button>
        </div>

        {/* Study Progress */}
        <div
          style={{
            margin: '12px 0 0',
            padding: '12px 16px',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600 }}>Progreso de Estudio</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {(() => {
                let steps = 0,
                  done = 0;
                steps++; // docs uploaded
                if (project.documents.length > 0) done++;
                steps++; // guide generated
                if (guide) done++;
                steps++; // quiz taken
                if (quizResult) done++;
                return `${done}/${steps} completado (${Math.round((done / steps) * 100)}%)`;
              })()}
            </span>
          </div>
          <div
            style={{
              height: 6,
              background: 'var(--bg-tertiary)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 3,
                background: 'var(--accent)',
                transition: 'width 0.3s',
                width: `${(() => {
                  let steps = 0,
                    done = 0;
                  steps++;
                  if (project.documents.length > 0) done++;
                  steps++;
                  if (guide) done++;
                  steps++;
                  if (quizResult) done++;
                  return Math.round((done / steps) * 100);
                })()}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className={`page-body${tab === 'chat' ? ' page-body--chat' : ''}`}>
        {tab === 'docs' && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <div className="upload-zone" onClick={handleElectronFileSelect}>
              <div className="upload-zone-icon">{FileUp({ size: 40 })}</div>
              <h3>Arrastra archivos aquí o haz click para seleccionar</h3>
              <p>PDF, Word, Excel, PowerPoint, TXT, CSV, Imágenes</p>
            </div>

            {uploadProgress !== null && (
              <div
                style={{
                  marginTop: 12,
                  padding: '14px 18px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: 'var(--text-primary)',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '75%',
                    }}
                  >
                    {uploadingFileName}
                  </span>
                  <span
                    style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}
                  >
                    {uploadProgress}%
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: 'var(--bg-secondary)',
                    borderRadius: 99,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${uploadProgress}%`,
                      background: 'var(--accent)',
                      borderRadius: 99,
                      transition: 'width 0.25s ease',
                    }}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  Conniku está procesando el archivo…
                </div>
              </div>
            )}

            {project.documents.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    setIsGeneratingGuide(true);
                    try {
                      const result = await api.uploadToStudy(project.id);
                      if (result.guide) setGuide(result.guide);
                      if (result.quiz?.questions?.length) {
                        setQuizQuestions(result.quiz.questions || []);
                        setQuizCurrentIndex(0);
                        setQuizAnswers({});
                        setQuizSubmitted(false);
                      }
                      if (result.flashcards) {
                        const cards = (
                          Array.isArray(result.flashcards) ? result.flashcards : []
                        ).map((fc: any, i: number) => ({
                          ...fc,
                          id: `fc-${Date.now()}-${i}`,
                          interval: 1,
                          ease: 2.5,
                          nextReview: new Date().toISOString(),
                        }));
                        setFlashcards(cards);
                      }
                      alert('¡Listo! Se generaron guía, quiz y flashcards. Revisa las pestañas.');
                    } catch (err: any) {
                      alert(err.message || 'Error al generar material');
                    } finally {
                      setIsGeneratingGuide(false);
                    }
                  }}
                  disabled={isGeneratingGuide}
                >
                  {isGeneratingGuide ? (
                    <>{Hourglass()} Generando...</>
                  ) : (
                    <>{Rocket()} Upload to Study — Generar Todo</>
                  )}
                </button>
              </div>
            )}

            {project.documents.length > 0 && (
              <div className="doc-list" style={{ marginTop: 20 }}>
                {project.documents.map((doc) => (
                  <div key={doc.id} className="doc-item">
                    <div className={`doc-icon ${doc.type || getFileType(doc.name)}`}>
                      {DOC_ICONS[doc.type] || DOC_ICONS[getFileType(doc.name)] || 'DOC'}
                    </div>
                    <div className="doc-info">
                      <div className="doc-name">{doc.name}</div>
                      <div className="doc-meta">
                        {doc.size > 0 ? formatSize(doc.size) + ' • ' : ''}
                        {doc.uploadedAt && !isNaN(new Date(doc.uploadedAt).getTime())
                          ? new Date(doc.uploadedAt).toLocaleDateString('es-CL')
                          : 'Sin fecha'}
                      </div>
                    </div>
                    <span
                      className={`doc-status ${doc.processed ? 'processed' : (doc as any).uploadError ? 'error' : 'processing'}`}
                    >
                      {doc.processed
                        ? 'Procesado'
                        : (doc as any).uploadError
                          ? 'Error'
                          : 'Pendiente'}
                    </span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteDoc(doc.id)}
                      style={{ marginLeft: 8 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Videos / YouTube */}
            <div style={{ marginTop: 28 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <h3 style={{ margin: 0 }}>{Film()} Videos y Clases</h3>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowVideoModal(true)}
                >
                  + Agregar Video
                </button>
              </div>

              {showVideoModal && (
                <div className="u-card" style={{ padding: 16, marginBottom: 16 }}>
                  <h4 style={{ marginTop: 0 }}>Agregar video o clase</h4>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <input
                      className="form-input"
                      style={{ flex: 1 }}
                      placeholder="Pega un link de YouTube..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddYoutube()}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleAddYoutube}
                      disabled={addingVideo}
                    >
                      {addingVideo ? '...' : 'Agregar'}
                    </button>
                  </div>
                  <div
                    style={{
                      textAlign: 'center',
                      color: 'var(--text-muted)',
                      fontSize: 13,
                      margin: '8px 0',
                    }}
                  >
                    — o sube un archivo de video/audio —
                  </div>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept=".mp4,.mp3,.wav,.m4a,.webm,.ogg,.avi,.mkv"
                    style={{ display: 'none' }}
                    onChange={handleVideoUpload}
                  />
                  <button
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                    onClick={() => videoInputRef.current?.click()}
                    disabled={addingVideo}
                  >
                    {FolderOpen()} Seleccionar archivo
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ marginTop: 8 }}
                    onClick={() => setShowVideoModal(false)}
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {videos.length > 0 ? (
                <div className="doc-list">
                  {videos.map((v) => (
                    <div key={v.id} className="doc-item">
                      <div
                        className="doc-icon"
                        style={{
                          background: 'var(--accent-primary)22',
                          color: 'var(--accent-primary)',
                        }}
                      >
                        {v.sourceType === 'youtube' ? PlayCircle() : Video()}
                      </div>
                      <div className="doc-info">
                        <div className="doc-name">{v.title || 'Video sin título'}</div>
                        <div className="doc-meta">
                          {v.sourceType === 'youtube' ? 'YouTube' : 'Archivo local'}
                        </div>
                      </div>
                      <span
                        className={`doc-status ${v.status === 'done' ? 'processed' : 'processing'}`}
                      >
                        {v.status === 'done'
                          ? 'Transcrito'
                          : v.status === 'processing'
                            ? 'Procesando...'
                            : v.status === 'error'
                              ? 'Error'
                              : 'Pendiente'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                !showVideoModal && (
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
                    Agrega videos de clases o YouTube para incluirlos en el chat
                  </p>
                )
              )}
            </div>
          </>
        )}

        {tab === 'chat' && (
          <div className="chat-container">
            {/* Header fijo */}
            <div className="chat-header">
              <div className="chat-header-avatar">C</div>
              <div className="chat-header-info">
                <div className="chat-header-name">Conniku · {project.name}</div>
                <div className="chat-header-sub">
                  {project.documents.length}{' '}
                  {project.documents.length === 1 ? 'documento activo' : 'documentos activos'}
                  {socraticMode && (
                    <span style={{ marginLeft: 6, color: 'var(--accent-blue)' }}>· Socrático</span>
                  )}
                </div>
              </div>
              <div className="chat-header-actions">
                {messages.length > 0 && (
                  <>
                    <button
                      className="chat-action-btn chat-action-btn--danger"
                      onClick={handleClearChat}
                      title="Limpiar conversación"
                    >
                      {Trash2()} Limpiar
                    </button>
                    <div className="chat-action-sep" />
                    <span className="chat-action-label">Exportar</span>
                    <button
                      className="chat-action-btn"
                      onClick={handleExportChatWord}
                      title="Exportar chat completo a Word (.docx)"
                    >
                      {FileText()} Word
                    </button>
                    <button
                      className="chat-action-btn"
                      onClick={handleExportChatExcel}
                      title="Exportar chat a Excel/CSV"
                    >
                      {Download()} Excel
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Mensajes con scroll interno */}
            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="empty-state" style={{ flex: 1 }}>
                  <div className="empty-state-icon">{MessageSquare({ size: 36 })}</div>
                  <h3>Chatea sobre tus documentos</h3>
                  <p>Hazme preguntas sobre el material de {project.name}</p>
                </div>
              )}
              {messages.map((msg) => {
                const ts = msg.timestamp
                  ? new Date(msg.timestamp).toLocaleTimeString('es-CL', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '';
                return (
                  <div key={msg.id} className={`chat-msg-row ${msg.role}`}>
                    {msg.role === 'assistant' && <div className="chat-msg-avatar">C</div>}
                    <div className="chat-msg-col">
                      <div className={`chat-message ${msg.role}`}>
                        <ChatMessageRenderer content={msg.content} />
                      </div>
                      <div className="chat-msg-meta">
                        {ts && <span className="chat-msg-time">{ts}</span>}
                        {msg.role === 'assistant' && !msg.content.startsWith('⚠️') && (
                          <button
                            className="btn btn-secondary btn-xs chat-export-btn"
                            onClick={() => handleExportDocx(msg.content)}
                            title="Descargar como Word"
                          >
                            {Download()} Word
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="chat-msg-row assistant">
                  <div className="chat-msg-avatar">C</div>
                  <div className="chat-msg-col">
                    <div className="chat-message assistant">
                      <div className="loading-dots">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input fijo al fondo */}
            <div className="chat-input-area">
              <div className="chat-input-toolbar">
                <button
                  className={`btn btn-xs ${socraticMode ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSocraticMode(!socraticMode)}
                  title={
                    socraticMode
                      ? 'Socrático ON — haz click para desactivar'
                      : 'Directo — haz click para modo socrático'
                  }
                >
                  {Brain()} {socraticMode ? 'Socrático' : 'Directo'}
                </button>
                <button
                  className="btn btn-xs btn-secondary"
                  title="Escanear problema con cámara"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.capture = 'environment';
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        const base64 = reader.result as string;
                        setIsLoading(true);
                        setChatInput('');
                        const userMsg: ChatMessage = {
                          id: Date.now().toString(),
                          role: 'user',
                          content: 'Escaneando problema...',
                          timestamp: new Date().toISOString(),
                          projectId: project.id,
                        };
                        setMessages((prev) => [...prev, userMsg]);
                        try {
                          const result = await api.scanAndSolve(base64);
                          const assistantMsg: ChatMessage = {
                            id: (Date.now() + 1).toString(),
                            role: 'assistant',
                            content: result.solution,
                            timestamp: new Date().toISOString(),
                            projectId: project.id,
                          };
                          setMessages((prev) => [...prev, assistantMsg]);
                        } catch {
                          setMessages((prev) => [
                            ...prev,
                            {
                              id: (Date.now() + 1).toString(),
                              role: 'assistant',
                              content: '⚠️ No se pudo procesar la imagen.',
                              timestamp: new Date().toISOString(),
                              projectId: project.id,
                            },
                          ]);
                        }
                        setIsLoading(false);
                      };
                      reader.readAsDataURL(file);
                    };
                    input.click();
                  }}
                >
                  {Camera()} Escanear
                </button>
                <button
                  className={`btn btn-xs ${mathPanelMode !== 'hidden' ? 'btn-primary' : 'btn-secondary'}`}
                  title="Motor de Cálculo — resolver, verificar y graficar"
                  onClick={() => setMathPanelMode((p) => (p === 'hidden' ? 'solve' : 'hidden'))}
                >
                  {SquareFunction()} Cálculo
                </button>
              </div>

              {/* ─── Math Panel ─────────────────────────────────────── */}
              {mathPanelMode !== 'hidden' && (
                <div
                  className="math-panel card"
                  style={{
                    margin: '0 0 8px 0',
                    padding: 16,
                    background: 'var(--bg-secondary)',
                    borderRadius: 10,
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {/* Tab selector */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                    {(['solve', 'verify', 'graph'] as const).map((m) => (
                      <button
                        key={m}
                        className={`btn btn-xs ${mathPanelMode === m ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => {
                          setMathPanelMode(m);
                          setMathError('');
                        }}
                      >
                        {m === 'solve'
                          ? '∑ Resolver'
                          : m === 'verify'
                            ? '✓ Verificar'
                            : '📈 Graficar'}
                      </button>
                    ))}
                    <button
                      className="btn btn-xs btn-secondary"
                      style={{ marginLeft: 'auto' }}
                      onClick={() => setMathPanelMode('hidden')}
                      title="Cerrar"
                    >
                      ✕
                    </button>
                  </div>

                  {/* ── Solve mode ── */}
                  {mathPanelMode === 'solve' && (
                    <div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                        <input
                          className="form-control"
                          style={{ flex: 1, fontSize: 14 }}
                          placeholder="ej: derivar x**3 + 2*x, integral de sin(x), resolver x**2=4"
                          value={mathExpr}
                          onChange={(e) => setMathExpr(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleMathSolve()}
                        />
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={handleMathSolve}
                          disabled={mathLoading || !mathExpr.trim()}
                        >
                          {mathLoading ? '...' : 'Resolver'}
                        </button>
                      </div>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={mathStepByStep}
                          onChange={(e) => setMathStepByStep(e.target.checked)}
                        />
                        Mostrar pasos
                      </label>
                      {mathError && (
                        <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 8 }}>
                          {mathError}
                        </p>
                      )}
                      {mathResult && (
                        <div
                          style={{
                            marginTop: 12,
                            padding: 12,
                            background: 'var(--bg-primary)',
                            borderRadius: 8,
                            fontSize: 13,
                          }}
                        >
                          {mathResult.extracted_expression && (
                            <p
                              style={{
                                color: 'var(--text-secondary)',
                                fontSize: 11,
                                marginBottom: 4,
                              }}
                            >
                              Expresión: <code>{mathResult.extracted_expression}</code>
                            </p>
                          )}
                          {mathResult.result_latex && (
                            <p style={{ fontWeight: 600, marginBottom: 8 }}>
                              Resultado:{' '}
                              <span style={{ color: 'var(--accent)' }}>
                                ${mathResult.result_latex}$
                              </span>
                            </p>
                          )}
                          {mathResult.explanation && (
                            <p style={{ lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                              {mathResult.explanation}
                            </p>
                          )}
                          {mathResult.steps?.length > 0 && mathStepByStep && (
                            <div style={{ marginTop: 8 }}>
                              <p style={{ fontWeight: 600, marginBottom: 4, fontSize: 12 }}>
                                Pasos:
                              </p>
                              <ol style={{ paddingLeft: 16, fontSize: 12, lineHeight: 1.6 }}>
                                {mathResult.steps.map((s: string, i: number) => (
                                  <li key={i}>{s}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                          {mathResult.graph_base64 && (
                            <img
                              src={`data:image/png;base64,${mathResult.graph_base64}`}
                              alt="Gráfico"
                              style={{ width: '100%', borderRadius: 6, marginTop: 8 }}
                            />
                          )}
                          {mathResult.error && (
                            <p style={{ color: 'var(--accent-orange)', fontSize: 12 }}>
                              ⚠️ {mathResult.error}
                            </p>
                          )}
                          <button
                            className="btn btn-secondary btn-xs"
                            style={{ marginTop: 8 }}
                            onClick={sendMathResultToChat}
                          >
                            Enviar al chat
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Verify mode ── */}
                  {mathPanelMode === 'verify' && (
                    <div>
                      <input
                        className="form-control"
                        style={{ marginBottom: 6, fontSize: 14 }}
                        placeholder="Problema original (ej: derivar x**2)"
                        value={mathVerifyProblem}
                        onChange={(e) => setMathVerifyProblem(e.target.value)}
                      />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          className="form-control"
                          style={{ flex: 1, fontSize: 14 }}
                          placeholder="Tu respuesta (ej: 2*x)"
                          value={mathVerifyAnswer}
                          onChange={(e) => setMathVerifyAnswer(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleMathVerify()}
                        />
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={handleMathVerify}
                          disabled={
                            mathLoading || !mathVerifyProblem.trim() || !mathVerifyAnswer.trim()
                          }
                        >
                          {mathLoading ? '...' : 'Verificar'}
                        </button>
                      </div>
                      {mathError && (
                        <p style={{ color: 'var(--accent-red)', fontSize: 12, marginTop: 8 }}>
                          {mathError}
                        </p>
                      )}
                      {mathVerifyResult && (
                        <div
                          style={{
                            marginTop: 12,
                            padding: 12,
                            borderRadius: 8,
                            fontSize: 13,
                            background: mathVerifyResult.correct ? '#16a34a22' : '#dc262622',
                            border: `1px solid ${mathVerifyResult.correct ? '#16a34a' : '#dc2626'}44`,
                          }}
                        >
                          <p style={{ fontWeight: 700, marginBottom: 6 }}>
                            {mathVerifyResult.correct ? '✅ ¡Correcto!' : '❌ Incorrecto'}
                          </p>
                          {mathVerifyResult.feedback && (
                            <p style={{ lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                              {mathVerifyResult.feedback}
                            </p>
                          )}
                          {mathVerifyResult.correct_result?.result_latex && (
                            <p style={{ marginTop: 8, fontSize: 12 }}>
                              Respuesta correcta:{' '}
                              <strong>${mathVerifyResult.correct_result.result_latex}$</strong>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Graph mode ── */}
                  {mathPanelMode === 'graph' && (
                    <div>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                        <input
                          className="form-control"
                          style={{ flex: 3, fontSize: 14 }}
                          placeholder="Función (ej: sin(x), x**2 - 3*x + 2)"
                          value={mathGraphExpr}
                          onChange={(e) => setMathGraphExpr(e.target.value)}
                        />
                        <input
                          className="form-control"
                          style={{ width: 60, fontSize: 14 }}
                          placeholder="var"
                          value={mathGraphVar}
                          onChange={(e) => setMathGraphVar(e.target.value)}
                          title="Variable"
                        />
                      </div>
                      <div
                        style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}
                      >
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>x:</span>
                        <input
                          className="form-control"
                          style={{ width: 70, fontSize: 13 }}
                          placeholder="min"
                          value={mathGraphMin}
                          onChange={(e) => setMathGraphMin(e.target.value)}
                        />
                        <span style={{ fontSize: 12 }}>a</span>
                        <input
                          className="form-control"
                          style={{ width: 70, fontSize: 13 }}
                          placeholder="max"
                          value={mathGraphMax}
                          onChange={(e) => setMathGraphMax(e.target.value)}
                        />
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={handleMathGraph}
                          disabled={mathLoading || !mathGraphExpr.trim()}
                          style={{ marginLeft: 4 }}
                        >
                          {mathLoading ? '...' : 'Graficar'}
                        </button>
                      </div>
                      {mathError && (
                        <p style={{ color: 'var(--accent-red)', fontSize: 12 }}>{mathError}</p>
                      )}
                      {mathGraphImg && (
                        <img
                          src={`data:image/png;base64,${mathGraphImg}`}
                          alt="Gráfico"
                          style={{ width: '100%', borderRadius: 8, marginTop: 4 }}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="chat-input-row">
                <textarea
                  className="chat-input"
                  placeholder={`Pregunta algo sobre ${project.name}...`}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={1}
                />
                <button
                  className="chat-send-btn"
                  onClick={handleSendMessage}
                  disabled={isLoading}
                  title="Enviar (Enter)"
                >
                  ➤
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'guide' && (
          <>
            {!guide ? (
              <div className="empty-state">
                <div className="empty-state-icon">{BookOpen({ size: 40 })}</div>
                <h3>Genera una guía de estudio</h3>
                <p>
                  Conniku analizará todos los documentos de {project.name} y creará material de
                  estudio personalizado
                </p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 16 }}
                  onClick={handleGenerateGuide}
                  disabled={isGeneratingGuide || project.documents.length === 0}
                >
                  {isGeneratingGuide ? 'Generando...' : 'Generar Guía de Estudio'}
                </button>
                {project.documents.length === 0 && (
                  <p style={{ marginTop: 8, color: 'var(--accent-orange)', fontSize: 13 }}>
                    Sube documentos primero para generar la guía
                  </p>
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                  <button className="btn btn-secondary btn-sm" onClick={handleGenerateGuide}>
                    Regenerar
                  </button>
                </div>
                <div className="guide-content card" dangerouslySetInnerHTML={{ __html: guide }} />
              </div>
            )}
          </>
        )}

        {tab === 'quiz' && (
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
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
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
                <div className="u-card" style={{ padding: 24, marginBottom: 20 }}>
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
                            borderRadius: 'var(--radius-sm)',
                            border: sel
                              ? '2px solid var(--accent)'
                              : '1px solid var(--border-color)',
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
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <button
                    className="btn btn-secondary"
                    disabled={diagIdx === 0}
                    onClick={() => setDiagIdx((i) => i - 1)}
                  >
                    ← Anterior
                  </button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {diagIdx < diagQs.length - 1 ? (
                      <button className="btn btn-primary" onClick={() => setDiagIdx((i) => i + 1)}>
                        Siguiente →
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        disabled={Object.keys(diagAns).length < diagQs.length}
                        title={
                          Object.keys(diagAns).length < diagQs.length
                            ? 'Responde todas las preguntas primero'
                            : ''
                        }
                        onClick={async () => {
                          try {
                            const res = await api.submitDiagnostic(project.id, diagAns, diagQs);
                            setDiagRes(res);
                            setDiagMode('done');
                            // refrescar promedio y programados
                            const [avg, sched] = await Promise.all([
                              api.getSubjectAverage(project.id).catch(() => null),
                              api.getScheduledQuizzes(project.id).catch(() => []),
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
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
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
                <div className="u-card" style={{ padding: 24, marginBottom: 20 }}>
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
                              borderRadius: 'var(--radius-sm)',
                              border: sel ? '2px solid #8B5CF6' : '1px solid var(--border-color)',
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
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <button
                    className="btn btn-secondary"
                    disabled={schedActive.idx === 0}
                    onClick={() =>
                      setSchedActive((prev) => (prev ? { ...prev, idx: prev.idx - 1 } : prev))
                    }
                  >
                    ← Anterior
                  </button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {schedActive.idx < schedActive.questions.length - 1 ? (
                      <button
                        className="btn btn-primary"
                        onClick={() =>
                          setSchedActive((prev) => (prev ? { ...prev, idx: prev.idx + 1 } : prev))
                        }
                      >
                        Siguiente →
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        disabled={
                          Object.keys(schedActive.answers).length < schedActive.questions.length
                        }
                        title={
                          Object.keys(schedActive.answers).length < schedActive.questions.length
                            ? 'Responde todas las preguntas primero'
                            : ''
                        }
                        onClick={async () => {
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
                              api.getSubjectAverage(project.id).catch(() => null),
                              api.getScheduledQuizzes(project.id).catch(() => []),
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
              </div>
            )}

            {/* ── RESULTADO QUIZ PROGRAMADO ── */}
            {schedActive?.mode === 'done' && schedActive.result && (
              <div>
                <div
                  className="u-card"
                  style={{ padding: 24, marginBottom: 20, textAlign: 'center' }}
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
                  <button className="btn btn-primary" onClick={() => setSchedActive(null)}>
                    ← Volver
                  </button>
                </div>
              </div>
            )}

            {/* ── SETUP: sin quiz activo ── */}
            {quizQuestions.length === 0 &&
              !isGeneratingQuiz &&
              diagMode !== 'active' &&
              schedActive?.mode !== 'active' &&
              schedActive?.mode !== 'done' && (
                <div>
                  {/* ── Barra de promedio ── */}
                  {qsAvg && qsAvg.quizCount > 0 && (
                    <div
                      className="u-card"
                      style={{
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
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
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
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxWidth: 180 }}>
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

                  {/* ── Diagnóstico Inicial ── */}
                  {diagMode === 'idle' && (
                    <div
                      className="u-card"
                      style={{
                        padding: 20,
                        marginBottom: 16,
                        borderLeft: '4px solid var(--accent)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                      }}
                    >
                      <div style={{ fontSize: 32, flexShrink: 0 }}>🔬</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>Prueba Diagnóstica</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          15 preguntas para evaluar tu nivel inicial en {project.name}. No requiere
                          documentos.
                        </div>
                      </div>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flexShrink: 0 }}
                        onClick={async () => {
                          setDiagMode('loading');
                          try {
                            const res = await api.generateDiagnostic(project.id, project.name, 16);
                            setDiagQs(res.questions || []);
                            setDiagIdx(0);
                            setDiagAns({});
                            setDiagMode('active');
                            // también guardar quizzes programados si los devuelve
                            if (res.scheduledQuizzes?.length && qsSched.length === 0) {
                              setQsSched(res.scheduledQuizzes);
                            }
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
                      className="u-card"
                      style={{
                        padding: 20,
                        marginBottom: 16,
                        borderLeft: '4px solid var(--accent)',
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
                          Creando preguntas personalizadas para {project.name}
                        </div>
                      </div>
                      <span
                        className="spinner"
                        style={{
                          width: 20,
                          height: 20,
                          border: '2px solid var(--border)',
                          borderTop: '2px solid var(--accent)',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                          flexShrink: 0,
                        }}
                      />
                    </div>
                  )}
                  {diagMode === 'done' && diagRes && (
                    <div
                      className="u-card"
                      style={{
                        padding: 20,
                        marginBottom: 16,
                        borderLeft: `4px solid ${diagRes.score >= 7 ? 'var(--accent-green)' : diagRes.score >= 5 ? 'var(--accent-orange)' : 'var(--accent-red)'}`,
                      }}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}
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

                  {/* ── Quizzes Programados ── */}
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
                              className="u-card"
                              style={{
                                padding: 16,
                                background: bg,
                                border: `1px solid ${color}30`,
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
                                  style={{ fontSize: 16, fontWeight: 700, color, marginBottom: 8 }}
                                >
                                  {sq.score}/10
                                </div>
                              )}
                              {(st === 'available' || st === 'overdue') && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  style={{
                                    width: '100%',
                                    background: '#8B5CF6',
                                    borderColor: '#8B5CF6',
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

                  {/* ── Separador Quiz Libre ── */}
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

                  {/* Config card */}
                  <div className="u-card" style={{ padding: 24, marginBottom: 20 }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}
                    >
                      <span style={{ fontSize: 28 }}>{Brain({ size: 28 })}</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: 16 }}>Quiz de {project.name}</h3>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                          {project.documents.length} documento
                          {project.documents.length !== 1 ? 's' : ''} disponible
                          {project.documents.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {project.documents.length === 0 ? (
                      <div
                        style={{
                          textAlign: 'center',
                          padding: '16px 0',
                          color: 'var(--accent-orange)',
                          fontSize: 14,
                        }}
                      >
                        {AlertTriangle()} Sube al menos un documento para generar un quiz.
                        <div style={{ marginTop: 10 }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setTab('docs')}
                          >
                            Ir a Documentos →
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Documentos que se usarán */}
                        <div
                          style={{
                            marginBottom: 16,
                            padding: '10px 12px',
                            background: 'var(--bg-secondary)',
                            borderRadius: 8,
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: 'var(--text-muted)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              marginBottom: 6,
                            }}
                          >
                            Material incluido en el quiz
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {project.documents.map((doc) => (
                              <div
                                key={doc.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  fontSize: 12,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: '1px 5px',
                                    borderRadius: 4,
                                    background: 'var(--accent)22',
                                    color: 'var(--accent)',
                                    flexShrink: 0,
                                  }}
                                >
                                  {(doc.type || 'DOC').toUpperCase().slice(0, 3)}
                                </span>
                                <span
                                  style={{
                                    color: 'var(--text-primary)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {doc.name}
                                </span>
                                {doc.processed && (
                                  <span
                                    style={{
                                      marginLeft: 'auto',
                                      color: 'var(--accent-green)',
                                      fontSize: 10,
                                      flexShrink: 0,
                                    }}
                                  >
                                    ✓
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Dificultad */}
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

                        {/* Número de preguntas */}
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
                          className="btn btn-primary"
                          style={{ width: '100%', padding: '12px', fontSize: 15 }}
                          onClick={async () => {
                            setIsGeneratingQuiz(true);
                            try {
                              const data = await api.generateQuiz(
                                project.id,
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
                          {Sparkles()} Generar Quiz · {quizNumQuestions} preguntas
                        </button>
                      </>
                    )}
                  </div>

                  {/* Historial de quizzes de esta asignatura */}
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
                              className="u-card"
                              style={{
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
                                  style={{ fontSize: 14, fontWeight: 800, color, lineHeight: 1 }}
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
                                  style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}
                                >
                                  {new Date(h.completedAt).toLocaleDateString('es-CL', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
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

            {/* ── LOADING ── */}
            {isGeneratingQuiz && (
              <div className="empty-state">
                <div className="empty-state-icon" style={{ animation: 'pulse 1.5s infinite' }}>
                  {Brain({ size: 40 })}
                </div>
                <h3>Generando quiz...</h3>
                <p>Analizando los documentos de {project.name}</p>
              </div>
            )}

            {/* ── PREGUNTAS ── */}
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
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>
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

                <div className="u-card" style={{ padding: 24, marginBottom: 20 }}>
                  <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 16, lineHeight: 1.5 }}>
                    {quizQuestions[quizCurrentIndex].question}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {quizQuestions[quizCurrentIndex].options.map((option: string, idx: number) => {
                      const isSelected = quizAnswers[quizCurrentIndex] === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() =>
                            setQuizAnswers((prev) => ({ ...prev, [quizCurrentIndex]: idx }))
                          }
                          style={{
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-sm)',
                            border: isSelected
                              ? '2px solid var(--accent)'
                              : '1px solid var(--border-color)',
                            background: isSelected ? 'rgba(99,102,241,0.1)' : 'var(--bg-secondary)',
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
                    })}
                  </div>
                </div>

                <div
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <button
                    className="btn btn-secondary"
                    disabled={quizCurrentIndex === 0}
                    onClick={() => setQuizCurrentIndex((i) => i - 1)}
                  >
                    ← Anterior
                  </button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {quizCurrentIndex < quizQuestions.length - 1 ? (
                      <button
                        className="btn btn-primary"
                        onClick={() => setQuizCurrentIndex((i) => i + 1)}
                      >
                        Siguiente →
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                        title={
                          Object.keys(quizAnswers).length < quizQuestions.length
                            ? 'Responde todas las preguntas primero'
                            : ''
                        }
                        onClick={() => {
                          let correct = 0;
                          quizQuestions.forEach((q: any, i: number) => {
                            if (quizAnswers[i] === q.correctAnswer) correct++;
                          });
                          setQuizScore(correct);
                          setQuizSubmitted(true);
                          setQuizResult({ score: correct, total: quizQuestions.length });
                          // Guardar en historial
                          try {
                            const entry = {
                              projectId: project.id,
                              projectName: project.name,
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
                              updated.filter((h: any) => h.projectId === project.id).slice(0, 8)
                            );
                          } catch {}
                        }}
                      >
                        Ver Resultados
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── RESULTADOS ── */}
            {quizSubmitted && quizQuestions.length > 0 && (
              <div>
                <div
                  className="u-card"
                  style={{ padding: 24, marginBottom: 20, textAlign: 'center' }}
                >
                  <div className="empty-state-icon">
                    {quizScore / quizQuestions.length >= 0.7
                      ? '🎉'
                      : quizScore / quizQuestions.length >= 0.4
                        ? BookOpen({ size: 40 })
                        : Dumbbell({ size: 40 })}
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
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                    {quizScore / quizQuestions.length >= 0.7
                      ? '¡Excelente trabajo! Dominas bien el material.'
                      : quizScore / quizQuestions.length >= 0.4
                        ? 'Buen intento. Repasa los temas donde fallaste.'
                        : 'Necesitas repasar más. ¡No te rindas!'}
                  </p>
                  <div
                    style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}
                  >
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setQuizCurrentIndex(0);
                        setQuizAnswers({});
                        setQuizSubmitted(false);
                        setQuizScore(0);
                        setQuizResult(null);
                      }}
                    >
                      {RotateCcw()} Reintentar
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setQuizQuestions([]);
                        setQuizCurrentIndex(0);
                        setQuizAnswers({});
                        setQuizSubmitted(false);
                        setQuizScore(0);
                        setQuizResult(null);
                      }}
                    >
                      Cambiar config
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={async () => {
                        setQuizQuestions([]);
                        setQuizCurrentIndex(0);
                        setQuizAnswers({});
                        setQuizSubmitted(false);
                        setQuizScore(0);
                        setQuizResult(null);
                        setIsGeneratingQuiz(true);
                        try {
                          const data = await api.generateQuiz(
                            project.id,
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
                      {Sparkles()} Nuevo Quiz
                    </button>
                  </div>
                </div>

                <h3 style={{ marginBottom: 12 }}>Detalle de Respuestas</h3>
                {quizQuestions.map((q: any, i: number) => {
                  const userAnswer = quizAnswers[i];
                  const isCorrect = userAnswer === q.correctAnswer;
                  return (
                    <div
                      key={i}
                      className="u-card"
                      style={{
                        padding: 20,
                        marginBottom: 12,
                        borderLeft: `4px solid ${isCorrect ? 'var(--success, #22c55e)' : 'var(--danger, #ef4444)'}`,
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
                            borderRadius: 'var(--radius-sm)',
                            marginLeft: 12,
                            whiteSpace: 'nowrap',
                            background: isCorrect ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                            color: isCorrect ? 'var(--success, #22c55e)' : 'var(--danger, #ef4444)',
                          }}
                        >
                          {isCorrect ? '✓ Correcta' : '✗ Incorrecta'}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, marginBottom: 8 }}>
                        <span style={{ color: 'var(--text-muted)' }}>Tu respuesta: </span>
                        <span
                          style={{
                            color: isCorrect ? 'var(--success, #22c55e)' : 'var(--danger, #ef4444)',
                            fontWeight: 500,
                          }}
                        >
                          {String.fromCharCode(65 + userAnswer)}. {q.options[userAnswer]}
                        </span>
                      </div>
                      {!isCorrect && (
                        <div style={{ fontSize: 13, marginBottom: 8 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Respuesta correcta: </span>
                          <span style={{ color: 'var(--success, #22c55e)', fontWeight: 500 }}>
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
                            borderRadius: 'var(--radius-sm)',
                            marginTop: 8,
                            lineHeight: 1.5,
                          }}
                        >
                          {Lightbulb()} {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === 'flashcards' && (
          <>
            {flashcards.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">{Brain({ size: 40 })}</div>
                <h3>Flashcards con Repetición Espaciada</h3>
                <p>Genera flashcards inteligentes que se adaptan a tu ritmo de aprendizaje</p>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 16,
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: 12,
                      padding: '12px 16px',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>🧠</span> Algoritmo FSRS
                  </div>
                  <div
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: 12,
                      padding: '12px 16px',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>⌨️</span> Atajos de teclado
                  </div>
                  <div
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: 12,
                      padding: '12px 16px',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 20 }}>📊</span> Seguimiento de progreso
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 20 }}
                  onClick={async () => {
                    if (project.documents.length === 0) return;
                    setIsGeneratingFlashcards(true);
                    try {
                      const result = await api.generateFlashcards(project.id);
                      const cards = (Array.isArray(result) ? result : []).map(
                        (fc: any, i: number) => ({
                          ...fc,
                          id: `fc-${Date.now()}-${i}`,
                          interval: 1,
                          ease: 2.5,
                          repetitions: 0,
                          nextReview: new Date().toISOString(),
                          reviewed: false,
                        })
                      );
                      setFlashcards(cards);
                      setFlashcardIndex(0);
                    } catch (err: any) {
                      alert(err.message || 'Error al generar flashcards');
                    } finally {
                      setIsGeneratingFlashcards(false);
                    }
                  }}
                  disabled={isGeneratingFlashcards || project.documents.length === 0}
                >
                  {isGeneratingFlashcards ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        className="spinner"
                        style={{
                          width: 16,
                          height: 16,
                          border: '2px solid #fff3',
                          borderTop: '2px solid #fff',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                      Generando flashcards...
                    </span>
                  ) : (
                    'Generar Flashcards'
                  )}
                </button>
                {project.documents.length === 0 && (
                  <p style={{ marginTop: 8, color: 'var(--accent-orange)', fontSize: 13 }}>
                    Sube documentos primero
                  </p>
                )}
              </div>
            ) : (
              <div
                style={{ maxWidth: 640, margin: '0 auto' }}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    setShowFlashcardAnswer(!showFlashcardAnswer);
                  } else if (e.key === 'ArrowLeft' && !showFlashcardAnswer) {
                    setFlashcardIndex(Math.max(0, flashcardIndex - 1));
                    setShowFlashcardAnswer(false);
                  } else if (e.key === 'ArrowRight' && !showFlashcardAnswer) {
                    setFlashcardIndex(Math.min(flashcards.length - 1, flashcardIndex + 1));
                    setShowFlashcardAnswer(false);
                  } else if (showFlashcardAnswer && ['1', '2', '3', '4'].includes(e.key)) {
                    const qualityMap: Record<string, number> = { '1': 0, '2': 2, '3': 3, '4': 5 };
                    const quality = qualityMap[e.key];
                    const card = { ...flashcards[flashcardIndex] };
                    if (quality < 3) {
                      card.repetitions = 0;
                      card.interval = 1;
                    } else {
                      if (card.repetitions === 0) card.interval = 1;
                      else if (card.repetitions === 1) card.interval = 3;
                      else card.interval = Math.round(card.interval * card.ease);
                      card.repetitions = (card.repetitions || 0) + 1;
                    }
                    card.ease = Math.max(
                      1.3,
                      card.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
                    );
                    const next = new Date();
                    next.setDate(next.getDate() + card.interval);
                    card.nextReview = next.toISOString();
                    card.reviewed = true;
                    const updated = [...flashcards];
                    updated[flashcardIndex] = card;
                    const now = new Date();
                    const dueCards = updated.filter((c) => new Date(c.nextReview) <= now);
                    setFlashcards(updated);
                    setShowFlashcardAnswer(false);
                    if (flashcardIndex < flashcards.length - 1)
                      setFlashcardIndex(flashcardIndex + 1);
                    else if (dueCards.length > 0) setFlashcardIndex(updated.indexOf(dueCards[0]));
                    else {
                      api
                        .logStudySession({
                          duration_seconds: flashcards.length * 15,
                          project_id: project.id,
                          activity_type: 'flashcards',
                        })
                        .catch(() => {});
                      setFlashcardIndex(0);
                    }
                  }
                }}
              >
                {/* Progress bar + stats */}
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 600 }}>
                      Tarjeta {flashcardIndex + 1} / {flashcards.length}
                    </span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {flashcards.filter((c: any) => c.reviewed).length} revisadas
                      </span>
                      <button
                        className="btn btn-secondary btn-xs"
                        onClick={() => {
                          setFlashcards([]);
                          setFlashcardIndex(0);
                        }}
                      >
                        Reiniciar
                      </button>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div
                    style={{
                      height: 4,
                      background: 'var(--border-color)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 2,
                        transition: 'width 0.3s ease',
                        width: `${((flashcardIndex + 1) / flashcards.length) * 100}%`,
                        background: 'linear-gradient(90deg, var(--accent), #8b5cf6)',
                      }}
                    />
                  </div>
                  {/* Mini card indicators */}
                  <div style={{ display: 'flex', gap: 3, marginTop: 8, flexWrap: 'wrap' }}>
                    {flashcards.map((_: any, i: number) => (
                      <div
                        key={i}
                        onClick={() => {
                          setFlashcardIndex(i);
                          setShowFlashcardAnswer(false);
                        }}
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          background:
                            i === flashcardIndex
                              ? 'var(--accent)'
                              : flashcards[i].reviewed
                                ? '#22c55e'
                                : 'var(--border-color)',
                          transform: i === flashcardIndex ? 'scale(1.4)' : 'scale(1)',
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* 3D Flip Card */}
                <div style={{ perspective: 1000, marginBottom: 20 }}>
                  <div
                    onClick={() => setShowFlashcardAnswer(!showFlashcardAnswer)}
                    style={{
                      position: 'relative',
                      width: '100%',
                      minHeight: 280,
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: showFlashcardAnswer ? 'rotateY(180deg)' : 'rotateY(0)',
                      cursor: 'pointer',
                    }}
                  >
                    {/* Front */}
                    <div
                      style={{
                        position: 'absolute',
                        width: '100%',
                        minHeight: 280,
                        backfaceVisibility: 'hidden',
                        background:
                          'linear-gradient(135deg, var(--bg-secondary), var(--bg-primary))',
                        border: '2px solid var(--border-color)',
                        borderRadius: 20,
                        padding: '32px 28px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 16,
                          left: 20,
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          fontWeight: 600,
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: 'var(--accent)22',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            color: 'var(--accent)',
                          }}
                        >
                          ?
                        </span>
                        Pregunta
                      </div>
                      <div
                        style={{ fontSize: 19, fontWeight: 600, lineHeight: 1.6, maxWidth: '90%' }}
                      >
                        {flashcards[flashcardIndex]?.front}
                      </div>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 16,
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <span style={{ opacity: 0.7 }}>Espacio</span> o click para voltear
                      </div>
                    </div>
                    {/* Back */}
                    <div
                      style={{
                        position: 'absolute',
                        width: '100%',
                        minHeight: 280,
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        background: 'linear-gradient(135deg, var(--accent)08, var(--accent)15)',
                        border: '2px solid var(--accent)33',
                        borderRadius: 20,
                        padding: '32px 28px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        boxShadow: '0 8px 32px var(--accent)11',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          top: 16,
                          left: 20,
                          fontSize: 11,
                          color: 'var(--accent)',
                          fontWeight: 600,
                          letterSpacing: 1,
                          textTransform: 'uppercase',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: 'var(--accent)22',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                          }}
                        >
                          !
                        </span>
                        Respuesta
                      </div>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 600,
                          lineHeight: 1.6,
                          maxWidth: '90%',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {flashcards[flashcardIndex]?.back}
                      </div>
                    </div>
                  </div>
                </div>

                {/* FSRS Rating Buttons */}
                <div
                  style={{
                    opacity: showFlashcardAnswer ? 1 : 0,
                    transform: showFlashcardAnswer ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'all 0.3s ease',
                    pointerEvents: showFlashcardAnswer ? 'auto' : 'none',
                  }}
                >
                  <p
                    style={{
                      textAlign: 'center',
                      fontSize: 13,
                      color: 'var(--text-muted)',
                      marginBottom: 10,
                    }}
                  >
                    ¿Qué tan bien lo sabías? <span style={{ opacity: 0.6 }}>(teclas 1-4)</span>
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[
                      {
                        label: 'No lo sabía',
                        shortcut: '1',
                        quality: 0,
                        color: '#ef4444',
                        emoji: '😰',
                      },
                      {
                        label: 'Difícil',
                        shortcut: '2',
                        quality: 2,
                        color: '#f97316',
                        emoji: '😓',
                      },
                      { label: 'Bien', shortcut: '3', quality: 3, color: '#3b82f6', emoji: '😊' },
                      { label: 'Fácil', shortcut: '4', quality: 5, color: '#22c55e', emoji: '🎯' },
                    ].map((btn) => (
                      <button
                        key={btn.quality}
                        onClick={() => {
                          const card = { ...flashcards[flashcardIndex] };
                          const quality = btn.quality;
                          if (quality < 3) {
                            card.repetitions = 0;
                            card.interval = 1;
                          } else {
                            if (card.repetitions === 0) card.interval = 1;
                            else if (card.repetitions === 1) card.interval = 3;
                            else card.interval = Math.round(card.interval * card.ease);
                            card.repetitions = (card.repetitions || 0) + 1;
                          }
                          card.ease = Math.max(
                            1.3,
                            card.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
                          );
                          const next = new Date();
                          next.setDate(next.getDate() + card.interval);
                          card.nextReview = next.toISOString();
                          card.reviewed = true;
                          const updated = [...flashcards];
                          updated[flashcardIndex] = card;
                          const now = new Date();
                          const dueCards = updated.filter((c) => new Date(c.nextReview) <= now);
                          setFlashcards(updated);
                          setShowFlashcardAnswer(false);
                          if (flashcardIndex < flashcards.length - 1)
                            setFlashcardIndex(flashcardIndex + 1);
                          else if (dueCards.length > 0)
                            setFlashcardIndex(updated.indexOf(dueCards[0]));
                          else {
                            api
                              .logStudySession({
                                duration_seconds: flashcards.length * 15,
                                project_id: project.id,
                                activity_type: 'flashcards',
                              })
                              .catch(() => {});
                            setFlashcardIndex(0);
                          }
                        }}
                        style={{
                          padding: '14px 8px',
                          borderRadius: 12,
                          border: `2px solid ${btn.color}33`,
                          background: `${btn.color}0a`,
                          color: btn.color,
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: 12,
                          transition: 'all 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLElement).style.background = `${btn.color}20`;
                          (e.target as HTMLElement).style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLElement).style.background = `${btn.color}0a`;
                          (e.target as HTMLElement).style.transform = 'scale(1)';
                        }}
                      >
                        <span style={{ fontSize: 20 }}>{btn.emoji}</span>
                        {btn.label}
                        <span style={{ fontSize: 10, opacity: 0.6 }}>[{btn.shortcut}]</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation (when answer not shown) */}
                {!showFlashcardAnswer && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setFlashcardIndex(Math.max(0, flashcardIndex - 1));
                        setShowFlashcardAnswer(false);
                      }}
                      disabled={flashcardIndex === 0}
                    >
                      ← Anterior
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setFlashcardIndex(Math.min(flashcards.length - 1, flashcardIndex + 1));
                        setShowFlashcardAnswer(false);
                      }}
                      disabled={flashcardIndex >= flashcards.length - 1}
                    >
                      Siguiente →
                    </button>
                  </div>
                )}

                {/* Session complete banner */}
                {flashcards.every((c: any) => c.reviewed) && (
                  <div
                    style={{
                      marginTop: 20,
                      padding: '20px 24px',
                      borderRadius: 16,
                      background: 'linear-gradient(135deg, #22c55e11, #22c55e22)',
                      border: '1px solid #22c55e33',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                    <h4 style={{ margin: 0, color: '#22c55e' }}>¡Sesión completada!</h4>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '8px 0 0' }}>
                      Revisaste {flashcards.length} tarjetas. Vuelve a practicar para reforzar.
                    </p>
                  </div>
                )}

                {/* Keyboard shortcuts hint */}
                <div
                  style={{
                    marginTop: 16,
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  {[
                    { key: 'Espacio', action: 'Voltear' },
                    { key: '←→', action: 'Navegar' },
                    { key: '1-4', action: 'Calificar' },
                  ].map((s) => (
                    <span
                      key={s.key}
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <kbd
                        style={{
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 600,
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        {s.key}
                      </kbd>
                      {s.action}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'summary' && (
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            {/* Controls */}
            <div className="u-card" style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: 6,
                      display: 'block',
                    }}
                  >
                    Nivel de detalle
                  </label>
                  <select
                    value={summaryDetailLevel}
                    onChange={(e) => setSummaryDetailLevel(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                      fontSize: 14,
                    }}
                  >
                    <option value="brief">Breve — Puntos clave</option>
                    <option value="standard">Estándar — Resumen completo</option>
                    <option value="comprehensive">
                      Completo — Análisis profundo con diagramas
                    </option>
                  </select>
                </div>
                <button
                  onClick={async () => {
                    if (!project) return;
                    setIsGeneratingSummary(true);
                    try {
                      const data = await api.generateSummary(project.id, summaryDetailLevel);
                      setSummaryData(data);
                    } catch (err: any) {
                      console.error(err);
                    }
                    setIsGeneratingSummary(false);
                  }}
                  disabled={isGeneratingSummary || !project?.documents.length}
                  className="btn btn-primary"
                  style={{ height: 42, padding: '0 24px', whiteSpace: 'nowrap' }}
                >
                  {isGeneratingSummary ? (
                    <>{Hourglass()} Generando...</>
                  ) : (
                    <>{Sparkles()} Generar Resumen</>
                  )}
                </button>
                <button
                  onClick={async () => {
                    if (!project) return;
                    setIsGeneratingMap(true);
                    try {
                      const data = await api.generateConceptMap(project.id);
                      setConceptMap(data);
                    } catch (err: any) {
                      console.error(err);
                    }
                    setIsGeneratingMap(false);
                  }}
                  disabled={isGeneratingMap || !project?.documents.length}
                  className="btn btn-secondary"
                  style={{ height: 42, padding: '0 20px', whiteSpace: 'nowrap' }}
                >
                  {isGeneratingMap ? <>{Hourglass()} ...</> : <>{Map()} Mapa Conceptual</>}
                </button>
              </div>
              {!project?.documents.length && (
                <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
                  Sube documentos primero para generar resúmenes inteligentes.
                </p>
              )}
            </div>

            {/* Summary content */}
            {summaryData && (
              <div className="u-card" style={{ padding: 24 }}>
                {/* Export buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 20,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {summaryData.title || 'Resumen de Estudio'}
                  </h2>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={async () => {
                        if (!project) return;
                        setIsExporting(true);
                        try {
                          await api.exportSummaryDocx(
                            project.id,
                            summaryData,
                            summaryData.title || 'Resumen'
                          );
                        } catch (e: any) {
                          console.error(e);
                        }
                        setIsExporting(false);
                      }}
                      disabled={isExporting}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                        <path d="M12 18v-6" />
                        <path d="m9 15 3 3 3-3" />
                      </svg>
                      Word
                    </button>
                    <button
                      onClick={async () => {
                        if (!project) return;
                        setIsExporting(true);
                        try {
                          await api.exportSummaryPdf(
                            project.id,
                            summaryData,
                            summaryData.title || 'Resumen'
                          );
                        } catch (e: any) {
                          console.error(e);
                        }
                        setIsExporting(false);
                      }}
                      disabled={isExporting}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <path d="M14 2v6h6" />
                      </svg>
                      PDF
                    </button>
                  </div>
                </div>

                {/* Rendered HTML summary */}
                {summaryData.htmlContent && (
                  <div
                    className="lesson-content"
                    dangerouslySetInnerHTML={{ __html: summaryData.htmlContent }}
                    style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-primary)' }}
                  />
                )}

                {/* Key terms */}
                {summaryData.keyTerms?.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <h3
                      style={{ fontSize: 16, fontWeight: 700, color: '#2D62C8', marginBottom: 12 }}
                    >
                      {BookOpen()} Glosario de Términos
                    </h3>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {summaryData.keyTerms.map((term: any, i: number) => (
                        <div
                          key={i}
                          style={{
                            padding: '10px 14px',
                            background: 'var(--bg-secondary)',
                            borderRadius: 8,
                            borderLeft: '3px solid #2D62C8',
                          }}
                        >
                          <strong style={{ color: 'var(--text-primary)' }}>{term.term}</strong>
                          <span style={{ color: 'var(--text-secondary)', marginLeft: 8 }}>
                            {term.definition}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Formulas */}
                {summaryData.formulas?.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <h3
                      style={{ fontSize: 16, fontWeight: 700, color: '#2D62C8', marginBottom: 12 }}
                    >
                      {SquareFunction()} Fórmulas Importantes
                    </h3>
                    <div style={{ display: 'grid', gap: 8 }}>
                      {summaryData.formulas.map((f: any, i: number) => (
                        <div
                          key={i}
                          style={{
                            padding: '12px 14px',
                            background: '#151B1E',
                            borderRadius: 8,
                            color: '#fff',
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                            {f.name}
                          </div>
                          <code style={{ fontSize: 15, color: '#60A5FA' }}>{f.latex}</code>
                          <div
                            style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}
                          >
                            {f.explanation}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Study tips */}
                {summaryData.studyTips?.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <h3
                      style={{ fontSize: 16, fontWeight: 700, color: '#2D62C8', marginBottom: 12 }}
                    >
                      {Lightbulb()} Tips de Estudio
                    </h3>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {summaryData.studyTips.map((tip: string, i: number) => (
                        <li
                          key={i}
                          style={{ marginBottom: 6, color: 'var(--text-secondary)', fontSize: 14 }}
                        >
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Concept Map */}
            {conceptMap && conceptMap.nodes?.length > 0 && (
              <div className="u-card" style={{ padding: 24, marginTop: 20 }}>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 16,
                  }}
                >
                  {Map()} Mapa Conceptual
                </h3>
                <div
                  style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}
                >
                  {conceptMap.nodes.map((node: any) => (
                    <div
                      key={node.id}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 10,
                        background:
                          node.type === 'main'
                            ? '#2D62C8'
                            : node.type === 'sub'
                              ? 'rgba(45,98,200,0.15)'
                              : 'var(--bg-secondary)',
                        color: node.type === 'main' ? '#fff' : 'var(--text-primary)',
                        border: `1.5px solid ${node.type === 'main' ? '#2D62C8' : 'var(--border-color)'}`,
                        fontSize: node.type === 'main' ? 15 : 13,
                        fontWeight: node.type === 'main' ? 700 : node.type === 'sub' ? 600 : 400,
                        textAlign: 'center',
                        minWidth: 100,
                      }}
                    >
                      {node.label}
                    </div>
                  ))}
                </div>
                {conceptMap.edges?.length > 0 && (
                  <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <strong>Relaciones:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {conceptMap.edges.map((edge: any, i: number) => {
                        const from = conceptMap.nodes.find((n: any) => n.id === edge.from);
                        const to = conceptMap.nodes.find((n: any) => n.id === edge.to);
                        return (
                          <span
                            key={i}
                            style={{
                              padding: '4px 10px',
                              background: 'var(--bg-secondary)',
                              borderRadius: 6,
                              fontSize: 12,
                            }}
                          >
                            {from?.label || edge.from} → <em>{edge.label}</em> →{' '}
                            {to?.label || edge.to}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Loading states */}
            {isGeneratingSummary && (
              <div className="u-card" style={{ padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>{Brain({ size: 40 })}</div>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
                  Conniku está analizando tus documentos y creando un resumen inteligente...
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Esto puede tomar unos segundos dependiendo de la cantidad de material.
                </p>
              </div>
            )}
          </div>
        )}

        {tab === 'live' && (
          <div className="live-class-container">
            {/* Zoom / Meeting Link */}
            <div className="u-card" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ marginTop: 0 }}>{Link({ size: 16 })} Enlace de Clase en Vivo</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
                Pega el enlace de Zoom, Google Meet u otra plataforma para acceder a tu clase
                directamente
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="https://zoom.us/j/123456789 o meet.google.com/..."
                  value={zoomLink}
                  onChange={(e) => setZoomLink(e.target.value)}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    if (zoomLink.trim()) {
                      setSavedZoomLink(zoomLink.trim());
                    }
                  }}
                >
                  Guardar
                </button>
              </div>
              {savedZoomLink && (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <a
                    href={savedZoomLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    {Video()} Unirse a la Clase
                  </a>
                  <span
                    style={{ color: 'var(--text-muted)', fontSize: 12, wordBreak: 'break-all' }}
                  >
                    {savedZoomLink}
                  </span>
                </div>
              )}
            </div>

            {/* Recording */}
            <div className="u-card" style={{ padding: 20, marginBottom: 20 }}>
              <h3 style={{ marginTop: 0 }}>{Mic()} Grabar Clase</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
                Graba el audio de tu clase para transcribirlo y agregarlo como material de estudio
              </p>

              {!isRecording && !recordedBlob && (
                <button className="btn btn-primary" onClick={handleStartRecording}>
                  ⏺ Iniciar Grabación
                </button>
              )}

              {isRecording && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="recording-indicator">
                    <span className="recording-dot" />
                    <span style={{ fontWeight: 600, fontSize: 18 }}>
                      {formatRecTime(recordingTime)}
                    </span>
                  </div>
                  <button className="btn btn-danger" onClick={handleStopRecording}>
                    ⏹ Detener
                  </button>
                </div>
              )}

              {recordedBlob && !isRecording && (
                <div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    <button className="btn btn-secondary" onClick={handleDownloadRecording}>
                      {Save()} Guardar en mi Computador
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleTranscribeAndSave}
                      disabled={savingTranscription}
                    >
                      {savingTranscription ? (
                        'Enviando...'
                      ) : (
                        <>{ClipboardList()} Transcribir y Guardar en esta Asignatura</>
                      )}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setRecordedBlob(null);
                        setLiveTranscription('');
                      }}
                    >
                      {Trash2()} Descartar
                    </button>
                  </div>
                  <audio
                    controls
                    src={URL.createObjectURL(recordedBlob!)}
                    style={{ width: '100%', marginTop: 8 }}
                  />
                </div>
              )}

              {liveTranscription && (
                <div
                  className="u-card"
                  style={{ marginTop: 16, padding: 12, background: 'var(--bg-hover)' }}
                >
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                    {liveTranscription}
                  </p>
                </div>
              )}
            </div>

            {/* Save transcription to project selector */}
            <div className="u-card" style={{ padding: 20 }}>
              <h3 style={{ marginTop: 0 }}>{ClipboardList()} Transcripciones de Clases</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                Las grabaciones transcritas aparecerán automáticamente en la pestaña{' '}
                <strong>Documentos</strong> de esta asignatura y estarán disponibles en el{' '}
                <strong>Chat con tus Documentos</strong> para consultar el contenido de tus clases.
              </p>
              {videos.filter((v) => v.status === 'done').length > 0 ? (
                <div className="doc-list" style={{ marginTop: 12 }}>
                  {videos
                    .filter((v) => v.status === 'done')
                    .map((v) => (
                      <div key={v.id} className="doc-item">
                        <div
                          className="doc-icon"
                          style={{
                            background: 'var(--accent-green)22',
                            color: 'var(--accent-green)',
                          }}
                        >
                          {ClipboardList()}
                        </div>
                        <div className="doc-info">
                          <div className="doc-name">{v.title || 'Transcripción de clase'}</div>
                          <div className="doc-meta">Transcripción disponible</div>
                        </div>
                        <span className="doc-status processed">Listo</span>
                      </div>
                    ))}
                </div>
              ) : (
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: 13,
                    textAlign: 'center',
                    marginTop: 12,
                  }}
                >
                  Aún no hay transcripciones. Graba una clase o sube un video para comenzar.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      {showRenameModal && (
        <div className="modal-overlay" onClick={() => setShowRenameModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Renombrar Asignatura</h3>
            <div className="auth-field">
              <label>Nuevo nombre</label>
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && renameValue.trim()) {
                    api
                      .updateProject(project.id, { name: renameValue.trim() })
                      .then((updated) => {
                        onUpdate({ ...project, name: updated.name });
                        setShowRenameModal(false);
                      })
                      .catch(() => alert('Error al renombrar'));
                  }
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setShowRenameModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  if (!renameValue.trim()) return;
                  api
                    .updateProject(project.id, { name: renameValue.trim() })
                    .then((updated) => {
                      onUpdate({ ...project, name: updated.name });
                      setShowRenameModal(false);
                    })
                    .catch(() => alert('Error al renombrar'));
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Prompt: Compartir con Biblioteca ── */}
      {sharePrompt && !shareForm && !shareSuccess && (
        <div className="modal-overlay" onClick={() => setSharePrompt(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>
              ¿Compartir con la Biblioteca Conniku?
            </h3>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                margin: '0 0 20px',
              }}
            >
              <strong>{sharePrompt.docName}</strong> puede ayudar a otros estudiantes.
              <br />
              Si lo compartes, quedará en la biblioteca aunque lo elimines de esta asignatura.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() =>
                  setShareForm({
                    title: sharePrompt.docName.replace(/\.[^.]+$/, ''),
                    description: '',
                    category: '',
                  })
                }
              >
                Sí, compartir
              </button>
              <button className="btn btn-secondary" onClick={() => setSharePrompt(null)}>
                No, gracias
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Formulario de Compartir ── */}
      {sharePrompt && shareForm && !shareSuccess && (
        <div
          className="modal-overlay"
          onClick={() => {
            setSharePrompt(null);
            setShareForm(null);
          }}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>📚 Compartir con la Biblioteca</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Título *
                </label>
                <input
                  value={shareForm.title}
                  onChange={(e) => setShareForm((f) => (f ? { ...f, title: e.target.value } : f))}
                  placeholder="Nombre del documento"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Categoría *
                </label>
                <select
                  value={shareForm.category}
                  onChange={(e) =>
                    setShareForm((f) => (f ? { ...f, category: e.target.value } : f))
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                  }}
                >
                  <option value="">Selecciona una categoría</option>
                  {BIBLIOTECA_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Descripción (opcional)
                </label>
                <textarea
                  value={shareForm.description}
                  onChange={(e) =>
                    setShareForm((f) => (f ? { ...f, description: e.target.value } : f))
                  }
                  placeholder="¿De qué trata este documento? ¿Para qué curso sirve?"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={!shareForm.title.trim() || !shareForm.category || shareLoading}
                onClick={handleShareToBiblioteca}
              >
                {shareLoading ? 'Compartiendo...' : '✓ Publicar en Biblioteca'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setSharePrompt(null);
                  setShareForm(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmación exitosa ── */}
      {shareSuccess && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 360, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h3 style={{ margin: '0 0 8px' }}>¡Documento compartido!</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Ya está disponible en la Biblioteca Conniku para todos los estudiantes.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
