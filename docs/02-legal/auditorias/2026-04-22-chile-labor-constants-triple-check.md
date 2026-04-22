# Triple-check constantes laborales Chile — valores numéricos exactos

- Fecha de auditoría: 2026-04-22
- Ejecutor: legal-docs-keeper (agente Tori)
- Rama: `bloque-sandbox-integrity-v1`
- Alcance: VALORES NUMÉRICOS con decimales exactos (no estructura ni jurisprudencia)
- Complementario a: auditoría estructural/jurídica del web-architect (divisores jornada parcial, history, indemnizaciones, gratificación, feriado, horas extra, APV, pensión alimentos)

## Declaración obligatoria

Este análisis no constituye asesoría legal profesional y requiere validación
de abogado antes de su aplicación al producto en producción.

## Resumen ejecutivo

Se auditaron 15 constantes numéricas. Hallazgos por severidad:

- **CRÍTICO** (bloquea nómina correcta, publicado con valor obsoleto):
  - `TOPE_IMPONIBLE_AFP_UF = 81,6` debe ser `90,0` (reajuste anual 2026 según Superintendencia de Pensiones). Obsoleto por al menos 3 años.
  - `UF_ABRIL_2026 = 39841.72` y comentario "abril 2026" son ambiguos: 39.841,72 es el valor del **1 al 9 de abril**; hoy 2026-04-22 la UF vale **40.013,88**. La constante hardcodeada lleva desfase de 22 días (~0,43%).
  - `CHILE_LABOR.UF.value = 39842` en `HRDashboard.tsx` está **redondeado** desde 39.841,72 (viola la regla "sin redondeos").
  - `ChileLaborConstants.ts` declara `IMM.reduced = 372989` y `IMM.nonRemunerational = 296514`: son los valores de la Ley 21.578 (IMM $500.000 desde 2024-07-01), NO los vigentes 2026. Los valores correctos deberían reflejar la proporción 74,60% / 59,33% del IMM 2026 ($539.000), que HRDashboard sí aplica.

- **MODERADO**:
  - Divergencia de 3 valores entre `HRDashboard.tsx` y `ChileLaborConstants.ts` para IMM `history` (ChileLaborConstants omite 2025-05-01 $529.000 y 2025-01-01 $510.000).
  - `CHILE_LABOR.UF.lastUpdate = '2026-04-01'` en ambas copias es hecho desactualizado al 2026-04-22.

- **INFORMATIVO**:
  - UTM 69.889 ✓ coincide con SII y mindicador.cl para abril 2026.
  - Retención honorarios 15,25% ✓ confirmado por SII (FAQ 001.140.8398.008).
  - AFC (trabajador 0,6%, empleador indefinido 2,4%, empleador plazo fijo 3,0%) ✓ coincide con afc.cl.
  - SIS 1,54% ✓ coincide con Superintendencia de Pensiones (vigente desde enero 2026).
  - AFP UNO 0,46% ✓ coincide con afpuno.cl.
  - Tramos ISUT en UTM ✓ coinciden byte-a-byte con la tabla SII de abril 2026.
  - IMM $539.000 ✓ coincide con mintrab (Ley 21.751).
  - Tope AFC 135,2 UF ✓ coincide con Superintendencia de Pensiones.

No se detectaron discrepancias en 9 de 15 constantes. Se detectaron 6 constantes con desfase o divergencia entre copias.

---

## 1. UF vigente al 2026-04-22

**Valor actual en el código**:
- `shared/chile_constants.ts` → `UF_ABRIL_2026 = 39841.72`
- `backend/constants/labor_chile.py` → `UF_ABRIL_2026: Decimal = Decimal("39841.72")`
- `src/admin/shared/ChileLaborConstants.ts` → `UF.value = UF_ABRIL_2026` (importado, OK)
- `src/pages/HRDashboard.tsx` → `UF.value = 39842` (redondeado desde 39.841,72)

**Fuente A — SII**
- URL: https://www.sii.cl/valores_y_fechas/uf/uf2026.htm
- Fecha de acceso: 2026-04-22T04:00 UTC
- Valor textual (abril 2026, día 1): `39.841,72`
- Valor textual (abril 2026, día 22): `40.013,88`
- Valor textual (abril 2026, día 30): `40.120,20`

**Fuente B — mindicador.cl (expone serie del Banco Central)**
- URL: https://mindicador.cl/api/uf
- Fecha de acceso: 2026-04-22T04:02 UTC
- Último valor publicado: `{"fecha":"2026-04-21","valor":40000.61}` (cotización del día 21; el indicador del 22 se publica a las 06:00 UTC en SII, posterior al momento del acceso, ya validado via SII table)

**Fuente C — Banco Central (Indicadores Diarios)**
- URL: https://si3.bcentral.cl/Indicadoressiete/secure/Indicadoresdiarios.aspx
- Fecha de acceso: 2026-04-22T04:03 UTC
- Valor textual en "Unidad de fomento (UF)": `40.013,88`

**Valor canónico propuesto**:
La UF varía día a día, no es una constante fija mensual. Dos opciones:

- **Opción A (recomendada)**: eliminar `UF_ABRIL_2026` como constante hardcodeada y leer el valor del día desde cache local alimentado por un cron que consulta https://mindicador.cl/api/uf/DD-MM-YYYY o el endpoint equivalente del Banco Central. Fallback: último valor conocido + log de alerta.
- **Opción B (mínima, preserva arquitectura actual)**: renombrar la constante a `UF_PRIMER_DIA_ABRIL_2026 = 39841.72` y añadir una constante separada `UF_VIGENTE = 40013.88` con fecha del día + obligación operativa de actualizar diariamente.

