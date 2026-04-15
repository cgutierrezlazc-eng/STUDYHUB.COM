# FROZEN — Codigo Protegido

> **Regla:** Todo archivo/funcion en esta lista fue confirmado como funcional por Cristian.
> Para modificarlo se requiere autorizacion EXPLICITA de Cristian.
> Claude DEBE revisar este archivo ANTES de cada edicion.

## Como funciona
- Cristian confirma que algo funciona → se agrega aqui con `/freeze`
- Cristian autoriza modificar algo congelado → se remueve con `/unfreeze`
- Si Claude intenta editar un archivo congelado sin autorizacion → el hook lo BLOQUEA

## Archivos Congelados

| Archivo | Seccion | Confirmado | Nota |
|---------|---------|------------|------|
| `.husky/pre-commit` | completo | 2026-04-14 | Fix lint-staged: ruff separado del stash |
| `package.json` | lint-staged config | 2026-04-14 | Removido backend/**/*.py de lint-staged |
| `src/admin/tools/BibliotecaDocumentos.tsx` | hooks order | 2026-04-14 | Guard movido después de hooks |
| `src/pages/HRDashboard.tsx` | hooks order | 2026-04-14 | Guard movido después de useEffect |
| `src/pages/Messages.tsx` | null-safety | 2026-04-14 | 5 Array.isArray guards |
| `src/pages/Friends.tsx` | null-safety | 2026-04-14 | 4 Array.isArray + 5 optional chaining |
| `src/pages/Mentorship.tsx` | null-safety | 2026-04-14 | 3 fixes (setMentors, subjects.map) |
| `src/pages/GroupDocEditor.tsx` | null-safety | 2026-04-14 | 3 fixes (setVersions, setChatMessages, doc.color) |
| `src/pages/Dashboard.tsx` | null-safety | 2026-04-14 | 2 fixes (activityFeed, calendarEvents) |
| `src/pages/Communities.tsx` | null-safety | 2026-04-14 | 1 fix (setTrending) |
| `src/pages/Conferences.tsx` | null-safety | 2026-04-14 | 1 fix (setProjects) |
| `src/pages/UserProfile.tsx` | null-safety | 2026-04-14 | 3 fixes (setFriendsList, setActivityFeed, setComments) |
| `src/pages/Jobs.tsx` | null-safety | 2026-04-14 | Null-safety en cv.competencies (3 fixes) |
| `.gitignore` | iCloud rules | 2026-04-14 | Regla para ignorar duplicados iCloud |
