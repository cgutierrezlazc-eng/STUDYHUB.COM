// ═══════════════════════════════════════════════════════════════
// UTILIDADES COMPARTIDAS — Extension Conniku
// ═══════════════════════════════════════════════════════════════

/** Extrae hostname de una URL de forma segura (sin crash si es invalida) */
export function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** Formato "hace X minutos/horas/dias" */
export function timeAgo(timestamp?: number): string {
  if (!timestamp) return 'nunca';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'hace un momento';
  if (seconds < 3600) return `hace ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `hace ${Math.floor(seconds / 3600)}h`;
  return `hace ${Math.floor(seconds / 86400)} dias`;
}
