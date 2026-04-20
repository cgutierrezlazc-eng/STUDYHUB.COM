# Plan — Hardening C3: trampa garantizada en quizzes

- **Fecha**: 2026-04-19
- **Agente**: web-architect (Tori)
- **Tipo**: security (no-legal)
- **Endpoint afectado**: `POST /courses/{course_id}/exercises/submit`
- **Severidad**: alta (integridad de XP, accuracy, y futuros certificados)

---

## 1. Contexto

### 1.1 Cita de la petición

> Producir plan ejecutable para el fix de la vulnerabilidad **C3 trampa
> garantizada en quizzes** de `docs/pendientes.md`. Scope real: solo C3.
> C2 falso positivo (Pydantic descarta extras). C4 sin evidencia.

### 1.2 Vulnerabilidad confirmada

Archivo `backend/course_routes.py`, líneas 970-1016.

```python
class ExerciseSubmitRequest(BaseModel):
    answers: dict           # {questionIndex: selectedOption}
    questions: list         # ← El cliente envía las preguntas

@router.post("/{course_id}/exercises/submit")
def submit_exercises(course_id, data, user, db):
    questions = data.questions          # ← cliente
    answers = data.answers
    for i, q in enumerate(questions):
        user_answer = answers.get(str(i))
        is_correct = user_answer == q.get("correctAnswer")  # ← trampa
        ...
```

El servidor confía en `correctAnswer` enviado por el cliente. Cualquier
atacante con curl + JWT válido obtiene 100% real, gana XP, ensucia las
estadísticas reales, y avanza requisitos de certificados.

### 1.3 Payload atacante (PoC)

```bash
curl -X POST https://studyhub-api-bpco.onrender.com/courses/{cid}/exercises/submit \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {"0": "TRAMPA", "1": "TRAMPA"},
    "questions": [
      {"question": "Cualquier cosa", "correctAnswer": "TRAMPA", "explanation": ""},
      {"question": "Otra cosa",      "correctAnswer": "TRAMPA", "explanation": ""}
    ]
  }'
# → score: 100, correct: 2, xpAwarded: 10
```

### 1.4 Archivos leídos para construir este plan

- `backend/course_routes.py` líneas 1-100, 770-900, 900-1050
  (catálogo, helper `_hash_question`, endpoint `get_exercises`,
  endpoint `submit_exercises`)
- `backend/database.py` líneas 980-1056 (`Course`, `CourseLesson`,
  `CourseQuiz`, `UserExerciseHistory`)
- `backend/tests/conftest.py` (fixtures `db_session`, `test_user_factory`,
  SQLite in-memory, `BCRYPT_ROUNDS=4`)
- `src/services/api.ts` líneas 1080-1100 (cliente actual envía
  `{answers, questions}`)
- Listado de tests existentes en `backend/tests/`: no hay
  `test_course_routes.py` ni cobertura para `/exercises/submit`

### 1.5 Hallazgos importantes

1. **Existe `_hash_question(text)`** ya en uso (línea 777). SHA256 sobre
   `text.strip().lower()`. Se reusa sin tocar.
2. **`CourseQuiz.questions` es JSON-text** con todo el pool del curso,
   tanto preguntas semilla como las generadas dinámicamente por IA y
   persistidas. Indexar por hash es viable.
3. **Las preguntas generadas por IA se persisten** (líneas 925-936 en
   `get_exercises`). Eso significa que cuando el frontend envía los
   IDs/hashes de las preguntas que el servidor le sirvió, el servidor
   puede recuperarlas desde `CourseQuiz.questions`.
4. **El frontend ya envía `questions`** (`src/services/api.ts:1093`).
   Cualquier cambio de schema afecta al cliente. Requiere coordinación.
5. **`get_exercises` devuelve `questions` con `correctAnswer` incluido**
   (línea 960). Ese mismo objeto vuelve en el submit. Es por diseño:
   el frontend muestra explicación al final. El problema NO es que
   viaje, sino que el servidor lo CONFÍE en el submit.
6. **`UserExerciseHistory` ya guarda `question_hash`**: la migración a
   "hash como identidad" ya está hecha a nivel de BD. Falta usarla en
   submit.
7. **Stack de tests**: pytest + SQLite in-memory, `httpx`/`TestClient`
   no aparecen en conftest. Hay que verificar si `FastAPI` se instancia
   o si se prueban routers sueltos. Riesgo medio.

