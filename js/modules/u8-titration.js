'use strict';
App.register({
  id: 'titration', unit: 8, sym: 'Ti', title: 'Titration Curves',
  desc: 'Simulate strong, weak and polyprotic titrations. Drag along the curve to see species, buffer regions, equivalence points and indicators.',
  tags: ['titration', 'titration curve', 'equivalence point', 'half-equivalence', 'endpoint', 'indicator', 'phenolphthalein', 'buffer region', 'polyprotic', 'diprotic', 'weak acid strong base', 'pka from titration', 'burette'],
  keyIdeas: [
    'At the <b>equivalence point</b>, moles of titrant added equal the moles of analyte (times the number of protons).',
    'Weak acid + strong base: the equivalence point is above pH 7 because the conjugate base (A<sup>−</sup>) is basic. Weak base + strong acid: below pH 7. Strong + strong: pH 7.',
    'At the <b>half-equivalence point</b>, [HA] = [A<sup>−</sup>], so <b>pH = pK<sub>a</sub></b>. The flat region around it is the buffer region.',
    'Polyprotic acids show one equivalence point per acidic proton, each with its own half-equivalence pH = pK<sub>a1</sub>, pK<sub>a2</sub>, …',
    'Choose an indicator whose color-change range includes the pH at the equivalence point.',
  ],
  render(el, scope) {
    const h = U.h;
    const ANALYTES = [
      { id: 'sa', name: 'Strong acid: HCl', kind: 'acid', Ka: null, label: 'HCl' },
      { id: 'wa', name: 'Weak acid: acetic acid (Ka 1.8×10⁻⁵)', kind: 'acid', Ka: [1.8e-5], label: 'CH₃COOH', sp: ['CH₃COOH', 'CH₃COO⁻'] },
      { id: 'hf', name: 'Weak acid: HF (Ka 6.8×10⁻⁴)', kind: 'acid', Ka: [6.8e-4], label: 'HF', sp: ['HF', 'F⁻'] },
      { id: 'hcn', name: 'Very weak acid: HCN (Ka 6.2×10⁻¹⁰)', kind: 'acid', Ka: [6.2e-10], label: 'HCN', sp: ['HCN', 'CN⁻'] },
      { id: 'ox', name: 'Diprotic: oxalic acid H₂C₂O₄', kind: 'acid', Ka: [5.9e-2, 6.4e-5], label: 'H₂C₂O₄', sp: ['H₂C₂O₄', 'HC₂O₄⁻', 'C₂O₄²⁻'] },
      { id: 'carb', name: 'Diprotic: carbonic acid H₂CO₃', kind: 'acid', Ka: [4.3e-7, 4.8e-11], label: 'H₂CO₃', sp: ['H₂CO₃', 'HCO₃⁻', 'CO₃²⁻'] },
      { id: 'phos', name: 'Triprotic: phosphoric acid H₃PO₄', kind: 'acid', Ka: [7.5e-3, 6.2e-8, 4.8e-13], label: 'H₃PO₄', sp: ['H₃PO₄', 'H₂PO₄⁻', 'HPO₄²⁻', 'PO₄³⁻'] },
      { id: 'wb', name: 'Weak base: NH₃ (titrated with HCl)', kind: 'base', Kb: 1.8e-5, label: 'NH₃', sp: ['NH₄⁺', 'NH₃'] },
      { id: 'sb', name: 'Strong base: NaOH (titrated with HCl)', kind: 'sbase', label: 'NaOH' },
      { id: 'cwa', name: 'Your own weak acid (set Ka below)', kind: 'acid', Ka: [1e-4], label: 'HA', sp: ['HA', 'A⁻'], custom: true },
      { id: 'cwb', name: 'Your own weak base (set Kb below)', kind: 'base', Kb: 1e-4, label: 'B', sp: ['BH⁺', 'B'], custom: true },
    ];
    const INDICATORS = { none: null, 'Methyl orange': [3.1, 4.4, '#e0413b', '#e6b800'], 'Methyl red': [4.4, 6.2, '#e0413b', '#e6b800'], 'Bromothymol blue': [6.0, 7.6, '#e6b800', '#2f6fe0'], Phenolphthalein: [8.2, 10.0, 'rgba(255,255,255,0)', '#e04a9a'] };
    let ai = 1, Ca = 0.10, Va = 25, Ct = 0.10, Vt = 12.5, ind = 'Phenolphthalein', playing = false;
    const sel = U.select({ label: 'Analyte (in the flask)', options: ANALYTES.map((a, i) => ({ value: i, label: a.name })), value: ai, onChange: v => { ai = +v; Vt = 0; slV.set(0); upd(); } });
    const s1 = U.slider({ label: 'Analyte concentration', min: 0.02, max: 0.5, step: 0.01, value: Ca, unit: 'M', fmt: v => v.toFixed(2), onInput: v => { Ca = v; upd(); } });
    const s2 = U.slider({ label: 'Analyte volume', min: 10, max: 50, step: 1, value: Va, unit: 'mL', onInput: v => { Va = v; upd(); } });
    const s3 = U.slider({ label: 'Titrant concentration', min: 0.02, max: 0.5, step: 0.01, value: Ct, unit: 'M', fmt: v => v.toFixed(2), onInput: v => { Ct = v; upd(); } });
    const kS = U.logSlider({ label: 'K of your acid or base', min: 1e-12, max: 1e-1, value: 1e-4, fmt: v => U.sig(v, 2), onInput: v => { ANALYTES.forEach(a => { if (a.id === 'cwa') a.Ka = [v]; if (a.id === 'cwb') a.Kb = v; }); upd(); } });
    const si = U.select({ label: 'Indicator', options: Object.keys(INDICATORS).map(k => ({ value: k, label: k === 'none' ? 'None' : `${k} (pH ${INDICATORS[k][0]}–${INDICATORS[k][1]})` })), value: ind, onChange: v => { ind = v; upd(); } });
    const slV = U.slider({ label: 'Titrant added', min: 0, max: 60, step: 0.05, value: Vt, unit: 'mL', fmt: v => v.toFixed(2), onInput: v => { Vt = v; playing = false; upd(); } });
    const playBtn = U.btn('▶ Auto-titrate', () => { if (Vt >= maxV() - 0.1) Vt = 0; playing = !playing; }, 'primary');
    const stats = U.stats([['ph', 'pH'], ['v', 'Volume added'], ['reg', 'Region']]);
    const notes = h('div', { class: 'stack' });
    const spBox = h('div');
    let P = null;
    const cv = U.canvas(null, { aspect: 1.55, scope, drag: true, hint: 'drag on the curve', draw });
    const flask = U.canvas(null, { aspect: 0.95, scope });
    el.append(h('div', { class: 'grid-viz' }, h('div', { class: 'stack' }, U.panel(null, cv.wrap, slV.el, h('div', { class: 'row' }, playBtn)), notes),
      h('div', { class: 'stack' }, U.panel('Setup', sel.el, kS.el, s1.el, s2.el, s3.el, si.el), stats.el, U.panel('Flask', flask.wrap), spBox)));
    const A = () => ANALYTES[ai];
    const nProt = () => A().Ka ? A().Ka.length : 1;
    const Veq = () => Ca * Va * (A().kind === 'acid' ? 1 : 1) / Ct;
    const maxV = () => Math.min(80, Veq() * (nProt() + 1.2));
    function pHat(v) {
      const a = A(), Vtot = Va + v, Cin = Ca * Va / Vtot, Ctit = Ct * v / Vtot;
      if (a.kind === 'acid') return a.Ka ? AB.pHacid(Cin, a.Ka, Ctit) : AB.pHstrong(Cin, Ctit);
      if (a.kind === 'base') return AB.pHbase(Cin, a.Kb, Ctit);
      return AB.pHstrong(Ctit, Cin);
    }
    function region(v) {
      const e = Veq(), n = nProt(), a = A();
      if (v < 1e-6) return 'initial solution';
      for (let k = 1; k <= n; k++) {
        if (Math.abs(v - k * e) < e * 0.02) return k === 1 && n === 1 ? 'equivalence point' : `equivalence point ${k}`;
        if (a.kind !== 'sbase' && (a.Ka || a.Kb) && Math.abs(v - (k - 0.5) * e) < e * 0.03) return n > 1 ? `half-equivalence ${k}: pH = pKa${k}` : (a.kind === 'base' ? 'half-equivalence: pOH = pKb' : 'half-equivalence: pH = pKa');
        if (v < k * e) return (a.Ka || a.Kb) ? (k === 1 && v < e * 0.1 ? 'just started' : 'buffer region') : 'before equivalence';
      }
      return 'excess titrant';
    }
    function draw(c, w, H) {
      const t = U.theme(), a = A(), mv = maxV();
      P = new U.Plot(c, w, H, { x: [0, mv], y: [0, 14], xlabel: `Volume of ${a.kind === 'acid' ? 'NaOH' : 'HCl'} added (mL)`, ylabel: 'pH', yticks: [0, 2, 4, 6, 8, 10, 12, 14] });
      P.axes();
      const I = INDICATORS[ind];
      if (I) { c.fillStyle = U.alpha(I[3].startsWith('rgba') ? '#888888' : I[3], 0.14); c.fillRect(P.L, P.Y(I[1]), P.R - P.L, P.Y(I[0]) - P.Y(I[1])); P.label(ind + ' range', mv * 0.98, I[1], t.ink3, { align: 'right', dy: -4, weight: 500 }); }
      const pts = []; for (let i = 0; i <= 400; i++) { const v = mv * i / 400; pts.push([v, pHat(v)]); }
      P.line(pts, t.accent, 2.8);
      const e = Veq();
      for (let k = 1; k <= nProt(); k++) {
        if (k * e > mv) break;
        P.vline(k * e, U.alpha(t.good, 0.8), [5, 4]); P.dot(k * e, pHat(k * e), t.good, 5);
        P.label(nProt() > 1 ? 'eq. pt ' + k : 'equivalence', k * e, pHat(k * e), t.good, { dx: 6, dy: 14 });
        if (a.Ka || a.Kb) { const hv = (k - 0.5) * e; P.dot(hv, pHat(hv), t.orange, 5); P.label(a.kind === 'base' ? 'pOH = pKb' : (nProt() > 1 ? 'pKa' + k : 'pH = pKa'), hv, pHat(hv), t.orange, { dx: -6, dy: -8, align: 'right' }); }
      }
      P.hline(7, U.alpha(t.ink3, 0.5), [2, 4]);
      P.dot(Vt, pHat(Vt), t.red, 7);
    }
    U.drag(cv, { down: p => P && P.inside(p.x, p.y), move: p => { Vt = U.clamp(P.invX(p.x), 0, maxV()); playing = false; slV.set(Vt); upd(); } }, scope);
    scope.loop((dt, time) => {
      if (playing) { const e = Veq(); const near = Array.from({ length: nProt() }, (_, k) => Math.abs(Vt - (k + 1) * e)).some(d => d < e * 0.08); Vt = Math.min(maxV(), Vt + dt * e * (near ? 0.06 : 0.25)); slV.set(Vt); upd(); if (Vt >= maxV()) playing = false; }
      const c = flask.ctx, w = flask.w, H = flask.h, t = U.theme(), pH = pHat(Vt), I = INDICATORS[ind];
      c.clearRect(0, 0, w, H);
      // burette
      const bx = w * 0.5, bTop = 4, bBot = H * 0.36;
      c.fillStyle = t.surface3; c.fillRect(bx - 8, bTop, 16, bBot - bTop);
      const lvl = 1 - Vt / 80; c.fillStyle = U.alpha(t.blue, 0.35); c.fillRect(bx - 6, bTop + (bBot - bTop) * (1 - lvl), 12, (bBot - bTop) * lvl);
      c.fillStyle = t.ink3; c.fillRect(bx - 2, bBot, 4, 12);
      if (playing && (time % 400) < 200) { c.beginPath(); c.arc(bx, bBot + 22 + (time % 200) / 6, 3, 0, 7); c.fillStyle = U.alpha(t.blue, 0.7); c.fill(); }
      // flask
      const fy = H * 0.48, fb = H * 0.96, neck = w * 0.1, base = w * 0.42;
      let col = U.alpha('#9ec5ff', 0.25);
      if (I) { const f = U.clamp((pH - I[0]) / (I[1] - I[0]), 0, 1); col = I[2].startsWith('rgba') ? U.alpha('#e04a9a', 0.85 * f) : U.mix(I[2], I[3], f); }
      c.beginPath(); c.moveTo(bx - neck, fy); c.lineTo(bx - neck, fy + 18); c.lineTo(bx - base, fb); c.lineTo(bx + base, fb); c.lineTo(bx + neck, fy + 18); c.lineTo(bx + neck, fy); c.closePath();
      c.strokeStyle = t.ink2; c.lineWidth = 2; c.stroke();
      c.save(); c.clip(); c.fillStyle = U.alpha('#9ec5ff', 0.22); c.fillRect(0, fy + (fb - fy) * 0.45, w, fb); c.fillStyle = col; c.fillRect(0, fy + (fb - fy) * 0.45, w, fb); c.restore();
      U.text(c, 'pH ' + pH.toFixed(2), bx, fb - 10, { align: 'center', weight: 700, mono: true, size: 13, color: t.ink });
    });
    function species() {
      const a = A(), pH = pHat(Vt), Hc = Math.pow(10, -pH);
      U.clear(spBox);
      if (!a.sp) return;
      let fr;
      if (a.kind === 'acid') fr = AB.alphas(Hc, a.Ka);
      else { const Ka = AB.Kw / a.Kb; fr = [Hc / (Hc + Ka), Ka / (Hc + Ka)]; }
      const t = U.theme(), cols = [t.red, t.orange, t.green, t.blue];
      const bars = h('div', { class: 'stack', style: { gap: '6px' } }, a.sp.map((n, i) => h('div', { class: 'row', style: { gap: '8px', flexWrap: 'nowrap' } },
        h('span', { style: { width: '80px', fontWeight: 600, fontSize: '.85rem', flex: 'none' } }, n),
        h('div', { class: 'progress grow', style: { height: '14px' } }, h('i', { style: { width: (fr[i] * 100).toFixed(1) + '%', background: cols[i] } })),
        h('span', { class: 'mono small', style: { width: '52px', textAlign: 'right', flex: 'none' } }, (fr[i] * 100).toFixed(1) + '%'))));
      spBox.appendChild(U.panel('Species present (fraction of analyte)', bars));
    }
    function upd() {
      slV.input.max = maxV(); if (Vt > maxV()) { Vt = maxV(); }
      kS.el.hidden = !A().custom;
      if (A().custom) kS.el.querySelector('.lbl span').textContent = A().kind === 'acid' ? 'Ka of your weak acid' : 'Kb of your weak base';
      slV.set(Vt);
      const a = A(), pH = pHat(Vt), e = Veq();
      stats.set('ph', pH.toFixed(2)); stats.set('v', Vt.toFixed(2) + ' mL'); stats.set('reg', region(Vt));
      cv.redraw(); species();
      U.clear(notes);
      const tit = a.kind === 'acid' ? 'NaOH' : 'HCl';
      const eqpH = pHat(e);
      let txt = `Equivalence volume = (${Ca.toFixed(2)} M × ${Va} mL) / ${Ct.toFixed(2)} M = <b>${e.toFixed(2)} mL</b> of ${tit}${nProt() > 1 ? ' per proton' : ''}. pH at the ${nProt() > 1 ? 'first ' : ''}equivalence point = <b>${eqpH.toFixed(2)}</b>.`;
      if (a.kind === 'acid' && a.Ka) txt += ` Half-equivalence pH = ${pHat(e / 2).toFixed(2)} ≈ pK<sub>a1</sub> = ${(-Math.log10(a.Ka[0])).toFixed(2)}.`;
      if (a.kind === 'base') txt += ` Half-equivalence pH = ${pHat(e / 2).toFixed(2)} = pK<sub>a</sub> of ${a.sp[0]} (${(14 + Math.log10(a.Kb)).toFixed(2)}).`;
      notes.appendChild(U.callout(txt));
      const I = INDICATORS[ind];
      if (I) notes.appendChild(U.callout(eqpH >= I[0] - 0.3 && eqpH <= I[1] + 0.3 ? `${ind} changes color between pH ${I[0]} and ${I[1]}, which brackets the equivalence pH. Good choice.` : `${ind} changes color between pH ${I[0]} and ${I[1]}, but the equivalence pH is ${eqpH.toFixed(2)}. The endpoint would not match the equivalence point.`, eqpH >= I[0] - 0.3 && eqpH <= I[1] + 0.3 ? 'good' : 'bad'));
    }
    upd();
  },
});
