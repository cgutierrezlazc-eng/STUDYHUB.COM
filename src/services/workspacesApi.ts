/**
 * Cliente HTTP del módulo Workspaces.
 * Cubre endpoints: /workspaces/*, /workspaces/:id/members, /workspaces/:id/versions.
 *
 * Bloque 2a — Fundación. Sin Yjs, sin Athena, sin export.
 * Bloque 2c — Athena IA: funciones athena* añadidas al final del archivo.
 * Bloque 2d.6 — Rúbrica: uploadRubricText, uploadRubricFile, getRubric.
 * Bloque 2d.8 — Comentarios: listComments, createComment, patchComment, deleteComment, resolveComment.
 * Usa el mismo patrón de `request` que src/services/api.ts.
 */

import { getApiBase } from './api';
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceVersion,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  InviteTokenInfo,
  MemberRole,
  WorkspaceMessage,
  AthenaChatMessage,
  AthenaSuggestion,
  AthenaUsageInfo,
  AthenaAnalyzeResponse,
  AthenaChatResponse,
  AthenaSuggestResponse,
  CitationValidationResult,
  RubricData,
  WorkspaceComment,
} from '../../shared/workspaces-types';

const TOKEN_KEY = 'conniku_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const base = getApiBase();
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${base}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { detail?: string }).detail ?? `API Error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Workspace CRUD ───────────────────────────────────────────────

export function listWorkspaces(): Promise<{ workspaces: Workspace[] }> {
  return apiFetch('/workspaces');
}

export function createWorkspace(data: CreateWorkspaceInput): Promise<Workspace> {
  return apiFetch('/workspaces', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getWorkspace(id: string): Promise<Workspace> {
  return apiFetch(`/workspaces/${id}`);
}

export function updateWorkspace(id: string, patch: UpdateWorkspaceInput): Promise<Workspace> {
  return apiFetch(`/workspaces/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export function deleteWorkspace(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/workspaces/${id}`, { method: 'DELETE' });
}

// ─── Miembros ─────────────────────────────────────────────────────

export function listMembers(id: string): Promise<{ members: WorkspaceMember[] }> {
  return apiFetch(`/workspaces/${id}/members`);
}

export function addMember(id: string, email: string, role: MemberRole): Promise<WorkspaceMember> {
  return apiFetch(`/workspaces/${id}/members`, {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  });
}

export function updateMember(
  id: string,
  memberId: string,
  role: MemberRole
): Promise<WorkspaceMember> {
  return apiFetch(`/workspaces/${id}/members/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export function removeMember(id: string, memberId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/workspaces/${id}/members/${memberId}`, {
    method: 'DELETE',
  });
}

// ─── Versiones ────────────────────────────────────────────────────

export function listVersions(id: string): Promise<{ versions: WorkspaceVersion[] }> {
  return apiFetch(`/workspaces/${id}/versions`);
}

export function createVersion(
  id: string,
  contentYjs: string,
  label?: string
): Promise<WorkspaceVersion> {
  return apiFetch(`/workspaces/${id}/versions`, {
    method: 'POST',
    body: JSON.stringify({ content_yjs: contentYjs, label }),
  });
}

export function restoreVersion(id: string, versionId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/workspaces/${id}/versions/${versionId}/restore`, {
    method: 'POST',
  });
}

// ─── Invitación ───────────────────────────────────────────────────

export function validateInviteToken(token: string): Promise<InviteTokenInfo> {
  return apiFetch(`/workspaces/invite/${token}`);
}

export function acceptInvite(
  token: string
): Promise<{ ok: boolean; workspace_id: string; role: string; already_member: boolean }> {
  return apiFetch(`/workspaces/invite/${token}/accept`, { method: 'POST' });
}

// ─── Chat grupal (bloque 2b) ──────────────────────────────────────────────────

export interface ListChatMessagesOptions {
  limit?: number;
  before?: string;
}

export interface ListChatMessagesResult {
  messages: WorkspaceMessage[];
}

/** Obtiene el historial de mensajes del chat grupal paginado (desc). */
export function listChatMessages(
  docId: string,
  options: ListChatMessagesOptions = {}
): Promise<ListChatMessagesResult> {
  const params = new URLSearchParams();
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.before) params.set('before', options.before);
  const qs = params.toString();
  return apiFetch(`/workspaces/${docId}/chat/messages${qs ? `?${qs}` : ''}`);
}

/** Envía un nuevo mensaje al chat grupal (fallback HTTP, sin WS). */
export function sendChatMessage(docId: string, content: string): Promise<WorkspaceMessage> {
  return apiFetch(`/workspaces/${docId}/chat/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

/** Elimina un mensaje del chat (solo owner del mensaje o owner del workspace). */
export function deleteChatMessage(docId: string, msgId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/workspaces/${docId}/chat/messages/${msgId}`, {
    method: 'DELETE',
  });
}

