// ═══════════════════════════════════════════════════════════════
// DETECTOR — Content script ligero que corre en TODAS las paginas
// Solo detecta si la pagina actual es un LMS soportado
// Si detecta algo, notifica al service worker para que inyecte el extractor
// ═══════════════════════════════════════════════════════════════

import { moodleAdapter } from './adapters/moodle';
import { canvasAdapter } from './adapters/canvas';
import { blackboardAdapter } from './adapters/blackboard';
import { brightspaceAdapter } from './adapters/brightspace';
import { sakaiAdapter } from './adapters/sakai';
import { startPassiveListener } from './passive-listener';
import type { LmsAdapter } from './adapters/base';
import type { MsgPlatformDetected } from '@shared/types';

/** Lista ordenada de adaptadores — se prueban en orden de popularidad */
const adapters: LmsAdapter[] = [
  moodleAdapter,
  canvasAdapter,
  blackboardAdapter,
  brightspaceAdapter,
  sakaiAdapter,
];

/**
 * Ejecutar deteccion una sola vez al cargar la pagina.
 * Si detecta un LMS, envia mensaje al service worker.
 */
function runDetection(): void {
  for (const adapter of adapters) {
    const detection = adapter.detect();

    if (detection && detection.confidence >= 0.3) {
      const message: MsgPlatformDetected = {
        type: 'PLATFORM_DETECTED',
        payload: detection,
      };

      chrome.runtime.sendMessage(message).catch(() => {
        // Extension context invalidated — pagina se cargo despues de desinstalar/actualizar
      });

      // Activar modo pasivo para capturar AJAX mientras el estudiante navega
      if (detection.platform === 'moodle') {
        startPassiveListener();
      }

      // Solo un LMS por pagina — parar al primer match
      return;
    }
  }
}

// Ejecutar cuando el DOM este listo
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  runDetection();
} else {
  document.addEventListener('DOMContentLoaded', runDetection, { once: true });
}
