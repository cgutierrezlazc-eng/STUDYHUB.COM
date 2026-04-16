import { useState, useCallback } from 'react';

interface UseFocusModeReturn {
  isFocusMode: boolean;
  enterFocus: () => void;
  exitFocus: () => void;
  toggleFocus: () => void;
}

/**
 * Hook para controlar el estado del Modo Focus.
 * Retorna el estado actual y funciones para entrar, salir y alternar.
 */
export function useFocusMode(): UseFocusModeReturn {
  const [isFocusMode, setIsFocusMode] = useState(false);

  const enterFocus = useCallback(() => setIsFocusMode(true), []);
  const exitFocus = useCallback(() => setIsFocusMode(false), []);
  const toggleFocus = useCallback(() => setIsFocusMode((prev) => !prev), []);

  return { isFocusMode, enterFocus, exitFocus, toggleFocus };
}