---

## 2. Decisiones

### 2.1 Estrategia de fix (decisión principal)

| Opción | Descripción | Pros | Cons |
|---|---|---|---|
| **A** — Cliente envía solo hashes/índices, servidor recupera de BD | Schema nuevo: `{answers: {hash: opt}, question_hashes: [hash1, ...]}`. Server lee `CourseQuiz.questions` por `course_id`, indexa por hash, valida. | Cliente nunca toca `correctAnswer`. Schema explícito. Imposible falsificar. | Cambio de contrato API → requiere bump de cliente. Romper compatibilidad mientras se despliega. |
| **B** — Cliente envía `questions` igual que hoy, server **ignora** `correctAnswer` y re-valida contra BD por hash | Mantener schema. En el handler, ignorar `q.get("correctAnswer")` recibido y consultar `CourseQuiz.questions` indexado por `_hash_question(q["question"])`. | Cero cambio de contrato API, frontend sigue funcionando sin cambios. Fix puro de servidor. | Datos extra viajan inútil (waste de bytes pero ya viajaba). Schema sigue mintiendo: dice que acepta `questions` con `correctAnswer` aunque no lo use. |
| **C** — Híbrido: schema estricto que valida estructura mínima (solo `question` text), server re-valida desde BD | `questions: list[QuestionRef]` con solo `{"question": str}`. Server busca en `CourseQuiz.questions` por hash. | Schema honesto, sin romper completamente. | Igual rompe cliente porque hoy envía `correctAnswer` y `explanation`; Pydantic los descarta silenciosamente, lo cual es OK. Equivalente práctico a B. |

**Decisión: Opción B (con micro-mejora hacia C en una segunda iteración).**

**Razonamiento**:

1. **Minimiza superficie de cambio**: el frontend no se toca. Solo
   backend. Permite desplegar el fix de seguridad sin coordinar deploy
   de frontend.
2. **El contrato API ya envía datos basura** (`correctAnswer`,
   `explanation` desde el cliente). Pydantic los acepta porque
   `questions: list` no tiene tipo interno. No es elegante pero
   funciona y permite fix atómico.
3. **El refactor a Opción A se puede hacer después** como tarea
   separada de "limpieza de contrato", sin presión de seguridad.
4. **Compatibilidad**: el frontend sigue enviando lo mismo; el
   servidor simplemente deja de mirar `q["correctAnswer"]` y consulta
   BD.

**Criterio aplicado**: "menor blast radius posible para arreglar la
vuln, sin sacrificar correctitud". El refactor de schema es deseable
pero ortogonal al fix de seguridad.

### 2.2 Manejo de preguntas no encontradas en BD

Si el cliente envía un hash que NO existe en `CourseQuiz.questions`
(porque se inventó la pregunta o porque la BD se rotó):

**Decisión**: tratar la pregunta como **inválida**, marcar
`is_correct=False`, NO registrar en `UserExerciseHistory` (porque no es
una pregunta legítima del curso), y devolver el resultado con
`"isCorrect": false, "correctAnswer": null, "invalid": true`.

Alternativa rechazada: devolver `400` completo. Razón: si una de N
preguntas es inválida no debería bloquear las otras N-1 que sí son
legítimas (mejor UX, igual seguro).

### 2.3 Manejo de `answers[i]` con índice fuera de rango

Decisión: ignorar el answer extra (no romper el endpoint), pero validar
con Pydantic que `answers` sea `dict[str, Any]` y que las claves sean
strings convertibles a int. Si no, `422`.

### 2.4 ¿Migración de BD?

**No**. El campo `CourseQuiz.questions` ya guarda el pool completo. El
índice por hash se construye en memoria al momento del submit
(diccionario `{hash: question_obj}`). Si en el futuro hay miles de
preguntas por curso, se puede agregar tabla normalizada, pero hoy es
prematuro.

### 2.5 ¿Limitar XP para evitar farming?

**Fuera de scope** de C3. C3 es "el cliente miente sobre la respuesta
correcta". Farming de XP llamando muchas veces a `/exercises` +
`/exercises/submit` con respuestas correctas reales es un problema
distinto (rate limiting / cooldown), no aplica aquí.

---

## 3. Archivos a tocar

