/**
 * Tipos compartidos del módulo Workspaces (sub-bloque 2a Fundación).
 * Importado desde workspacesApi.ts y desde las páginas del módulo.
 * No se importa desde backend (Python no lee TS).
 *
 * Creado en bloque 2a. Expandido en bloques 2b/2c/2d.
 */

export type MemberRole = 'owner' | 'editor' | 'viewer';

export type ApaEdition = '7' | '6' | 'ieee' | 'chicago' | 'mla';

export interface Workspace {
  id: string;
  title: string;
  owner_id: string;
  course_name?: string | null;
  apa_edition: ApaEdition;
  options?: string;
  cover_data?: string | null;
  cover_template?: string | null;
  content_yjs?: string | null;
  is_completed: boolean;
  share_link_token?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: MemberRole;
  chars_contributed: number;
  invited_at: string;
  joined_at?: string | null;
  /** Campos adicionales del usuario, incluidos al listar miembros */
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
  };
}

export interface WorkspaceVersion {
  id: string;
  workspace_id: string;
  content_yjs: string;
  created_by: string;
  created_at: string;
  label?: string | null;
}

export interface CreateWorkspaceInput {
  title: string;
  course_name?: string;
  apa_edition?: ApaEdition;
}

export interface UpdateWorkspaceInput {
  title?: string;
  course_name?: string;
  apa_edition?: ApaEdition;
  is_completed?: boolean;
  /** Snapshot Yjs serializado en base64. Agregado en bloque 2b. */
  content_yjs?: string;
}

// ─── Tipos de colaboración en tiempo real (bloque 2b) ─────────────────────────

/** Mensaje del chat grupal del workspace. */
export interface WorkspaceMessage {
  id: string;
  workspaceId: string;
  userId: string;
  content: string;
  createdAt: string;
  /** Estado del mensaje en el cliente (optimistic update). */
  status?: 'sending' | 'sent' | 'failed';
  /** Datos del usuario, incluidos al listar mensajes. */
  user?: {
    id: string;
    name?: string | null;
    avatar?: string | null;
  };
}

/** Actualización de contribución de caracteres de un miembro. */
export interface ContributionUpdate {
  memberId: string;
  charsContributed: number;
}

/** Estado de presencia de un usuario en el workspace (awareness Yjs). */
export interface PresenceUser {
  userId: string;
  name: string;
  avatar?: string | null;
  color: string;
  cursor?: {
    anchor: unknown;
    focus: unknown;
  };
}

export interface InviteTokenInfo {
  valid: boolean;
  workspace_id: string | null;
  workspace_title: string | null;
  course_name?: string | null;
  owner_name: string | null;
  proposed_role: MemberRole | null;
  token?: string;
}

export interface AcceptInviteResult {
  ok: boolean;
  workspace_id: string;
  role: MemberRole;
  already_member: boolean;
}
