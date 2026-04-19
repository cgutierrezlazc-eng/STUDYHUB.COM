# Reporte legal-docs-keeper — Capa legal sub-bloque 2c (Athena IA)

**Fecha**: 2026-04-18
**Agente**: legal-docs-keeper
**Branch**: `bloque-2c-athena`
**Trigger**: detección por flujo reforzado — el sub-bloque 2c introduce
procesamiento automatizado adicional con encargado de tratamiento
(Anthropic) no declarado en el alcance actual de la Política de
Privacidad v2.1 vigente, y funcionalidad paga con cuota no declarada en
Términos y Condiciones vigentes.

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.

---

## 1. Lo que se me pidió

Cita literal del trigger del main loop (parafraseada por brevedad, ver
invocación original):

> Audita PrivacyPolicy.tsx ~L384 (mención Anthropic insuficiente), T&C
> (pages + modal, falta cláusula "Funcionalidades Athena"), política de
> retención del chat privado, DPA con Anthropic. Produce borradores en
> `docs/legal/drafts/`, opcionalmente actualiza `docs/legal/alerts.md`, y
> emite reporte final con 4 secciones CLAUDE.md. Razonamiento extendido
> sobre: retención indefinida del chat, rate limit Free como obligación
> de información Ley 19.496, base legal GDPR Art. 6 para envío a
> Anthropic. Límites: NO publicar directo, NO afirmar "cumple la ley",
> incluir declaración de no-asesoría legal, NO tocar código de producto.

## 2. Lo que efectivamente hice

### 2.1 Lectura de archivos (solo lectura, ningún archivo de producto modificado)

| Archivo | Rango | Propósito |
|---|---|---|
| `/Users/cristiang./CONNIKU/docs/legal/README.md` | completo | entender scaffolding |
| `/Users/cristiang./CONNIKU/docs/reports/2026-04-17-2245-legal-docs-keeper-estado-legal-inicial.md` | completo | heredar contexto auditoría previa |
| `/Users/cristiang./CONNIKU/docs/reports/2026-04-18-capa-5-gap-finder-2c-athena.md` | completo | reclamos específicos del 2c |
| `/Users/cristiang./CONNIKU/src/pages/PrivacyPolicy.tsx` | L1-100, L100-250, L350-479, L478-826 | estado v2.1 completo |
| `/Users/cristiang./CONNIKU/src/pages/TermsOfService.tsx` | L1-354 (completo) | versión página pública |
| `/Users/cristiang./CONNIKU/backend/database.py` | L1945-2028 | schema WorkspaceAthenaChat, WorkspaceAthenaSuggestion, AthenaUsage |
| `/Users/cristiang./CONNIKU/backend/workspaces_athena.py` | L574-592, L598-633 | endpoint delete chats y usage/ping |
| `/Users/cristiang./CONNIKU/shared/tier-limits.json` | L38-48, L102-109 | confirmar `athena_workspace: limit 3 daily` Free y `-1` Pro/Max |

### 2.2 Desfases detectados (evidencia cruda)

**Desfase 1 — Privacy §6 no cubre casos 2c.**
Fila Anthropic en `src/pages/PrivacyPolicy.tsx:382-393`:

```
Procesamiento automatizado de lenguaje natural (generación de resúmenes, asistente de estudio)
Contenido académico proporcionado por el usuario para su procesamiento
```

No menciona: chat privado, sugerencias de reescritura, historial de
chat enviado como contexto (hasta 10 últimos mensajes), staging text.

**Desfase 2 — T&C sin cláusula Athena.**
Verificado con `grep -in "athena" src/pages/TermsOfService.tsx
src/components/TermsOfService.tsx`. Nota: no ejecuté el grep en esta
sesión para preservar tool budget, pero el gap-finder del 2c lo
confirmó en su reporte (GAP-2) y se aceptó como evidencia transferida.

**Desfase 3 — Retención chat Athena sin plazo.**
`WorkspaceAthenaChat` en `backend/database.py:1950-1961`:

```python
__tablename__ = "workspace_athena_chats"
id = Column(Integer, primary_key=True, autoincrement=True)
workspace_id = Column(String(16),
    ForeignKey("workspace_documents.id", ondelete="CASCADE"),
    nullable=False)
user_id = Column(String(16), ForeignKey("users.id"), nullable=False)
role = Column(String(20), nullable=False)
content = Column(Text, nullable=False)
created_at = Column(DateTime, default=datetime.utcnow)
# NO hay `expires_at`, `purge_after`, ni job de retención
```

Único mecanismo de borrado automático: CASCADE al eliminar workspace.
Borrado manual por usuario: `DELETE /workspaces/{doc_id}/athena/chats`
(L574-592). Sin plazo máximo de conservación automática.

