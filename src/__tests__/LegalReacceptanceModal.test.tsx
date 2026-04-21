/**
 * LegalReacceptanceModal.test.tsx
 *
 * Pieza 6 del bloque bloque-legal-consolidation-v2.
 *
 * Valida que el modal de re-aceptación:
 *  - Renderiza la lista de documentos pendientes con nombre y versión.
 *  - Mantiene el checkbox final DISABLED mientras falte algún documento
 *    por abrir (invariante I9).
 *  - Habilita el checkbox una vez que todos los documentos fueron
 *    abiertos al menos una vez.
 *  - Solo habilita el botón "Aceptar y continuar" cuando el checkbox está
 *    marcado.
 *  - Llama a onAccept con la lista completa cuando el usuario confirma.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import LegalReacceptanceModal from '../components/LegalReacceptanceModal';
import {
  COOKIES_DOCUMENT,
  PRIVACY_DOCUMENT,
  REACCEPT_DOCUMENTS,
  TOS_DOCUMENT,
} from '../../shared/legal_constants';

describe('LegalReacceptanceModal', () => {
  it('no renderiza nada cuando no hay documentos pendientes', () => {
    const onAccept = vi.fn();
    const { container } = render(<LegalReacceptanceModal documents={[]} onAccept={onAccept} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza los 3 documentos y la versión abreviada', () => {
    render(<LegalReacceptanceModal documents={REACCEPT_DOCUMENTS} onAccept={vi.fn()} />);
    expect(screen.getAllByText(/Términos y Condiciones/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Política de Privacidad/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Política de Cookies/i).length).toBeGreaterThan(0);
    expect(screen.getByText(new RegExp(`Versión ${TOS_DOCUMENT.version}`))).toBeTruthy();
    expect(screen.getByText(new RegExp(`Versión ${PRIVACY_DOCUMENT.version}`))).toBeTruthy();
    expect(screen.getByText(new RegExp(`Versión ${COOKIES_DOCUMENT.version}`))).toBeTruthy();
  });

  it('mantiene el checkbox final disabled hasta que todos los documentos se abran', () => {
    const onNavigate = vi.fn();
    render(
      <LegalReacceptanceModal
        documents={REACCEPT_DOCUMENTS}
        onAccept={vi.fn()}
        onNavigate={onNavigate}
      />
    );
    const checkbox = screen.getByTestId('legal-reaccept-checkbox') as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);

    fireEvent.click(screen.getByTestId('legal-open-tos'));
    expect(checkbox.disabled).toBe(true);
    fireEvent.click(screen.getByTestId('legal-open-privacy'));
    expect(checkbox.disabled).toBe(true);
    fireEvent.click(screen.getByTestId('legal-open-cookies'));
    expect(checkbox.disabled).toBe(false);

    expect(onNavigate).toHaveBeenCalledTimes(3);
    expect(onNavigate).toHaveBeenCalledWith('/terms');
    expect(onNavigate).toHaveBeenCalledWith('/privacy');
    expect(onNavigate).toHaveBeenCalledWith('/cookies');
  });

  it('mantiene el botón submit disabled hasta que el checkbox esté marcado', () => {
    render(
      <LegalReacceptanceModal
        documents={REACCEPT_DOCUMENTS}
        onAccept={vi.fn()}
        onNavigate={vi.fn()}
      />
    );
    const submit = screen.getByTestId('legal-reaccept-submit') as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    fireEvent.click(screen.getByTestId('legal-open-tos'));
    fireEvent.click(screen.getByTestId('legal-open-privacy'));
    fireEvent.click(screen.getByTestId('legal-open-cookies'));
    expect(submit.disabled).toBe(true); // aún sin check

    fireEvent.click(screen.getByTestId('legal-reaccept-checkbox'));
    expect(submit.disabled).toBe(false);
  });

  it('llama onAccept con todos los documentos al confirmar', async () => {
    const onAccept = vi.fn().mockResolvedValue(undefined);
    render(
      <LegalReacceptanceModal
        documents={REACCEPT_DOCUMENTS}
        onAccept={onAccept}
        onNavigate={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTestId('legal-open-tos'));
    fireEvent.click(screen.getByTestId('legal-open-privacy'));
    fireEvent.click(screen.getByTestId('legal-open-cookies'));
    fireEvent.click(screen.getByTestId('legal-reaccept-checkbox'));
    fireEvent.click(screen.getByTestId('legal-reaccept-submit'));

    expect(onAccept).toHaveBeenCalledTimes(1);
    const passed = onAccept.mock.calls[0][0];
    expect(passed.map((d: { documentType: string }) => d.documentType).sort()).toEqual([
      'cookies',
      'privacy',
      'tos',
    ]);
  });

  it('renderiza mensaje de error si el caller lo pasa', () => {
    render(
      <LegalReacceptanceModal
        documents={REACCEPT_DOCUMENTS}
        onAccept={vi.fn()}
        errorMessage="No se pudo registrar la aceptación. Intenta de nuevo."
      />
    );
    expect(screen.getByRole('alert')).toHaveTextContent(/No se pudo registrar/i);
  });
});
