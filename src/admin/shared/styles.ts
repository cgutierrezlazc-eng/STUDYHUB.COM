// ─── Shared Styles for Admin Panel ──────────────────────────────
import React from 'react'

export const btnPrimary: React.CSSProperties = {
  padding: '10px 18px', borderRadius: 10, border: 'none',
  background: 'var(--accent)', color: '#fff', fontWeight: 600,
  fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
}

export const btnSecondary: React.CSSProperties = {
  padding: '10px 18px', borderRadius: 10,
  border: '1px solid var(--border)', background: 'var(--bg-secondary)',
  color: 'var(--text-primary)', fontWeight: 600, fontSize: 13,
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
}

export const btnSmall: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
  fontWeight: 600, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
}

export const grid2: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
}

export const thStyle: React.CSSProperties = {
  padding: '8px 6px', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.05em',
}

export const tdStyle: React.CSSProperties = {
  padding: '8px 6px', fontSize: 12,
}

export const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--bg-secondary)',
  color: 'var(--text-primary)', fontSize: 13,
}

export const selectStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8,
  border: '1px solid var(--border)', background: 'var(--bg-secondary)',
  color: 'var(--text-primary)', fontSize: 13,
}

// ─── Helper: Format numbers Chilean style ───
export const fmt = (n: number | undefined | null) => {
  if (n == null || isNaN(n)) return '0'
  return Math.round(n).toLocaleString('es-CL')
}
