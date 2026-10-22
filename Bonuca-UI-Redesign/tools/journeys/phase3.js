// Phase 3 (Points Program) checklist journeys + Phase 2 review regressions.
// Usage: node tools/journeys/phase3.js
const { chromium } = require('playwright'); const path = require('path');
const root = path.join(__dirname, '..', '..');
const url = (p, q = '') => 'file://' + path.join(root, p) + q;
const results = [], errors = [];
const assert = (c, m) => { if (!c) throw new Error(m); };
async function check(name, fn) { try { await fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name + ' — ' + e.message.split('\n')[0]]); } }
const ready = p => p.waitForSelector('body[data-ready="1"]');
const txt = async (p, s) => (await p.locator(s).innerText()).replace(/\s+/g, ' ');
// Opens a page whose points config is patched before any screen reads it (file:// cannot be routed).
async function withCfg(ctx, cfg) {
  const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
  await p.addInitScript(c => Object.defineProperty(window, 'DATA', { configurable: true, get() { return this.__d; }, set(v) { Object.assign(v.programs.find(x => x.id === 'points').cfg, c); this.__d = v; } }), cfg);
  return p;
}
async function credit(ctx, cfg, amount) {
  const p = await withCfg(ctx, cfg); await p.goto(url('owner/pages/31-scanner-points-preview.html')); await ready(p);
  await p.fill('[data-amount]', String(amount));
  const out = { kv: await txt(p, '[data-pt-kv]'), btn: await txt(p, '[data-credit]'), note: (await p.locator('[data-pt-note]').isVisible()) ? await txt(p, '[data-pt-note]') : '', disabled: await p.locator('[data-credit]').isDisabled() };
  await p.close(); return out;
}

