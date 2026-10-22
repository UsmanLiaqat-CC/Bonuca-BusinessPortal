// Opens every generated page in headless Chromium and reports JS errors / empty renders.
// Usage: node tools/check-pages.js [screenshotDir]
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => {
  const root = path.join(__dirname, '..'), shots = process.argv[2];
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  let bad = 0, n = 0;
  for (const role of ['common', 'manager', 'owner']) for (const f of fs.readdirSync(path.join(root, role, 'pages')).sort()) {
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
    await p.goto('file://' + path.join(root, role, 'pages', f) + '?export');
    try { await p.waitForSelector('body[data-ready="1"]', { timeout: 5000 }); } catch (e) { errs.push('not ready'); }
    const len = await p.evaluate(() => document.body.innerText.length); n++;
    if (errs.length || len < 200) { bad++; console.log('FAIL', role, f, len, errs.slice(0, 3)); }
    if (shots) { fs.mkdirSync(path.join(shots, role), { recursive: true }); await p.waitForTimeout(150); await p.screenshot({ path: path.join(shots, role, f.replace('.html', '.png')), fullPage: true }); }
    await p.close();
  }
  console.log(`checked ${n}, failed ${bad}`); await b.close();
})();
