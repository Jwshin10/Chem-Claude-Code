'use strict';
App.register({
  id: 'collision', unit: 5, sym: 'Co', title: 'Collision Theory & Reaction Rate',
  desc: 'A live particle simulation: change temperature, concentration, activation energy and catalysts and watch the rate respond.',
  tags: ['collision theory', 'reaction rate', 'activation energy', 'orientation', 'catalyst', 'temperature', 'concentration', 'effective collision', 'kinetics'],
  keyIdeas: [
    'Particles must collide with <b>enough energy</b> (≥ E<sub>a</sub>) and the <b>correct orientation</b> to react.',
    'Higher concentration → more collisions per second → faster rate.',
    'Higher temperature → more frequent collisions <i>and</i> a much larger fraction with energy ≥ E<sub>a</sub>.',
    'A catalyst provides a different pathway with a lower activation energy. It is not consumed.',
    'Rate is measured as change in concentration per unit time: rate = −Δ[A]/Δt.',
  ],
  render(el, scope) {
    const h = U.h;
    let T = 400, Ea = 2.2, nA = 30, nB = 30, cat = false, orient = true, running = true;
    const sT = U.slider({ label: 'Temperature', min: 150, max: 800, step: 10, value: T, unit: 'K', onInput: v => { T = v; } });
    const sE = U.slider({ label: 'Activation energy (relative)', min: 0.5, max: 5, step: 0.1, value: Ea, fmt: v => v.toFixed(1), onInput: v => { Ea = v; } });
    const sA = U.slider({ label: 'Starting particles of A', min: 5, max: 60, step: 1, value: nA, onInput: v => { nA = v; } });
    const sB = U.slider({ label: 'Starting particles of B', min: 5, max: 60, step: 1, value: nB, onInput: v => { nB = v; } });
    const cc = U.check({ label: 'Add catalyst (Eₐ × 0.5)', onChange: v => cat = v });
    const co = U.check({ label: 'Require correct orientation', checked: true, onChange: v => orient = v });
    const stats = U.stats([['c', 'Collisions'], ['s', 'Successful'], ['f', 'Success rate'], ['r', 'Current rate']]);
    const box = U.canvas(null, { aspect: 1.5, scope });
    const gr = U.canvas(null, { aspect: 2.4, scope });
    el.append(h('div', { class: 'grid-viz' }, h('div', { class: 'stack' }, U.panel(null, box.wrap, h('div', { class: 'row' }, U.btn('Restart with these settings', () => reset(), 'primary'), U.btn('Pause / play', () => running = !running, ''))), U.panel('Amounts over time', gr.wrap)),
      h('div', { class: 'stack' }, U.panel('Conditions', sT.el, sE.el, sA.el, sB.el, cc.el, co.el), stats.el,
        U.callout('A (blue) + B (red) → AB (purple). Particles that collide too gently, or at the wrong angle, just bounce off. Each successful collision flashes yellow.'))));
    let P = [], hist = [], time = 0, coll = 0, succ = 0, flashes = [], recent = [];
    const speed = () => Math.sqrt(T / 300);
    const thermal = () => { const a = U.rand(0, 6.283); const v = Math.sqrt(-2 * Math.log(Math.random() + 1e-9)) * speed() * 0.55; return [Math.cos(a) * v, Math.sin(a) * v]; };
    function reset() {
      P = []; hist = []; time = 0; coll = 0; succ = 0; flashes = []; recent = [];
      const add = (type, n) => { for (let i = 0; i < n; i++) { const [vx, vy] = thermal(); P.push({ type, x: Math.random(), y: Math.random(), vx, vy, a: U.rand(0, 6.283) }); } };
      add('A', nA); add('B', nB);
    }
    reset();
    scope.loop(dt => {
      const c = box.ctx, w = box.w, H = box.h, t = U.theme();
      if (running) {
        const sub = 3, hstep = dt / sub;
        for (let st = 0; st < sub; st++) {
          time += hstep;
          const ar = w / H;
          P.forEach(p => {
            p.x += p.vx * hstep * 0.25 / ar; p.y += p.vy * hstep * 0.25; p.a += hstep * 2;
            let hit = false;
            if (p.x < 0.02) { p.x = 0.02; p.vx = Math.abs(p.vx); hit = true; } if (p.x > 0.98) { p.x = 0.98; p.vx = -Math.abs(p.vx); hit = true; }
            if (p.y < 0.03) { p.y = 0.03; p.vy = Math.abs(p.vy); hit = true; } if (p.y > 0.97) { p.y = 0.97; p.vy = -Math.abs(p.vy); hit = true; }
            if (hit && Math.random() < 0.3) { const [vx, vy] = thermal(); const sx = Math.sign(p.vx) || 1, sy = Math.sign(p.vy) || 1; p.vx = Math.abs(vx) * sx; p.vy = Math.abs(vy) * sy; }
          });
          const rad = 0.022;
          for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
            const a = P[i], b = P[j];
            const dx = (b.x - a.x) * ar, dy = b.y - a.y, d = Math.hypot(dx, dy);
            if (d > rad * 2 || d === 0) continue;
            const nx = dx / d, ny = dy / d;
            const rv = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
            if (rv <= 0) continue;
            coll++;
            const pair = (a.type === 'A' && b.type === 'B') || (a.type === 'B' && b.type === 'A');
            const e = 0.5 * rv * rv * 4;
            const okOrient = !orient || Math.random() < 0.45;
            if (pair && e > (cat ? Ea * 0.5 : Ea) * 0.35 && okOrient) {
              succ++; recent.push(time);
              a.type = 'AB'; a.x = (a.x + b.x) / 2; a.y = (a.y + b.y) / 2; a.vx = (a.vx + b.vx) / 2; a.vy = (a.vy + b.vy) / 2;
              flashes.push({ x: a.x, y: a.y, t: 0.4 });
              P.splice(j, 1); j--;
              continue;
            }
            a.vx -= rv * nx; a.vy -= rv * ny; b.vx += rv * nx; b.vy += rv * ny;
          }
        }
        if (!hist.length || time - hist[hist.length - 1].t > 0.1) hist.push({ t: time, A: P.filter(p => p.type === 'A').length, AB: P.filter(p => p.type === 'AB').length });
        if (hist.length > 600) hist.shift();
        recent = recent.filter(x => time - x < 3);
      }
      c.clearRect(0, 0, w, H);
      const R = Math.min(w, H) * 0.022;
      flashes = flashes.filter(f => (f.t -= dt) > 0);
      flashes.forEach(f => { c.beginPath(); c.arc(f.x * w, f.y * H, R * 3 * (1 - f.t / 0.4) + R, 0, 7); c.fillStyle = U.alpha(t.yellow, f.t / 0.4 * 0.7); c.fill(); });
      P.forEach(p => {
        const x = p.x * w, y = p.y * H;
        if (p.type === 'AB') {
          const dx = Math.cos(p.a) * R * 0.7, dy = Math.sin(p.a) * R * 0.7;
          U.drawAtom(c, x - dx, y - dy, R, 'X', { color: t.blue, label: false }); U.drawAtom(c, x + dx, y + dy, R, 'X', { color: t.red, label: false });
        } else {
          U.drawAtom(c, x, y, R, 'X', { color: p.type === 'A' ? t.blue : t.red, label: false });
          if (orient) { c.beginPath(); c.arc(x + Math.cos(p.a) * R * 0.6, y + Math.sin(p.a) * R * 0.6, R * 0.32, 0, 7); c.fillStyle = 'rgba(255,255,255,.75)'; c.fill(); }
        }
      });
      stats.set('c', coll); stats.set('s', succ); stats.set('f', coll ? (succ / coll * 100).toFixed(1) + '%' : '—'); stats.set('r', (recent.length / 3).toFixed(1) + ' /s');
      // graph
      const g = gr.ctx;
      g.clearRect(0, 0, gr.w, gr.h);
      const t0 = hist.length ? hist[0].t : 0, t1 = Math.max(t0 + 10, hist.length ? hist[hist.length - 1].t : 10);
      const Pl = new U.Plot(g, gr.w, gr.h, { x: [t0, t1], y: [0, Math.max(nA, nB, 10) * 1.05], xlabel: 'Time (s)', ylabel: 'Particles', pad: { b: 38 } });
      Pl.axes();
      Pl.line(hist.map(q => [q.t, q.A]), t.blue, 2.2);
      Pl.line(hist.map(q => [q.t, q.AB]), t.purple, 2.2);
      U.text(g, '● A remaining', Pl.R - 120, Pl.T + 14, { color: t.blue, size: 11, weight: 600 });
      U.text(g, '● AB formed', Pl.R - 120, Pl.T + 30, { color: t.purple, size: 11, weight: 600 });
    });
  },
});
