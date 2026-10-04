'use strict';
App.register({
  id: 'spectroscopy', unit: 3, sym: 'Sp', title: 'Light, Spectroscopy & Beer’s Law',
  desc: 'Explore the electromagnetic spectrum, the photoelectric effect, and absorbance with the Beer–Lambert law.',
  tags: ['electromagnetic spectrum', 'wavelength', 'frequency', 'photon energy', 'e=hv', 'photoelectric effect', 'work function', 'beer-lambert', 'absorbance', 'spectrophotometry', 'calibration curve', 'infrared', 'ultraviolet'],
  keyIdeas: [
    '<b>c = λν</b> and <b>E = hν</b>: shorter wavelength → higher frequency → more energy per photon.',
    'Microwaves change molecular <b>rotation</b>, infrared changes <b>vibration</b>, and UV/visible light causes <b>electronic transitions</b>.',
    'Photoelectric effect: light ejects electrons only if each photon’s energy exceeds the metal’s work function. Brighter light means more photons, not more energy per photon.',
    'Beer–Lambert law: <b>A = εbc</b>. Absorbance is proportional to concentration, so a calibration curve finds unknown concentrations.',
    'Choose the wavelength of maximum absorbance (λ<sub>max</sub>) for the most sensitive measurement.',
  ],
  render(el, scope) {
    const h = U.h;
    U.tabs(el, [{ label: 'EM spectrum', render: em }, { label: 'Photoelectric effect', render: photo }, { label: 'Beer–Lambert law', render: beer }], scope, { key: 'spectro' });

    function visColor(nm) {
      let r = 0, g = 0, b2 = 0;
      if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b2 = 1; } else if (nm < 490) { g = (nm - 440) / 50; b2 = 1; } else if (nm < 510) { g = 1; b2 = -(nm - 510) / 20; }
      else if (nm < 580) { r = (nm - 510) / 70; g = 1; } else if (nm < 645) { r = 1; g = -(nm - 645) / 65; } else if (nm <= 750) { r = 1; }
      return U.rgb(r * 255, g * 255, b2 * 255);
    }

    function em(b, s) {
      let lg = Math.log10(500e-9);
      const REG = [[-14, -11, 'Gamma rays', 'Nuclear transitions'], [-11, -8, 'X-rays', 'Removes core (inner-shell) electrons'], [-8, Math.log10(380e-9), 'Ultraviolet', 'Electronic transitions; can break bonds'],
        [Math.log10(380e-9), Math.log10(750e-9), 'Visible', 'Electronic transitions of valence electrons'], [Math.log10(750e-9), -3, 'Infrared', 'Molecular vibrations (bond stretching and bending)'],
        [-3, -1, 'Microwave', 'Molecular rotations'], [-1, 3, 'Radio', 'Nuclear spin flips (NMR / MRI)']];
      const sl = U.slider({ label: 'Wavelength (log scale)', min: -13, max: 2, step: 0.01, value: lg, fmt: v => { const m = Math.pow(10, v); return m < 1e-6 ? U.sig(m * 1e9, 3) + ' nm' : m < 1e-3 ? U.sig(m * 1e6, 3) + ' µm' : U.sig(m, 3) + ' m'; }, onInput: v => { lg = v; upd(); } });
      const presets = h('div', { class: 'row' }, [['Red light 700 nm', 700e-9], ['Green 530 nm', 530e-9], ['UV 250 nm', 250e-9], ['IR 10 µm', 10e-6], ['Microwave 12 cm', 0.12], ['X-ray 0.1 nm', 0.1e-9]].map(([n, v]) => U.btn(n, () => { lg = Math.log10(v); sl.set(lg); upd(); }, 'sm')));
      const stats = U.stats([['l', 'Wavelength λ'], ['f', 'Frequency ν = c/λ'], ['e', 'Photon energy E = hν'], ['m', 'Energy per mole']]);
      const reg = h('div');
      const bar = U.canvas(null, { height: 90, scope: s, draw: drawBar });
      const wave = U.canvas(null, { height: 120, scope: s });
      b.append(U.panel(null, bar.wrap, sl.el, presets), h('div', { class: 'grid-viz' }, U.panel('The wave', wave.wrap, stats.el), reg));
      function drawBar(c, w, H) {
        const t = U.theme(), L = 10, R = w - 10, X = v => L + (v - (-14)) / (3 - (-14)) * (R - L);
        REG.forEach(([a, z, n], i) => {
          const x0 = X(a), x1 = X(z);
          if (n === 'Visible') { const g = c.createLinearGradient(x0, 0, x1, 0); [380, 440, 490, 530, 580, 620, 700].forEach(nm => g.addColorStop((Math.log10(nm * 1e-9) - a) / (z - a), visColor(nm))); c.fillStyle = g; }
          else c.fillStyle = U.alpha(t.ink3, 0.12 + (i % 2) * 0.1);
          c.fillRect(x0, 22, x1 - x0, 30);
          if (n !== 'Visible') U.text(c, n, (x0 + x1) / 2, 41, { align: 'center', size: 10.5, weight: 600, color: t.ink2 });
        });
        const x = X(lg);
        c.fillStyle = t.ink; c.beginPath(); c.moveTo(x, 20); c.lineTo(x - 7, 8); c.lineTo(x + 7, 8); c.closePath(); c.fill();
        c.fillRect(x - 1, 20, 2, 34);
        U.text(c, '← higher energy, shorter λ', L, 72, { size: 11, color: t.ink3 });
        U.text(c, 'lower energy, longer λ →', R, 72, { size: 11, color: t.ink3, align: 'right' });
      }
      s.loop((dt, time) => {
        const c = wave.ctx, w = wave.w, H = wave.h, t = U.theme();
        c.clearRect(0, 0, w, H);
        const nm = Math.pow(10, lg) * 1e9;
        const col = nm >= 380 && nm <= 750 ? visColor(nm) : t.accent;
        const cycles = U.clamp(2 + (Math.log10(1e-6) - lg) * 2.4, 0.6, 30);
        c.strokeStyle = col; c.lineWidth = 2.5; c.beginPath();
        for (let x = 0; x <= w; x += 2) { const y = H / 2 + Math.sin((x / w) * cycles * 2 * Math.PI - time / 300) * H * 0.32; x ? c.lineTo(x, y) : c.moveTo(x, y); }
        c.stroke();
      });
      function upd() {
        const lam = Math.pow(10, lg), nu = K.c / lam, E = K.h * nu;
        stats.set('l', U.sig(lam, 3) + ' m'); stats.set('f', U.sig(nu, 3) + ' s⁻¹'); stats.set('e', U.sig(E, 3) + ' J'); stats.set('m', U.sig(E * K.NA / 1000, 3) + ' kJ/mol');
        const r = REG.find(([a, z]) => lg >= a && lg < z) || REG[REG.length - 1];
        U.clear(reg);
        reg.append(U.panel(r[2], h('p', null, 'What this light does to matter: ', h('b', null, r[3] + '.')),
          h('div', { class: 'eq wrap', html: `ν = c/λ = (2.998×10⁸ m/s) / (${U.sig(lam, 3)} m) = ${U.sig(nu, 3)} s⁻¹<br>E = hν = (6.626×10⁻³⁴ J·s)(${U.sig(nu, 3)} s⁻¹) = ${U.sig(E, 3)} J` }),
          U.callout(E * K.NA / 1000 > 350 ? 'Photons this energetic (above ~350 kJ/mol) can break typical covalent bonds.' : 'These photons do not have enough energy to break typical covalent bonds.', E * K.NA / 1000 > 350 ? 'warn' : '')));
        bar.redraw();
      }
      upd();
    }

    function photo(b, s) {
      const METALS = { Cs: 2.14, K: 2.30, Na: 2.36, Ca: 2.87, Mg: 3.66, Zn: 4.33, Cu: 4.70, Pt: 5.65 };
      let metal = 'Na', nm = 450, inten = 0.6;
      const sm = U.select({ label: 'Metal', options: Object.keys(METALS).map(k => ({ value: k, label: `${ELEMENTS.bySym[k].name} (work function ${METALS[k]} eV)` })), value: metal, onChange: v => { metal = v; upd(); } });
      const sw = U.slider({ label: 'Wavelength', min: 150, max: 750, step: 5, value: nm, unit: 'nm', onInput: v => { nm = v; upd(); } });
      const si = U.slider({ label: 'Intensity (brightness)', min: 0.1, max: 1, step: 0.05, value: inten, fmt: v => Math.round(v * 100) + '%', onInput: v => { inten = v; upd(); } });
      const stats = U.stats([['e', 'Photon energy'], ['w', 'Work function'], ['k', 'Max KE of e⁻']]);
      const msg = h('div');
      const cv = U.canvas(null, { aspect: 1.6, scope: s });
      b.append(h('div', { class: 'grid-viz' }, U.panel(null, cv.wrap), h('div', { class: 'stack' }, U.panel('Settings', sm.el, sw.el, si.el), stats.el, msg)));
      const photons = [], electrons = [];
      let acc = 0;
      s.loop(dt => {
        const c = cv.ctx, w = cv.w, H = cv.h, t = U.theme();
        c.clearRect(0, 0, w, H);
        const Ep = 1240 / nm, ke = Ep - METALS[metal];
        const plateX = w * 0.62;
        c.fillStyle = U.CPK[metal] || t.gray; c.fillRect(plateX, H * 0.15, 16, H * 0.7);
        U.text(c, metal, plateX + 8, H * 0.12, { align: 'center', weight: 700 });
        const col = nm >= 380 ? visColor(nm) : t.purple;
        acc += dt * 26 * inten;
        while (acc > 1) { acc--; photons.push({ x: 0, y: H * U.rand(0.2, 0.8) }); }
        for (let i = photons.length - 1; i >= 0; i--) {
          const p = photons[i]; p.x += dt * w * 0.7;
          c.strokeStyle = col; c.lineWidth = 2; c.beginPath();
          for (let k = 0; k < 18; k++) { const xx = p.x - k * 1.6, yy = p.y + Math.sin((p.x - k * 1.6) / (nm / 120)) * 4; k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
          c.stroke();
          if (p.x >= plateX) { photons.splice(i, 1); if (ke > 0) electrons.push({ x: plateX + 16, y: p.y, vx: 40 + Math.sqrt(ke) * 140 * U.rand(0.5, 1), vy: U.rand(-30, 30) }); }
        }
        for (let i = electrons.length - 1; i >= 0; i--) {
          const e = electrons[i]; e.x += e.vx * dt; e.y += e.vy * dt;
          if (e.x > w + 10) { electrons.splice(i, 1); continue; }
          c.beginPath(); c.arc(e.x, e.y, 4, 0, 7); c.fillStyle = t.blue; c.fill();
          U.text(c, '−', e.x, e.y + 3, { align: 'center', size: 8, color: '#fff', weight: 700 });
        }
        U.text(c, 'light →', 10, 18, { color: t.ink3, size: 11 });
        U.text(c, ke > 0 ? 'electrons ejected →' : 'no electrons ejected', w - 10, 18, { color: ke > 0 ? t.blue : t.bad, size: 11, align: 'right', weight: 600 });
      });
      function upd() {
        const Ep = 1240 / nm, ke = Ep - METALS[metal];
        stats.set('e', Ep.toFixed(2) + ' eV'); stats.set('w', METALS[metal] + ' eV'); stats.set('k', ke > 0 ? ke.toFixed(2) + ' eV' : '0');
        U.clear(msg);
        msg.appendChild(ke > 0 ? U.callout(`Each photon carries ${Ep.toFixed(2)} eV, more than the ${METALS[metal]} eV needed to free an electron. The extra ${ke.toFixed(2)} eV becomes kinetic energy. Brighter light ejects <b>more</b> electrons, but not faster ones.`, 'good')
          : U.callout(`Each photon carries only ${Ep.toFixed(2)} eV, less than the work function (${METALS[metal]} eV). No electrons are ejected, no matter how bright the light. Energy comes in individual photons.`, 'bad'));
      }
      upd();
    }

    function beer(b, s) {
      let eps = 120, path = 1, conc = 0.004, unknownA = 0.62;
      const se = U.slider({ label: 'Molar absorptivity ε', min: 20, max: 300, step: 5, value: eps, unit: 'M⁻¹cm⁻¹', onInput: v => { eps = v; upd(); } });
      const sb = U.slider({ label: 'Path length b', min: 0.5, max: 2, step: 0.1, value: path, unit: 'cm', fmt: v => v.toFixed(1), onInput: v => { path = v; upd(); } });
      const sc = U.slider({ label: 'Concentration c', min: 0, max: 0.01, step: 0.0002, value: conc, unit: 'M', fmt: v => v.toFixed(4), onInput: v => { conc = v; upd(); } });
      const su = U.slider({ label: 'Absorbance of unknown sample', min: 0.05, max: 1.5, step: 0.01, value: unknownA, fmt: v => v.toFixed(2), onInput: v => { unknownA = v; upd(); } });
      const stats = U.stats([['a', 'Absorbance A = εbc'], ['t', '% Transmittance'], ['u', 'Unknown concentration']]);
      const cuv = U.canvas(null, { aspect: 2.2, scope: s, draw: drawCuvette });
      const cal = U.canvas(null, { aspect: 1.5, scope: s, draw: drawCal });
      b.append(h('div', { class: 'grid-viz' }, h('div', { class: 'stack' }, U.panel('Spectrophotometer', cuv.wrap), U.panel('Calibration curve', cal.wrap)),
        h('div', { class: 'stack' }, U.panel('Settings', se.el, sb.el, sc.el, su.el), stats.el,
          U.callout('Standards of known concentration give a straight line through the origin with slope εb. Read the unknown’s concentration where its absorbance meets the line.'))));
      function drawCuvette(c, w, H) {
        const t = U.theme(), A = eps * path * conc, T = Math.pow(10, -A);
        const cx = w / 2, cw = 50 + path * 30, ch = H * 0.7, y = H * 0.15;
        c.fillStyle = U.alpha('#7a2bd6', U.clamp(A / 1.6, 0.03, 0.8)); c.fillRect(cx - cw / 2, y, cw, ch);
        c.strokeStyle = t.ink2; c.lineWidth = 2; c.strokeRect(cx - cw / 2, y, cw, ch);
        const by = y + ch / 2;
        c.fillStyle = U.alpha('#f5c400', 0.9); c.fillRect(20, by - 8, cx - cw / 2 - 20, 16);
        c.fillStyle = U.alpha('#f5c400', 0.9 * T); c.fillRect(cx + cw / 2, by - 8, w - 60 - cx - cw / 2, 16);
        U.text(c, 'I₀ (100%)', 22, by - 14, { size: 11, color: t.ink2 });
        U.text(c, 'I (' + (T * 100).toFixed(1) + '%)', w - 60, by - 14, { size: 11, color: t.ink2, align: 'right' });
        c.fillStyle = t.ink3; c.fillRect(w - 52, by - 20, 30, 40); U.text(c, 'detector', w - 37, by + 34, { size: 10, align: 'center', color: t.ink3 });
        U.text(c, 'b = ' + path.toFixed(1) + ' cm', cx, y + ch + 16, { align: 'center', size: 11, mono: true });
      }
      function drawCal(c, w, H) {
        const t = U.theme(), slope = eps * path;
        const P = new U.Plot(c, w, H, { x: [0, 0.01], y: [0, Math.max(1.6, slope * 0.01 * 1.05)], xlabel: 'Concentration (M)', ylabel: 'Absorbance' });
        P.axes();
        P.fn(x => slope * x, t.accent, 2);
        [0.002, 0.004, 0.006, 0.008].forEach(x => P.dot(x, slope * x, t.blue, 5));
        const cu = unknownA / slope;
        P.hline(unknownA, t.orange, [4, 4], 'unknown A = ' + unknownA.toFixed(2));
        if (cu <= 0.01) { P.vline(cu, t.orange, [4, 4]); P.dot(cu, unknownA, t.orange, 6); }
        P.dot(conc, slope * conc, t.purple, 6);
      }
      function upd() {
        const A = eps * path * conc;
        stats.set('a', A.toFixed(3)); stats.set('t', (Math.pow(10, -A) * 100).toFixed(1) + '%');
        const cu = unknownA / (eps * path);
        stats.set('u', cu <= 0.01 ? cu.toFixed(5) + ' M' : 'off scale');
        cuv.redraw(); cal.redraw();
      }
      upd();
    }
  },
});
