# INVENTARIO DE MÓDULOS · Conniku
**Esencia funcional · sin decisiones visuales**

```yaml
DOCUMENT_ID:    CONNIKU.MODULES.INVENTORY
PROJECT:        CONNIKU
SCOPE:          Qué hace cada módulo, cómo se conecta · NO incluye diseño
STATUS:         Referencia funcional
```

---

## Qué es Conniku

Plataforma única universitaria chilena. Tres caras:

1. **Estudiante** · app completa para estudio + social + empleo
2. **Institución** · sistema operativo para universidades
3. **Ecosistema laboral** · diplomas verificables + CV + empleo

**Promesa**: "Tu Universidad entera. En una sola app."

---

## 1 · CAPA PÚBLICA / MARKETING

| Módulo              | Esencia                                              |
|---------------------|------------------------------------------------------|
| `landing`           | Puerta principal · pitch · conversión a registro     |
| `producto`          | Catálogo visual de lo que incluye la plataforma      |
| `planes`            | Pricing · Estudiante vs Business                     |
| `acerca`            | Historia · misión · equipo · transparencia           |
| `como-funciona`     | Flujo usuario paso a paso                            |
| `plataforma`        | Vista unificada de la integración                    |
| `contacto`          | Form · API · datos institucionales                   |
| `soporte`           | Help center · FAQ · self-service                     |
| `kiosko`            | Modo quiosco para tablets físicas en campus          |

---

## 2 · AUTH / ONBOARDING

| Módulo           | Esencia                                      |
|------------------|----------------------------------------------|
| `registro`       | Signup · email institucional preferido       |
| `verificacion`   | Confirmación email · magic link o código     |
| `onboarding`     | Setup inicial · foto, carrera, año, intereses|
| `bienvenida`     | Welcome post-onboarding · primer logro       |

---

## 3 · MÓDULOS DEL ESTUDIANTE

### Hub y perfil
| Módulo            | Esencia                                                               |
|-------------------|-----------------------------------------------------------------------|
| `orbit-u`         | Sistema solar · hub principal · vos al centro, módulos orbitando      |
| `dashboard`       | Vista alternativa al orbit · resumen del día · KPIs                   |
| `perfil`          | Perfil público social · CV vivo · stats · posts · logros · bio        |

### Producción académica
| Módulo            | Esencia                                                               |
|-------------------|-----------------------------------------------------------------------|
| `workspaces`      | Editor tipo Notion + IA Athena integrada · apuntes · ensayos          |
| `biblioteca`      | +70k títulos académicos digitales · búsqueda · lectura inline         |
| `athena`          | IA propietaria Conniku · entrenada en currículum chileno              |
| `cursos-diploma`  | Microcursos · badges · Diploma Conniku verificable                    |
| `quizzes`         | Quizzes + flashcards · IA genera desde tus apuntes                    |

### Social
| Módulo            | Esencia                                                               |
|-------------------|-----------------------------------------------------------------------|
| `chat`            | Mensajes 1:1 y grupos · verificación U · moderación                   |
| `amigos`          | Red de contactos universitarios · verificados                         |
| `comunidades`     | Grupos por carrera, ramo, intereses, U                                |

### Estudio activo
| Módulo            | Esencia                                                               |
|-------------------|-----------------------------------------------------------------------|
| `study-rooms`     | Salas virtuales para estudiar acompañado · Pomodoro compartido        |
| `tutores`         | Marketplace tutores verificados · 1:1 · grupales                      |
| `classroom`       | Aula virtual integrada · video · pizarra · screen share               |
| `calendar`        | Calendario unificado: clases, deadlines, eventos, tutorías            |

### Integración institucional
| Módulo            | Esencia                                                               |
|-------------------|-----------------------------------------------------------------------|
| `mi-universidad`  | **Conector institucional** · ver sección 5 abajo                      |

### Vida profesional
| Módulo            | Esencia                                                               |
|-------------------|-----------------------------------------------------------------------|
| `cv-editor`       | Generador de CV automático · tu vida Conniku = tu CV                  |
| `oferta-laboral`  | Bolsa de trabajo · filtrada por carrera · empleadores verificados     |
| `gamification`    | Logros · racha · puntos · ranking                                     |
| `tienda`          | Marketplace interno · merch · descuentos partners (futuro)            |

### Plataforma
| Módulo            | Esencia                                                               |
|-------------------|-----------------------------------------------------------------------|
| `movil`           | Apps iOS + Android · sync web · push                                  |

