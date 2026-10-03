'use strict';
App.register({
  id: 'solutions', unit: 3, sym: 'Sn', title: 'Solutions & Separations',
  desc: 'Watch salt dissolve, explore molarity and dilution, test “like dissolves like”, and run paper chromatography.',
  tags: ['solution', 'solubility', 'dissolving', 'hydration', 'molarity', 'dilution', 'like dissolves like', 'chromatography', 'rf', 'distillation', 'separation', 'mixture'],
  keyIdeas: [
    'Molarity M = moles of solute / liters of solution. Dilution: M<sub>1</sub>V<sub>1</sub> = M<sub>2</sub>V<sub>2</sub> (moles of solute stay the same).',
    '“Like dissolves like”: solutes dissolve best in solvents with similar intermolecular forces (polar/ionic in water, nonpolar in nonpolar solvents).',
    'Ionic solids dissolve when ion–dipole attractions to water can overcome the lattice’s attractions.',
    'Chromatography separates substances by how strongly they interact with the mobile vs. stationary phase. R<sub>f</sub> = distance traveled by spot / distance traveled by solvent.',
    'Distillation separates liquids by differences in boiling point, which come from differences in IMF strength.',
  ],
  render(el, scope) {
    const h = U.h;
    U.tabs(el, [{ label: 'Dissolving', render: dissolve }, { label: 'Molarity & dilution', render: molarity }, { label: 'Like dissolves like', render: like }, { label: 'Chromatography', render: chroma }], scope, { key: 'solutions' });

    function dissolve(b, s) {
      let ions = [], temp = 25;
      const reset = () => {
        ions = [];
        for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) ions.push({ gx: i, gy: j, plus: (i + j) % 2 === 0, free: false, x: 0, y: 0, vx: 0, vy: 0, t: 0 });
      };
      reset();
      const sT = U.slider({ label: 'Temperature', min: 5, max: 95, step: 1, value: temp, unit: '°C', onInput: v => temp = v });
      const cv = U.canvas(null, { aspect: 1.5, scope: s });
      b.append(h('div', { class: 'grid-viz' }, U.panel('NaCl dissolving in water', cv.wrap, h('div', { class: 'row' }, U.btn('Add new crystal', reset, 'sm primary'))),
        h('div', { class: 'stack' }, U.panel('Settings', sT.el), U.callout('Water molecules orient around each ion: the partially negative O faces Na<sup>+</sup>, and the partially positive H atoms face Cl<sup>−</sup>. When these ion–dipole attractions are strong enough, ions leave the lattice as <b>hydrated ions</b>.'),
          h('div', { class: 'eq' }, 'NaCl(s) → Na⁺(aq) + Cl⁻(aq)'))));
      s.loop((dt, time) => {
        const c = cv.ctx, w = cv.w, H = cv.h, t = U.theme();
        c.clearRect(0, 0, w, H);
        c.fillStyle = U.alpha(t.blue, 0.08); c.fillRect(0, 0, w, H);
        const S = Math.min(w, H) / 16, x0 = w / 2 - 3 * S * 1.1, y0 = H - S * 1.2;
        // background water
        for (let k = 0; k < 26; k++) {
          const x = (k * 137.1 + time * 0.012 * (1 + k % 3)) % w, y = (k * 71.9 + Math.sin(time / 900 + k) * 12) % (H * 0.7);
          drawW(c, x, y, k + time / 1500, S * 0.85, 0.5);
        }
        // release ions from exposed lattice positions
        const rate = 0.25 + temp / 60;
        if (Math.random() < dt * rate) {
          const bound = ions.filter(io => !io.free);
          const exposed = bound.filter(io => !bound.some(o => o.gx === io.gx && o.gy === io.gy + 1) || io.gx === 0 || io.gx === 5 || !bound.some(o => o.gx === io.gx - 1 && o.gy === io.gy) || !bound.some(o => o.gx === io.gx + 1 && o.gy === io.gy));
          const top = exposed.sort((a, b2) => b2.gy - a.gy)[0];
          if (top) { top.free = true; top.x = x0 + top.gx * S * 1.1; top.y = y0 - top.gy * S * 1.1; top.vx = U.rand(-1, 1) * S; top.vy = -S * U.rand(0.5, 1.4); }
        }
        ions.forEach((io, k) => {
          let x, y;
          if (!io.free) { x = x0 + io.gx * S * 1.1; y = y0 - io.gy * S * 1.1; }
          else {
            io.t += dt;
            io.x += io.vx * dt * (0.6 + temp / 80); io.y += io.vy * dt * (0.6 + temp / 80);
            io.vx += U.rand(-1, 1) * S * dt * 3; io.vy += U.rand(-1, 1) * S * dt * 3;
            if (io.x < S || io.x > w - S) io.vx *= -1; if (io.y < S || io.y > H - S * 2) io.vy *= -1;
            io.x = U.clamp(io.x, S, w - S); io.y = U.clamp(io.y, S, H - S * 2);
            x = io.x; y = io.y;
            const shell = Math.min(4, Math.floor(io.t * 3));
            for (let m = 0; m < shell; m++) {
              const a = m / 4 * Math.PI * 2 + time / 2000 + k, r = S * 1.25;
              const wx = x + Math.cos(a) * r, wy = y + Math.sin(a) * r;
              drawW(c, wx, wy, io.plus ? a : a + Math.PI - 0.912, S * 0.85, 1);
            }
          }
          U.drawAtom(c, x, y, io.plus ? S * 0.42 : S * 0.58, io.plus ? 'Na' : 'Cl', { label: io.plus ? '+' : '−' });
        });
      });
      function drawW(c, x, y, th, S2, a) {
        [th + 0.912, th - 0.912].forEach(q => U.drawAtom(c, x + Math.cos(q) * S2 * 0.45, y + Math.sin(q) * S2 * 0.45, S2 * 0.17, 'H', { label: false, alpha: a }));
        U.drawAtom(c, x, y, S2 * 0.27, 'O', { label: false, alpha: a });
      }
    }

    function molarity(b, s) {
      let mol = 0.25, V = 0.5, V2 = 1.0;
      const sm = U.slider({ label: 'Moles of CuSO₄', min: 0.05, max: 1, step: 0.05, value: mol, unit: 'mol', fmt: v => v.toFixed(2), onInput: v => { mol = v; upd(); } });
      const sv = U.slider({ label: 'Volume of solution', min: 0.1, max: 1, step: 0.05, value: V, unit: 'L', fmt: v => v.toFixed(2), onInput: v => { V = v; if (V2 < V) { V2 = V; sv2.set(V2); } upd(); } });
      const sv2 = U.slider({ label: 'Dilute to final volume', min: 0.1, max: 2, step: 0.05, value: V2, unit: 'L', fmt: v => v.toFixed(2), onInput: v => { V2 = Math.max(v, V); sv2.set(V2); upd(); } });
      const out = h('div', { class: 'stack' });
      const cv = U.canvas(null, { aspect: 1.8, scope: s, draw });
      b.append(h('div', { class: 'grid-viz' }, U.panel('Before and after dilution', cv.wrap), h('div', { class: 'stack' }, U.panel('Make a solution', sm.el, sv.el, sv2.el), out)));
      function beaker(c, x, y, w, H, vol, M, label) {
        const t = U.theme(), fill = H * vol / 2;
        const col = U.alpha('#1f7ae0', U.clamp(M / 2.2, 0.06, 0.85));
        c.fillStyle = col; c.fillRect(x, y + H - fill, w, fill);
        c.strokeStyle = t.ink2; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + H); c.lineTo(x + w, y + H); c.lineTo(x + w, y); c.stroke();
        const n = Math.round(mol * 40);
        for (let i = 0; i < n; i++) {
          const px = x + 6 + U.hx(i) * (w - 12), py = y + H - 6 - U.hy(i) * (fill - 12);
          c.beginPath(); c.arc(px, py, 3, 0, 7); c.fillStyle = t.dark ? '#cfe3ff' : '#0b3f8c'; c.fill();
        }
        U.text(c, label, x + w / 2, y + H + 18, { align: 'center', weight: 600, size: 12 });
        U.text(c, M.toFixed(3) + ' M', x + w / 2, y + H + 34, { align: 'center', mono: true, size: 12, color: t.ink2 });
      }
      function draw(c, w, H) {
        const bw = w * 0.3, bh = H * 0.7;
        beaker(c, w * 0.1, 10, bw, bh, V, mol / V, 'Original');
        U.arrow(c, w * 0.44, H * 0.45, w * 0.55, H * 0.45, U.theme().ink3, 2.5);
        U.text(c, '+ water', w * 0.495, H * 0.45 - 10, { align: 'center', size: 11, color: U.theme().ink3 });
        beaker(c, w * 0.6, 10, bw, bh, V2, mol / V2, 'Diluted');
      }
      function upd() {
        cv.redraw();
        U.clear(out);
        out.append(h('div', { class: 'eq', html: `M = n / V = ${mol.toFixed(2)} mol / ${V.toFixed(2)} L = <b>${(mol / V).toFixed(3)} M</b>` }),
          h('div', { class: 'eq', html: `M₁V₁ = M₂V₂ → (${(mol / V).toFixed(3)})(${V.toFixed(2)}) = M₂(${V2.toFixed(2)}) → <b>M₂ = ${(mol / V2).toFixed(3)} M</b>` }),
          U.callout('Adding water spreads the same number of solute particles through a larger volume. The moles of solute do not change, so the color (and concentration) fades.'));
      }
      upd();
    }

    function like(b) {
      const SOLUTES = [['NaCl', 'ionic'], ['C12H22O11', 'polar, many –OH (sucrose)'], ['CH3CH2OH', 'polar, H-bonding (ethanol)'], ['I2', 'nonpolar'], ['C8H18', 'nonpolar (octane, like gasoline)'], ['CH3COCH3', 'polar aprotic (acetone)']];
      const SOLV = [['H2O', 'polar, H-bonding'], ['C6H14', 'nonpolar (hexane)']];
      const ANS = {
        'NaCl|H2O': [1, 'Ion–dipole attractions between ions and water outweigh the lattice energy.'], 'NaCl|C6H14': [0, 'Hexane cannot interact with ions, so nothing can pay back the lattice energy.'],
        'C12H22O11|H2O': [1, 'Sucrose’s many –OH groups hydrogen bond with water.'], 'C12H22O11|C6H14': [0, 'Breaking sucrose’s hydrogen bonds is not repaid by weak LDFs with hexane.'],
        'CH3CH2OH|H2O': [1, 'Ethanol and water hydrogen bond with each other; they mix in all proportions.'], 'CH3CH2OH|C6H14': [1, 'Ethanol’s ethyl group gives it enough nonpolar character to mix with hexane too.'],
        'I2|H2O': [0, 'Only slightly soluble: water’s hydrogen bonds would be broken without strong new attractions.'], 'I2|C6H14': [1, 'Both nonpolar: LDFs between I₂ and hexane are similar to those they replace.'],
        'C8H18|H2O': [0, 'Oil and water separate. Water molecules stay hydrogen bonded to each other.'], 'C8H18|C6H14': [1, 'Two nonpolar hydrocarbons mix freely through LDFs.'],
        'CH3COCH3|H2O': [1, 'Acetone’s O atom accepts hydrogen bonds from water.'], 'CH3COCH3|C6H14': [1, 'Acetone is moderately polar and also dissolves in many nonpolar solvents.'],
      };
      const out = h('div');
      const grid = h('div', { class: 'table-wrap' });
      const t = h('table', { class: 'data clickable' });
      t.appendChild(h('thead', null, h('tr', null, h('th', null, 'Solute ↓ / Solvent →'), SOLV.map(([f, d]) => h('th', { html: U.chem(f) + '<br><span class="tiny muted">' + d + '</span>' })))));
      const tb = h('tbody');
      SOLUTES.forEach(([f, d]) => {
        const tr = h('tr', null, h('td', { html: U.chem(f) + '<br><span class="tiny muted">' + d + '</span>' }));
        SOLV.forEach(([sv]) => {
          const [ok, why] = ANS[f + '|' + sv];
          const td = h('td', { html: ok ? '<span class="chip" style="background:color-mix(in srgb,var(--good) 20%,var(--surface))">dissolves</span>' : '<span class="chip" style="background:color-mix(in srgb,var(--bad) 18%,var(--surface))">does not dissolve</span>' });
          td.addEventListener('click', () => { U.clear(out); out.appendChild(U.callout(`<b>${U.chem(f)} in ${U.chem(sv)}:</b> ${why}`, ok ? 'good' : 'bad')); });
          tr.appendChild(td);
        });
        tb.appendChild(tr);
      });
      t.appendChild(tb); grid.appendChild(t);
      out.appendChild(U.callout('Click any cell to see why.'));
      b.append(U.panel('Solubility matrix', grid, out));
    }

    function chroma(b, s) {
      const DYES = [['Blue dye', '#2f6fe0', 0.85], ['Yellow dye', '#e6b800', 0.25], ['Red dye', '#e0413b', 0.55], ['Green dye', '#22a25a', 0.7]];
      let pol = 0.8, run = 0, running = false;
      const sp = U.slider({ label: 'Mobile phase polarity', min: 0, max: 1, step: 0.05, value: pol, fmt: v => v < 0.3 ? 'nonpolar' : v > 0.7 ? 'polar (water)' : 'medium', onInput: v => { pol = v; run = 0; running = false; } });
      const btn = U.btn('▶ Run chromatogram', () => { run = 0; running = true; }, 'primary');
      const out = h('div');
      const cv = U.canvas(null, { aspect: 1.25, scope: s });
      b.append(h('div', { class: 'grid-viz' }, U.panel('Paper chromatography', cv.wrap), h('div', { class: 'stack' }, U.panel('Settings', sp.el, btn,
        h('p', { class: 'small muted' }, 'The paper (stationary phase) is polar cellulose. Each dye has a different polarity (shown by its number).')), out)));
      const rf = d => U.clamp(0.08 + 0.85 * (1 - Math.abs(d[2] - pol)) ** 2.2, 0.03, 0.95);
      s.loop(dt => {
        if (running) { run = Math.min(1, run + dt * 0.18); if (run >= 1) { running = false; table(); } }
        const c = cv.ctx, w = cv.w, H = cv.h, t = U.theme();
        c.clearRect(0, 0, w, H);
        const px = w * 0.2, pw = w * 0.6, top = 20, bot = H - 30, base = bot - 30;
        c.fillStyle = t.dark ? '#d8d2c4' : '#fbf8f0'; c.fillRect(px, top, pw, bot - top);
        c.strokeStyle = t.ink3; c.strokeRect(px, top, pw, bot - top);
        c.fillStyle = U.alpha(t.blue, 0.18); c.fillRect(px - 20, bot - 12, pw + 40, 24);
        const front = base - (base - top - 20) * run;
        c.fillStyle = U.alpha(t.blue, 0.12); c.fillRect(px, front, pw, bot - front);
        c.strokeStyle = t.blue; c.setLineDash([5, 4]); c.beginPath(); c.moveTo(px, front); c.lineTo(px + pw, front); c.stroke(); c.setLineDash([]);
        c.strokeStyle = t.ink3; c.beginPath(); c.moveTo(px, base); c.lineTo(px + pw, base); c.stroke();
        U.text(c, 'solvent front', px + pw + 6, front + 4, { size: 10, color: t.blue });
        U.text(c, 'start line', px + pw + 6, base + 4, { size: 10, color: t.ink3 });
        DYES.forEach((d, i) => {
          const x = px + pw * (i + 0.5) / DYES.length;
          const y = base - (base - front) * rf(d);
          const spread = 4 + 10 * run * rf(d);
          c.fillStyle = U.alpha(d[1], 0.85); c.beginPath(); c.ellipse(x, y, 9, spread / 1.4 + 4, 0, 0, 7); c.fill();
          U.text(c, d[2].toFixed(2), x, bot + 22, { align: 'center', size: 10, mono: true, color: t.ink3 });
        });
      });
      function table() {
        U.clear(out);
        out.append(U.table(['Dye', 'Polarity', 'R<sub>f</sub>'], DYES.map(d => [d[0], d[2], rf(d).toFixed(2)]), { num: [1, 2] }),
          U.callout('Dyes with polarity similar to the mobile phase are carried farther (higher R<sub>f</sub>). Dyes that interact more with the stationary phase stay near the start line.'));
      }
      out.appendChild(U.callout('Press Run to develop the chromatogram, then try a nonpolar mobile phase.'));
    }
  },
});