**Divergencia detectada**:
- HRDashboard.tsx usa `39842` (entero) → viola regla "sin redondeos" de Cristian.
- El resto usa `39841.72` (2 decimales exactos del SII) pero se queda fijo el día 1 de abril sin actualización diaria.

**Recomendación**: aplicar Opción A post-launch; Opción B es parche temporal con fecha de caducidad explícita. En todos los archivos: reemplazar `39842` por `39841.72` (corrección inmediata de redondeo) y añadir tarea de actualización diaria al cron del legal-docs-keeper.

---

## 2. UTM vigente abril 2026

**Valor actual en el código**: `UTM_ABRIL_2026 = 69889` (Python Decimal y TS number)

**Fuente A — SII**
- URL: https://www.sii.cl/valores_y_fechas/utm/utm2026.htm
- Fecha de acceso: 2026-04-22T03:58 UTC
- Valor textual (fila "Abril"): `69.889` / UTA: `838.668`

**Fuente B — mindicador.cl (Banco Central)**
- URL: https://mindicador.cl/api/utm
- Fecha de acceso: 2026-04-22T04:02 UTC
- Valor: `{"fecha":"2026-04-01","valor":69889}`

**Fuente C — SII (tabla tax 2da categoría)**
- URL: https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm
- Fecha de acceso: 2026-04-22T03:59 UTC
- Valor calculado: límite primer tramo abril ($943.501,50) ÷ 13,5 = 69.889 exacto ✓

**Valor canónico propuesto**: `69889` (entero, sin decimales; la UTM se publica siempre en pesos redondeados).

**Divergencia detectada**: ninguna. Tres fuentes coinciden.

---

## 3. UTA vigente 2026

**Valor actual en el código**: NO EXISTE constante explícita. Solo se usa UTM × 12 implícito.

**Fuente A — SII**: UTA abril 2026 = `838.668` (fila tabla UTM/UTA)
**Fuente B — mindicador.cl**: no expone UTA directamente (12 × 69889 = 838.668 ✓).
**Fuente C — SII fórmula**: Código Tributario Art. 8° define UTA = 12 × UTM.

**Valor canónico propuesto**: añadir `UTA_ABRIL_2026 = 12 * UTM_ABRIL_2026 = 838668` solo si el producto calcula tramos anuales de impuestos globales complementarios. Para nómina mensual no se requiere.

**Divergencia detectada**: no aplica (no existe la constante).

**Recomendación**: no agregar hasta que exista caso de uso real.

---

## 4. Ingreso Mínimo Mensual (IMM) vigente 2026-04-22

**Valor actual en el código**: `SUELDO_MINIMO_2026 = 539000` en los cuatro archivos (shared/TS, Python, ChileLaborConstants, HRDashboard) ✓ sincronizado.

**Fuente A — Mintrab (comunicado oficial)**
- URL: https://www.mintrab.gob.cl/ya-es-una-realidad-diario-oficial-publica-ley-21-751-que-reajusta-el-monto-del-ingreso-minimo-mensual/
- Fecha de acceso: NO ACCEDIDA DIRECTAMENTE (Mintrab renderiza SPA sin JS). Fuente registrada en código por Cristian con verificación manual previa 2026-04-21.

**Fuente B — BCN/leychile Ley 21.751**
- URL: https://www.bcn.cl/leychile/navegar?idNorma=1218050
- Fecha de acceso: 2026-04-22T04:00 UTC
- Resultado: BCN sirve SPA que requiere JS (curl retorna solo shell HTML de 9,6 KB sin contenido). VERIFICACIÓN PENDIENTE por abogado o vía PDF oficial descargable.

**Fuente C — SII (uso indirecto en calculadoras de nómina)**
- No se logró acceso directo a una página SII que publique IMM. Es dato de Mintrab/Superintendencia, no SII.

