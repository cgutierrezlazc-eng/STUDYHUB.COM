"""
Biblioteca Prefetch — Pre-descarga de libros populares al cache local.

Ejecutar:
  python3 biblioteca_prefetch.py              # descarga todo
  python3 biblioteca_prefetch.py --dry-run    # solo lista qué descargaría
  python3 biblioteca_prefetch.py --source openstax  # solo una fuente

También se puede trigger desde POST /biblioteca/v2/prefetch (admin).
"""
from __future__ import annotations

import asyncio
import logging
import sys

import httpx
from biblioteca_cache import get_cache_stats, is_cached, write_to_cache
from biblioteca_engine import (
    GutenbergAdapter,
    OpenStaxAdapter,
    SciELOAdapter,
    get_http_client,
)

logger = logging.getLogger("biblioteca.prefetch")

# Rate limiting: delay entre descargas para no saturar servidores externos
_DELAY_BETWEEN_DOWNLOADS = 2.0  # segundos
_MAX_CONSECUTIVE_ERRORS = 10
_ERROR_BACKOFF_BASE = 5.0  # segundos, se multiplica por errores consecutivos


async def prefetch_openstax(stats: dict, *, dry_run: bool = False) -> None:
    """Pre-descarga todos los textbooks OpenStax CC-BY con PDF."""
    logger.info("OpenStax: cargando catálogo...")
    adapter = OpenStaxAdapter()
    catalog = await adapter._get_catalog()

    downloadable = [
        item for item in catalog
        if not item.get("is_nc") and item.get("pdf_url")
    ]
    logger.info("OpenStax: %d libros descargables de %d total", len(downloadable), len(catalog))

    consecutive_errors = 0
    for item in downloadable:
        ext_id = str(item.get("openstax_id", ""))
        if not ext_id:
            continue

        if is_cached("openstax", ext_id):
            stats["skipped"] += 1
            continue

        if dry_run:
            logger.info("  [DRY] %s — %s", ext_id, item.get("title", "?"))
            stats["would_download"] += 1
            continue

        try:
            logger.info("  Descargando: %s — %s", ext_id, item.get("title", "?"))
            data, filename, meta = await adapter.download_content(ext_id)
            write_to_cache("openstax", ext_id, data, filename, meta)
            stats["downloaded"] += 1
            consecutive_errors = 0
            await asyncio.sleep(_DELAY_BETWEEN_DOWNLOADS)
        except Exception as e:
            logger.warning("  Error: %s — %s", ext_id, e)
            stats["errors"] += 1
            consecutive_errors += 1
            await asyncio.sleep(_ERROR_BACKOFF_BASE * consecutive_errors)
            if consecutive_errors >= _MAX_CONSECUTIVE_ERRORS:
                logger.error("OpenStax: %d errores consecutivos, deteniendo fuente", consecutive_errors)
                break


async def prefetch_scielo(stats: dict, *, dry_run: bool = False, max_items: int = 200) -> None:
    """Pre-descarga los libros SciELO más relevantes en español."""
    logger.info("SciELO: cargando catálogo...")
    adapter = SciELOAdapter()
    catalog = await adapter._get_catalog()

    # Filtrar: español + tiene PDF
    downloadable = [
        item for item in catalog
        if item.get("language") in ("es", "pt") and item.get("pdf_url")
    ][:max_items]
    logger.info("SciELO: %d libros descargables (limit %d)", len(downloadable), max_items)

    consecutive_errors = 0
    for item in downloadable:
        ext_id = item.get("scielo_id", "")
        if not ext_id:
            continue

        if is_cached("scielo", ext_id):
            stats["skipped"] += 1
            continue

        if dry_run:
            logger.info("  [DRY] %s — %s", ext_id, item.get("title", "?"))
            stats["would_download"] += 1
            continue

        try:
            logger.info("  Descargando: %s — %s", ext_id, item.get("title", "?"))
            data, filename, meta = await adapter.download_content(ext_id)
            write_to_cache("scielo", ext_id, data, filename, meta)
            stats["downloaded"] += 1
            consecutive_errors = 0
            await asyncio.sleep(_DELAY_BETWEEN_DOWNLOADS)
        except Exception as e:
            logger.warning("  Error: %s — %s", ext_id, e)
            stats["errors"] += 1
            consecutive_errors += 1
            await asyncio.sleep(_ERROR_BACKOFF_BASE * consecutive_errors)
            if consecutive_errors >= _MAX_CONSECUTIVE_ERRORS:
                logger.error("SciELO: %d errores consecutivos, deteniendo fuente", consecutive_errors)
                break


