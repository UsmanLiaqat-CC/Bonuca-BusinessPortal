/* Bonuca redesign — page registry, app shell and interactions. */
(function (g) {
  const { icon, esc } = g.UI;
  const S = g.SCREENS = g.SCREENS || {};

  /* ---------- page registry: original filename → screen + options ---------- */
  const shared = [
    ['01-dashboard', 'dashboard'], ['02-dashboard-table-view', 'dashboard', { growthView: 'Table' }],
    ['03-programs-list', 'programs'], ['04-programs-choose-type', 'programs', { modal: 'programType' }], ['05-campaigns-choose-type', 'programs', { modal: 'campaignType' }],
    ['06-program-new-stamp', 'programForm', { kind: 'stamp' }], ['07-program-new-membership', 'programForm', { kind: 'membership' }], ['08-program-new-tier', 'programForm', { kind: 'tier' }], ['09-program-new-points', 'programForm', { kind: 'points' }],
    ['10-program-detail-coffee', 'programDetail', { id: 'coffee' }], ['11-program-detail-vip', 'programDetail', { id: 'vip' }], ['12-program-detail-club', 'programDetail', { id: 'club' }], ['13-program-detail-points', 'programDetail', { id: 'points' }], ['14-program-detail-lunch', 'programDetail', { id: 'lunch' }],
    ['15-program-edit', 'programForm', { kind: 'stamp', edit: true }], ['16-program-edit-master-field-warning', 'programForm', { kind: 'stamp', edit: true, warn: true }],
    ['17-campaign-new-acquisition', 'campaignForm', { kind: 'acq' }], ['18-campaign-new-acquisition-welcome-gift', 'campaignForm', { kind: 'acq', gift: true }], ['19-campaign-new-voucher', 'campaignForm', { kind: 'voucher' }],
    ['20-campaign-detail-acquisition', 'campaignDetail', { id: 'cuplid' }], ['21-campaign-detail-voucher', 'campaignDetail', { id: 'freecoffee' }],
    ['22-wallet-cards', 'walletCards'], ['23-wallet-design-coffee', 'walletDesign', { id: 'coffee' }], ['24-wallet-design-vip', 'walletDesign', { id: 'vip' }], ['25-wallet-design-club', 'walletDesign', { id: 'club' }], ['26-wallet-design-points', 'walletDesign', { id: 'points' }], ['27-wallet-design-android-preview', 'walletDesign', { id: 'points', android: true }],
    ['28-scanner', 'scanner', { state: 'idle' }], ['29-scanner-stamp-card', 'scanner', { state: 'stamp' }], ['30-scanner-confirmed', 'scanner', { state: 'confirmed' }], ['31-scanner-points-preview', 'scanner', { state: 'points' }], ['32-scanner-tier', 'scanner', { state: 'tier' }], ['33-scanner-membership', 'scanner', { state: 'membership' }],
    ['34-qr-codes', 'qrCodes'], ['35-customers', 'customers'], ['36-customers-add-dialog', 'customers', { modal: 'add' }], ['37-customer-profile', 'customerProfile'], ['38-customer-signup-fields', 'signupFields'],
    ['39-employees', 'employees'], ['40-employees-invite-dialog', 'employees', { modal: 'invite' }],
    ['41-notifications-campaigns', 'notifications', { tab: 'Manual campaigns' }], ['42-notifications-new-campaign', 'notifications', { tab: 'Manual campaigns', modal: true }], ['43-notifications-winback', 'notifications', { tab: 'Win-back automation' }], ['44-notifications-ai-tools', 'notifications', { tab: 'AI tools' }],
    ['45-rewards', 'rewards'], ['46-rewards-surprise', 'surprise'], ['47-analytics', 'analytics'], ['48-branding', 'branding'], ['49-subscription', 'subscription'],
    ['50-settings-business', 'settings', { sec: 'business' }], ['51-settings-address', 'settings', { sec: 'address' }], ['52-settings-hours', 'settings', { sec: 'hours' }], ['53-settings-logo', 'settings', { sec: 'logo' }], ['54-settings-brand-colors', 'settings', { sec: 'colors' }], ['55-settings-employees', 'settings', { sec: 'employees' }], ['56-settings-notifications', 'settings', { sec: 'notifications' }]
  ];
  const PAGES = {
    common: [['01-landing', 'landing'], ['02-landing-download-app', 'landing', { modal: true }], ['03-login', 'login'], ['04-register', 'register'], ['05-register-validation', 'register', { errors: true }], ['06-verify-email', 'verify'], ['07-onboarding-business-profile', 'onboarding1'], ['08-onboarding-plan-selection', 'onboarding2'], ['09-onboarding-first-program', 'onboarding3']],
    manager: [...shared, ['57-settings-wallet', 'settings', { sec: 'wallet' }], ['58-settings-language', 'settings', { sec: 'language' }], ['59-dashboard-dark-mode', 'dashboard', { theme: 'dark' }]],
    owner: [...shared, ['57-settings-billing', 'settings', { sec: 'billing' }], ['58-settings-wallet', 'settings', { sec: 'wallet' }], ['59-settings-language', 'settings', { sec: 'language' }], ['60-dashboard-dark-mode', 'dashboard', { theme: 'dark' }]]
  };
  g.PAGES = PAGES;

  const ROLE = {
    manager: { user: 'Mia Manager', label: 'Manager', isOwner: false },
    owner: { user: 'Sam Owner', label: 'Owner', isOwner: true }
  };
  const link = (role, prefix) => (PAGES[role].find(p => p[0].startsWith(prefix)) || [prefix])[0] + '.html';
  g.link = link;

  const NAV = [
    ['Dashboard', 'dashboard', '01-'], ['Loyalty Programs', 'stamp', '03-'], ['Wallet Cards', 'wallet', '22-'], ['QR Scanner', 'qr', '28-'], ['Customers', 'users', '35-'], ['Employees', 'badge', '39-'],
    ['Notifications', 'bell', '41-'], ['Rewards', 'gift', '45-'], ['Analytics', 'chart', '47-'], ['Branding', 'palette', '48-'], ['Subscription & Billing', 'card', '49-'], ['Settings', 'settings', '50-']
  ];
  const groups = { 0: 'Overview', 3: 'Operations', 6: 'Engagement', 9: 'Business' };

  function themeSeg() {
    return `<div class="seg icons" data-seg="theme" role="group" aria-label="Theme">${[['light', 'sun'], ['dark', 'moon'], ['system', 'monitor']].map(([t, ic]) => `<button data-theme-set="${t}" title="${t[0].toUpperCase() + t.slice(1)} theme" aria-label="${t} theme">${icon(ic, 'sm')}</button>`).join('')}</div>`;
  }
  const lang = () => `<select class="lang" aria-label="Language"><option>English</option><option>Deutsch</option><option>Türkçe</option><option>Français</option><option>Italiano</option></select>`;
  g.SHELL_BITS = { themeSeg, lang };

  function shell(ctx, nav, inner) {
    const r = ROLE[ctx.role];
    const navHtml = NAV.map(([label, ic, pre], i) => `${groups[i] ? `<div class="nav-label">${groups[i]}</div>` : ''}<a href="${link(ctx.role, pre)}" class="${label === nav ? 'active' : ''}">${icon(ic)}${label}</a>`).join('');
    return `<div class="ambient"><i></i><i></i><i></i><div class="lines"></div></div>
<div class="app">
  <aside class="sidebar" aria-label="Primary">
    <a class="brand" href="${link(ctx.role, '01-')}"><span class="brand-mark">B</span><span><div class="brand-name">Bonuca</div><div class="brand-sub">Business Portal</div></span></a>
    <nav class="nav">${navHtml}</nav>
    <div class="side-foot">
      <div class="trial-card"><span class="ring">${g.UI.ring(4 / 14, 40, 4, 'var(--color-highlight)', 'rgba(127,127,140,.3)', '10')}</span><b>Free Trial</b><span>10 days left.</span><br><a href="${link(ctx.role, '49-')}">View plans ${icon('arrowRight', 'sm')}</a></div>
    </div>
  </aside>
  <div class="main">
    <header class="topbar">
      <button class="icon-btn menu-btn" data-menu aria-label="Open navigation">${icon('menu')}</button>
      <div class="biz"><span class="avatar">S</span><div><b>Sample Business (development)</b><small>${r.user} <span class="role-chip ${r.isOwner ? 'owner' : ''}">${r.label}</span></small></div></div>
      <div class="top-actions"><span class="trial-pill">${icon('info', 'sm')}<span>Free Trial — <b>10 days left.</b></span></span>${lang()}${themeSeg()}<a class="btn btn-text btn-sm" href="../../common/pages/03-login.html">${icon('logout', 'sm')}Log out</a></div>
    </header>
    <main class="content" id="content">${inner}</main>
  </div>
</div><div class="toast-zone" aria-live="polite"></div>`;
  }

  function publicTop(extra = '') {
    return `<header class="public-top"><a class="brand" href="01-landing.html" style="padding:0"><span class="brand-mark">B</span><span class="brand-name">Bonuca</span></a><div class="row">${lang()}${themeSeg()}${extra}</div></header>`;
  }
  g.publicTop = publicTop;

  /* ---------- theme ---------- */
  function applyTheme(t) {
    let eff = t;
    if (t === 'system') eff = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.dataset.theme = eff;
    document.querySelectorAll('[data-theme-set]').forEach(b => b.classList.toggle('on', b.dataset.themeSet === t));
    document.querySelectorAll('[data-seg="theme"]').forEach(placeThumb);
  }
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { } } };

  /* ---------- segmented / tabs thumbs ---------- */
  function placeThumb(seg) {
    let th = seg.querySelector(':scope > .thumb'); if (!th) { th = document.createElement('span'); th.className = 'thumb'; seg.prepend(th); }
    const on = seg.querySelector(':scope > .on'); if (!on) { th.style.width = 0; return; }
    th.style.left = on.offsetLeft + 'px'; th.style.width = on.offsetWidth + 'px';
  }
  g.placeThumb = placeThumb;

  function toast(msg) {
    const z = document.querySelector('.toast-zone') || document.body.appendChild(Object.assign(document.createElement('div'), { className: 'toast-zone' }));
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = icon('checkCircle') + esc(msg); z.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = 0; setTimeout(() => t.remove(), 300); }, 2600);
  }
  g.toast = toast;

  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function countUp(root = document) {
    root.querySelectorAll('[data-count]').forEach(el => {
      const target = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length, suf = el.dataset.suffix || '';
      if (reduced()) { el.textContent = target.toFixed(dec) + suf; return; }
      const t0 = performance.now(), d = 1100;
      const step = now => { const p = Math.min(1, (now - t0) / d), e = 1 - Math.pow(1 - p, 3); el.textContent = (target * e).toFixed(dec) + suf; if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
  }
  g.countUp = countUp;

  function openModal(id) { const m = document.querySelector(`[data-modal="${id}"]`); if (m) { m.hidden = false; const f = m.querySelector('input,select,textarea'); f && setTimeout(() => f.focus(), 60); } }
  function closeModal(m) { m.hidden = true; }
  g.openModal = openModal;

  /* ---------- global interactions ---------- */
  function wire() {
    document.addEventListener('click', e => {
      const t = e.target;
      const btn = t.closest('.btn'); if (btn && !reduced()) { const r = btn.getBoundingClientRect(), s = document.createElement('span'); const d = Math.max(r.width, r.height); s.className = 'ripple'; s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`; btn.appendChild(s); setTimeout(() => s.remove(), 600); }
      const th = t.closest('[data-theme-set]'); if (th) { store.set('bonuca-theme', th.dataset.themeSet); applyTheme(th.dataset.themeSet); }
      const segBtn = t.closest('.seg > button'); if (segBtn) { const seg = segBtn.parentElement; if (seg.dataset.seg !== 'theme') { seg.querySelectorAll(':scope > button').forEach(b => b.classList.toggle('on', b === segBtn)); placeThumb(seg); } }
      const ct = t.closest('[data-ct] > button'); if (ct) { const id = ct.parentElement.dataset.ct; document.querySelectorAll(`[data-ct-body="${id}"] [data-view-pane]`).forEach(p => p.hidden = p.dataset.viewPane !== ct.dataset.view); }
      const tab = t.closest('.tabs > button'); if (tab) { const nav = tab.parentElement; nav.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === tab)); placeThumb(nav); nav.dispatchEvent(new CustomEvent('tab', { detail: tab.dataset.tab })); }
      const op = t.closest('[data-open]'); if (op) { e.preventDefault(); openModal(op.dataset.open); }
      const cl = t.closest('[data-close]'); if (cl) { closeModal(cl.closest('.backdrop')); }
      if (t.classList.contains('backdrop')) closeModal(t);
      const tst = t.closest('[data-toast]'); if (tst) { e.preventDefault(); toast(tst.dataset.toast); }
      const cp = t.closest('[data-copy]'); if (cp) { try { navigator.clipboard.writeText(cp.dataset.copy); } catch (x) { } toast('Link copied'); }
      const chip = t.closest('.choice-chips .chip'); if (chip) { chip.parentElement.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === chip)); }
      const ip = t.closest('.icon-picker button'); if (ip) { ip.parentElement.querySelectorAll('button').forEach(c => c.classList.toggle('on', c === ip)); const pick = ip.dataset.icon; document.querySelectorAll('.pass .stamp svg').forEach(s => s.outerHTML = icon(pick)); }
      const tc = t.closest('.type-card[data-href]'); if (tc) { location.href = tc.dataset.href; }
      const tsel = t.closest('.type-card[data-select]'); if (tsel) { tsel.parentElement.querySelectorAll('.type-card').forEach(c => c.classList.toggle('on', c === tsel)); tsel.parentElement.dispatchEvent(new CustomEvent('typechange', { detail: tsel.dataset.select, bubbles: true })); }
      const rowLink = t.closest('[data-href]:not(.type-card)'); if (rowLink && !t.closest('a,button,input,select')) location.href = rowLink.dataset.href;
      const dev = t.closest('[data-device]'); if (dev) { const col = dev.closest('.preview-col'); const android = dev.dataset.device === 'Android'; const ph = col.querySelector('[data-phone]'); ph.classList.toggle('android', android); const host = col.querySelector('[data-pass-host]'); if (host && g.__pass) { host.innerHTML = g.UI.pass({ ...g.__pass, android }); } const cap = col.querySelector('[data-cap]'); if (cap) cap.textContent = cap.textContent.replace(/ · (Apple|Google) Wallet/, android ? ' · Google Wallet' : ' · Apple Wallet'); }
      if (t.closest('[data-menu]')) document.body.classList.toggle('nav-open');
      else if (document.body.classList.contains('nav-open') && !t.closest('.sidebar')) document.body.classList.remove('nav-open');
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelectorAll('.backdrop:not([hidden])').forEach(closeModal); });
    document.addEventListener('input', e => {
      const c = e.target.closest('[data-color]'); if (c && /^#[0-9a-f]{6}$/i.test(c.value)) c.parentElement.querySelector('.swatch i').style.setProperty('--c', c.value);
      const b = e.target.closest('[data-bind-src]'); if (b) document.querySelectorAll(`[data-bind="${b.dataset.bindSrc}"]`).forEach(el => el.textContent = b.value || b.placeholder || b.dataset.fallback || '');
    });
    document.addEventListener('change', e => {
      const r = e.target.closest('[data-reveal]'); if (r) { const body = document.querySelector(r.dataset.reveal); if (body) body.hidden = !r.checked; }
    });
    // chart tooltips
    document.addEventListener('mousemove', e => {
      const el = e.target.closest('[data-tip]'); document.querySelectorAll('.tip.show').forEach(t => { if (!el || !t.parentElement.contains(el)) t.classList.remove('show'); });
      if (!el) return; const wrap = el.closest('.chart-wrap'); const tip = wrap && wrap.querySelector('.tip'); if (!tip) return;
      const [l, v] = el.dataset.tip.split('|'); tip.innerHTML = `${esc(l)}<b>${esc(v)}</b>`; const r = wrap.getBoundingClientRect(); tip.style.left = (e.clientX - r.left) + 'px'; tip.style.top = (e.clientY - r.top - 8) + 'px'; tip.classList.add('show');
    });
  }

  function render() {
    const body = document.body, role = body.dataset.role, file = body.dataset.page;
    const entry = PAGES[role].find(p => p[0] === file); if (!entry) { body.innerHTML = '<p style="padding:40px">Unknown page ' + esc(file) + '</p>'; return; }
    const [, screen, opts = {}] = entry; const ctx = { role, file, opts, owner: role === 'owner', link: pre => link(role, pre) };
    const out = S[screen](ctx);
    document.title = `${out.title || out.nav} · Bonuca`;
    body.innerHTML = role === 'common' ? out.html : shell(ctx, out.nav, out.html);
    const saved = store.get('bonuca-theme');
    applyTheme(opts.theme || (body.dataset.export ? 'system' : saved) || 'system');
    if (opts.theme) document.querySelectorAll('[data-theme-set]').forEach(b => b.classList.toggle('on', b.dataset.themeSet === opts.theme));
    document.querySelectorAll('.seg, .tabs').forEach(placeThumb);
    countUp(); out.after && out.after(ctx);
    document.querySelectorAll('.reveal-up').forEach((el, i) => el.style.setProperty('--i', i));
    document.fonts && document.fonts.ready.then(() => document.querySelectorAll('.seg, .tabs').forEach(placeThumb));
    addEventListener('resize', () => document.querySelectorAll('.seg, .tabs').forEach(placeThumb));
    body.dataset.ready = '1';
  }
  if (new URLSearchParams(location.search).has('export')) document.body && (document.body.dataset.export = '1');
  document.addEventListener('DOMContentLoaded', () => { if (new URLSearchParams(location.search).has('export')) document.body.dataset.export = '1'; wire(); render(); });
})(window);
