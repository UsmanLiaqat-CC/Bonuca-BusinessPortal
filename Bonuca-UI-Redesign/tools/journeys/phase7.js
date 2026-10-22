// Phase 7 (Employee role — operational experience) checklist journeys + scan success animation.
// Usage: node tools/journeys/phase7.js
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const root = path.join(__dirname, '..', '..');
const url = (p, q = '') => 'file://' + path.join(root, p) + q;
const results = [], errors = [];
const assert = (c, m) => { if (!c) throw new Error(m); };
async function check(name, fn) { try { await fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name + ' — ' + e.message.split('\n')[0]]); } }
const ready = p => p.waitForSelector('body[data-ready="1"]');
const txt = async (p, s) => (await p.locator(s).first().innerText()).replace(/\s+/g, ' ');
const FORBIDDEN = /dashboard|analytics|settings|billing|subscription|employees|program|wallet-|notifications|rewards|branding|customers|qr-codes|transactions/i;
const EMP = 'employee/pages/';
const empFiles = fs.readdirSync(path.join(root, EMP)).filter(f => f.endsWith('.html')).sort();
const watch = p => { p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type() === 'error' && errors.push(m.text())); return p; };
// Counts Web Audio beeps (oscillator starts) so the success sound can be asserted without speakers.
const countBeeps = () => { window.__beeps = 0; const A = window.AudioContext; if (A) window.AudioContext = class extends A { createOscillator() { const o = super.createOscillator(), s = o.start.bind(o); o.start = (...a) => { window.__beeps++; return s(...a); }; return o; } }; };
// Patches the Employee row's "Can award multiple stamps" (team row index 5) before any screen reads it.
const grantMulti = () => Object.defineProperty(window, 'DATA', { configurable: true, get() { return this.__d; }, set(v) { v.team.forEach(t => { if (t[2] === 'Employee') t[5] = true; }); this.__d = v; } });

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p = watch(await ctx.newPage());
  const anim = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  await anim.addInitScript(countBeeps);

  await check('Login "Use" Employee (employee@sample.dev) lands on employee scanner home', async () => {
    await p.goto(url('common/pages/03-login.html')); await ready(p);
    await p.click('[data-use="employee@sample.dev"]'); await p.click('form [type=submit]'); await ready(p);
    assert(p.url().includes('employee/pages/01-scanner-home.html'), p.url());
    assert(await p.locator('.scan-hero[data-scan]').count() === 1, 'big Scan button');
    assert(await p.locator('.scan-feed .list-row').count() === 3, 'last 3 scans');
    assert((await txt(p, '.topbar .biz')).includes('Eli Employee') && (await txt(p, '.role-chip')) === 'Employee', 'role badge');
  });

  await check('Employee screens 01–05 exist as specified (R6), same shared scripts with data-role="employee" (R7)', async () => {
    for (const f of ['01-scanner-home', '02-scan-result', '03-customer-info', '04-recent-scans', '05-account']) assert(empFiles.includes(f + '.html'), 'missing ' + f);
    const html = fs.readFileSync(path.join(root, EMP, '01-scanner-home.html'), 'utf8');
    assert(html.includes('data-role="employee"') && html.includes('shared/scripts/screens-ops.js'), 'shell');
    await p.goto(url(EMP + '01-scanner-home.html')); await ready(p);
    const screens = await p.evaluate(() => [...new Set(PAGES.employee.map(e => e[1]))]);
    assert(screens.every(s => ['scanner', 'customerProfile', 'recentScans', 'account'].includes(s)), 'employee registry has management screens: ' + screens);
  });

  await check('No Dashboard/Analytics/Settings/Billing/Employees/Programs reachable from employee nav or any link (and not by URL)', async () => {
    for (const f of empFiles) assert(!FORBIDDEN.test(f), 'employee file ' + f);
    for (const f of empFiles) {
      await p.goto(url(EMP + f)); await ready(p);
      const nav = await p.locator('.sidebar .nav a').allInnerTexts();
      assert(nav.join('|') === 'QR Scanner|Recent scans|Account', f + ' nav ' + nav);
      const links = await p.evaluate(() => [...document.querySelectorAll('a[href], [data-href]')].map(a => a.getAttribute('href') || a.getAttribute('data-href')));
      for (const h of links) {
        const file = h.split(/[?#]/)[0];
        assert(/^\d{2}-[\w-]+\.html$/.test(file) || file === '../../common/pages/03-login.html', f + ' links outside employee pages: ' + h);
        assert(!FORBIDDEN.test(file), f + ' links to ' + h);
      }
      assert(!(await p.locator('.trial-card a, .sidebar a[href*="49-"]').count()), f + ' plan link');
    }
    // A management screen key opened in the employee shell renders nothing of it.
    const q = watch(await ctx.newPage());
    await q.addInitScript(() => new MutationObserver((_, o) => { if (document.body) { document.body.dataset.page = '01-dashboard'; o.disconnect(); } }).observe(document, { childList: true, subtree: true }));
    await q.goto(url(EMP + '01-scanner-home.html')); await q.waitForLoadState('load');
    const t = await q.locator('body').innerText();
    assert(t.includes('Unknown page') && !/Total Members|Customer Growth/.test(t), 'manager screen rendered for employee');
    await q.close();
  });

  await check('Employees never see Preview / Override banners', async () => {
    for (const qs of ['?preview=1', '?override=2026-12-31']) {
      await p.goto(url(EMP + '01-scanner-home.html', qs)); await ready(p);
      assert(await p.locator('[data-preview-banner], [data-override-banner], [data-preview-lock]').count() === 0, qs);
      assert(!/Preview Mode|managed by Bonuca/i.test(await txt(p, 'body')), qs + ' text');
    }
  });

  await check('Customer info is limited: name, active programs, progress, available rewards — no email/phone/notes/analytics', async () => {
    for (const [c, name, must] of [['anna', 'Anna Schmidt', ['Coffee Card', '2 / 10 stamps', 'Coffee Rewards', '120 points', '1 Free Coffee']], ['leon', 'Leon Fischer', ['Coffee Card', '9 / 10 stamps']], ['vera', 'Vera Conti', ['Coffee Rewards', '237 points', 'Free Coffee']]]) {
      await p.goto(url(EMP + '03-customer-info.html', '?c=' + c)); await ready(p);
      const t = await txt(p, '#content');
      assert(t.includes(name) && t.includes('Active programs') && t.includes('Available rewards'), c + ' sections');
      for (const m of must) assert(t.includes(m), c + ' missing ' + m);
      assert(!/@|\+49|Email|Phone|Birthday|Notes|Number of scans|Last visit|Visit history|Transactions|Joined/.test(t), c + ' leaks details: ' + t);
      assert(await p.locator('#content .mini-prog').count() >= (c === 'vera' ? 0 : 1), c + ' progress');
      assert(await p.locator('#content textarea, #content .chart, #content .stat').count() === 0, c + ' notes/analytics');
    }
    // reachable from a scan result in one tap
    await p.goto(url(EMP + '07-scan-points.html')); await ready(p);
    await p.click('[data-cust-info]'); await ready(p);
    assert(p.url().includes('03-customer-info.html?c=vera') && (await txt(p, '#content')).includes('Vera Conti'), 'scan → customer info');
    // managers keep the full profile
    await p.goto(url('manager/pages/37-customer-profile.html')); await ready(p);
    const m = await txt(p, '#content');
    assert(m.includes('anna.schmidt0@example.com') && m.includes('Notes') && m.includes('Visit history') && m.includes('Transactions'), 'manager profile changed');
  });

  await check('Recent scans: time, customer, action; Account: name, role, business, language, Logout', async () => {
    await p.goto(url(EMP + '04-recent-scans.html')); await ready(p);
    const rows = await p.locator('.scan-feed .list-row').allInnerTexts();
    assert(rows.length === 5 && /Umut Martin/.test(rows[0]) && /02:24 PM/.test(rows[0]) && !rows.some(r => /Kemal Bianchi/.test(r)), 'own scans only ' + rows[0]);
    await p.goto(url(EMP + '05-account.html')); await ready(p);
    const t = await txt(p, '#content');
    for (const f of ['Name Eli Employee', 'Role Employee', 'Business Sample Business (development)', 'Language']) assert(t.includes(f), 'missing ' + f);
    assert(await p.locator('#content select option').count() === 5, 'languages');
    await p.click('[data-logout]'); await ready(p); assert(p.url().includes('common/pages/03-login.html'), 'logout');
  });

  await check('P2.4/P2.5 Multi-stamp stepper on employee scan only when permission granted (Eli default OFF)', async () => {
    await p.goto(url(EMP + '02-scan-result.html')); await ready(p);
    assert(await p.locator('[data-qty-row]').count() === 0, 'stepper without permission');
    assert((await txt(p, '[data-add-stamp]')) === 'Add stamp', 'fixed +1');
    const q = watch(await ctx.newPage()); await q.addInitScript(grantMulti);
    await q.goto(url(EMP + '02-scan-result.html')); await ready(q);
    assert(await q.locator('[data-qty-row]').count() === 1, 'no stepper with permission');
    for (let i = 0; i < 4; i++) await q.click('[data-qty="1"]');
    assert(await q.inputValue('[data-qty-in]') === '3', 'capped at program max 3');
    await q.click('[data-add-stamp]'); await q.waitForURL(/06-scan-confirmed/); await ready(q);
    assert((await txt(q, '[data-scan-confirmed]')).includes('3 stamps added (4/10)'), 'multi confirmed');
    await q.close();
  });

  await check('Every scan flow reachable from scanner home and completes in ≤ 3 taps (stays in employee pages)', async () => {
    const home = async () => { await p.goto(url(EMP + '01-scanner-home.html')); await ready(p); };
    const pick = async label => { await p.selectOption('[data-pick]', { label }); await ready(p); };
    const inEmp = () => assert(p.url().includes('/employee/pages/'), 'left employee pages: ' + p.url());
    // stamp: Scan (1) → Add stamp (2)
    await home(); await p.click('[data-scan]'); await ready(p); inEmp(); assert(p.url().includes('02-scan-result'), 'scan → 02');
    await p.click('[data-add-stamp]'); await p.waitForURL(/06-scan-confirmed/); await ready(p);
    assert((await txt(p, '[data-scan-confirmed]')).includes('Stamp added (2/10)'), 'stamp confirmed');
    // reward ready: pick Leon (1) → Add stamp (2) → Redeem Reward (3)
    await home(); await pick('Leon Fischer — Coffee Card (Stamp Card)'); await p.click('[data-add-stamp]'); await p.waitForURL(/09-scan-reward-ready/); await ready(p); inEmp();
    await p.click('[data-redeem-ready]'); assert((await txt(p, '[data-rw-status]')) === 'Redeemed', 'reward redeemed');
    // points credit: pick Vera (1) → Credit (2)
    await home(); await pick('Vera Conti — Coffee Rewards (Points Program)'); inEmp(); assert(p.url().includes('07-scan-points'), 'points');
    await p.click('[data-credit]'); await p.waitForURL(/06-scan-confirmed/); await ready(p);
    assert((await txt(p, '[data-scan-confirmed]')).includes('75 points credited (312 points)'), 'points confirmed ' + await txt(p, '[data-scan-confirmed]'));
    // points redeem: pick Vera (1) → Redeem points (2) → Redeem reward (3)
    await home(); await pick('Vera Conti — Coffee Rewards (Points Program)'); await p.click('text=Redeem points'); await ready(p); inEmp();
    assert(p.url().includes('08-scan-points-redeem'), 'redeem page'); assert(await p.locator('[data-rd-log]').count() === 0, 'log link for employee');
    await p.click('[data-redeem-pts]'); assert((await txt(p, '[data-pts-pass]')).includes('137'), 'points redeemed');
    // tier / membership: pick (1) → Record visit (2); win-back reward: pick (1) → Redeem Reward (2)
    for (const [label, file] of [['Anna Schmidt — Rewards Club (Tier Program)', '10-scan-tier'], ['Anna Schmidt — VIP Member (Membership Card)', '11-scan-membership']]) {
      await home(); await pick(label); inEmp(); assert(p.url().includes(file), file);
      await p.click('text=Record visit'); assert((await p.locator('.toast').allInnerTexts()).some(x => x.includes('Visit recorded')), file + ' visit');
      assert(await p.locator('.offer-card').count() === 0, file + ' no win-back for an active customer');
    }
    await home(); await pick('Kemal Fischer — VIP Member (Membership Card, inactive 40 days)'); inEmp();
    await p.click('.offer-card [data-scan-ok]'); assert((await p.locator('.toast').allInnerTexts()).some(x => x.includes('Reward redeemed · visit recorded')), 'membership win-back');
    // New scan returns to the scanner home
    await p.click('[data-new-scan]'); await ready(p); assert(p.url().includes('01-scanner-home'), 'new scan');
  });

  await check('Scan success animation (all roles): rotate + green check + confetti + sound, ≈0.8 s, confirmation not delayed', async () => {
    const q = watch(await anim.newPage());
    for (const f of ['employee/pages/06-scan-confirmed.html', 'manager/pages/30-scanner-confirmed.html', 'owner/pages/30-scanner-confirmed.html']) {
      await q.goto(url(f)); await ready(q);
      const s = await q.evaluate(() => { const el = document.querySelector('[data-scan-confirmed]'), cs = getComputedStyle(el); return { cls: el.classList.contains('scan-success'), name: cs.animationName, dur: parseFloat(cs.animationDuration), fx: el.querySelectorAll('.scan-fx i').length, check: !!el.querySelector('.success-burst'), text: el.innerText, vis: el.getBoundingClientRect().height > 0 }; });
      assert(s.cls && s.name === 'scanFlip' && s.dur > 0 && s.dur <= 0.8, f + ' flip ' + JSON.stringify(s));
      assert(s.fx >= 8 && s.check, f + ' confetti/check');
      assert(s.vis && /Confirmed/.test(s.text), f + ' confirmation shown immediately');
      assert(await q.evaluate(() => window.__beeps) === 0, f + ' sound without a user gesture');
      await q.waitForTimeout(950); assert(await q.locator('.scan-fx').count() === 0, f + ' effect not cleaned up');
    }
    // in-place success: state changes synchronously on the tap, effect + beep follow without blocking
    await q.goto(url('employee/pages/09-scan-reward-ready.html')); await ready(q);
    await q.click('[data-redeem-ready]');
    assert((await txt(q, '[data-rw-status]')) === 'Redeemed', 'confirmation delayed');
    assert(await q.locator('[data-stamp-pass].scan-success .scan-fx .success-burst').count() === 1, 'pass flip + check');
    assert(await q.evaluate(() => window.__beeps) === 1, 'success sound after tap');
    // reduced motion: no confetti, still confirmed
    await p.goto(url('employee/pages/06-scan-confirmed.html')); await ready(p);
    assert(await p.locator('.scan-fx').count() === 0 && (await txt(p, '[data-scan-confirmed]')).includes('Confirmed'), 'reduced motion');
    await q.close();
  });

  await check('Accept invitation (Employee) still goes to login; manager/owner scanner flows keep their own pages', async () => {
    await p.goto(url('common/pages/13-accept-invitation.html', '?role=Employee')); await ready(p);
    assert((await txt(p, '[data-invite-role]')).includes('Employee'), 'role');
    await p.fill('input[name=pw]', 'Bonuca123'); await p.fill('input[name=pw2]', 'Bonuca123'); await p.click('button[type=submit]'); await ready(p);
    assert(p.url().includes('03-login'), 'accept → login');
    for (const [r, rr] of [['manager', '60-scanner-stamp-reward-ready'], ['owner', '62-scanner-stamp-reward-ready']]) {
      await p.goto(url(`${r}/pages/28-scanner.html`)); await ready(p);
      assert(await p.locator('[data-cust-info]').count() === 0 && await p.locator('a[href^="34-"]').count() === 1, r + ' header');
      await p.selectOption('[data-pick]', { label: 'Leon Fischer — Coffee Card (Stamp Card)' }); await ready(p);
      assert(p.url().includes(`${r}/pages/29-scanner-stamp-card.html?c=leon`), r + ' pick');
      await p.click('[data-add-stamp]'); await p.waitForURL(new RegExp(rr)); await ready(p);
    }
  });

  results.forEach(([s, n]) => console.log(s, n));
  console.log('console errors:', errors.length ? errors : 'none');
  const fails = results.filter(r => r[0] === 'FAIL').length;
  console.log(`${results.length - fails}/${results.length} passed`);
  await b.close(); process.exitCode = fails || errors.length ? 1 : 0;
})();