// ─── Contribución de caracteres (bloque 2b) ───────────────────────────────────

export interface ContributionUpdateResult {
  id: string;
  chars_contributed: number;
}

/**
 * Envía el delta de caracteres contribuidos por el miembro al servidor.
 * Solo el usuario dueño del memberId puede actualizar su propio contador.
 */
export function updateContributionMetric(
  docId: string,
  memberId: string,
  deltaChars: number
): Promise<ContributionUpdateResult> {
  return apiFetch(`/workspaces/${docId}/members/${memberId}/contribution`, {
    method: 'PATCH',
    body: JSON.stringify({ delta_chars: deltaChars }),
  });
}

// ─── Athena IA (bloque 2c) ────────────────────────────────────────────────────

/** Error enriquecido que indica cuota de Athena agotada. */
export class AthenaQuotaError extends Error {
  readonly code = 'athena-quota' as const;
  constructor(message: string) {
    super(message);
    this.name = 'AthenaQuotaError';
  }
}

/**
 * Wrapper sobre apiFetch que transforma 429 con detail de athena_workspace
 * en un AthenaQuotaError enriquecido para que la UI muestre el modal de upgrade.
 */
async function athenFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const base = getApiBase();
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${base}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const detail = (data as { detail?: string }).detail ?? `API Error: ${res.status}`;

    if (res.status === 429) {
      const err = new AthenaQuotaError(detail);
      throw err;
    }

    throw new Error(detail);
  }

  return res.json() as Promise<T>;
}

/** Solicita análisis del documento actual a Athena. Consume 1 cuota. */
export function athenaAnalyze(docId: string): Promise<AthenaAnalyzeResponse> {
  return athenFetch(`/workspaces/${docId}/athena`, {
    method: 'POST',
    body: JSON.stringify({ action: 'analyze', data: {} }),
  });
}

/** Envía un mensaje al chat privado con Athena. Consume 1 cuota. */
export function athenaChat(
  docId: string,
  message: string,
  history: AthenaChatMessage[]
): Promise<AthenaChatResponse> {
  return athenFetch(`/workspaces/${docId}/athena`, {
    method: 'POST',
    body: JSON.stringify({ action: 'chat', data: { message, history } }),
  });
}

/** Solicita una sugerencia de Athena para el texto seleccionado. Consume 1 cuota. */
export function athenaSuggest(
  docId: string,
  stagingText: string,
  selection?: string
): Promise<AthenaSuggestResponse> {
  return athenFetch(`/workspaces/${docId}/athena`, {
    method: 'POST',
    body: JSON.stringify({ action: 'suggest', data: { staging_text: stagingText, selection } }),
  });
}

export interface ListAthenaChatsOptions {
  limit?: number;
  before?: string;
}

export interface ListAthenaChatsResult {
  chats: AthenaChatMessage[];
}

/** Obtiene el historial privado de chat con Athena (paginado desc). */
export function listAthenaChats(
  docId: string,
  options: ListAthenaChatsOptions = {}
): Promise<ListAthenaChatsResult> {
  const params = new URLSearchParams();
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.before) params.set('before', options.before);
  const qs = params.toString();
  return apiFetch(`/workspaces/${docId}/athena/chats${qs ? `?${qs}` : ''}`);
}

export interface ListAthenaSuggestionsOptions {
  status?: AthenaSuggestion['status'];
}

export interface ListAthenaSuggestionsResult {
  suggestions: AthenaSuggestion[];
}

/** Obtiene las sugerencias en staging privado del usuario. */
export function listAthenaSuggestions(
  docId: string,
  options: ListAthenaSuggestionsOptions = {}
): Promise<ListAthenaSuggestionsResult> {
  const params = new URLSearchParams();
  if (options.status) params.set('status', options.status);
  const qs = params.toString();
  return apiFetch(`/workspaces/${docId}/athena/suggestions${qs ? `?${qs}` : ''}`);
}

export interface PatchAthenaSuggestionPayload {
  status: AthenaSuggestion['status'];
  new_content?: string;
}

/** Actualiza el estado de una sugerencia (applied / modified / rejected). */
export function patchAthenaSuggestion(
  docId: string,
  sugId: string,
  payload: PatchAthenaSuggestionPayload
): Promise<{ ok: boolean }> {
  return apiFetch(`/workspaces/${docId}/athena/suggestions/${sugId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

/** Elimina una sugerencia pendiente del staging privado. */
export function deleteAthenaSuggestion(docId: string, sugId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/workspaces/${docId}/athena/suggestions/${sugId}`, {
    method: 'DELETE',
  });
}

