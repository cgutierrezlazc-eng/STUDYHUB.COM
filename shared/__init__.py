"""Paquete compartido entre backend (Python) y frontend (TypeScript espejo).

Archivos aquí definen contratos cross-cutting: textos legales canónicos,
constantes de negocio comunes, etc. El script scripts/verify-legal-texts-sync.sh
valida en CI que los archivos .py y .ts mantengan el mismo hash.
"""
