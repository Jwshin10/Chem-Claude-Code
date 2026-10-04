/* Core: module registry, DOM helpers, controls, canvas + plotting utilities.
   Every topic module calls App.register({...}) with:
     id, unit (1-9, or 0 for tools), sym (2-letter tile symbol), title, desc,
     tags (search words), keyIdeas (list of strings), render(el, scope)
   render() builds UI inside `el`; anything animated/listening must go through `scope`
   (scope.loop / scope.on / scope.timeout) so it is torn down on navigation. */
'use strict';

const App = {
  modules: [],
  byId: {},
  units: [
    { n: 1, title: 'Atomic Structure & Properties' },
    { n: 2, title: 'Compound Structure & Properties' },
    { n: 3, title: 'Intermolecular Forces & Properties' },
    { n: 4, title: 'Chemical Reactions' },
    { n: 5, title: 'Kinetics' },
    { n: 6, title: 'Thermodynamics' },
    { n: 7, title: 'Equilibrium' },
    { n: 8, title: 'Acids & Bases' },
    { n: 9, title: 'Applications of Thermodynamics' },
    { n: 0, title: 'Study Tools' },
  ],
  register(m) {
    m.tags = m.tags || [];
    m.keyIdeas = m.keyIdeas || [];
    this.modules.push(m);
    this.byId[m.id] = m;
  },
  unitModules(n) { return this.modules.filter(m => m.unit === n); },
  number(m) {
    if (m.unit === 0) return 'T' + (this.unitModules(0).indexOf(m) + 1);
    return m.unit + '.' + (this.unitModules(m.unit).indexOf(m) + 1);
  },
};

const U = {};

