/**
 * Cliente HTTP del módulo Workspaces.
 * Cubre endpoints: /workspaces/*, /workspaces/:id/members, /workspaces/:id/versions.
 *
 * Bloque 2a — Fundación. Sin Yjs, sin Athena, sin export.
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