| Archivo | Cambio | Líneas aprox |
|---|---|---|
| `backend/course_routes.py` | Modificar handler `submit_exercises` para indexar `CourseQuiz.questions` por hash y validar contra eso. NO tocar schema `ExerciseSubmitRequest`. | 970-1047 |
| `backend/tests/test_course_routes.py` | **Crear archivo**. Cuatro tests RED→GREEN listados en sección 4. Fixtures: usar `db_session` y `test_user_factory` existentes; agregar factory local de `Course` + `CourseQuiz` + `UserCourseProgress`. | nuevo |

**Sin migración DB**. **Sin cambios de frontend**. **Sin tocar
`get_exercises`**.

---

## 4. Tests RED→GREEN requeridos

Todos los tests llaman directamente a la función `submit_exercises` (o
a través de un `TestClient` de FastAPI; el builder decide cuál es más
limpio dado conftest). Cada test debe fallar primero (RED) sobre el
código actual y pasar después del fix (GREEN).

### Test 1 — `test_submit_ignora_correct_answer_del_cliente_cuando_es_falso`

```
GIVEN: Course con CourseQuiz.questions = [
         {"question": "P1", "correctAnswer": "A", "explanation": "..."}
       ]
       User con UserCourseProgress.completed_lessons no vacío
WHEN:  POST /exercises/submit con
         questions=[{"question": "P1", "correctAnswer": "TRAMPA"}]
         answers={"0": "TRAMPA"}
THEN:  response.score == 0
       response.correct == 0
       response.results[0].isCorrect == False
       response.results[0].correctAnswer == "A"   # devuelve la real
       UserExerciseHistory(question_hash=hash("p1"), was_correct=False) existe
```

**Estado actual**: FAIL — score=100. **Después del fix**: PASS.

### Test 2 — `test_submit_ignora_correct_answer_del_cliente_cuando_es_correcto`

```
GIVEN: misma BD que test 1
WHEN:  POST /exercises/submit con
         questions=[{"question": "P1", "correctAnswer": "B"}]   # cliente miente con B
         answers={"0": "A"}                                      # responde A real
THEN:  response.score == 100
       response.correct == 1
       response.results[0].isCorrect == True
```

Confirma que el flujo legítimo NO depende del `correctAnswer` del
cliente, ni siquiera cuando el cliente lo envía correctamente. Es la
respuesta del usuario contra la verdad de BD.

### Test 3 — `test_submit_pregunta_no_existe_en_bd_marca_invalida`

```
GIVEN: Course con CourseQuiz.questions = [{"question": "P1", "correctAnswer": "A"}]
WHEN:  POST /exercises/submit con
         questions=[{"question": "PREGUNTA_INVENTADA", "correctAnswer": "X"}]
         answers={"0": "X"}
THEN:  response.score == 0
       response.results[0].isCorrect == False
       response.results[0].correctAnswer == None
       NO se inserta en UserExerciseHistory para esa pregunta
```

### Test 4 — `test_submit_flujo_legitimo_completo`

```
GIVEN: Course + CourseQuiz con 3 preguntas reales:
         [{"question": "P1", "correctAnswer": "A"},
          {"question": "P2", "correctAnswer": "B"},
          {"question": "P3", "correctAnswer": "C"}]
WHEN:  cliente envía las 3 preguntas tal como las recibió y responde
         answers = {"0": "A", "1": "B", "2": "WRONG"}
THEN:  response.score == 67  # 2/3 redondeado
       response.correct == 2
       response.total == 3
       response.xpAwarded == 10
       3 filas en UserExerciseHistory para este user+course
       (was_correct: True, True, False respectivamente)
```

Test de regresión: confirma que el caso normal sigue funcionando.

### Tests opcionales de robustez (si el builder tiene tiempo)

- `test_submit_answer_index_fuera_de_rango_no_rompe`: enviar
  `answers={"99": "X"}` sin pregunta correspondiente → simplemente no
  cuenta como correcta, no 500.
- `test_submit_questions_vacio_no_rompe`: `questions=[], answers={}` →
  score=0, total=0, xpAwarded=10 (mantener comportamiento actual o
  cambiarlo a 0 XP — discutir con Cristian).

### Estructura del archivo de tests

```
backend/tests/test_course_routes.py
├── fixture course_with_quiz_factory
├── fixture progress_factory  (UserCourseProgress con lección completada)
├── fixture client (FastAPI TestClient con override de get_db y get_current_user)
└── 4 tests obligatorios + 2 opcionales
```

---

## 5. Orden de implementación

