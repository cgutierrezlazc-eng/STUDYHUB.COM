/* eslint-env browser */
/**
 * Conniku · Hex Armor v6 · NÉBULA (variante 3)
 * =============================================
 *
 * Fondo metálico de hexágonos con marea orgánica tipo nebulosa.
 * Manchas suaves no lineales con colores Conniku mezclados (green, gold, cyan, violet, orange).
 * Movimiento muy lento y no invasivo · ideal para biblioteca, workspaces, áreas académicas.
 *
 * Uso (vanilla):
 *   <canvas id="hex-nebula"></canvas>
 *   <script src="hex-nebula.js"></script>
 *   <script>HexNebula.mount(document.getElementById('hex-nebula'));</script>
 *
 * Uso (React):
 *   import { HexNebulaCanvas } from './HexNebula.jsx';
 *   <HexNebulaCanvas />
 *
 * API:
 *   HexNebula.mount(canvas, options?)  → { stop() }
 *   options:
 *     hexSize        (default 30)       tamaño del hexágono
 *     bgColor        (default '#050608') color de fondo
 *     intensity      (default 0.9)      multiplicador de brillo (0-1)
 *     pauseOnHidden  (default true)     pausar cuando pestaña no visible
 *     reducedMotion  (default auto)     respetar prefers-reduced-motion
 */