(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type() === 'error' && errors.push(m.text()));

  await check('P3.1 Points form: client currencies, two-number earning rule, Fixed/Manual, rounding, optional limits + expiries', async () => {
    for (const r of ['manager', 'owner']) {
      await p.goto(url(`${r}/pages/09-program-new-points.html`)); await ready(p);
      const cur = await p.locator('[data-pt-cur] option').allInnerTexts();
      assert(cur.join('|') === 'EUR|USD|GBP|CZK|TRY|CHF|PLN|Other', 'currencies ' + cur);
      const t = await txt(p, '#content');
      for (const f of ['Purchase amount', 'Points awarded for that amount', 'Awarding Method', 'Rounding', 'Minimum purchase amount', 'Maximum points per transaction', 'Rewards', 'Point expiry period', 'Reward expiry period']) assert(t.includes(f), 'missing ' + f);
      assert(!/Ratio/.test(t), 'free-text ratio still present');
      assert(await txt(p, '[data-pt-rule]') === '1 EUR = 10 points', 'default rule');
      await p.selectOption('[data-pt-cur]', 'CZK'); await p.fill('[data-pt-basis]', '10'); await p.fill('[data-pt-pts]', '1');
      assert(await txt(p, '[data-pt-rule]') === '10 CZK = 1 point', 'CZK rule ' + await txt(p, '[data-pt-rule]'));
      await p.selectOption('[data-pt-cur]', 'Other'); assert(await p.locator('[data-pt-cur-other]').isVisible(), 'Other code input');
      await p.selectOption('[data-pt-method]', 'Fixed points per visit');
      assert(await p.locator('[data-pt-fixed]').first().isVisible() && await p.locator('[data-pt-basis]').isHidden(), 'Fixed reveals per-visit points');
    }
  });

  await check('P3.2 12.50 USD @ 1 USD = 10 points → 125 points; view lists the client fields; Credit X points', async () => {
    const r = await credit(ctx, { currency: 'USD' }, 12.5);
    for (const f of ['Customer Vera Conti', 'Program Coffee Rewards', 'Currency USD', 'Current balance 237 points', 'Purchase amount 12.50 USD', 'New points +125', 'New balance 362 points', 'Next reward Free Burger at 500 points', 'Points still required 138 points']) assert(r.kv.includes(f), 'missing "' + f + '" in ' + r.kv);
    assert(r.btn.includes('Credit 125 points'), r.btn);
  });

  await check('P3.2 285 CZK @ 10 CZK = 1 point, round down → 28 points (round up → 29, nearest → 29)', async () => {
    const c = { currency: 'CZK', basis: 10, pts: 1 };
    assert((await credit(ctx, { ...c, rounding: 'Round down' }, 285)).btn.includes('Credit 28 points'), 'down');
    assert((await credit(ctx, { ...c, rounding: 'Round up' }, 285)).btn.includes('Credit 29 points'), 'up');
    assert((await credit(ctx, { ...c, rounding: 'Round to nearest' }, 285)).btn.includes('Credit 29 points'), 'nearest');
  });

  await check('P3.2 Below minimum purchase → 0 points with message; above max → capped with message', async () => {
    const lo = await credit(ctx, { min: 5 }, 3);
    assert(lo.btn.includes('Credit 0 points') && lo.disabled && lo.note.includes('minimum purchase'), 'below min ' + JSON.stringify(lo));
    const hi = await credit(ctx, { max: 50 }, 10);
    assert(hi.btn.includes('Credit 50 points') && hi.note.includes('Capped'), 'cap ' + JSON.stringify(hi));
  });

  await check('P3.2 Currency is never selectable in the scanner; Fixed method needs no amount', async () => {
    await p.goto(url('manager/pages/31-scanner-points-preview.html')); await ready(p);
    assert(await p.locator('#content section.card select').count() === 0, 'select in scanner card');
    const q = await withCfg(ctx, { method: 'Fixed points per visit', perVisit: 10 });
    await q.goto(url('owner/pages/31-scanner-points-preview.html')); await ready(q);
    assert(await q.locator('[data-amount]').count() === 0 && (await txt(q, '[data-credit]')).includes('Credit 10 points'), 'fixed');
    await q.close();
  });

  await check('P3.2/P3.5 Credit is saved only after the tap → log row created with all client columns', async () => {
    await p.goto(url('owner/pages/31-scanner-points-preview.html')); await ready(p);
    assert(!p.url().includes('transactions'), 'navigated before tap');
    await p.click('[data-credit]'); await p.waitForURL(/64-points-transactions/); await ready(p);
    const head = await p.locator('thead th').allInnerTexts();
    assert(head.map(h => h.toLowerCase()).join('|') === 'customer|program|currency|purchase amount|points awarded|balance before|balance after|employee|location|date / time|status', 'columns ' + head);
    const row = await txt(p, '[data-fresh]');
    assert(row.includes('Vera Conti') && row.includes('7.50') && row.includes('+75') && row.includes('237') && row.includes('312') && row.includes('Sam Owner'), 'credit row ' + row);
  });

  await check('P3.4 Redeem deducts correctly, wallet updates, log row created', async () => {
    for (const r of ['manager', 'owner']) {
      await p.goto(url(`${r}/pages/31-scanner-points-preview.html`)); await ready(p);
      await p.click('text=Redeem points'); await ready(p);
      assert(p.url().includes(r === 'owner' ? '63-scanner-points-redeem' : '61-scanner-points-redeem'), 'numbering');
      assert(await p.locator('[data-rw-pick] .type-card[disabled]').count() === 2, 'unaffordable rewards must be disabled');
      assert((await txt(p, '[data-rd-kv]')).includes('New balance 137 points'), 'preview');
      assert((await txt(p, '[data-pts-pass]')).includes('237'), 'pass before');
      assert(await p.locator('[data-rd-log]').isHidden(), 'log link visible before redeem');
      await p.click('[data-redeem-pts]');
      assert((await txt(p, '[data-pts-pass]')).includes('137'), 'wallet pass not updated');
      assert(await p.locator('[data-redeem-pts]').isDisabled(), 'double redeem possible');
      await p.click('[data-rd-log]'); await ready(p);
      const row = await txt(p, '[data-fresh]'); assert(row.includes('−100 · Free Coffee') && row.includes('137'), 'redeem row ' + row);
    }
  });

  await check('P3.5 Log linked from points program detail and customer profile', async () => {
    for (const [f, s] of [['13-program-detail-points', 'a:has-text("Transactions")'], ['37-customer-profile', 'a:has-text("Transactions")']]) {
      await p.goto(url(`manager/pages/${f}.html`)); await ready(p); await p.click(s); await ready(p);
      assert(p.url().includes('62-points-transactions'), f);
    }
  });

  await check('P3.6 Wallet pass: balance, progress, next reward, points still required, QR, name, logo', async () => {
    await p.goto(url('owner/pages/26-wallet-design-points.html')); await ready(p);
    const t = await txt(p, '.pass');
    for (const f of ['Balance', 'Next reward', 'Points still required', 'Coffee Rewards']) assert(t.toLowerCase().includes(f.toLowerCase()), 'pass missing ' + f);
    assert(await p.locator('.pass .prog').count() >= 1 && await p.locator('.pass .pass-qr svg, .pass .pass-qr').count() >= 1 && await p.locator('.pass .pass-logo').count() >= 1, 'progress/QR/logo');
  });

  await check('E3 No "Start from Scratch" wallet option', async () => {
    for (const f of ['23-wallet-design-coffee', '24-wallet-design-vip', '25-wallet-design-club', '26-wallet-design-points', '27-wallet-design-android-preview', '22-wallet-cards', '58-settings-wallet']) {
      await p.goto(url(`owner/pages/${f}.html`)); await ready(p);
      assert(!/scratch|custom design/i.test(await txt(p, '#content')), f);
    }
  });

  await check('Phase 2 review: carry-over never exceeds the card; bad ?c= cannot crash; bare 62 shows 9+2 example', async () => {
    await p.goto(url('owner/pages/62-scanner-stamp-reward-ready.html', '?c=leon&n=25')); await ready(p);
    const t = await txt(p, '#content'); assert(t.includes('New card 4 / 10') && t.includes('3 × 1 Free Coffee'), '9+25 → 3 rewards, new card 4/10: ' + t.slice(0, 300));
    await p.goto(url('owner/pages/29-scanner-stamp-card.html', '?c=constructor')); await ready(p);
    assert((await txt(p, '#content')).includes('Anna Schmidt'), 'fallback customer');
    await p.goto(url('owner/pages/62-scanner-stamp-reward-ready.html')); await ready(p);
    const d = await txt(p, '#content'); assert(d.includes('Leon Fischer') && d.includes('New card 1 / 10'), 'bare default');
    await p.goto(url('owner/pages/29-scanner-stamp-card.html', '?override=2026-12-31')); await ready(p);
    await p.click('[data-add-stamp]'); await p.waitForURL(/30-scanner-confirmed/);
    assert(p.url().includes('override=2026-12-31'), 'override state lost: ' + p.url());
  });

  results.forEach(([s, n]) => console.log(s, n));
  console.log('console errors:', errors.length ? errors : 'none');
  const fails = results.filter(r => r[0] === 'FAIL').length;
  console.log(`${results.length - fails}/${results.length} passed`);
  await b.close(); process.exitCode = fails || errors.length ? 1 : 0;
})();
