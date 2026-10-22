// Phase 8 (verify existing items + regression) checklist journeys: P8.1–P8.10, Extras (E1–E11), 375 px layout.
// Usage: node tools/journeys/phase8.js
const { chromium } = require('playwright'); const path = require('path'), fs = require('fs');
const root = path.join(__dirname, '..', '..');
const url = (p, q = '') => 'file://' + path.join(root, p) + q;
const results = [], errors = [];
const assert = (c, m) => { if (!c) throw new Error(m); };
async function check(name, fn) { try { await fn(); results.push(['PASS', name]); } catch (e) { results.push(['FAIL', name + ' — ' + e.message.split('\n')[0]]); } }
const ready = p => p.waitForSelector('body[data-ready="1"]');
const txt = async (p, s) => (await p.locator(s).first().innerText()).replace(/\s+/g, ' ');
const watch = p => { p.on('pageerror', e => errors.push(e.message)); p.on('console', m => m.type() === 'error' && errors.push(m.text())); return p; };
const has = (t, list, w) => list.forEach(x => assert(t.includes(x), `${w}: missing "${x}"`));
const opts = (p, s) => p.locator(s).first().evaluate(el => [...el.options].map(o => o.text));
const files = role => fs.readdirSync(path.join(root, role, 'pages')).filter(f => f.endsWith('.html')).sort();
const MO = [['manager', ''], ['owner', '']];

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p = watch(await ctx.newPage());

  await check('P8.1 Dashboard: client stats + Customer Growth / Daily Scans / Monthly Growth / Top Programs (01, 02, dark)', async () => {
    const STATS = ['Total Members', 'New Members Today', 'New Members This Week', 'New Members This Month', 'Total Scans', 'Active Programs', 'Wallet Cards', 'Membership Distribution', 'Visits', 'Returning Customers'];
    const CHARTS = ['Customer Growth', 'Daily Scans', 'Monthly Growth', 'Top Programs'];
    for (const [f, dark] of [['manager/pages/01-dashboard.html'], ['manager/pages/02-dashboard-table-view.html'], ['owner/pages/01-dashboard.html'], ['manager/pages/59-dashboard-dark-mode.html', 1], ['owner/pages/60-dashboard-dark-mode.html', 1]]) {
      await p.goto(url(f)); await ready(p);
      has(await txt(p, '#content'), [...STATS, ...CHARTS], f);
      if (dark) assert(await p.evaluate(() => document.documentElement.dataset.theme) === 'dark', f + ' theme');
    }
    await p.goto(url('manager/pages/02-dashboard-table-view.html')); await ready(p);
    assert(await p.locator('[data-ct-body="growth"] [data-view-pane="Table"]:not([hidden]) table').count() === 1, 'growth table view');
  });

  await check('P8.2 Signup fields (38): Name required; Email, Phone Number, Birthday optional — each configurable', async () => {
    for (const [r] of MO) {
      await p.goto(url(`${r}/pages/38-customer-signup-fields.html`)); await ready(p);
      const rows = await p.locator('#content .option-row').evaluateAll(els => els.map(e => [e.querySelector('b').textContent, e.querySelector('.seg .on').textContent, e.querySelectorAll('.seg button').length]));
      assert(JSON.stringify(rows) === JSON.stringify([['Name', 'Required', 2], ['Email', 'Optional', 2], ['Phone Number', 'Optional', 2], ['Birthday', 'Optional', 2]]), r + ' ' + JSON.stringify(rows));
      await p.locator('#content .option-row').nth(1).locator('.seg button', { hasText: 'Required' }).click();
      assert((await txt(p, '#content .option-row:nth-child(2) .seg .on')) === 'Required', 'toggle');
    }
    await p.goto(url('manager/pages/36-customers-add-dialog.html')); await ready(p);
    const labels = await p.locator('[data-modal="add"] .label').allInnerTexts();
    assert(labels.join('|').replace(/\s+/g, '') === 'Name*|Email(optional)|PhoneNumber(optional)|Birthday(optional)', 'add form ' + labels);
  });

  await check('P8.3 Customer profile (37): visit history, rewards, membership, current tier, number of scans, notes, last visit', async () => {
    for (const [r] of MO) {
      await p.goto(url(`${r}/pages/37-customer-profile.html`)); await ready(p);
      has(await txt(p, '#content'), ['Visit history', 'Rewards', 'Memberships', 'VIP Member', 'Current tier:', 'Number of scans', 'Notes', 'Last visit'], r);
      assert(await p.locator('[data-visit-history] .tl-item').count() > 0 && await p.locator('#content .card:has-text("Notes") textarea').count() === 1, r + ' history/notes');
    }
  });

  await check('P8.4 Customer search (35) by name, phone, email and customer ID', async () => {
    await p.goto(url('manager/pages/35-customers.html')); await ready(p);
    assert((await p.getAttribute('[data-search]', 'placeholder')) === 'Search by name, phone, email or customer ID', 'placeholder');
    for (const [q, n] of [['Vera Conti', 'Vera Conti'], ['5196093', 'Anna Schmidt'], ['zoe.dubois2@example.com', 'Zoe Dubois'], ['C-10007', 'Felix Bernard']]) {
      await p.fill('[data-search]', q);
      const rows = await p.locator('[data-rows] tr').allInnerTexts();
      assert(rows.length >= 1 && rows.every(t => t.includes(n)), `${q} → ${rows.length} rows`);
    }
    await p.fill('[data-search]', 'zzz-nobody'); assert((await txt(p, '[data-rows]')).includes('No customers match'), 'empty');
  });

  await check('P8.5 Analytics (47): client metrics + heatmap; AI commentary shown on Pro, explains the heatmap in plain words', async () => {
    for (const [r] of MO) {
      await p.goto(url(`${r}/pages/47-analytics.html`)); await ready(p);
      has(await txt(p, '#content'), ['Visitors', 'Returning customers', 'Retention', 'Visit frequency', 'Reward redemptions', 'Top members', 'Most active days', 'Growth', 'Activity heatmap', 'AI commentary'], r);
      assert(await p.locator('.heat .c').count() === 7 * 24, 'heatmap 7×24');
      const ai = await txt(p, '[data-ai-commentary]');
      assert(/^Most scans happen between \d{1,2} (AM|PM) and \d{1,2} (AM|PM) on (Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)days\. This could be a good time to send a special offer\./.test(ai), r + ' ' + ai);
      assert(!/pending client confirmation/i.test(await txt(p, '#content')), 'no pending note');
      assert(await p.locator('[data-ai-locked]').count() === 0, r + ' unlocked on Pro');
    }
  });

  await check('P8.5 AI commentary is Pro-only: locked on the Free plan and in Preview Mode; heatmap stays visible', async () => {
    for (const [f, q, link] of [['manager/pages/47-analytics.html', '?plan=free', 0], ['owner/pages/47-analytics.html', '?plan=free', 1], ['owner/pages/47-analytics.html', '?preview=1', 1]]) {
      await p.goto(url(f, q)); await ready(p);
      assert(await p.locator('[data-ai-commentary]').count() === 0, f + q + ' commentary leaked');
      assert((await txt(p, '[data-ai-locked]')).includes('AI commentary is available on the Pro plan.'), f + q + ' lock');
      assert(await p.locator('.heat .c').count() === 168, 'heatmap visible');
      assert(await p.locator('[data-ai-locked] a[href^="49-"]').count() === link, f + q + ' plans link (Owner only)');
    }
  });

  await check('P8.6 Notifications (41/42): Happy Hour, New item, Double Stamps, Birthday Reward, Holiday Campaign, Limited Offers', async () => {
    for (const [r] of MO) {
      await p.goto(url(`${r}/pages/42-notifications-new-campaign.html`)); await ready(p);
      assert(JSON.stringify(await opts(p, '[data-modal="newCampaign"] select')) === JSON.stringify(['Happy Hour', 'New item', 'Double Stamps', 'Birthday Reward', 'Holiday Campaign', 'Limited Offers']), r);
      await p.goto(url(`${r}/pages/41-notifications-campaigns.html`)); await ready(p);
      await p.click('#content .page-head [data-open="newCampaign"]');
      assert(await p.locator('[data-modal="newCampaign"]:not([hidden])').count() === 1, 'opens from 41');
    }
  });

  await check('P8.7 QR codes (34): printable for Table, Counter, Sticker, Flyer, Window', async () => {
    for (const [r] of MO) {
      await p.goto(url(`${r}/pages/34-qr-codes.html`)); await ready(p);
      for (const s of await p.locator('[data-group="Registration"], [data-group="Programs"]').all()) assert(JSON.stringify(await s.locator('select').evaluate(el => [...el.options].map(o => o.text))) === JSON.stringify(['Table', 'Counter', 'Sticker', 'Flyer', 'Window']), r + ' formats');
      assert(await p.locator('[data-group="Programs"]').count() === 4 && await p.locator('#content [data-toast="PNG downloaded"]').count() === 8, r + ' cards');
    }
    await p.goto(url('manager/pages/10-program-detail-coffee.html')); await ready(p);
    assert((await opts(p, '.qr-panel select')).join() === 'Table,Counter,Sticker,Flyer,Window', 'program detail');
  });

  await check('P8.8 Language: English, German, Turkish, French, Italian — on first launch (landing, onboarding) and in Settings', async () => {
    const L = 'English,Deutsch,Türkçe,Français,Italiano';
    for (const f of ['common/pages/01-landing.html', 'manager/pages/58-settings-language.html', 'owner/pages/59-settings-language.html', 'employee/pages/05-account.html']) {
      await p.goto(url(f)); await ready(p);
      assert((await opts(p, f.includes('settings') || f.includes('account') ? '#content select' : '.public-top select')).join() === L, f);
    }
    await p.goto(url('common/pages/07-onboarding-business-profile.html')); await ready(p);
    assert((await txt(p, 'body')).includes('Preferred Interface Language') && (await opts(p, '.field:has-text("Preferred Interface Language") select')).join() === L, 'onboarding');
  });

  await check('P8.9 Branding (48): Logo, Primary Color, Secondary Color, Background, Fonts — live preview', async () => {
    for (const [r] of MO) {
      await p.goto(url(`${r}/pages/48-branding.html`)); await ready(p);
      const labels = (await p.locator('#content .layout-preview .label').allInnerTexts()).map(s => s.replace(/\s*\(optional\)/, ''));
      assert(['Logo', 'Primary Color', 'Secondary Color', 'Background', 'Font'].every(l => labels.includes(l)), r + ' ' + labels);
      await p.fill('[data-bp="p"]', '#C2410C');
      assert(await p.locator('[data-brand-preview]').evaluate(el => el.style.getPropertyValue('--bp-p')) === '#C2410C', 'preview');
    }
  });

  await check('P8.10 Owner subscription (49/57): Upgrade, Downgrade, Cancel, Invoices, Payment history, Billing information', async () => {
    await p.goto(url('owner/pages/49-subscription.html')); await ready(p);
    has(await txt(p, '#content'), ['Upgrade or downgrade', 'Upgrade to Pro', 'Downgrade to Free Plan', 'Cancel subscription', 'Invoices', 'Payment history', 'Billing information'], 'owner 49');
    assert(await p.locator('[data-modal="cancelSub"][hidden]').count() === 1, 'cancel modal closed');
    await p.click('[data-open="cancelSub"]');
    assert((await txt(p, '[data-modal="cancelSub"]')).includes('No customers, programs or transactions are deleted.'), 'cancel modal');
    await p.click('[data-modal="cancelSub"] [data-close].btn-ghost'); assert(await p.locator('[data-modal="cancelSub"][hidden]').count() === 1, 'keep plan closes');
    await p.goto(url('owner/pages/49-subscription.html', '?override=2026-12-31')); await ready(p);
    assert(await p.locator('[data-open="cancelSub"]').count() === 0, 'override is read-only');
    await p.goto(url('owner/pages/57-settings-billing.html')); await ready(p);
    assert(await p.locator('#content a[href="49-subscription.html"]').count() === 1, 'billing → subscription');
  });

  await check('E10 Manager: no Subscription/Billing in nav or settings; 49 shows no plan data; settings = client list', async () => {
    for (const f of files('manager')) {
      await p.goto(url('manager/pages/' + f)); await ready(p);
      assert(!(await p.locator('.sidebar .nav').innerText()).includes('Subscription'), f + ' nav');
      assert(await p.locator('a[href^="49-"]').count() === 0, f + ' links to 49');
    }
    await p.goto(url('manager/pages/49-subscription.html')); await ready(p);
    assert((await txt(p, '#content')).includes('Your role does not have access to this feature.') && !(await txt(p, '#content')).includes('Invoices'), '49 locked');
    await p.goto(url('manager/pages/50-settings-business.html')); await ready(p);
    const items = await p.locator('#content nav.nav a').allInnerTexts();
    assert(items.join('|') === 'Business information|Address|Opening hours|Logo|Brand colors|Employees|Notifications|Wallet customization|Language', 'settings ' + items);
  });

  await check('E1 AI Campaigns / AI Bonus Generator removed from MVP navigation; 44 kept (no renumbering) and offers no AI tools', async () => {
    for (const r of ['manager', 'owner']) {
      assert(files(r).includes('44-notifications-ai-tools.html') && files(r).includes('45-rewards.html'), r + ' numbering');
      for (const f of files(r)) {
        await p.goto(url(`${r}/pages/${f}`)); await ready(p);
        assert(await p.locator('a[href^="44-"], [data-href^="44-"]').count() === 0, `${r}/${f} links to 44`);
        if (!f.startsWith('44-')) assert(!/AI tools|AI Campaigns|AI Bonus/.test(await txt(p, 'body')), `${r}/${f} AI text`);
      }
      await p.goto(url(`${r}/pages/41-notifications-campaigns.html`)); await ready(p);
      assert((await p.locator('#content .tabs a').allInnerTexts()).join('|') === 'Manual campaigns|Win-back automation', r + ' tabs');
      await p.goto(url(`${r}/pages/44-notifications-ai-tools.html`)); await ready(p);
      assert((await txt(p, '[data-future]')).includes('future feature') && await p.locator('#content textarea, .ai-card').count() === 0 && !/Bonus Generator/.test(await txt(p, '#content')), r + ' 44');
    }
    for (const f of ['index.html', 'manager/index.html']) assert(fs.readFileSync(path.join(root, f), 'utf8').includes('44-notifications-ai-tools'), 'index still lists the kept file');
  });

  await check('E2–E11: no extra from the client-spec review remains visible', async () => {
    const BAD = /Downgrade Rule|Expiry Rule|Renews annually|Expires on date|Enable Tiers|Start from Scratch|Probability|Reward pool|Leaderboard|Badges|Archive|Suspend|Auto-brand/i;
    for (const r of ['manager', 'owner', 'employee']) for (const f of files(r)) {
      await p.goto(url(`${r}/pages/${f}`)); await ready(p);
      const m = (await txt(p, 'body')).match(BAD); assert(!m, `${r}/${f}: "${m && m[0]}"`);
    }
  });

  const mob = await b.newContext({ viewport: { width: 375, height: 800 }, reducedMotion: 'reduce' });
  const m = watch(await mob.newPage());
  await check('375 px: no horizontal overflow on the previously overflowing screens; topbar never covers the business name', async () => {
    for (const f of ['common/pages/01-landing.html', 'common/pages/02-landing-download-app.html', 'common/pages/06-verify-email.html', 'manager/pages/10-program-detail-coffee.html', 'owner/pages/13-program-detail-points.html', 'manager/pages/17-campaign-new-acquisition.html', 'owner/pages/21-campaign-detail-voucher.html', 'manager/pages/23-wallet-design-coffee.html', 'owner/pages/27-wallet-design-android-preview.html', 'manager/pages/34-qr-codes.html', 'owner/pages/47-analytics.html', 'manager/pages/52-settings-hours.html']) {
      await m.goto(url(f)); await ready(m);
      assert(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), f + ' overflows');
    }
    for (const f of ['manager/pages/01-dashboard.html', 'owner/pages/49-subscription.html', 'employee/pages/01-scanner-home.html']) {
      await m.goto(url(f)); await ready(m);
      const r = await m.evaluate(() => { const b = document.querySelector('.biz b'), s = document.querySelector('.biz small'), a = document.querySelector('.top-actions').getBoundingClientRect(); return { b: b.getBoundingClientRect().right, s: s.getBoundingClientRect().right, a: a.left, clip: b.scrollWidth > b.clientWidth && getComputedStyle(b).textOverflow === 'ellipsis', vis: document.querySelector('.top-actions .lang').offsetParent === null }; });
      assert(r.b <= r.a && r.s <= r.a, `${f} name ${Math.round(r.b)}/${Math.round(r.s)} under actions at ${Math.round(r.a)}`);
      assert(await m.locator('.top-actions [data-theme-set]').count() === 3 && await m.locator('.top-actions a[href$="03-login.html"]').isVisible(), f + ' actions');
    }
    await m.goto(url('common/pages/01-landing.html')); await ready(m);
    assert(await m.locator('.public-top select.lang').isVisible(), 'language selectable on first launch at 375');
  });

  results.forEach(([s, n]) => console.log(s, n));
  console.log('console errors:', errors.length ? errors : 'none');
  const fails = results.filter(r => r[0] === 'FAIL').length;
  console.log(`${results.length - fails}/${results.length} passed`);
  await b.close(); process.exitCode = fails || errors.length ? 1 : 0;
})();
