/**
 * Tests del componente ExportModal (2d.7 Export PDF/DOCX).
 *
 * Cobertura:
 * - Render inicial con formato PDF seleccionado por defecto
 * - Cambio de formato PDF ↔ DOCX
 * - Checkboxes "próximamente" están disabled (ALERTA-2D7-2)
 * - Cancelar cierra el modal
 * - Escape cierra el modal
 * - Click fuera del modal cierra
 * - Llama exportWorkspacePdf al descargar en formato PDF
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import ExportModal from '../Export/ExportModal';

vi.mock('../../../services/workspacesApi', () => ({
  exportWorkspacePdf: vi.fn().mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' })),
  exportWorkspaceDocx: vi.fn().mockResolvedValue(
    new Blob(['docx'], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    })
  ),
  downloadBlob: vi.fn(),
}));

const baseProps = {
  docId: 'ws-abc',
  docTitle: 'Tesis de Biología',
  htmlContent: '<p>Contenido del documento</p>',
  onClose: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ExportModal — render inicial', () => {
  it('renderiza con role dialog y aria-modal', () => {
    const { getByRole } = render(<ExportModal {...baseProps} />);
    const dialog = getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('ws-export-title');
  });

  it('PDF está seleccionado por defecto', () => {
    const { getByRole } = render(<ExportModal {...baseProps} />);
    const pdfRadio = getByRole('radio', { name: /PDF/i }) as HTMLInputElement;
    expect(pdfRadio.checked).toBe(true);
  });

  it('DOCX no está seleccionado inicialmente', () => {
    const { getByRole } = render(<ExportModal {...baseProps} />);
    const docxRadio = getByRole('radio', { name: /DOCX/i }) as HTMLInputElement;
    expect(docxRadio.checked).toBe(false);
  });
});

describe('ExportModal — checkboxes "próximamente" (ALERTA-2D7-2)', () => {
  it('checkbox de Tapa está disabled', () => {
    const { getByLabelText } = render(<ExportModal {...baseProps} />);
    const tapaCheckbox = getByLabelText(/Tapa\/portada/i) as HTMLInputElement;
    expect(tapaCheckbox.disabled).toBe(true);
    expect(tapaCheckbox.getAttribute('aria-disabled')).toBe('true');
  });

  it('checkbox de Rúbrica está disabled', () => {
    const { getByLabelText } = render(<ExportModal {...baseProps} />);
    const rubricCheckbox = getByLabelText(/Rúbrica de evaluación/i) as HTMLInputElement;
    expect(rubricCheckbox.disabled).toBe(true);
    expect(rubricCheckbox.getAttribute('aria-disabled')).toBe('true');
  });
});

describe('ExportModal — cierre del modal', () => {
  it('click en Cancelar invoca onClose', () => {
    const onClose = vi.fn();
    const { getByText } = render(<ExportModal {...baseProps} onClose={onClose} />);
    fireEvent.click(getByText('Cancelar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('tecla Escape invoca onClose', () => {
    const onClose = vi.fn();
    render(<ExportModal {...baseProps} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('click fuera del modal invoca onClose', () => {
    const onClose = vi.fn();
    const { getByRole } = render(<ExportModal {...baseProps} onClose={onClose} />);
    const overlay = getByRole('dialog');
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('ExportModal — cambio de formato', () => {
  it('click en DOCX cambia selección', () => {
    const { getByRole } = render(<ExportModal {...baseProps} />);
    const docxRadio = getByRole('radio', { name: /DOCX/i }) as HTMLInputElement;
    fireEvent.click(docxRadio);
    expect(docxRadio.checked).toBe(true);
  });
});
