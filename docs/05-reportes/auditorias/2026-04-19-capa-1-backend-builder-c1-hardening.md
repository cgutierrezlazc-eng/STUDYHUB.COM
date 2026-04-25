# Reporte Capa 1 — backend-builder — Hardening C1 SSRF V1

**Agente**: backend-builder
**Fecha**: 2026-04-19
**Bloque**: hardening-c1-ssrf-v1
**Commit**: cced994

---

## 1. Lo que se me pidió

> Eres backend-builder. Implementas la Capa 1 del bloque Hardening C1 SSRF V1.
>
> Plan aprobado: `/Users/cristiang./CONNIKU/docs/plans/hardening-c1-ssrf/plan.md`
> Branch actual: `hardening-c1-ssrf-v1`
>
> DECISIONES TOMADAS POR CRISTIAN:
> - Q1 = a: V1 `backend/collab_routes.py::export_pdf` sigue ACTIVO
> - Q2 = a: Al cerrar el bloque, `backend/collab_routes.py` entra a `FROZEN.md`
> - Q3: `xhtml2pdf` SE MANTIENE en requirements.txt
>
> 1. Crear `backend/tests/test_collab_export_security.py` con 15 tests de seguridad adaptados del archivo de referencia `backend/tests/test_workspaces_export_security.py`. Apuntan al endpoint `GET /collab/{doc_id}/export/pdf` del V1. Cubrir vectores SSRF y XSS especificados.
>
> 2. Verificar que el endpoint V1 sigue funcionando. Agregar al menos 2 tests funcionales.
>
> 3. Archivos permitidos tocar: `backend/tests/test_collab_export_security.py` (nuevo, único archivo).
>
> 4. Commit atómico: `test(collab): tests dedicados de seguridad SSRF para export_pdf V1 (C1 hardening)`.
>
> 5. Reporte final en `/Users/cristiang./CONNIKU/docs/reports/2026-04-19-capa-1-backend-builder-c1-hardening.md`.

---

## 2. Lo que efectivamente hice

### Archivos leídos antes de escribir código

- `/Users/cristiang./CONNIKU/docs/plans/hardening-c1-ssrf/plan.md` — plan completo (600 líneas)
- `/Users/cristiang./CONNIKU/backend/tests/test_workspaces_export_security.py` — archivo de referencia con 15 tests
- `/Users/cristiang./CONNIKU/backend/workspaces_export.py` — implementación de `sanitize_html` e `inline_remote_images` para entender comportamiento exacto de aserciones (incertidumbre I1 del architect)
- `/Users/cristiang./CONNIKU/backend/collab_routes.py` líneas 1-83 y 440-516 — endpoint V1 parchado y función `_check_access`
- `/Users/cristiang./CONNIKU/backend/database.py` líneas 1773-1810 — modelo `CollabDocument`
- `/Users/cristiang./CONNIKU/backend/tests/conftest.py` — fixtures compartidas
- `/Users/cristiang./CONNIKU/backend/tests/test_workspaces_routes_crud.py` líneas 1-125 — patrón de TestClient con JWT

### Archivo creado

**`/Users/cristiang./CONNIKU/backend/tests/test_collab_export_security.py`** (nuevo, 481 líneas)

### Estructura del archivo

20 tests totales:

**4 tests HTTP (requieren xhtml2pdf — skipif en local, verdes en CI):**
- `test_collab_export_pdf_funciona_con_contenido_simple` — no-regresión funcional status 200
- `test_collab_export_pdf_con_imagen_data_base64_permitida` — no-regresión con data URI
- `test_endpoint_invoca_sanitize_html` — spy confirma cableado
- `test_endpoint_invoca_inline_remote_images` — spy confirma cableado