/* ---------------- DOM ---------------- */
U.h = (tag, props, ...kids) => {
  const el = document.createElement(tag);
  if (props) {
    for (const k of Object.keys(props)) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value' || k === 'checked' || k === 'disabled' || k === 'selected') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  U.append(el, kids);
  return el;
};
U.append = (el, kids) => {
  for (const k of [kids].flat(Infinity)) {
    if (k == null || k === false) continue;
    el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
  }
  return el;
};
U.html = (tag, cls, html) => U.h(tag, { class: cls, html });
U.clear = el => { while (el.firstChild) el.removeChild(el.firstChild); return el; };
U.esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------------- lifecycle scope ---------------- */
class Scope {
  constructor() { this.fns = []; this.dead = false; }
  add(fn) { if (this.dead) { try { fn(); } catch (e) { console.error(e); } } else this.fns.push(fn); return fn; }
  loop(fn) {
    let id = 0, last = performance.now();
    const tick = t => {
      if (this.dead) return;
      const dt = Math.min(0.05, Math.max(0, (t - last) / 1000));
      last = t;
      let r;
      try { r = fn(dt, t); } catch (e) { console.error(e); r = false; }
      if (r !== false) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    const stop = () => cancelAnimationFrame(id);
    this.add(stop);
    return stop;
  }
  on(target, ev, fn, opt) { target.addEventListener(ev, fn, opt); this.add(() => target.removeEventListener(ev, fn, opt)); }
  timeout(fn, ms) { const id = setTimeout(fn, ms); this.add(() => clearTimeout(id)); return id; }
  interval(fn, ms) { const id = setInterval(fn, ms); this.add(() => clearInterval(id)); return id; }
  child() { const c = new Scope(); this.add(() => c.dispose()); return c; }
  dispose() {
    if (this.dead) return;
    this.dead = true;
    for (const f of this.fns.splice(0).reverse()) { try { f(); } catch (e) { console.error(e); } }
  }
}
U.Scope = Scope;

/* ---------------- storage (never throws) ---------------- */
U.store = {
  get(k, d) { try { const v = localStorage.getItem('apchem:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('apchem:' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
};

/* ---------------- numbers ---------------- */
const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', '+': '⁺', '−': '⁻' };
const SUB = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };
U.supText = s => String(s).split('').map(c => SUP[c] || c).join('');
U.subText = s => String(s).split('').map(c => SUB[c] || c).join('');
/** significant-figure formatting; scientific notation (with unicode superscripts) when very large/small */
U.sig = (x, s = 3) => {
  if (x == null || !isFinite(x)) return '—';
  if (x === 0) return '0';
  const a = Math.abs(x);
  if (a >= 1e5 || a < 1e-3) {
    let e = Math.floor(Math.log10(a));
    let m = x / Math.pow(10, e);
    if (Math.abs(+m.toPrecision(s)) >= 10) { m /= 10; e++; }
    return m.toPrecision(s) + '×10' + U.supText(e);
  }
  if (a >= Math.pow(10, s)) return String(Math.round(x));
  return x.toPrecision(s);
};
U.fix = (x, d = 2) => (x == null || !isFinite(x)) ? '—' : (Math.abs(x) < 0.5 * Math.pow(10, -d) ? (0).toFixed(d) : x.toFixed(d));
U.clamp = (x, a, b) => Math.max(a, Math.min(b, x));
U.lerp = (a, b, t) => a + (b - a) * t;
U.rand = (a, b) => a + Math.random() * (b - a);
U.randInt = (a, b) => Math.floor(U.rand(a, b + 1));
U.pick = arr => arr[Math.floor(Math.random() * arr.length)];
/** deterministic, uncorrelated pseudo-random numbers in [0,1) for laying out particles */
const frac = x => x - Math.floor(x);
U.hx = k => frac(Math.sin(k * 127.1 + 311.7) * 43758.5453);
U.hy = k => frac(Math.sin(k * 269.5 + 183.3) * 43758.5453);
U.signed = (x, d = 1) => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(d);
U.gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
/** solve f(x)=0 on [a,b] by bisection (f(a), f(b) of opposite sign) */
U.bisect = (f, a, b, it = 200) => {
  let fa = f(a);
  for (let i = 0; i < it; i++) {
    const m = (a + b) / 2, fm = f(m);
    if (fa * fm <= 0) b = m; else { a = m; fa = fm; }
  }
  return (a + b) / 2;
};

/* ---------------- chemistry text ---------------- */
/** "SO4^2-" -> SO<sub>4</sub><sup>2−</sup>; "->" -> →; "<=>" -> ⇌ */
U.chem = s => String(s)
  .replace(/<=>/g, '⇌').replace(/->/g, '→')
  .replace(/([A-Za-z)\]])(\d+)/g, '$1<sub>$2</sub>')
  .replace(/\^(\d*[+\-−])/g, (m, c) => '<sup>' + c.replace('-', '−') + '</sup>');
/** same as U.chem but plain unicode (for canvas) */
U.chemText = s => String(s)
  .replace(/<=>/g, '⇌').replace(/->/g, '→')
  .replace(/([A-Za-z)\]])(\d+)/g, (m, a, d) => a + U.subText(d))
  .replace(/\^(\d*[+\-−])/g, (m, c) => U.supText(c));
U.chemEl = (s, tag = 'span') => U.h(tag, { class: 'formula', html: U.chem(s) });

/* ---------------- theme colours for canvas ---------------- */
let themeCache = null;
U.theme = () => {
  if (themeCache) return themeCache;
  const cs = getComputedStyle(document.documentElement);
  const g = n => cs.getPropertyValue('--' + n).trim();
  themeCache = {
    bg: g('bg'), surface: g('surface'), surface2: g('surface-2'), surface3: g('surface-3'),
    ink: g('ink'), ink2: g('ink-2'), ink3: g('ink-3'), line: g('line'), accent: g('accent'),
    good: g('good'), warn: g('warn'), bad: g('bad'),
    red: g('c-red'), blue: g('c-blue'), green: g('c-green'), orange: g('c-orange'), purple: g('c-purple'),
    teal: g('c-teal'), pink: g('c-pink'), yellow: g('c-yellow'), gray: g('c-gray'),
    dark: document.documentElement.dataset.theme === 'dark' ||
      (document.documentElement.dataset.theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches),
    u: n => g('u' + n),
  };
  return themeCache;
};
U.liveCanvases = new Set();
U.themeChanged = () => {
  themeCache = null;
  for (const c of U.liveCanvases) { try { c.draw && c.draw(c.ctx, c.w, c.h); } catch (e) { console.error(e); } }
};

