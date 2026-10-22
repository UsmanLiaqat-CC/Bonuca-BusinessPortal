// Phase 4 (Tier & Membership) checklist journeys + extras E4/E6/E7.
// Usage: node tools/journeys/phase4.js
const { chromium } = require('playwright'); const path = require('path');
const root = path.join(__dirname, '..', '..');
const url = (p, q = '') => 'file://' + path.join(root, p) + q;
const results = [], errors = [];
const assert = (c, m) => { if (!c) throw new Error(m); };
async function check(name, fn) { try { await fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name + ' — ' + e.message.split('\n')[0]]); } }
const ready = p => p.waitForSelector('body[data-ready="1"]');
const txt = async (p, s) => (await p.locator(s).innerText()).replace(/\s+/g, ' ');
// Opens a page whose Tier Program config is patched before any screen reads it (file:// cannot be routed).
async function withCfg(ctx, cfg) {
  const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type() === 'error' && errors.push(m.text()));
  await p.addInitScript(c => Object.defineProperty(window, 'DATA', { configurable: true, get() { return this.__d; }, set(v) { Object.assign(v.programs.find(x => x.id === 'club').cfg, c); this.__d = v; } }), cfg);
  return p;
}
const passBg = p => p.locator('[data-tier-pass] .pass, [data-pass-host] .pass').first().getAttribute('style');

