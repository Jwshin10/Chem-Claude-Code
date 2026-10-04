/* App shell: navigation, search, routing (#topic-id), theme, home page. Loaded last. */
'use strict';
(function () {
  const $ = s => document.querySelector(s);
  const h = U.h;
  const main = $('#main'), nav = $('#nav'), search = $('#search');
  const root = document.documentElement;
  let scope = null;

  /* ---------- theme ---------- */
  const sysDark = matchMedia('(prefers-color-scheme: dark)');
  const effectiveDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : sysDark.matches;
  const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/></svg>';
  const themeBtn = $('#themeBtn');
  const paintThemeBtn = () => { themeBtn.innerHTML = effectiveDark() ? SUN : MOON; themeBtn.title = effectiveDark() ? 'Switch to light mode' : 'Switch to dark mode'; };
  const saved = U.store.get('theme', null);
  if (saved) root.dataset.theme = saved;
  paintThemeBtn();
  themeBtn.addEventListener('click', () => {
    const t = effectiveDark() ? 'light' : 'dark';
    root.dataset.theme = t;
    U.store.set('theme', t);
    paintThemeBtn(); U.themeChanged();
  });
  sysDark.addEventListener('change', () => { paintThemeBtn(); U.themeChanged(); });

  /* ---------- mobile drawer ---------- */
  $('#menuBtn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
  $('#scrim').addEventListener('click', () => document.body.classList.remove('nav-open'));

  /* ---------- tiles ---------- */
  const unitColor = n => `var(--u${n})`;
  /* line icons drawn for each unit (24px grid, 1.7 stroke) */
  const ICON = {
    home: '<path d="M3 4h3v3H3zM18 4h3v3h-3zM3 8.5h3v3H3zM7 8.5h3v3H7zM14 8.5h3v3h-3zM18 8.5h3v3h-3zM3 13h18v3H3zM6 18.5h12V21H6z"/>',
    1: '<circle cx="12" cy="12" r="1.7" fill="currentColor"/><ellipse cx="12" cy="12" rx="9.5" ry="3.7"/><ellipse cx="12" cy="12" rx="9.5" ry="3.7" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.5" ry="3.7" transform="rotate(120 12 12)"/>',
    2: '<circle cx="5.8" cy="12" r="3.4"/><circle cx="18.2" cy="12" r="3.4"/><path d="M9.2 10.4h5.6M9.2 13.6h5.6"/>',
    3: '<circle cx="6.5" cy="7.5" r="3"/><circle cx="17.5" cy="16.5" r="3"/><path d="M9.2 9.6l5.6 4.8" stroke-dasharray="1.4 2.6"/>',
    4: '<circle cx="5.5" cy="12" r="2.6"/><path d="M10.5 12h10M17 8.5l3.5 3.5-3.5 3.5"/>',
    5: '<circle cx="12" cy="13.5" r="7"/><path d="M12 13.5V9.8M10 2.8h4M12 2.8v3.7M18.6 6.4l1.4-1.4"/>',
    6: '<path d="M10 14.3V5a2 2 0 1 1 4 0v9.3a4 4 0 1 1-4 0z"/><path d="M12 9.5v7"/>',
    7: '<path d="M3.5 9.5h17l-4.2-3.6M20.5 14.5h-17l4.2 3.6"/>',
    8: '<path d="M12 3c3.2 4.3 6 7.4 6 10.6a6 6 0 0 1-12 0C6 10.4 8.8 7.3 12 3z"/><path d="M9.3 14.5h5.4"/>',
    9: '<rect x="2.5" y="7" width="17" height="10" rx="1.5"/><path d="M21.5 10.5v3M12 8.8l-2.4 3.6h3.4l-2.4 3.6"/>',
    0: '<path d="M9 3h6M10 3v6.2L4.6 18.4A1.8 1.8 0 0 0 6.2 21h11.6a1.8 1.8 0 0 0 1.6-2.6L14 9.2V3"/><path d="M7.2 15h9.6"/>',
    left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>',
  };
  const icon = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
  /* short names printed on the topic tiles, like element names on a periodic table */
  const SHORT = { moles: 'Moles', 'mass-spec': 'Mass spec', 'periodic-table': 'Trends', 'electron-config': 'Configurations', pes: 'PES', coulomb: 'Coulomb’s law', 'bond-types': 'Bond types', 'potential-energy': 'PE curves', solids: 'Solids', lewis: 'Lewis', vsepr: 'VSEPR 3D', imf: 'IMFs', phases: 'Phases', 'gas-laws': 'Gas laws', maxwell: 'Maxwell–Boltzmann', solutions: 'Solutions', spectroscopy: 'Spectroscopy', balancer: 'Balancing', 'net-ionic': 'Net ionic', stoichiometry: 'Stoichiometry', redox: 'Redox', collision: 'Collisions', 'rate-laws': 'Rate laws', 'energy-profile': 'Mechanisms', 'heating-curve': 'Heating curves', calorimetry: 'Calorimetry', enthalpy: 'Enthalpy', equilibrium: 'Q vs K', 'le-chatelier': 'Le Châtelier', ice: 'ICE tables', ksp: 'Ksp', ph: 'pH', titration: 'Titration', buffers: 'Buffers', gibbs: 'Gibbs energy', galvanic: 'Cells', reference: 'Reference', quiz: 'Quiz' };
  const shortName = m => SHORT[m.id] || m.title;
  U.tile = (m, small) => {
    const t = h('div', { class: 'tile' + (small ? ' sm' : '') }, h('span', { class: 't-n' }, App.number(m)), h('span', { class: 't-s' }, m.sym), small ? null : h('span', { class: 't-name' }, shortName(m)));
    t.style.setProperty('--uc', unitColor(m.unit));
    return t;
  };

  /* ---------- navigation ---------- */
  const openUnits = new Set(U.store.get('openUnits', [1]));
  const navLinks = [];
  function buildNav() {
    U.clear(nav);
    nav.appendChild(h('a', { class: 'nav-home', href: '#home', 'data-id': 'home' },
      h('span', { class: 'u-num', html: icon('home') }),
      'All topics'));
    const order = App.units.filter(u => u.n !== 0).concat(App.units.filter(u => u.n === 0));
    for (const u of order) {
      const mods = App.unitModules(u.n);
      if (!mods.length) continue;
      if (u.n === 0) nav.appendChild(h('div', { class: 'nav-sep' }));
      const box = h('div', { class: 'nav-unit' + (openUnits.has(u.n) ? ' open' : '') });
      box.style.setProperty('--uc', unitColor(u.n));
      box.dataset.unit = u.n;
      const btn = h('button', { type: 'button', 'aria-expanded': openUnits.has(u.n) },
        h('span', { class: 'u-num', html: icon(u.n) }),
        h('span', { class: 'u-title' }, u.n ? h('small', null, 'Unit ' + u.n) : null, u.title),
        h('span', { class: 'chev', html: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>' }));
      btn.addEventListener('click', () => {
        box.classList.toggle('open');
        const o = box.classList.contains('open');
        btn.setAttribute('aria-expanded', o);
        o ? openUnits.add(u.n) : openUnits.delete(u.n);
        U.store.set('openUnits', [...openUnits]);
      });
      const ul = h('ul');
      for (const m of mods) {
        const a = h('a', { href: '#' + m.id, 'data-id': m.id }, h('span', { class: 'n' }, App.number(m)), h('span', null, m.title));
        navLinks.push({ a, m, li: h('li', null, a), box });
        ul.appendChild(navLinks[navLinks.length - 1].li);
      }
      box.append(btn, ul);
      nav.appendChild(box);
    }
    nav.appendChild(h('div', { class: 'nav-empty', id: 'navEmpty', hidden: true }, 'No topics match.'));
  }
  function filterNav(q) {
    q = q.trim().toLowerCase();
    let any = 0;
    const boxes = new Map();
    for (const l of navLinks) {
      const hay = (l.m.title + ' ' + l.m.desc + ' ' + l.m.tags.join(' ') + ' ' + App.number(l.m)).toLowerCase();
      const ok = !q || q.split(/\s+/).every(w => hay.includes(w));
      l.li.hidden = !ok;
      if (ok) { any++; boxes.set(l.box, true); } else if (!boxes.has(l.box)) boxes.set(l.box, false);
    }
    for (const [box, ok] of boxes) {
      box.hidden = !!q && !ok;
      if (q) box.classList.toggle('open', ok);
      else box.classList.toggle('open', openUnits.has(+box.dataset.unit));
    }
    $('#navEmpty').hidden = any > 0;
    return navLinks.filter(l => !l.li.hidden);
  }
  search.addEventListener('input', () => filterNav(search.value));
  search.addEventListener('keydown', e => {
    if (e.key === 'Enter') { const r = filterNav(search.value); if (r.length) location.hash = r[0].m.id; }
    if (e.key === 'Escape') { search.value = ''; filterNav(''); search.blur(); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'SELECT') {
      e.preventDefault();
      if (innerWidth <= 860) document.body.classList.add('nav-open');
      search.focus();
    }
  });

  /* ---------- pages ---------- */
  function renderModule(m) {
    const page = h('div', { class: 'page' });
    page.style.setProperty('--uc', unitColor(m.unit));
    const unit = App.units.find(u => u.n === m.unit);
    page.appendChild(h('header', { class: 'page-head' }, U.tile(m),
      h('div', { class: 'titles' },
        h('div', { class: 'eyebrow' }, m.unit ? `Unit ${m.unit}: ${unit.title}` : unit.title),
        h('h1', null, m.title),
        h('p', { class: 'lede' }, m.desc))));
    if (m.keyIdeas.length) {
      const d = h('details', { class: 'key-ideas', open: U.store.get('keyIdeasOpen', true) },
        h('summary', null, 'What to know for the exam'),
        h('ul', null, m.keyIdeas.map(k => h('li', { html: k }))));
      d.addEventListener('toggle', () => U.store.set('keyIdeasOpen', d.open));
      page.appendChild(d);
    }
    const body = h('div', { class: 'stack' });
    page.appendChild(body);
    main.appendChild(page);
    try { m.render(body, scope); } catch (e) {
      console.error(e);
      body.appendChild(h('div', { class: 'err' }, 'Something went wrong loading this tool: ' + e.message));
    }
    // pager
    const seq = App.units.filter(u => u.n !== 0).flatMap(u => App.unitModules(u.n)).concat(App.unitModules(0));
    const i = seq.indexOf(m);
    const pg = h('nav', { class: 'pager', 'aria-label': 'Previous and next topic' });
    const link = (t, cls, label) => h('a', { href: '#' + t.id, class: cls }, cls === 'prev' ? h('span', { html: icon('left') }) : null,
      h('span', null, h('span', { class: 'lbl' }, label), h('span', { class: 'ttl' }, h('span', { class: 'num' }, App.number(t)), t.title)), cls === 'next' ? h('span', { html: icon('right') }) : null);
    if (i > 0) pg.appendChild(link(seq[i - 1], 'prev', 'Previous topic'));
    if (i < seq.length - 1) pg.appendChild(link(seq[i + 1], 'next', 'Next topic'));
    page.appendChild(pg);
    document.title = m.title + ' – Valence';
  }

  function renderHome() {
    const page = h('div', { class: 'page' });
    const total = App.modules.filter(m => m.unit > 0).length;
    page.appendChild(h('section', { class: 'intro' },
      h('h1', null, 'Every AP Chemistry topic, as a model you can change.'),
      h('p', null, 'Pick a tile. Each topic opens a working model with the exam ideas beside it. Move the sliders, type in your own molecules or reactions, and watch what happens.'),
      h('div', { class: 'row' },
        h('a', { class: 'btn primary', href: '#' + App.unitModules(1)[0].id }, 'Start with Unit 1'),
        App.byId.quiz ? h('a', { class: 'btn', href: '#quiz' }, 'Take the practice quiz') : null),
      h('p', { class: 'hint' }, 'Press / anywhere to search the topics.')));
    const table = h('div', { class: 'ptable-topics' });
    for (const u of App.units.filter(x => x.n !== 0).concat(App.units.filter(x => x.n === 0))) {
      const mods = App.unitModules(u.n);
      if (!mods.length) continue;
      const col = h('div', { class: 'pcol', role: 'group', 'aria-label': u.n ? `Unit ${u.n}: ${u.title}` : u.title },
        h('div', { class: 'pcol-head', title: u.title }, h('span', { html: icon(u.n) }), h('span', null, u.n ? 'Unit ' + u.n : 'Extras'), h('b', null, u.short)),
        mods.map(m => {
          const a = h('a', { class: 'ptile', href: '#' + m.id, title: m.title, 'aria-label': App.number(m) + ' ' + m.title }, h('span', { class: 't-n' }, App.number(m)), h('span', { class: 't-s' }, m.sym), h('span', { class: 't-name' }, shortName(m)));
          a.style.setProperty('--uc', unitColor(u.n));
          return a;
        }));
      col.style.setProperty('--uc', unitColor(u.n));
      table.appendChild(col);
    }
    page.appendChild(table);
    page.appendChild(h('div', { class: 'home-foot' },
      h('span', null, `${total} topics across the nine AP units, plus a reference sheet and a practice quiz.`),
      h('span', null, 'Tiles share a color when they belong to the same unit, the way elements share a family.')));
    main.appendChild(page);
    document.title = 'Valence AP Chemistry';
  }

  function route() {
    const id = decodeURIComponent(location.hash.slice(1)) || 'home';
    if (scope) scope.dispose();
    scope = new U.Scope();
    U.clear(main);
    window.scrollTo(0, 0);
    const m = App.byId[id];
    if (m) renderModule(m); else renderHome();
    for (const a of nav.querySelectorAll('a[data-id]')) a.classList.toggle('active', a.dataset.id === (m ? m.id : 'home'));
    if (m) {
      const l = navLinks.find(x => x.m === m);
      if (l && !l.box.classList.contains('open') && !search.value) { l.box.classList.add('open'); openUnits.add(m.unit); }
      const act = nav.querySelector('a.active');
      if (act && act.scrollIntoView) act.scrollIntoView({ block: 'nearest' });
    }
    document.body.classList.remove('nav-open');
  }

  buildNav();
  window.addEventListener('hashchange', route);
  if (typeof MOLECULES !== 'undefined') MOLECULES.validate();
  route();
})();