---

## 4 · BUSINESS · PORTAL UNIVERSIDADES

Cinco áreas, 44 módulos. Para institución cliente (universidades que adoptan Conniku como ERP).

### Finanzas y Administración (8)
Hub · Dashboard Ejecutivo · Analytics · Contabilidad · Facturación DTE · Panel Financiero · Gastos · Presupuestos

### Gestión de Personas / HR (13)
Hub · Directorio · Usuarios · Reclutamiento · Onboarding HR · Contratos · Documentos · Desempeño · Capacitación SENCE · Asistencia · Accesos · Vacaciones · Mi Portal trabajador

### Remuneraciones y Legal Laboral (9)
Hub · Liquidaciones · Libro Remuneraciones · Previred · Impuestos F129 · DJ1887 · Finiquitos · Historial pagos · Inspección DT

### Legal y Compliance (3)
Hub · Módulo legal · Anti-fraude

### Herramientas (10)
Hub · Admin usuarios · Automatizaciones · Biblioteca docs · Certificaciones · Email CEO · Email contacto · Push · Guía owner · Tutores externos

---

## 5 · MI UNIVERSIDAD · conector institucional (detalle preservado)

**Concepto**: sincronización bidireccional oficial entre el sistema U y Conniku.

### Lo que consume del sistema U
- Notas reales del semestre
- Asistencia oficial
- Ramos inscritos
- Calendario académico institucional
- Certificados y diplomas emitidos por la U

### Lo que entrega a la U / al usuario
- Verificación institucional del perfil Conniku
- Diploma Conniku validado cruzadamente con la U
- CV oficial con notas reales validadas

### Arquitectura lógica
- **OAuth institucional** · acuerdo firmado por cada U partner
- **APIs de lectura** · portal U → Conniku (GET)
- **APIs de escritura** acotadas · Conniku → U (solo certificados, opcional)
- **Tokens seguros** · almacenamiento cifrado · refresh automático
- **Sync** · periódico (diario) + on-demand (user click)

### UI del usuario
El perfil tiene un card "Mi U" destacado en sidebar con:
- Nombre de la Universidad
- Promedio semestral sincronizado
- Asistencia %
- Ramos activos
- Link a detalle completo

### Estado actual
- UI: stub construido en `pages/perfil.html` (sidebar "Mi U card")
- Backend: endpoints por definir · pending OAuth agreements con U partners

---

## 6 · LEGAL

| Archivo                    | Propósito                        |
|----------------------------|----------------------------------|
| `legal-terms`              | Términos y Condiciones            |
| `legal-privacy`            | Política de Privacidad (Ley 19.628)|
| `legal-cookies`            | Política de Cookies               |
| `legal-age-declaration`    | Declaración mayoría de edad       |

Linkeados desde footer de todas las páginas públicas.

---

## 7 · CONEXIONES CRÍTICAS

```
FLUJO DE ENTRADA
  landing → registro → verificacion → onboarding → bienvenida → orbit-u (hub)

HUB CENTRAL
  orbit-u ↔ cada módulo (click planeta → abre módulo)

PERFIL COMO CV VIVO
  perfil ← gamification (badges) ← cursos-diploma (logros)
        ← mi-universidad (notas, asistencia)
        ← posts propios · racha · stats
  perfil → cv-editor → oferta-laboral → empleo

PRODUCCIÓN ACADÉMICA
  workspaces ↔ athena (IA inline)
             ↔ biblioteca (citar)
             → quizzes (auto-generar desde apuntes)

SOCIAL
  chat ↔ amigos ↔ comunidades ↔ study-rooms ↔ eventos (calendar)

INSTITUCIONAL
  mi-universidad ↔ business (cuando la U es trabajador · mi-portal)
```

---

## 8 · DECISIONES DE PRIORIDAD

Si hay que construir módulos uno por uno, orden recomendado:

1. `orbit-u` · hub ✅
2. `perfil` · CV vivo ✅
3. `dashboard` · entrada alternativa
4. `workspaces` + `athena` · producción académica (core value)
5. `chat` + `comunidades` · social (engagement)
6. `mi-universidad` · conector real (confianza institucional)
7. `cursos-diploma` + `gamification` · retención
8. `cv-editor` + `oferta-laboral` · conversión laboral
9. El resto (biblioteca · tutores · classroom · calendar · study-rooms · quizzes · tienda · móvil · business · legal)

---

**Fin del inventario. Esencia pura. Sin diseño. Sin visual legacy.**
