/**
 * Hex Tide · Conniku
 * Fondos hexagonales animados, no invasivos.
 * Vanilla JS · sin dependencias.
 *
 * Uso:
 *   const bg = HexTide.mount('#canvas', { variant: 'whisper' });
 *   bg.setVariant('nebula');
 *
 * Variantes: 'whisper' | 'nebula'
 */
(function (global) {
  'use strict';

  var SQ3 = Math.sqrt(3);

  /* Paleta Conniku — 5 planetas */
  var PCOLS = [
    [0, 194, 122],   // green — conniku
    [196, 154, 58],  // gold — tutores
    [0, 150, 204],   // cyan — empleos
    [107, 78, 255],  // violet — entrar
    [255, 74, 28],   // orange — crear
  ];

  var DEFAULTS = {
    variant: 'whisper',
    hexSize: 30,
    maxOpacity: 0.12,
    mouseReactive: true,
    background: '#050608',
    vignette: 0.45,
  };

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

  /* Paleta interpolada cíclica */
  function palAt(phase) {
    var v = (Math.sin(phase) * 0.5 + 0.5) * 5;
    var i = Math.floor(v) % 5, f = v - Math.floor(v);
    var a = PCOLS[i], b = PCOLS[(i + 1) % 5];
    return [
      a[0] + (b[0] - a[0]) * f,
      a[1] + (b[1] - a[1]) * f,
      a[2] + (b[2] - a[2]) * f,
    ];
  }

  /* ─── VARIANTES ─── */

  /* WHISPER — ultra sutil, apenas un susurro. Para chat / sociales. */
  function variantWhisper(cx, cy, t, W, H) {
    var u = (cx + cy) / (W + H);
    var nx = cx / W;
    var v = Math.sin(u * Math.PI * 2.0 + t * 0.00020) * 0.5 + 0.5;
    v *= (Math.sin(nx * Math.PI * 4 - t * 0.00012) * 0.3 + 0.7);
    v = Math.pow(v, 2.8) * 0.6;
    var tint = palAt(u * 2.5 + t * 0.00008);
    return { m: v, c: tint };
  }

  /* NEBULA — manchas orgánicas, contemplativo. Para biblioteca / workspace. */
  function variantNebula(cx, cy, t, W, H) {
    var nx = cx / W, ny = cy / H;
    var a = Math.sin(nx * 3.0 + ny * 1.5 + t * 0.00015);
    var b = Math.sin(nx * 1.8 - ny * 2.5 - t * 0.00011 + 1.8);
    var c = Math.sin((nx + ny) * 2.2 + t * 0.00008);
    var v = (a * b + c * 0.5) * 0.5 + 0.5;
    v = Math.pow(Math.max(0, v), 1.8);
    var tint = palAt(nx * 2 + ny * 1.5 + t * 0.00010);
    return { m: v * 0.9, c: tint };
  }

  var VARIANTS = {
    whisper: variantWhisper,
    nebula: variantNebula,
  };

  /* ─── MOTOR ─── */

  function HexTideInstance(canvas, opts) {
    var self = this;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = Object.assign({}, DEFAULTS, opts || {});
    this.variantFn = VARIANTS[this.opts.variant] || VARIANTS.whisper;

    /* Transición entre variantes */
    this.prevVariantFn = null;
    this.blend = 1; // 0..1 — 1 = fully current

    this.W = 0; this.H = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.running = true;
    this.raf = null;

    this.mouseX = -9999; this.mouseY = -9999; this.hasMouse = false;
    this.reducedMotion = window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    /* Bindings */
    this._onResize = function () { self._resize(); };
    this._onMove = function (e) {
      self.mouseX = e.clientX; self.mouseY = e.clientY; self.hasMouse = true;
    };
    this._onLeave = function () { self.hasMouse = false; };
    this._onVis = function () {
      if (document.hidden) self.pause();
      else self.resume();
    };

    window.addEventListener('resize', this._onResize);
    if (this.opts.mouseReactive) {
      window.addEventListener('mousemove', this._onMove);
      window.addEventListener('mouseleave', this._onLeave);
    }
    document.addEventListener('visibilitychange', this._onVis);

    this._resize();
    this._loop();
  }

  HexTideInstance.prototype._resize = function () {
    var c = this.canvas;
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    c.width = Math.floor(this.W * this.dpr);
    c.height = Math.floor(this.H * this.dpr);
    c.style.width = this.W + 'px';
    c.style.height = this.H + 'px';
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  HexTideInstance.prototype._loop = function () {
    var self = this;
    if (!this.running) return;
    this.raf = requestAnimationFrame(function () { self._loop(); });
    this._frame();
  };

  HexTideInstance.prototype._frame = function () {
    var ctx = this.ctx, W = this.W, H = this.H;
    var opts = this.opts;
    ctx.fillStyle = opts.background;
    ctx.fillRect(0, 0, W, H);

    /* Si reduced-motion, t queda congelado en 0 después del primer frame */
    var t = this.reducedMotion ? 1000 : performance.now();

    /* Avance de blend para transición suave entre variantes */
    if (this.blend < 1) {
      this.blend = Math.min(1, this.blend + 0.012);
      if (this.blend >= 1) this.prevVariantFn = null;
    }

    var S = opts.hexSize;
    var r = S * 0.88, gap = 1.2, rInner = r - gap;
    var pitchX = S * SQ3, pitchY = S * 1.5;
    var cols = Math.ceil(W / pitchX) + 3;
    var rows = Math.ceil(H / pitchY) + 3;

    var driftX = Math.sin(t * 0.00008) * S * 0.4;
    var driftY = Math.cos(t * 0.00006) * S * 0.3;

    var vfn = this.variantFn;
    var pvfn = this.prevVariantFn;
    var blend = this.blend;

    for (var row = -2; row < rows; row++) {
      for (var col = -2; col < cols; col++) {
        var ox = (((row % 2) + 2) % 2) * pitchX * 0.5;
        var cx = col * pitchX + ox + driftX;
        var cy = row * pitchY + driftY;

        var res = vfn(cx, cy, t, W, H);
        var m = res.m;
        var tint = res.c;

        /* Blend con variante previa si hay transición */
        if (pvfn) {
          var pres = pvfn(cx, cy, t, W, H);
          m = m * blend + pres.m * (1 - blend);
          tint = [
            tint[0] * blend + pres.c[0] * (1 - blend),
            tint[1] * blend + pres.c[1] * (1 - blend),
            tint[2] * blend + pres.c[2] * (1 - blend),
          ];
        }

        if (m < 0.03) continue;

        var cr = Math.round(tint[0]);
        var cg = Math.round(tint[1]);
        var cb = Math.round(tint[2]);
        var n = noise(col + 500, row + 500);

        var mouseBoost = 0;
        if (this.hasMouse) {
          var dm = Math.hypot(cx - this.mouseX, cy - this.mouseY);
          if (dm < S * 5) mouseBoost = (1 - dm / (S * 5)) * 0.4;
        }

        var baseOp = m * opts.maxOpacity;
        hexPath(ctx, cx, cy, rInner);
        ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (baseOp * (0.3 + n * 0.4)) + ')';
        ctx.fill();

        /* Edge detect — borde más visible en la frontera */
        var eps = 5;
        var mE = vfn(cx + eps, cy, t, W, H).m;
        var mW_ = vfn(cx - eps, cy, t, W, H).m;
        var mN = vfn(cx, cy - eps, t, W, H).m;
        var mS = vfn(cx, cy + eps, t, W, H).m;
        var grad = Math.hypot(mE - mW_, mS - mN);
        var isEdge = grad > 0.03 && m < 0.75;

        var borderA = (0.08 + m * 0.18) * (0.5 + n * 0.5);
        if (isEdge) borderA = Math.max(borderA, 0.22 + m * 0.28);
        borderA += mouseBoost * 0.4;

        hexPath(ctx, cx, cy, rInner);
        ctx.strokeStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + borderA + ')';
        ctx.lineWidth = 0.7;
        ctx.stroke();

        if (m > 0.55 && n > 0.88) {
          ctx.beginPath();
          ctx.arc(cx, cy, 0.9, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(' + cr + ',' + cg + ',' + cb + ',' + (0.35 + m * 0.3) + ')';
          ctx.fill();
        }
      }
    }

    /* Vignette */
    if (opts.vignette > 0) {
      var vg = ctx.createRadialGradient(
        W / 2, H / 2, Math.min(W, H) * 0.15,
        W / 2, H / 2, Math.max(W, H) * 0.75
      );
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, 'rgba(0,0,0,' + opts.vignette + ')');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    }
  };

  /* API pública */

  HexTideInstance.prototype.setVariant = function (name) {
    if (!VARIANTS[name] || name === this.opts.variant) return;
    this.prevVariantFn = this.variantFn;
    this.variantFn = VARIANTS[name];
    this.opts.variant = name;
    this.blend = 0;
  };

  HexTideInstance.prototype.setOptions = function (opts) {
    Object.assign(this.opts, opts || {});
    if (opts && opts.variant) this.setVariant(opts.variant);
  };

  HexTideInstance.prototype.pause = function () {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
  };

  HexTideInstance.prototype.resume = function () {
    if (this.running) return;
    this.running = true;
    this._loop();
  };

  HexTideInstance.prototype.destroy = function () {
    this.pause();
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('mousemove', this._onMove);
    window.removeEventListener('mouseleave', this._onLeave);
    document.removeEventListener('visibilitychange', this._onVis);
  };

  /* Factory */

  var HexTide = {
    mount: function (target, options) {
      var canvas = typeof target === 'string'
        ? document.querySelector(target)
        : target;
      if (!canvas || canvas.tagName !== 'CANVAS') {
        throw new Error('HexTide: target must be a <canvas> element');
      }
      return new HexTideInstance(canvas, options);
    },
    variants: Object.keys(VARIANTS),
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = HexTide;
  else global.HexTide = HexTide;

})(typeof window !== 'undefined' ? window : this);
