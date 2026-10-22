// Phase 1 (Auth, Roles & Access States) checklist journeys.
// Usage: node tools/journeys/phase1.js
const { chromium } = require('playwright'); const path = require('path');
const root = path.join(__dirname, '..', '..');
const url = (p, q = '') => 'file://' + path.join(root, p) + q;
const MSG = 'Select a free trial, free plan, or paid plan to use this feature.';
const results = []; const errors = [];

async function check(name, fn) {
  try { await fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name + ' — ' + e.message.split('\n')[0]]); }
}
const assert = (c, m) => { if (!c) throw new Error(m); };
const ready = p => p.waitForSelector('body[data-ready="1"]');
const toastHas = async (p, t) => (await p.locator('.toast').allInnerTexts()).some(x => x.includes(t));

(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type() === 'error' && errors.push(m.text()));

  await check('P1.1 Forgot → sent → reset → login flow', async () => {
    await p.goto(url('common/pages/03-login.html')); await ready(p);
    await p.click('text=Forgot password?'); await ready(p); assert(p.url().includes('10-forgot-password'), 'login link');
    await p.click('button[type=submit]'); assert(await p.locator('.error-msg').count() === 1, 'empty email must error');
    await p.fill('input[name=email]', 'sam@cafe.dev'); await p.click('button[type=submit]'); await ready(p);
    assert(p.url().includes('11-forgot-password-sent'), 'sent screen');
    await p.click('text=Open reset link'); await ready(p); assert(p.url().includes('12-reset-password'), 'reset screen');
    await p.fill('input[name=pw]', 'short'); await p.fill('input[name=pw2]', 'other'); await p.click('button[type=submit]');
    assert(await p.locator('.error-msg').count() === 2, 'weak + mismatch errors');
    await p.fill('input[name=pw]', 'Bonuca123'); await p.fill('input[name=pw2]', 'Bonuca123'); await p.click('button[type=submit]'); await ready(p);
    assert(p.url().includes('03-login'), 'back to login'); assert(await toastHas(p, 'Password updated'), 'confirmation toast');
  });

  await check('P1.2 Invitation link opens accept screen; role shown correctly', async () => {
    await p.goto(url('owner/pages/40-employees-invite-dialog.html')); await ready(p);
    await p.click('.type-card[data-select="Manager"]');
    await p.click('[data-invite-link]'); await ready(p);
    assert(p.url().includes('13-accept-invitation'), 'accept screen');
    assert((await p.locator('[data-invite-role]').innerText()).includes('Manager'), 'Manager role shown');
    assert((await p.locator('.kv').first().innerText()).includes('Sample Business'), 'business name shown');
    await p.goto(url('manager/pages/40-employees-invite-dialog.html')); await ready(p);
    await p.click('[data-invite-link]'); await ready(p);
    assert((await p.locator('[data-invite-role]').innerText()).includes('Employee'), 'Employee role shown');
    await p.fill('input[name=pw]', 'Bonuca123'); await p.fill('input[name=pw2]', 'Bonuca123'); await p.click('button[type=submit]'); await ready(p);
    assert(p.url().includes('03-login'), 'accept → login');
  });

  await check('P1.3 Manager nav has no Subscription/Billing; Owner has both', async () => {
    await p.goto(url('manager/pages/01-dashboard.html')); await ready(p);
    assert(!(await p.locator('.sidebar .nav').innerText()).includes('Subscription'), 'manager nav shows Subscription');
    assert(await p.locator('.sidebar a[href*="49-"]').count() === 0, 'manager has a link to 49');
    await p.goto(url('manager/pages/50-settings-business.html')); await ready(p);
    assert(!(await p.locator('#content nav').innerText()).includes('Billing'), 'manager settings shows Billing');
    await p.goto(url('manager/pages/49-subscription.html')); await ready(p);
    assert((await p.locator('#content').innerText()).includes('Your role does not have access'), 'manager 49 not locked');
    assert(await p.locator('#content .plan').count() === 0, 'manager 49 shows plans');
    await p.goto(url('owner/pages/01-dashboard.html')); await ready(p);
    assert((await p.locator('.sidebar .nav').innerText()).includes('Subscription & Billing'), 'owner nav');
    await p.goto(url('owner/pages/50-settings-business.html')); await ready(p);
    assert((await p.locator('#content nav').innerText()).includes('Billing'), 'owner settings Billing');
  });

  await check('P1.3 "Can manage employees" per Manager — Owner editable, Manager read-only; no leaderboard (E8)', async () => {
    await p.goto(url('owner/pages/39-employees.html')); await ready(p);
    assert(await p.locator('input[aria-label="Mia Manager can manage employees"]:not([disabled])').count() === 1, 'owner toggle editable');
    assert(!(await p.locator('#content').innerText()).toLowerCase().includes('leaderboard'), 'leaderboard still present');
    await p.goto(url('manager/pages/39-employees.html')); await ready(p);
    assert(await p.locator('input[aria-label="Mia Manager can manage employees"][disabled]').count() === 1, 'manager toggle read-only');
    // Without the permission the Manager loses the Employees nav, settings item and both screens.
    const q = await ctx.newPage();
    await q.addInitScript(() => Object.defineProperty(window, 'DATA', { configurable: true, get() { return this.__d; }, set(v) { v.team.forEach(t => { if (t[2] === 'Manager') t[4] = false; }); this.__d = v; } }));
    for (const f of ['39-employees', '55-settings-employees']) {
      await q.goto(url(`manager/pages/${f}.html`)); await ready(q);
      assert(!(await q.locator('.sidebar .nav').innerText()).includes('Employees'), 'manager nav shows Employees without permission');
      assert((await q.locator('#content').innerText()).includes('Your role does not have access'), f + ' not locked without permission');
    }
    await q.close();
    for (const f of ['owner/pages/55-settings-employees.html', 'manager/pages/55-settings-employees.html']) {
      await p.goto(url(f)); await ready(p);
      assert(!(await p.locator('#content').innerText()).toLowerCase().includes('leaderboard'), f + ' leaderboard');
    }
  });

  await check('P1.4 Preview mode: every locked action shows the exact message', async () => {
    await p.goto(url('common/pages/08-onboarding-plan-selection.html')); await ready(p);
    await p.click('a:has-text("Skip for now")'); await ready(p);
    assert(p.url().includes('61-dashboard-preview-mode'), 'skip → preview dashboard');
    assert((await p.locator('#content').innerText()).includes('Preview Mode — demo data'), 'demo-data indicator');
    // Every section stays viewable with the preview state carried through navigation.
    const navHrefs = await p.locator('.sidebar .nav a').evaluateAll(as => as.map(a => a.getAttribute('href')));
    assert(navHrefs.every(h => h.endsWith('?preview=1')), 'nav keeps preview state');
    let locked = 0;
    for (const h of navHrefs) {
      await p.goto(url('owner/pages/' + h.split('?')[0], '?preview=1')); await ready(p);
      const els = p.locator('[data-preview-lock]:visible'); const n = await els.count(); locked += n;
      for (let i = 0; i < n; i++) {
        const el = els.nth(i); const before = p.url();
        await el.click({ force: true });
        assert(await toastHas(p, MSG), `message missing on ${h} #${i}`); assert(p.url() === before, 'locked action navigated on ' + h);
        assert(await p.locator('.backdrop:not([hidden])').count() === 0 || h.includes('dialog'), 'locked action opened a dialog on ' + h);
        await p.evaluate(() => document.querySelectorAll('.toast').forEach(t => t.remove()));
      }
    }
    assert(locked > 20, 'too few locked actions: ' + locked);
    await p.goto(url('owner/pages/52-settings-hours.html', '?preview=1')); await ready(p);
    const tg = p.locator('[data-open-day]').first(); const was = await tg.isChecked();
    // force: Playwright retargets label clicks to the aria-disabled input and would wait forever.
    await tg.locator('xpath=..').click({ force: true }); assert(await tg.isChecked() === was, 'setting toggle changed in preview');
    assert(await toastHas(p, MSG), 'toggle message');
    // Always able to log out and open plans; choosing a plan leaves preview.
    assert(await p.locator('.topbar a[href*="03-login"]:not([data-preview-lock])').count() === 1, 'logout available');
    await p.goto(url('owner/pages/49-subscription.html', '?preview=1')); await ready(p);
    await p.click('text=Choose Free Plan'); await ready(p);
    assert(p.url().endsWith('01-dashboard.html'), 'choose plan exits preview: ' + p.url());
    assert(!(await p.locator('.topbar').innerText()).includes('Preview Mode'), 'still preview after choosing plan');
  });

  await check('P1.4 Preview applies to the Owner only; normal mode unaffected', async () => {
    await p.goto(url('manager/pages/03-programs-list.html', '?preview=1')); await ready(p);
    assert(await p.locator('[data-preview-lock]').count() === 0, 'manager locked by preview');
    await p.goto(url('owner/pages/03-programs-list.html')); await ready(p);
    assert(await p.locator('[data-preview-lock]').count() === 0, 'owner locked without preview');
  });

  await check('P1.5 Override banner visible and not editable', async () => {
    for (const f of ['01-dashboard', '49-subscription', '57-settings-billing']) {
      await p.goto(url(`owner/pages/${f}.html`, '?override=2026-12-31')); await ready(p);
      const bn = p.locator('[data-override-banner]');
      assert(await bn.count() === 1, 'banner missing on ' + f);
      const t = await bn.innerText();
      assert(t.includes('Your plan is currently managed by Bonuca') && t.includes('Dec 31, 2026'), 'banner text on ' + f);
      assert(await bn.locator('button, input, select, textarea, a').count() === 0, 'banner has controls on ' + f);
    }
    await p.goto(url('owner/pages/49-subscription.html', '?override=2026-12-31')); await ready(p);
    assert(await p.locator('#content .plan .btn:not([disabled])').count() === 0, 'plan changes still possible under override');
    await p.goto(url('owner/pages/01-dashboard.html', '?override=2026-99-99')); await ready(p);
    assert(!(await p.locator('[data-override-banner]').innerText()).includes('Invalid'), 'invalid date rendered');
    await p.goto(url('owner/pages/03-programs-list.html', '?preview=0')); await ready(p);
    assert(await p.locator('[data-preview-lock]').count() === 0, '?preview=0 enabled preview');
    await p.goto(url('owner/pages/01-dashboard.html', '?override')); await ready(p);
    assert(!(await p.locator('[data-override-banner]').innerText()).includes('Until'), 'no end date when none set');
    await p.goto(url('manager/pages/01-dashboard.html', '?override=2026-12-31')); await ready(p);
    assert(await p.locator('[data-override-banner]').count() === 0, 'manager sees billing banner');
  });

  await check('P1.6 Plan selection: Free / Free Trial / paid + Skip for now', async () => {
    await p.goto(url('common/pages/08-onboarding-plan-selection.html')); await ready(p);
    const t = await p.locator('.plan h3').allInnerTexts();
    assert(t.join('|') === 'Free Plan|Free Trial|Pro Plan', 'plans: ' + t.join('|'));
    assert(await p.locator('a:has-text("Skip for now")').count() === 1, 'skip');
  });

  results.forEach(([s, n]) => console.log(s, n));
  console.log('console errors:', errors.length ? errors : 'none');
  const fails = results.filter(r => r[0] === 'FAIL').length;
  console.log(`${results.length - fails}/${results.length} passed`);
  await b.close(); process.exitCode = fails || errors.length ? 1 : 0;
})();
