/* Bonuca redesign — core helpers, icons and reusable UI components.
   Plain JS, no dependencies. Components return HTML strings. */
(function (g) {
  const P = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>',
    stamp: '<path d="M5 22h14"/><path d="M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1.5c0-.66-.26-1.3-.73-1.77Z"/><path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13"/>',
    wallet: '<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 10h18"/><path d="M16 15h2"/>',
    qr: '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="3" width="6" height="6" rx="1"/><rect x="3" y="15" width="6" height="6" rx="1"/><path d="M15 15h2v2h-2zM19 19h2v2M15 20v1M21 15v1M12 3v3M12 10v2M3 12h3M10 12h2M17 12h4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    badge: '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 0 1 0 5"/>',
    chart: '<path d="M3 3v18h18"/><path d="M8 17V11M13 17V7M18 17v-4"/>',
    palette: '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.56-2.5 5.56-5.55C21.97 6.01 17.46 2 12 2z"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrowRight: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    arrowUpRight: '<path d="M7 17 17 7M7 7h10v10"/>',
    chevronRight: '<path d="m9 18 6-6-6-6"/>',
    chevronLeft: '<path d="m15 18-6-6 6-6"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    archive: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/>',
    file: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z"/><path d="M14 2v6h6M9 15h6"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/><path d="M16 5h4M18 3v4"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m22 7-10 6L2 7"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    crown: '<path d="m2 6 4 11h12l4-11-6 5-4-7-4 7Z"/><path d="M6 21h12"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7Z"/><path d="m2 17 10 5 10-5M2 12l10 5 10-5"/>',
    coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18M7 6h1v4M16.71 13.88l.7.71-2.82 2.82"/>',
    ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/>',
    star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01Z"/>',
    heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/>',
    cookie: '<path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"/><path d="M8.5 8.5h.01M16 15.5h.01M12 12h.01M11 17h.01M7 14h.01"/>',
    checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    rotate: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/>',
    sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/><path d="M5 3v4M19 17v4M3 5h4M17 19h4"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/>',
    apple: '<path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/>',
    phone: '<rect x="5" y="2" width="14" height="20" rx="3"/><path d="M12 18h.01"/>',
    coffee: '<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2M10 2v2M14 2v2"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
    footprints: '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0ZM20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0ZM16 17h4M4 13h4"/>',
    trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0Z"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9Z"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    store: '<path d="m2 7 2-4h16l2 4M4 10v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V10M2 7h20v1a3 3 0 0 1-6 0 3 3 0 0 1-4 0 3 3 0 0 1-4 0 3 3 0 0 1-6 0Z"/><path d="M9 21v-6h6v6"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1Z"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54Z"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    hourglass: '<path d="M5 22h14M5 2h14M17 22v-4.17a2 2 0 0 0-.59-1.42L12 12l-4.41 4.41A2 2 0 0 0 7 17.83V22M7 2v4.17a2 2 0 0 0 .59 1.42L12 12l4.41-4.41A2 2 0 0 0 17 6.17V2"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5Z"/>',
    gauge: '<path d="m12 14 4-4M3.34 19a10 10 0 1 1 17.32 0"/>',
    party: '<path d="M5.8 11.3 2 22l10.7-3.79M4 3h.01M22 8h.01M15 2h.01M22 20h.01M22 2l-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10M22 13l-.82-.33c-.86-.34-1.82.2-1.98 1.11-.11.7-.72 1.22-1.43 1.22H17M11 2l.33.82c.34.86-.2 1.82-1.11 1.98-.7.1-1.22.72-1.22 1.43V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/>',
    hash: '<path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18"/>',
    bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9Z"/>'
  };
  const icon = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;

  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const initials = n => n.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const PAL = [['#1747F8', '#E8EDFF'], ['#7C3AED', '#F1EAFF'], ['#0F9D6E', '#E3F6EE'], ['#C2410C', '#FFEFE4'], ['#BE185D', '#FDE7F1'], ['#0369A1', '#E3F2FB'], ['#7A5B00', '#FFF4CC']];
  const hash = s => [...String(s)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const ini = (n, extra = '') => { const [fg, bg] = PAL[hash(n) % PAL.length]; return `<span class="ini ${extra}" style="--fg:${fg};--bg:${bg}">${initials(n)}</span>`; };

  /* deterministic fake QR (finder patterns + seeded modules) */
  function qr(seed = 'bonuca', size = 25) {
    let s = hash(seed) || 1; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
    const cells = [];
    const finder = (x, y) => { for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) { const e = i === 0 || i === 6 || j === 0 || j === 6, c = i >= 2 && i <= 4 && j >= 2 && j <= 4; if (e || c) cells.push([x + i, y + j]); } };
    finder(0, 0); finder(size - 7, 0); finder(0, size - 7);
    const inF = (x, y) => (x < 8 && y < 8) || (x > size - 9 && y < 8) || (x < 8 && y > size - 9);
    for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) if (!inF(x, y) && rnd() > .52) cells.push([x, y]);
    return `<svg viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">${cells.map(([x, y]) => `<rect x="${x}" y="${y}" width="1" height="1" fill="#0A0A0A"/>`).join('')}</svg>`;
  }

  const req = '<span class="req">*</span>';
  const opt = (t = 'optional') => `<span class="opt">(${t})</span>`;
  function field({ label, required, optional, input, hint, error, cls = '', id }) {
    return `<div class="field ${error ? 'has-error' : ''} ${cls}">${label ? `<label class="label" ${id ? `for="${id}"` : ''}>${label}${required ? req : ''}${optional ? opt(optional === true ? 'optional' : optional) : ''}</label>` : ''}${input}${error ? `<div class="error-msg">${icon('info', 'sm')}${error}</div>` : hint ? `<div class="hint">${hint}</div>` : ''}</div>`;
  }
  const input = (o = {}) => `<input class="input ${o.cls || ''}" ${o.id ? `id="${o.id}"` : ''} type="${o.type || 'text'}" value="${esc(o.value || '')}" placeholder="${esc(o.ph || '')}" ${o.attrs || ''}>`;
  const select = (opts, val, attrs = '') => `<select class="select" ${attrs}>${opts.map(o => `<option ${o === val ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select>`;
  const textarea = (val = '', ph = '', attrs = '') => `<textarea class="textarea" placeholder="${esc(ph)}" ${attrs}>${esc(val)}</textarea>`;
  const toggle = (on, attrs = '') => `<label class="toggle"><input type="checkbox" ${on ? 'checked' : ''} ${attrs}><span></span></label>`;
  const check = (label, on, attrs = '') => `<label class="check"><input type="checkbox" ${on ? 'checked' : ''} ${attrs}>${label}</label>`;
  const colorIn = (c) => `<div class="color-input"><span class="swatch"><i style="--c:${c}"></i></span><input class="input" value="${c}" data-color></div>`;
  const upload = (filled, wide, extra = '') => `<div class="upload"><div class="tile ${wide ? 'wide' : ''} ${filled ? 'filled' : ''}">${filled ? '☕' : icon('image', 'lg')}</div><button class="btn btn-ghost btn-sm">${filled ? 'Replace' : 'Upload'}</button>${extra}</div>`;
  const optionRow = (title, sub, on, attrs = '', extra = '') => `<div class="option-row"><div><b>${title}</b><small>${sub}</small>${extra}</div>${toggle(on, attrs)}</div>`;
  const badge = (t, kind = '', live) => `<span class="badge ${kind} ${live ? 'live' : ''}">${kind && kind !== 'outline' ? '<i class="d"></i>' : ''}${t}</span>`;
  const status = s => ({ Active: badge('Active', 'green', true), Draft: badge('Draft', ''), Inactive: badge('Inactive', 'amber'), Available: badge('Available', 'green'), Redeemed: badge('Redeemed', 'blue'), Pending: badge('Pending', 'amber'), Expired: badge('Expired', 'red'), 'Not delivered': badge('Not delivered', 'amber') }[s] || badge(s));

  function card({ title, sub, icon: ic, actions = '', body = '', foot = '', cls = '', split = true, attrs = '' }) {
    return `<section class="card ${cls}" ${attrs}>${title ? `<header class="card-head ${split ? 'split' : ''}"><div><div class="card-title">${ic ? `<span class="ic">${icon(ic)}</span>` : ''}${title}</div>${sub ? `<div class="card-sub">${sub}</div>` : ''}</div>${actions ? `<div class="row">${actions}</div>` : ''}</header>` : ''}${body !== null ? `<div class="card-body">${body}</div>` : ''}${foot ? `<footer class="card-foot">${foot}</footer>` : ''}</section>`;
  }
  const callout = (kind, title, text, ic) => `<div class="callout ${kind}">${icon(ic || (kind === 'dev' ? 'zap' : 'info'))}<div>${title ? `<b>${title}</b>` : ''}${text}</div></div>`;

  /* ---------- wallet pass ---------- */
  const STAMP_ICONS = { coffee: 'coffee', star: 'star', heart: 'heart', scissors: 'scissors', cookie: 'cookie', check: 'check' };
  function pass(p) {
    const bg = p.bg ? `--bgp:${p.bg};` : '';
    const logo = p.logo === false ? `<div class="pass-logo ph">${esc((p.name || 'P')[0])}</div>` : `<div class="pass-logo">☕</div>`;
    let mid = '';
    if (p.type === 'stamp') {
      const n = p.total || 10, f = p.filled || 0, ic = STAMP_ICONS[p.icon || 'coffee'];
      mid = `<div class="pass-lbl">Reward</div><div class="pass-val">${esc(p.reward)}</div><div class="stamps">${Array.from({ length: n }, (_, i) => `<span class="stamp ${i < f ? 'on' : ''}" style="animation-delay:${i * 70}ms">${icon(ic)}</span>`).join('')}</div><div class="pass-lbl">Progress</div><div class="pass-val sm">${n - f} stamp${n - f === 1 ? '' : 's'} to go</div>`;
    } else if (p.type === 'membership') {
      mid = `<div class="pass-lbl">Benefit</div><div class="pass-val">${esc(p.benefit)}</div><div class="pass-lbl">Member since</div><div class="pass-val sm">${esc(p.since || 'Jan 15, 2026')}</div>`;
    } else if (p.type === 'tier') {
      mid = `<div class="pass-lbl">Current tier</div><div class="pass-val">${esc(p.tier || 'Member')}</div><div class="prog"><i style="--w:${p.pct || 40}%"></i></div><div class="pass-lbl">Next tier</div><div class="pass-val sm">${esc(p.next || '6 visits to Silver')}</div>`;
    } else if (p.type === 'points') {
      mid = `<div class="pass-lbl">Balance</div><div class="pass-val">${esc(p.balance || '120 pts')}</div>${p.nextReward ? `<div class="prog"><i style="--w:${p.pct || 48}%"></i></div><div class="pass-cols"><div><div class="pass-lbl">Next reward</div><div class="pass-val sm">${esc(p.nextReward)}</div></div><div><div class="pass-lbl">Points still required</div><div class="pass-val sm">${esc(p.needed)}</div></div></div>` : `<div class="pass-lbl">Next reward</div><div class="pass-val sm">All rewards unlocked</div>`}`;
    } else if (p.type === 'voucher') {
      mid = `<div class="pass-lbl">Voucher</div><div class="pass-val">${esc(p.reward)}</div><div class="pass-cols"><div><div class="pass-lbl">Valid from</div><div class="pass-val sm">${esc(p.from || '—')}</div></div><div><div class="pass-lbl">Valid to</div><div class="pass-val sm">${esc(p.to || '—')}</div></div></div>`;
    }
    const androidHead = p.android ? `<div class="pass-top">${logo}<span style="font-size:12px;opacity:.75;margin-right:auto">${esc(p.name)}</span></div><div class="pass-val" style="font-size:22px;margin-top:12px">${esc(p.name)}</div>` : `<div class="pass-top">${logo}<div class="pass-name" data-bind="name">${esc(p.name)}</div></div>`;
    return `<div class="pass" style="${bg}${p.fg ? `--fg:${p.fg}` : ''}">${androidHead}${mid}<div class="pass-qr">${qr(p.name + (p.type || ''), 21)}</div></div>`;
  }
  function phonePreview(p, caption, opts = {}) {
    const android = !!opts.android;
    return `<div class="preview-col"><div class="seg" data-seg="device">${['iPhone', 'Android'].map(d => `<button class="${(d === 'Android') === android ? 'on' : ''}" data-device="${d}">${icon(d === 'iPhone' ? 'apple' : 'phone', 'sm')}${d}</button>`).join('')}</div><div class="phone ${android ? 'android' : ''}" data-phone><div class="phone-screen" data-pass-host>${pass({ ...p, android })}</div></div><div class="phone-cap" data-cap>${caption}${android ? ' · Google Wallet' : ' · Apple Wallet'} (approximate)</div></div>`;
  }
  function qrPanel({ url, format = 'Table', seed, link }) {
    return `<div class="qr-panel"><div class="qr-box">${qr(seed || url, 25)}</div><div class="qr-meta"><div class="url-line">${icon('globe', 'sm')}<span>${esc(url)}</span><button class="icon-btn" style="width:28px;height:28px;margin-left:auto" data-copy="${esc(url)}" title="Copy">${icon('file', 'sm')}</button></div><div class="dev-url">${icon('zap', 'sm')}Development URL — set VITE_JOIN_BASE_URL to the customer join site before printing.</div><div class="row wrap"><div class="field" style="flex:1;min-width:200px"><label class="label">Print format</label>${select(['Table', 'Cup', 'Window', 'Counter', 'Flyer'], format)}</div></div><div class="row"><button class="btn btn-ghost btn-sm" data-toast="PNG downloaded">${icon('download', 'sm')}PNG</button><button class="btn btn-ghost btn-sm" data-toast="PDF downloaded">${icon('file', 'sm')}PDF</button>${link ? `<a class="link" style="margin-left:auto" href="${link}">All printable QR codes ${icon('arrowRight', 'sm')}</a>` : ''}</div></div></div>`;
  }

  /* ---------- charts (SVG) ---------- */
  const niceMax = (m, steps) => { const raw = m / steps; const p = Math.pow(10, Math.floor(Math.log10(raw))); const n = [1, 2, 2.5, 4, 5, 10].find(x => x * p >= raw) * p; return n * steps; };
  function axes(W, H, pad, max, steps) {
    let s = '<g class="grid">';
    for (let i = 0; i <= steps; i++) { const y = pad.t + (H - pad.t - pad.b) * (1 - i / steps); s += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y}" y2="${y}"/><text x="${pad.l - 10}" y="${y + 4}" text-anchor="end">${Math.round(max * i / steps)}</text>`; }
    return s + '</g>';
  }
  function barChart(labels, values, o = {}) {
    const W = o.w || 640, H = o.h || 250, pad = { l: 40, r: 10, t: 14, b: 30 }, steps = 4;
    const max = o.max || niceMax(Math.max(...values, 1), steps), n = values.length, cw = (W - pad.l - pad.r) / n, bw = Math.min(o.bw || 34, cw * .62);
    const id = 'g' + Math.random().toString(36).slice(2, 7);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}" data-chart="bar"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${o.c1 || '#3D66FF'}"/><stop offset="1" stop-color="${o.c2 || '#1747F8'}" stop-opacity=".85"/></linearGradient></defs>${axes(W, H, pad, max, steps)}`;
    const every = o.every || 1, peak = Math.max(...values);
    values.forEach((v, i) => { const h = (H - pad.t - pad.b) * v / max, x = pad.l + cw * i + (cw - bw) / 2, y = H - pad.b - h; s += `<rect data-tip="${esc(labels[i])}|${v}" x="${x}" y="${y}" width="${bw}" height="${Math.max(h, 0)}" rx="${Math.min(8, bw / 2.5)}" class="bar${v === peak && o.peak ? ' peak' : ''}" fill="url(#${id})" style="animation-delay:${i * 35}ms"/>`; if (i % every === 0 && (n - 1 - i >= every || i === n - 1 || every === 1) || (i === n - 1)) s += `<text x="${x + bw / 2}" y="${H - 9}" text-anchor="middle">${esc(labels[i])}</text>`; });
    return `<div class="chart-wrap">${s}</svg><div class="tip"></div></div>`;
  }
  function hBarChart(labels, values, o = {}) {
    const W = o.w || 640, rowH = o.rowH || 44, pad = { l: 120, r: 50, t: 6, b: 6 }, H = pad.t + pad.b + rowH * labels.length;
    const max = o.max || niceMax(Math.max(...values), 4); const cols = o.colors || ['#1747F8', '#8B7CF6', '#4FC3F7', '#22B07D', '#FFB020'];
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}">`;
    labels.forEach((l, i) => { const y = pad.t + rowH * i, w = (W - pad.l - pad.r) * values[i] / max; s += `<text x="0" y="${y + rowH / 2 + 4}" style="fill:var(--color-text-secondary);font-size:12.5px;font-weight:500">${esc(l)}</text><rect x="${pad.l}" y="${y + 9}" width="${W - pad.l - pad.r}" height="${rowH - 18}" rx="${(rowH - 18) / 2}" fill="var(--color-surface-sunken)"/><rect class="hbar" data-tip="${esc(l)}|${values[i]}" x="${pad.l}" y="${y + 9}" width="${w}" height="${rowH - 18}" rx="${(rowH - 18) / 2}" fill="${cols[i % cols.length]}" style="animation-delay:${i * 90}ms"/><text x="${pad.l + w + 10}" y="${y + rowH / 2 + 4}" style="fill:var(--color-text-primary);font-weight:600;font-size:12.5px">${values[i]}</text>`; });
    return `<div class="chart-wrap">${s}</svg><div class="tip"></div></div>`;
  }
  function lineChart(labels, values, o = {}) {
    const W = o.w || 640, H = o.h || 250, pad = { l: 40, r: 14, t: 14, b: 30 }, steps = 4, max = o.max || niceMax(Math.max(...values), steps);
    const n = o.slots || values.length, X = i => pad.l + (W - pad.l - pad.r) * i / (n - 1), Y = v => pad.t + (H - pad.t - pad.b) * (1 - v / max);
    let d = ''; values.forEach((v, i) => { const x = X(i), y = Y(v); if (!i) d = `M${x},${y}`; else { const px = X(i - 1), py = Y(values[i - 1]), cx = (px + x) / 2; d += ` C${cx},${py} ${cx},${y} ${x},${y}`; } });
    const last = values.length - 1, area = `${d} L${X(last)},${H - pad.b} L${X(0)},${H - pad.b} Z`;
    const id = 'l' + Math.random().toString(36).slice(2, 7);
    let s = `<svg class="chart" viewBox="0 0 ${W} ${H}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1747F8" stop-opacity=".28"/><stop offset="1" stop-color="#1747F8" stop-opacity="0"/></linearGradient></defs>${axes(W, H, pad, max, steps)}<path class="area" d="${area}" fill="url(#${id})"/><path class="line" d="${d}" fill="none" stroke="#1747F8" stroke-width="2.6" stroke-linecap="round" style="--len:2000"/>`;
    const every = o.every || 1;
    labels.forEach((l, i) => { const L = labels.length - 1; if ((i % every === 0 && L - i >= every / 2 + 1) || i === L) s += `<text x="${X(i)}" y="${H - 9}" text-anchor="middle">${esc(l)}</text>`; });
    values.forEach((v, i) => { s += `<circle class="pt" data-tip="${esc(labels[i])}|${v}" cx="${X(i)}" cy="${Y(v)}" r="${i === last ? 5 : 3.2}" fill="${i === last ? '#1747F8' : 'var(--color-surface)'}" stroke="#1747F8" stroke-width="2"/>`; });
    if (o.marker) { const x = X(last), y = Y(values[last]); s += `<line x1="${x}" x2="${x}" y1="${y}" y2="${H - pad.b}" stroke="#1747F8" stroke-dasharray="3 4" opacity=".5"/>`; }
    return `<div class="chart-wrap">${s}</svg><div class="tip"></div></div>`;
  }
  function donut(items, o = {}) {
    const R = 70, C = 2 * Math.PI * R, tot = items.reduce((a, b) => a + b.v, 0); let off = 0;
    const segs = items.map((it, i) => { const len = C * it.v / tot - 4; const s = `<circle class="seg" cx="90" cy="90" r="${R}" fill="none" stroke="${it.c}" stroke-width="22" stroke-linecap="round" style="--dash:${Math.max(len, 1)};stroke-dashoffset:${-off};animation-delay:${i * 120}ms" transform="rotate(-90 90 90)" data-tip="${esc(it.l)}|${it.v}"/>`; off += C * it.v / tot; return s; }).join('');
    return `<div class="donut-wrap"><div class="chart-wrap"><svg class="chart donut" viewBox="0 0 180 180"><circle cx="90" cy="90" r="${R}" fill="none" stroke="var(--color-surface-sunken)" stroke-width="22"/>${segs}<text x="90" y="86" text-anchor="middle" style="font-family:var(--font-display);font-size:30px;font-weight:700;fill:var(--color-text-primary)" data-count="${tot}">${tot}</text><text x="90" y="106" text-anchor="middle">${o.center || 'total'}</text></svg><div class="tip"></div></div><div class="legend">${items.map(it => `<div class="legend-row"><i style="--c:${it.c}"></i><span>${esc(it.l)}</span><b data-count="${it.v}">${it.v}</b></div>`).join('')}</div></div>`;
  }
  function chartTableToggle(id, chartHtml, rows, heads, on = 'Chart') {
    const table = `<div class="table-wrap" style="max-height:300px;overflow:auto;border-radius:14px;border:1px solid var(--color-border)"><table class="t"><thead><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, j) => `<td class="${j ? 'num' : ''}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    return { seg: `<div class="seg" data-ct="${id}">${['Chart', 'Table'].map(t => `<button class="${t === on ? 'on' : ''}" data-view="${t}">${t}</button>`).join('')}</div>`, body: `<div data-ct-body="${id}"><div data-view-pane="Chart" ${on === 'Chart' ? '' : 'hidden'}>${chartHtml}</div><div data-view-pane="Table" ${on === 'Table' ? '' : 'hidden'}>${table}</div></div>` };
  }
  function ring(pct, size = 44, stroke = 5, color = 'var(--color-highlight)', track = 'rgba(255,255,255,.15)', label = '') {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    return `<svg class="ring-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>${label ? `<text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" style="font:700 12px var(--font-display);fill:currentColor">${label}</text>` : ''}</svg>`;
  }
  function tabs(items, active, attrs = '') {
    return `<nav class="tabs" ${attrs}><span class="thumb"></span>${items.map(t => { const [label, href, count] = Array.isArray(t) ? t : [t]; const tag = href ? 'a' : 'button'; return `<${tag} ${href ? `href="${href}"` : `data-tab="${esc(label)}"`} class="${label === active ? 'on' : ''}">${label}${count !== undefined ? `<span class="count">${count}</span>` : ''}</${tag}>`; }).join('')}</nav>`;
  }
  function modal({ title, sub, body, foot, wide, id = 'm', open = true }) {
    return `<div class="backdrop" data-modal="${id}" ${open ? '' : 'hidden'}><div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="modal-head"><div><h3>${title}</h3>${sub ? `<p class="muted" style="margin-top:4px;font-size:13.5px">${sub}</p>` : ''}</div><button class="icon-btn" data-close aria-label="Close">${icon('x')}</button></div><div class="modal-body">${body}</div>${foot ? `<div class="modal-foot">${foot}</div>` : ''}</div></div>`;
  }
  const kv = (rows) => rows.map(([k, v, big]) => `<div class="kv"><span>${k}</span><b class="${big ? 'big' : ''}">${v}</b></div>`).join('');
  const setup = (items, cols = 2) => `<div class="setup-grid" style="--cols:${cols}">${items.map(([k, v]) => `<div class="setup-item"><small>${k}</small><b>${v}</b></div>`).join('')}</div>`;
  const pageHead = ({ eyebrow, title, sub, actions = '' }) => `<header class="page-head reveal-up"><div>${eyebrow ? `<div class="eyebrow">${eyebrow}</div>` : ''}<h1 class="page-title">${title}</h1>${sub ? `<p class="page-sub">${sub}</p>` : ''}</div>${actions ? `<div class="head-actions">${actions}</div>` : ''}</header>`;
  const crumb = (label, href) => `<a href="${href}">${label}</a>${icon('chevronRight')}`;

  g.UI = { icon, esc, ini, initials, qr, field, input, select, textarea, toggle, check, colorIn, upload, optionRow, badge, status, card, callout, pass, phonePreview, qrPanel, barChart, hBarChart, lineChart, donut, chartTableToggle, ring, tabs, modal, kv, setup, pageHead, crumb, req, opt };
})(window);