/** Elimina todo el historial de chat con Athena del usuario en este documento. */
export function deleteAthenaChats(docId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/workspaces/${docId}/athena/chats`, { method: 'DELETE' });
}

/** Obtiene la cuota de uso de Athena del usuario para el día actual. */
export function getAthenaUsage(docId: string): Promise<AthenaUsageInfo> {
  return apiFetch(`/workspaces/${docId}/athena/usage`);
}

/** Ping para verificar que Athena está disponible antes de mostrar el panel. */
export function pingAthena(docId: string): Promise<{ ok: boolean; claude_available: boolean }> {
  return apiFetch(`/workspaces/${docId}/athena/ping`);
}

// ─── APA 7 / Citas (sub-bloque 2d.1) ─────────────────────────────────────────

export interface CitationInput {
  id: string;
  raw: string;
}

/**
 * Valida un batch de citas APA 7 contra el backend.
 * Endpoint: POST /workspaces/{docId}/citations/validate
 * Las citas inválidas NO rechazan la request — el servidor devuelve 200
 * con detalle por ítem.
 */
export function validateCitations(
  docId: string,
  citations: CitationInput[]
): Promise<{ results: CitationValidationResult[] }> {
  return apiFetch(`/workspaces/${docId}/citations/validate`, {
    method: 'POST',
    body: JSON.stringify({ citations }),
  });
}

// ─── Rúbrica (sub-bloque 2d.6) ───────────────────────────────────────────────

/**
 * Envía texto pegado de una rúbrica al backend para parseo.
 * Endpoint: POST /workspaces/{docId}/rubric/text
 * Retorna ítems extraídos y posibles advertencias.
 */
export function uploadRubricText(docId: string, text: string): Promise<RubricData> {
  return apiFetch(`/workspaces/${docId}/rubric/text`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

/**
 * Sube un archivo (PDF/DOCX/TXT) de rúbrica al backend para extracción y parseo.
 * Endpoint: POST /workspaces/{docId}/rubric/upload
 * Usa FormData — no envía Content-Type para que el browser ponga el boundary.
 */
export async function uploadRubricFile(docId: string, file: File): Promise<RubricData> {
  const base = getApiBase();
  const token = getToken();
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${base}/workspaces/${docId}/rubric/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { detail?: string }).detail ?? `API Error: ${res.status}`);
  }

  return res.json() as Promise<RubricData>;
}

/**
 * Obtiene la rúbrica guardada del documento.
 * Endpoint: GET /workspaces/{docId}/rubric
 * Retorna raw text + ítems parseados.
 */
export function getRubric(docId: string): Promise<RubricData> {
  return apiFetch(`/workspaces/${docId}/rubric`);
}

// ─── Comentarios inline + Menciones (sub-bloque 2d.8) ────────────────────────

export interface CreateCommentInput {
  content: string;
  anchor_id: string;
  parent_id?: string | null;
}

export interface PatchCommentInput {
  content: string;
}

/**
 * Lista los comentarios del documento, opcionalmente filtrado por anchor_id.
 * Endpoint: GET /workspaces/{docId}/comments?anchor_id=X
 */
export function listComments(
  docId: string,
  anchorId?: string
): Promise<{ comments: WorkspaceComment[] }> {
  const qs = anchorId ? `?anchor_id=${encodeURIComponent(anchorId)}` : '';
  return apiFetch(`/workspaces/${docId}/comments${qs}`);
}

/**
 * Crea un nuevo comentario en el documento.
 * Endpoint: POST /workspaces/{docId}/comments
 * Retorna el comentario creado con mentions validadas por el backend.
 */
export function createComment(docId: string, data: CreateCommentInput): Promise<WorkspaceComment> {
  return apiFetch(`/workspaces/${docId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Edita el contenido de un comentario (solo el autor puede editar).
 * Endpoint: PATCH /workspaces/{docId}/comments/{commentId}
 */
export function patchComment(
  docId: string,
  commentId: string,
  data: PatchCommentInput
): Promise<WorkspaceComment> {
  return apiFetch(`/workspaces/${docId}/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Elimina un comentario (autor u owner del workspace).
 * Endpoint: DELETE /workspaces/{docId}/comments/{commentId}
 */
export function deleteComment(docId: string, commentId: string): Promise<{ ok: boolean }> {
  return apiFetch(`/workspaces/${docId}/comments/${commentId}`, { method: 'DELETE' });
}

/**
 * Cambia el estado resolved del comentario (editor u owner).
 * Endpoint: POST /workspaces/{docId}/comments/{commentId}/resolve
 */
export function resolveComment(
  docId: string,
  commentId: string,
  resolved: boolean
): Promise<{ ok: boolean }> {
  return apiFetch(`/workspaces/${docId}/comments/${commentId}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ resolved }),
  });
}