/* colour helpers */
U.hexToRgb = hex => {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const n = parseInt(hex, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
U.rgb = (r, g, b, a = 1) => `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
U.alpha = (hex, a) => { const [r, g, b] = U.hexToRgb(hex); return U.rgb(r, g, b, a); };
U.shade = (hex, amt) => { // amt -1..1 (negative darkens)
  const [r, g, b] = U.hexToRgb(hex);
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  return U.rgb(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p);
};
U.mix = (h1, h2, t) => { const a = U.hexToRgb(h1), b = U.hexToRgb(h2); return U.rgb(U.lerp(a[0], b[0], t), U.lerp(a[1], b[1], t), U.lerp(a[2], b[2], t)); };
U.lum = hex => { const [r, g, b] = U.hexToRgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; };
/** sequential colour ramp t in [0,1] (blue -> teal -> yellow -> red) */
U.ramp = t => {
  const stops = ['#2c4fb8', '#2b8fd6', '#25b3a1', '#9ccc3c', '#f2c12e', '#ee7d22', '#d9342b'];
  t = U.clamp(t, 0, 1) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(t));
  return U.mix(stops[i], stops[i + 1], t - i);
};

/* CPK-style element colours */
U.CPK = {
  H: '#f4f6f8', He: '#7fe3f0', Li: '#b07cf0', Be: '#b6d84a', B: '#f2a39a', C: '#50565f', N: '#3d6ae0', O: '#e5413b',
  F: '#6fd27a', Ne: '#6fd0e8', Na: '#9a62f0', Mg: '#46c486', Al: '#a9aec4', Si: '#d8b88e', P: '#f08a24', S: '#ecc53a',
  Cl: '#33b34f', Ar: '#5cc4dc', K: '#8c4fd0', Ca: '#4caf6a', Fe: '#d0702e', Cu: '#c8783a', Zn: '#7f84b4', Br: '#a8402e',
  Kr: '#4cb8d0', Ag: '#b8bcc6', I: '#7b4ac8', Xe: '#3fb0c4', Au: '#e3b843', Pb: '#5c6070', Mn: '#9c7ac8', Cr: '#8a99c7',
  Co: '#e88aa0', Ni: '#59b06a', Sn: '#8a8fa0', Ba: '#3faf7a', Sr: '#3faf8a', Cs: '#7a4abf', Rb: '#8a50c8', Hg: '#b8b8d0',
  Se: '#f0a020', As: '#bd80e3', Ge: '#6f8f8f', Sb: '#9e63b5', Te: '#d47a00', X: '#c084fc',
};
U.elColor = el => U.CPK[el] || '#d48fd0';

/** shaded sphere atom */
U.drawAtom = (ctx, x, y, r, el, opts = {}) => {
  const col = opts.color || U.elColor(el);
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, U.shade(col, 0.55));
  g.addColorStop(0.55, col);
  g.addColorStop(1, U.shade(col, -0.35));
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.globalAlpha = opts.alpha == null ? 1 : opts.alpha;
  ctx.fillStyle = g; ctx.fill();
  if (el === 'H' || opts.outline) { ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1; ctx.stroke(); }
  if (opts.label !== false && r >= 7) {
    ctx.fillStyle = U.lum(col) > 0.62 ? '#1b2530' : '#ffffff';
    ctx.font = `600 ${Math.round(r * (String(opts.label || el).length > 2 ? 0.62 : 0.85))}px ${U.FONT}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(opts.label || el, x, y + 0.5);
  }
  ctx.globalAlpha = 1;
};
U.FONT = '"IBM Plex Sans", system-ui, sans-serif';
U.MONO = '"IBM Plex Mono", ui-monospace, monospace';

/** arrow from (x1,y1) to (x2,y2) */
U.arrow = (ctx, x1, y1, x2, y2, color, w = 2, head = 9) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * head * 0.6, y2 - Math.sin(a) * head * 0.6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(a - 0.42), y2 - head * Math.sin(a - 0.42));
  ctx.lineTo(x2 - head * Math.cos(a + 0.42), y2 - head * Math.sin(a + 0.42));
  ctx.closePath(); ctx.fill();
};
U.text = (ctx, s, x, y, o = {}) => {
  ctx.font = `${o.weight || 500} ${o.size || 12}px ${o.mono ? U.MONO : U.FONT}`;
  ctx.fillStyle = o.color || U.theme().ink;
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'alphabetic';
  ctx.fillText(s, x, y);
};
U.roundRect = (ctx, x, y, w, h, r) => {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
};

