/**
 * documentRegistry.ts
 * Fuente única de qué documentos legales existen, con metadatos de versión y hash.
 * Los hashes SHA-256 corresponden a docs/legal/v3.2/METADATA.yaml.
 *
 * Bloque: legal-viewer-v1
 */

export type DocumentKey = 'terms' | 'privacy' | 'cookies' | 'age-declaration';

export interface LegalDocumentMeta {
  title: string;
  version: string;
  /** SHA-256 del archivo .md completo (incluyendo frontmatter). */
  sha256: string;
  /** Ruta slug para la URL /legal/:slug */
  slug: string;
  /** Nombre del archivo en docs/legal/v3.2/ */
  filename: string;
}

/**
 * Registro canónico de los 4 documentos legales públicos.
 * Hashes tomados de docs/legal/v3.2/METADATA.yaml — no modificar manualmente.
 */
export const LEGAL_DOCUMENT_REGISTRY: Record<DocumentKey, LegalDocumentMeta> = {
  terms: {
    title: 'Términos y Condiciones',
    version: '3.2.2',
    sha256: 'b2b834b61e19db6b2f7aa8176e8958f4e001d49a02606097c462811f6e008d73',
    slug: 'terms',
    filename: 'terms.md',
  },
  privacy: {
    title: 'Política de Privacidad',
    version: '2.4.2',
    sha256: 'cc9332741bea7ad4539fd6a8a049946e44521b9ae8ed97833dd112412b8c746e',
    slug: 'privacy',
    filename: 'privacy.md',
  },
  cookies: {
    title: 'Política de Cookies',
    version: '1.0.0',
    sha256: '80d41f71f075ae954a4e5f1763266b9830d38849bbe79a7bb931c2a4ee30e38c',
    slug: 'cookies',
    filename: 'cookies.md',
  },
  'age-declaration': {
    title: 'Declaración de Edad',
    version: '1.0.0',
    // Hash del archivo .md completo (distinto al hash del texto canónico ca527535…)
    sha256: '61dab2ecf1b27e3fb212efcf5a066784943c689de11611bb6d2b919e39441a9b',
    slug: 'age-declaration',
    filename: 'age-declaration.md',
  },
};

/** Devuelve el título legible de un documento dado su key. */
export function getDocumentTitle(key: DocumentKey): string {
  return LEGAL_DOCUMENT_REGISTRY[key].title;
}

/** Array ordenado de las 4 entradas para uso en sidebar/footer. */
export const LEGAL_DOCUMENT_ENTRIES = Object.entries(LEGAL_DOCUMENT_REGISTRY) as [
  DocumentKey,
  LegalDocumentMeta,
][];
