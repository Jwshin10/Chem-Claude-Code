'use strict';
App.register({
  id: 'galvanic', unit: 9, sym: 'Ec', title: 'Electrochemical Cells',
  desc: 'Build galvanic cells from standard reduction potentials, watch electrons and ions move, apply the Nernst equation, and plate metals by electrolysis.',
  tags: ['galvanic cell', 'voltaic cell', 'electrochemistry', 'anode', 'cathode', 'salt bridge', 'cell potential', 'standard reduction potential', 'e°cell', 'nernst equation', 'electrolysis', 'electrolytic cell', 'faraday', 'electroplating', 'battery'],
  keyIdeas: [
    '<b>Galvanic cells</b> use a thermodynamically favored redox reaction to produce electricity: E°<sub>cell</sub> &gt; 0 and ΔG° &lt; 0.',
    'Oxidation at the <b>anode</b>, reduction at the <b>cathode</b> (“An Ox, Red Cat”). Electrons flow through the wire from anode to cathode.',
    'E°<sub>cell</sub> = E°<sub>cathode</sub> − E°<sub>anode</sub> (both as reduction potentials). Do not multiply E° by coefficients.',
    'The salt bridge keeps each half-cell electrically neutral: anions migrate toward the anode, cations toward the cathode.',
    'Nernst: E = E° − (RT/nF) ln Q. As the cell runs, Q rises toward K and E falls to 0 (a dead battery).',
    '<b>Electrolytic cells</b> use an external power source to drive an unfavored reaction. Charge q = It; moles of e⁻ = It/F (F = 96,485 C/mol).',
  ],
  render(el, scope) {
    const h = U.h;
    const HALF = [
      ['Li', 'Li^+', 1, -3.05], ['Mg', 'Mg^2+', 2, -2.37], ['Al', 'Al^3+', 3, -1.66], ['Zn', 'Zn^2+', 2, -0.76], ['Cr', 'Cr^3+', 3, -0.74], ['Fe', 'Fe^2+', 2, -0.44], ['Co', 'Co^2+', 2, -0.28], ['Ni', 'Ni^2+', 2, -0.25],
      ['Sn', 'Sn^2+', 2, -0.14], ['Pb', 'Pb^2+', 2, -0.13], ['H2', 'H^+', 1, 0.00, 'Pt'], ['Cu', 'Cu^2+', 2, 0.34], ['Ag', 'Ag^+', 1, 0.80], ['Br2', 'Br^-', -1, 1.07, 'Pt'], ['Cl2', 'Cl^-', -1, 1.36, 'Pt'], ['Au', 'Au^3+', 3, 1.50],
    ];
    const ION_COLOR = { 'Cu^2+': '#2f7fe0', 'Ni^2+': '#22a25a', 'Co^2+': '#e88aa0', 'Fe^2+': '#9ccc65', 'Cr^3+': '#5a8f5a', 'Au^3+': '#e6b800', 'Br^-': '#c96a2a' };
    const halfEq = H => H[2] > 0 ? `${U.chem(H[1])}(aq) + ${H[2] > 1 ? H[2] : ''}e⁻ → ${U.chem(H[0])}(${H[0] === 'H2' ? 'g' : 's'})` : H[0] === 'Cl2' ? 'Cl₂(g) + 2e⁻ → 2Cl⁻(aq)' : 'Br₂(l) + 2e⁻ → 2Br⁻(aq)';
    U.tabs(el, [{ label: 'Galvanic cell', render: galvanic }, { label: 'Reduction potentials', render: table }, { label: 'Electrolysis & Faraday’s law', render: electrolysis }], scope, { key: 'echem' });

    function galvanic(b, s) {
      let A = 3, C = 11, cA = 1, cC = 1, running = true, prog = 0;
      const opts = HALF.map((x, i) => ({ value: i, label: `${x[0] === 'H2' ? 'H⁺/H₂' : x[0] === 'Cl2' ? 'Cl₂/Cl⁻' : x[0] === 'Br2' ? 'Br₂/Br⁻' : U.chemText(x[1]) + '/' + x[0]}  (E° = ${x[3] >= 0 ? '+' : ''}${x[3].toFixed(2)} V)` }));
      const s1 = U.select({ label: 'Half-cell 1', options: opts, value: A, onChange: v => { A = +v; prog = 0; upd(); } });
      const s2 = U.select({ label: 'Half-cell 2', options: opts, value: C, onChange: v => { C = +v; prog = 0; upd(); } });
      const ca = U.logSlider({ label: 'Ion concentration, half-cell 1', min: 0.001, max: 2, value: cA, unit: 'M', fmt: v => U.sig(v, 2), onInput: v => { cA = v; upd(); } });
      const cc = U.logSlider({ label: 'Ion concentration, half-cell 2', min: 0.001, max: 2, value: cC, unit: 'M', fmt: v => U.sig(v, 2), onInput: v => { cC = v; upd(); } });
      const stats = U.stats([['e0', 'E°cell'], ['e', 'E (Nernst, 25 °C)'], ['g', 'ΔG° = −nFE°'], ['k', 'K']]);
      const out = h('div', { class: 'stack' });
      const cv = U.canvas(null, { aspect: 1.55, scope: s });
      b.append(h('div', { class: 'grid-viz' }, h('div', { class: 'stack' }, U.panel(null, cv.wrap, h('div', { class: 'row' }, U.btn('Pause / run', () => running = !running, 'sm'))), out),
        h('div', { class: 'stack' }, U.panel('Build the cell', s1.el, s2.el, h('div', { class: 'row' }, [[3, 11, 'Zn | Cu (Daniell)'], [11, 12, 'Cu | Ag'], [1, 11, 'Mg | Cu'], [3, 10, 'Zn | H₂']].map(([a, c, n]) => U.btn(n, () => { A = a; C = c; s1.set(a); s2.set(c); prog = 0; upd(); }, 'sm'))), ca.el, cc.el), stats.el)));
      const info = () => {
        const h1 = HALF[A], h2 = HALF[C];
        const cat = h1[3] >= h2[3] ? h1 : h2, an = cat === h1 ? h2 : h1;
        const cCat = cat === h1 ? cA : cC, cAn = cat === h1 ? cC : cA;
        const nc = Math.abs(cat[2]), na = Math.abs(an[2]), n = nc * na / U.gcd(nc, na);
        const E0 = cat[3] - an[3];
        // Q for: (n/na) anode-metal + (n/nc) cathode-ion -> (n/na) anode-ion + (n/nc) cathode-metal (gases/elements activity 1)
        const ka = n / na, kc = n / nc;
        const ionAnode = an[2] > 0 ? Math.pow(cAn, ka) : Math.pow(cAn, -ka * 2);
        const ionCath = cat[2] > 0 ? Math.pow(cCat, -kc) : Math.pow(cCat, kc * 2);
        const Q = ionAnode * ionCath;
        const E = E0 - 0.0592 / n * Math.log10(Q);
        return { cat, an, n, E0, E, Q, same: A === C };
      };
      s.loop((dt, time) => {
        const I = info(), c = cv.ctx, w = cv.w, H = cv.h, t = U.theme();
        c.clearRect(0, 0, w, H);
        if (running && !I.same && I.E0 > 0) prog = Math.min(1, prog + dt * 0.01);
        const left = HALF[A], right = HALF[C];
        const leftIsAnode = I.an === left;
        const bw = w * 0.32, bh = H * 0.42, by = H * 0.5, lx = w * 0.08, rx = w - w * 0.08 - bw;
        const drawHalf = (x, H1, isAnode, conc) => {
          const ionCol = ION_COLOR[H1[1]] || '#9ec5ff';
          c.fillStyle = U.alpha(ionCol, U.clamp(0.12 + Math.log10(conc * 10 + 1) * 0.25, 0.08, 0.6)); c.fillRect(x, by + bh * 0.15, bw, bh * 0.85);
          c.strokeStyle = t.ink2; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, by); c.lineTo(x, by + bh); c.lineTo(x + bw, by + bh); c.lineTo(x + bw, by); c.stroke();
          const inert = H1[4] === 'Pt';
          const shrink = isAnode && !inert ? 1 - prog * 0.5 : 1, grow = !isAnode && !inert ? 1 + prog * 0.5 : 1;
          const ew = 22 * (isAnode ? shrink : grow), ex = x + bw / 2 - ew / 2;
          c.fillStyle = inert ? '#c9ccd3' : U.elColor(H1[0]); c.fillRect(ex, by - H * 0.12, ew, bh * 0.85 + H * 0.12);
          c.strokeStyle = U.alpha(t.ink, 0.3); c.lineWidth = 1; c.strokeRect(ex, by - H * 0.12, ew, bh * 0.85 + H * 0.12);
          U.text(c, inert ? 'Pt' : H1[0], x + bw / 2, by - H * 0.14, { align: 'center', weight: 700 });
          U.text(c, I.same ? '' : isAnode ? 'ANODE (−) oxidation' : 'CATHODE (+) reduction', x + bw / 2, by + bh + 16, { align: 'center', size: 11, weight: 700, color: isAnode ? t.red : t.blue });
          U.text(c, U.chemText(H1[1]) + ' ' + U.sig(conc, 2) + ' M', x + bw / 2, by + bh - 8, { align: 'center', size: 11, color: t.ink2 });
          // ions leaving/arriving
          for (let i = 0; i < 6; i++) {
            const ph = ((time / 1500 + i / 6) % 1);
            const yy = by + bh * 0.3 + i * bh * 0.09;
            const xx = isAnode ? ex + ew + 4 + ph * bw * 0.3 : ex - 4 - (1 - ph) * bw * 0.3;
            if (!I.same && I.E0 > 0) { c.beginPath(); c.arc(xx, yy, 3.5, 0, 7); c.fillStyle = U.shade(ionCol, -0.2); c.fill(); }
          }
        };
        drawHalf(lx, left, leftIsAnode, A === HALF.indexOf(I.an) ? (I.an === left ? cA : cC) : cA);
        drawHalf(rx, right, !leftIsAnode, C === HALF.indexOf(I.cat) ? (I.cat === right ? cC : cA) : cC);
        // wire + voltmeter
        const wy = H * 0.12, lxC = lx + bw / 2, rxC = rx + bw / 2;
        c.strokeStyle = t.ink2; c.lineWidth = 2.5; c.beginPath(); c.moveTo(lxC, by - H * 0.12); c.lineTo(lxC, wy); c.lineTo(rxC, wy); c.lineTo(rxC, by - H * 0.12); c.stroke();
        c.fillStyle = t.surface; c.strokeStyle = t.ink2; c.beginPath(); c.arc(w / 2, wy, 26, 0, 7); c.fill(); c.stroke();
        U.text(c, (I.same ? 0 : I.E).toFixed(2) + ' V', w / 2, wy + 5, { align: 'center', mono: true, weight: 700, size: 13 });
        // electrons along wire from anode to cathode
        if (!I.same && I.E > 0 && running) {
          const ax = leftIsAnode ? lxC : rxC, cxp = leftIsAnode ? rxC : lxC;
          const path = [[ax, by - H * 0.12], [ax, wy], [cxp, wy], [cxp, by - H * 0.12]];
          const segL = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1])), tot = segL.reduce((a, z) => a + z, 0);
          for (let k = 0; k < 8; k++) {
            let d = ((time / 1000 * 70 * U.clamp(I.E, 0.2, 3) + k * tot / 8) % tot), i = 0;
            while (d > segL[i]) { d -= segL[i]; i++; }
            const f = d / segL[i], x = U.lerp(path[i][0], path[i + 1][0], f), y = U.lerp(path[i][1], path[i + 1][1], f);
            c.beginPath(); c.arc(x, y, 4, 0, 7); c.fillStyle = t.yellow; c.fill();
            U.text(c, '−', x, y + 3, { align: 'center', size: 8, weight: 700, color: '#222' });
          }
          U.text(c, 'e⁻ flow →', leftIsAnode ? w * 0.3 : w * 0.7, wy - 10, { align: 'center', size: 11, color: t.ink2 });
        }
        // salt bridge
        const sbY = by - H * 0.04;
        c.strokeStyle = U.alpha(t.ink3, 0.8); c.lineWidth = 14; c.lineCap = 'butt';
        c.beginPath(); c.moveTo(lx + bw * 0.82, by + bh * 0.4); c.lineTo(lx + bw * 0.82, sbY); c.lineTo(rx + bw * 0.18, sbY); c.lineTo(rx + bw * 0.18, by + bh * 0.4); c.stroke();
        c.lineCap = 'round';
        U.text(c, 'salt bridge (KNO₃)', w / 2, sbY - 12, { align: 'center', size: 10.5, color: t.ink3 });
        if (!I.same && I.E0 > 0 && running) for (let k = 0; k < 3; k++) {
          const ph = (time / 2500 + k / 3) % 1;
          const toAnodeX = leftIsAnode ? U.lerp(rx + bw * 0.18, lx + bw * 0.82, ph) : U.lerp(lx + bw * 0.82, rx + bw * 0.18, ph);
          const toCathX = leftIsAnode ? U.lerp(lx + bw * 0.82, rx + bw * 0.18, ph) : U.lerp(rx + bw * 0.18, lx + bw * 0.82, ph);
          c.beginPath(); c.arc(toAnodeX, sbY - 2, 3.2, 0, 7); c.fillStyle = t.red; c.fill();
          c.beginPath(); c.arc(toCathX, sbY + 3, 3.2, 0, 7); c.fillStyle = t.purple; c.fill();
        }
      });
      function upd() {
        const I = info();
        U.clear(out);
        if (I.same) { out.appendChild(U.callout('Pick two different half-cells.', 'warn')); stats.set('e0', '0.00 V'); stats.set('e', '0.00 V'); stats.set('g', '—'); stats.set('k', '—'); return; }
        stats.set('e0', '+' + I.E0.toFixed(2) + ' V'); stats.set('e', (I.E >= 0 ? '+' : '') + I.E.toFixed(3) + ' V');
        stats.set('g', (-I.n * K.F * I.E0 / 1000).toFixed(0) + ' kJ/mol'); stats.set('k', U.sig(Math.pow(10, I.n * I.E0 / 0.0592), 2));
        const an = I.an, cat = I.cat;
        const anEq = an[2] > 0 ? `${U.chem(an[0])}(${an[0] === 'H2' ? 'g' : 's'}) → ${an[0] === 'H2' ? '2' : ''}${U.chem(an[1])}(aq) + ${an[0] === 'H2' ? 2 : an[2] > 1 ? an[2] : ''}e⁻` : `2${U.chem(an[1])}(aq) → ${U.chem(an[0])} + 2e⁻`;
        const metalSym = x => x[4] === 'Pt' ? 'Pt(s)' : U.chem(x[0]) + '(s)';
        const notation = an[2] > 0 && an[4] !== 'Pt' ? `${metalSym(an)} | ${U.chem(an[1])}(aq) || ${cat[2] > 0 ? U.chem(cat[1]) + '(aq) | ' + metalSym(cat) : U.chem(cat[0]) + ', ' + U.chem(cat[1]) + ' | Pt(s)'}` : `Pt(s) | ${U.chem(an[0])}, ${U.chem(an[1])} || ${U.chem(cat[1])}(aq) | ${metalSym(cat)}`;
        out.append(U.panel('What happens',
          h('div', { class: 'tiny muted' }, 'Anode (oxidation)'), h('div', { class: 'eq', html: anEq }),
          h('div', { class: 'tiny muted' }, 'Cathode (reduction)'), h('div', { class: 'eq', html: halfEq(cat) }),
          h('div', { class: 'tiny muted' }, 'Cell notation'), h('div', { class: 'eq', html: notation }),
          h('div', { class: 'eq wrap', html: `E°<sub>cell</sub> = E°<sub>cathode</sub> − E°<sub>anode</sub> = (${cat[3].toFixed(2)}) − (${an[3].toFixed(2)}) = <b>+${I.E0.toFixed(2)} V</b> &nbsp; n = ${I.n} e⁻` })),
          U.callout(`${U.chem(cat[0] === 'Cl2' || cat[0] === 'Br2' ? cat[0] : cat[1])} has the higher (more positive) reduction potential, so it is reduced at the cathode. Electrons travel through the wire from the ${an[4] === 'Pt' ? 'Pt' : an[0]} anode to the cathode. Q = ${U.sig(I.Q, 3)}: ${I.Q < 1 ? 'Q < 1, so E > E°.' : I.Q > 1 ? 'Q > 1, so E < E°. As the cell runs and Q grows toward K, E drops toward 0.' : 'at standard conditions, E = E°.'}`));
      }
      upd();
    }

    function table(b) {
      const rows = HALF.slice().sort((a, z) => z[3] - a[3]).map(x => [halfEq(x), (x[3] >= 0 ? '+' : '') + x[3].toFixed(2)]);
      b.append(U.panel('Standard reduction potentials at 25 °C', h('p', { class: 'small muted' }, 'Higher on the list: stronger oxidizing agent (more easily reduced). Lower on the list: the metal is a stronger reducing agent (more easily oxidized).'),
        U.table(['Half-reaction', 'E° (V)'], rows, { num: [1] })));
    }

    function electrolysis(b, s) {
      const METALS = [['Cu', 2, 63.55], ['Ag', 1, 107.87], ['Ni', 2, 58.69], ['Zn', 2, 65.38], ['Al', 3, 26.98], ['Cr', 3, 52.00], ['Au', 3, 196.97]];
      let mi = 0, I = 2.0, tmin = 30, prog = 0;
      const sel = U.select({ label: 'Metal being plated', options: METALS.map((m, i) => ({ value: i, label: `${ELEMENTS.bySym[m[0]].name} from ${m[0]}${m[1] > 1 ? U.supText(m[1] + '+') : '⁺'}` })), value: mi, onChange: v => { mi = +v; upd(); } });
      const si = U.slider({ label: 'Current I', min: 0.1, max: 10, step: 0.1, value: I, unit: 'A', fmt: v => v.toFixed(1), onInput: v => { I = v; upd(); } });
      const st = U.slider({ label: 'Time', min: 1, max: 180, step: 1, value: tmin, unit: 'min', onInput: v => { tmin = v; upd(); } });
      const out = h('div', { class: 'stack' });
      const cv = U.canvas(null, { aspect: 1.5, scope: s });
      b.append(h('div', { class: 'grid-viz' }, h('div', { class: 'stack' }, U.panel('Electrolytic cell (electroplating)', cv.wrap), out), h('div', { class: 'stack' }, U.panel('Settings', sel.el, si.el, st.el),
        U.callout('An external power source pushes electrons onto the cathode, forcing metal ions to be reduced even though the reaction is not thermodynamically favored on its own (E°<sub>cell</sub> &lt; 0 for the overall process).'))));
      s.loop((dt, time) => {
        prog = (prog + dt * 0.08) % 1;
        const c = cv.ctx, w = cv.w, H = cv.h, t = U.theme(), m = METALS[mi];
        c.clearRect(0, 0, w, H);
        const bx = w * 0.15, bw = w * 0.7, by = H * 0.35, bh = H * 0.58;
        c.fillStyle = U.alpha(ION_COLOR[m[0] + '^2+'] || '#9ec5ff', 0.25); c.fillRect(bx, by + bh * 0.1, bw, bh * 0.9);
        c.strokeStyle = t.ink2; c.lineWidth = 2.5; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx, by + bh); c.lineTo(bx + bw, by + bh); c.lineTo(bx + bw, by); c.stroke();
        const ax = bx + bw * 0.25, cx = bx + bw * 0.75, top = by - H * 0.1, len = bh * 0.8 + H * 0.1;
        const plate = Math.min(10, I * tmin / 60);
        c.fillStyle = U.elColor(m[0]); c.fillRect(ax - 10, top, 20, len);
        c.fillStyle = '#9aa3ad'; c.fillRect(cx - 8, top, 16, len);
        c.fillStyle = U.elColor(m[0]); c.fillRect(cx - 8 - plate, top + H * 0.12, plate, len - H * 0.12); c.fillRect(cx + 8, top + H * 0.12, plate, len - H * 0.12);
        U.text(c, 'anode (+)', ax, by + bh + 14, { align: 'center', size: 11, color: t.red, weight: 700 }); U.text(c, 'cathode (−)', cx, by + bh + 14, { align: 'center', size: 11, color: t.blue, weight: 700 });
        // battery
        const py = H * 0.1;
        c.strokeStyle = t.ink2; c.lineWidth = 2; c.beginPath(); c.moveTo(ax, top); c.lineTo(ax, py); c.lineTo(w / 2 - 14, py); c.moveTo(w / 2 + 14, py); c.lineTo(cx, py); c.lineTo(cx, top); c.stroke();
        c.fillStyle = t.ink; c.fillRect(w / 2 - 14, py - 14, 4, 28); c.fillRect(w / 2 + 6, py - 8, 4, 16);
        U.text(c, I.toFixed(1) + ' A', w / 2, py + 30, { align: 'center', mono: true, size: 11 });
        for (let k = 0; k < 6; k++) { const f = (prog * 3 + k / 6) % 1; const x = U.lerp(bx + bw * 0.3, cx - 12, f), y = by + bh * (0.3 + k * 0.1); c.beginPath(); c.arc(x, y, 4, 0, 7); c.fillStyle = U.shade(U.elColor(m[0]), -0.1); c.fill(); U.text(c, '+', x, y + 3, { align: 'center', size: 8, color: '#fff', weight: 700 }); }
      });
      function upd() {
        const [sym, n, M] = METALS[mi], q = I * tmin * 60, mol = q / K.F, mass = mol / n * M;
        U.clear(out);
        out.append(U.panel('Faraday’s law', h('div', { class: 'eq wrap', html: `q = I·t = (${I.toFixed(1)} A)(${tmin} min × 60 s/min) = ${q.toFixed(0)} C<br>mol e⁻ = q/F = ${q.toFixed(0)} / 96,485 = ${mol.toFixed(4)} mol<br>mol ${sym} = mol e⁻ / ${n} = ${(mol / n).toFixed(4)} mol<br>mass = ${(mol / n).toFixed(4)} mol × ${M} g/mol = <b>${mass.toFixed(3)} g ${sym}</b>` }),
          h('div', { class: 'eq', html: `Cathode: ${sym}${n > 1 ? '<sup>' + n + '+</sup>' : '<sup>+</sup>'}(aq) + ${n > 1 ? n : ''}e⁻ → ${sym}(s)` })));
      }
      upd();
    }
  },
});
