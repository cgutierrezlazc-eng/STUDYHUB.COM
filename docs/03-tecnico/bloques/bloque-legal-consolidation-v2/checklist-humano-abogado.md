# Checklist humano — abogado · bloque-legal-consolidation-v2

**Creado**: 2026-04-20
**Destinatario**: Cristian Gutiérrez + abogado que Cristian designe
**Propósito**: validar las 14 citas legales que Tori cargará desde fuentes
oficiales (decisión 4A del 2026-04-20). Tori carga los borradores → abogado
valida antes del merge → Cristian da OK final.

---

## Declaración obligatoria

Este documento es un **instrumento de verificación**, no una afirmación
de cumplimiento. Tori (web-architect) identificó 14 artículos legales
cuya cita exacta es necesaria para el bloque.

**Decisión 4A del 2026-04-20**: Tori carga cada cita consultando la
fuente oficial (leychile.cl, eur-lex, bcn.cl) y pega el texto
literal del artículo vigente al día de la consulta, junto con la URL
y fecha de recolección. Esto **no sustituye** la validación profesional
del abogado — es un **borrador verificable** que reduce fricción.

El abogado revisa cada fila antes del merge a main. Si alguna cita
está mal transcrita o la interpretación del plan no corresponde al
texto del artículo, el abogado lo corrige en esa misma fila.

La regla `§CLAUDE.md Prohibición de inventar información legal`
sigue aplicando: Tori NO rellena desde memoria. Cada fila tiene URL
consultada + fecha. Si Tori no pudo obtener el texto (404, redirección
a portal de búsqueda, etc.), la fila queda marcada
`[FUENTE NO ACCESIBLE — abogado debe proveer texto]`.

---

## Instrucciones para completar

Para cada fila:

1. Abrir la URL oficial listada.
2. Leer el artículo completo en su versión vigente a la fecha.
3. Confirmar que el texto responde a lo que el bloque requiere.
4. Marcar `Verificado` con fecha + iniciales de quien verificó.
5. Si la fuente resulta desactualizada, suspendida, o reemplazada,
   registrarlo en la columna `Observaciones` y proponer fuente
   alternativa.
6. Si hay duda material entre redacción del artículo y lo que el
   plan quiere aplicar, **detener** y discutirlo con Cristian antes
   de cerrar.

**Formato de fila cerrada**:

    | L1 | Art. 3 bis letra b, Ley 19.496 | ... | ✅ 2026-04-22 AG | Vigente al 2026-04-20 |

donde `AG` son iniciales del abogado.

---

## Tabla de verificación

| ID | Norma | Uso en el bloque | URL oficial | Verificado | Observaciones |
|----|-------|------------------|-------------|-----------:|---------------|
| L1 | Art. 3 bis letra b, Ley 19.496 (Protección Consumidor) | Pieza 4 — retracto 10 días corridos servicios digitales | https://www.bcn.cl/leychile/navegar?idNorma=61438 | ⬜ | Confirmar "días corridos" + aplicabilidad a servicios digitales suscripción |
| L2 | Art. 12 Ley 19.496 | T&C §8 — obligación información veraz al consumidor | https://www.bcn.cl/leychile/navegar?idNorma=61438 | ⬜ | |
| L3 | Art. 17, 71 B Ley 17.336 (Propiedad Intelectual) | T&C §8.3 — propiedad intelectual sobre documentos exportados | https://www.bcn.cl/leychile/navegar?idNorma=28933 | ⬜ | |
| L4 | Art. 4° Ley 19.628 (Protección Vida Privada Chile) | Privacy — deber de información al titular | https://www.bcn.cl/leychile/navegar?idNorma=141599 | ⬜ | |
| L5 | Art. 16 Ley 19.628 | Privacy — plazos derechos ARCO (2 días hábiles) | https://www.bcn.cl/leychile/navegar?idNorma=141599 | ⬜ | Confirmar plazo exacto vigente |
| L6 | GDPR Art. 13 (Reglamento UE 2016/679) | Privacy — información obligatoria al recolectar | https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679 | ⬜ | |
| L7 | GDPR Art. 6(1)(a),(b),(f) | Privacy + re-aceptación — bases legales tratamiento | https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679 | ⬜ | |
| L8 | GDPR Art. 7 | Pieza 6 — demostrar consentimiento | https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679 | ⬜ | |
| L9 | GDPR Art. 28 | Privacy — encargados (Supabase, FCM, Google, MP, PayPal, Zoho, Vercel, Render, Claude, Capacitor) | https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32016R0679 | ⬜ | Definir si hay DPAs firmados con cada encargado. Si no, plan deberá agregar sub-tarea |
| L10 | Directiva ePrivacy 2002/58/CE Art. 5(3) | Pieza 5 — consentimiento cookies UE | https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32002L0058 | ⬜ | Decidir si aplica a usuarios UE de Conniku HOY (Chile-first) |
| L11 | Ley 19.799 Chile | Pieza 6 — firma electrónica simple, valor probatorio del checkbox | https://www.bcn.cl/leychile/navegar?idNorma=196640 | ⬜ | Decidir si se cita o basta con evidencia forense (timestamp+IP+UA+hash) |
| L12 | Código Penal Chile Art. 210 (falsedad declaración) | Checkbox edad — ya vigente en CLAUDE.md como "sin abogado aún" | https://www.bcn.cl/leychile/navegar?idNorma=1984 | ⬜ | Este ya estaba pendiente desde antes del bloque. Cerrar ahora. |
| L13 | Código Civil Chile Art. 1447 (capacidad) | Privacy — fundamentar 18+ | https://www.bcn.cl/leychile/navegar?idNorma=172986 | ⬜ | Decidir si se cita explícitamente o basta con referencia general |
| L14 | Directiva 2011/83/UE (14 días retracto UE) | T&C §retracto — solo si Conniku declara operar en UE | https://eur-lex.europa.eu/legal-content/ES/TXT/?uri=CELEX:32011L0083 | ⬜ | Decidir si declarar o remover. Chile-first sugiere remover hasta expansión efectiva |

