---
documento: Borrador de Declaración de Edad (vista pública para /legal/age-declaration)
autor: legal-docs-keeper (Capa 0 bloque legal-viewer-v1)
fecha: 2026-04-21
estado: BORRADOR — requiere revisión humana Cristian antes de publicar
proposito: >
  Reformular `docs/legal/v3.2/age-declaration.md` para que sea apto como vista
  pública navegable en /legal/age-declaration. El documento actual contiene
  notas internas (hash SHA-256, referencias a archivos shared/legal_texts.py,
  menciones a auditoría H-37) que NO deben mostrarse al usuario final.
  Este borrador propone una separación: el archivo canónico se mantiene
  intocado (es la fuente firmada), y se agrega una vista pública derivada
  que muestra SOLO el texto de declaración + contexto legal comprensible.
restriccion_dura: >
  No se cambia el texto firmado (las 5 cláusulas entre separadores ---).
  El hash TEXT_HASH ca527535... permanece intocado para no invalidar
  consentimientos históricos (user_agreements.text_version_hash).
---

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere validación
de abogado antes de su aplicación al producto en producción.

---

## 1. Problema detectado al leer `docs/legal/v3.2/age-declaration.md`

El archivo canónico vigente (hash file `61dab2ec...`) fue escrito como
documento INTERNO de evidencia probatoria, no como documento PÚBLICO para
consumo del usuario. Contiene:

- Frontmatter YAML con campos técnicos (`fuente_de_verdad`, `hash_sha256`,
  nota de mantenimiento).
- Referencias a archivos de código fuente (`shared/legal_texts.ts`,
  `shared/legal_texts.py`).
- Nota de cumplimiento H-37 que menciona auditoría legal externa 2026-04-20
  y Art. 210 Código Penal con lenguaje técnico de abogado.
- Cita del hash SHA-256 en hexadecimal.
- Instrucción al mantenedor ("NO editar directamente").

Si se sirve directamente al usuario público en `/legal/age-declaration`, el
usuario ve:

- Un encabezado confuso: "texto canónico del checkbox declarativo".
- Referencias a hashes y archivos TypeScript/Python que no significan nada
  para él.
- Un análisis técnico de por qué el Art. 210 CP no aplica, que introduce
  duda innecesaria ("¿entonces qué aplica?").

Esto choca con Ley 19.496 Art. 12 letra b (información veraz, oportuna y
**comprensible**) y con GDPR Art. 12 (información en forma concisa,
transparente, inteligible, lenguaje claro y sencillo).

## 2. Dos caminos posibles

### Camino A (recomendado): vista pública derivada

- El archivo canónico `docs/legal/v3.2/age-declaration.md` permanece
  intocado. Sigue siendo el documento INTERNO firmado por hash, sigue
  siendo referencia de auditoría.
- Se crea un NUEVO archivo `docs/legal/v3.2/age-declaration-public.md`
  destinado exclusivamente a la vista pública `/legal/age-declaration`.
  Este archivo SÍ se incluye en `METADATA.yaml` con su propio hash.
- El `documentRegistry.ts` tiene dos entradas para age-declaration:
  - `age-declaration` (actual, interno, hash file 61dab2ec..., hash text
    ca527535..., no ruteable públicamente).
  - `age-declaration-public` (nuevo, público, ruteable en
    `/legal/age-declaration`).

Pros: cero riesgo de invalidar consentimientos históricos. El texto firmado
no se toca.
Contras: dos archivos para el mismo "documento". Requiere sincronización
manual si se edita el texto canónico.

### Camino B: reescribir `age-declaration.md` como documento público y mover lo interno a otro archivo

- Reescribir `age-declaration.md` con tono público.
- Mover las notas técnicas (hash, fuente de verdad, H-37) a un nuevo
  `docs/legal/v3.2/age-declaration-INTERNAL.md` no expuesto.
- Recalcular hash file de `age-declaration.md` (cambia).
- Preservar TEXT_HASH `ca527535...` porque el texto canónico entre `---` no
  cambia.

Pros: un solo archivo público limpio.
Contras: bump de hash file, requiere actualizar `METADATA.yaml` y
coordinación con eventual Bloque 7 (que podría usar FILE_HASH para
evidencia de lectura del canónico interno, no del público).

**Recomendación: Camino A.** Motivo:

1. Menos disrupción de los hashes ya firmados.
2. Deja abierto el camino para Bloque 7: la evidencia de lectura "el usuario
   abrió /legal/age-declaration" usa el HASH del archivo PÚBLICO, separado
   del texto firmado en `user_agreements`. Eso es más limpio
   conceptualmente: el usuario firma el texto canónico corto al registrarse,
   y en paralelo puede leer una versión pública más explicativa.
3. El canónico interno queda como espejo documental de
   `shared/legal_texts.py`, que es su rol real.

---

## 3. Borrador de contenido para `docs/legal/v3.2/age-declaration-public.md`