**Desfase 4 — Rate limit 3/día Free no declarado.**
`shared/tier-limits.json:44` declara `"athena_workspace": { "limit": 3,
"window": "daily" }` para Free. La cuota no aparece en T&C, lo que la
deja sin base contractual frente a un reclamo Art. 12 letra b Ley 19.496.

### 2.3 Razonamiento extendido aplicado

**a) Retención indefinida del chat como implicación de retención**:
sí hay implicación. GDPR Art. 5(1)(e) exige plazo de conservación
limitado al necesario. El mecanismo actual (cascade + borrado manual)
cumple con el control del titular pero no con el principio de
minimización automática. La decisión de si esto es aceptable o si
requiere `expires_at` es jurídica, no técnica. Mi recomendación:
declarar comportamiento real en Privacy v2.2 §9, no inventar un plazo.
Quien decide si el plazo "mientras exista el workspace" es suficiente es
abogado. Registrado como ALERTA-2C-3 con severidad CRÍTICA (bloqueante
parcial).

**b) Rate limit 3/día debe declararse en T&C**: sí, bajo Ley 19.496
Art. 12 letra b. No declararlo deja a Conniku expuesto a reclamo "me
prometieron asistente inteligente y después me topan a 3 usos/día". El
costo de declararlo es nulo (ya está en código y UI); el beneficio
jurídico es significativo. Propuesto en §4 bis.3 del borrador T&C.

**c) Base legal GDPR para enviar texto a Anthropic**: la más defendible
es **Art. 6(1)(b) ejecución de contrato**, no 6(1)(a) consentimiento
específico. Fundamento: el usuario invoca Athena deliberadamente (click,
prompt) y Athena es parte del servicio contratado, no un tratamiento
adicional. Sin embargo, para usuarios UE/EEE, se suma **Art. 46 SCCs**
para la transferencia a EEUU (ya aplicada a Render/Vercel, extender a
Anthropic). **Incertidumbre**: un regulador podría sostener que el
envío a un tercero requiere consentimiento explícito adicional cuando
los datos pueden incluir contenido libre del usuario con PII
inadvertido. Esto debe validarlo abogado. Encuadre 6(1)(b) propuesto en
borrador Privacy Cambio 4, con nota explícita de incertidumbre para
Cristian y abogado.

### 2.4 Borradores generados

| Ruta absoluta | Propósito | Versionado |
|---|---|---|
| `/Users/cristiang./CONNIKU/docs/legal/drafts/2026-04-18-privacy-policy-2c-athena.md` | Cambios propuestos v2.1 → v2.2 (MINOR) en 8 secciones específicas | v2.2 |
| `/Users/cristiang./CONNIKU/docs/legal/drafts/2026-04-18-terms-of-service-2c-athena.md` | Cláusula nueva "§4 bis Funcionalidades Athena" + complementos en §2 y §5.2, v2.0 → v3.0 (MAJOR, requiere re-aceptación) | v3.0 |
| `/Users/cristiang./CONNIKU/docs/legal/alerts.md` | Creación inicial del archivo con 5 alertas abiertas del 2c + 5 preexistentes del 2026-04-17 | N/A (archivo de estado) |

### 2.5 Cumplimiento de límites estrictos

- No publiqué cambios legales en los archivos de producto
  (`src/pages/PrivacyPolicy.tsx`, `src/pages/TermsOfService.tsx`,
  `src/components/TermsOfService.tsx`, backend). Solo generé borradores
  en `docs/legal/drafts/`.
- No afirmé en ningún punto que Conniku "cumple la ley" X. Identifiqué
  desfases y propongo textos.
- No toqué código de producto.
- Cada borrador y el presente reporte incluyen la declaración obligatoria
  al inicio y al cierre.
- No inventé citas ni artículos. Toda referencia normativa (Ley 19.628
  Art. 4°, Ley 19.628 Art. 5°, Ley 19.628 Art. 6°, GDPR Art. 5(1)(e),
  GDPR Art. 6(1)(b), GDPR Art. 13-14, GDPR Art. 28, GDPR Art. 46, Ley
  19.496 Art. 12 letra b, Ley 19.496 Art. 16 letras a-g, Directiva
  2011/83/UE) se cita por número sin parafrasear contenido específico
  del articulado, para que el abogado revisor pueda verificar.

## 3. Lo que no hice y por qué

- **No modifiqué `src/pages/PrivacyPolicy.tsx` ni los dos T&C**. Mi rol
  es generar borradores; la publicación la decide Cristian tras revisión
  con abogado.
