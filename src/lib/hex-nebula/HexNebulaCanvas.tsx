/**
 * HexNebulaCanvas · wrapper React del motor hex-nebula.js (vanilla).
 *
 * El motor se carga como side-effect y deja `window.HexNebula` disponible.
 * Este componente monta un canvas + invoca `mount()` en useEffect, con
 * cleanup automático en unmount.
 *
 * Uso:
 *   <HexNebulaCanvas options={{ intensity: 0.5, bgColor: '#0A0C12' }}
 *                    className={styles.nebulaBg} />
 */
import { useEffect, useRef } from 'react';
import './hex-nebula.js';

export interface HexNebulaOptions {
  hexSize?: number;
  bgColor?: string;
  intensity?: number;
  pauseOnHidden?: boolean;
  reducedMotion?: boolean;
}

interface HexNebulaInstance {
  stop: () => void;
}

declare global {
  interface Window {
    HexNebula?: {
      mount: (canvas: HTMLCanvasElement, options?: HexNebulaOptions) => HexNebulaInstance;
    };
  }
}

interface Props {
  options?: HexNebulaOptions;
  className?: string;
}

export default function HexNebulaCanvas({ options, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const HN = window.HexNebula;
    if (!HN) {
      console.warn('[HexNebulaCanvas] window.HexNebula no está disponible');
      return;
    }
    const inst = HN.mount(canvas, options);
    return () => inst.stop();
  }, [options]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