(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type() === 'error' && errors.push(m.text()));

  await check('P4.1/P4.2 Tiers: 2–5 only (not 1 or 6); defaults Member (Default) · Silver 10 · Gold 25 · Platinum 50; Diamond as 5th', async () => {
    for (const r of ['manager', 'owner']) {
      await p.goto(url(`${r}/pages/08-program-new-tier.html`)); await ready(p);
      const n = await p.locator('[data-tier-n] option').allInnerTexts();
      assert(n.join('|') === '2|3|4|5', 'tier counts ' + n);
      const vis = async () => p.locator('[data-tier]:visible').count();
      const names = async () => p.locator('[data-tier]:visible [data-tier-name]').evaluateAll(e => e.map(x => x.value));
      const vals = async () => p.locator('[data-tier]:visible [data-tier-val]').evaluateAll(e => e.map(x => x.value));
      assert(await vis() === 4 && (await names()).join('|') === 'Member|Silver|Gold|Platinum' && (await vals()).join('|') === '0|10|25|50', 'defaults ' + await names() + ' ' + await vals());
      assert((await txt(p, '[data-tier]:visible >> nth=0')).includes('Default'), 'Member marked Default');
      await p.selectOption('[data-tier-n]', '2'); assert(await vis() === 2, '2 tiers');
      await p.selectOption('[data-tier-n]', '5'); assert(await vis() === 5 && (await names())[4] === 'Diamond', '5 tiers with Diamond');
      assert(await p.locator('[data-tier-chips] .chip').count() === 5, 'preview chips follow tier count');
      await p.locator('[data-tier-name]').nth(1).fill('Bronze'); assert((await txt(p, '[data-tier-chips]')).includes('Bronze'), 'names editable');
    }
  });

  await check('P4.3/P4.4/P4.5 Upgrade requirement Visits / Points / Total spending; spending adds Currency; points add the points rule', async () => {
    await p.goto(url('owner/pages/08-program-new-tier.html')); await ready(p);
    assert((await p.locator('[data-tier-req] option').allInnerTexts()).join('|') === 'Visits|Points|Total spending', 'requirements');
    assert(await p.locator('[data-pt-cur]').isHidden() && await p.locator('[data-pt-method]').isHidden(), 'visits: no currency / points rule');
    await p.selectOption('[data-tier-req]', 'Total spending');
    assert(await p.locator('[data-pt-cur]').isVisible() && await p.locator('[data-pt-method]').isHidden(), 'spending: currency only');
    await p.selectOption('[data-pt-cur]', 'CZK'); assert((await txt(p, '[data-tier-unit] >> nth=1')) === '(CZK)', 'unit follows currency');
    await p.selectOption('[data-tier-req]', 'Points');
    assert(await p.locator('[data-pt-cur]').isVisible() && await p.locator('[data-pt-method]').isVisible(), 'points: currency + rule');
    assert((await p.locator('[data-pt-method] option').allInnerTexts()).join('|') === 'Manual|Fixed points per visit', 'P3 awarding methods');
    assert((await txt(p, '[data-tier-unit] >> nth=1')) === '(points)', 'points unit');
  });

  await check('P4.6 Per tier: rewards & benefits, wallet colour; preview switches pass colour per tier (form + wallet design 25)', async () => {
    await p.goto(url('manager/pages/08-program-new-tier.html')); await ready(p);
    const t = await txt(p, '[data-tier] >> nth=1');
    for (const f of ['Tier Name', 'Required Value', 'Wallet Colour', 'Rewards & Benefits']) assert(t.includes(f), 'missing ' + f);
    const before = await passBg(p); await p.click('[data-tier-chips] .chip >> nth=2');
    assert(/#B8902E/i.test(await passBg(p)) && !/#B8902E/i.test(before), 'form preview → Gold colour ' + await passBg(p));
    assert((await txt(p, '[data-pass-host]')).includes('Gold'), 'tier name on pass');
    for (const r of ['manager', 'owner']) {
      await p.goto(url(`${r}/pages/25-wallet-design-club.html`)); await ready(p);
      assert(/#3A3F55/i.test(await passBg(p)), 'Member colour first');
      await p.click('[data-tier-chips] .chip:has-text("Silver")'); assert(/#8A8FA3/i.test(await passBg(p)), 'wallet becomes silver');
      await p.click('[data-tier-chips] .chip:has-text("Gold")'); assert(/#B8902E/i.test(await passBg(p)), 'wallet becomes gold');
    }
    await p.goto(url('owner/pages/12-program-detail-club.html')); await ready(p);
    const d = await txt(p, '#content');
    for (const f of ['Number of tiers 4', 'Upgrade requirement Visits', 'Level-up Automatic', 'Silver', '10 visits', 'Gold', '25 visits', 'Platinum', '50 visits']) assert(d.includes(f), 'detail missing ' + f);
  });

  await check('P4.7 Level-up is automatic: scanner shows "Upgraded to Silver/Gold" and the wallet colour changes', async () => {
    for (const [r, c, tier, col, prev] of [['manager', 'kemal', 'Silver', '#8A8FA3', '#3A3F55'], ['owner', 'umut', 'Gold', '#B8902E', '#8A8FA3']]) {
      await p.goto(url(`${r}/pages/32-scanner-tier.html`, `?c=${c}`)); await ready(p);
      assert(new RegExp(prev, 'i').test(await passBg(p)), 'start colour');
      assert(await p.locator('[data-tier-up]').isHidden(), 'upgrade shown before scan');
      assert(await p.locator('[data-tier-amount]').count() === 0, 'visits: no amount input');
      await p.click('[data-tier-go]');
      assert((await txt(p, '[data-tier-up]')).includes('Upgraded to ' + tier), 'no upgrade state');
      assert(new RegExp(col, 'i').test(await passBg(p)), 'wallet colour not switched: ' + await passBg(p));
      assert((await txt(p, '[data-tier-kv]')).includes('Current tier ' + tier), 'kv tier');
      assert(await p.locator('[data-tier-go]').isDisabled(), 'double scan possible');
    }
    await p.goto(url('manager/pages/32-scanner-tier.html')); await ready(p);
    await p.click('[data-tier-go]'); assert(await p.locator('[data-tier-up]').isHidden() && (await txt(p, '[data-tier-kv]')).includes('5 visits to Silver'), 'non-upgrade visit');
    await p.goto(url('manager/pages/28-scanner.html')); await ready(p);
    await p.selectOption('[data-pick]', { label: 'Umut Martin — Rewards Club (Tier Program)' }); await p.waitForURL(/32-scanner-tier\.html\?c=umut/);
  });

  await check('P4.4 Spend-based tier: scanner shows currency + purchase amount input; spending levels up', async () => {
    const q = await withCfg(ctx, { req: 'Total spending', currency: 'CZK', tiers: [['Member', 0, '#3A3F55', 'Welcome drink'], ['Silver', 100, '#8A8FA3', 'Free coffee upgrade'], ['Gold', 250, '#B8902E', '10% off']] });
    await q.goto(url('owner/pages/32-scanner-tier.html')); await ready(q);
    assert(await q.locator('[data-tier-amount]').isVisible(), 'amount input');
    const t = await txt(q, '#content section.card >> nth=0');
    assert(t.includes('Purchase amount (CZK)') && t.includes('Total spending 4.00 CZK') && t.includes('96.00 CZK to Silver'), 'currency/amount ' + t.slice(0, 400));
    assert(await q.locator('#content section.card select').count() === 0, 'currency selectable in scanner');
    assert(await q.locator('[data-tier-go]').isDisabled(), 'enabled without amount');
    await q.fill('[data-tier-amount]', '300'); await q.click('[data-tier-go]');
    assert((await txt(q, '[data-tier-up]')).includes('Upgraded to Gold') && /#B8902E/i.test(await passBg(q)), 'spend level-up');
    await q.close();
    await p.goto(url('owner/pages/32-scanner-tier.html')); await ready(p);
    assert(await p.locator('[data-tier-amount]').count() === 0, 'visits program shows amount input');
  });

  await check('P4.5 Points-based tier: fixed points per visit, or manual amount with the P3 rules', async () => {
    const tiers = [['Member', 0, '#3A3F55', 'Welcome drink'], ['Silver', 100, '#8A8FA3', 'Free coffee upgrade']];
    const f = await withCfg(ctx, { req: 'Points', method: 'Fixed points per visit', perVisit: 10, tiers });
    await f.goto(url('manager/pages/32-scanner-tier.html')); await ready(f);
    assert(await f.locator('[data-tier-amount]').count() === 0 && (await txt(f, '[data-tier-go]')).includes('Credit 10 points'), 'fixed');
    await f.click('[data-tier-go]'); assert((await txt(f, '[data-tier-kv]')).includes('Points 14 points'), 'fixed credited ' + await txt(f, '[data-tier-kv]'));
    await f.close();
    const m = await withCfg(ctx, { req: 'Points', method: 'Manual', currency: 'USD', basis: 1, pts: 10, rounding: 'Round down', tiers });
    await m.goto(url('manager/pages/32-scanner-tier.html', '?c=kemal')); await ready(m);
    await m.fill('[data-tier-amount]', '12.5'); assert((await txt(m, '[data-tier-go]')).includes('Credit 125 points'), '12.50 USD → 125 points');
    await m.click('[data-tier-go]'); assert((await txt(m, '[data-tier-up]')).includes('Upgraded to Silver'), 'points level-up');
    await m.close();
  });

  await check('P4.8 Membership form: Name, Benefit (e.g. 10% Discount), visuals, Terms; permanent, no stamps', async () => {
    for (const r of ['manager', 'owner']) {
      await p.goto(url(`${r}/pages/07-program-new-membership.html`)); await ready(p);
      const t = await txt(p, '#content');
      for (const f of ['Program Name', 'Benefit', 'Program Logo', 'Background', 'Text Colour', 'Terms & Conditions', 'Permanent member benefits', 'No stamps']) assert(t.includes(f), 'missing ' + f);
      assert(await p.locator('input[placeholder="e.g. 10% Discount"]').count() === 1, 'benefit example');
      await p.fill('[data-bind-src="benefit"]', '15% Discount'); assert((await txt(p, '[data-pass-host]')).includes('15% Discount'), 'benefit preview');
      await p.goto(url(`${r}/pages/11-program-detail-vip.html`)); await ready(p);
      assert((await txt(p, '#content')).includes('10% Discount'), 'detail benefit');
    }
  });

  await check('P4.9 Membership scan shows member + benefit, records a visit → visits and last visit update on scan result and customer profile', async () => {
    for (const r of ['manager', 'owner']) {
      await p.goto(url(`${r}/pages/33-scanner-membership.html`)); await ready(p);
      const t = await txt(p, '#content section.card >> nth=0');
      assert(t.includes('Anna Schmidt') && t.includes('10% Discount') && t.includes('Visits 12') && t.includes('Last visit Oct 21, 2026'), 'scan view ' + t.slice(0, 300));
      await p.click('[data-m-visit]');
      assert(await txt(p, '[data-m-visits]') === '13' && await txt(p, '[data-m-last]') === 'Just now', 'scan result not updated');
      assert(await p.locator('[data-m-visit]').isDisabled(), 'double visit possible');
      await p.click('[data-m-profile]'); await ready(p);
      assert(p.url().includes('37-customer-profile.html?visit=vip'), p.url());
      const pr = await txt(p, '#content');
      assert(pr.includes('Number of scans 13') && pr.includes('Last visit Just now') && pr.includes('13 visits'), 'profile counts ' + pr.slice(0, 300));
      assert((await txt(p, '[data-visit-history] .tl-item >> nth=0')).includes('Visit recorded · VIP Member'), 'history row');
    }
    await p.goto(url('manager/pages/37-customer-profile.html')); await ready(p);
    const base = await txt(p, '#content');
    assert(base.includes('Number of scans 12') && base.includes('VIP Member') && base.includes('Current tier: Member'), 'profile baseline ' + base.slice(0, 200));
    await p.goto(url('owner/pages/33-scanner-membership.html', '?preview=1')); await ready(p);
    await p.click('[data-m-visit]', { force: true }); assert(await txt(p, '[data-m-visits]') === '12', 'preview mode must not record');
  });

  await check('Tier visit → profile shows the new current tier', async () => {
    const q = await withCfg(ctx, { tiers: [['Member', 0, '#3A3F55', 'Welcome drink'], ['Silver', 5, '#8A8FA3', 'Free coffee upgrade']] });
    await q.goto(url('owner/pages/32-scanner-tier.html', '?override=2026-12-31')); await ready(q);
    await q.click('[data-tier-go]'); await q.click('[data-tier-profile]'); await ready(q);
    assert(q.url().includes('visit=club') && q.url().includes('override=2026-12-31'), q.url());
    assert(await txt(q, '[data-cur-tier]') === 'Silver', 'profile tier');
    await q.close();
  });

  await check('E4/E6/E7 removed: no Downgrade rule, no membership validity/renewal, no "Enable Tiers" toggle', async () => {
    for (const r of ['manager', 'owner']) for (const f of ['07-program-new-membership', '08-program-new-tier', '11-program-detail-vip', '12-program-detail-club', '24-wallet-design-vip', '25-wallet-design-club', '32-scanner-tier', '33-scanner-membership']) {
      await p.goto(url(`${r}/pages/${f}.html`)); await ready(p);
      const t = await txt(p, '#content');
      assert(!/downgrade|renews|annually|expires on|fixed end date|validity|enable tiers/i.test(t), `${r}/${f}: ` + (t.match(/downgrade|renews|annually|expires on|fixed end date|validity|enable tiers/i) || [])[0]);
    }
  });

  results.forEach(([s, n]) => console.log(s, n));
  console.log('console errors:', errors.length ? errors : 'none');
  const fails = results.filter(r => r[0] === 'FAIL').length;
  console.log(`${results.length - fails}/${results.length} passed`);
  await b.close(); process.exitCode = fails || errors.length ? 1 : 0;
})();