(function (root) {
  'use strict';

  // Paleta Conniku (los 5 acentos cíclicos)
  var PCOLS = [
    [0, 194, 122],   // green
    [196, 154, 58],  // gold
    [0, 150, 204],   // cyan
    [107, 78, 255],  // violet
    [255, 74, 28]    // orange
  ];
  var SQ3 = Math.sqrt(3);

  function noise(c, r) {
    var v = Math.sin(c * 127.1 + r * 311.7) * 43758.5453;
    return v - Math.floor(v);
  }

  function hexPath(ctx, cx, cy, s) {
    ctx.beginPath();
    for (var i = 0; i < 6; i++) {
      var a = Math.PI / 180 * (60 * i - 30);
      if (i === 0) ctx.moveTo(cx + s * Math.cos(a), cy + s * Math.sin(a));
      else ctx.lineTo(cx + s * Math.cos(a), cy + s * Math.sin(a));
    }
    ctx.closePath();
  }

  // Interpolación cíclica entre los 5 colores de marca
  function palAt(phase) {
    var v = (Math.sin(phase) * 0.5 + 0.5) * 5;
    var i = Math.floor(v) % 5, f = v - Math.floor(v);
    var a = PCOLS[i], b = PCOLS[(i + 1) % 5];
    return [
      a[0] + (b[0] - a[0]) * f,
      a[1] + (b[1] - a[1]) * f,
      a[2] + (b[2] - a[2]) * f
    ];
  }

  // Campo NÉBULA · manchas orgánicas no lineales con colores mezclados
  function nebulaField(cx, cy, t, W, H) {
    var nx = cx / W, ny = cy / H;
    var a = Math.sin(nx * 3.0 + ny * 1.5 + t * 0.00015);
    var b = Math.sin(nx * 1.8 - ny * 2.5 - t * 0.00011 + 1.8);
    var c = Math.sin((nx + ny) * 2.2 + t * 0.00008);
    var v = (a * b + c * 0.5) * 0.5 + 0.5;
    v = Math.pow(Math.max(0, v), 1.8);
    var tint = palAt(nx * 2 + ny * 1.5 + t * 0.00010);
    return { m: v * 0.9, c: tint };
  }

  function mount(canvas, options) {
    options = options || {};
    var ctx = canvas.getContext('2d');
    var hexSize = options.hexSize || 30;
    var bgColor = options.bgColor || '#050608';
    var intensity = options.intensity != null ? options.intensity : 0.9;
    var pauseOnHidden = options.pauseOnHidden !== false;
    var reduced = options.reducedMotion != null
      ? options.reducedMotion
      : (typeof window !== 'undefined' && window.matchMedia
          && window.matchMedia('(prefers-reduced-motion:reduce)').matches);

    var W = 0, H = 0, paused = false, raf = 0;
    var mouseX = -9999, mouseY = -9999, hasMouse = false;
    var startT = performance.now();

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = canvas.getBoundingClientRect();
      W = rect.width || window.innerWidth;
      H = rect.height || window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function onMouseMove(e) {
      var rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      hasMouse = true;
    }
    function onMouseLeave() { hasMouse = false; }
    function onVisibility() { paused = pauseOnHidden && document.hidden; }

    function frame() {
      raf = requestAnimationFrame(frame);
      if (paused) return;

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);

      // En reduced-motion: t fijo (escena estática) en vez de animar
      var t = reduced ? startT : performance.now();
      var S = hexSize;
      var r = S * 0.88, gap = 1.2, rInner = r - gap;
      var pitchX = S * SQ3, pitchY = S * 1.5;
      var cols = Math.ceil(W / pitchX) + 3;
      var rows = Math.ceil(H / pitchY) + 3;

      var driftX = Math.sin(t * 0.00008) * S * 0.4;
      var driftY = Math.cos(t * 0.00006) * S * 0.3;

      for (var row = -2; row < rows; row++) {
        for (var col = -2; col < cols; col++) {
          var ox = (((row % 2) + 2) % 2) * pitchX * 0.5;
          var cx = col * pitchX + ox + driftX;
          var cy = row * pitchY + driftY;

          var res = nebulaField(cx, cy, t, W, H);
          var m = res.m * intensity;
          if (m < 0.03) continue;

          var tint = res.c;
          var cr = Math.round(tint[0]),
              cg = Math.round(tint[1]),
              cb = Math.round(tint[2]);
          var n = noise(col + 500, row + 500);

          var mouseBoost = 0;
          if (hasMouse) {
            var dm = Math.hypot(cx - mouseX, cy - mouseY);
            if (dm < S * 5) mouseBoost = (1 - dm / (S * 5)) * 0.4;
          }

          // Fill muy sutil
          var baseOp = m * 0.12;
          hexPath(ctx, cx, cy, rInner);
          ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (baseOp * (0.3 + n * 0.4)) + ')';
          ctx.fill();

          // Edge detect (resalta los bordes de la nebulosa)
          var eps = 5;
          var mE = nebulaField(cx + eps, cy, t, W, H).m;
          var mW2 = nebulaField(cx - eps, cy, t, W, H).m;
          var mN = nebulaField(cx, cy - eps, t, W, H).m;
          var mS = nebulaField(cx, cy + eps, t, W, H).m;
          var grad = Math.hypot(mE - mW2, mS - mN);
          var isEdge = grad > 0.03 && m < 0.75;

          var borderA = (0.08 + m * 0.18) * (0.5 + n * 0.5);
          if (isEdge) borderA = Math.max(borderA, 0.22 + m * 0.28);
          borderA += mouseBoost * 0.4;

          hexPath(ctx, cx, cy, rInner);
          ctx.strokeStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + borderA + ')';
          ctx.lineWidth = 0.7;
          ctx.stroke();

          // Sparkle ocasional en hexes brillantes
          if (m > 0.55 && n > 0.88) {
            ctx.beginPath();
            ctx.arc(cx, cy, 0.9, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (0.35 + m * 0.3) + ')';
            ctx.fill();
          }
        }
      }

      // Vignette para enfocar el centro
      var vg = ctx.createRadialGradient(
        W / 2, H / 2, Math.min(W, H) * 0.15,
        W / 2, H / 2, Math.max(W, H) * 0.75
      );
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('visibilitychange', onVisibility);
    raf = requestAnimationFrame(frame);

    return {
      stop: function () {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseleave', onMouseLeave);
        document.removeEventListener('visibilitychange', onVisibility);
      }
    };
  }

  var api = { mount: mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HexNebula = api;
})(typeof window !== 'undefined' ? window : this);
