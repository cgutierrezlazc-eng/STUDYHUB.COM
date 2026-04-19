/**
 * Tests TDD para ReferenceFormatter.
 * RED: deben fallar hasta que se implemente el componente.
 *
 * Criterios:
 * 1. Renderiza formulario con select de tipo
 * 2. Por defecto muestra tipo "libro"
 * 3. Al cambiar a "journal" aparecen campos específicos (revista, volumen)
 * 4. Al cambiar a "web" aparecen campos específicos (url, sitio)
 * 5. Botón "Generar" está presente
 * 6. Click en "Generar" produce referencia APA formateada para libro
 * 7. Botón "Copiar al portapapeles" aparece después de generar
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReferenceFormatter from '../../components/workspaces/Citations/ReferenceFormatter';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('ReferenceFormatter — render inicial', () => {
  it('renderiza el formulario', () => {
    render(<ReferenceFormatter />);
    expect(screen.getByRole('form', { name: /generador de referencias/i })).toBeInTheDocument();
  });

  it('muestra select de tipo de referencia', () => {
    render(<ReferenceFormatter />);
    expect(screen.getByRole('combobox', { name: /tipo de referencia/i })).toBeInTheDocument();
  });

  it('muestra botón Generar', () => {
    render(<ReferenceFormatter />);
    expect(screen.getByRole('button', { name: /generar/i })).toBeInTheDocument();
  });
});

describe('ReferenceFormatter — campos por tipo', () => {
  it('muestra campo Editorial para tipo libro (por defecto)', () => {
    render(<ReferenceFormatter />);
    expect(screen.getByLabelText(/editorial/i)).toBeInTheDocument();
  });

  it('muestra campos de revista al seleccionar journal', () => {
    render(<ReferenceFormatter />);
    const select = screen.getByRole('combobox', { name: /tipo de referencia/i });
    fireEvent.change(select, { target: { value: 'journal' } });
    expect(screen.getByLabelText(/revista/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/volumen/i)).toBeInTheDocument();
  });

  it('muestra campos de web al seleccionar web', () => {
    render(<ReferenceFormatter />);
    const select = screen.getByRole('combobox', { name: /tipo de referencia/i });
    fireEvent.change(select, { target: { value: 'web' } });
    expect(screen.getByLabelText(/url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sitio/i)).toBeInTheDocument();
  });
});

describe('ReferenceFormatter — generación de referencia', () => {
  it('genera referencia de libro al completar campos y hacer click en Generar', () => {
    render(<ReferenceFormatter />);

    fireEvent.change(screen.getByLabelText(/apellido del autor/i), {
      target: { value: 'García' },
    });
    fireEvent.change(screen.getByLabelText(/nombre del autor/i), {
      target: { value: 'Carlos' },
    });
    fireEvent.change(screen.getByLabelText(/año/i), { target: { value: '2020' } });
    fireEvent.change(screen.getByLabelText(/título/i), {
      target: { value: 'Psicología educativa' },
    });
    fireEvent.change(screen.getByLabelText(/editorial/i), {
      target: { value: 'Editorial Paidos' },
    });

    fireEvent.click(screen.getByRole('button', { name: /generar/i }));

    expect(screen.getByTestId('reference-output')).toHaveTextContent(
      'García, C. (2020). Psicología educativa. Editorial Paidos.'
    );
  });

  it('muestra botón Copiar al portapapeles después de generar', () => {
    render(<ReferenceFormatter />);

    fireEvent.change(screen.getByLabelText(/apellido del autor/i), {
      target: { value: 'García' },
    });
    fireEvent.change(screen.getByLabelText(/año/i), { target: { value: '2020' } });
    fireEvent.change(screen.getByLabelText(/título/i), { target: { value: 'Título' } });
    fireEvent.change(screen.getByLabelText(/editorial/i), { target: { value: 'Ed.' } });

    fireEvent.click(screen.getByRole('button', { name: /generar/i }));

    expect(screen.getByRole('button', { name: /copiar/i })).toBeInTheDocument();
  });
});
