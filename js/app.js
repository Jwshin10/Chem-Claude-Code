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
  U.tile = (m, small) => {
    const t = h('div', { class: 'tile' + (small ? ' sm' : '') }, h('span', { class: 't-n' }, App.number(m)), h('span', { class: 't-s' }, m.sym));
    t.style.setProperty('--uc', unitColor(m.unit));
    return t;
  };

  /* ---------- navigation ---------- */
  const openUnits = new Set(U.store.get('openUnits', [1]));
  const navLinks = [];
  function buildNav() {
    U.clear(nav);
    nav.appendChild(h('a', { class: 'nav-home', href: '#home', 'data-id': 'home' },
      h('span', { class: 'u-num', style: { width: '26px', height: '26px', borderRadius: '7px', display: 'grid', placeItems: 'center', background: 'var(--surface-3)' }, html: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>' }),
      'Home'));
    const order = App.units.filter(u => u.n !== 0).concat(App.units.filter(u => u.n === 0));
    for (const u of order) {
      const mods = App.unitModules(u.n);
      if (!mods.length) continue;
      if (u.n === 0) nav.appendChild(h('div', { class: 'nav-sep' }));
      const box = h('div', { class: 'nav-unit' + (openUnits.has(u.n) ? ' open' : '') });
      box.style.setProperty('--uc', unitColor(u.n));
      box.dataset.unit = u.n;
      const btn = h('button', { type: 'button', 'aria-expanded': openUnits.has(u.n) },
        h('span', { class: 'u-num' }, u.n === 0 ? '★' : u.n),
        h('span', { class: 'u-title' }, u.title),
        h('span', { class: 'chev', html: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6"/></svg>' }));
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
        h('div', { class: 'eyebrow' }, m.unit ? `Unit ${m.unit} · ${unit.title}` : unit.title),
        h('h1', null, m.title),
        h('p', { class: 'lede' }, m.desc))));
    if (m.keyIdeas.length) {
      const d = h('details', { class: 'key-ideas', open: U.store.get('keyIdeasOpen', true) },
        h('summary', null, 'Key ideas for the AP exam'),
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
    if (i > 0) pg.appendChild(h('a', { href: '#' + seq[i - 1].id, class: 'prev' }, h('span', { class: 'lbl' }, '← ' + App.number(seq[i - 1])), seq[i - 1].title));
    if (i < seq.length - 1) pg.appendChild(h('a', { href: '#' + seq[i + 1].id, class: 'next' }, h('span', { class: 'lbl' }, App.number(seq[i + 1]) + ' →'), seq[i + 1].title));
    page.appendChild(pg);
    document.title = m.title + ' · AP Chem Visualizer';
  }

  function renderHome() {
    const page = h('div', { class: 'page' });
    const total = App.modules.filter(m => m.unit > 0).length;
    const heroCv = h('div');
    page.appendChild(h('section', { class: 'hero' },
      h('div', null,
        h('div', { class: 'eyebrow' }, 'AP Chemistry · Units 1–9'),
        h('h1', null, 'See the chemistry behind every AP topic.'),
        h('p', null, 'Interactive models for the whole AP Chemistry course. Build Lewis structures, spin molecules in 3D, watch intermolecular forces at work, run titrations, and build electrochemical cells. Type in your own molecules, reactions and salts to test them in the simulations. Every tool lists the key ideas you need for the exam.'),
        h('div', { class: 'row' },
          h('a', { class: 'btn primary', href: '#imf' }, 'Explore intermolecular forces'),
          h('a', { class: 'btn', href: '#lewis' }, 'Draw Lewis structures'),
          App.byId.quiz ? h('a', { class: 'btn', href: '#quiz' }, 'Practice quiz') : null),
        h('div', { class: 'hero-stats' },
          h('div', null, h('b', null, '9'), h('span', null, 'Units')),
          h('div', null, h('b', null, String(total)), h('span', null, 'Interactive tools')),
          h('div', null, h('b', null, String(MOLECULES.all.length)), h('span', null, 'Molecules')),
          h('div', null, h('b', null, '118'), h('span', null, 'Elements')))),
      heroCv));
    if (typeof Mol3D !== 'undefined') Mol3D.hero(heroCv, scope);

    const featIds = ['imf', 'lewis', 'vsepr', 'periodic-table', 'titration', 'galvanic', 'pes', 'le-chatelier'];
    const feats = featIds.map(id => App.byId[id]).filter(Boolean);
    if (feats.length) {
      page.appendChild(h('div', { class: 'section-title' }, h('h2', null, 'Popular tools')));
      page.appendChild(h('div', { class: 'featured' }, feats.map(m => {
        const a = h('a', { class: 'feat', href: '#' + m.id }, U.tile(m, true), h('div', null, h('b', null, m.title), h('span', null, 'Unit ' + m.unit)));
        a.style.setProperty('--uc', unitColor(m.unit));
        return a;
      })));
    }
    page.appendChild(h('div', { class: 'section-title' }, h('h2', null, 'All units'), h('span', { class: 'muted small' }, 'Press / to search')));
    const grid = h('div', { class: 'units-grid' });
    for (const u of App.units.filter(x => x.n !== 0).concat(App.units.filter(x => x.n === 0))) {
      const mods = App.unitModules(u.n);
      if (!mods.length) continue;
      const card = h('article', { class: 'unit-card' },
        h('header', null,
          (() => { const t = h('div', { class: 'tile sm' }, h('span', { class: 't-n' }, u.n === 0 ? '' : 'Unit'), h('span', { class: 't-s' }, u.n === 0 ? '★' : String(u.n))); t.style.setProperty('--uc', unitColor(u.n)); return t; })(),
          h('div', null, h('span', { class: 'eyebrow' }, u.n === 0 ? 'Tools' : 'Unit ' + u.n), h('h3', null, u.title))),
        h('ul', null, mods.map(m => h('li', null, h('a', { href: '#' + m.id }, h('span', { class: 'sym' }, App.number(m)), h('span', null, m.title, h('span', { class: 'd' }, m.desc)))))));
      card.style.setProperty('--uc', unitColor(u.n));
      grid.appendChild(card);
    }
    page.appendChild(grid);
    main.appendChild(page);
    document.title = 'AP Chem Visualizer';
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