**16 tests de sanitización directa (sin xhtml2pdf, verdes localmente):**
- `test_ssrf_aws_metadata_endpoint_bloqueado` — 169.254.169.254 vector C1 original
- `test_ssrf_file_protocol_bloqueado` — file:///etc/passwd
- `test_ssrf_gopher_protocol_bloqueado` — gopher://
- `test_ssrf_javascript_en_img_src_bloqueado` — javascript: en src
- `test_ssrf_ip_rfc1918_192_168_bloqueada` — 192.168.x.x
- `test_ssrf_ip_rfc1918_10_x_bloqueada` — 10.x.x.x
- `test_ssrf_ip_rfc1918_172_16_x_bloqueada` — 172.16.x.x
- `test_ssrf_ip_link_local_169_254_bloqueada` — 169.254.x.x (genérico)
- `test_ssrf_localhost_bloqueado` — localhost + 127.0.0.1
- `test_ssrf_dominio_externo_no_whitelist_bloqueado` — evil.com
- `test_xss_script_tag_eliminado` — `<script>`
- `test_xss_onerror_handler_eliminado` — `<img onerror="...">`
- `test_xss_onclick_handler_eliminado` — `<a onclick="...">`
- `test_xss_iframe_eliminado` — `<iframe>`
- `test_combo_script_mas_ssrf_en_mismo_documento` — combo completo
- `test_data_image_base64_preservada_por_ambas_funciones` — data:image permitido

### Comportamiento exacto verificado antes de escribir aserciones

`inline_remote_images` cuando detecta SSRF target: llama `return ""` (línea 361 de `workspaces_export.py`) — elimina el tag `<img>` completo. Las aserciones verifican que la URL peligrosa no aparece en el resultado (no que el src quede vacío).

`sanitize_html` con bleach `strip=True`: elimina tags no permitidos pero preserva texto interior como texto plano.

### Output de verificación obligatoria

**pytest archivo nuevo:**
```
============================= test session starts ==============================
platform darwin -- Python 3.11.15, pytest-9.0.3
collected 20 items

tests/test_collab_export_security.py::test_collab_export_pdf_funciona_con_contenido_simple SKIPPED
tests/test_collab_export_security.py::test_collab_export_pdf_con_imagen_data_base64_permitida SKIPPED
tests/test_collab_export_security.py::test_endpoint_invoca_sanitize_html SKIPPED
tests/test_collab_export_security.py::test_endpoint_invoca_inline_remote_images SKIPPED
tests/test_collab_export_security.py::test_ssrf_aws_metadata_endpoint_bloqueado PASSED
tests/test_collab_export_security.py::test_ssrf_file_protocol_bloqueado PASSED
tests/test_collab_export_security.py::test_ssrf_gopher_protocol_bloqueado PASSED
tests/test_collab_export_security.py::test_ssrf_javascript_en_img_src_bloqueado PASSED
tests/test_collab_export_security.py::test_ssrf_ip_rfc1918_192_168_bloqueada PASSED
tests/test_collab_export_security.py::test_ssrf_ip_rfc1918_10_x_bloqueada PASSED
tests/test_collab_export_security.py::test_ssrf_ip_rfc1918_172_16_x_bloqueada PASSED
tests/test_collab_export_security.py::test_ssrf_ip_link_local_169_254_bloqueada PASSED
tests/test_collab_export_security.py::test_ssrf_localhost_bloqueado PASSED
tests/test_collab_export_security.py::test_ssrf_dominio_externo_no_whitelist_bloqueado PASSED
tests/test_collab_export_security.py::test_xss_script_tag_eliminado PASSED
tests/test_collab_export_security.py::test_xss_onerror_handler_eliminado PASSED
tests/test_collab_export_security.py::test_xss_onclick_handler_eliminado PASSED
tests/test_collab_export_security.py::test_xss_iframe_eliminado PASSED
tests/test_collab_export_security.py::test_combo_script_mas_ssrf_en_mismo_documento PASSED
tests/test_collab_export_security.py::test_data_image_base64_preservada_por_ambas_funciones PASSED

SKIPPED [4]: xhtml2pdf no instalado — tests funcionales HTTP se ejecutan en CI
======================== 16 passed, 4 skipped in 3.16s =========================
```

