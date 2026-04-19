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
import CommentsPanel from '../Comments/CommentsPanel';
import RubricPanel from '../Rubric/RubricPanel';
import CitationsPanel from '../Citations/CitationsPanel';
import ReferenceFormatter from '../Citations/ReferenceFormatter';

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
  /** Si true, muestra el panel de comentarios en la zona derecha (2d.8) */
  commentsEnabled?: boolean;
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
  commentsEnabled = false,
}: ThreeZoneLayoutProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [refFormatterOpen, setRefFormatterOpen] = useState(false);
  return (
    <div className="ws-three-zone">
      {/* ── Topbar de acciones del documento ── */}
      <div className="ws-topbar-actions" aria-label="Acciones del documento">
        <button
          type="button"
          className="ws-topbar-new-ref-btn"
          onClick={() => setRefFormatterOpen((o) => !o)}
          aria-expanded={refFormatterOpen}
          aria-label="Nueva referencia APA"
          data-testid="topbar-new-reference-btn"
        >
          Nueva referencia
        </button>
      </div>

      {/* ── Modal ReferenceFormatter ── */}
      {refFormatterOpen && (
        <div
          className="ws-ref-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Generador de referencias APA 7"
          data-testid="ref-formatter-modal"
        >
          <div className="ws-ref-modal-content">
            <button
              type="button"
              className="ws-ref-modal-close"
              onClick={() => setRefFormatterOpen(false)}
              aria-label="Cerrar generador de referencias"
            >
              ✕
            </button>
            <ReferenceFormatter />
          </div>
        </div>
      )}

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
          {docId ? (
            <RubricPanel docId={docId} />
          ) : (
            <p className="ws-placeholder-text ws-placeholder-text--muted">
              Carga tu rúbrica al crear el documento.
            </p>
          )}
        </SidebarPanel>

        {/* Panel Referencias APA — sub-bloque 2d.1 */}
        <SidebarPanel title="Referencias APA">
          {docId ? (
            <CitationsPanel docId={docId} />
          ) : (
            <p className="ws-placeholder-text ws-placeholder-text--muted">
              Abre un documento para gestionar las referencias.
            </p>
          )}
        </SidebarPanel>
      </aside>

      {/* ── Zona central: documento ── */}
      <main className="ws-zone-center" aria-label="Documento">
        {children}
      </main>

      {/* ── Zona derecha: borrador privado + comentarios + chat grupal ── */}
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

        {/* Panel de comentarios — activo en 2d.8 cuando commentsEnabled=true */}
        {commentsEnabled && docId && currentUser && (
          <div
            className={`ws-zone-right-panel ws-zone-right-panel--comments${commentsOpen ? ' ws-zone-right-panel--comments-open' : ''}`}
            aria-label="Panel de comentarios"
          >
            <div className="ws-comments-panel-header">
              <span className="ws-comments-panel-title">Comentarios</span>
              <button
                type="button"
                className="ws-comments-toggle-btn"
                onClick={() => setCommentsOpen((o) => !o)}
                aria-expanded={commentsOpen}
                aria-label={
                  commentsOpen ? 'Cerrar panel de comentarios' : 'Abrir panel de comentarios'
                }
              >
                {commentsOpen ? '▲' : '▼'}
              </button>
            </div>
            {commentsOpen && (
              <CommentsPanel
                docId={docId}
                currentUser={{
                  userId: currentUser.userId,
                  name: currentUser.name,
                  role: 'editor',
                }}
                members={members}
              />
            )}
          </div>
        )}

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
