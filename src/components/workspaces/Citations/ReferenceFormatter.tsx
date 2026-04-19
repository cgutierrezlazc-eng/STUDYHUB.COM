/**
 * ReferenceFormatter — formulario para generar referencias APA 7.
 * Soporta tipos: libro, journal, web.
 * Utiliza apaFormat.ts para el formateo (frontend puro, sin request al backend).
 * Sub-bloque 2d.1 APA 7 + citas + referencias.
 */

import React, { useState } from 'react';
import {
  formatAuthor,
  formatYear,
  formatReferenceBook,
  formatReferenceJournal,
  formatReferenceWeb,
} from './apaFormat';

type RefType = 'libro' | 'journal' | 'web';

interface FormState {
  type: RefType;
  authorLast: string;
  authorFirst: string;
  year: string;
  title: string;
  // Libro
  publisher: string;
  edition: string;
  // Journal
  journal: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
  // Web
  site: string;
  url: string;
  retrieved: string;
}

const INITIAL_FORM: FormState = {
  type: 'libro',
  authorLast: '',
  authorFirst: '',
  year: '',
  title: '',
  publisher: '',
  edition: '',
  journal: '',
  volume: '',
  issue: '',
  pages: '',
  doi: '',
  site: '',
  url: '',
  retrieved: '',
};

function buildReference(form: FormState): string {
  const author = formatAuthor(form.authorLast, form.authorFirst);
  const year = form.year.trim() || null;

  if (form.type === 'libro') {
    return formatReferenceBook(author, year, form.title, form.publisher, form.edition || null);
  }

  if (form.type === 'journal') {
    return formatReferenceJournal(
      author,
      year,
      form.title,
      form.journal,
      form.volume || null,
      form.issue || null,
      form.pages || null,
      form.doi || null
    );
  }

  // web
  return formatReferenceWeb(author, year, form.title, form.site, form.url, form.retrieved || null);
}