/* ---------------- canvas ---------------- */
/** responsive HiDPI canvas. opts: height (px | fn(width)), aspect, draw(ctx,w,h), scope, drag (bool) */
U.canvas = (parent, opts = {}) => {
  const wrap = U.h('div', { class: 'canvas-wrap' });
  const cv = U.h('canvas', { class: 'viz' + (opts.drag ? ' drag' : '') });
  wrap.appendChild(cv);
  if (opts.hint) wrap.appendChild(U.h('div', { class: 'canvas-hint' }, opts.hint));
  if (parent) parent.appendChild(wrap);
  const o = { wrap, canvas: cv, ctx: cv.getContext('2d'), w: 0, h: 0, draw: opts.draw || null };
  o.resize = noDraw => {
    const w = Math.round(wrap.clientWidth) || o.w || 600;
    const h = Math.round(opts.height ? (typeof opts.height === 'function' ? opts.height(w) : opts.height) : w / (opts.aspect || 1.6));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.max(1, Math.round(w * dpr)); cv.height = Math.max(1, Math.round(h * dpr));
    cv.style.height = h + 'px';
    o.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    o.w = w; o.h = h;
    if (o.draw && noDraw !== true) o.draw(o.ctx, w, h);
  };
  o.redraw = () => { if (o.draw) { o.ctx.clearRect(0, 0, o.w, o.h); o.draw(o.ctx, o.w, o.h); } };
  /** pointer position in CSS px */
  o.pos = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const ro = new ResizeObserver(() => { const w = Math.round(wrap.clientWidth); if (w && w !== o.w) o.resize(); });
  ro.observe(wrap);
  U.liveCanvases.add(o);
  const cleanup = () => { ro.disconnect(); U.liveCanvases.delete(o); };
  let alive = true;
  if (opts.scope) opts.scope.add(() => { alive = false; cleanup(); });
  // size now, draw after the caller has finished setting up (avoids touching uninitialised variables)
  o.resize(true);
  queueMicrotask(() => { if (alive && o.draw) { try { o.redraw(); } catch (e) { console.error(e); } } });
  return o;
};
/** pointer drag helper: handlers get ({x,y}, event) in CSS px */
U.drag = (c, { down, move, up }, scope) => {
  let active = false;
  const d = e => { active = down ? down(c.pos(e), e) !== false : true; if (active) { c.canvas.setPointerCapture(e.pointerId); e.preventDefault(); } };
  const m = e => { if (active && move) move(c.pos(e), e); };
  const u = e => { if (active) { active = false; up && up(c.pos(e), e); } };
  const on = (t, ev, fn) => scope ? scope.on(t, ev, fn) : t.addEventListener(ev, fn);
  on(c.canvas, 'pointerdown', d); on(c.canvas, 'pointermove', m);
  on(c.canvas, 'pointerup', u); on(c.canvas, 'pointercancel', u);
};