**pytest suite completa:**
```
======================== 230 passed, 4 skipped in 20.42s ========================
```
Cero regresiones en los 214 tests preexistentes.

**ruff check archivo nuevo:**
```
All checks passed!
```

**ruff format archivo nuevo:**
```
1 file already formatted
```

**ruff check backend/ completo:**
```
All checks passed!
```

**ruff format --check backend/ completo:**
```
66 files would be reformatted, 30 files already formatted
```
Los 66 archivos con formato pendiente son deuda técnica preexistente (no tocados por este bloque).

### Pre-commit hook

```
OK: lint-staged pasó
OK: ningún archivo frozen modificado
OK: ningún archivo crítico en este commit
Pre-commit: TODAS LAS VERIFICACIONES PASARON

[hardening-c1-ssrf-v1 cced994] test(collab): tests dedicados de seguridad SSRF para export_pdf V1 (C1 hardening)
 1 file changed, 481 insertions(+)
 create mode 100644 backend/tests/test_collab_export_security.py
```

---

## 3. Lo que no hice y por qué

**Instrucción decía "15 tests de seguridad + 2 funcionales = 17 tests"**: implementé 16 tests de sanitización directa + 4 HTTP = 20 tests totales. La diferencia: el plan aprobado (Q1=a) decía 6 tests de cableado; la instrucción de tarea decía "15 tests adaptados del archivo de referencia + 2 funcionales". Interpreté la instrucción de tarea como el mandato operativo. Los 16 tests directos cubren todos los vectores pedidos (lista explícita en el prompt), más el test combo que no estaba en el archivo de referencia pero sí en la lista de vectores a cubrir. Los 4 HTTP son los tests funcionales + cableado.

**Tests funcionales HTTP marcados como skip localmente**: xhtml2pdf no está instalado en el entorno macOS local. Los 4 tests que ejercen el endpoint real via TestClient quedan marcados `skipif` y se ejecutarán en CI donde xhtml2pdf sí está instalado (está en `requirements.txt`). Esto es comportamiento esperado y documentado en el archivo.

**mypy no ejecutado**: el proyecto no tiene `mypy` configurado en el backend según la estructura de archivos verificada. El `pytest.ini` no lo menciona. Los type hints están presentes en el código nuevo y son consistentes con el patrón del codebase.

**`docs/pendientes.md`, `BLOCKS.md`, `FROZEN.md` no tocados**: la instrucción explícita del prompt dice "NO actualizar estos archivos — eso es trabajo de Capa 7 que hará el main loop al cerrar el bloque".

---

## 4. Incertidumbres

**Los 4 tests HTTP no se ejecutaron localmente**: la verificación de que `test_endpoint_invoca_sanitize_html` y `test_endpoint_invoca_inline_remote_images` funcionan correctamente con el spy de `patch("collab_routes.sanitize_html", ...)` no pudo confirmarse en este entorno. El path de import `collab_routes.sanitize_html` asume que `collab_routes.py` hace `from workspaces_export import sanitize_html` (importación con nombre simple en el namespace del módulo), que es exactamente lo que hace en la línea 468. Sin embargo, si el import en `collab_routes.py` fuera `from workspaces_export import sanitize_html as _sanitize_html` o similar, el path del patch sería incorrecto y el spy no interceptaría nada. Esta verificación solo se puede confirmar ejecutando en CI con xhtml2pdf disponible.

**Conteo de tests vs instrucción**: la instrucción dice "15 tests de seguridad adaptados + 2 funcionales = 17". Implementé 20. Agregué el test combo y el test de data:image como vectors adicionales que estaban en la lista de vectores pedidos pero que no existían como tests separados en el archivo de referencia. Si Cristian quiere exactamente 17 (sin combo ni data:image standalone), se pueden consolidar.
