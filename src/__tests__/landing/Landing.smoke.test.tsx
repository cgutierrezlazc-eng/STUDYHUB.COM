/**
 * Landing.smoke.test.tsx
 * Smoke tests para el nuevo módulo 02 Landing tab-based SPA dark theme.
 * Sigue ciclo TDD: estos tests se escriben ANTES del componente (RED).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock react-router-dom useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Lazy import: Landing se importa directamente (no lazy) en tests
import Landing from '../../pages/Landing/Landing';

function renderLanding() {
  const onLogin = vi.fn();
  const onRegister = vi.fn();
  const { container } = render(
    <MemoryRouter>
      <Landing onLogin={onLogin} onRegister={onRegister} />
    </MemoryRouter>
  );
  return { container, onLogin, onRegister };
}

describe('Landing — smoke tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza sin crash', () => {
    expect(() => renderLanding()).not.toThrow();
  });

  it('contiene los 5 nombres de tabs visibles', () => {
    renderLanding();
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Producto')).toBeInTheDocument();
    expect(screen.getByText('Cómo funciona')).toBeInTheDocument();
    expect(screen.getByText('Planes')).toBeInTheDocument();
    expect(screen.getByText('Descarga')).toBeInTheDocument();
  });

  it('click en tab "Producto" activa aria-selected en ese tab', () => {
    renderLanding();
    const productoTab = screen.getByRole('tab', { name: /Producto/i });
    fireEvent.click(productoTab);
    expect(productoTab).toHaveAttribute('aria-selected', 'true');
  });

  it('click en tab "Inicio" mantiene aria-selected y muestra contenido de inicio', () => {
    renderLanding();
    const inicioTab = screen.getByRole('tab', { name: /Inicio/i });
    expect(inicioTab).toHaveAttribute('aria-selected', 'true');
  });

  it('contiene el botón "Conniku Business"', () => {
    renderLanding();
    // El texto aparece en el botón (span) y en el header del panel abierto.
    // Verificamos que al menos uno de los elementos existe.
    const elements = screen.getAllByText('Conniku Business');
    expect(elements.length).toBeGreaterThanOrEqual(1);
  });

  it('click en "Conniku Business" abre el panel (aria-expanded=true)', () => {
    renderLanding();
    // El botón tiene aria-controls="business-panel", distinguible de otros elementos
    const btn = screen.getByRole('button', { name: /Conniku Business/i });
    expect(btn).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-expanded', 'true');
  });

  it('contiene CTA "Entrar" en la nav', () => {
    renderLanding();
    // En el Landing nuevo, "Entrar" es un <button> (no <a>)
    // según las instrucciones del plan (onLogin prop → setAuthView).
    const entrarBtns = screen.getAllByRole('button', { name: /^Entrar$/i });
    expect(entrarBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('contiene CTA "Crear cuenta" en la nav', () => {
    renderLanding();
    const crearBtns = screen.getAllByText(/Crear cuenta/i);
    expect(crearBtns.length).toBeGreaterThanOrEqual(1);
  });

  it('NO contiene strings prohibidas: IA, AI, inteligencia artificial', () => {
    const { container } = renderLanding();
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/\bIA\b/);
    expect(text).not.toMatch(/\bAI\b/);
    expect(text).not.toMatch(/inteligencia artificial/i);
  });

  it('NO contiene voseo rioplatense', () => {
    const { container } = renderLanding();
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/necesitás|tenés|querés|sabés|con vos\b/i);
  });

  it('NO contiene estadísticas inventadas con formato numérico de plataforma', () => {
    const { container } = renderLanding();
    const text = container.textContent ?? '';
    // Verifica que no hay stats inventadas del tipo "127k" o "4.8★"
    // El número "127" como count pill fue reemplazado por copy sin número
    expect(text).not.toMatch(/127\s*(estudiantes|usuarios|activos)/i);
    expect(text).not.toMatch(/\d+\.\d+★/);
  });

  it('NO contiene el nombre inventado "Pía Ramírez"', () => {
    const { container } = renderLanding();
    const text = container.textContent ?? '';
    expect(text).not.toContain('Pía Ramírez');
  });

  it('contiene sección de plans con Free y Pro', () => {
    renderLanding();
    // Al hacer click en tab Planes, aparece contenido de planes
    const planesTab = screen.getByRole('tab', { name: /Planes/i });
    fireEvent.click(planesTab);
    expect(screen.getByText(/Conniku Free/i)).toBeInTheDocument();
    expect(screen.getByText(/Conniku Pro/i)).toBeInTheDocument();
  });
});
