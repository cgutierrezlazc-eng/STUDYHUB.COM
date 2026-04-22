/**
 * _gate.js — Lógica centralizada del gate de vista previa del sandbox.
 *
 * Password: leído desde window.SANDBOX_GATE_PASSWORD, que cada HTML del
 * sandbox define antes de cargar este script:
 *
 *   <script>window.SANDBOX_GATE_PASSWORD='VALOR_DESDE_ENV';</script>
 *   <script src="./_gate.js" defer></script>
 *
 * En producción (Vercel): el script de build inyecta el valor de la env
 * var VITE_SANDBOX_GATE_PASSWORD en cada HTML del sandbox.
 *
 * Para rotar el password:
 *   1. Cambiar VITE_SANDBOX_GATE_PASSWORD en Vercel.
 *   2. Re-desplegar (automático en cada push a main).
 *   Ver README.md del sandbox para instrucciones completas.
 *
 * Y debe tener los elementos:
 *   <div class="gate" id="gate">...</div>
 *   <input id="gate-pw">
 *   <button onclick="checkGate()">
 *   <div id="gate-err"></div>
 *
 * NO es auth segura — es solo un gate visual para que el sandbox no se
 * pueda abrir al público antes de tiempo.
 */

(function () {
  var GATE_PASSWORD = window.SANDBOX_GATE_PASSWORD || '';
  var GATE_STORAGE_KEY = 'conniku-gate-ok';

  function initGate() {
    var gateEl = document.getElementById('gate');
    if (!gateEl) return; // no hay gate en esta página
    if (sessionStorage.getItem(GATE_STORAGE_KEY) === '1') {
      gateEl.style.display = 'none';
      return;
    }
    var pwInput = document.getElementById('gate-pw');
    if (pwInput) {
      pwInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') window.checkGate();
      });
      pwInput.focus();
    }
  }

  window.checkGate = function () {
    var pwInput = document.getElementById('gate-pw');
    var errEl = document.getElementById('gate-err');
    var gateEl = document.getElementById('gate');
    if (!pwInput || !gateEl) return;
    if (GATE_PASSWORD && pwInput.value === GATE_PASSWORD) {
      sessionStorage.setItem(GATE_STORAGE_KEY, '1');
      gateEl.style.display = 'none';
    } else if (errEl) {
      errEl.textContent = 'Contraseña incorrecta';
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGate);
  } else {
    initGate();
  }
})();
