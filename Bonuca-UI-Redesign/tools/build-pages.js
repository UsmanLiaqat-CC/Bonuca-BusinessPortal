// Generates one HTML file per original screen + index pages.
// Usage: node tools/build-pages.js
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const sandbox = { window: {}, matchMedia: () => ({ matches: false }), document: { addEventListener() {}, body: null }, location: { search: '' }, URLSearchParams };
sandbox.window = sandbox; vm.createContext(sandbox);
['core.js', 'data.js', 'app.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(root, 'shared/scripts', f), 'utf8'), sandbox));
const PAGES = sandbox.PAGES;
const scripts = ['core.js', 'data.js', 'screens-common.js', 'screens-programs.js', 'screens-ops.js', 'screens-admin.js', 'app.js'];
const page = (role, file) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${file} · Bonuca</title>
<link rel="stylesheet" href="../../shared/styles/app.css">
</head>
<body data-role="${role}" data-page="${file}">
<noscript>This prototype needs JavaScript enabled.</noscript>
${scripts.map(s => `<script src="../../shared/scripts/${s}"></script>`).join('\n')}
</body>
</html>
`;
const titleOf = f => f.replace(/^\d+-/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const indexPage = (title, groups, prefix) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><link rel="stylesheet" href="${prefix}shared/styles/app.css"></head>
<body><div class="ambient"><i></i><i></i><i></i><div class="lines"></div></div><div class="content" style="position:relative;z-index:1;max-width:1100px">
<header class="page-head"><div><div class="eyebrow">Bonuca · UI Redesign</div><h1 class="page-title">${title}</h1><p class="page-sub">Every redesigned screen, named exactly like the original screenshot.</p></div></header>
${groups.map(([g, base, files]) => `<h2 class="section-title">${g} <span class="count">${files.length}</span></h2><div class="grid g3">${files.map(f => `<a class="card hover" style="padding:16px 18px;display:flex;justify-content:space-between;align-items:center;gap:10px" href="${base}${f}.html"><span><span class="faint mono" style="font-size:12px">${f.split('-')[0]}</span><b style="display:block;font-weight:600">${titleOf(f)}</b></span><span class="faint">→</span></a>`).join('')}</div>`).join('')}
</div></body></html>`;
const groups = [];
for (const role of ['common', 'manager', 'owner']) {
  const dir = path.join(root, role, 'pages'); fs.mkdirSync(dir, { recursive: true });
  fs.readdirSync(dir).forEach(f => fs.unlinkSync(path.join(dir, f)));
  const files = PAGES[role].map(p => p[0]);
  files.forEach(f => fs.writeFileSync(path.join(dir, f + '.html'), page(role, f)));
  const label = role[0].toUpperCase() + role.slice(1);
  fs.writeFileSync(path.join(root, role, 'index.html'), indexPage(`${label} screens`, [[label, 'pages/', files]], '../'));
  groups.push([label, role + '/pages/', files]);
  console.log(role, files.length);
}
fs.writeFileSync(path.join(root, 'index.html'), indexPage('Bonuca Portal — all screens', groups, ''));