Este es el texto propuesto para el nuevo archivo de vista pública.

```markdown
---
documento: Declaración de Edad — Vista pública
version: "1.0.0"
vigencia_desde: "2026-04-21"
fuente_de_verdad_interna: "docs/legal/v3.2/age-declaration.md (texto firmado)"
proposito: >
  Documento público navegable en /legal/age-declaration. Explica el compromiso
  de edad que el Usuario declara al registrarse en Conniku. El texto literal
  del compromiso (entre separadores ---) coincide byte-a-byte con el texto
  canónico firmado al momento del registro.
estado: BORRADOR
---

# Declaración de Edad — Conniku

**Última actualización: 21 de abril de 2026 · Versión 1.0.0**

Este documento explica el compromiso de edad que toda persona acepta al crear
una cuenta en Conniku. Es complementario a los Términos y Condiciones y a la
Política de Privacidad, y forma parte integrante de ellos.

## 1. Conniku es una plataforma exclusiva para personas mayores de 18 años

Conniku es un servicio educativo y de productividad universitaria diseñado
para personas con mayoría de edad legal. No ofrecemos, bajo ninguna
circunstancia, modalidad alternativa para menores de 18 años. Esta
restricción es parte del contrato entre el Usuario y Conniku SpA, y es
aplicable tanto a usuarios en Chile como a usuarios en cualquier otra
jurisdicción.

## 2. Texto del compromiso que el Usuario acepta al registrarse

Al completar el formulario de registro, el Usuario debe marcar una casilla
obligatoria que acompaña al siguiente texto. Al marcarla, el Usuario
declara bajo fe de juramento lo siguiente:

---

Al marcar esta casilla, declaro bajo fe de juramento que:

1. Soy mayor de 18 años a la fecha de este registro.
2. Los datos proporcionados, incluyendo mi fecha de nacimiento, son verdaderos y pueden ser verificados por Conniku en cualquier momento.
3. Entiendo que declarar información falsa constituye causal inmediata de terminación de mi cuenta, pérdida total de membresía, eliminación de todos mis datos, y podrá acarrear responsabilidad civil y penal según la legislación vigente.
4. Eximo a Conniku SpA de toda responsabilidad derivada de información falsa que yo haya proporcionado.
5. Acepto los Términos y Condiciones del servicio y la Política de Privacidad, que he leído y comprendido.

---

## 3. Qué verificamos al momento del registro

Adicionalmente al compromiso anterior, Conniku implementa los siguientes
controles al momento del registro:

- **Fecha de nacimiento**: el formulario exige la fecha de nacimiento exacta.
  Si la edad calculada a esa fecha es inferior a 18 años, el registro es
  rechazado automáticamente.
- **Registro de evidencia**: al aceptar este compromiso, Conniku almacena
  la siguiente información como evidencia probatoria legítima (base legal
  Art. 6(1)(c) GDPR obligación legal, y Art. 20 Ley 19.628 Chile):
  fecha y hora UTC exactas, zona horaria declarada, dirección IP,
  identificador del navegador, versión exacta del texto aceptado.
  Estos datos se conservan durante 5 años como prueba ante eventual
  disputa o requerimiento de autoridad competente.

## 4. Consecuencias de una declaración falsa

Si Conniku detecta posteriormente que el Usuario era menor de 18 años al
momento del registro (por autodeclaración, por revisión manual, por
requerimiento de autoridad o apoderado legal, o por cualquier otro medio
verificable), se ejecutan las siguientes medidas automáticas:

1. Bloqueo inmediato de la cuenta: el login queda deshabilitado.
2. Suspensión de cualquier suscripción activa, sin reembolso si hubo uso
   del servicio en incumplimiento de los Términos y Condiciones.
3. Eliminación de los datos del Usuario en un plazo máximo de 72 horas
   desde la confirmación del incumplimiento, en cumplimiento de Art. 8 del
   GDPR (menores de edad) y de los principios de protección reforzada de
   datos de menores establecidos en la legislación chilena y europea.
4. Retención exclusiva de evidencia mínima (texto aceptado, fecha,
   dirección IP y datos de contacto del registro) por 5 años como prueba
   ante eventual acción legal o requerimiento de autoridad.
5. Notificación del bloqueo al correo registrado con explicación clara.
6. Si se identifica al apoderado o representante legal, notificación
   adicional a éste.

Esta política es innegociable y no admite excepciones a petición del
Usuario ni de terceros.

## 5. Cómo verificar el texto exacto que aceptaste

Cada vez que un Usuario marca la casilla de compromiso, Conniku almacena
en su base de datos interna un identificador criptográfico (hash) del
texto específico que se mostró en esa sesión. Esto permite a Conniku
demostrar con certeza ante autoridad competente qué texto aceptó cada
Usuario y en qué fecha, conforme a Art. 7(1) GDPR (responsabilidad
proactiva del responsable del tratamiento).

Si un Usuario desea verificar la versión exacta del texto que aceptó, puede
solicitarlo por correo a **contacto@conniku.com** con el asunto "Solicitud
de copia de declaración de edad aceptada". Conniku entrega copia íntegra
del texto en un plazo no superior a 30 días, conforme a los derechos
de acceso del Art. 15 GDPR y Art. 12 Ley 19.628.

## 6. Marco legal aplicable

- **Chile**: Código Civil Arts. 26 y 1447 (capacidad legal); Ley 19.628
  sobre protección de la vida privada; Ley 19.496 sobre protección de los
  derechos del consumidor.
- **Unión Europea**: Reglamento (UE) 2016/679 (GDPR), especialmente
  Art. 8 (condiciones aplicables al consentimiento del menor), Art. 7
  (condiciones para el consentimiento), y Art. 12 (transparencia).
- **Internacional**: Convención sobre los Derechos del Niño (UN, 1989) en
  lo relativo al principio del interés superior del menor y protección
  ante tratamiento de sus datos personales.

## 7. Contacto

Para consultas, solicitudes de acceso o rectificación, o cualquier duda
sobre esta declaración:

- **Correo**: [contacto@conniku.com](mailto:contacto@conniku.com)
- **Domicilio**: Conniku SpA, Antofagasta, Región de Antofagasta, Chile.
- **Sitio web**: [conniku.com](https://conniku.com)

Este documento es complementario a:

- [Términos y Condiciones](/legal/terms)
- [Política de Privacidad](/legal/privacy)
- [Política de Cookies](/legal/cookies)
```

