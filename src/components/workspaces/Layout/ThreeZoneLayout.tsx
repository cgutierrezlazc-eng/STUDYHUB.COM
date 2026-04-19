/**
 * Layout de 3 zonas del editor de workspaces.
 *
 * Estructura:
 * - Zona izquierda (260px): sidebar con TOC, colaboradores y rúbrica.
 *   En 2b: el panel "Colaboradores" muestra MemberContributionBar con indicadores online.
 * - Zona central (flex 1): documento, recibe children.
 * - Zona derecha (360px): dos paneles apilados.
 *   Panel superior: AthenaPanel (activo en 2c cuando athenaEnabled=true).
 *   Panel inferior: GroupChat (activo en 2b cuando chatEnabled=true).
 *
 * En viewport <1024px las zonas derecha e izquierda se colapsan.
 * Decisión D3 del plan 2a.
 *
 * Bloque 2a Fundación / 2b Colaboración / 2c Athena IA.
 */

import React, { useState } from 'react';
import type { RefObject } from 'react';
import type { WorkspaceMember } from '../../../../shared/workspaces-types';
import MemberContributionBar from '../Presence/MemberContributionBar';
import GroupChat from '../Chat/GroupChat';
import AthenaPanel from '../Athena/AthenaPanel';
import type { EditorBridgeHandle } from '../Athena/AthenaPanel';

interface SidebarPanelProps {
  title: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

function SidebarPanel({ title, children, defaultOpen = false }: SidebarPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ws-sidebar-panel">
      <button
        className="ws-sidebar-panel-header"
        onClick={() => setOpen((o) => !o)}
        type="button"
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className="ws-sidebar-panel-chevron" aria-hidden="true">
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && <div className="ws-sidebar-panel-body">{children}</div>}
    </div>
  );
}

interface ThreeZoneLayoutProps {
  /** Contenido del documento (editor Lexical) */
  children: React.ReactNode;
  /** Lista de miembros para el panel colaboradores */
  members?: WorkspaceMember[];
  /** Si true, monta el chat grupal en la zona derecha inferior (bloque 2b) */
  chatEnabled?: boolean;
  /** Si true, el WS está conectado (para deshabilitar el input del chat) */
  isConnected?: boolean;
  /** ID del workspace/documento (para el chat y Athena) */
  docId?: string;
  /** Usuario actual (para el chat y Athena) */
  currentUser?: {
    userId: string;
    name: string;
    avatar?: string | null;
    color?: string;
  };
  /** Set de user_ids actualmente online (awareness) */
  onlineUserIds?: Set<string>;
  /** Si true, monta el panel Athena en la zona derecha superior (bloque 2c) */
  athenaEnabled?: boolean;
  /** Ref al bridge Athena (pasado al AthenaPanel para applyText/getSelection) */
  editorBridge?: RefObject<EditorBridgeHandle | null> | null;
  /** Función de navegación para el modal de upgrade de Athena */
  onNavigate?: (path: string) => void;
}

export default function ThreeZoneLayout({
  children,
  members = [],
  chatEnabled = false,
  isConnected = false,
  docId = '',
  currentUser,
  onlineUserIds = new Set(),
  athenaEnabled = false,
  editorBridge,
  onNavigate,
}: ThreeZoneLayoutProps) {
  return (
    <div className="ws-three-zone">
      {/* ── Zona izquierda: sidebar del doc ── */}
      <aside className="ws-zone-left" aria-label="Panel lateral del documento">
        <SidebarPanel title="Índice">
          <p className="ws-placeholder-text">
            El índice automático estará disponible próximamente.
          </p>
        </SidebarPanel>

        <SidebarPanel title="Colaboradores" defaultOpen={true}>
          {/* En 2b: MemberContributionBar con indicador online/offline */}
          <MemberContributionBar members={members} onlineUserIds={onlineUserIds} />
        </SidebarPanel>

        <SidebarPanel title="Rúbrica">
          <p className="ws-placeholder-text ws-placeholder-text--muted">
            Carga tu rúbrica al crear el documento (disponible próximamente).
          </p>
        </SidebarPanel>
      </aside>

      {/* ── Zona central: documento ── */}
      <main className="ws-zone-center" aria-label="Documento">
        {children}
      </main>

      {/* ── Zona derecha: borrador privado + chat grupal ── */}
      <div className="ws-zone-right" aria-label="Paneles laterales derechos">
        {/* Panel superior: AthenaPanel (2c) o placeholder si no está habilitado */}
        <div
          className="ws-zone-right-panel ws-zone-right-panel--top"
          aria-label={athenaEnabled ? 'Panel Athena' : 'Borrador privado'}
        >
          {athenaEnabled && docId && currentUser ? (
            <AthenaPanel
              docId={docId}
              currentUser={currentUser}
              editorBridge={editorBridge ?? null}
              onNavigate={onNavigate}
            />
          ) : (
            <div className="ws-placeholder-panel" aria-disabled="true">
              <p className="ws-placeholder-panel-title">Borrador privado</p>
              <p className="ws-placeholder-panel-sub">Disponible próximamente.</p>
            </div>
          )}
        </div>

        {/* Panel inferior: chat grupal — activo en 2b */}
        <div
          className="ws-zone-right-panel ws-zone-right-panel--bottom"
          aria-label="Chat del grupo"
        >
          {chatEnabled && docId && currentUser ? (
            <GroupChat
              docId={docId}
              members={members}
              currentUser={currentUser}
              isConnected={isConnected}
            />
          ) : (
            <div className="ws-placeholder-panel">
              <p className="ws-placeholder-panel-title">Chat del grupo</p>
              <p className="ws-placeholder-panel-sub">Disponible próximamente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
