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
}

export interface InviteTokenInfo {
  workspace_id: string;
  workspace_title: string;
  owner_name: string;
  proposed_role: MemberRole;
  valid: boolean;
}
