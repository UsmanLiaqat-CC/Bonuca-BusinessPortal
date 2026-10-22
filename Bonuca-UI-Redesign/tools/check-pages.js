// Opens every generated page in headless Chromium and reports JS errors / empty renders / dead links,
// at mobile (375px) and desktop (1440px) widths in light and dark themes.
// Usage: node tools/check-pages.js [screenshotDir]      (QUICK=1 → desktop + light only)
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => {
  const root = path.join(__dirname, '..'), shots = process.argv[2];
  const roles = ['common', 'manager', 'owner', 'employee'].filter(r => fs.existsSync(path.join(root, r, 'pages')));
  const viewports = process.env.QUICK ? [1440] : [375, 1440], themes = process.env.QUICK ? ['light'] : ['light', 'dark'];
  const b = await chromium.launch();
  let bad = 0, n = 0; const overflow = [];
  for (const width of viewports) for (const theme of themes) {
    const ctx = await b.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await ctx.addInitScript(t => { try { localStorage.setItem('bonuca-theme', t); } catch (e) { } }, theme);
    for (const role of roles) for (const f of fs.readdirSync(path.join(root, role, 'pages')).sort()) {
      const p = await ctx.newPage(); const errs = [];
      p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
      await p.goto('file://' + path.join(root, role, 'pages', f));
      try { await p.waitForSelector('body[data-ready="1"]', { timeout: 5000 }); } catch (e) { errs.push('not ready'); }
      const info = await p.evaluate(() => ({
        len: document.body.innerText.length,
        links: [...document.querySelectorAll('a[href], [data-href]')].map(a => a.getAttribute('href') || a.getAttribute('data-href')),
        wide: document.documentElement.scrollWidth > innerWidth + 1
      }));
      for (const h of info.links) {
        if (!h || /^(#|https?:|mailto:|tel:|javascript:)/.test(h)) continue;
        if (!fs.existsSync(path.resolve(root, role, 'pages', h.split(/[?#]/)[0]))) errs.push('dead link ' + h);
      }
      n++;
      if (info.wide) overflow.push(`${width}/${theme} ${role}/${f}`);
      if (errs.length || info.len < 200) { bad++; console.log('FAIL', width, theme, role, f, info.len, errs.slice(0, 3)); }
      if (shots) { const dir = path.join(shots, `${width}-${theme}`, role); fs.mkdirSync(dir, { recursive: true }); await p.waitForTimeout(150); await p.screenshot({ path: path.join(dir, f.replace('.html', '.png')), fullPage: true }); }
      await p.close();
    }
    await ctx.close();
  }
  if (overflow.length) console.log(`horizontal overflow (${overflow.length}):\n  ` + overflow.join('\n  '));
  console.log(`checked ${n}, failed ${bad}`); await b.close();
  process.exitCode = bad ? 1 : 0;
})();
