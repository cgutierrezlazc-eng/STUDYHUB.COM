/**
 * Layout de 3 zonas del editor de workspaces.
 *
 * Estructura:
 * - Zona izquierda (260px): sidebar con TOC, colaboradores y rúbrica (scaffolding en 2a)
 * - Zona central (flex 1): documento, recibe children
 * - Zona derecha (360px): dos paneles apilados — borrador privado (2c) y chat grupal (2b)
 *
 * En viewport <1024px las zonas derecha e izquierda se colapsan.
 * Decisión D3 del plan 2a.
 *
 * Bloque 2a Fundación.
 */

import React, { useState } from 'react';
import type { WorkspaceMember } from '../../../../shared/workspaces-types';

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
}

export default function ThreeZoneLayout({ children, members = [] }: ThreeZoneLayoutProps) {
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
          {members.length === 0 ? (
            <p className="ws-placeholder-text ws-placeholder-text--muted">Solo tú por ahora.</p>
          ) : (
            <ul className="ws-member-list" aria-label="Miembros del workspace">
              {members.map((m) => (
                <li key={m.id} className="ws-member-item">
                  <span className="ws-member-avatar" aria-hidden="true">
                    {(m.user?.name ?? m.user_id).charAt(0).toUpperCase()}
                  </span>
                  <span className="ws-member-name">{m.user?.name ?? m.user_id}</span>
                  <span className="ws-member-role">{m.role}</span>
                </li>
              ))}
            </ul>
          )}
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
        <div
          className="ws-zone-right-panel ws-zone-right-panel--top"
          aria-label="Borrador privado"
          aria-disabled="true"
        >
          <div className="ws-placeholder-panel">
            <p className="ws-placeholder-panel-title">Borrador privado</p>
            <p className="ws-placeholder-panel-sub">Disponible próximamente.</p>
          </div>
        </div>

        <div
          className="ws-zone-right-panel ws-zone-right-panel--bottom"
          aria-label="Chat del grupo"
          aria-disabled="true"
        >
          <div className="ws-placeholder-panel">
            <p className="ws-placeholder-panel-title">Chat del grupo</p>
            <p className="ws-placeholder-panel-sub">Disponible próximamente.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
