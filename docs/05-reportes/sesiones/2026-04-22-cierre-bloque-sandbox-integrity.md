# Sesión 22/04/2026 — Cierre y Punto de Restauración
## Conniku SpA · Estabilización Legal e Infraestructura

**Commit de restauración:** `285373f` (HEAD → main, origin/main)  
**Rama:** `main` ← merge de `bloque-sandbox-integrity-v1`  
**Tests al cierre:** 404 passed · 0 fallos de código · CI en progreso  
**Fecha/hora:** 22 de abril de 2026 · ~14:32 (Chile)

---

## CONTEXTO: Reglas "no negociables" de esta sesión

> Estas reglas aplican en TODAS las sesiones futuras:

1. **NUNCA usar "IA" ni "Inteligencia Artificial"** — siempre "Asistente Virtual" u otro término equivalente en toda la plataforma, código, documentos y UI.
2. **Hashes SHA-256 son inmutables** — cualquier cambio a un `.md` legal requiere recalcular y actualizar el hash en `legal_versions.py`, `METADATA.yaml`, `documentRegistry.ts` y el endpoint `legal_document_views_routes.py` en el mismo commit.
3. **Constantes laborales vienen de `labor_chile.py`** — nunca hardcodear valores de nómina en la UI o templates.
4. **La jornada laboral es dinámica** — usar `get_weekly_hours_at_date()` del backend, no hardcodear "42h" ni "40h".

---

## ESTADO DEL SISTEMA AL CIERRE

### Git
- **Rama activa:** `main`
- **Commit HEAD:** `285373f` — Merge bloque-sandbox-integrity-v1
- **Origin:** ✅ Sincronizado (`origin/main` = `HEAD`)
- **Rama de trabajo cerrada:** `bloque-sandbox-integrity-v1` (mergeada, puede eliminarse)

### Estructura docs/ (reorganizada hoy)
```
CONNIKU/docs/
├── README.md                    ← Índice maestro
├── 01-proyecto/
│   ├── estado-actual.md         ← Estado del sistema (actualizar en cada bloque)
│   ├── pendientes.md
│   ├── decisiones.md
│   └── plan-fase-2.md
├── 02-legal/
│   ├── vigentes/                ← T&C v3.2.2, Privacy v2.4.2, Cookies, Age-decl
│   ├── laborales/               ← RIOHS, contratos (pendiente contenido)
│   ├── para-abogado/            ← paquete-abogado.md + revision-abogado.md
│   ├── auditorias/              ← histórico auditorías legales
│   ├── drafts/                  ← borradores
│   ├── archivo/                 ← versiones anteriores + LEGAL_VERSIONS.md
│   └── corporativo/             ← constitución, actas (antes en legal/ raíz)
├── 03-tecnico/
│   ├── dev-setup.md
│   ├── registry-issues.md
│   └── bloques/                 ← antes docs/plans/ (16 bloques)
├── 04-diseno/
│   ├── brand/
│   ├── mockups/
│   └── previews/
└── 05-reportes/
    ├── auditorias/              ← antes docs/reports/ (34 archivos)
    ├── sesiones/                ← antes docs/sessions/ (26 archivos)
    ├── metricas/
    └── inspecciones/
```

### Documentos legales vigentes
| Documento | Versión | SHA-256 (completo) |
|---|---|---|
| Términos de Servicio | **3.2.2** | `b2b834b61e19db6b2f7aa8176e8958f4e001d49a02606097c462811f6e008d73` |
| Política de Privacidad | **2.4.2** | `cc9332741bea7ad4539fd6a8a049946e44521b9ae8ed97833dd112412b8c746e` |
| Política de Cookies | **1.0.0** | `80d41f71f075ae954a4e5f1763266b9830d38849bbe79a7bb931c2a4ee30e38c` |
| Declaración de Edad | **1.0.0** | `61dab2ecf1b27e3fb212efcf5a066784943c689de11611bb6d2b919e39441a9b` |

