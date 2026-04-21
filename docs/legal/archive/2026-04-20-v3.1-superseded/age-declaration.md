---
documento: Declaración de Edad — texto canónico del checkbox declarativo
version: "1.0.0"
vigencia_desde: "2026-04-18"
hash_sha256: "ca527535a0f3f938b51d9a2e896e140233ecdd2286e13fdeecb7a32783d43706"
fuente_de_verdad: "shared/legal_texts.ts y shared/legal_texts.py"
nota: "Este archivo es un snapshot del texto AGE_DECLARATION_TEXT_V1 definido en
       shared/legal_texts.ts (espejo TypeScript) y shared/legal_texts.py (fuente Python).
       NO editar directamente. Toda edición requiere bumpar AGE_DECLARATION_VERSION en
       ambos archivos shared/ y actualizar el hash en este documento."
estado: VIGENTE
---

# Texto canónico del checkbox declarativo de edad (v1.0.0)

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.

## Texto canónico

El siguiente texto es mostrado al usuario en el checkbox obligatorio del
formulario de registro. Se almacena el hash SHA-256 de este texto en cada
fila de `user_agreements` como evidencia de qué versión exacta aceptó el
usuario.

---

Al marcar esta casilla, declaro bajo fe de juramento que:

1. Soy mayor de 18 años a la fecha de este registro.
2. Los datos proporcionados, incluyendo mi fecha de nacimiento, son verdaderos y pueden ser verificados por Conniku en cualquier momento.
3. Entiendo que declarar información falsa constituye causal inmediata de terminación de mi cuenta, pérdida total de membresía, eliminación de todos mis datos, y podrá acarrear responsabilidad civil y penal según la legislación vigente.
4. Eximo a Conniku SpA de toda responsabilidad derivada de información falsa que yo haya proporcionado.
5. Acepto los Términos y Condiciones del servicio y la Política de Privacidad, que he leído y comprendido.

---

## Notas de cumplimiento

- Referencia legal: §CLAUDE.md "Componente 2: Checkbox declarativo con texto legal completo"
- Referencia penal: el texto menciona "responsabilidad civil y penal según la legislación vigente"
  — la cita específica al Art. 210 del Código Penal chileno está pendiente de validación por
  abogado (nota pre-existente en CLAUDE.md). El texto se mantiene en forma genérica
  "legislación vigente" hasta esa validación.
- Hash SHA-256 del texto canónico (sin frontmatter, solo el string entre los separadores ---):
  `ca527535a0f3f938b51d9a2e896e140233ecdd2286e13fdeecb7a32783d43706`
- El hash se calcula sobre el string exacto de AGE_DECLARATION_TEXT_V1 en shared/legal_texts.py,
  no sobre este archivo markdown.