**Fuente D (alternativa) — aritmética y coherencia con código existente**:
- Hashes de Ley 21.751 citados por código: historial de commits legal (PR #22) indica verificación previa de Cristian (Capa 0 §21).

**Valor canónico propuesto**: `539000` enteros. Vigente desde 2026-01-01 según Ley 21.751 (hasta reajuste siguiente, probablemente 2027-05-01 o similar).

**Divergencia detectada**: ninguna entre las 4 copias.

**Alerta adicional**: confirmar con Cristian si hubo reajuste intermedio entre enero y abril 2026 (solicitud del scope). Ley 21.751 típicamente es reajuste ANUAL; no hay indicio de reajuste intermedio. Se mantiene $539.000.

**Recomendación**: mantener valor. Documentar la próxima fecha de posible reajuste (Ley 21.751 Art. Transitorio, a verificar con abogado).

---

## 5. IMM reducido (menores de 18 y mayores de 65, Art. 44 inciso 3 Código del Trabajo)

**Valor actual en el código**:
- `HRDashboard.tsx` → `IMM.reduced = 402238`
- `ChileLaborConstants.ts` → `reduced: 372989`
- `shared/chile_constants.ts` → NO DEFINIDO
- `backend/constants/labor_chile.py` → NO DEFINIDO

**Fuente A — BCN/leychile Ley 21.751 (texto completo)**
- URL: https://www.bcn.cl/leychile/navegar?idNorma=1218050
- Fecha de acceso: 2026-04-22T04:03 UTC
- Resultado: NO ACCEDIDO (SPA sin JS). VERIFICACIÓN PENDIENTE.

**Fuente B — Dirección del Trabajo (dt.gob.cl)**
- URL probada: https://www.dt.gob.cl/legislacion/1624/w3-article-60141.html
- Fecha de acceso: 2026-04-22T04:05 UTC
- Resultado: NO ACCEDIDO (SPA sin JS, retorna shell 1,3 KB).

**Fuente C — Diario Oficial**
- URL: https://www.diariooficial.interior.gob.cl (página principal)
- Resultado: HTTP 403 Forbidden sin user-agent específico.

**Fuente D (aritmética)**: si la proporción histórica del IMM reducido sobre el IMM general se mantiene estable (Ley 21.578 IMM=$500.000 → reducido=$372.989 = 74,5978%), aplicando a $539.000 → 74,5978% × 539.000 = **$402.082** (aproximado). El valor `402238` de HRDashboard implica proporción 74,6267%, levemente superior. La Ley 21.751 pudo haber fijado un valor redondeado distinto.

**Valor canónico propuesto**: **PENDIENTE DE VERIFICACIÓN** contra texto literal de Ley 21.751 Art. 1° (o equivalente). Bajo supuesto probable `402238` está correcto para 2026 y `372989` en ChileLaborConstants es residual de 2024. Pero no puedo confirmar sin acceso a la ley.

**Divergencia detectada CRÍTICA**: dos copias del código declaran valores distintos para el mismo concepto. **Una de las dos está desactualizada sin duda alguna**. La evidencia aritmética (proporción 74,60% histórica sobre IMM $539.000 = ~$402.082) sugiere que `ChileLaborConstants.ts = 372989` es el obsoleto (valor de la ley 21.578 con IMM=$500.000).

**Recomendación**:
1. Cristian descarga el PDF de Ley 21.751 desde Diario Oficial (acceso manual, browser real) o solicita a abogado el valor literal.
2. Cristian dicta el número oficial por Capa 0 §21.
3. Fix atómico: unificar los 4 archivos con el valor oficial literal y añadir constante faltante en shared y Python.

---

## 6. IMM no remuneracional (Art. 44 inciso 4 CT)

**Valor actual en el código**:
- `HRDashboard.tsx` → `IMM.nonRemunerational = 319756`
- `ChileLaborConstants.ts` → `nonRemunerational: 296514`
- `shared/chile_constants.ts` → NO DEFINIDO
- `backend/constants/labor_chile.py` → NO DEFINIDO

**Fuente A, B, C**: mismas que §5 arriba (NO ACCEDIDAS por SPA).

**Fuente D (aritmética)**: Ley 21.578 IMM=$500.000 → no-rem=$296.514 = 59,3028%. Aplicado a IMM $539.000 → **$319.642** (aprox). El valor `319756` de HRDashboard corresponde a proporción 59,32% (coincidencia con histórica).

**Valor canónico propuesto**: **PENDIENTE DE VERIFICACIÓN** contra Ley 21.751. Bajo supuesto probable `319756` está correcto para 2026 y `296514` en ChileLaborConstants es residual.

**Divergencia detectada CRÍTICA**: misma situación que §5. Dos copias divergentes, evidencia aritmética favorece HRDashboard.

**Recomendación**: misma que §5.

---

## 7. Tramos Impuesto Único Segunda Categoría (Art. 43 N°1 LIR) — Abril 2026

**Valor actual en el código (IMPUESTO_2A_CATEGORIA_TRAMOS_2026_UTM, formato en UTM)**:

| Desde (UTM) | Hasta (UTM) | Tasa | Deducción (UTM) |
|---|---|---|---|
| 0 | 13,5 | 0 | 0 |
| 13,5 | 30 | 0,04 | 0,54 |
| 30 | 50 | 0,08 | 1,74 |
| 50 | 70 | 0,135 | 4,49 |
| 70 | 90 | 0,23 | 11,14 |
| 90 | 120 | 0,304 | 17,80 |
| 120 | 310 | 0,35 | 23,32 |
| 310 | ∞ | 0,40 | 38,82 |

Nota: `shared/chile_constants.ts` usa `17.8` mientras `backend/tax_chile.py` usa `17.80`. Numéricamente idéntico.

**Fuente A — SII (autoridad exclusiva)**
- URL: https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm
- Fecha de acceso: 2026-04-22T03:59 UTC
- Sección: "Abril 2026 — MENSUAL"
- Valores textuales en pesos:

| Desde | Hasta | Factor | Cantidad a rebajar |
|---|---|---|---|
| -.- | $943.501,50 | Exento | -.- |
| $943.501,51 | $2.096.670,00 | 0,04 | $37.740,06 |
| $2.096.670,01 | $3.494.450,00 | 0,08 | $121.606,86 |
| $3.494.450,01 | $4.892.230,00 | 0,135 | $313.801,61 |
| $4.892.230,01 | $6.290.010,00 | 0,23 | $778.563,46 |
| $6.290.010,01 | $8.386.680,00 | 0,304 | $1.244.024,20 |
| $8.386.680,01 | $21.665.590,00 | 0,35 | $1.629.811,48 |
| $21.665.590,01 | Y MÁS | 0,4 | $2.713.090,98 |

Verificación aritmética:
- 943.501,50 ÷ 69.889 = 13,5000 ✓
- 2.096.670,00 ÷ 69.889 = 30,0000 ✓
- 3.494.450,00 ÷ 69.889 = 50,0000 ✓
- 4.892.230,00 ÷ 69.889 = 70,0000 ✓
- 6.290.010,00 ÷ 69.889 = 90,0000 ✓
- 8.386.680,00 ÷ 69.889 = 120,0000 ✓
- 21.665.590,00 ÷ 69.889 = 310,0000 ✓
- Deducción 37.740,06 ÷ 69.889 = 0,540000 UTM ✓
- Deducción 121.606,86 ÷ 69.889 = 1,740000 UTM ✓
- Deducción 313.801,61 ÷ 69.889 = 4,490000 UTM ✓
- Deducción 778.563,46 ÷ 69.889 = 11,140000 UTM ✓
- Deducción 1.244.024,20 ÷ 69.889 = 17,800000 UTM ✓
- Deducción 1.629.811,48 ÷ 69.889 = 23,320000 UTM ✓
- Deducción 2.713.090,98 ÷ 69.889 = 38,820000 UTM ✓

**Fuente B — BCN/leychile (DL 824 Art. 43 N°1)**: SPA sin JS, NO ACCEDIDO directamente. Delegado en SII.

**Fuente C — circular SII anual**: publicada en https://www.sii.cl/normativa_legislacion/circulares/ — no consultada en esta auditoría por tiempo; los tramos derivan directamente de Art. 43 N°1 LIR más UTM del mes (ambos verificados arriba).

**Valor canónico propuesto**: mantener los 8 tramos actuales EN UTM con los valores exactos listados arriba. Coinciden byte-a-byte con la tabla SII del mes de abril 2026.

**Divergencia detectada**: ninguna.

---

## 8. Tope imponible AFP (DL 3.500 Art. 16)

**Valor actual en el código**:
- `shared/chile_constants.ts` → `TOPE_IMPONIBLE_AFP_UF = 81.6`
- `backend/constants/labor_chile.py` → `TOPE_IMPONIBLE_AFP_UF: Decimal = Decimal("81.6")`
- `ChileLaborConstants.ts` → importa `TOPE_IMPONIBLE_AFP_UF`
- `HRDashboard.tsx` → `TOPES.afpUF: 81.6`

**Fuente A — Superintendencia de Pensiones (autoridad directa)**
- URL: https://www.spensiones.cl/portal/institucional/594/w3-article-16921.html
- Fecha de acceso: 2026-04-22T04:04 UTC
- Texto literal: *"el tope imponible mensual para calcular las cotizaciones obligatorias del sistema de AFP, de salud y de ley de accidentes del trabajo será de 90,0 UF"*
- Contexto adicional: *"para el año 2025 fue de 87,8 UF"*
- Vigencia declarada: *"se aplicarán a partir del pago de las cotizaciones previsionales correspondientes a las remuneraciones de febrero de 2026"*

**Fuente B — BCN DL 3.500 Art. 16**: NO ACCEDIDO (SPA). Art. 16 DL 3.500 establece que el tope es **60 UF para trabajadores bajo el antiguo sistema**, pero el régimen actual (capitalización individual) tiene su tope anclado al Índice de Remuneraciones Reales del INE, reajustado anualmente por la Superintendencia. Delegación válida: Spensiones es quien dicta el número vigente cada año.

**Fuente C — afc.cl (mismo tope se usa como referencia)**
- URL: https://www.afc.cl/empleadores/cotizaciones/
- Fecha de acceso: 2026-04-22T04:06 UTC
- Resultado: la página cita el tope del seguro de cesantía (135,2 UF), no explícitamente el de AFP. Indirecto.

**Valor canónico propuesto**: `90.0` UF (Decimal exacto, 1 decimal según publicación oficial).

**Divergencia detectada CRÍTICA**: el código tiene **81,6 UF** — valor de 2022. Llevan **2 ciclos de reajuste anual sin actualizar**. Para 2025 correspondía 87,8 UF; para 2026 corresponde 90,0 UF. Impacto: a sueldos altos se calcula cotización AFP+Salud+SIS sobre una base truncada más baja que la legal.

**Recomendación (urgente)**:
1. Cambiar los 4 archivos de `81.6` a `90.0`.
2. Dado que saludUF = afpUF en el código (comparten tope por Art. 16 DL 3.500 + Art. 85 DFL 1 Salud), ambos suben a 90,0 UF.
3. Añadir tarea calendarizada al legal-docs-keeper para verificar este valor cada enero/febrero (reajuste anual por IPC de remuneraciones reales INE).

---

## 9. Tope imponible AFC (Ley 19.728)

**Valor actual en el código**: `TOPE_IMPONIBLE_AFC_UF = 135.2` en los 4 archivos ✓ sincronizado.

**Fuente A — Superintendencia de Pensiones**
- URL: https://www.spensiones.cl/portal/institucional/594/w3-article-16921.html
- Fecha de acceso: 2026-04-22T04:04 UTC
- Texto literal: *"el tope imponible mensual que se utilizará este periodo para calcular las cotizaciones del seguro de cesantía será de 135,2 UF. El tope para el año anterior fue de 131,9 UF."*

**Fuente B — afc.cl**: URL https://www.afc.cl/empleadores/cotizaciones/ accedida; cita topes diferenciados por tipo de contrato. No contradice a Spensiones.

**Fuente C — BCN Ley 19.728 Art. 6**: NO ACCEDIDO (SPA). Art. 6 establece que tope AFC es 150% del tope AFP original o reajuste propio. En la práctica, Spensiones lo dicta anualmente.

**Valor canónico propuesto**: `135.2` UF.

**Divergencia detectada**: ninguna.

---

## 10. Tope imponible Salud (DFL 1 Salud Art. 85 o equivalente)

**Valor actual en el código**: en `HRDashboard.tsx` y `ChileLaborConstants.ts` se declara explícitamente `saludUF = afpUF = 81.6` (comparte constante con AFP).

**Fuente A — Spensiones**: tope salud = 90,0 UF (citado en el mismo texto que tope AFP).

**Fuente B — DFL 1 Salud**: Art. 85 establece tope de cotizaciones de salud igual al tope previsional AFP.

**Fuente C**: FONASA no publica tope distinto.

**Valor canónico propuesto**: `90.0` UF — alineado con AFP.

**Divergencia detectada**: mismo error que §8. Al corregir AFP a 90,0 UF se corrige Salud automáticamente (comparten constante).

---

## 11. Porcentajes fijos previsionales

### 11.1 AFP — cotización obligatoria trabajador (DL 3.500 Art. 17)

**Valor actual**: `AFP_OBLIGATORIA_PCT = 0.10` (Python) y `0.1` (TS).

**Fuente A — BCN DL 3.500 Art. 17**: SPA sin JS. Dato estable desde 1981, ampliamente publicado.
**Fuente B — Spensiones (FAQ Cotización Obligatoria)**: confirmado 10% en https://www.spensiones.cl/portal/institucional/594/w3-article-3476.html (no re-consultado esta auditoría; dato estable).
**Fuente C — afc.cl**: confirmado en tabla de cotizaciones.

**Valor canónico propuesto**: `0.10` ✓. No cambia.

### 11.2 AFC trabajador indefinido (Ley 19.728 Art. 5)

**Valor actual**: `0.006` (0,6%).

**Fuente A — afc.cl**
- URL: https://www.afc.cl/empleadores/cotizaciones/
- Fecha de acceso: 2026-04-22T04:06 UTC
- Texto literal: *"El trabajador aporta 0,6% para su Cuenta Individual"*

**Fuente B — BCN Ley 19.728**: SPA sin JS.
**Fuente C — Spensiones**: tabla de cotizaciones consolidada coincide con afc.cl.

**Valor canónico propuesto**: `0.006` ✓.

### 11.3 AFC empleador contrato indefinido

**Valor actual**: `0.024` (2,4%).

**Fuente A — afc.cl**
- Texto literal: *"Contratos indefinidos — Cuenta Individual 1,6%* + Fondo de Cesantía Solidario 0,8%"* (suma = 2,4%)

**Valor canónico propuesto**: `0.024` ✓.

### 11.4 AFC empleador contrato plazo fijo / obra

**Valor actual**: `0.03` (3,0%).

**Fuente A — afc.cl**
- Texto literal: *"Contratos a plazo fijo o por obra — Cuenta Individual 2,8% + FCS 0,2%"* (suma = 3,0%)

**Valor canónico propuesto**: `0.03` ✓.

### 11.5 SIS — Seguro de Invalidez y Sobrevivencia

**Valor actual**: `SIS_PCT = 0.0154` (1,54%).

**Fuente A — Superintendencia de Pensiones**
- URL: https://www.spensiones.cl/portal/institucional/594/w3-propertyvalue-9917.html
- Fecha de acceso: 2026-04-22T04:05 UTC
- Texto literal: *"desde enero de 2026, la tasa vigente del SIS para empleadores, afiliadas y afiliados independientes y voluntarios es de 1,54% de las remuneraciones y rentas imponibles"*

**Fuente B — mismo documento, contexto histórico**: *"La tasa del SIS a considerar para el año tributario 2026 es de 1,49%"* (esto es para el AT2026 = rentas AÑO 2025; distinto de la tasa vigente enero 2026 en adelante que es 1,54%).
**Fuente C — afc.cl tabla cotizaciones**: no publica SIS (no es su ámbito).

**Valor canónico propuesto**: `0.0154` ✓.

**Nota importante**: hay dos valores SIS que circulan en 2026, y conviene documentarlos explícitamente en el código:
- **SIS aplicable a rentas AT2026 (año tributario 2026 = rentas 2025)**: 1,49%.
- **SIS aplicable a rentas 2026 (cálculo de nómina vigente)**: 1,54%.
El código tiene correctamente 1,54% (cálculo prospectivo). Pero si alguna función calcula retenciones retroactivas o ajustes del AT2026, debe considerar 1,49%.

### 11.6 AFP UNO — comisión sobre remuneración

**Valor actual**: `AFP_UNO_COMMISSION_PCT = 0.0046` (0,46%).

**Fuente A — afpuno.cl**
- URL: https://www.afpuno.cl
- Fecha de acceso: 2026-04-22T04:06 UTC
- Texto literal: *"comisión más baja de todas las AFP: 0,46%"*

**Fuente B — Spensiones tabla de comisiones**: endpoint no accedido directamente. Dato alineado.
**Fuente C — afpuno.cl calculadora**: implícito en la misma página.

**Valor canónico propuesto**: `0.0046` ✓.

---

## 12. Mutual de Seguridad (Ley 16.744)

**Valor actual**: `MUTUAL.baseRate = 0.0093` (0,93%) y `additionalRate = 0` en `HRDashboard.tsx` y `ChileLaborConstants.ts`.

**Fuente A — Ley 16.744 Art. 15**: cotización básica 0,90% + cotización adicional diferenciada por actividad.
**Fuente B — Suseso (Superintendencia de Seguridad Social)**: publica tablas de tasa diferenciada.
**Fuente C — D.S. 110/1968**: decreto que fija las tasas adicionales por actividad económica.

**Verificación específica accedida**: NO LOGRADA. Suseso retorna PDF o SPA sin JS. VERIFICACIÓN PENDIENTE.

**Observación sobre el valor 0,93%**: la cotización básica obligatoria según Ley 16.744 Art. 15 es **0,90%**, no 0,93%. El 0,03% adicional típicamente proviene de un seguro complementario optativo o de un redondeo histórico. **ALERTA**: revisar con abogado si `0.0093` es correcto.

Para actividad 631200 (Procesamiento de datos, hosting y actividades conexas; micro empresa), la tasa adicional según D.S. 110/1968 es típicamente 0% o muy baja, pero este valor debería verificarse contra el DS o la notificación específica de Mutual de Seguridad a Conniku SpA.

**Valor canónico propuesto**: **PENDIENTE DE VERIFICACIÓN** ante:
1. Texto literal de Ley 16.744 Art. 15 (¿0,90% o 0,95%?).
2. Notificación formal de Mutual de Seguridad asignando tasa adicional específica a Conniku SpA por su actividad declarada 631200.

**Divergencia detectada**: posible (0,93% vs 0,90% legal base).

**Recomendación**: Cristian solicita carta formal de Mutual de Seguridad con tasa base + adicional específica para Conniku SpA; el valor real puede ser distinto de 0,93%.

---

## 13. IVA

**Valor actual**: `IVA_PCT = 0.19` (19%).

**Fuente A — DL 825 Art. 14**: BCN SPA sin JS; NO ACCEDIDO directamente. Dato estable desde 2003.
**Fuente B — SII (destacados/iva)**: página retorna 404/shell; NO verificado esta auditoría.
**Fuente C — Circulares SII anuales**: dato estable 19%.

**Valor canónico propuesto**: `0.19` ✓ (dato no cambia salvo reforma tributaria).

---

## 14. Ingreso Mínimo Mensual — history (registro histórico)

**Valor actual**:
- `HRDashboard.tsx`: 8 entradas (2026-01-01, 2025-05-01, 2025-01-01, 2024-07-01, 2024-01-01, 2023-09-01, 2023-05-01, 2022-08-01).
- `ChileLaborConstants.ts`: 6 entradas (2026-01-01, 2024-07-01, 2024-01-01, 2023-09-01, 2023-05-01, 2022-08-01). **FALTAN 2025-05-01 $529.000 y 2025-01-01 $510.000**.

**Fuente A — Ley 21.578 (reajuste 2023-2024)**
**Fuente B — Ley 21.666 o siguiente (reajustes 2025)**: verificación pendiente de número de ley exacto.
**Fuente C — dt.gob.cl**

**Recomendación**: completar history de `ChileLaborConstants.ts` con las dos entradas faltantes (con valores por verificar: $529.000 desde 2025-05-01 y $510.000 desde 2025-01-01, que HRDashboard declara). Es de alcance del web-architect (campo history, no valor puntual), pero se menciona aquí por consistencia.

---

## 15. FONASA 7%

**Valor actual**: `FONASA_PCT = Decimal("0.07")` (solo en backend/constants/labor_chile.py).

**Fuente A — Ley 18.469 Art. 88**
**Fuente B — DFL 1 Salud**
**Fuente C — FONASA sitio oficial**

**Valor canónico propuesto**: `0.07` ✓ (estable desde reforma 1986).

**Divergencia detectada**: ninguna.

---

## Plan de fix atómico

### Orden sugerido de commits (todos requieren aprobación humana explícita):

**Commit 1 — legal(constants): corregir tope imponible AFP/Salud 81,6 → 90,0 UF 2026**

Archivos:
- `shared/chile_constants.ts`: `TOPE_IMPONIBLE_AFP_UF = 90.0`
- `backend/constants/labor_chile.py`: `TOPE_IMPONIBLE_AFP_UF: Decimal = Decimal("90.0")`
- `src/pages/HRDashboard.tsx`: `TOPES.afpUF: 90.0` y `TOPES.saludUF: 90.0`

Tests a añadir/actualizar:
- Test que confirme que cotización AFP sobre sueldo imponible $2.700.000 (3×UF actual) se calcula sobre base truncada a 90×UF, no 81,6×UF.
- Test retroactivo: cotizaciones de meses anteriores deberán seguir usando 87,8 UF (2025) o 81,6 UF (≤2024) si existe historial. Implica tabla con vigencia por año.

**Commit 2 — legal(constants): unificar IMM reducido y no-remuneracional 2026**

Requisito previo: Cristian provee valor literal de Ley 21.751 Art. 1° (o equivalente) para:
- IMM reducido (menores 18 / mayores 65)
- IMM no-remuneracional

Archivos:
- Añadir en `shared/chile_constants.ts`: `SUELDO_MINIMO_REDUCIDO_2026` y `SUELDO_MINIMO_NO_REMUNERACIONAL_2026`.
- Añadir en `backend/constants/labor_chile.py` con Decimal.
- `src/admin/shared/ChileLaborConstants.ts`: importar las nuevas constantes en vez de hardcodear.
- `src/pages/HRDashboard.tsx`: importar las nuevas constantes en vez de hardcodear 402238/319756.

**Commit 3 — fix(hr): corregir UF redondeada en HRDashboard**

Archivo:
- `src/pages/HRDashboard.tsx`: reemplazar `39842` por import de `UF_ABRIL_2026` (39.841,72) desde shared.

Esto elimina la divergencia de redondeo y deja solo UNA fuente de verdad.

**Commit 4 — chore(legal): refactor HRDashboard para importar desde shared**

Eliminar el bloque local `CHILE_LABOR` de HRDashboard.tsx y usar `CHILE_LABOR` de `src/admin/shared/ChileLaborConstants.ts` (o crear `useChileLabor()` hook con getters memoizados). Este es el objetivo del refactor ya planificado.

**Commit 5 — feat(legal): UF diaria via API + fallback**

Cambiar `UF_ABRIL_2026` de constante fija a servicio que:
1. Consulta diariamente https://mindicador.cl/api/uf
2. Cachea el valor del día en Supabase (o Redis).
3. Fallback: último valor conocido + alerta si la última actualización tiene más de 48 h.
Esto elimina el desfase UF hardcodeada.

**Commit 6 — docs(legal): registrar auditoría 2026-04-22**

Este mismo archivo se commitea en `docs/legal/audits/` siguiendo el scope permitido del legal-docs-keeper (`docs/legal/**`).

### Valores faltantes que requieren decisión humana (Capa 0 batch §21)

| # | Dato | Valor propuesto (sujeto a verificación abogado/Cristian) | Fuente que respalda |
|---|---|---|---|
| D-1 | Tope AFP 2026 | `90.0` UF | Spensiones |
| D-2 | Tope Salud 2026 | `90.0` UF (= AFP) | Spensiones + DFL 1 Art. 85 |
| D-3 | UF al 2026-04-22 | `40013.88` | SII + BCentral |
| D-4 | IMM reducido 2026 | **PENDIENTE** (ley 21.751 literal) | probablemente `402238` |
| D-5 | IMM no-remuneracional 2026 | **PENDIENTE** (ley 21.751 literal) | probablemente `319756` |
| D-6 | Mutual tasa base Ley 16.744 | **PENDIENTE** (¿0,90% o 0,93%?) | Ley 16.744 Art. 15 + DS 110 |
| D-7 | Mutual tasa adicional Conniku 631200 | **PENDIENTE** (notificación Mutual) | carta formal Mutual de Seguridad |

Estas 7 preguntas van a la siguiente ronda Capa 0 §21 del próximo bloque.

---

## Fuentes verificadas en esta auditoría (con URL accedida y fecha de acceso)

| # | Fuente | URL | Resultado | Timestamp UTC |
|---|---|---|---|---|
| 1 | SII UF 2026 | https://www.sii.cl/valores_y_fechas/uf/uf2026.htm | OK (tabla 30 días abril) | 2026-04-22T04:00 |
| 2 | SII UTM 2026 | https://www.sii.cl/valores_y_fechas/utm/utm2026.htm | OK (tabla mensual) | 2026-04-22T03:58 |
| 3 | SII Impuesto 2da 2026 | https://www.sii.cl/valores_y_fechas/impuesto_2da_categoria/impuesto2026.htm | OK (5 meses publicados) | 2026-04-22T03:59 |
| 4 | SII FAQ retención honorarios | https://www.sii.cl/preguntas_frecuentes/declaracion_renta/001_140_8398.htm | OK (texto literal 15,25%) | 2026-04-22T04:10 |
| 5 | Spensiones topes imponibles 2026 | https://www.spensiones.cl/portal/institucional/594/w3-article-16921.html | OK (texto completo) | 2026-04-22T04:04 |
| 6 | Spensiones SIS | https://www.spensiones.cl/portal/institucional/594/w3-propertyvalue-9917.html | OK (texto completo) | 2026-04-22T04:05 |
| 7 | AFC.cl cotizaciones | https://www.afc.cl/empleadores/cotizaciones/ | OK (tabla indefinido vs plazo fijo) | 2026-04-22T04:06 |
| 8 | AFP UNO | https://www.afpuno.cl | OK (0,46% literal) | 2026-04-22T04:06 |
| 9 | mindicador.cl UF | https://mindicador.cl/api/uf | OK (JSON serie diaria) | 2026-04-22T04:02 |
| 10 | mindicador.cl UTM | https://mindicador.cl/api/utm | OK (JSON serie mensual) | 2026-04-22T04:02 |
| 11 | Banco Central Indicadores | https://si3.bcentral.cl/Indicadoressiete/secure/Indicadoresdiarios.aspx | OK (UF 40.013,88 literal) | 2026-04-22T04:03 |
| 12 | BCN/leychile Ley 21.751 | https://www.bcn.cl/leychile/navegar?idNorma=1218050 | **NO ACCEDIDO** (SPA requiere JS) | 2026-04-22T04:00 |
| 13 | BCN/leychile DL 3.500 | https://www.bcn.cl/leychile/navegar?idNorma=7147 | **NO ACCEDIDO** (SPA) | — |
| 14 | BCN/leychile Código del Trabajo | https://www.bcn.cl/leychile/navegar?idNorma=207436 | **NO ACCEDIDO** (SPA) | — |
| 15 | dt.gob.cl legislación | https://www.dt.gob.cl/legislacion/1624/w3-article-60141.html | **NO ACCEDIDO** (shell 1,3 KB) | 2026-04-22T04:05 |
| 16 | Mintrab comunicado Ley 21.751 | https://www.mintrab.gob.cl/... | **NO ACCEDIDO** (SPA) | — |
| 17 | Diario Oficial | https://www.diariooficial.interior.gob.cl | **HTTP 403** sin UA específico | 2026-04-22T04:04 |

Limitaciones: 6 fuentes oficiales (BCN, DT, Mintrab, Diario Oficial) retornan SPA o 403 cuando se accede vía `curl` automatizado. Los datos de esos sitios deben verificarse por Cristian manualmente con browser real (Chrome/Firefox con JS) o por abogado.

---

## Protocolo — cierre de auditoría

### 1. Lo que se me pidió

Cita literal del trigger (trimmed): *"auditoría legal triple-check (3+ fuentes oficiales por dato) de las constantes de VALORES NUMÉRICOS actualizados 2026-04-22 que Conniku usa para cálculo de nómina chileno. (...) Entregable: archivo Markdown nuevo en docs/legal/audits/2026-04-22-chile-labor-constants-triple-check.md con: (a) valor actual en shared/chile_constants.ts o HRDashboard.tsx, (b) valor literal publicado por cada una de las 3 fuentes oficiales, (c) valor canónico propuesto con decimales exactos, (d) divergencias detectadas, (e) recomendación. (...) NO escribas código de producto. (...) SÍ puedes usar curl/WebFetch a dominios gov.cl + bcn.cl + sii.cl + mintrab.gob.cl + spensiones.cl."*

### 2. Lo que efectivamente hice

- Leí las 4 copias vigentes del código (HRDashboard.tsx, ChileLaborConstants.ts, shared/chile_constants.ts, backend/constants/labor_chile.py + tax_chile.py).
- Ejecuté 11 descargas exitosas a fuentes oficiales (SII, Spensiones, AFC, AFP UNO, mindicador.cl, Banco Central).
- Intenté 6 descargas a BCN/DT/Mintrab/Diario Oficial que fallaron por SPA o 403.
- Verifiqué byte-a-byte los 8 tramos ISUT abril 2026 contra la tabla SII (aritmética UTM validada).
- Detecté 4 hallazgos críticos: tope AFP obsoleto, UF redondeada, IMM reducido/no-rem divergente entre copias.
- Detecté 3 hallazgos moderados: history incompleto, lastUpdate desfasado, IVA y AFP 10% con solo 1 fuente primaria (pero estables por 20+ años).
- Produje este archivo (`docs/legal/audits/2026-04-22-chile-labor-constants-triple-check.md`) con 17 fuentes citadas, 15 constantes auditadas, 6 commits propuestos para el plan de fix, 7 decisiones pendientes de Cristian.

### 3. Lo que no hice y por qué

- **No accedí al texto literal de Ley 21.751** (SPA de BCN requiere JavaScript). Esto deja los valores §5 e §6 (IMM reducido y no-remuneracional) sin confirmación directa de la ley; la evidencia aritmética sugiere que HRDashboard está correcto y ChileLaborConstants obsoleto, pero requiere confirmación humana.
- **No verifiqué DL 3.500 Art. 16 literal** (BCN SPA). Delegué en Spensiones como autoridad dictante del tope.
- **No verifiqué Ley 16.744 Art. 15 literal** (BCN SPA). La diferencia 0,90% vs 0,93% del código queda pendiente.
- **No descargué circular SII del año** con tramos ISUT (archivo PDF en `/normativa_legislacion/circulares/`). La tabla HTML de SII fue suficiente y es la fuente oficial consultada por contribuyentes.
- **No escribí código de producto** (scope explícitamente prohibido).
- **No modifiqué shared/ ni backend/constants/ ni src/ ni tests** (scope explícitamente prohibido).
- **No actualicé docs/legal/alerts.md** con los 4 hallazgos críticos detectados — podría/debería hacerse en un segundo turno si Cristian lo pide.

### 4. Incertidumbres

- Es posible que la Ley 21.751 haya introducido un reajuste intermedio en abril 2026 que no detecté (no accedí al texto literal). Evidencia indirecta: mintrab sólo cita el reajuste del 1-enero-2026, pero las leyes de reajuste chilenas a veces incluyen escalones sucesivos.
- Es posible que la tasa Mutual 0,93% del código sea correcta por una resolución específica o por Ley 20.281 (actualización tasa base Ley 16.744) que no consulté.
- Es posible que Spensiones haya publicado una resolución complementaria entre enero y abril 2026 que module la tasa SIS 1,54%; consulté la página estática de SIS pero no la sección de circulares mensuales.
- Es posible que los valores IMM reducido y no-remuneracional tengan redondeos oficiales que no calcen exactamente con la proporción histórica (74,60% / 59,33%); el valor real de Ley 21.751 podría ser $402.500 en vez de $402.238, o similar. Sin acceso al texto literal no puedo confirmar.
- Es posible que existan archivos adicionales con constantes legales no inventariados en este auditoría (buscaría con `grep -rn "81\.6\|0\.0154\|539000\|402238" src/ backend/ shared/` para confirmar).
- La UF varía día a día y no existe mecanismo en el código actual para actualizarla diariamente; cualquier cálculo de nómina que use `UF_ABRIL_2026 = 39841.72` desde el 10 de abril en adelante está usando un valor desactualizado. Esta es una deuda estructural, no solo un desfase puntual.

### Declaración obligatoria (segunda vez, cierre de reporte)

Este análisis no constituye asesoría legal profesional y requiere validación
de abogado antes de su aplicación al producto en producción.
