// Phase 2 (Stamp Card) checklist journeys.
// Usage: node tools/journeys/phase2.js
const { chromium } = require('playwright'); const path = require('path');
const root = path.join(__dirname, '..', '..');
const url = (p, q = '') => 'file://' + path.join(root, p) + q;
const results = [], errors = [];
const assert = (c, m) => { if (!c) throw new Error(m); };
async function check(name, fn) { try { await fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name + ' — ' + e.message.split('\n')[0]]); } }
const ready = p => p.waitForSelector('body[data-ready="1"]');
// Opens a page whose demo data is patched before any screen reads it (file:// cannot be routed).
async function withData(ctx, patch) {
  const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message));
  await p.addInitScript(src => { const fn = eval(src); Object.defineProperty(window, 'DATA', { configurable: true, get() { return this.__d; }, set(v) { fn(v); this.__d = v; } }); }, patch.toString());
  return p;
}
const lit = p => p.locator('[data-stamp-pass] .stamp.on').count();

(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type() === 'error' && errors.push(m.text()));

  await check('P2.1/P2.2 New stamp card: Allow Multiple Stamps OFF by default; ON reveals max 3 / 5 / Unlimited / Custom; Expiry Rule removed (E5)', async () => {
    for (const r of ['manager', 'owner']) {
      await p.goto(url(`${r}/pages/06-program-new-stamp.html`)); await ready(p);
      const t = p.locator('[data-multi-toggle]'); assert(!(await t.isChecked()), 'default must be OFF');
      assert(await p.locator('[data-multi-max]').isHidden(), 'max visible while OFF');
      assert(!(await p.locator('#content').innerText()).includes('Expiry Rule'), 'Expiry Rule still present');
      await t.locator('xpath=..').click(); assert(await p.locator('[data-multi-max]').isVisible(), 'max hidden while ON');
      const chips = await p.locator('[data-max-chips] .chip').allInnerTexts(); assert(chips.join('|') === '3|5|Unlimited|Custom', 'options ' + chips);
      assert(await p.locator('[data-max-custom]').isHidden(), 'custom input shown early');
      await p.click('[data-max="Custom"]'); assert(await p.locator('[data-max-custom]').isVisible(), 'custom input hidden');
    }
  });

  await check('P2.3 Edit: shows program value and can change while running — no master-field warning', async () => {
    await p.goto(url('owner/pages/15-program-edit.html')); await ready(p);
    assert(await p.locator('[data-multi-toggle]').isChecked(), 'Coffee Card should show ON');
    assert(await p.locator('[data-max="3"].on').count() === 1, '3 should be selected');
    await p.click('[data-max="5"]'); await p.locator('[data-multi-toggle]').locator('xpath=..').click();
    await p.click('[data-save]'); assert(await p.locator('[data-modal="warn"]').isHidden(), 'master-field warning opened');
  });

  await check('P2.4 Per-employee "Can award multiple stamps" on team table + invite dialog', async () => {
    for (const r of ['owner', 'manager']) {
      await p.goto(url(`${r}/pages/40-employees-invite-dialog.html`)); await ready(p);
      assert(await p.locator('input[aria-label="Eli Employee can award multiple stamps"]:not([disabled])').count() === 1, r + ' table toggle');
      assert(await p.locator('[data-invite-multi]').isVisible(), r + ' invite option for Employee');
    }
    await p.goto(url('owner/pages/40-employees-invite-dialog.html')); await ready(p);
    await p.click('.type-card[data-select="Manager"]'); assert(await p.locator('[data-invite-multi]').isHidden(), 'option shown for Manager');
    assert(await p.evaluate(() => !window.can('employee', 'multiStamp') && window.can('manager', 'multiStamp')), 'permission rule');
  });

  await check('P2.5 Toggle OFF → scanner shows no quantity control (fixed +1)', async () => {
    const q = await withData(ctx, d => { d.programs.find(x => x.id === 'coffee').multi.on = false; });
    await q.goto(url('owner/pages/29-scanner-stamp-card.html')); await ready(q);
    assert(await q.locator('[data-qty-row]').count() === 0, 'stepper shown while OFF');
    assert((await q.locator('[data-add-stamp]').innerText()).replace(/\s+/g, ' ').trim() === 'Add stamp', 'button text');
    await q.close();
  });

  await check('P2.5 Toggle ON, max 3 → stepper capped at 3; Unlimited → no cap', async () => {
    await p.goto(url('manager/pages/29-scanner-stamp-card.html')); await ready(p);
    for (let i = 0; i < 5; i++) await p.click('[data-qty="1"]');
    assert(await p.inputValue('[data-qty-in]') === '3', 'not capped at 3');
    assert((await p.locator('[data-add-stamp]').innerText()).includes('3 stamps'), 'label');
    for (let i = 0; i < 5; i++) await p.click('[data-qty="-1"]');
    assert(await p.inputValue('[data-qty-in]') === '1', 'below 1');
    const q = await withData(ctx, d => { d.programs.find(x => x.id === 'coffee').multi.max = 'Unlimited'; });
    await q.goto(url('owner/pages/29-scanner-stamp-card.html')); await ready(q);
    for (let i = 0; i < 11; i++) await q.click('[data-qty="1"]');
    assert(await q.inputValue('[data-qty-in]') === '12', 'Unlimited capped: ' + await q.inputValue('[data-qty-in]'));
    await q.close();
  });

  await check('P2.5 Employee permission drives the stepper rule (employee screens: Phase 7)', async () => {
    const q = await withData(ctx, d => { d.team.forEach(t => { if (t[2] === 'Employee') t[5] = true; }); });
    await q.goto(url('owner/pages/29-scanner-stamp-card.html')); await ready(q);
    assert(await q.evaluate(() => window.can('employee', 'multiStamp')), 'permitted employee not allowed');
    await q.close();
  });

  await check('P2.6 Normal add: 1/10 + 2 → confirmed 3/10', async () => {
    await p.goto(url('owner/pages/29-scanner-stamp-card.html')); await ready(p);
    await p.click('[data-qty="1"]'); await p.click('[data-add-stamp]'); await p.waitForURL(/30-scanner-confirmed/); await ready(p);
    assert((await p.locator('#content').innerText()).includes('2 stamps added (3/10)'), 'confirmed text');
  });

  await check('P2.6 9/10 + 2 stamps → reward ready, new card shows 1/10; redeem requires tap; wallet preview updates', async () => {
    for (const r of ['manager', 'owner']) {
      await p.goto(url(`${r}/pages/28-scanner.html`)); await ready(p);
      await p.selectOption('[data-pick]', { label: 'Leon Fischer — Coffee Card (Stamp Card)' }); await p.waitForURL(/29-scanner/); await ready(p);
      assert(await lit(p) === 9, 'Leon should start at 9/10');
      await p.click('[data-qty="1"]'); await p.click('[data-add-stamp]');
      await p.waitForURL(/scanner-stamp-reward-ready/); await ready(p);
      assert(p.url().includes(r === 'owner' ? '62-' : '60-'), 'role numbering');
      const t = await p.locator('#content').innerText();
      assert(t.includes('Reward ready') && t.includes('1 / 10') && t.includes('carried over'), 'reward ready content');
      assert(await lit(p) === 10, 'completed card shows 10/10');
      assert((await p.locator('[data-rw-status]').innerText()).includes('Available'), 'not auto-redeemed');
      await p.click('[data-redeem-ready]');
      assert((await p.locator('[data-rw-status]').innerText()).includes('Redeemed'), 'status after redeem');
      assert(await lit(p) === 1, 'wallet preview shows new card 1/10');
      assert(await p.locator('[data-redeem-ready]').isDisabled(), 'can redeem twice');
    }
    await p.goto(url('owner/pages/62-scanner-stamp-reward-ready.html', '?c=leon&n=1')); await ready(p);
    assert((await p.locator('#content').innerText()).includes('0 / 10'), 'exact completion → new card 0/10');
  });

  await check('E11 Lifecycle: Active ⇄ Inactive only — no Archive / Paused', async () => {
    for (const f of ['10-program-detail-coffee', '14-program-detail-lunch', '20-campaign-detail-acquisition', '21-campaign-detail-voucher', '03-programs-list']) {
      await p.goto(url(`owner/pages/${f}.html`)); await ready(p);
      assert(!/Archive|Paused/.test(await p.locator('#content').innerText()), f + ' still has Archive/Paused');
    }
    assert((await p.locator('[data-filter-tabs]').innerText()).includes('Inactive'), 'Inactive filter');
  });

  results.forEach(([s, n]) => console.log(s, n));
  console.log('console errors:', errors.length ? errors : 'none');
  const fails = results.filter(r => r[0] === 'FAIL').length;
  console.log(`${results.length - fails}/${results.length} passed`);
  await b.close(); process.exitCode = fails || errors.length ? 1 : 0;
})();