---

## Decisiones adicionales que requieren abogado

Más allá de verificar citas, el abogado debe opinar sobre:

### D1. Encargados externos del tratamiento (GDPR Art. 28)

Inventario identificado por web-architect:

1. **Supabase** — base de datos + auth (infraestructura)
2. **Firebase Cloud Messaging (Google)** — push notifications
3. **Capacitor (Ionic)** — runtime móvil
4. **Google OAuth** — auth
5. **Zoho Mail** — email transaccional
6. **MercadoPago** — pagos Chile
7. **PayPal** — pagos internacional (si aplica)
8. **Anthropic Claude API** — asistente conversacional al usuario
9. **Vercel** — hosting frontend
10. **Render** — hosting backend

**Pregunta al abogado**: ¿con cuáles de estos es obligatorio tener DPA
firmado hoy según ley chilena y GDPR? ¿Cuáles requieren cláusulas
estándar de la Comisión Europea (SCCs)?

Respuesta (abogado):
```
[pendiente]
```

### D2. Cumplimiento "+18" y menores

**Pregunta al abogado**: ¿es suficiente el checkbox declarativo + fecha
de nacimiento validada para proteger a Conniku ante un litigio por
registro de menor? ¿Debemos reforzar con verificación KYC antes de los
10.000 MAU (umbral CLAUDE.md)?

Respuesta (abogado):
```
[pendiente]
```

### D3. Re-aceptación obligatoria

**Pregunta al abogado**: ¿el bloqueo total del producto hasta re-aceptar
v3.1 es legalmente aceptable en Chile (Ley 19.496) y UE (GDPR)? ¿O
debemos ofrecer "cerrar cuenta sin re-aceptar + exportar datos" como
alternativa obligatoria?

Respuesta (abogado):
```
[pendiente]
```

### D4. Retención 5 años de evidencia legal

**Pregunta al abogado**: 5 años de retención post-borrado es el valor
declarado en CLAUDE.md y el plan. ¿Cuál es la base legal chilena para
este plazo? ¿Prescripción acción civil (Art. 2515 Código Civil = 5 años)?
¿Debe ser mayor o menor según tipo de evidencia?

Respuesta (abogado):
```
[pendiente]
```

---

## Cuando este checklist esté cerrado

1. Cristian cambia el estado de este archivo a `APROBADO DD-MM-2026`.
2. Cristian responde a Tori en nueva sesión con el texto literal:
   `CITAS LEGALES VERIFICADAS, EJECUTAR BLOQUE LEGAL`.
3. Tori invoca al legal-docs-keeper (Capa 0) con el plan maestro +
   este checklist cerrado como input.
4. El bloque avanza al Gate G0 → G1 → builder.

Hasta entonces, ningún builder del proyecto debe tocar los archivos
`src/pages/TermsOfService.tsx`, `src/pages/PrivacyPolicy.tsx`,
`backend/constants/consumer.py`, `shared/legal_texts.ts`, ni crear
`src/pages/CookiesPolicy.tsx` para esta causa.
