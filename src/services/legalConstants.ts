// Hashes canónicos sincronizados con backend/constants/legal_versions.py
// Actualizar aquí cuando cambien los documentos legales (misma fuente de verdad).

export const LEGAL_DOC_KEYS = ['terms', 'privacy', 'cookies', 'age-declaration'] as const;
export type LegalDocKey = (typeof LEGAL_DOC_KEYS)[number];

export const CANONICAL_DOC_HASHES: Record<LegalDocKey, string> = {
  terms: 'b2b834b61e19db6b2f7aa8176e8958f4e001d49a02606097c462811f6e008d73',
  privacy: 'cc9332741bea7ad4539fd6a8a049946e44521b9ae8ed97833dd112412b8c746e',
  cookies: '80d41f71f075ae954a4e5f1763266b9830d38849bbe79a7bb931c2a4ee30e38c',
  'age-declaration': '61dab2ecf1b27e3fb212efcf5a066784943c689de11611bb6d2b919e39441a9b',
};

// Hash del TEXTO canónico de la declaración de edad (no del archivo completo).
// Valor inmutable — almacenado en user_agreements.text_version_hash al registrar.
export const AGE_DECLARATION_TEXT_HASH =
  'ca527535a0f3f938b51d9a2e896e140233ecdd2286e13fdeecb7a32783d43706';
