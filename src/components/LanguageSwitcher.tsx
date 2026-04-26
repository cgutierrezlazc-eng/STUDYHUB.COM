/**
 * LanguageSwitcher — pill fija en esquina superior derecha para cambiar
 * idioma en cualquier punto del onboarding sin perder progreso. Se monta
 * dentro de Start.tsx cuando onboarding === 'role' || modal !== null.
 * El array de idiomas se pasa por prop para no acoplar al contexto de Start.
 */
import React, { useEffect, useRef, useState } from 'react';

import styles from './LanguageSwitcher.module.css';

interface Language {
  code: string;
  label: string;
  sub: string;
  flags: string[];
}

interface LanguageSwitcherProps {
  languages: Language[];
  currentLang: string;
  onChange: (code: string) => void;
  className?: string;
  ariaLabel?: string;
  title?: string;
}

export default function LanguageSwitcher({
  languages,
  currentLang,
  onChange,
  className,
  ariaLabel = 'Cambiar idioma',
  title = 'Cambiar idioma',
}: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  // Rastrea si el popup estuvo abierto al menos una vez para no devolver
  // el foco al trigger en el mount inicial (cuando open es false desde el inicio).
  const wasOpenRef = useRef(false);

  // Listener global mousedown: cierra si el click fue fuera del popup y del trigger.
  useEffect(() => {
    if (!open) return;

    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        popupRef.current &&
        !popupRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  // Listener global keydown: cierra con ESC sin aplicar cambio.
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  // Focus management: al abrir → card del idioma activo; al cerrar → trigger.
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      const activeCard = popupRef.current?.querySelector<HTMLButtonElement>(
        `[data-lang="${currentLang}"]`
      );
      activeCard?.focus();
    } else if (wasOpenRef.current) {
      // Solo devuelve el foco al trigger si el popup estuvo abierto antes.
      // Evita un focus() no deseado en el mount inicial.
      triggerRef.current?.focus();
    }
  }, [open, currentLang]);

  const current = languages.find((l) => l.code === currentLang);

  function handleSelectLang(code: string) {
    onChange(code);
    setOpen(false);
  }

  const rootClass = [styles.root, className].filter(Boolean).join(' ');

  return (
    <div className={rootClass}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={styles.triggerFlag}>{current?.flags[0] ?? '🌐'}</span>
        <span className={styles.triggerCode}>{currentLang.toUpperCase()}</span>
        <span className={styles.triggerArrow} aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div ref={popupRef} className={styles.popup} role="dialog" aria-label={title}>
          <div className={styles.grid}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                data-lang={lang.code}
                className={[styles.card, lang.code === currentLang ? styles.cardActive : '']
                  .filter(Boolean)
                  .join(' ')}
                aria-label={lang.label}
                onClick={() => handleSelectLang(lang.code)}
              >
                <span className={styles.cardFlag}>{lang.flags[0]}</span>
                <span className={styles.cardLabel}>{lang.label}</span>
                <span className={styles.cardSub}>{lang.sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
