"""
Biblioteca Cache Engine — Cache en disco para libros descargados.

Cada libro cacheado se guarda en:
  DATA_DIR/biblioteca/cache/{source}/{external_id}/
    - meta.json   (metadata + timestamp)
    - book.html   (o .pdf, el contenido)

Principio: descargar una vez, servir siempre desde local.
"""
from __future__ import annotations

import asyncio
import json
import os
from collections.abc import Callable
from datetime import datetime
from pathlib import Path
from typing import Any

from database import DATA_DIR

CACHE_DIR = DATA_DIR / "biblioteca" / "cache"
CACHE_DIR.mkdir(parents=True, exist_ok=True)

# Per-key asyncio locks: previene descarga doble del mismo libro
_download_locks: dict[tuple, asyncio.Lock] = {}
_locks_mutex: asyncio.Lock | None = None


def _get_locks_mutex() -> asyncio.Lock:
    """Lazy init del mutex para evitar RuntimeError en Python 3.12+."""
    global _locks_mutex
    if _locks_mutex is None:
        _locks_mutex = asyncio.Lock()
    return _locks_mutex


async def _get_lock(source: str, external_id: str) -> asyncio.Lock:
    """Retorna (creando si no existe) el asyncio.Lock para este libro."""
    key = (source, external_id)
    mutex = _get_locks_mutex()
    async with mutex:
        if key not in _download_locks:
            _download_locks[key] = asyncio.Lock()
        return _download_locks[key]


def _book_dir(source: str, external_id: str) -> Path:
    """Retorna DATA_DIR/biblioteca/cache/{source}/{external_id}/"""
    return CACHE_DIR / source / external_id


def _meta_path(source: str, external_id: str) -> Path:
    """Retorna path del meta.json de un libro cacheado."""
    return _book_dir(source, external_id) / "meta.json"


def is_cached(source: str, external_id: str) -> bool:
    """True si el libro tiene contenido + meta.json en disco."""
    book = _book_dir(source, external_id)
    if not book.exists():
        return False
    meta = _meta_path(source, external_id)
    if not meta.exists():
        return False
    # Verificar que existe al menos un archivo de contenido (excluir .tmp)
    return any(
        f.name != "meta.json" and f.suffix != ".tmp" and f.is_file()
        for f in book.iterdir()
    )


def get_cached_path(source: str, external_id: str) -> Path | None:
    """Retorna Path al archivo de contenido si está cacheado, None si no."""
    book = _book_dir(source, external_id)
    if not book.exists():
        return None
    for f in book.iterdir():
        if f.name == "meta.json" or f.suffix == ".tmp" or not f.is_file():
            continue
        return f
    return None


def read_meta(source: str, external_id: str) -> dict:
    """Lee meta.json, retorna {} si no existe o está corrupto."""
    path = _meta_path(source, external_id)
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


def _write_meta(source: str, external_id: str, meta: dict) -> None:
    """Escribe meta.json atómicamente (write .tmp → rename)."""
    path = _meta_path(source, external_id)
    tmp_path = path.with_suffix(".json.tmp")
    tmp_path.write_text(
        json.dumps(meta, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    tmp_path.rename(path)


def write_to_cache(
    source: str,
    external_id: str,
    data: bytes,
    filename: str,
    meta: dict,
) -> Path:
    """
    Escribe contenido ya descargado al cache. Retorna path del archivo.
    Uso: cuando ya tienes los bytes en memoria y quieres cachearlos.
    """
    book = _book_dir(source, external_id)
    book.mkdir(parents=True, exist_ok=True)
    content_path = book / filename
    content_path.write_bytes(data)
    _write_meta(source, external_id, {
        **meta,
        "filename": filename,
        "cached_at": datetime.utcnow().isoformat(),
        "size_bytes": len(data),
    })
    return content_path


async def get_or_download(
    source: str,
    external_id: str,
    download_fn,
    filename: str,
    meta: dict,
) -> Path:
    """
    Retorna path al archivo de contenido.
    Si no está cacheado: adquiere lock por libro, descarga, guarda, retorna.
    Concurrent requests para el mismo libro esperan al primero.

    Args:
        source: "gutenberg", "openstax", etc.
        external_id: ID único en la fuente (ej: "12345" para Gutenberg)
        download_fn: async callable que retorna bytes del contenido
        filename: nombre del archivo a guardar (ej: "book.html")
        meta: dict con metadata adicional (ej: {"source_url": "..."})

    Returns:
        Path al archivo de contenido en disco.
    """
    # Check rápido sin lock
    cached = get_cached_path(source, external_id)
    if cached:
        return cached

    # Adquirir lock y double-check
    lock = await _get_lock(source, external_id)
    async with lock:
        # Re-check bajo lock (otro request pudo completar la descarga)
        cached = get_cached_path(source, external_id)
        if cached:
            return cached

        # Descargar
        data: bytes = await download_fn()
        return write_to_cache(source, external_id, data, filename, meta)


def get_cache_stats() -> dict:
    """
    Estadísticas del cache.
    Retorna: {
        "total_books": int,
        "total_bytes": int,
        "sources": {"gutenberg": {"books": int, "bytes": int}, ...},
        "cache_dir": str,
    }
    """
    stats: dict = {
        "total_books": 0,
        "total_bytes": 0,
        "sources": {},
        "cache_dir": str(CACHE_DIR),
    }

    if not CACHE_DIR.exists():
        return stats

    for source_dir in CACHE_DIR.iterdir():
        if not source_dir.is_dir():
            continue
        source_name = source_dir.name
        source_stats = {"books": 0, "bytes": 0}

        for book_dir in source_dir.iterdir():
            if not book_dir.is_dir():
                continue
            source_stats["books"] += 1
            for f in book_dir.iterdir():
                if f.is_file():
                    source_stats["bytes"] += f.stat().st_size

        stats["sources"][source_name] = source_stats
        stats["total_books"] += source_stats["books"]
        stats["total_bytes"] += source_stats["bytes"]

    return stats
