# _ARCHIVE

Archivos respaldados, no usados en producción. **No se borran** por seguridad.

## Contenido

### `pages/`
Versiones antiguas o backups de páginas que fueron reemplazadas:

| Archivo | Razón |
|---|---|
| `perfil.html` | Versión antigua del perfil (dashboard). Reemplazada por `perfil-social-v2.html`. |
| `perfil-social.html` | Backup de la versión anterior antes de crear v2. Mantenido por seguridad. |
| `perfil-social-RESTORE-02.html` | Punto de restauración antiguo. |
| `perfil-social-RESTORE-03.html` | Punto de restauración antiguo. |

### `_CONCEPTOS/`
Conceptos de exploración archivados:

| Archivo | Razón |
|---|---|
| `perfil-fondos-RESTORE-01.html` | Punto de restauración antiguo de exploración de fondos. |

## Si necesitas restaurar algún archivo

Simplemente muévelo de vuelta a su ubicación original:

```bash
mv _ARCHIVE/pages/perfil-social.html pages/
```
