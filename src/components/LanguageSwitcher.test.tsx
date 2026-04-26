import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import LanguageSwitcher from './LanguageSwitcher';

const MOCK_LANGUAGES = [
  { code: 'es', label: 'Español', sub: 'Latinoamérica', flags: ['🇨🇱'] },
  { code: 'it', label: 'Italiano', sub: 'Italia', flags: ['🇮🇹'] },
];

function renderSwitcher(currentLang = 'es', onChange = vi.fn()) {
  return render(
    <LanguageSwitcher languages={MOCK_LANGUAGES} currentLang={currentLang} onChange={onChange} />
  );
}

describe('LanguageSwitcher — comportamiento observable (TDD RED 1)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('5: render inicial NO muestra el popup', () => {
    renderSwitcher();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('6: trigger muestra el código del idioma actual en mayúsculas', () => {
    renderSwitcher('it');
    const trigger = screen.getByRole('button', { name: /cambiar idioma/i });
    expect(trigger.textContent).toMatch(/IT/);
  });

  it('1: click en trigger abre el popup', () => {
    renderSwitcher();
    const trigger = screen.getByRole('button', { name: /cambiar idioma/i });
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('2: click en card llama onChange(code) y cierra el popup', () => {
    const onChange = vi.fn();
    renderSwitcher('es', onChange);
    const trigger = screen.getByRole('button', { name: /cambiar idioma/i });
    fireEvent.click(trigger);

    const itCard = screen.getByText('Italiano');
    fireEvent.click(itCard);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('it');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('3: ESC cierra el popup sin llamar onChange', () => {
    const onChange = vi.fn();
    renderSwitcher('es', onChange);
    const trigger = screen.getByRole('button', { name: /cambiar idioma/i });
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('4: click fuera cierra el popup sin llamar onChange', () => {
    const onChange = vi.fn();
    renderSwitcher('es', onChange);
    const trigger = screen.getByRole('button', { name: /cambiar idioma/i });
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});
