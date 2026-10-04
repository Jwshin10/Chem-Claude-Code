'use strict';
App.register({
  id: 'moles', unit: 1, sym: 'Mo', title: 'Moles & Molar Mass',
  desc: 'Molar mass, percent composition, gram ⇄ mole ⇄ particle conversions, and empirical formulas.',
  tags: ['mole', 'avogadro', 'molar mass', 'percent composition', 'empirical formula', 'molecular formula', 'dimensional analysis'],
  keyIdeas: [
    'One mole = 6.022 × 10<sup>23</sup> particles (Avogadro’s number, N<sub>A</sub>).',
    'Molar mass (g/mol) links mass to amount: <b>n = m / M</b>. Number of particles = n × N<sub>A</sub>.',
    'A pure compound always has the same percent composition by mass (law of definite proportions).',
    'Empirical formula = simplest whole-number mole ratio. Molecular formula = (molar mass ÷ empirical formula mass) × empirical formula.',
  ],
  render(el, scope) {
    const h = U.h;
    const formulaHtml = counts => Object.keys(counts).map(s => s + (counts[s] > 1 ? '<sub>' + counts[s] + '</sub>' : '')).join('');

    U.tabs(el, [
      {
        label: 'Molar mass & % composition', render(b) {
          const out = h('div', { class: 'stack' });
          const inp = U.textInput({ label: 'Chemical formula', value: 'Ca(OH)2', placeholder: 'e.g. C6H12O6', onInput: v => calc(v) });
          const picks = h('div', { class: 'row' }, ['H2O', 'CO2', 'C6H12O6', 'NaCl', 'Ca(OH)2', 'Fe2(SO4)3', 'CuSO4·5H2O', 'C8H10N4O2'].map(f => U.btn(U.chem(f), () => { inp.set(f); calc(f); }, 'sm')));
          b.append(U.panel('Formula', inp.el, picks, h('p', { class: 'small muted' }, 'Type any formula. Parentheses and hydrates (·) work. Capitalization matters: Co is cobalt, CO is carbon monoxide.')), out);
          function calc(f) {
            U.clear(out);
            let c;
            try { c = U.parseFormula(f); } catch (e) { out.appendChild(U.callout(e.message + '. Use element symbols with correct capitalization, like NaCl or Mg(NO3)2.', 'bad')); return; }
            const rows = Object.keys(c).map(s => { const e = ELEMENTS.bySym[s]; return { s, n: c[s], m: e.mass, sub: e.mass * c[s], name: e.name }; });
            const M = rows.reduce((t, r) => t + r.sub, 0);
            const bar = h('div', { style: { display: 'flex', height: '34px', borderRadius: '8px', overflow: 'hidden' } });
            rows.forEach(r => {
              const pct = r.sub / M * 100;
              const col = U.elColor(r.s);
              bar.appendChild(h('div', { title: `${r.s}: ${pct.toFixed(1)}%`, style: { width: pct + '%', background: col, color: U.lum(col) > 0.6 ? '#1b2530' : '#fff', display: 'grid', placeItems: 'center', fontWeight: 600, fontSize: '.8rem', whiteSpace: 'nowrap', overflow: 'hidden' } }, pct > 6 ? `${r.s} ${pct.toFixed(1)}%` : ''));
            });
            out.append(
              U.panel('Result',
                h('div', { class: 'row', style: { alignItems: 'baseline' } }, h('span', { class: 'big-num' }, M.toFixed(2)), h('span', { class: 'muted' }, 'g/mol'), h('span', { class: 'formula', style: { marginLeft: 'auto', fontSize: '1.2rem' }, html: U.chem(f) })),
                h('div', { class: 'eq', html: 'M = ' + rows.map(r => `${r.n}(${r.m.toFixed(3)})`).join(' + ') + ` = <b>${M.toFixed(2)} g/mol</b>` }),
                h('h4', null, 'Percent composition by mass'), bar,
                U.table(['Element', 'Atoms', 'Atomic mass (u)', 'Mass in 1 mol (g)', 'Mass %'],
                  rows.map(r => [`${r.name} (${r.s})`, r.n, r.m.toFixed(3), r.sub.toFixed(3), (r.sub / M * 100).toFixed(2) + '%']), { num: [1, 2, 3, 4] })));
          }
          calc(inp.value);
        },
      },
      {
        label: 'Gram ⇄ mole ⇄ particle', render(b) {
          let formula = 'H2O', amount = 36.0, unit = 'g';
          const fIn = U.textInput({ label: 'Substance (formula)', value: formula, onInput: v => { formula = v; calc(); } });
          const aIn = U.numInput({ label: 'Amount', value: amount, onInput: v => { amount = v; calc(); } });
          const uSeg = U.seg({ options: [{ value: 'g', label: 'grams' }, { value: 'mol', label: 'moles' }, { value: 'p', label: 'particles' }], value: unit, onChange: v => { unit = v; calc(); } });
          const map = h('div', { class: 'row', style: { justifyContent: 'center', gap: '6px', flexWrap: 'wrap' } });
          const steps = h('div', { class: 'stack' });
          b.append(U.panel('Convert', h('div', { class: 'controls' }, fIn.el, aIn.el, h('div', { class: 'field' }, h('span', { class: 'lbl' }, 'Units'), uSeg.el))),
            U.panel('The mole map', map, steps));
          const box = (title, val, on) => h('div', { style: { border: '2px solid ' + (on ? 'var(--uc)' : 'var(--line)'), borderRadius: '12px', padding: '12px 16px', textAlign: 'center', minWidth: '130px', background: on ? 'var(--surface-2)' : 'var(--surface)' } }, h('div', { class: 'tiny muted', style: { textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 } }, title), h('div', { class: 'mono', style: { fontSize: '1.1rem', fontWeight: 600 }, html: val }));
          const arrow = (top, bot) => h('div', { class: 'mono tiny', style: { textAlign: 'center', color: 'var(--ink-2)' } }, h('div', null, top + ' →'), h('div', null, '← ' + bot));
          function calc() {
            U.clear(map); U.clear(steps);
            let M, c;
            try { c = U.parseFormula(formula); M = U.molarMass(formula); } catch (e) { steps.appendChild(U.callout(e.message, 'bad')); return; }
            if (!(amount > 0)) { steps.appendChild(U.callout('Enter an amount greater than zero.', 'warn')); return; }
            const n = unit === 'g' ? amount / M : unit === 'mol' ? amount : amount / K.NA;
            const g = n * M, p = n * K.NA;
            const atoms = Object.values(c).reduce((t, x) => t + x, 0);
            map.append(box('Mass', U.sig(g, 4) + ' g', unit === 'g'), arrow('÷ ' + M.toFixed(2), '× ' + M.toFixed(2)), box('Moles', U.sig(n, 4) + ' mol', unit === 'mol'), arrow('× N<sub>A</sub>'.replace(/<[^>]+>/g, ''), '÷ NA'), box('Particles', U.sig(p, 4), unit === 'p'));
            const F = U.chem(formula);
            const lines = [];
            if (unit === 'g') lines.push(`${U.sig(g, 4)} g ${F} × (1 mol / ${M.toFixed(2)} g) = <b>${U.sig(n, 4)} mol</b>`);
            if (unit === 'p') lines.push(`${U.sig(p, 4)} particles × (1 mol / 6.022×10²³) = <b>${U.sig(n, 4)} mol</b>`);
            if (unit !== 'g') lines.push(`${U.sig(n, 4)} mol × (${M.toFixed(2)} g / 1 mol) = <b>${U.sig(g, 4)} g</b>`);
            if (unit !== 'p') lines.push(`${U.sig(n, 4)} mol × (6.022×10²³ / 1 mol) = <b>${U.sig(p, 4)} formula units</b>`);
            lines.push(`${U.sig(p, 4)} formula units × ${atoms} atoms each = <b>${U.sig(p * atoms, 4)} atoms</b> total`);
            lines.forEach(l => steps.appendChild(h('div', { class: 'eq', html: l })));
          }
          calc();
        },
      },
      {
        label: 'Empirical formula', render(b) {
          const rows = [['C', 40.00], ['H', 6.71], ['O', 53.29], ['', 0]];
          let MM = 180.16;
          const out = h('div', { class: 'stack' });
          const inputs = h('div', { class: 'stack' });
          rows.forEach((r, i) => {
            const s = U.textInput({ label: 'Element ' + (i + 1), value: r[0], placeholder: 'symbol', onInput: v => { rows[i][0] = v.trim(); calc(); } });
            const p = U.numInput({ label: 'Mass %', value: r[1] || '', onInput: v => { rows[i][1] = v; calc(); } });
            p.input.addEventListener('input', () => { if (p.input.value === '') { rows[i][1] = 0; calc(); } });
            inputs.appendChild(h('div', { class: 'controls' }, s.el, p.el));
          });
          const mm = U.numInput({ label: 'Molar mass (optional, g/mol)', value: MM, onInput: v => { MM = v; calc(); } });
          mm.input.addEventListener('input', () => { if (mm.input.value === '') { MM = 0; calc(); } });
          b.append(h('div', { class: 'grid2' }, U.panel('Percent composition', inputs, mm.el, h('p', { class: 'small muted' }, 'Example: glucose. Assume a 100 g sample so each % becomes grams.')), out));
          function calc() {
            U.clear(out);
            const used = rows.filter(r => r[0] && r[1] > 0);
            for (const r of used) if (!ELEMENTS.bySym[r[0]]) { out.appendChild(U.callout(`“${r[0]}” is not an element symbol.`, 'bad')); return; }
            if (used.length < 2) { out.appendChild(U.callout('Enter at least two elements with their mass percents.', 'warn')); return; }
            const tot = used.reduce((t, r) => t + r[1], 0);
            const mol = used.map(r => r[1] / ELEMENTS.bySym[r[0]].mass);
            const min = Math.min(...mol);
            const ratio = mol.map(m => m / min);
            let k = 1;
            for (let t = 1; t <= 8; t++) { if (ratio.every(x => Math.abs(x * t - Math.round(x * t)) < 0.12)) { k = t; break; } if (t === 8) k = 1; }
            const ints = ratio.map(x => Math.max(1, Math.round(x * k)));
            const emp = {}; used.forEach((r, i) => emp[r[0]] = ints[i]);
            const empMass = used.reduce((t, r, i) => t + ELEMENTS.bySym[r[0]].mass * ints[i], 0);
            const tbl = U.table(['Element', 'Mass in 100 g', 'Moles', '÷ smallest', k > 1 ? '× ' + k : 'Ratio'],
              used.map((r, i) => [r[0], r[1].toFixed(2) + ' g', mol[i].toFixed(4), ratio[i].toFixed(3), ints[i]]), { num: [1, 2, 3, 4] });
            const res = [tbl, h('div', { class: 'eq', html: `Empirical formula: <b>${formulaHtml(emp)}</b> &nbsp; (empirical mass ${empMass.toFixed(2)} g/mol)` })];
            if (Math.abs(tot - 100) > 1) res.push(U.callout(`Percents add to ${tot.toFixed(1)}%, not 100%. Check the data.`, 'warn'));
            if (k > 1) res.push(U.callout(`The mole ratios were not whole numbers, so all were multiplied by ${k}.`));
            if (MM > 0) {
              const mult = MM / empMass, r = Math.round(mult);
              if (r >= 1 && Math.abs(mult - r) < 0.08) {
                const mol2 = {}; Object.keys(emp).forEach(s => mol2[s] = emp[s] * r);
                res.push(h('div', { class: 'eq', html: `${MM} ÷ ${empMass.toFixed(2)} = ${mult.toFixed(2)} ≈ ${r} → molecular formula <b>${formulaHtml(mol2)}</b>` }));
              } else res.push(U.callout(`Molar mass ÷ empirical mass = ${mult.toFixed(2)}, which is not close to a whole number.`, 'warn'));
            }
            out.appendChild(U.panel('Solution', ...res));
          }
          calc();
        },
      },
    ], scope, { key: 'moles' });
  },
});