/* ---------------- plotting ---------------- */
U.niceNum = (range, round) => {
  const e = Math.floor(Math.log10(range)), f = range / Math.pow(10, e);
  let nf;
  if (round) nf = f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10;
  else nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  return nf * Math.pow(10, e);
};
U.ticks = (a, b, n = 6) => {
  if (a === b) return [a];
  const lo = Math.min(a, b), hi = Math.max(a, b);
  const step = U.niceNum(U.niceNum(hi - lo, false) / (n - 1), true);
  const out = [];
  for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-6; v += step) out.push(+v.toPrecision(12));
  return out;
};
U.tickFmt = v => {
  const a = Math.abs(v);
  if (a === 0) return '0';
  if (a >= 1e5 || a < 1e-3) return U.sig(v, 2);
  return String(+v.toPrecision(6));
};
class Plot {
  /** o: {x:[a,b], y:[a,b], pad:{l,r,t,b}, xlabel, ylabel, xlog, xrev, xticks, yticks, xfmt, yfmt, grid} */
  constructor(ctx, w, h, o) {
    this.ctx = ctx; this.o = o; this.w = w; this.h = h;
    const p = Object.assign({ l: 54, r: 14, t: 14, b: 42 }, o.pad || {});
    this.L = p.l; this.R = w - p.r; this.T = p.t; this.B = h - p.b;
  }
  X(v) {
    let [a, b] = this.o.x;
    if (this.o.xlog) { v = Math.log10(v); a = Math.log10(a); b = Math.log10(b); }
    let t = (v - a) / (b - a);
    if (this.o.xrev) t = 1 - t;
    return this.L + t * (this.R - this.L);
  }
  Y(v) { const [a, b] = this.o.y; return this.B - (v - a) / (b - a) * (this.B - this.T); }
  invX(px) {
    let t = (px - this.L) / (this.R - this.L);
    if (this.o.xrev) t = 1 - t;
    let [a, b] = this.o.x;
    if (this.o.xlog) return Math.pow(10, Math.log10(a) + t * (Math.log10(b) - Math.log10(a)));
    return a + t * (b - a);
  }
  invY(py) { const [a, b] = this.o.y; return a + (this.B - py) / (this.B - this.T) * (b - a); }
  inside(px, py) { return px >= this.L && px <= this.R && py >= this.T && py <= this.B; }
  axes() {
    const c = this.ctx, th = U.theme(), o = this.o;
    c.save();
    c.font = `500 11px ${U.MONO}`; c.fillStyle = th.ink3; c.strokeStyle = th.line; c.lineWidth = 1;
    let xt = o.xticks || (o.xlog ? (() => { const r = []; for (let e = Math.ceil(Math.log10(o.x[0])); e <= Math.floor(Math.log10(o.x[1])); e++) r.push(Math.pow(10, e)); return r; })() : U.ticks(o.x[0], o.x[1], o.nx || 7));
    const yt = o.yticks || U.ticks(o.y[0], o.y[1], o.ny || 6);
    const xf = o.xfmt || U.tickFmt, yf = o.yfmt || U.tickFmt;
    c.textAlign = 'center'; c.textBaseline = 'top';
    for (const v of xt) {
      const x = this.X(v);
      if (x < this.L - 0.5 || x > this.R + 0.5) continue;
      if (o.grid !== false) { c.beginPath(); c.moveTo(x, this.T); c.lineTo(x, this.B); c.stroke(); }
      c.fillText(xf(v), x, this.B + 6);
    }
    c.textAlign = 'right'; c.textBaseline = 'middle';
    for (const v of yt) {
      const y = this.Y(v);
      if (y < this.T - 0.5 || y > this.B + 0.5) continue;
      if (o.grid !== false) { c.beginPath(); c.moveTo(this.L, y); c.lineTo(this.R, y); c.stroke(); }
      c.fillText(yf(v), this.L - 6, y);
    }
    c.strokeStyle = th.ink3; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(this.L, this.T); c.lineTo(this.L, this.B); c.lineTo(this.R, this.B); c.stroke();
    c.fillStyle = th.ink2; c.font = `600 12px ${U.FONT}`;
    if (o.xlabel) { c.textAlign = 'center'; c.textBaseline = 'bottom'; c.fillText(o.xlabel, (this.L + this.R) / 2, this.h - 3); }
    if (o.ylabel) {
      c.translate(13, (this.T + this.B) / 2); c.rotate(-Math.PI / 2);
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.ylabel, 0, 0);
    }
    c.restore();
  }
  clip(fn) { const c = this.ctx; c.save(); c.beginPath(); c.rect(this.L, this.T - 1, this.R - this.L, this.B - this.T + 2); c.clip(); fn(c); c.restore(); }
  line(pts, color, width = 2.2, dash) {
    this.clip(c => {
      c.strokeStyle = color; c.lineWidth = width; c.lineJoin = 'round'; c.lineCap = 'round';
      if (dash) c.setLineDash(dash);
      c.beginPath();
      let pen = false;
      for (const [x, y] of pts) {
        if (!isFinite(x) || !isFinite(y)) { pen = false; continue; }
        const px = this.X(x), py = this.Y(y);
        if (!pen) { c.moveTo(px, py); pen = true; } else c.lineTo(px, py);
      }
      c.stroke();
    });
  }
  area(pts, color, base) {
    this.clip(c => {
      c.fillStyle = color; c.beginPath();
      const b = base == null ? this.o.y[0] : base;
      const f = pts.filter(p => isFinite(p[0]) && isFinite(p[1]));
      if (!f.length) return;
      c.moveTo(this.X(f[0][0]), this.Y(b));
      for (const [x, y] of f) c.lineTo(this.X(x), this.Y(y));
      c.lineTo(this.X(f[f.length - 1][0]), this.Y(b));
      c.closePath(); c.fill();
    });
  }
  fn(f, color, width, dash, n = 300, x0, x1) {
    const a = x0 == null ? this.o.x[0] : x0, b = x1 == null ? this.o.x[1] : x1, pts = [];
    for (let i = 0; i <= n; i++) {
      const x = this.o.xlog ? Math.pow(10, Math.log10(a) + (Math.log10(b) - Math.log10(a)) * i / n) : a + (b - a) * i / n;
      pts.push([x, f(x)]);
    }
    this.line(pts, color, width, dash);
    return pts;
  }
  dot(x, y, color, r = 5, stroke) {
    const c = this.ctx;
    c.beginPath(); c.arc(this.X(x), this.Y(y), r, 0, Math.PI * 2);
    c.fillStyle = color; c.fill();
    if (stroke !== false) { c.strokeStyle = U.theme().surface; c.lineWidth = 2; c.stroke(); }
  }
  vline(x, color, dash = [5, 4], label) {
    const c = this.ctx, px = this.X(x);
    c.save(); c.strokeStyle = color; c.lineWidth = 1.3; c.setLineDash(dash);
    c.beginPath(); c.moveTo(px, this.T); c.lineTo(px, this.B); c.stroke(); c.restore();
    if (label) U.text(c, label, px + 4, this.T + 12, { color, size: 11, weight: 600 });
  }
  hline(y, color, dash = [5, 4], label, right) {
    const c = this.ctx, py = this.Y(y);
    c.save(); c.strokeStyle = color; c.lineWidth = 1.3; c.setLineDash(dash);
    c.beginPath(); c.moveTo(this.L, py); c.lineTo(this.R, py); c.stroke(); c.restore();
    if (label) U.text(c, label, right ? this.R - 4 : this.L + 4, py - 5, { color, size: 11, weight: 600, align: right ? 'right' : 'left' });
  }
  label(s, x, y, color, o = {}) { U.text(this.ctx, s, this.X(x) + (o.dx || 0), this.Y(y) + (o.dy || 0), Object.assign({ color, size: 11, weight: 600 }, o)); }
}
U.Plot = Plot;

