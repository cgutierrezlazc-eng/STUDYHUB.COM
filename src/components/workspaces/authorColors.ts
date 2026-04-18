/**
 * Paleta de 20 colores accesibles para identificación visual de autores.
 * La asignación es determinística por user.id — nunca aleatoria.
 *
 * Bloque 2a Fundación. Usado en colaboración visual (2b).
 * Los colores cumplen contraste WCAG AA sobre fondos oscuros (#0F1419).
 */

export const AUTHOR_COLORS: string[] = [
  '#A855F7', // violeta
  '#3B82F6', // azul
  '#10B981', // esmeralda
  '#F59E0B', // ámbar
  '#EF4444', // rojo
  '#06B6D4', // cyan
  '#EC4899', // rosa
  '#84CC16', // verde lima
  '#F97316', // naranja
  '#6366F1', // índigo
  '#14B8A6', // teal
  '#E11D48', // rojo carmesí
  '#8B5CF6', // púrpura
  '#0EA5E9', // azul cielo
  '#D97706', // naranja oscuro
  '#059669', // verde oscuro
  '#7C3AED', // violeta oscuro
  '#DC2626', // rojo oscuro
  '#2563EB', // azul real
  '#16A34A', // verde
];

/**
 * Retorna un color de la paleta de forma determinística para el userId dado.
 * Usa un hash simple de suma de char codes para distribuir los IDs.
 * La función es pura: mismo input → mismo output siempre.
 */
export function getAuthorColor(userId: string): string {
  if (userId.length === 0) {
    return AUTHOR_COLORS[0];
  }
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash + userId.charCodeAt(i) * (i + 1)) % AUTHOR_COLORS.length;
  }
  return AUTHOR_COLORS[hash];
}
