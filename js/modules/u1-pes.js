'use strict';
App.register({
  id: 'pes', unit: 1, sym: 'Ps', title: 'Photoelectron Spectroscopy',
  desc: 'Read PES spectra: peak position shows binding energy, peak height shows how many electrons.',
  tags: ['pes', 'binding energy', 'photoelectron', 'subshell', 'ionization', 'spectrum'],
  keyIdeas: [
    'In PES, high-energy photons eject electrons. Binding energy = photon energy − kinetic energy of the ejected electron.',
    'Each peak is one <b>subshell</b>. Peaks farther left (higher binding energy) are electrons closer to the nucleus.',
    'Relative peak <b>height</b> is proportional to the number of electrons in that subshell (2p<sup>6</sup> is 3× as tall as 2s<sup>2</sup>).',
    'For the same subshell, a larger nuclear charge gives a higher binding energy: the 1s peak shifts left as Z increases.',
  ],
  render(el, scope) {
    const h = U.h;
    const KEYS = ['1s', '2s', '2p', '3s', '3p', '3d', '4s', '4p'];
    const RAW = `1.31|2.37|6.26,0.52|11.5,0.90|19.3,1.36,0.80|28.6,1.72,1.09|39.6,2.45,1.40|52.6,3.12,1.31|67.2,3.88,1.68|84.0,4.68,2.08|104,6.84,3.67,0.50|126,9.07,5.31,0.74|151,12.1,7.19,1.09,0.58|178,15.1,10.3,1.46,0.79|208,18.7,13.5,1.95,1.01|239,22.7,16.5,2.05,1.00|273,26.8,20.2,2.44,1.25|309,31.5,24.1,2.82,1.52|347,37.1,29.1,3.93,2.38,,0.42|390,42.7,34.0,4.65,2.90,,0.59|433,48.5,39.2,5.44,3.24,0.77,0.63|479,54.1,44.7,6.07,3.75,0.86,0.66|527,60.3,50.2,6.7,4.1,0.90,0.65|578,67.1,56.0,7.3,4.5,0.95,0.65|631,74.2,62.4,8.0,4.9,1.00,0.72|686,81.6,69.0,8.8,5.4,1.06,0.76|744,89.3,76.0,9.6,5.9,1.10,0.76|804,97.3,83.3,10.4,6.5,1.15,0.74|866,105.7,91.0,11.6,7.1,1.20,0.75|932,115.2,99.6,13.2,8.4,1.66,0.91|1000,125.2,108.5,15.2,10.3,1.9,1.10,0.58|1071,136.5,118.5,17.4,12.4,2.8,1.37,0.76|1145,147.3,128.6,19.7,14.2,4.0,1.6,0.95|1221,159.6,139.4,22.4,16.2,5.5,1.9,0.94|1300,171.9,150.6,24.8,18.2,6.8,2.3,1.14|1382,185.4,162.6,27.9,21.5,9.1,2.65,1.35`;
    const BE = RAW.split('|').map(r => { const v = r.split(','); const o = {}; v.forEach((x, i) => { if (x !== '') o[KEYS[i]] = +x; }); return o; });
    const spectrum = Z => ELEMENTS.config(Z).map(x => ({ sub: x.sub, e: x.e, be: BE[Z - 1][x.sub] })).filter(p => p.be);

    let Z = U.store.get('pesZ', 11), Z2 = 0, mystery = false, guess = null, hover = null;
    const opts = ELEMENTS.list.slice(0, 36).map(e => ({ value: e.Z, label: `${e.Z} · ${e.name}` }));
    const s1 = U.select({ label: 'Element', options: opts, value: Z, onChange: v => { Z = +v; U.store.set('pesZ', Z); update(); } });
    const s2 = U.select({ label: 'Compare with', options: [{ value: 0, label: 'None' }].concat(opts), value: 0, onChange: v => { Z2 = +v; update(); } });
    const mys = U.check({ label: 'Mystery spectrum (identify the element)', onChange: v => { mystery = v; guess = null; if (v) { Z = U.randInt(3, 36); Z2 = 0; s2.set(0); } update(); } });
    const side = h('div', { class: 'stack' });
    let P = null;
    const cv = U.canvas(null, { aspect: 1.7, scope, draw });
    el.append(h('div', { class: 'grid-viz' },
      U.panel('PES spectrum', cv.wrap, h('p', { class: 'small muted' }, 'Binding energy axis is logarithmic and decreases to the right, the usual AP convention. Hover or tap a peak for details.')),
      h('div', { class: 'stack' }, U.panel('Sample', s1.el, s2.el, mys.el), side)));

    function draw(c, w, H) {
      const t = U.theme();
      const a = spectrum(Z), b = Z2 ? spectrum(Z2) : [];
      const all = a.concat(b);
      const bmax = Math.max(...all.map(p => p.be)), bmin = Math.min(...all.map(p => p.be));
      const emax = Math.max(...all.map(p => p.e));
      const xr = [Math.pow(10, Math.floor(Math.log10(bmin * 0.7) * 2) / 2), Math.pow(10, Math.ceil(Math.log10(bmax * 1.4) * 2) / 2)];
      P = new U.Plot(c, w, H, { x: xr, y: [0, emax * 1.25], xlog: true, xrev: true, xlabel: 'Binding energy (MJ/mol), log scale', ylabel: 'Relative number of electrons', ny: Math.min(8, emax + 2), yfmt: v => Number.isInteger(v) ? String(v) : '' });
      P.axes();
      const drawSet = (set, col, fill, labels) => {
        set.forEach(p => {
          const pts = [];
          for (let i = -40; i <= 40; i++) { const lx = Math.log10(p.be) + i * 0.0012; pts.push([Math.pow(10, lx), p.e * Math.exp(-(i * i) / 120)]); }
          if (fill) P.area(pts, U.alpha(col, 0.25));
          P.line(pts, col, 2.2, fill ? null : [5, 3]);
          if (labels) {
            const hov = hover && hover.p === p;
            P.label((mystery ? '' : '') + p.sub, p.be, p.e, hov ? t.ink : col, { dy: -8, align: 'center', size: 12 });
            P.label(String(p.be), p.be, p.e, t.ink3, { dy: -22, align: 'center', size: 10, mono: true, weight: 500 });
          }
        });
      };
      if (b.length) drawSet(b, t.orange, false, true);
      drawSet(a, t.blue, true, true);
      if (hover) {
        const x = P.X(hover.p.be);
        c.strokeStyle = t.ink3; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(x, P.T); c.lineTo(x, P.B); c.stroke(); c.setLineDash([]);
      }
    }
    s_on();
    function s_on() {
      const pick = pos => {
        if (!P) return;
        const sets = [[spectrum(Z), Z]].concat(Z2 ? [[spectrum(Z2), Z2]] : []);
        let best = null, bd = 1e9;
        sets.forEach(([set, z]) => set.forEach(p => { const d = Math.abs(P.X(p.be) - pos.x); if (d < bd) { bd = d; best = { p, z }; } }));
        hover = bd < 24 ? best : null;
        cv.redraw(); info();
      };
      scope.on(cv.canvas, 'pointermove', e => pick(cv.pos(e)));
      scope.on(cv.canvas, 'pointerdown', e => pick(cv.pos(e)));
    }
    const hoverBox = h('div');
    function info() {
      U.clear(hoverBox);
      if (!hover) { hoverBox.appendChild(U.callout('Hover over a peak to see what it represents.')); return; }
      const p = hover.p, e = ELEMENTS.byZ[hover.z];
      hoverBox.appendChild(U.callout(`<b>${mystery && hover.z === Z ? 'Unknown' : e.name} — ${p.sub} peak</b><br>Binding energy ${p.be} MJ/mol (${(p.be * 1000).toLocaleString()} kJ/mol)<br>${p.e} electron${p.e > 1 ? 's' : ''} in this subshell${p.be < 3 && p === spectrum(hover.z).slice(-1)[0] ? '. These are the valence electrons, the easiest to remove: this peak approximates the first ionization energy.' : '.'}`));
    }
    function update() {
      s1.set(Z); s1.el.hidden = mystery; s2.el.hidden = mystery;
      hover = null;
      cv.redraw();
      U.clear(side);
      side.appendChild(hoverBox); info();
      if (mystery) {
        const ans = U.textInput({ label: 'Element symbol', placeholder: 'e.g. Na', onEnter: v => check(v) });
        const res = h('div');
        const check = v => {
          const ok = v.trim().toLowerCase() === ELEMENTS.byZ[Z].sym.toLowerCase();
          U.clear(res);
          res.appendChild(U.callout(ok ? `Correct! ${ELEMENTS.byZ[Z].name}: ${ELEMENTS.configString(Z)}` : 'Not yet. Count the total electrons: add up the peak heights.', ok ? 'good' : 'bad'));
          if (ok) res.appendChild(U.btn('Next mystery', () => { Z = U.randInt(3, 36); update(); }, 'primary sm'));
        };
        side.appendChild(U.panel('Which element is this?', h('p', { class: 'small' }, 'Tip: total electrons = sum of the relative peak heights. The number of peaks tells you which subshells are occupied.'), ans.el, U.btn('Check', () => check(ans.value), 'primary'), res));
        return;
      }
      const e = ELEMENTS.byZ[Z];
      side.appendChild(U.panel(e.name + ' peaks',
        U.table(['Subshell', 'Binding energy (MJ/mol)', 'Electrons'], spectrum(Z).map(p => [p.sub, p.be, p.e]), { num: [1, 2] }),
        h('div', { class: 'eq', html: ELEMENTS.configString(Z, 0, false) })));
      if (Z2) {
        const a = spectrum(Z), b = spectrum(Z2);
        const e2 = ELEMENTS.byZ[Z2];
        const hi = Z > Z2 ? e : e2;
        side.appendChild(U.callout(`The 1s peak of ${hi.name} (Z = ${hi.Z}) is farther left (${Math.max(a[0].be, b[0].be)} vs ${Math.min(a[0].be, b[0].be)} MJ/mol) because its nucleus has more protons, so it attracts its 1s electrons more strongly.`));
      }
    }
    update();
  },
});