1. **Setup tests (RED)**:
   - Crear `backend/tests/test_course_routes.py`
   - Agregar fixtures necesarias (course + quiz + progress + client
     con auth override)
   - Escribir los 4 tests obligatorios
   - `cd backend && pytest tests/test_course_routes.py -v`
   - **Verificación**: tests 1 y 3 deben FALLAR (RED). Test 2 debe
     fallar también (servidor responde correct=True porque el cliente
     envió `correctAnswer="B"` y el user respondió `"A"` ≠ `"B"`,
     entonces score=0, mientras el test espera 100). Test 4 debe pasar
     ya en RED (es el flujo legítimo, ya funciona en código actual).

2. **Implementación mínima (GREEN)**:
   - En `submit_exercises`, antes del loop:
     ```python
     quiz = db.query(CourseQuiz).filter(
         CourseQuiz.course_id == course_id
     ).first()
     pool = json.loads(quiz.questions or "[]") if quiz else []
     by_hash = {_hash_question(q["question"]): q for q in pool}
     ```
   - Dentro del loop, reemplazar:
     ```python
     # ANTES: is_correct = user_answer == q.get("correctAnswer")
     q_hash = _hash_question(q["question"])
     real = by_hash.get(q_hash)
     if real is None:
         is_correct = False
         real_answer = None
         invalid = True
     else:
         real_answer = real.get("correctAnswer")
         is_correct = (user_answer == real_answer)
         invalid = False
     ```
   - Solo registrar en `UserExerciseHistory` si `not invalid`.
   - En `results.append`, devolver `correctAnswer = real_answer` (no
     `q.get("correctAnswer")`), agregar `"invalid": invalid` cuando
     aplique.
   - Re-ejecutar `pytest tests/test_course_routes.py -v` →
     todos PASS.

3. **Refactor (REFACTOR)**:
   - Extraer construcción de `by_hash` a helper `_load_question_pool(db,
     course_id) -> dict` solo si se reutiliza. Si no, dejar inline.
   - Verificar que tests siguen verdes.

4. **Verificación obligatoria**:
   - `cd backend && ruff check .`
   - `cd backend && ruff format --check .`
   - `cd backend && mypy . --ignore-missing-imports` (si está en CI)
   - `cd backend && pytest -v` (suite completa, no solo el archivo
     nuevo, para confirmar 0 regresiones)

5. **Commit**:
   - Mensaje: `security(course): prevenir trampa en submit_exercises`
   - Cuerpo: explica que el servidor ahora consulta `CourseQuiz` y
     valida por hash, ignorando `correctAnswer` enviado por el cliente.
     Cita el archivo y líneas. Referencia a `docs/pendientes.md` C3.

---

## 6. Criterio de terminado

- [ ] `backend/tests/test_course_routes.py` existe con al menos los 4
      tests obligatorios
- [ ] Test 1 falla en código actual (RED demostrado con output literal
      del pytest)
- [ ] Test 1 pasa después del fix (GREEN demostrado con output literal)
- [ ] Tests 2, 3, 4 pasan después del fix
- [ ] `pytest -v` sobre toda la suite backend: 0 regresiones (mismos
      o más tests pasando que antes)
- [ ] `ruff check .` sin errores en `backend/`
- [ ] `ruff format --check .` sin diferencias
- [ ] Endpoint manual con curl + payload atacante (sección 1.3)
      devuelve `score: 0` cuando las "preguntas inventadas" no existen
      en BD, o `score` real cuando las preguntas existen pero el
      `correctAnswer` enviado es falso
- [ ] Commit atómico tipo `security(course):`
- [ ] No se modificó frontend
- [ ] No se modificó schema de BD

**Condición FAIL del bloque**: si cualquiera de estos checks queda en
rojo al cierre, el bloque vuelve al builder.

---

## 7. Riesgos

### Alto

- **Romper flujo legítimo del frontend**: probabilidad ~15%. El
  frontend espera `results[i].correctAnswer` para mostrar feedback al
  usuario. Si el servidor devuelve `null` por hash no encontrado,
  `CourseExerciseResults.tsx` (o equivalente) podría romper. Mitigación:
  el frontend ya recibe `correctAnswer: q.get("correctAnswer")` que
  puede ser `None` si la pregunta no tiene; el handling debería existir.
  qa-tester debe verificar UI con caso atacante.