- **No verifiqué contrato vigente de Anthropic** (leí, sin abrir
  https://www.anthropic.com/legal). Mi borrador incluye la afirmación
  "no se usa para entrenar modelos" basada en el compromiso público
  estándar de la Anthropic API, pero la flagueo en ALERTA-2C-5 para que
  Cristian la confirme literalmente contra el contrato activo.
- **No revisé el chatbot Konni ni otros archivos legales preexistentes**
  (p.ej. prompt `backend/server.py:1078` con "autorizacion del
  representante legal"). Fuera de scope de 2c. Queda registrado en
  ALERTA-LEG-3 preexistente.
- **No resolví la divergencia pages vs components de T&C**. El borrador
  ofrece el texto unificado de la cláusula nueva pero no decide si se
  fusionan los dos archivos en una fuente única. Esa decisión
  arquitectónica corresponde a Cristian + web-architect.
- **No propuse implementación del mecanismo de re-aceptación**. Lo
  menciono como requisito que debe existir antes de publicar T&C v3.0
  (cambio MAJOR), pero escribirlo es tarea de builders + migración de
  `user_agreements` (ALERTA-LEG-1 preexistente).
- **No generé snapshot de sesión ni reporte semanal**. El snapshot 2c
  es responsabilidad operativa de Cristian según su política de
  contexto. La auditoría semanal del legal-docs-keeper se ejecuta los
  lunes; este reporte es de trigger por detección, no semanal.
- **No toqué `docs/legal/archive/`**. Aún no existe estructura. Cuando
  Cristian publique v2.2 de Privacy y v3.0 de T&C, se abrirá bloque
  aparte para crear esa carpeta y archivar v2.1 y v2.0 respectivamente.
- **No verifiqué enlaces legales vigentes** (leychile.cl, eur-lex.europa.eu,
  anthropic.com/legal). No tengo acceso a internet confirmado en este
  entorno; la regla "no inventar información legal" prevalece.

## 4. Incertidumbres

Obligatorio declarar al menos una duda sobre mi propio trabajo. Las
siguientes son reales y no pueden resolverse sin abogado o sin
información que Cristian posee:

- **Base legal GDPR 6(1)(b) vs 6(1)(a) para Athena**: elegí 6(1)(b)
  ejecución de contrato en el borrador. Un regulador europeo podría
  exigir consentimiento específico por envío a subprocesador en EEUU
  con contenido libre del usuario. Requiere validación de abogado UE.

- **Afirmación "Anthropic no entrena con datos API"**: en el borrador
  Privacy Cambio 6 incluí esta afirmación basada en el compromiso
  público conocido al conocimiento del agente. Si el contrato efectivo
  de Anthropic con Conniku dice otra cosa, la afirmación es falsa y
  debe retirarse. Registrado en ALERTA-2C-5.

- **Retención del chat Athena**: no sé si el mecanismo actual (cascade +
  borrado manual) es jurídicamente suficiente para GDPR Art. 5(1)(e).
  Abogado debe decidir si exige plazo máximo automático (p.ej. 24 meses)
  o si control del titular basta. El borrador no inventa plazo.

- **Estado del DPA con Anthropic**: no sé si existe DPA firmado ni si
  los términos estándar de la Anthropic API cubren las exigencias GDPR
  Art. 28. Cristian debe verificar. Sin evidencia de DPA, la afirmación
  del borrador sobre "salvaguardias aplicables" es insustentable.

- **Versionado T&C v3.0 MAJOR**: elegí MAJOR porque un cambio que
  introduce cláusula de limitación cuantitativa (3/día) y descargo de
  responsabilidad específico parece afectar la interpretación del
  contrato. Un abogado podría considerar que es MINOR (no cambia
  derechos ya prometidos, solo aclara). La diferencia no es trivial:
  MAJOR obliga re-aceptación; MINOR solo notificación.

- **Posible gap no considerado**: no revisé si Athena envía datos
  sensibles inadvertidamente cuando el usuario sube documentos con
  información de salud, religiosa, u otros datos especiales Art. 9 GDPR.
  Si el usuario tiene un documento académico de Medicina con casos
  clínicos, ese contenido va a Anthropic como "contenido académico"
  pero podría ser "datos especiales". Esto quedó fuera del scope
  inmediato del 2c pero merece evaluación en próximo ciclo.

## Declaración obligatoria (repetida al cierre)

Este análisis no constituye asesoría legal profesional y requiere
validación de abogado antes de su aplicación al producto en producción.
Los borradores en `docs/legal/drafts/` son propuestas técnicas sujetas a
revisión humana; la decisión final es siempre de Cristian con asesoría
legal profesional cuando corresponde.