/* ---------------- controls ---------------- */
U.slider = ({ label, min, max, step = 1, value, unit = '', fmt, onInput, id }) => {
  const input = U.h('input', { type: 'range', min, max, step, id: id || null, 'aria-label': label });
  input.value = value;
  const out = U.h('output', { class: 'val' });
  const show = () => { out.textContent = (fmt ? fmt(+input.value) : input.value) + (unit ? ' ' + unit : ''); };
  input.addEventListener('input', () => { show(); onInput && onInput(+input.value); });
  show();
  const el = U.h('label', { class: 'field' }, U.h('span', { class: 'lbl' }, U.h('span', null, label), out), input);
  return { el, input, get value() { return +input.value; }, set(v) { input.value = v; show(); }, refresh: show };
};
/** log-scale slider: value moves between min and max (both > 0) exponentially */
U.logSlider = ({ label, min, max, value, unit = '', fmt, onInput, steps = 400 }) => {
  const lmin = Math.log10(min), lmax = Math.log10(max);
  const toV = p => Math.pow(10, lmin + (lmax - lmin) * p / steps);
  const toP = v => Math.round((Math.log10(v) - lmin) / (lmax - lmin) * steps);
  const s = U.slider({ label, min: 0, max: steps, step: 1, value: toP(value), unit, fmt: p => (fmt || U.sig)(toV(p)), onInput: p => onInput && onInput(toV(p)) });
  return { el: s.el, input: s.input, get value() { return toV(+s.input.value); }, set(v) { s.set(toP(v)); } };
};
U.select = ({ label, options, value, onChange, id }) => {
  const s = U.h('select', { id: id || null, 'aria-label': label || 'choose' });
  const add = (parent, o) => {
    const [v, l] = typeof o === 'object' ? [o.value, o.label] : [o, o];
    parent.appendChild(U.h('option', { value: v }, l));
  };
  for (const o of options) {
    if (o && o.group) { const g = U.h('optgroup', { label: o.group }); o.options.forEach(x => add(g, x)); s.appendChild(g); }
    else add(s, o);
  }
  if (value != null) s.value = value;
  s.addEventListener('change', () => onChange && onChange(s.value));
  const el = label ? U.h('label', { class: 'field' }, U.h('span', { class: 'lbl' }, label), s) : s;
  return { el, input: s, get value() { return s.value; }, set(v) { s.value = v; } };
};
U.seg = ({ options, value, onChange }) => {
  const el = U.h('div', { class: 'seg', role: 'group' });
  let cur = value;
  const btns = options.map(o => {
    const [v, l] = typeof o === 'object' ? [o.value, o.label] : [o, o];
    const b = U.h('button', { type: 'button', html: l });
    b.dataset.v = String(v);
    b.addEventListener('click', () => { set(v); onChange && onChange(v); });
    el.appendChild(b);
    return b;
  });
  const set = v => { cur = v; btns.forEach(b => b.classList.toggle('on', b.dataset.v === String(v))); };
  set(value);
  return { el, get value() { return cur; }, set };
};
U.check = ({ label, checked, onChange }) => {
  const i = U.h('input', { type: 'checkbox', checked: !!checked });
  i.addEventListener('change', () => onChange && onChange(i.checked));
  return { el: U.h('label', { class: 'check' }, i, label), input: i, get value() { return i.checked; } };
};
U.btn = (label, onClick, cls = '') => U.h('button', { type: 'button', class: 'btn ' + cls, onclick: onClick, html: label });
U.numInput = ({ label, value, step = 'any', onInput, min, max }) => {
  const i = U.h('input', { type: 'number', step, min: min ?? null, max: max ?? null });
  i.value = value;
  i.addEventListener('input', () => { const v = parseFloat(i.value); if (isFinite(v)) onInput && onInput(v); });
  return { el: U.h('label', { class: 'field' }, U.h('span', { class: 'lbl' }, label), i), input: i, get value() { return parseFloat(i.value); }, set(v) { i.value = v; } };
};
U.textInput = ({ label, value, placeholder, onInput, onEnter }) => {
  const i = U.h('input', { type: 'text', placeholder: placeholder || '', spellcheck: 'false', autocomplete: 'off' });
  i.value = value || '';
  i.addEventListener('input', () => onInput && onInput(i.value));
  i.addEventListener('keydown', e => { if (e.key === 'Enter' && onEnter) onEnter(i.value); });
  return { el: label ? U.h('label', { class: 'field' }, U.h('span', { class: 'lbl' }, label), i) : i, input: i, get value() { return i.value; }, set(v) { i.value = v; } };
};
U.tabs = (parent, tabs, scope, opts = {}) => {
  const bar = U.h('div', { class: 'tabs', role: 'tablist' });
  const body = U.h('div', { class: 'tab-body' });
  let child = null;
  const btns = tabs.map((t, i) => {
    const b = U.h('button', { type: 'button', role: 'tab', html: t.label });
    b.addEventListener('click', () => show(i));
    bar.appendChild(b);
    return b;
  });
  const show = i => {
    if (child) child.dispose();
    child = scope.child();
    U.clear(body);
    btns.forEach((b, j) => { b.classList.toggle('on', i === j); b.setAttribute('aria-selected', i === j); });
    try { tabs[i].render(body, child); } catch (e) { console.error(e); body.appendChild(U.h('div', { class: 'err' }, 'This panel failed to load: ' + e.message)); }
    if (opts.key) U.store.set('tab:' + opts.key, i);
  };
  parent.append(bar, body);
  let start = opts.initial || 0;
  if (opts.key) { const s = U.store.get('tab:' + opts.key, start); if (s >= 0 && s < tabs.length) start = s; }
  // first paint runs after the caller finishes declaring its helpers
  queueMicrotask(() => { if (!scope.dead) show(start); });
  return { show, bar, body };
};
U.panel = (title, ...kids) => U.h('section', { class: 'panel' }, title ? U.h('h3', { html: title }) : null, ...kids);
U.callout = (html, type = '') => U.h('div', { class: 'callout ' + type, html });
/** live stat tiles: returns {el, set(key, html)} */
U.stats = items => {
  const el = U.h('div', { class: 'stats' });
  const vals = {};
  for (const [key, label] of items) {
    const v = U.h('div', { class: 'v' }, '—');
    vals[key] = v;
    el.appendChild(U.h('div', { class: 'stat' }, U.h('div', { class: 'k', html: label }), v));
  }
  return { el, set(k, html) { if (vals[k]) vals[k].innerHTML = html; } };
};
U.table = (headers, rows, opts = {}) => {
  const t = U.h('table', { class: 'data' + (opts.clickable ? ' clickable' : '') });
  t.appendChild(U.h('thead', null, U.h('tr', null, headers.map(hd => U.h('th', { html: hd })))));
  const tb = U.h('tbody');
  rows.forEach((r, i) => {
    const tr = U.h('tr', { class: opts.hl && opts.hl(i) ? 'hl' : null });
    r.forEach((c, j) => tr.appendChild(U.h('td', { class: opts.num && opts.num.includes(j) ? 'num' : null, html: c == null ? '' : String(c) })));
    if (opts.onClick) tr.addEventListener('click', () => opts.onClick(i));
    tb.appendChild(tr);
  });
  t.appendChild(tb);
  return U.h('div', { class: 'table-wrap' }, t);
};
U.legend = items => U.h('div', { class: 'legend' }, items.map(([c, l]) => U.h('span', null, U.h('i', { style: { background: c } }), U.h('span', { html: l }))));