- **Cobertura insuficiente**: probabilidad ~20%. No hay tests previos
  para este endpoint. El builder debe ser disciplinado en escribir
  tests RED reales antes de cualquier código de producción.

### Medio

- **Performance**: 1 query extra a `CourseQuiz` por submit. Mitigación:
  ya hay 3 queries existentes (course, history count, history
  was_correct count); una más no mueve la aguja. Submits son raros (no
  high-frequency).
- **`CourseQuiz.questions` es `Text` y puede ser grande**: mitigación:
  parseo JSON ya ocurre en `get_exercises`. Si crece a megas, hay
  problema más grande no relacionado con este fix.
- **TestClient de FastAPI no probado en conftest**: probabilidad ~30%
  de fricción al setup. Mitigación: el builder puede testear el
  handler directamente como función (importando `submit_exercises` y
  pasando `db` y `user` mockeados) si TestClient da problemas.

### Bajo

- **Cliente envía hashes diferentes por whitespace/case**: el
  `_hash_question` ya hace `strip().lower()`. Mitigación: implícita.
- **Race condition** entre `get_exercises` (que persiste preguntas IA)
  y `submit_exercises`: improbable en práctica (el usuario lee, piensa,
  responde — segundos a minutos).

---

## 8. Fuera de scope (explícito)

- **C2 (`exercises/submit` acepta extras Pydantic)**: ya verificado
  como falso positivo. Pydantic descarta extras por defecto.
- **C4 (NameError línea 767)**: línea 767 actual no contiene
  NameError. Sin evidencia.
- **Otros endpoints de `course_routes.py`**:
  - `submitCourseQuiz` (`/quiz/submit`, src/services/api.ts:1085)
    podría tener vulnerabilidad similar. Investigar en bloque
    separado, NO en este.
  - `submitDiagnostic` y `submitScheduledQuiz`
    (`/quiz-system/.../submit`) están en otro router. Fuera de scope.
  - `submitTutoringExam` y `submitExamAttempt`: otros routers, fuera.
- **Refactor de `gamification.award_xp`**: no se toca.
- **Refactor del schema `ExerciseSubmitRequest` a Opción A**: queda
  como tarea separada de "limpieza de contrato API". Crear issue
  cuando se cierre este bloque.
- **Rate limiting / cooldown sobre `/exercises/submit`** para prevenir
  farming legítimo de XP: problema distinto, fuera de scope.
- **Frontend changes**: no se modifica `src/services/api.ts` ni la
  página que consume el resultado. Se documenta en sección 7 que
  qa-tester debe validar visualmente que la UI no rompe.
- **Migración de `CourseQuiz` a tabla normalizada de preguntas
  individuales**: prematuro. Cuando un curso pase de ~200 preguntas,
  reconsiderar.

---

## 9. Componente legal

**No aplica**. Este fix corrige una vulnerabilidad de integridad de un
sistema de XP/scoring interno. No toca:

- Constantes legales (laboral, tributaria, consumidor, datos
  personales)
- Textos legales (T&C, privacidad, retracto)
- Datos personales sensibles
- Cumplimiento GDPR / Ley 19.628
- Verificación de edad
- Pagos / facturación

**No requiere**:

- legal-docs-keeper en el flujo
- Aprobación humana extra más allá de la inspección normal de Capa 6
- Commit tipo `legal:` (es `security:`)

**Sí afecta indirectamente**: la integridad de los certificados
(emitidos cuando el usuario completa N cursos con score ≥ X). Si en el
futuro Conniku afirma a empleadores o instituciones que sus
certificados son verificables, esta vulnerabilidad sería un problema
reputacional. Este plan la cierra.

---

## 10. Resumen ejecutivo (1 párrafo)

El servidor confía ciegamente en el `correctAnswer` que el cliente
envía en `POST /courses/{id}/exercises/submit`. Fix: dejar el schema
intacto (no romper frontend), pero en el handler ignorar el
`correctAnswer` recibido y consultar `CourseQuiz.questions` desde la
BD, indexar en memoria por hash de la pregunta (helper `_hash_question`
ya existe), y validar la respuesta del usuario contra esa fuente de
verdad. 4 tests obligatorios cubren: trampa fallida, respuesta correcta
real, pregunta inventada, flujo legítimo completo. Sin cambios de DB,
sin cambios de frontend. Commit `security(course):`. Tarea cerrada
cuando los 4 tests pasan, suite completa sin regresiones, lint y format
en verde.
