/**
 * Conniku · HexNebula React component
 * Wrapper React del motor vanilla hex-nebula.js
 */
import { useEffect, useRef } from 'react';
import './hex-nebula.js';

export function HexNebulaCanvas({
  hexSize = 30,
  bgColor = '#050608',
  intensity = 0.9,
  pauseOnHidden = true,
  reducedMotion,
  className,
  style,
  ...rest
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !window.HexNebula) return;
    const inst = window.HexNebula.mount(ref.current, {
      hexSize, bgColor, intensity, pauseOnHidden, reducedMotion
    });
    return () => inst.stop();
  }, [hexSize, bgColor, intensity, pauseOnHidden, reducedMotion]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        display: 'block',
        ...style
      }}
      aria-hidden="true"
      {...rest}
    />
  );
}

export default HexNebulaCanvas;