async def prefetch_gutenberg(stats: dict, *, dry_run: bool = False, max_items: int = 100) -> None:
    """Pre-descarga los libros más populares de Gutenberg."""
    logger.info("Gutenberg: buscando top %d populares...", max_items)
    adapter = GutenbergAdapter()

    # Gutenberg no tiene catálogo pre-cargable — buscar por popularidad
    all_books: list[dict] = []
    page = 1
    while len(all_books) < max_items:
        try:
            result = await adapter.search(query="", lang="", page=page)
            items = result.get("items", [])
            if not items:
                break
            all_books.extend(items)
            page += 1
            await asyncio.sleep(1.0)  # rate limit gutendex
        except Exception:
            break

    all_books = all_books[:max_items]
    logger.info("Gutenberg: %d libros obtenidos", len(all_books))

    consecutive_errors = 0
    for item in all_books:
        ext_id = str(item.get("gutenberg_id", ""))
        if not ext_id:
            continue

        if is_cached("gutenberg", ext_id):
            stats["skipped"] += 1
            continue

        if dry_run:
            logger.info("  [DRY] %s — %s", ext_id, item.get("title", "?"))
            stats["would_download"] += 1
            continue

        try:
            logger.info("  Descargando: %s — %s", ext_id, item.get("title", "?"))
            data, filename, meta = await adapter.download_content(ext_id)
            write_to_cache("gutenberg", ext_id, data, filename, meta)
            stats["downloaded"] += 1
            consecutive_errors = 0
            await asyncio.sleep(_DELAY_BETWEEN_DOWNLOADS)
        except Exception as e:
            logger.warning("  Error: %s — %s", ext_id, e)
            stats["errors"] += 1
            consecutive_errors += 1
            await asyncio.sleep(_ERROR_BACKOFF_BASE * consecutive_errors)
            if consecutive_errors >= _MAX_CONSECUTIVE_ERRORS:
                logger.error("Gutenberg: %d errores consecutivos, deteniendo fuente", consecutive_errors)
                break


async def prefetch_all(
    *,
    dry_run: bool = False,
    sources: list[str] | None = None,
) -> dict:
    """Pre-descarga libros populares de todas las fuentes (o las especificadas)."""
    stats = {"downloaded": 0, "skipped": 0, "errors": 0, "would_download": 0}
    target_sources = sources or ["openstax", "scielo", "gutenberg"]

    if "openstax" in target_sources:
        await prefetch_openstax(stats, dry_run=dry_run)
    if "scielo" in target_sources:
        await prefetch_scielo(stats, dry_run=dry_run)
    if "gutenberg" in target_sources:
        await prefetch_gutenberg(stats, dry_run=dry_run)

    # NO cerrar el cliente HTTP compartido — si corre en el server, otros endpoints lo usan.
    # Solo se cierra cuando se ejecuta como script standalone (ver __main__).

    cache = get_cache_stats()
    stats["cache_total_books"] = cache["total_books"]
    stats["cache_total_mb"] = round(cache["total_bytes"] / (1024 * 1024), 1)

    logger.info(
        "Prefetch completado: %d descargados, %d ya en cache, %d errores. "
        "Cache total: %d libros (%.1f MB)",
        stats["downloaded"], stats["skipped"], stats["errors"],
        stats["cache_total_books"], stats["cache_total_mb"],
    )
    return stats


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

    dry_run = "--dry-run" in sys.argv
    source_filter = None
    for arg in sys.argv[1:]:
        if arg.startswith("--source="):
            source_filter = [arg.split("=", 1)[1]]
        elif arg == "--source" and sys.argv.index(arg) + 1 < len(sys.argv):
            source_filter = [sys.argv[sys.argv.index(arg) + 1]]

    if dry_run:
        logger.info("Modo DRY RUN — no se descarga nada")

    async def _run_standalone() -> dict:
        res = await prefetch_all(dry_run=dry_run, sources=source_filter)
        # Cerrar cliente HTTP compartido (solo en modo standalone)
        from biblioteca_engine import _http_client

        if _http_client and not _http_client.is_closed:
            await _http_client.aclose()
        return res

    result = asyncio.run(_run_standalone())
    print(f"\nResultado: {result}")