---

## 4. Cambios respecto del canónico `age-declaration.md`

| Aspecto | age-declaration.md (canónico interno) | age-declaration-public.md (propuesto) |
|---|---|---|
| Encabezado | "Texto canónico del checkbox declarativo de edad (v1.0.0)" | "Declaración de Edad — Conniku" |
| Frontmatter | Campos técnicos (`fuente_de_verdad`, `hash_sha256`, `nota`) | Campos públicos (`proposito`, `fuente_de_verdad_interna`) |
| Sección inicial | "Declaración obligatoria" (interna, para reportes) | Explicación al usuario: por qué es exclusiva 18+ |
| Texto canónico | Presentado como "se almacena el hash SHA-256" | Presentado como "texto del compromiso que el Usuario acepta" |
| Notas de cumplimiento | Análisis H-37 Art. 210 CP | Reemplazado por §4 "Consecuencias de declaración falsa" (redacción clara sin cita a artículo específico no verificado) |
| Hash en el cuerpo | Se expone hash SHA-256 ca527535... | Se menciona existencia de hash pero sin valor específico |
| Citas legales | GDPR Art. 7(1) implícita, sin contexto | §6 Marco legal con cita clara (Arts. 26, 1447 CC; Ley 19.628; Ley 19.496; GDPR Art. 7, 8, 12; Convención ONU) |

**Preserva byte-a-byte**: las 5 cláusulas entre los separadores `---` son
IDÉNTICAS al texto firmado en `AGE_DECLARATION_TEXT_V1`. Esto se verifica
automáticamente con test del Bloque legal-viewer-v1 que compara
`markdownExtractCanonicalBlock(age-declaration-public.md)` con
`AGE_DECLARATION_TEXT_V1` → debe ser igual byte-a-byte.

---

## 5. Conclusión y acción requerida

**Recomendación final**: aplicar Camino A. Crear
`docs/legal/v3.2/age-declaration-public.md` con el borrador de §3,
registrarlo en `METADATA.yaml` con su propio hash, y en
`documentRegistry.ts` exponerlo como `documentKey: 'age-declaration'`
para ruteo público. El archivo canónico `age-declaration.md` permanece
intocado y pasa a ser referencia documental interna.

**Alternativa aceptable**: aplicar Camino B si Cristian prefiere tener un
único archivo en `/legal/age-declaration`. En ese caso, el contenido
público reemplaza al canónico, y el texto firmado histórico (TEXT_HASH
`ca527535...`) permanece válido porque el bloque entre `---` no cambia.

**Acción requerida antes del builder**:

1. Cristian elige Camino A o Camino B.
2. Cristian aprueba o edita el borrador de contenido de §3.
3. legal-docs-keeper genera el archivo final y actualiza `METADATA.yaml`.
4. legal-docs-keeper firma "approved-for-viewer-v1" sólo después de los
   pasos 1-3.

**Si Cristian prefiere NO exponer age-declaration como ruta pública en
este bloque** y dejar la decisión para Bloque 7: este borrador se archiva
como referencia y el plan del bloque legal-viewer-v1 se modifica a 3
documentos públicos (terms, privacy, cookies) + mantener age-declaration
solo como embebido en Register.tsx. Esto requiere reversar la decisión
D-L8=A y no constituye recomendación del keeper, pero es opción válida
si el scope se quiere reducir.

---

## 6. Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.