### Constantes laborales vigentes (2026)
| Constante | Valor | Fuente |
|---|---|---|
| IMM | **$539.000** | Ley 21.751 · desde 01/01/2026 |
| Jornada actual | **42 horas** | Ley 21.561 · desde 26/04/2026 |
| Jornada siguiente | 40 horas | Ley 21.561 · desde 26/04/2028 |
| AFC tope | **135,2 UF** | Sup. Pensiones · feb-2026 |
| SIS empleador | **1,54%** | Sup. Pensiones · ene-2026 |
| Retención honorarios 2026 | **15,25%** | Ley 21.133 |

---

## LO QUE SE HIZO HOY (commits en orden)

| Commit | Descripción |
|---|---|
| `1f0d14d` | T&C v3.2.1 — fuentes legales verificadas |
| `0376f50` | Privacy v2.4.3 — Ley 21.719, sin "IA" |
| `f2ac9fb` | Nómina: IMM, AFC, SIS corregidos |
| `bd4d939` | T&C v3.2.2 — Ley Karin Art. 33bis |
| `3e5d74a` | Jornada automática — Ley 21.561 |
| `4a4d9eb` | Hashes registry sincronizados |
| `7cb5e69` | Paquete abogado |
| `bc9fe73` | Revisión integral para abogado |
| `34caae2` | Reorganización docs (231 archivos) |
| `b220663` | estado-actual.md creado |
| `6fcfaad` | Fix tests + 45h → 42h en 10 archivos |
| `285373f` | **Merge a main** |

---

## PENDIENTES PARA LA PRÓXIMA SESIÓN

### Técnicos (cuando el abogado confirme)
- [ ] **RIOHS Art. 6°** ya dice "42h" en el template — falta promulgar y enviar a DT
- [ ] Contratos de tutores — insertar cláusula Ley Karin (plantilla lista en doc abogado)
- [ ] Feature **GeoGebra** (calculadora matemática) — en backlog `docs/01-proyecto/pendientes.md`

### Operacionales (acciones humanas)
- [ ] 🚨 **B-2 CRÍTICO:** Protocolo Ley Karin — firmar y archivar (infracción desde ago-2024)
- [ ] 🔴 **E-1 URGENTE:** Contratos empleados vs. escalón 42h (antes 26/04/2026 — 4 días)
- [ ] 🟡 **Abogado:** Revisar y aprobar `docs/02-legal/para-abogado/2026-04-22-revision-abogado-documentos-completos.md`
- [ ] 🟡 **RIOHS:** Promulgar y enviar a Inspección del Trabajo (Art. 156 CT)

### Para preparar el lanzamiento
- [ ] Merge aprobado por CI (en progreso al cierre)
- [ ] Verificar Previred — cotizaciones al día
- [ ] Confirmar afiliación mutual de seguridad activa (Ley 16.744)

---

## CÓMO RESTAURAR EL CONTEXTO EN UNA NUEVA SESIÓN

Si abres una nueva conversación, dile al asistente:

> "Continúa desde el punto de restauración del 22/04/2026. Lee `docs/05-reportes/sesiones/2026-04-22-cierre-bloque-sandbox-integrity.md` y `docs/01-proyecto/estado-actual.md` para recuperar el contexto completo."

Los archivos clave para contexto rápido son:
1. `docs/01-proyecto/estado-actual.md` — estado completo del sistema
2. `docs/02-legal/para-abogado/2026-04-22-revision-abogado-documentos-completos.md` — todo lo pendiente con el abogado
3. `docs/01-proyecto/pendientes.md` — backlog de features
4. `CLAUDE.md` (raíz) — instrucciones permanentes del asistente
5. `FROZEN.md` (raíz) — archivos que NO se pueden modificar

---

## MÉTRICAS DEL PROYECTO AL CIERRE

| Métrica | Valor |
|---|---|
| Páginas TSX | 218 archivos |
| Módulos backend (routes) | ~47 archivos |
| Endpoints API | ~594 |
| Tests backend | 36 archivos · 404 passing |
| Integraciones externas | 9 (MP, PayPal, Supabase, Google, FCM, Anthropic, Zoho, Vercel, Render) |
| Documentos legales vigentes | 4 (T&C, Privacy, Cookies, Age-decl) |
| Archivos de docs reorganizados | 231 |
| Commits en esta sesión | 12 |