export default function ReferenceFormatter(): React.ReactElement {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [output, setOutput] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setOutput(null);
    setCopied(false);
  }

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setOutput(buildReference(form));
    setCopied(false);
  }

  async function handleCopy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
    } catch {
      // Fallback: seleccionar texto si el clipboard no está disponible
      const el = document.querySelector<HTMLElement>('[data-testid="reference-output"]');
      if (el) {
        const range = document.createRange();
        range.selectNode(el);
        window.getSelection()?.removeAllRanges();
        window.getSelection()?.addRange(range);
      }
      setCopied(true);
    }
  }

  const yearStr = formatYear(form.year.trim() || null);
  void yearStr; // usado en buildReference

  return (
    <form
      aria-label="Generador de referencias APA 7"
      onSubmit={handleGenerate}
      className="ws-ref-formatter"
    >
      <div className="ws-ref-formatter-field">
        <label htmlFor="ref-type">Tipo de referencia</label>
        <select
          id="ref-type"
          name="type"
          value={form.type}
          onChange={handleChange}
          aria-label="Tipo de referencia"
        >
          <option value="libro">Libro</option>
          <option value="journal">Artículo de revista</option>
          <option value="web">Sitio web</option>
        </select>
      </div>

      {/* Campos comunes */}
      <div className="ws-ref-formatter-field">
        <label htmlFor="ref-author-last">Apellido del autor</label>
        <input
          id="ref-author-last"
          name="authorLast"
          type="text"
          value={form.authorLast}
          onChange={handleChange}
          aria-label="Apellido del autor"
        />
      </div>
      <div className="ws-ref-formatter-field">
        <label htmlFor="ref-author-first">Nombre del autor</label>
        <input
          id="ref-author-first"
          name="authorFirst"
          type="text"
          value={form.authorFirst}
          onChange={handleChange}
          aria-label="Nombre del autor"
        />
      </div>
      <div className="ws-ref-formatter-field">
        <label htmlFor="ref-year">Año</label>
        <input
          id="ref-year"
          name="year"
          type="text"
          value={form.year}
          onChange={handleChange}
          aria-label="Año"
          placeholder="ej: 2020 (dejar vacío si no hay fecha)"
        />
      </div>
      <div className="ws-ref-formatter-field">
        <label htmlFor="ref-title">Título</label>
        <input
          id="ref-title"
          name="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          aria-label="Título"
        />
      </div>

      {/* Campos específicos por tipo */}
      {form.type === 'libro' && (
        <>
          <div className="ws-ref-formatter-field">
            <label htmlFor="ref-publisher">Editorial</label>
            <input
              id="ref-publisher"
              name="publisher"
              type="text"
              value={form.publisher}
              onChange={handleChange}
              aria-label="Editorial"
            />
          </div>
          <div className="ws-ref-formatter-field">
            <label htmlFor="ref-edition">Edición (opcional)</label>
            <input
              id="ref-edition"
              name="edition"
              type="text"
              value={form.edition}
              onChange={handleChange}
              aria-label="Edición"
              placeholder="ej: 6"
            />
          </div>
        </>
      )}

      {form.type === 'journal' && (
        <>
          <div className="ws-ref-formatter-field">
            <label htmlFor="ref-journal">Revista</label>
            <input
              id="ref-journal"
              name="journal"
              type="text"
              value={form.journal}
              onChange={handleChange}
              aria-label="Revista"
            />
          </div>
          <div className="ws-ref-formatter-field">
            <label htmlFor="ref-volume">Volumen</label>
            <input
              id="ref-volume"
              name="volume"
              type="text"
              value={form.volume}
              onChange={handleChange}
              aria-label="Volumen"
            />
          </div>
          <div className="ws-ref-formatter-field">
            <label htmlFor="ref-issue">Número (issue)</label>
            <input
              id="ref-issue"
              name="issue"
              type="text"
              value={form.issue}
              onChange={handleChange}
              aria-label="Número"
            />
          </div>
          <div className="ws-ref-formatter-field">
            <label htmlFor="ref-pages">Páginas</label>
            <input
              id="ref-pages"
              name="pages"
              type="text"
              value={form.pages}
              onChange={handleChange}
              aria-label="Páginas"
              placeholder="ej: 45-60"
            />
          </div>
          <div className="ws-ref-formatter-field">
            <label htmlFor="ref-doi">DOI (opcional)</label>
            <input
              id="ref-doi"
              name="doi"
              type="text"
              value={form.doi}
              onChange={handleChange}
              aria-label="DOI"
            />
          </div>
        </>
      )}

      {form.type === 'web' && (
        <>
          <div className="ws-ref-formatter-field">
            <label htmlFor="ref-site">Sitio</label>
            <input
              id="ref-site"
              name="site"
              type="text"
              value={form.site}
              onChange={handleChange}
              aria-label="Sitio"
            />
          </div>
          <div className="ws-ref-formatter-field">
            <label htmlFor="ref-url">URL</label>
            <input
              id="ref-url"
              name="url"
              type="url"
              value={form.url}
              onChange={handleChange}
              aria-label="URL"
            />
          </div>
          <div className="ws-ref-formatter-field">
            <label htmlFor="ref-retrieved">Fecha de recuperación (si no hay año)</label>
            <input
              id="ref-retrieved"
              name="retrieved"
              type="text"
              value={form.retrieved}
              onChange={handleChange}
              aria-label="Fecha de recuperación"
              placeholder="ej: 15 de abril de 2026"
            />
          </div>
        </>
      )}

      <button
        type="submit"
        className="ws-ref-formatter-generate-btn"
        aria-label="Generar referencia"
      >
        Generar
      </button>

      {output !== null && (
        <div className="ws-ref-formatter-output">
          <p data-testid="reference-output" className="ws-ref-formatter-result">
            {output}
          </p>
          <button
            type="button"
            className="ws-ref-formatter-copy-btn"
            onClick={() => void handleCopy()}
            aria-label="Copiar referencia al portapapeles"
          >
            {copied ? 'Copiado' : 'Copiar'}
          </button>
        </div>
      )}
    </form>
  );
}
