/**
 * LegalLayout — layout con sidebar para la sección /legal/:doc.
 *
 * D-L3=B: rutas anidadas con React Router <Outlet />.
 * Sidebar lista 4 documentos, destaca el activo con aria-current="page".
 * Responsive: móvil → sidebar horizontal, desktop → sidebar izquierdo.
 *
 * Bloque: legal-viewer-v1
 */
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LEGAL_DOCUMENT_ENTRIES } from '../../legal/documentRegistry';
import styles from './LegalLayout.module.css';

export function LegalLayout(): React.ReactElement {
  return (
    <div className={styles.root}>
      {/* Sidebar con los 4 documentos */}
      <nav aria-label="documentos legales" className={styles.sidebar}>
        <span className={styles.sidebarTitle}>Documentos legales</span>
        {LEGAL_DOCUMENT_ENTRIES.map(([key, meta]) => (
          <NavLink
            key={key}
            to={`/legal/${meta.slug}`}
            className={({ isActive }) => `${styles.navLink}${isActive ? ` ${styles.active}` : ''}`}
          >
            {({ isActive }) => (
              <span aria-current={isActive ? 'page' : undefined}>{meta.title}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Área de contenido */}
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}

export default LegalLayout;