/* ---------------- formula parsing ---------------- */
/** parse "Ca(OH)2", "CuSO4·5H2O", "Fe2(SO4)3" -> {Ca:1, O:2, H:2}; throws on bad input */
U.parseFormula = str => {
  let s = String(str).replace(/\s+/g, '').replace(/\^?\d*[+\-]$/, '').replace(/\((s|l|g|aq)\)$/i, '');
  const parts = s.split(/[·.*]/);
  const total = {};
  for (let part of parts) {
    let mult = 1;
    const m = part.match(/^(\d+)(.*)$/);
    if (m) { mult = +m[1]; part = m[2]; }
    const counts = parseGroup(part);
    for (const k in counts) total[k] = (total[k] || 0) + counts[k] * mult;
  }
  if (!Object.keys(total).length) throw new Error('Empty formula');
  return total;
  function parseGroup(p) {
    const stack = [{}];
    let i = 0;
    while (i < p.length) {
      const ch = p[i];
      if (ch === '(' || ch === '[') { stack.push({}); i++; }
      else if (ch === ')' || ch === ']') {
        i++;
        let n = ''; while (i < p.length && /\d/.test(p[i])) n += p[i++];
        const top = stack.pop();
        if (!stack.length) throw new Error('Unbalanced parentheses');
        const k = n ? +n : 1;
        for (const e in top) stack[stack.length - 1][e] = (stack[stack.length - 1][e] || 0) + top[e] * k;
      } else if (/[A-Z]/.test(ch)) {
        let sym = ch; i++;
        while (i < p.length && /[a-z]/.test(p[i])) sym += p[i++];
        let n = ''; while (i < p.length && /\d/.test(p[i])) n += p[i++];
        if (!(typeof ELEMENTS !== 'undefined' && ELEMENTS.bySym[sym])) throw new Error('Unknown element "' + sym + '"');
        const cur = stack[stack.length - 1];
        cur[sym] = (cur[sym] || 0) + (n ? +n : 1);
      } else throw new Error('Unexpected "' + ch + '"');
    }
    if (stack.length !== 1) throw new Error('Unbalanced parentheses');
    return stack[0];
  }
};
U.molarMass = formula => {
  const c = U.parseFormula(formula);
  let m = 0;
  for (const k in c) m += ELEMENTS.bySym[k].mass * c[k];
  return m;
};

/* ---------------- constants ---------------- */
const K = { R: 8.314, Rl: 0.08206, NA: 6.022e23, h: 6.626e-34, c: 2.998e8, F: 96485, kB: 1.381e-23, Kw: 1.0e-14 };
