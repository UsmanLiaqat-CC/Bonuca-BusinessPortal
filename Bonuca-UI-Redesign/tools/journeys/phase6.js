// Phase 6 (Gifts — replaces random surprise rewards) checklist journeys.
// Usage: node tools/journeys/phase6.js
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const root = path.join(__dirname, '..', '..');
const url = (p, q = '') => 'file://' + path.join(root, p) + q;
const results = [], errors = [];
const assert = (c, m) => { if (!c) throw new Error(m); };
async function check(name, fn) { try { await fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name + ' — ' + e.message.split('\n')[0]]); } }
const ready = p => p.waitForSelector('body[data-ready="1"]');
const txt = async (p, s) => (await p.locator(s).first().innerText()).replace(/\s+/g, ' ');
const NUM = { manager: { assign: 65, group: 66, rules: 67, scan: 68 }, owner: { assign: 67, group: 68, rules: 69, scan: 70 } };
const file = (r, k) => fs.readdirSync(path.join(root, r, 'pages')).find(f => f.startsWith(NUM[r][k] + '-'));

(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type() === 'error' && errors.push(m.text()));

  await check('R6 numbering: manager 65–68, owner 67–70', async () => {
    for (const r of ['manager', 'owner']) assert(['gift-assign-dialog', 'gift-new-group', 'gift-rules', 'scanner-gift'].every((n, i) => file(r, ['assign', 'group', 'rules', 'scan'][i]) === `${NUM[r][['assign', 'group', 'rules', 'scan'][i]]}-${n}.html`), r);
  });

  await check('P6.1 Assign gift from profile → Available on profile + rewards list (+ client presets)', async () => {
    for (const r of ['manager', 'owner']) {
      await p.goto(url(`${r}/pages/37-customer-profile.html`)); await ready(p);
      await p.click('button:has-text("Assign gift")'); assert(await p.locator('[data-modal="gift"]').isVisible(), 'modal');
      const chips = await p.locator('[data-modal="gift"] [data-gf-preset] .chip').allInnerTexts();
      assert(chips.join('|') === 'Free coffee|Free dessert|20% discount|One additional stamp|100 bonus points|Free product upgrade|Birthday gift|Custom', 'presets ' + chips);
      await p.click('[data-modal="gift"] .chip:has-text("Free dessert")');
      assert(await p.inputValue('[data-modal="gift"] [data-gf-name]') === 'Free dessert', 'preset fills name');
      await p.click('[data-assign-gift]'); await p.waitForURL(/37-customer-profile\.html\?new=gift/); await ready(p);
      const row = await txt(p, '[data-profile-rewards] [data-fresh]'); assert(row.includes('Free dessert') && row.includes('Available'), 'profile row ' + row);
      assert((await txt(p, '[data-gift-assigned]')).includes('not delivered'), 'notification must be truthful');
      await p.click('[data-gift-assigned] a:has-text("View in Rewards")'); await ready(p);
      const rr = await txt(p, '[data-rrows] [data-fresh]'); assert(rr.includes('Free dessert') && rr.includes('Anna Schmidt') && rr.includes('Available') && rr.includes('Gift · Manual'), 'rewards row ' + rr);
    }
    await p.goto(url(`owner/pages/${file('owner', 'assign')}`)); await ready(p);
    assert(await p.locator('[data-modal="gift"]').isVisible(), 'owner 67 opens with the modal');
  });

  await check('P6.2 Group "Gold tier" shows the correct recipient count (demo data) + all client targets', async () => {
    await p.goto(url(`manager/pages/${file('manager', 'group')}`)); await ready(p);
    const expected = await p.evaluate(() => window.DATA.customers.filter(c => c.tier === 'Gold').length);
    assert(expected === 13, 'demo Gold customers: ' + expected);
    assert(await txt(p, '[data-gg-count]') === String(expected) && (await txt(p, '[data-gg-label]')) === 'Gold tier', 'gold count');
    const t = await txt(p, '[data-gg-targets]');
    for (const f of ['All customers', 'Most active customers', 'Customers with at least X visits', 'Customers who have not visited for X days', 'New customers', 'Customers in a specific membership tier']) assert(t.includes(f), 'missing ' + f);
    await p.click('[data-select="all"] b'); assert(await txt(p, '[data-gg-count]') === '64', 'all = 64');
    await p.click('[data-select="visits"]'); await p.fill('[data-gx="visits"]', '20');
    const v20 = await p.evaluate(() => window.DATA.customers.filter(c => c.visits >= 20).length); assert(await txt(p, '[data-gg-count]') === String(v20), 'visits>=20');
    await p.click('[data-select="tier"]'); await p.selectOption('[data-gx="tier"]', 'Gold');
    await p.click('[data-gg-send]'); await p.waitForURL(/46-rewards-surprise/); await ready(p);
    assert(await p.locator('[data-grows] [data-fresh]').count() === expected, 'one gift per Gold customer');
    assert((await txt(p, '#content')).includes(`assigned to ${expected} customers (Gold tier)`), 'group callout');
  });

  await check('P6.3 Automatic rules: the client conditions; saving adds a rule', async () => {
    await p.goto(url(`owner/pages/${file('owner', 'rules')}`)); await ready(p);
    const opts = await p.locator('[data-rule-t] option').allInnerTexts();
    assert(opts.join('|') === 'After the Xth visit|Birthday|After registration|X days without a visit|Reaching a tier|Spending amount|Points or stamps reached', 'rules ' + opts);
    await p.selectOption('[data-rule-t]', 'Reaching a tier'); assert(await p.locator('[data-rv="tier"]').isVisible() && await p.locator('[data-rv="visit"]').isHidden(), 'value field switches');
    const n = +(await txt(p, '[data-rules-n]')); await p.click('[data-rule-save]');
    assert(+(await txt(p, '[data-rules-n]')) === n + 1 && (await txt(p, '[data-rules] .option-row')).includes('When reaching Gold status'), 'rule added');
  });

  await check('P6.4/P6.6 Gift detail has every client field + options on 65/66/67', async () => {
    await p.goto(url('manager/pages/46-rewards-surprise.html')); await ready(p);
    await p.click('[data-grows] tr >> nth=0'); const d = await txt(p, '[data-gd-body]');
    for (const f of ['Gift name', 'Description', 'Business', 'Assigned customer', 'Date created', 'Activation date', 'Expiration date', 'Status', 'Terms and conditions', 'Redemption date', 'Employee who redeemed it', 'Location where it was redeemed']) assert(d.includes(f), 'detail missing ' + f);
    for (const k of ['assign', 'group', 'rules']) {
      await p.goto(url(`manager/pages/${file('manager', k)}`)); await ready(p); const t = await txt(p, '[data-gift-form]');
      for (const f of ['Single', 'Multiple', 'Minimum purchase amount', 'Valid locations', 'Combinable with other discounts', 'Specific product or category only', 'Expiration']) assert(t.includes(f), `${k} missing ${f}`);
    }
  });

  await check('P6.5 Statuses Scheduled · Available · Redeemed · Expired · Cancelled filter on 45 + 46', async () => {
    await p.goto(url('manager/pages/45-rewards.html')); await ready(p);
    const t45 = await p.locator('[data-rtabs] button').allInnerTexts();
    for (const s of ['Scheduled', 'Available', 'Redeemed', 'Expired', 'Cancelled']) assert(t45.some(x => x.startsWith(s)), '45 missing ' + s);
    await p.click('[data-rtabs] button:has-text("Cancelled")'); assert((await p.locator('[data-rrows] tr').allInnerTexts()).every(r => r.includes('Cancelled')), '45 filter');
    await p.goto(url('manager/pages/46-rewards-surprise.html')); await ready(p);
    for (const s of ['Scheduled', 'Expired']) { await p.click(`[data-gstat] button:has-text("${s}")`); const rows = await p.locator('[data-grows] tr').allInnerTexts(); assert(rows.length && rows.every(r => r.includes(s)), '46 filter ' + s); }
  });

  await check('Scheduled gift shows its activation date; expired shows Expired', async () => {
    await p.goto(url(`manager/pages/${file('manager', 'scan')}`, '?g=g2')); await ready(p);
    let t = await txt(p, '#content'); assert(t.includes('Gift scheduled') && t.includes('Available from Nov 1, 2026') && await p.locator('[data-gs-redeem]').isDisabled(), 'scheduled');
    await p.goto(url(`manager/pages/${file('manager', 'scan')}`, '?g=g4')); await ready(p);
    t = await txt(p, '#content'); assert(t.includes('Gift expired') && (await txt(p, '[data-gs-status]')) === 'Expired' && await p.locator('[data-gs-redeem]').isDisabled(), 'expired');
    await p.goto(url('manager/pages/46-rewards-surprise.html')); await ready(p);
    await p.click('[data-gstat] button:has-text("Scheduled")'); await p.click('[data-grows] tr >> nth=0');
    assert((await txt(p, '[data-gd-body]')).includes('Activation date Nov 1, 2026'), 'detail activation');
  });

  await check('P6.7 Scan never redeems without confirm; second redeem blocked if single-use', async () => {
    for (const r of ['manager', 'owner']) {
      await p.goto(url(`${r}/pages/28-scanner.html`)); await ready(p);
      await p.selectOption('[data-pick]', { label: 'Anna Schmidt — Gift (Free coffee)' }); await p.waitForURL(new RegExp(file(r, 'scan'))); await ready(p);
      assert((await txt(p, '#content')).includes('Customer has an available gift'), 'notice');
      assert((await txt(p, '[data-gs-status]')) === 'Available' && (await txt(p, '[data-gs-date]')) === '—', 'not redeemed by the scan');
      await p.click('[data-gs-redeem]'); assert(await p.locator('[data-modal="giftConfirm"]').isVisible(), 'confirm dialog');
      await p.click('[data-modal="giftConfirm"] [data-close].btn-ghost');
      assert((await txt(p, '[data-gs-status]')) === 'Available', 'cancel must not redeem');
      await p.click('[data-gs-redeem]'); await p.click('[data-gs-confirm]');
      assert((await txt(p, '[data-gs-status]')) === 'Redeemed' && await p.locator('[data-gs-redeem]').isDisabled(), 'redeemed + blocked');
      assert((await txt(p, '[data-gs-by]')) === (r === 'owner' ? 'Sam Owner' : 'Mia Manager'), 'employee recorded');
      await p.evaluate(() => document.querySelector('[data-gs-confirm]').click());
      assert((await txt(p, '[data-gs-status]')) === 'Redeemed', 'second confirm');
      await p.click('[data-gs-log]'); await ready(p);
      const row = await txt(p, '[data-glog-rows] [data-fresh]'); assert(row.includes('Redeemed') && row.includes('Free coffee') && row.includes('Sample Street 1, Berlin'), 'log ' + row);
    }
    await p.goto(url(`manager/pages/${file('manager', 'scan')}`, '?g=g3')); await ready(p);
    assert((await txt(p, '#content')).includes('Already redeemed') && await p.locator('[data-gs-redeem]').isDisabled(), 'redeemed single-use gift blocked');
    await p.goto(url('manager/pages/29-scanner-stamp-card.html')); await ready(p);
    assert((await txt(p, '#content')).includes('Customer has an available gift'), 'stamp scan shows the gift');
    await p.goto(url(`manager/pages/${file('manager', 'scan')}`, '?g=constructor')); await ready(p);
    assert((await txt(p, '#content')).includes('Free coffee'), 'bad ?g= falls back');
  });

  await check('P6.8 Activity log lists every assignment + redemption; notifications shown as not delivered', async () => {
    await p.goto(url('owner/pages/46-rewards-surprise.html', '?tab=log')); await ready(p);
    const n = await p.evaluate(() => window.DATA.gifts.length + window.DATA.gifts.filter(x => x.red).length);
    assert(await p.locator('[data-glog-rows] tr').count() === n, 'row count');
    const t = await txt(p, '[data-glog]'); assert(t.includes('Notifications not connected') && t.includes('Not delivered') && !/\bSent\b/.test(t), 'truthful notification state');
  });

  await check('P6.9/E2 No probability / frequency / reward pool UI or "surprise" wording anywhere', async () => {
    for (const r of ['manager', 'owner']) for (const f of fs.readdirSync(path.join(root, r, 'pages'))) {
      await p.goto(url(`${r}/pages/${f}`)); await ready(p);
      const t = await p.evaluate(() => document.body.innerText);
      assert(!/surprise|probability|reward pool|1 in \d+ scans/i.test(t), `${r}/${f}`);
      assert(await p.locator('input[type=range]').count() === 0, 'range ' + f);
    }
    await p.goto(url('owner/pages/46-rewards-surprise.html')); await ready(p);
    assert((await p.locator('.tabs a.on').innerText()).trim() === 'Gifts' && (await txt(p, '.nav a.active')) === 'Rewards', 'nav label stays Rewards');
  });

  await check('Preview Mode locks gift writes; bad ?gift= / raw strings are never rendered', async () => {
    await p.goto(url(`owner/pages/${file('owner', 'scan')}`, '?preview=1')); await ready(p);
    await p.click('[data-gs-redeem]', { force: true }); assert(await p.locator('[data-modal="giftConfirm"]').isHidden(), 'preview must not open confirm');
    await p.goto(url('owner/pages/37-customer-profile.html', '?new=gift&gift=coffee&n=%3Cimg%20src%3Dx%3E&d=%3Cb%3Ex')); await ready(p);
    const h = await p.locator('[data-profile-rewards]').innerHTML(); assert(!h.includes('<img') && !h.includes('<b>x') && h.includes('Free coffee'), 'raw query rendered');
    await p.goto(url('owner/pages/45-rewards.html', '?new=gift&gift=__proto__')); await ready(p);
    assert(await p.locator('[data-rrows] [data-fresh]').count() === 0, 'unknown preset ignored');
  });

  results.forEach(([s, n]) => console.log(s, n));
  console.log('console errors:', errors.length ? errors : 'none');
  const fails = results.filter(r => r[0] === 'FAIL').length;
  console.log(`${results.length - fails}/${results.length} passed`);
  await b.close(); process.exitCode = fails || errors.length ? 1 : 0;
})();
