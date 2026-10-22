// Phase 5 (Campaigns, Vouchers & Win-back Scan) checklist journeys.
// Usage: node tools/journeys/phase5.js
const { chromium } = require('playwright'); const path = require('path');
const root = path.join(__dirname, '..', '..');
const url = (p, q = '') => 'file://' + path.join(root, p) + q;
const results = [], errors = [];
const assert = (c, m) => { if (!c) throw new Error(m); };
async function check(name, fn) { try { await fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name + ' — ' + e.message.split('\n')[0]]); } }
const ready = p => p.waitForSelector('body[data-ready="1"]');
const txt = async (p, s) => (await p.locator(s).first().innerText()).replace(/\s+/g, ' ');
const stampsOn = p => p.locator('[data-pass-host="card"] .stamp.on').count();

(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type() === 'error' && errors.push(m.text()));

  await check('P5.1 Starting stamps 0 / 1 / 2 / 3 / Custom — preset and custom both reflect on the issued card', async () => {
    for (const r of ['manager', 'owner']) {
      // Lunch Card is a Draft (not linkable) until published — publish it in demo memory first.
      await p.goto(url(`${r}/pages/17-campaign-new-acquisition.html`)); await p.evaluate(() => sessionStorage.removeItem('bonuca-program-status')); await p.reload(); await ready(p);
      assert(!(await p.locator('[data-camp-prog] option').allInnerTexts()).includes('Lunch Card'), 'draft program offered');
      await p.evaluate(() => sessionStorage.setItem('bonuca-program-status', JSON.stringify({ lunch: 'Active' }))); await p.reload(); await ready(p);
      const chips = await p.locator('[data-start-chips] .chip').allInnerTexts();
      assert(chips.join('|') === 'Start with 0 stamps|Start with 1 stamp|Start with 2 stamps|Start with 3 stamps|Custom number of starting stamps', 'chips ' + chips);
      assert(await stampsOn(p) === 0, 'default 0');
      await p.selectOption('[data-camp-prog]', 'Coffee Card');
      await p.click('[data-start="2"]'); assert(await stampsOn(p) === 2, 'preset 2 → ' + await stampsOn(p));
      await p.click('[data-start="3"]'); assert(await stampsOn(p) === 3, 'preset 3');
      assert(await p.locator('[data-start-custom]').isHidden(), 'custom input visible for preset');
      await p.click('[data-start="Custom"]'); assert(await p.locator('[data-start-custom]').isVisible(), 'custom input hidden');
      await p.fill('[data-start-custom]', '5'); assert(await stampsOn(p) === 5, 'custom 5 → ' + await stampsOn(p));
      await p.selectOption('[data-camp-prog]', 'Lunch Card'); assert(await p.locator('[data-pass-host="card"] .stamp').count() === 8 && await stampsOn(p) === 5, 'Lunch Card 5/8');
      await p.click('[data-device="Android"] >> nth=0'); assert(await stampsOn(p) === 5, 'device switch lost stamps');
    }
    await p.goto(url('owner/pages/20-campaign-detail-acquisition.html')); await ready(p);
    assert(await stampsOn(p) === 2 && (await txt(p, '#content')).includes('Starting stamps 2'), 'detail: issued card has 2 starting stamps');
  });

  await check('P5.2 Welcome gift presets + reward name, description, validity period, redemption conditions', async () => {
    await p.goto(url('manager/pages/18-campaign-new-acquisition-welcome-gift.html')); await ready(p);
    const g = await p.locator('[data-gift-chips] .chip').allInnerTexts();
    assert(g.join('|') === 'Free coffee on your next visit|Free croissant|Free dessert|20% discount|Custom reward', 'presets ' + g);
    const t = await txt(p, '#giftBody');
    for (const f of ['Reward Name', 'Description', 'Validity Period', 'Redemption Conditions']) assert(t.includes(f), 'missing ' + f);
    assert(await p.inputValue('[data-gift-name]') === 'Free coffee on your next visit', 'default preset name');
    await p.click('[data-gift="Free croissant"]'); assert((await txt(p, '[data-pass-host="gift"]')).includes('Free croissant'), 'voucher pass follows preset');
    await p.fill('[data-gift-days]', '30'); assert((await txt(p, '[data-pass-host="gift"]')).includes('30 days later'), 'validity on pass');
    await p.click('[data-gift="Custom reward"]'); assert(await p.inputValue('[data-gift-name]') === '', 'custom clears name');
    await p.fill('[data-gift-name]', 'Free muffin'); assert((await txt(p, '[data-pass-host="gift"]')).includes('Free muffin'), 'custom name on pass');
    await p.goto(url('manager/pages/17-campaign-new-acquisition.html')); await ready(p);
    assert(await p.locator('[data-gift-preview]').isHidden() && await p.locator('#giftBody').isHidden(), 'gift off by default on 17');
    await p.click('[data-gift-toggle] + span, label.toggle:has([data-gift-toggle])');
    assert(await p.locator('[data-gift-preview]').isVisible() && await p.locator('#giftBody').isVisible(), 'toggle on reveals gift + second pass');
  });

  await check('P5.3 Welcome gift creates a second pass — campaign detail shows the stamp card AND a separate voucher pass', async () => {
    for (const r of ['manager', 'owner']) {
      await p.goto(url(`${r}/pages/20-campaign-detail-acquisition.html`)); await ready(p);
      assert(await p.locator('[data-pass-host] .pass').count() === 2, 'two passes');
      assert((await txt(p, '[data-pass-host="card"]')).includes('Coffee Card'), 'pass 1 stamp card');
      const v = await txt(p, '[data-pass-host="gift"]'); assert(v.includes('Free coffee on your next visit') && v.includes('Welcome gift'), 'pass 2 voucher ' + v);
      await p.locator('[data-gift-preview] [data-device="Android"]').click();
      assert((await txt(p, '[data-pass-host="gift"]')).includes('Free coffee on your next visit') && await stampsOn(p) === 2, 'device toggle mixed up passes');
    }
  });

  await check('P5.4 ❓ Existing card holder → no duplicate, "You already have this card" (default shown on 20)', async () => {
    await p.goto(url('manager/pages/20-campaign-detail-acquisition.html')); await ready(p);
    assert((await txt(p, '[data-dup-card]')).includes('You already have this card'), 'message');
  });

  await check('P5.5/P5.6 One-time voucher: printable QR formats, claim & redeem once, redeemed pass invalid', async () => {
    await p.goto(url('owner/pages/19-campaign-new-voucher.html')); await ready(p);
    assert((await txt(p, '#content')).includes('redeemable once'), '19 once');
    await p.goto(url('owner/pages/21-campaign-detail-voucher.html')); await ready(p);
    const f = await p.locator('.qr-panel select option').allInnerTexts();
    assert(f.join('|') === 'Poster|Flyer|Cup|Receipt|Advertisement', 'formats ' + f);
    const t = await txt(p, '#content'); assert(t.includes('Claim once · redeem once') && t.includes('marked Redeemed in the Wallet'), 'once copy');
    assert(await p.locator('[data-claims] tbody tr').count() === 11 && (await txt(p, '[data-claims]')).includes('Felix Bernard'), 'claims list');
    assert(await p.locator('[data-pass-host] .pass-qr').count() === 1, 'available pass has QR');
    await p.click('[data-vs="Redeemed"]');
    assert((await txt(p, '[data-pass-host]')).includes('Redeemed · no longer valid') && await p.locator('[data-pass-host] .pass-qr').count() === 0, 'redeemed pass state');
    await p.click('[data-device="Android"]'); assert((await txt(p, '[data-pass-host]')).includes('Redeemed'), 'device switch kept redeemed');
  });

  await check('P5.7 Voucher scan: name, valid dates, status, Redeem; second redeem of the same voucher → "Already redeemed"', async () => {
    for (const [r, n] of [['manager', '63'], ['owner', '65']]) {
      const q = await ctx.newPage(); q.on('pageerror', e => errors.push(e.message)); q.on('console', m => m.type() === 'error' && errors.push(m.text()));
      await q.goto(url(`${r}/pages/${n}-scanner-voucher.html`, '?c=anna')); await ready(q);
      const kv = await txt(q, '[data-v-kv]');
      for (const s of ['Voucher 1 Free Coffee', 'Campaign Free Coffee Campaign', 'Valid from Sep 11, 2026', 'Valid to Dec 10, 2026', 'Status Available']) assert(kv.includes(s), 'missing ' + s + ' in ' + kv);
      assert(await q.locator('[data-v-error]').count() === 0, 'error before redeem');
      await q.click('[data-redeem-voucher]');
      assert((await txt(q, '[data-v-kv]')).includes('Status Redeemed') && (await txt(q, '[data-v-pass]')).includes('Redeemed') && await q.locator('[data-redeem-voucher]').isDisabled(), 'redeemed in place');
      await q.reload(); await ready(q); // the same voucher scanned again
      assert((await txt(q, '[data-v-error]')).includes('Already redeemed') && await q.locator('[data-redeem-voucher]').count() === 0, 'second redeem not blocked');
      await q.close();
    }
    await p.goto(url('owner/pages/65-scanner-voucher.html', '?c=felix')); await ready(p);
    assert((await txt(p, '[data-v-error]')).includes('Oct 5, 2026') && (await txt(p, '[data-v-kv]')).includes('Status Redeemed'), 'felix already redeemed');
    await p.goto(url('owner/pages/65-scanner-voucher.html', '?c=constructor')); await ready(p);
    assert((await txt(p, '#content')).includes('Anna Schmidt'), 'bad ?c= fallback');
  });

  await check('P5.8 Win-back scan exactly: Customer · Inactive for · Active reward · Status → Redeem Reward resets inactive days to 0 (scan + profile)', async () => {
    for (const [r, n] of [['manager', '64'], ['owner', '66']]) {
      await p.goto(url(`${r}/pages/${n}-scanner-winback.html`)); await ready(p);
      const kv = await txt(p, '[data-wb-kv]');
      assert(kv === 'Customer Kemal Fischer Inactive for 40 days Active reward Free coffee Status Not redeemed', 'kv ' + kv);
      assert(await p.locator('[data-wb-profile]').isHidden(), 'profile link before redeem');
      await p.click('[data-wb-redeem]');
      const after = await txt(p, '[data-wb-kv]');
      assert(after.includes('Inactive for 0 days') && after.includes('Status Redeemed') && after.includes('Last visit Today · visit recorded'), 'after ' + after);
      assert(await p.locator('[data-wb-redeem]').isDisabled(), 'can redeem twice');
      await p.click('[data-wb-profile]'); await ready(p);
      assert(p.url().includes('37-customer-profile') && p.url().includes('c=kemal'), 'profile url ' + p.url());
      const t = await txt(p, '#content');
      assert(t.includes('Kemal Fischer') && t.includes('Inactive for 0 days') && t.includes('Visit recorded') && (await txt(p, '[data-last-visit]')) === 'Oct 21, 2026', 'profile after ' + t.slice(0, 400));
      assert((await txt(p, '[data-rewards]')).includes('Free coffee win-back Redeemed'), 'reward redeemed on profile');
    }
    await p.goto(url('manager/pages/37-customer-profile.html', '?c=kemal')); await ready(p);
    assert((await txt(p, '[data-inactive-days]')) === '40' && (await txt(p, '[data-last-visit]')) === 'Sep 11, 2026', 'profile before redeem');
    await p.goto(url('manager/pages/37-customer-profile.html')); await ready(p);
    const d = await txt(p, '#content'); assert(d.includes('Anna Schmidt') && d.includes('12 visits') && !d.includes('Inactive for'), 'default profile changed');
    await p.goto(url('owner/pages/32-scanner-tier.html')); await ready(p);
    assert((await txt(p, '[data-wb-kv]')).includes('Inactive for 22 days'), '32 offer uses client labels');
    await p.click('[data-wb-redeem]'); assert((await txt(p, '[data-wb-kv]')).includes('Inactive for 0 days'), '32 offer redeem');
  });

  await check('P5.9 Win-back config 14 / 30 / 40 / 60 days — each stage has a message + reward', async () => {
    for (const f of ['manager/pages/43-notifications-winback.html', 'owner/pages/43-notifications-winback.html']) {
      await p.goto(url(f)); await ready(p);
      const days = await p.locator('.j-card input[type=number]').evaluateAll(els => els.map(e => e.value));
      assert(days.join('|') === '14|30|40|60', 'days ' + days);
      const msgs = await p.locator('[data-wb-msg]').evaluateAll(els => els.map(e => [e.value, e.placeholder]));
      assert(msgs.length === 4 && msgs.every(([v, ph]) => v.startsWith('We miss you!') && ph === 'We miss you! Visit us this week and enjoy 20% off your order.'), 'messages ' + JSON.stringify(msgs));
      assert(await p.locator('.j-card:has-text("Offer (becomes the active reward)")').count() === 4, 'reward per stage');
      assert((await txt(p, '#content')).includes('Each notification also creates a matching active reward'), 'active reward copy');
    }
  });

  await check('Scanner dev picker on 28 reaches the new scans (role-aware numbering, access state kept)', async () => {
    for (const [r, v, w] of [['manager', '63', '64'], ['owner', '65', '66']]) {
      await p.goto(url(`${r}/pages/28-scanner.html`)); await ready(p);
      await p.selectOption('[data-pick]', { label: 'Felix Bernard — Free Coffee Campaign (One-time voucher, already redeemed)' }); await p.waitForURL(new RegExp(v + '-scanner-voucher')); await ready(p);
      assert(p.url().includes('c=felix'), 'felix param');
      await p.goto(url(`${r}/pages/28-scanner.html`, r === 'owner' ? '?override=2026-12-31' : '')); await ready(p);
      await p.selectOption('[data-pick]', { label: 'Kemal Fischer — Win-back reward (inactive 40 days)' }); await p.waitForURL(new RegExp(w + '-scanner-winback')); await ready(p);
      if (r === 'owner') assert(p.url().includes('override=2026-12-31'), 'override state lost ' + p.url());
      await p.goto(url(`${r}/pages/28-scanner.html`)); await ready(p);
      await p.selectOption('[data-pick]', { label: 'Anna Schmidt — Free Coffee Campaign (One-time voucher)' }); await p.waitForURL(new RegExp(v + '-scanner-voucher')); await ready(p);
      await p.goto(url(`${r}/pages/28-scanner.html`)); await ready(p);
      await p.selectOption('[data-pick]', { label: 'Leon Fischer — Coffee Card (Stamp Card)' }); await p.waitForURL(/29-scanner/); assert(p.url().includes('c=leon'), 'leon');
    }
  });

  await check('Preview Mode locks voucher + win-back redeem with the exact message', async () => {
    for (const f of ['65-scanner-voucher', '66-scanner-winback']) {
      await p.goto(url(`owner/pages/${f}.html`, '?preview=1')); await ready(p);
      const btn = f.includes('voucher') ? '[data-redeem-voucher]' : '[data-wb-redeem]';
      await p.click(btn, { force: true }); assert((await txt(p, '.toast-zone')).includes('Select a free trial, free plan, or paid plan to use this feature.'), 'toast');
      assert(!(await txt(p, '#content')).includes('Status Redeemed'), f + ' redeemed in preview');
    }
  });

  results.forEach(([s, n]) => console.log(s, n));
  console.log('console errors:', errors.length ? errors : 'none');
  const fails = results.filter(r => r[0] === 'FAIL').length;
  console.log(`${results.length - fails}/${results.length} passed`);
  await b.close(); process.exitCode = fails || errors.length ? 1 : 0;
})();
