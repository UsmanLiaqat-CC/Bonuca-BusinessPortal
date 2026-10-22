/* Dashboard, Loyalty Programs, Campaigns, Wallet Cards */
(function (g) {
  const U = g.UI, D = g.DATA, { icon, esc, field, input, select, textarea, colorIn, optionRow, badge, status, card, callout, pass, phonePreview, qrPanel, pageHead, crumb, modal, setup, tabs } = U;
  const S = g.SCREENS = g.SCREENS || {};
  const qid = () => new URLSearchParams(location.search).get('id');

  /* ================= DEMO MEMORY: lifecycle status + saved edits ================= */
  // program-status: { programOrCampaignId: 'Active' | 'Inactive' } · program-edits / campaign-edits: { id: saved form values }.
  const mem = k => g.mem.get(k, {}), memPut = (k, id, v) => { const m = mem(k); m[id] = v; g.mem.set(k, m); };
  const TERMS = { coffee: 'One stamp per hot drink purchased. Stamps have no cash value and cannot be exchanged or transferred. The reward can be redeemed once the card is full.', vip: 'Membership is personal and cannot be transferred. Show your pass before paying to receive the member discount. Not combinable with other offers.', club: 'Your tier is based on the visits recorded with this pass. Tier benefits apply from the visit after you reach a tier.', points: 'Points are awarded on the amount paid after discounts and have no cash value. Rewards are redeemed at the counter.', lunch: 'One stamp per lunch menu, Monday to Friday. The free lunch menu can be redeemed once the card is full.' };
  const BAL = 120; // sample balance shown on points previews
  const nextOf = (rw, bal = BAL) => { const ok = rw.filter(r => r[0] && r[1] > 0).sort((a, b) => a[1] - b[1]), n = ok.find(r => r[1] > bal); return !ok.length ? { nextReward: 'Reward name', needed: '—', pct: 0 } : n ? { nextReward: n[0], needed: String(n[1] - bal), pct: Math.round(bal / n[1] * 100) } : { nextReward: '' }; };
  const P = id => {
    const p = D.programs.find(x => x.id === id); if (!p) return;
    const e = mem('program-edits')[id] || {}, st = mem('program-status')[id] || p.status, name = e.name || p.name, terms = e.terms ?? TERMS[id] ?? '', cfg = p.cfg && { ...p.cfg, ...e.cfg };
    const ps = { ...p.pass, ...e.pass, name, terms, ...(p.kind === 'points' ? { balance: BAL + ' pts', ...nextOf(cfg.rewards) } : {}) };
    return { ...p, name, status: st, date: p.status === 'Draft' && st !== 'Draft' ? 'Published Oct 21, 2026' : p.date, url: p.url || `https://join.bonuca.invalid/program/join-prg_${p.id}`, terms, multi: e.multi || p.multi, cfg, pass: ps };
  };
  const PROGS = () => D.programs.map(p => P(p.id));
  const CMP = id => { const c = D.campaigns.find(x => x.id === id); return c && { ...c, ...mem('campaign-edits')[id], status: mem('program-status')[id] || c.status }; };
  const DETAIL = { coffee: '10-', vip: '11-', club: '12-', points: '13-', lunch: '14-' }, walletPage = { coffee: '23-', vip: '24-', club: '25-', points: '26-' };
  // Pages that exist once per type take the record as ?id= (the registry's own record needs none).
  const to = (ctx, pre, id, def) => id && id !== def ? ctx.nav(ctx.link(pre) + '?id=' + id) : ctx.link(pre);
  const editLink = (ctx, id) => to(ctx, '15-', id, 'coffee'), designLink = (ctx, id) => walletPage[id] ? ctx.link(walletPage[id]) : to(ctx, '23-', id, 'coffee');
  const campLink = (ctx, c) => c.type.startsWith('Stamp') ? to(ctx, '20-', c.id, 'cuplid') : to(ctx, '21-', c.id, 'freecoffee');
  const brand = () => g.mem.get('branding', null) || {};
  const isHex = v => /^#[0-9a-f]{6}$/i.test(v || '');
  const fmtDate = v => v ? new Date(v + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const isoDate = v => { const d = new Date(v); return isNaN(d) ? '' : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  /* ================= FORM HELPERS: uploads, validation ================= */
  const upImg = v => v === true ? '☕' : `<img src="${esc(v)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">`;
  const rmBtn = `<button class="btn btn-danger-text btn-sm" data-up-remove>${icon('trash', 'sm')}Remove</button>`;
  const up = (key, val, wide) => `<div class="upload" data-up="${key}"><div class="tile ${wide ? 'wide' : ''} ${val ? 'filled' : ''}">${val ? upImg(val) : icon('image', 'lg')}</div><button class="btn btn-ghost btn-sm" data-up-pick>${val ? 'Replace' : 'Upload'}</button>${val ? rmBtn : ''}<input type="file" accept="image/*" hidden data-up-file aria-label="Choose image"></div>`;
  const setUp = (u, v) => { const t = u.querySelector('.tile'); t.classList.toggle('filled', !!v); t.innerHTML = v ? upImg(v) : icon('image', 'lg'); const pk = u.querySelector('[data-up-pick]'), rm = u.querySelector('[data-up-remove]'); pk.textContent = v ? 'Replace' : 'Upload'; if (v && !rm) pk.insertAdjacentHTML('afterend', rmBtn); if (!v && rm) rm.remove(); };
  const setErr = (el, msg) => { const fd = el && el.closest('.field'); if (!fd) return; fd.querySelectorAll(':scope > .error-msg').forEach(x => x.remove()); fd.classList.toggle('has-error', !!msg); fd.querySelectorAll(':scope > .hint').forEach(h => h.hidden = !!msg); if (msg) fd.insertAdjacentHTML('beforeend', `<div class="error-msg">${icon('info', 'sm')}${msg}</div>`); };
  // Collects inline errors; ok() scrolls to the first one and blocks the success toast.
  const checker = () => { let first = null; return { t(el, msg) { if (!el) return; setErr(el, msg || ''); if (msg && !first) first = el; }, ok() { if (first) { first.closest('.field').scrollIntoView({ block: 'center' }); if (first.matches('input,select,textarea')) first.focus({ preventScroll: true }); } return !first; } }; };
  // Uploads use FileReader: the image shows on the tile and (via onChange) on the live pass.
  function wireForm(UPS, onChange) {
    const root = document.querySelector('[data-pform]');
    root.addEventListener('click', e => { const u = e.target.closest('[data-up]'); if (!u) return;
      if (e.target.closest('[data-up-pick]')) { e.preventDefault(); u.querySelector('[data-up-file]').click(); }
      else if (e.target.closest('[data-up-remove]')) { e.preventDefault(); UPS[u.dataset.up] = ''; setUp(u, ''); onChange(); } });
    root.addEventListener('change', e => { const f = e.target.closest('[data-up-file]'); if (!f || !f.files[0]) return; const u = f.closest('[data-up]'), file = f.files[0]; f.value = '';
      if (!/^image\//.test(file.type)) return setErr(u, 'Choose an image file (PNG, JPG or SVG).');
      const r = new FileReader(); r.onload = () => { UPS[u.dataset.up] = r.result; setUp(u, r.result); setErr(u, ''); onChange(); }; r.readAsDataURL(file); });
    ['input', 'change'].forEach(t => root.addEventListener(t, e => { if (e.target.closest('.field.has-error') && !e.target.matches('[data-up-file]')) setErr(e.target, ''); onChange(e); }));
    document.addEventListener('click', e => { if (e.target.closest('[data-pform] .chip, [data-pform] .icon-picker button')) onChange(e); }); // after app.js has moved the .on state
  }
  // Background: Bonuca template gradient, a flat colour or an image — never both. Business branding colour is the default when set.
  const bgChoice = (mode, color, img) => `<div class="choice-chips" data-bg-chips>${[['template', 'Bonuca template gradient'], ['flat', 'Flat colour (RGB)'], ['image', 'Background image']].map(([m, l]) => `<button class="chip ${m === mode ? 'on' : ''}" data-bg="${m}">${l}</button>`).join('')}</div><div data-bg-flat style="margin-top:10px" ${mode === 'flat' ? '' : 'hidden'}>${colorIn(color)}</div><div data-bg-img style="margin-top:10px" ${mode === 'image' ? '' : 'hidden'}>${up('bg', img, true)}</div>`;
  const bgInit = ps => ps.bgImg ? ['image', ps.bg && !ps.bg.startsWith('url') ? ps.bg : '#1747F8', ps.bgImg] : isHex(ps.bg) ? ['flat', ps.bg, ''] : ps.bg ? ['template', '#1747F8', ''] : isHex(brand().accent) ? ['flat', brand().accent, ''] : ['template', '#1747F8', ''];
  const bgRead = UPS => { const m = (document.querySelector('[data-bg-chips] .chip.on') || {}).dataset?.bg || 'template', c = document.querySelector('[data-bg-flat] [data-color]').value.trim();
    return { mode: m, color: c, bg: m === 'flat' ? (isHex(c) ? c : undefined) : m === 'image' && UPS.bg ? `url('${UPS.bg}') center/cover` : 'var(--wallet-gradient)', bgImg: m === 'image' ? UPS.bg || '' : '' }; };
  const bgSync = () => { const m = document.querySelector('[data-bg-chips] .chip.on').dataset.bg; document.querySelector('[data-bg-flat]').hidden = m !== 'flat'; document.querySelector('[data-bg-img]').hidden = m !== 'image'; };
  const bgCheck = (V, UPS) => { const b = bgRead(UPS); V.t(document.querySelector('[data-bg-flat] [data-color]'), b.mode === 'flat' && !isHex(b.color) ? 'Enter a colour as #RRGGBB, e.g. #1747F8.' : ''); V.t(document.querySelector('[data-bg-img] [data-up]'), b.mode === 'image' && !UPS.bg ? 'Upload a background image or choose another background.' : ''); };

  /* ================= TIERS ================= */
  // Value in the program's upgrade requirement: "6 visits" · "60 points" · "6.00 EUR".
  const tierFmt = (c, n) => c.req === 'Total spending' ? `${(+n).toFixed(2)} ${c.currency}` : `${n} ${c.req === 'Points' ? 'point' : 'visit'}${n === 1 ? '' : 's'}`;
  // Customers level up automatically: the highest tier whose required value is reached.
  const tierAt = (c, v) => { let i = 0; c.tiers.forEach((t, j) => { if (v >= t[1]) i = j; }); const t = c.tiers[i], nx = c.tiers[i + 1]; return { i, name: t[0], bg: t[2], benefit: t[3], nx, left: nx ? +(nx[1] - v).toFixed(2) : 0, pct: nx ? Math.round((v - t[1]) / (nx[1] - t[1]) * 100) : 100 }; };
  // Client: "Silver → Wallet becomes silver. Gold → Wallet becomes gold." — the pass background is the reached tier's wallet colour.
  const tierPass = (p, v) => { const t = tierAt(p.cfg, v); return { type: 'tier', name: p.name, tier: t.name, next: t.nx ? `${tierFmt(p.cfg, t.left)} to ${t.nx[0]}` : 'Highest tier reached', pct: t.pct, bg: t.bg }; };
  g.TIER = { fmt: tierFmt, at: tierAt, pass: tierPass };
  const tierList = c => setup(c.tiers.map(([n, v, col, b], i) => [`<span class="row" style="gap:8px"><span class="swatch" style="width:22px;height:22px;padding:3px;border-radius:7px"><i style="--c:${col};border-radius:4px"></i></span>${esc(n)}${i ? '' : ' (Default)'}</span>`, `${tierFmt(c, v)} · ${esc(b)}`]));

  /* ================= DASHBOARD ================= */
  S.dashboard = ctx => {
    const o = ctx.owner, d = D.dash, cards = d.dist.reduce((a, x) => a + x[1], 0), active = PROGS().filter(p => p.status === 'Active').length;
    // One business, one dataset: Owner and Manager see the same totals; Wallet Cards = the Membership Distribution total.
    const added = (g.mem.get('customers-added', []) || []).length, biz = (g.mem.get('business', {}) || {}).name || 'Sample Business';
    const stats = [
      ['New Members Today', 5 + added, 'calendar'], ['New Members This Week', 5 + added, 'calendar'], ['New Members This Month', 12 + added, 'calendar'], ['Total Scans', 871, 'scan'],
      ['Active Programs', active, 'stamp'], ['Wallet Cards', cards, 'wallet'], ['Visits', 693, 'footprints', 'One customer on one day'], ['Returning Customers', 57, 'repeat', 'Visited on 2+ days']
    ];
    const statCard = ([l, v, ic, note]) => `<div class="card hover stat reveal-up"><div class="lbl">${l}<span class="ico">${icon(ic, 'sm')}</span></div><div class="val" data-count="${v}">${v}</div>${note ? `<div class="note">${note}</div>` : ''}</div>`;
    const feature = `<div class="card stat feature reveal-up" style="grid-row:span 2;display:flex;flex-direction:column">
      <div class="lbl">Total Members<span class="ico">${icon('users', 'sm')}</span></div>
      <div class="val" style="font-size:56px;margin-top:14px" data-count="${64 + added}">${64 + added}</div>
      <div class="note">${badge(`+${12 + added} this month`, 'green')}</div>
      <div style="margin-top:auto;padding-top:14px">${sparkline(d.growth)}</div>
      <div class="note" style="display:flex;justify-content:space-between"><span>${d.growthLabels[0]}</span><span>${d.growthLabels.at(-1)}</span></div>
    </div>`;
    const tv = ctx.opts.growthView || 'Chart';
    const cg = U.chartTableToggle('growth', U.lineChart(d.growthLabels, d.growth, { max: 80, every: 4, marker: true }), d.growthLabels.map((l, i) => ['2026-' + l, d.growth[i]]), ['Date', 'Total members'], tv);
    const ds = U.chartTableToggle('scans', U.barChart(d.growthLabels, d.scans, { max: 60, every: 3, bw: 12, peak: '#0B0B0F' }), d.growthLabels.map((l, i) => ['2026-' + l, d.scans[i]]), ['Date', 'Scans']);
    const mg = U.chartTableToggle('monthly', U.barChart(d.monthsL, d.months, { max: 16, every: 2, bw: 30, c1: '#8B7CF6', c2: '#1747F8' }), d.monthsL.map((l, i) => [l, d.months[i]]), ['Month', 'New members']);
    const tp = U.chartTableToggle('top', U.hBarChart(d.top.map(x => x[0]), d.top.map(x => x[1]), { max: 280 }), d.top, ['Program', 'Scans']);
    const md = U.chartTableToggle('dist', U.donut(d.dist.map(([l, v], i) => ({ l, v, c: ['#1747F8', '#8B7CF6', '#4FC3F7', '#22B07D'][i] })), { center: 'wallet cards' }), d.dist, ['Program', 'Wallet cards']);
    const chartCard = (t, sub, x, cls = '') => card({ title: t, sub, actions: x.seg, body: x.body, cls: 'reveal-up ' + cls });
    return { nav: 'Dashboard', html: `${pageHead({ eyebrow: `${icon('dashboard', 'sm')} Overview · ${esc(biz)}`, title: '<span class="hl">Dashboard</span>', sub: `Good afternoon, ${o ? 'Sam' : 'Mia'} — here’s how your loyalty programs are performing.`, actions: `<a class="btn btn-ghost" href="${ctx.link('28-')}">${icon('scan', 'sm')}Open scanner</a><a class="btn btn-primary" href="${ctx.link('04-')}">${icon('plus', 'sm')}Create Program</a>` })}
      <div class="grid" style="grid-template-columns:1.25fr repeat(4,minmax(0,1fr))">${feature}${stats.map(statCard).join('')}</div>
      <div class="grid g2" style="margin-top:18px">${chartCard('Customer Growth', 'Total members, last 30 days', cg)}${chartCard('Daily Scans', 'Last 30 days', ds)}${chartCard('Monthly Growth', 'New members per month, last 12 months', mg)}${chartCard('Top Programs', 'By scans', tp)}</div>
      <div style="margin-top:18px">${chartCard('Membership Distribution', 'Wallet cards per program', md)}</div>` };
  };
  function sparkline(v) {
    const W = 260, H = 70, mx = Math.max(...v), mn = Math.min(...v); const pts = v.map((y, i) => [W * i / (v.length - 1), H - 6 - (H - 12) * (y - mn) / (mx - mn || 1)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:70px"><defs><linearGradient id="spk" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#FFD43B" stop-opacity=".35"/><stop offset="1" stop-color="#FFD43B" stop-opacity="0"/></linearGradient></defs><path class="area" d="${d} L${W},${H} L0,${H} Z" fill="url(#spk)"/><path class="line" d="${d}" fill="none" stroke="#FFD43B" stroke-width="2.4" style="--len:800"/><circle cx="${pts.at(-1)[0]}" cy="${pts.at(-1)[1]}" r="4" fill="#FFD43B"/></svg>`;
  }

  /* ================= PROGRAMS LIST ================= */
  const TYPES = [['Stamp Card', 'stamp', '#1747F8', 'Customers collect stamps per visit and earn a reward.', '06-'], ['Membership Card', 'crown', '#7C3AED', 'Identifies members and states their benefit at checkout.', '07-'], ['Tier Program', 'layers', '#0F9D6E', 'Levels unlocked by visits, points or spend.', '08-'], ['Points Program', 'coins', '#C2410C', 'Points per purchase, redeemed for rewards.', '09-']];
  S.programs = ctx => {
    // Drafts saved from onboarding (09) or "Save as draft" (demo memory 'draft-programs') finish their setup in the matching new-program form.
    const KT = { stamp: [0, 'stamp', '06-'], membership: [1, 'crown', '07-'], tier: [2, 'layers', '08-'], points: [3, 'coins', '09-'] };
    const drafts = g.mem.get('draft-programs', []).filter(d => d && d.name && KT[d.type]).map(d => ({ id: '', name: d.name, type: TYPES[KT[d.type][0]][0], status: d.status === 'Active' ? 'Active' : 'Draft', c: TYPES[KT[d.type][0]][2], icon: KT[d.type][1], date: d.status === 'Active' ? 'Published this session' : 'Draft · setup not finished', href: ctx.link(KT[d.type][2]) }));
    const progs = [...PROGS().map(p => ({ ...p, href: ctx.link(DETAIL[p.id]) })), ...drafts], counts = { All: progs.length }; ['Active', 'Inactive', 'Draft'].forEach(s => counts[s] = progs.filter(p => p.status === s).length);
    const cards = progs.map(p => `<article class="card hover prog-card reveal-up" style="--c:${p.c}" data-status="${p.status}" data-href="${p.href}" tabindex="0">
      <div class="top"><span class="ti">${icon(p.icon, 'lg')}</span>${status(p.status)}</div>
      <div><h3>${esc(p.name)}</h3><p class="muted" style="margin-top:2px">${p.type}</p></div>
      <div class="foot"><span>${icon('calendar', 'sm')} ${p.date}</span><span class="arrow">${icon('arrowRight', 'sm')}</span></div></article>`).join('');
    const addedCamps = (g.mem.get('campaigns-added', []) || []).map(c => `<tr><td><div class="person"><span class="feed-ic" style="background:${c.type.startsWith('Stamp') ? 'var(--color-accent-soft);color:var(--color-accent)' : 'var(--color-highlight-soft);color:#9A7300'}">${icon(c.type.startsWith('Stamp') ? 'stamp' : 'ticket', 'sm')}</span>${esc(c.name)}</div></td><td>${badge(c.type, 'outline')}</td><td>${status('Active')}</td><td class="muted">${c.created}</td><td></td></tr>`).join('');
    const camp = `<div class="table-wrap"><table class="t"><thead><tr><th>Campaign</th><th>Type</th><th>Status</th><th>Created</th><th></th></tr></thead><tbody>${addedCamps}${D.campaigns.map(x => CMP(x.id)).map(c => `<tr class="clickable" data-href="${campLink(ctx, c)}"><td><div class="person"><span class="feed-ic" style="background:${c.type.startsWith('Stamp') ? 'var(--color-accent-soft);color:var(--color-accent)' : 'var(--color-highlight-soft);color:#9A7300'}">${icon(c.type.startsWith('Stamp') ? 'stamp' : 'ticket', 'sm')}</span>${esc(c.name)}</div></td><td>${badge(c.type, 'outline')}</td><td>${status(c.status)}</td><td class="muted">${c.created}</td><td class="num">${icon('chevronRight', 'sm')}</td></tr>`).join('')}</tbody></table></div>`;
    const m1 = modal({ id: 'programType', open: ctx.opts.modal === 'programType', wide: true, title: 'Choose a program type', sub: 'The type can’t be changed after creation.', body: `<div class="type-grid">${TYPES.map(([n, ic, c, d, pre]) => `<button class="type-card" style="--c:${c}" data-href="${ctx.link(pre)}"><span class="ti">${icon(ic)}</span><b>${n}</b><small>${d}</small></button>`).join('')}</div>` });
    const m2 = modal({ id: 'campaignType', open: ctx.opts.modal === 'campaignType', wide: true, title: 'Choose a campaign type', sub: 'Campaigns are special QR codes layered on top of programs, or standalone vouchers.', body: `<div class="type-grid">${[['Stamp card acquisition campaign', 'stamp', '#1747F8', 'A special join QR layered on an existing Stamp Card program.', '17-'], ['One-time voucher campaign', 'ticket', '#C2410C', 'Standalone voucher; each claim can be redeemed once.', '19-']].map(([n, ic, c, d, pre]) => `<button class="type-card" style="--c:${c}" data-href="${ctx.link(pre)}"><span class="ti">${icon(ic)}</span><b>${n}</b><small>${d}</small></button>`).join('')}</div>` });
    return { nav: 'Loyalty Programs', html: `${pageHead({ eyebrow: `${icon('stamp', 'sm')} Programs`, title: 'Loyalty <span class="hl">Programs</span>', sub: 'Programs are what customers join. Campaigns are special QR codes layered on top (acquisition) or standalone vouchers.', actions: `<button class="btn btn-ghost" data-open="campaignType">${icon('ticket', 'sm')}Create campaign</button><button class="btn btn-primary" data-open="programType">${icon('plus', 'sm')}Create Program</button>` })}
      ${tabs(Object.entries(counts).map(([k, v]) => [k, null, v]), 'All', 'data-filter-tabs')}
      <div class="grid g3" data-prog-grid>${cards}</div>
      <div class="empty card" data-prog-empty hidden style="margin-top:0"><div class="ill">${icon('archive', 'lg')}</div><b style="color:var(--color-text-primary)">Nothing here yet</b><span>No programs with this status.</span></div>
      <h2 class="section-title">Campaigns</h2>${card({ title: null, body: null, cls: 'reveal-up', attrs: 'style="overflow:hidden"' }).replace('</section>', camp + '</section>')}
      <p class="hint" style="margin-top:10px">Stamp card acquisition campaigns and one-time voucher campaigns.</p>${m1}${m2}`, after() {
        document.querySelector('[data-filter-tabs]').addEventListener('tab', e => { let n = 0; document.querySelectorAll('[data-prog-grid] > article').forEach(a => { const show = e.detail === 'All' || a.dataset.status === e.detail; a.hidden = !show; n += show; }); document.querySelector('[data-prog-empty]').hidden = n > 0; });
      } };
  };

  /* ================= PROGRAM FORM (new + edit) ================= */
  const KIND = { stamp: ['Stamp Card', 'Digital Stamp Card'], membership: ['Membership Card', 'Membership Card'], tier: ['Tier Program', 'Tier Program Pass'], points: ['Points Program', 'Generic layout (no launch template)'] };
  const sec = (n, title, sub, body, id) => `<section class="card reveal-up" ${id ? `id="${id}"` : ''}><header class="card-head split"><div class="row" style="align-items:flex-start"><span class="badge ink lg" style="width:28px;padding:0;justify-content:center">${n}</span><div><div class="card-title">${title}</div>${sub ? `<div class="card-sub">${sub}</div>` : ''}</div></div></header><div class="card-body">${body}</div></section>`;
  // Client: "Allow Multiple Stamps" — default OFF (1 stamp per scan), changeable anytime, max 3 / 5 / unlimited.
  const multiStamps = m => {
    const sel = m.max === 'Unlimited' ? 'Unlimited' : [3, 5].includes(m.max) ? String(m.max) : 'Custom';
    return `<div class="stack" style="gap:12px">${optionRow('Allow Multiple Stamps', 'Off: one stamp per scan. Can be changed anytime, even while the program is running.', m.on, 'data-reveal="[data-multi-max]" data-multi-toggle')}
      <div data-multi-max ${m.on ? '' : 'hidden'}>${field({ label: 'Max stamps per scan', required: true, input: `<div class="choice-chips" data-max-chips>${['3', '5', 'Unlimited', 'Custom'].map(v => `<button class="chip ${v === sel ? 'on' : ''}" data-max="${v}">${v}</button>`).join('')}</div><input class="input" type="number" min="2" value="${sel === 'Custom' ? m.max : ''}" placeholder="e.g. 4" aria-label="Custom max stamps per scan" data-max-custom style="max-width:140px;margin-top:10px" ${sel === 'Custom' ? '' : 'hidden'}>`, hint: 'Team permissions still apply: employees can award multiple stamps only if they have permission.' })}</div></div>`;
  };
  const rewardRow = (i, n = '', v = '') => `<div class="reveal" data-reward-list ${i > 1 ? 'style="margin-top:10px"' : ''}><div class="row" style="align-items:flex-end"><div style="flex:1">${field({ label: `Reward ${i} name`, required: true, input: input({ value: n, ph: 'e.g. Free Coffee', attrs: 'data-rw-name' }) })}</div><div style="width:150px">${field({ label: 'Required points', required: true, input: `<div class="input-wrap">${icon('coins')}${input({ type: 'number', value: v === '' ? '' : String(v), ph: 'e.g. 100', attrs: 'min="1" data-rw-pts' })}</div>` })}</div><button class="icon-btn" aria-label="Remove reward" style="margin-bottom:4px">${icon('trash')}</button></div><div style="margin-top:12px">${field({ label: `Reward ${i} icon`, optional: true, input: up('rw', '') })}</div></div>`;
  const PT0 = { currency: 'EUR', method: 'Manual', basis: 1, pts: 10, perVisit: 10, rounding: 'Round down', min: null, max: null };
  const CURS = ['EUR', 'USD', 'GBP', 'CZK', 'TRY', 'CHF', 'PLN'];

  S.programForm = ctx => {
    const edit = !!ctx.opts.edit, warn = ctx.opts.warn, id = edit ? (P(qid()) ? qid() : 'coffee') : null, p = id && P(id), k = p ? p.kind : ctx.opts.kind, [tname, cap] = KIND[k];
    const ps = p ? p.pass : {}, br = brand(), nm = p ? (warn ? p.name + ' Plus' : p.name) : '';
    // Uploaded images (data URLs). true = the program's existing demo logo. New programs start from the business branding logo.
    const UPS = { logo: p ? (ps.logo === false ? '' : ps.logo || true) : (/^data:image\//.test(br.logo || '') ? br.logo : ''), icon: ps.appIcon || '', hero: ps.hero || '', bg: ps.bgImg || '', stamp: ps.stampImg || '' };
    const [bgMode, bgCol] = bgInit(ps), fg0 = ps.fg || '#FFFFFF';
    const basics = field({ label: 'Program Name', required: true, input: input({ value: nm, ph: edit ? '' : 'e.g. Coffee Card', attrs: 'data-bind-src="name" data-fallback="Program name"' }), hint: 'Internal name and the header text on the wallet pass.' });
    const design = `<div class="form-grid">
      ${field({ label: 'Program Logo', required: true, input: up('logo', UPS.logo), hint: 'Small square logo, top-left of the wallet pass.' })}
      ${field({ label: 'Program Icon', optional: true, input: up('icon', UPS.icon), hint: 'Defaults to the logo. Used in notification banners and the Wallet list.' })}
      ${field({ label: 'Hero / Strip Image', optional: true, input: up('hero', UPS.hero, true), hint: 'Optional wide banner across the top of the pass.' })}
      ${k !== 'tier' ? field({ label: 'Background <span class="opt">— a colour or an image, not both</span>', input: bgChoice(bgMode, bgCol, UPS.bg) }) : ''}
      <div data-fg>${field({ label: 'Text Colour', required: true, input: colorIn(fg0), hint: 'Colour of all text on the pass.' })}</div>
    </div>`;
    const c = { ...PT0, ...(p && p.cfg) };
    const curField = field({ label: 'Currency', required: true, input: `${select([...CURS, 'Other'], CURS.includes(c.currency) ? c.currency : 'Other', 'data-pt-cur')}<input class="input" placeholder="Currency code, e.g. SEK" aria-label="Other currency" data-pt-cur-other value="${CURS.includes(c.currency) ? '' : esc(c.currency)}" style="margin-top:10px" ${CURS.includes(c.currency) ? 'hidden' : ''}>`, hint: 'Set per program, never account-wide. Employees never pick a currency during a scan.' });
    const nv = v => v == null ? '' : String(v);
    // Currency + earning rule are shared by the Points Program and points-based / spend-based tiers (P4.4/P4.5: same rules as the Points Program).
    const ptsFields = `      ${field({ label: 'Awarding Method', required: true, input: select(['Manual', 'Fixed points per visit'], c.method, 'data-pt-method'), hint: 'Manual: the employee enters the purchase amount. Fixed: every scan gives the same points.' })}
      ${field({ label: 'Purchase amount', required: true, input: input({ type: 'number', value: nv(c.basis), attrs: 'min="0.01" step="0.01" data-pt-basis' }), hint: 'Calculation basis, e.g. 1, 10 or 5.' })}
      ${field({ label: 'Points awarded for that amount', required: true, input: input({ type: 'number', value: nv(c.pts), attrs: 'min="1" data-pt-pts' }), hint: `Earning rule: <b data-pt-rule>1 EUR = 10 points</b>` })}
      <div data-pt-fixed hidden>${field({ label: 'Fixed points per visit', required: true, input: input({ type: 'number', value: nv(c.perVisit), attrs: 'min="1" data-pt-per' }) })}</div><div data-pt-fixed hidden></div>
      <div data-pt-manual>${field({ label: 'Rounding', required: true, input: select(['Round down', 'Round up', 'Round to nearest'], c.rounding, 'data-pt-round'), hint: 'Applied to the calculated points.' })}</div>
      <div data-pt-manual>${field({ label: 'Minimum purchase amount', optional: true, input: `<div class="row">${input({ type: 'number', value: nv(c.min), attrs: 'min="0" step="0.01" data-pt-min' })}<b class="muted" data-pt-unit>EUR</b></div>`, hint: 'Purchases below this earn no points.' })}</div>
      <div data-pt-manual>${field({ label: 'Maximum points per transaction', optional: true, input: input({ type: 'number', value: nv(c.max), attrs: 'min="1" data-pt-max' }), hint: 'Caps how many points one scan can award.' })}</div>`;
    let rules = '';
    if (k === 'stamp') rules = `<div class="form-grid">
      ${field({ label: 'Number of Stamps Required', required: true, input: input({ type: 'number', value: String(ps.total || 10), attrs: 'min="2" max="30" data-f-total' }), hint: 'How many stamps fill the card, e.g. 10.' })}
      ${field({ label: 'Stamp Icon <span class="opt">(optional — default coffee cup)</span>', input: `<div class="icon-picker">${['coffee', 'star', 'heart', 'scissors', 'cookie', 'check'].map(i => `<button class="${i === (ps.icon || 'coffee') ? 'on' : ''}" data-icon="${i}" aria-label="${i}">${icon(i)}</button>`).join('')}</div>` })}
      <div></div>${field({ label: 'Custom stamp icon', optional: true, input: up('stamp', UPS.stamp), hint: 'Replaces the chosen icon on every stamp.' })}
      ${field({ label: 'Reward Description', required: true, input: input({ value: p ? ps.reward : '', ph: 'e.g. 1 Free Coffee', attrs: 'data-bind-src="reward" data-fallback="Reward description"' }), hint: 'What the customer gets, e.g. “1 Free Coffee”.' })}
      <div class="full">${multiStamps(p ? p.multi : { on: false, max: 3 })}</div></div>`;
    // Client: "VIP Member · 10% Discount · Permanent member benefits · No stamps. Just identification." (E6: no validity / renewal / end date.)
    if (k === 'membership') rules = `<div class="stack">${callout('info', '', 'Permanent member benefits. No stamps — just identification.')}
      ${field({ label: 'Benefit', required: true, input: input({ value: p ? ps.benefit : '', ph: 'e.g. 10% Discount', attrs: 'data-bind-src="benefit" data-fallback="Benefit"' }), hint: 'Main line on the pass and what the employee sees when scanning a member.' })}</div>`;
    // Client tiers: 2–5 tiers, editable names, upgrade requirement (visits / points / total spending), required value, rewards & benefits, colour + wallet design
    // per tier, automatic level-up. E4: no downgrade rule. E7: no "Enable Tiers" toggle — choosing the Tier Program type is the choice.
    if (k === 'tier') {
      // Default suggestions, all editable: Member (Default) · Silver – 10 visits · Gold – 25 visits · Platinum – 50 visits; Diamond available as the 5th.
      // ❓ The client gives no default required value for Diamond — left empty.
      const BASE = [['Member', 0, '#3A3F55', ''], ['Silver', 10, '#8A8FA3', ''], ['Gold', 25, '#B8902E', ''], ['Platinum', 50, '#5E6A7D', ''], ['Diamond', '', '#0369A1', '']];
      const T = p ? [...c.tiers, ...BASE.slice(c.tiers.length)] : BASE, nT = p ? c.tiers.length : 4;
      rules = `<div class="stack"><div class="form-grid">${field({ label: 'Number of Tiers', required: true, input: select(['2', '3', '4', '5'], String(nT), 'data-tier-n'), hint: 'Between 2 and 5.' })}${field({ label: 'Upgrade Requirement', required: true, input: select(['Visits', 'Points', 'Total spending'], c.req || 'Visits', 'data-tier-req'), hint: 'One requirement applies to all tiers. Customers level up automatically.' })}
      <div data-tier-cur hidden>${curField}</div><div data-tier-cur hidden></div></div>
      <div class="form-grid" data-tier-pts hidden>${ptsFields}</div>
      <div class="tier-ladder stack" data-tier-ladder>${T.map(([n, v, col, b], i) => `<div class="reveal" style="border-left:4px solid ${col}" data-tier ${i < nT ? '' : 'hidden'}><div class="row between"><div class="row"><span class="medal" style="background:${col};color:#fff">${i + 1}</span><b style="font-family:var(--font-display);font-size:16px">Tier ${i + 1}</b>${i ? '' : badge('Default', 'outline')}</div><span data-tier-badge>${badge(v === '' ? '—' : v + ' visits', 'outline')}</span></div>
        <div class="form-grid" style="margin-top:14px">${field({ label: 'Tier Name', required: true, input: input({ value: n, attrs: 'data-tier-name' }) })}${field({ label: 'Required Value <span data-tier-unit>(visits)</span>', required: true, input: input({ type: 'number', value: String(v), ph: 'e.g. 100', attrs: 'min="0" step="any" data-tier-val' }) })}
        ${field({ label: 'Wallet Colour', required: true, input: colorIn(col), hint: 'The pass background once a customer reaches this tier.' })}${field({ label: 'Tier Badge / Icon', optional: true, input: up('badge', '') })}
        <div class="full">${field({ label: 'Rewards &amp; Benefits', required: true, input: input({ value: b, ph: 'e.g. Free birthday drink, priority seating', attrs: 'data-tier-ben' }) })}</div></div></div>`).join('')}</div></div>`;
    }
    // Client points configuration: currency per program, "<amount> <currency> = <points> points", Fixed per visit or Manual.
    if (k === 'points') { const rw = p ? c.rewards : [['', '']];
      rules = `<div class="form-grid">
      ${curField}
${ptsFields}
      <div class="full">${field({ label: 'Rewards <span class="opt">— at least one reward</span>', required: true, input: `<div data-rewards>${rw.map(([n, v], i) => rewardRow(i + 1, n, v)).join('')}</div><button class="btn btn-ghost btn-sm" style="margin-top:10px;align-self:flex-start" data-add-reward>${icon('plus', 'sm')}Add reward</button>`, hint: 'e.g. 100 points → Free Coffee · 250 points → Free Dessert · 500 points → Free Burger' })}</div>
      ${field({ label: 'Point expiry period', optional: true, input: `<div class="row">${input({ type: 'number', value: nv(c.pointExpiry), attrs: 'min="1" style="max-width:120px" data-pt-pexp' })}<b class="muted">months</b></div>`, hint: 'Unused points expire after this period. Leave empty for no expiry.' })}
      ${field({ label: 'Reward expiry period', optional: true, input: `<div class="row">${input({ type: 'number', value: nv(c.rewardExpiry), attrs: 'min="1" style="max-width:120px" data-pt-rexp' })}<b class="muted">days</b></div>`, hint: 'An earned reward expires if not redeemed in this period. Leave empty for no expiry.' })}</div>`; }
    const terms = field({ label: 'Terms &amp; Conditions', optional: true, input: textarea(p ? p.terms : '', 'e.g. One stamp per purchase. Not exchangeable for cash.', 'data-f-terms'), hint: 'Shown on the back of the wallet pass — use the Front/Back switch above the preview.' });
    g.__pass = { ...ps, type: k, name: nm || 'Program name', logo: UPS.logo === true ? undefined : UPS.logo || false };
    const detail = p && ctx.link(DETAIL[id]);
    const actions = edit ? `<button class="btn btn-primary btn-lg" data-save>${icon('check', 'sm')}Save</button><a class="btn btn-text" href="${detail}">Cancel</a>` : `<button class="btn btn-primary btn-lg" data-publish>${icon('send', 'sm')}Publish</button><button class="btn btn-ghost btn-lg" data-draft>Save as draft</button>`;
    const wm = modal({ id: 'warn', open: !!warn, title: 'Update every issued wallet pass?', body: `<p style="margin-bottom:14px">You changed <b data-warn-fields>Program Name</b>. This program is live, so the change applies retroactively to every wallet pass already issued.</p>${callout('', 'Wallet integration not connected', 'Pass updates are pushed by the Apple/Google Wallet backend integration, which is not available in this environment.')}`, foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-close data-warn-ok data-toast="Saved — applies to all issued passes">Save (applies to all issued passes)</button>` });
    return { nav: 'Loyalty Programs', title: edit ? 'Edit ' + p.name : 'New ' + tname, html: `${pageHead({ eyebrow: crumb('Loyalty Programs', ctx.link('03-')) + (edit ? crumb(esc(p.name), detail) + 'Edit' : 'New program'), title: edit ? `Edit <span class="hl">${esc(p.name)}</span>` : `New <span class="hl">${tname}</span>`, sub: edit ? 'Changes to master fields update every issued pass.' : 'Fill in the sections below — the wallet preview updates as you type.' })}
      <div class="layout-preview"><div class="stack" data-pform>
        ${sec(1, 'Basics', `${tname} · program type cannot be changed after creation`, basics)}
        ${sec(2, 'Wallet design', k === 'tier' ? 'Shared across every tier’s pass. The background switches to each tier’s wallet colour.' : 'These master fields render on the wallet pass.', design)}
        ${sec(3, 'Program rules', '', rules)}
        ${sec(4, 'Terms &amp; Conditions', '', terms)}
        <div class="row reveal-up">${actions}</div>
      </div><div class="sticky">${k === 'tier' ? '<div class="choice-chips" data-tier-chips data-preview-ok style="margin-bottom:12px"></div>' : ''}${phonePreview(g.__pass, cap, { back: true })}</div></div>${edit ? wm : ''}`, after() {
        const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)], val = s => ($(s) || {}).value?.trim() ?? '';
        const fgIn = $('[data-fg] [data-color]'), nameIn = $('[data-bind-src="name"]');
        const cur = $('[data-pt-cur]'), other = $('[data-pt-cur-other]'), method = $('[data-pt-method]');
        const curName = () => cur ? (cur.value === 'Other' ? (other.value.trim() || 'Other') : cur.value) : '';
        const common = () => { const b = k === 'tier' ? {} : bgRead(UPS); return { name: nameIn.value.trim() || 'Program name', logo: UPS.logo === true ? undefined : UPS.logo || false, hero: UPS.hero, fg: isHex(fgIn.value.trim()) ? fgIn.value.trim() : undefined, ...(k === 'tier' ? {} : { bg: b.bg }), terms: val('[data-f-terms]'), face: (g.__pass || {}).face }; };
        const rewards = () => $$('[data-reward-list]').map(r => [r.querySelector('[data-rw-name]').value.trim(), parseInt(r.querySelector('[data-rw-pts]').value, 10) || 0]);
        // Tiers: show 2–5 tier blocks, unit follows the upgrade requirement, preview any tier's pass (its wallet colour).
        const tn = $('[data-tier-n]'), req = $('[data-tier-req]'), chips = $('[data-tier-chips]'); let sel = 0;
        const unit = () => req.value === 'Visits' ? 'visits' : req.value === 'Points' ? 'points' : curName();
        const shown = () => $$('[data-tier]').filter(b => !b.hidden), tnm = b => b.querySelector('[data-tier-name]').value.trim() || 'Tier', tval = b => +b.querySelector('[data-tier-val]').value || 0;
        const show = i => { const bl = shown(); sel = Math.min(i, bl.length - 1); const b = bl[sel], nx = bl[sel + 1];
          g.__pass = { ...common(), type: 'tier', tier: tnm(b), next: nx ? `${+(tval(nx) - tval(b)).toFixed(2)} ${unit()} to ${tnm(nx)}` : 'Highest tier reached', pct: 0, bg: b.querySelector('[data-color]').value };
          U.repaint(); const sig = bl.map(tnm).join('|'); // rebuild only when names change, so a blur-triggered refresh never swaps the chip being clicked
          if (chips.dataset.sig !== sig) { chips.dataset.sig = sig; chips.innerHTML = bl.map((x, j) => `<button class="chip" data-tier-pv="${j}">${esc(tnm(x))}</button>`).join(''); }
          chips.querySelectorAll('.chip').forEach((x, j) => x.classList.toggle('on', j === sel)); };
        const sync = () => { const n = +tn.value, u = unit();
          $$('[data-tier]').forEach((b, i) => { b.hidden = i >= n; const v = b.querySelector('[data-tier-val]').value; b.querySelector('[data-tier-unit]').textContent = `(${u})`; b.querySelector('[data-tier-badge]').innerHTML = badge(v === '' ? '—' : `${v} ${u}`, 'outline'); });
          $$('[data-tier-cur]').forEach(e => e.hidden = req.value === 'Visits'); $('[data-tier-pts]').hidden = req.value !== 'Points'; show(sel); };
        const refresh = () => {
          if (cur) { const n = +val('[data-pt-pts]') || 0; $('[data-pt-rule]').textContent = `${+val('[data-pt-basis]') || 0} ${curName()} = ${n} point${n === 1 ? '' : 's'}`; $$('[data-pt-unit]').forEach(u => u.textContent = curName()); }
          if (k !== 'tier') bgSync();
          if (k === 'tier') return sync();
          const cm = common();
          if (k === 'stamp') { const tot = Math.max(1, Math.min(30, parseInt(val('[data-f-total]'), 10) || 10)); g.__pass = { ...cm, type: 'stamp', reward: val('[data-bind-src="reward"]') || 'Reward description', total: tot, filled: edit ? Math.min(3, tot - 1) : 0, icon: ($('.icon-picker .on') || {}).dataset?.icon || 'coffee', stampImg: UPS.stamp }; }
          if (k === 'membership') g.__pass = { ...cm, type: 'membership', benefit: val('[data-bind-src="benefit"]') || 'Benefit' };
          if (k === 'points') g.__pass = { ...cm, type: 'points', balance: BAL + ' pts', ...nextOf(rewards()) };
          U.repaint();
        };
        if (method) { const m = () => { const fixed = method.value === 'Fixed points per visit'; $$('[data-pt-fixed]').forEach(el => el.hidden = !fixed); $$('[data-pt-manual]').forEach(el => el.hidden = fixed); ['[data-pt-basis]', '[data-pt-pts]'].forEach(s => { $(s).closest('.field').hidden = fixed; }); };
          method.addEventListener('change', m); m(); cur.addEventListener('change', () => { other.hidden = cur.value !== 'Other'; }); }
        // Points rule: amount > 0 and points ≥ 1, flagged as you type.
        const ruleCheck = V => { if (!cur || (method.value !== 'Manual') || (k === 'tier' && req.value !== 'Points')) return; V.t($('[data-pt-basis]'), !(+val('[data-pt-basis]') > 0) ? 'Enter a purchase amount greater than 0.' : ''); const n = +val('[data-pt-pts]'); V.t($('[data-pt-pts]'), !(Number.isInteger(n) && n >= 1) ? 'Enter whole points, at least 1.' : ''); };
        ['[data-pt-basis]', '[data-pt-pts]'].forEach(s => $(s) && $(s).addEventListener('input', () => ruleCheck(checker())));
        wireForm(UPS, e => { if (e && e.target && e.target.closest && e.target.closest('.icon-picker') && UPS.stamp) { UPS.stamp = ''; setUp($('[data-up="stamp"]'), ''); } refresh(); });
        if (tn) { chips.addEventListener('click', e => { const ch = e.target.closest('[data-tier-pv]'); if (ch) show(+ch.dataset.tierPv); }); }
        $$('[data-max-chips] .chip').forEach(ch => ch.addEventListener('click', () => { $('[data-max-custom]').hidden = ch.dataset.max !== 'Custom'; }));
        const add = $('[data-add-reward]'); if (add) {
          const renum = () => $$('[data-reward-list]').forEach((r, i) => { r.style.marginTop = i ? '10px' : ''; r.querySelectorAll('label.label').forEach(l => l.innerHTML = l.innerHTML.replace(/Reward \d+/, 'Reward ' + (i + 1))); });
          add.onclick = () => { const box = $('[data-rewards]'); box.insertAdjacentHTML('beforeend', rewardRow(box.children.length + 1)); box.lastElementChild.style.animation = 'fadeUp .35s both'; refresh(); };
          $('[data-rewards]').addEventListener('click', e => { const rm = e.target.closest('[aria-label="Remove reward"]'); if (!rm) return; const rows = $$('[data-reward-list]');
            if (rows.length > 1) rm.closest('[data-reward-list]').remove(); else rows[0].querySelectorAll('[data-rw-name],[data-rw-pts]').forEach(x => x.value = ''); renum(); refresh(); });
        }
        refresh();
        // Validation on Publish / Save: inline errors, no success toast until every required field is valid.
        const validate = (draft) => { const V = checker();
          V.t(nameIn, nameIn.value.trim() ? '' : 'Program Name is required.'); if (draft) return V.ok();
          V.t($('[data-up="logo"]'), UPS.logo ? '' : 'Upload a program logo.');
          V.t(fgIn, isHex(fgIn.value.trim()) ? '' : 'Enter a colour as #RRGGBB, e.g. #FFFFFF.');
          if (k !== 'tier') bgCheck(V, UPS);
          if (k === 'stamp') { const t = +val('[data-f-total]'); V.t($('[data-f-total]'), !(Number.isInteger(t) && t >= 2 && t <= 30) ? 'Enter a whole number of stamps between 2 and 30.' : '');
            V.t($('[data-bind-src="reward"]'), val('[data-bind-src="reward"]') ? '' : 'Reward Description is required.');
            const mc = $('[data-max-custom]'); V.t(mc, $('[data-multi-toggle]').checked && !mc.hidden && !(parseInt(mc.value, 10) >= 2) ? 'Enter a custom maximum of at least 2.' : ''); }
          if (k === 'membership') V.t($('[data-bind-src="benefit"]'), val('[data-bind-src="benefit"]') ? '' : 'Benefit is required.');
          const ptsOn = k === 'points' || (k === 'tier' && req.value === 'Points'), curOn = ptsOn || (k === 'tier' && req.value === 'Total spending');
          if (curOn) V.t(other, cur.value === 'Other' && !/^[A-Za-z]{3}$/.test(other.value.trim()) ? 'Enter a 3-letter currency code, e.g. SEK.' : '');
          if (ptsOn) { ruleCheck(V); if (method.value !== 'Manual') { const f = +val('[data-pt-per]'); V.t($('[data-pt-per]'), !(Number.isInteger(f) && f >= 1) ? 'Enter whole points per visit, at least 1.' : ''); }
            if (method.value === 'Manual') { V.t($('[data-pt-min]'), val('[data-pt-min]') !== '' && !(+val('[data-pt-min]') >= 0) ? 'Enter 0 or more.' : ''); V.t($('[data-pt-max]'), val('[data-pt-max]') !== '' && !(Number.isInteger(+val('[data-pt-max]')) && +val('[data-pt-max]') >= 1) ? 'Enter whole points, at least 1.' : ''); } }
          if (k === 'points') { $$('[data-reward-list]').forEach(r => { const n = r.querySelector('[data-rw-name]'), v = r.querySelector('[data-rw-pts]'); V.t(n, n.value.trim() ? '' : 'Reward name is required.'); V.t(v, !(parseInt(v.value, 10) >= 1) ? 'At least 1 point.' : ''); });
            ['[data-pt-pexp]', '[data-pt-rexp]'].forEach(s => V.t($(s), val(s) !== '' && !(Number.isInteger(+val(s)) && +val(s) >= 1) ? 'Enter a whole number, at least 1 — or leave empty.' : '')); }
          if (k === 'tier') { let prev = null; shown().forEach(b => { const nIn = b.querySelector('[data-tier-name]'), vIn = b.querySelector('[data-tier-val]'), v = vIn.value.trim();
            V.t(nIn, nIn.value.trim() ? '' : 'Tier Name is required.');
            V.t(vIn, v === '' || !(+v >= 0) ? 'Enter a required value (0 or more).' : prev && +v <= +prev[1] ? `Must be higher than ${esc(prev[0])} (${prev[1]}).` : '');
            V.t(b.querySelector('[data-color]'), isHex(b.querySelector('[data-color]').value.trim()) ? '' : 'Enter a colour as #RRGGBB.');
            V.t(b.querySelector('[data-tier-ben]'), b.querySelector('[data-tier-ben]').value.trim() ? '' : 'Rewards & Benefits are required.');
            if (v !== '' && +v >= 0) prev = [tnm(b), v]; }); }
          return V.ok(); };
        const pb = $('[data-publish]'); if (pb) pb.onclick = () => { if (!validate()) return; g.mem.set('draft-programs', [...g.mem.get('draft-programs', []), { name: nameIn.value.trim(), type: k, status: 'Active' }]); g.toast('Program published'); setTimeout(() => { location.href = ctx.nav(ctx.link('03-')); }, 700); };
        const db = $('[data-draft]'); if (db) db.onclick = () => { if (!validate(true)) return; g.mem.set('draft-programs', [...g.mem.get('draft-programs', []), { name: nameIn.value.trim(), type: k, status: 'Draft' }]); g.toast('Saved as draft'); };
        if (!edit) return;
        // Master fields (render on every issued pass): editing them on a live program shows the retroactive-update warning.
        const MASTER = () => { const b = k === 'tier' ? {} : bgRead(UPS); return { 'Program Name': nameIn.value.trim(), 'Program Logo': String(UPS.logo), 'Program Icon': UPS.icon, 'Hero / Strip Image': UPS.hero, ...(k === 'tier' ? {} : { Background: b.mode + b.color + b.bgImg }), 'Text Colour': fgIn.value.trim().toUpperCase() }; };
        const m0 = MASTER(); if (warn) m0['Program Name'] = p.name;
        const save = () => { const cm = common(), b = k === 'tier' ? {} : bgRead(UPS), num = s => val(s) === '' ? null : +val(s), mc = ($('[data-max-chips] .chip.on') || {}).dataset?.max;
          const e = { name: nameIn.value.trim(), terms: cm.terms, pass: { logo: UPS.logo === true ? undefined : UPS.logo || false, appIcon: UPS.icon, hero: UPS.hero, fg: cm.fg, ...(k === 'tier' ? {} : { bg: b.bg, bgImg: b.bgImg }) } };
          if (k === 'stamp') { Object.assign(e.pass, { reward: val('[data-bind-src="reward"]'), total: +val('[data-f-total]'), icon: ($('.icon-picker .on') || {}).dataset?.icon, stampImg: UPS.stamp }); e.multi = { on: $('[data-multi-toggle]').checked, max: mc === 'Custom' ? parseInt(val('[data-max-custom]'), 10) : mc === 'Unlimited' ? 'Unlimited' : +mc }; }
          if (k === 'membership') e.pass.benefit = val('[data-bind-src="benefit"]');
          const ptc = cur ? { currency: curName(), method: method.value, basis: num('[data-pt-basis]'), pts: num('[data-pt-pts]'), perVisit: num('[data-pt-per]'), rounding: val('[data-pt-round]'), min: num('[data-pt-min]'), max: num('[data-pt-max]') } : {};
          if (k === 'tier') e.cfg = { req: req.value, ...ptc, tiers: shown().map(b => [tnm(b), tval(b), b.querySelector('[data-color]').value.trim(), b.querySelector('[data-tier-ben]').value.trim()]) };
          if (k === 'points') e.cfg = { ...ptc, rewards: rewards(), pointExpiry: num('[data-pt-pexp]'), rewardExpiry: num('[data-pt-rexp]') };
          memPut('program-edits', id, e); };
        $('[data-save]').onclick = () => { if (!validate()) return; const m1 = MASTER(), ch = Object.keys(m0).filter(x => m0[x] !== m1[x]);
          if (ch.length) { $('[data-warn-fields]').textContent = ch.join(', '); g.openModal('warn'); } else { save(); g.toast('Saved'); } };
        $('[data-warn-ok]').addEventListener('click', () => { save(); Object.assign(m0, MASTER()); });
      } };
  };

  /* ================= PROGRAM DETAIL ================= */
  // E11: lifecycle is only Active ⇄ Inactive (no archive / suspend) — ❓ pending client confirmation. Status is kept in demo memory (program-status).
  const activeToggle = (what, on) => optionRow('Active', `Turn off to make this ${what} inactive. Members keep their cards; scans show “temporarily unavailable”.`, on, 'data-life');
  const wireLife = (id, name) => { const t = document.querySelector('[data-life]'); if (!t) return; t.addEventListener('change', () => { const s = t.checked ? 'Active' : 'Inactive'; memPut('program-status', id, s); document.querySelector('[data-life-badge]').innerHTML = status(s); g.toast(`${name} is now ${s.toLowerCase()}`); }); };
  const setupRows = p => {
    const ps = p.pass, c = p.cfg;
    if (p.kind === 'stamp') return [['Stamps required', String(ps.total)], ['Reward', esc(ps.reward)], ['Multiple stamps per scan', p.multi.on ? `On · max ${p.multi.max}` : 'Off']];
    if (p.kind === 'membership') return [['Benefit', esc(ps.benefit)], ['Member benefits', 'Permanent']];
    if (p.kind === 'tier') return [['Number of tiers', String(c.tiers.length)], ['Upgrade requirement', c.req + (c.req === 'Visits' ? '' : ` · ${c.currency}`)], ...(c.req === 'Points' ? [['Awarding method', c.method === 'Manual' ? `Manual · ${c.basis} ${c.currency} = ${c.pts} points` : `${c.perVisit} points per visit`]] : []), ['Level-up', 'Automatic']];
    const man = c.method === 'Manual';
    return [['Currency', c.currency], ['Earning rule', man ? `${c.basis} ${c.currency} = ${c.pts} points` : `${c.perVisit} points per visit`], ['Awarding method', man ? 'Manual — employee enters the purchase amount' : 'Fixed points per visit'], ...(man ? [['Rounding', c.rounding], ['Minimum purchase amount', c.min != null ? `${c.min} ${c.currency}` : 'None'], ['Maximum points per transaction', c.max != null ? `${c.max} points` : 'No limit']] : []),
      ['Point expiry', c.pointExpiry ? `${c.pointExpiry} months` : 'No expiry'], ['Reward expiry', c.rewardExpiry ? `${c.rewardExpiry} days` : 'No expiry'], ['Rewards', c.rewards.map(([n, v]) => `${v} points = ${esc(n)}`).join(', ')]];
  };
  S.programDetail = ctx => {
    const p = P(ctx.opts.id); g.__pass = { ...p.pass };
    const lifeBody = () => P(p.id).status === 'Draft' ? `<button class="btn btn-primary btn-lg btn-block" data-publish-draft>${icon('send', 'sm')}Publish</button>` : activeToggle('program', P(p.id).status === 'Active');
    const qrBody = () => P(p.id).status === 'Draft' ? `<div class="empty"><div class="ill">${icon('qr', 'lg')}</div><b style="color:var(--color-text-primary)">No QR exists yet</b><span>Draft programs are invisible to customers.</span></div>` : qrPanel({ url: p.url, link: ctx.link('34-') });
    const life = card({ title: 'Lifecycle', icon: 'zap', actions: `<span data-life-badge>${status(p.status)}</span>`, body: `<div data-life-body>${lifeBody()}</div>`, cls: 'reveal-up' });
    const qrc = card({ title: 'Join QR code', icon: 'qr', sub: 'Generated the first time the program is published.', body: `<div data-qr-body>${qrBody()}</div>`, cls: 'reveal-up' });
    const st = card({ title: 'Setup', icon: 'sliders', body: setup(setupRows(p)), cls: 'reveal-up' });
    const tc = p.kind === 'tier' ? card({ title: 'Tiers', icon: 'layers', sub: 'Required value, rewards &amp; benefits and wallet colour per tier.', body: tierList(p.cfg), cls: 'reveal-up' }) : '';
    return { nav: 'Loyalty Programs', title: p.name, html: `${pageHead({ eyebrow: crumb('Loyalty Programs', ctx.link('03-')) + esc(p.name), title: esc(p.name), sub: `<span class="row" style="gap:8px">${badge(p.type, 'outline')}<span>${p.date}</span></span>`, actions: `${p.kind === 'points' ? `<a class="btn btn-ghost" href="${ctx.page('points-transactions')}">${icon('file', 'sm')}Transactions</a>` : ''}<a class="btn btn-ghost" href="${designLink(ctx, p.id)}">${icon('palette', 'sm')}Wallet design</a><a class="btn btn-primary" href="${editLink(ctx, p.id)}">${icon('edit', 'sm')}Edit</a>` })}
      <div class="layout-preview"><div class="stack">${life}${qrc}${st}${tc}</div><div class="sticky">${phonePreview(g.__pass, p.cap, { back: true })}</div></div>`, after() {
        wireLife(p.id, p.name);
        const pub = document.querySelector('[data-publish-draft]'); if (pub) pub.addEventListener('click', () => {
          memPut('program-status', p.id, 'Active'); document.querySelector('[data-life-badge]').innerHTML = status('Active');
          document.querySelector('[data-life-body]').innerHTML = lifeBody(); document.querySelector('[data-qr-body]').innerHTML = qrBody(); wireLife(p.id, p.name);
          g.toast('Program published — join QR generated'); });
      } };
  };

  /* ================= CAMPAIGN FORM (new + edit) ================= */
  // Client: starting stamps 0 / 1 / 2 / 3 / custom; optional welcome gift (presets or custom) issued as a separate voucher pass.
  const STARTS = [['0', 'Start with 0 stamps'], ['1', 'Start with 1 stamp'], ['2', 'Start with 2 stamps'], ['3', 'Start with 3 stamps'], ['Custom', 'Custom number of starting stamps']];
  const GIFTS = ['Free coffee on your next visit', 'Free croissant', 'Free dessert', '20% discount', 'Custom reward'];
  const stampCard = (id, start) => { const p = P(id), pp = p ? p.pass : { reward: 'Reward', total: 10 }; return { ...(p ? pp : {}), type: 'stamp', name: p ? p.name : 'Stamp card', reward: pp.reward, total: pp.total, filled: Math.max(0, Math.min(start, pp.total - 1)), terms: p ? p.terms : '' }; };
  const giftVoucher = (reward, days, desc = '', cond = '') => ({ type: 'voucher', name: 'Welcome gift', reward: reward || 'Reward name', from: 'Day of scan', to: days > 0 ? `${days} days later` : '—', desc, cond });
  const twoPasses = gift => `<div class="stack"><div data-preview-card>${phonePreview(g.__passes.card, 'Pass 1 · Digital Stamp Card', { key: 'card', back: true })}</div><div data-gift-preview ${gift ? '' : 'hidden'}>${phonePreview(g.__passes.gift, 'Pass 2 · Welcome gift voucher', { key: 'gift', back: true })}</div></div>`;
  const keepFace = (key, v) => { g.__passes[key] = { ...v, face: (g.__passes[key] || {}).face }; U.repaint(key); };

  // A published campaign is kept in demo memory so it appears in the programs list and the QR codes page.
  const publishCamp = (ctx, name, type) => { g.mem.set('campaigns-added', [{ name, type, created: 'Oct 21, 2026' }, ...g.mem.get('campaigns-added', [])]); g.toast('Campaign published — QR generated'); setTimeout(() => { location.href = ctx.nav(ctx.link('03-')); }, 800); };
  S.campaignForm = ctx => {
    const cid = qid(), c0 = cid && CMP(cid);
    if (ctx.opts.kind === 'acq') {
      const c = c0 && c0.type.startsWith('Stamp') ? c0 : null, gift = c ? !!c.gift : !!ctx.opts.gift, cp = c && P(c.program);
      const s0 = c ? (['0', '1', '2', '3'].includes(String(c.start)) ? String(c.start) : 'Custom') : '0', g0 = c ? (GIFTS.includes(c.gift) ? c.gift : 'Custom reward') : GIFTS[0];
      g.__passes = { card: stampCard(c ? c.program : '', c ? c.start : 0), gift: giftVoucher(c ? c.gift : GIFTS[0], c ? c.validity : 0, c && c.desc, c && c.cond) };
      // Draft programs are invisible to customers, so they cannot be linked.
      const progs = PROGS().filter(p => p.kind === 'stamp' && p.status !== 'Draft');
      const starts = `<div class="choice-chips" data-start-chips>${STARTS.map(([v, l]) => `<button class="chip ${v === s0 ? 'on' : ''}" data-start="${v}">${l}</button>`).join('')}</div><input class="input" type="number" min="0" placeholder="e.g. 4" aria-label="Custom number of starting stamps" data-start-custom value="${s0 === 'Custom' ? c.start : ''}" style="max-width:140px;margin-top:10px" ${s0 === 'Custom' ? '' : 'hidden'}>`;
      const presets = `<div class="choice-chips" data-gift-chips>${GIFTS.map(v => `<button class="chip ${v === g0 ? 'on' : ''}" data-gift="${v}">${v}</button>`).join('')}</div>`;
      const body = `<div class="form-grid">
        ${field({ label: 'Campaign Name', required: true, input: input({ value: c ? c.name : '', ph: 'e.g. Cup-lid Campaign', attrs: 'data-camp-name' }), hint: 'Internal label, e.g. “Cup-lid Campaign”.' })}
        ${field({ label: 'Linked Stamp Card Program', required: true, input: select(['Select…', ...progs.map(p => p.name)], cp ? cp.name : 'Select…', 'data-camp-prog'), hint: 'Which stamp card this campaign issues. Draft programs appear once published.' })}
        <div class="full">${field({ label: 'Starting Stamps', required: true, input: starts, hint: 'Every new customer who scans this campaign QR gets a stamp card that already has these stamps, e.g. “Scan this QR code and start your coffee card with 2 free stamps.”' })}</div>
        <div class="full reveal" style="${gift ? 'border-color:color-mix(in srgb,var(--color-accent) 30%,transparent);background:var(--color-accent-softer)' : ''}"><div class="row between"><div class="row"><span class="feed-ic" style="background:var(--color-highlight-soft);color:#9A7300">${icon('gift', 'sm')}</span><div><b>Welcome Gift</b> <span class="opt">(optional)</span><div class="hint">An instant welcome reward, issued together with the stamp card as a separate voucher in Apple Wallet or Google Wallet and redeemed on the next visit.</div></div></div>${U.toggle(gift, 'data-reveal="#giftBody" data-gift-toggle')}</div>
          <div class="reveal-body" id="giftBody" ${gift ? '' : 'hidden'}><div style="grid-column:1/-1">${field({ label: 'Welcome gift', required: true, input: presets })}</div>${field({ label: 'Reward Name', required: true, input: input({ value: c ? c.gift || '' : GIFTS[0], ph: 'e.g. Free coffee on your next visit', attrs: 'data-gift-name' }) })}${field({ label: 'Validity Period (days)', optional: true, input: input({ type: 'number', value: c && c.validity ? String(c.validity) : '', ph: '30', attrs: 'min="1" data-gift-days' }) })}<div style="grid-column:1/-1">${field({ label: 'Description', optional: true, input: textarea(c && c.desc || '', '', 'data-gift-desc'), hint: 'Shown on the voucher pass.' })}</div><div style="grid-column:1/-1">${field({ label: 'Redemption Conditions', optional: true, input: textarea(c && c.cond || '', '', 'data-gift-cond'), hint: 'Shown on the back of the voucher pass.' })}</div></div></div>
      </div>`;
      const back = c && ctx.link('20-');
      const actions = c ? `<button class="btn btn-primary btn-lg" data-camp-save>${icon('check', 'sm')}Save</button><a class="btn btn-text" href="${back}">Cancel</a>` : `<button class="btn btn-primary btn-lg" data-camp-publish>${icon('qr', 'sm')}Publish &amp; generate QR</button><button class="btn btn-ghost btn-lg" data-camp-draft>Save as draft</button>`;
      return { nav: 'Loyalty Programs', title: c ? 'Edit ' + c.name : 'New campaign', html: `${pageHead({ eyebrow: crumb('Loyalty Programs', ctx.link('03-')) + (c ? crumb(esc(c.name), back) + 'Edit' : 'New campaign'), title: c ? `Edit <span class="hl">${esc(c.name)}</span>` : 'New <span class="hl">campaign</span>' })}
        <div class="layout-preview"><div class="stack" data-pform>${card({ title: 'Stamp card acquisition campaign', icon: 'stamp', sub: 'A special join QR layered on top of an existing Stamp Card program.', body, cls: 'reveal-up' })}
        <div class="row reveal-up">${actions}</div></div>
        ${twoPasses(gift)}</div>`, after() {
          const $ = s => document.querySelector(s), prog = $('[data-camp-prog]'), custom = $('[data-start-custom]'), name = $('[data-gift-name]'), days = $('[data-gift-days]'), nameIn = $('[data-camp-name]'), tog = $('[data-gift-toggle]');
          let start = s0;
          const pick = () => progs.find(x => x.name === prog.value), n0 = () => start === 'Custom' ? parseInt(custom.value, 10) || 0 : +start;
          // Custom starting stamps must leave at least one stamp to collect.
          const startErr = () => { const p = pick(), tot = p ? p.pass.total : 30, v = custom.value.trim(); return start !== 'Custom' ? '' : v === '' || !Number.isInteger(+v) || +v < 0 ? 'Enter a whole number of starting stamps (0 or more).' : +v > tot - 1 ? `${p ? p.name + ' has' : 'A stamp card has at most'} ${tot} stamps — start with at most ${tot - 1}.` : ''; };
          const upCard = () => { const p = pick(); custom.max = (p ? p.pass.total : 10) - 1; keepFace('card', stampCard(p ? p.id : '', n0())); if (start === 'Custom' && custom.value) setErr(custom, startErr()); };
          const gv = () => keepFace('gift', giftVoucher(name.value.trim(), parseInt(days.value, 10), $('[data-gift-desc]').value.trim(), $('[data-gift-cond]').value.trim()));
          document.querySelectorAll('[data-start-chips] .chip').forEach(ch => ch.addEventListener('click', () => { start = ch.dataset.start; custom.hidden = start !== 'Custom'; if (start !== 'Custom') setErr(custom, ''); upCard(); }));
          prog.addEventListener('change', () => { setErr(prog, ''); upCard(); }); custom.addEventListener('input', upCard); nameIn.addEventListener('input', () => setErr(nameIn, ''));
          document.querySelectorAll('[data-gift-chips] .chip').forEach(ch => ch.addEventListener('click', () => { const cu = ch.dataset.gift === 'Custom reward'; name.value = cu ? '' : ch.dataset.gift; setErr(name, ''); if (cu) name.focus(); gv(); }));
          [name, days, $('[data-gift-desc]'), $('[data-gift-cond]')].forEach(x => x.addEventListener('input', () => { setErr(x, ''); gv(); }));
          tog.addEventListener('change', e => { $('[data-gift-preview]').hidden = !e.target.checked; });
          upCard();
          const validate = draft => { const V = checker(); V.t(nameIn, nameIn.value.trim() ? '' : 'Campaign Name is required.'); if (draft) return V.ok();
            V.t(prog, pick() ? '' : 'Choose the stamp card this campaign issues.'); V.t(custom, startErr());
            if (tog.checked) { V.t(name, name.value.trim() ? '' : 'Reward Name is required.'); V.t(days, days.value.trim() !== '' && !(Number.isInteger(+days.value) && +days.value >= 1) ? 'Enter whole days, at least 1 — or leave empty.' : ''); }
            return V.ok(); };
          const b1 = $('[data-camp-publish]'); if (b1) b1.onclick = () => { if (validate()) publishCamp(ctx, nameIn.value.trim(), 'Stamp card acquisition'); };
          const b2 = $('[data-camp-draft]'); if (b2) b2.onclick = () => { if (validate(true)) g.toast('Saved as draft'); };
          const b3 = $('[data-camp-save]'); if (b3) b3.onclick = () => { if (!validate()) return;
            memPut('campaign-edits', c.id, { name: nameIn.value.trim(), program: pick().id, start: n0(), gift: tog.checked ? name.value.trim() : '', validity: parseInt(days.value, 10) || 0, desc: $('[data-gift-desc]').value.trim(), cond: $('[data-gift-cond]').value.trim() }); g.toast('Saved'); };
        } };
    }
    const c = c0 && !c0.type.startsWith('Stamp') ? c0 : null, cv = (c && c.pass) || {}, UPS = { logo: c ? (cv.logo === false ? '' : cv.logo || true) : (/^data:image\//.test(brand().logo || '') ? brand().logo : ''), bg: cv.bgImg || '' }, [bgMode, bgCol] = bgInit(cv);
    g.__pass = { ...cv, type: 'voucher', name: c ? c.name : 'Campaign name', reward: c ? c.reward : 'Voucher reward', from: c && c.from, to: c && c.to, logo: UPS.logo === true ? undefined : UPS.logo || false };
    const body = `<div class="form-grid">
      ${field({ label: 'Campaign Name', required: true, input: input({ value: c ? c.name : '', ph: 'Free Coffee Campaign', attrs: 'data-bind-src="name" data-fallback="Campaign name"' }), hint: 'e.g. “Free Coffee Campaign”' })}
      ${field({ label: 'Voucher Reward', required: true, input: input({ value: c ? c.reward : '', ph: '1 Free Coffee', attrs: 'data-v-reward' }), hint: 'e.g. “1 Free Coffee”' })}
      ${field({ label: 'Valid From', required: true, input: input({ type: 'date', value: c ? isoDate(c.from) : '', attrs: 'data-v-from' }) })}
      ${field({ label: 'Valid To', required: true, input: input({ type: 'date', value: c ? isoDate(c.to) : '', attrs: 'data-v-to' }), hint: 'Window in which the voucher can be claimed and redeemed.' })}
      ${field({ label: 'Logo', required: true, input: up('logo', UPS.logo) })}
      ${field({ label: 'Background <span class="opt">— a colour or an image, not both</span>', input: bgChoice(bgMode, bgCol, UPS.bg) })}
      <div data-fg>${field({ label: 'Text Colour', required: true, input: colorIn(cv.fg || '#FFFFFF') })}</div></div>`;
    const back = c && to(ctx, '21-', c.id, 'freecoffee');
    const actions = c ? `<button class="btn btn-primary btn-lg" data-camp-save>${icon('check', 'sm')}Save</button><a class="btn btn-text" href="${back}">Cancel</a>` : `<button class="btn btn-primary btn-lg" data-camp-publish>${icon('qr', 'sm')}Publish &amp; generate QR</button><button class="btn btn-ghost btn-lg" data-camp-draft>Save as draft</button>`;
    return { nav: 'Loyalty Programs', title: c ? 'Edit ' + c.name : 'New campaign', html: `${pageHead({ eyebrow: crumb('Loyalty Programs', ctx.link('03-')) + (c ? crumb(esc(c.name), back) + 'Edit' : 'New campaign'), title: c ? `Edit <span class="hl">${esc(c.name)}</span>` : 'New <span class="hl">campaign</span>' })}
      <div class="layout-preview"><div class="stack" data-pform>${card({ title: 'One-time voucher campaign', icon: 'ticket', sub: 'Standalone — not linked to any stamp card. One shared QR; each claim is tracked per customer and redeemable once.', body, cls: 'reveal-up' })}
      <div class="row reveal-up">${actions}</div></div>
      <div class="sticky">${phonePreview(g.__pass, 'Generic layout (no launch template)')}</div></div>`, after() {
        const $ = s => document.querySelector(s), nameIn = $('[data-bind-src="name"]'), rw = $('[data-v-reward]'), from = $('[data-v-from]'), toIn = $('[data-v-to]'), fgIn = $('[data-fg] [data-color]');
        const refresh = () => { bgSync(); const b = bgRead(UPS); g.__pass = { type: 'voucher', name: nameIn.value.trim() || 'Campaign name', reward: rw.value.trim() || 'Voucher reward', from: fmtDate(from.value), to: fmtDate(toIn.value), logo: UPS.logo === true ? undefined : UPS.logo || false, bg: b.bg, fg: isHex(fgIn.value.trim()) ? fgIn.value.trim() : undefined }; U.repaint(); };
        wireForm(UPS, refresh); refresh();
        const validate = draft => { const V = checker(); V.t(nameIn, nameIn.value.trim() ? '' : 'Campaign Name is required.'); if (draft) return V.ok();
          V.t(rw, rw.value.trim() ? '' : 'Voucher Reward is required.'); V.t(from, from.value ? '' : 'Choose the first valid day.');
          V.t(toIn, !toIn.value ? 'Choose the last valid day.' : from.value && toIn.value < from.value ? 'Valid To must be on or after Valid From.' : '');
          V.t($('[data-up="logo"]'), UPS.logo ? '' : 'Upload a logo.'); bgCheck(V, UPS); V.t(fgIn, isHex(fgIn.value.trim()) ? '' : 'Enter a colour as #RRGGBB, e.g. #FFFFFF.');
          return V.ok(); };
        const b1 = $('[data-camp-publish]'); if (b1) b1.onclick = () => { if (validate()) publishCamp(ctx, nameIn.value.trim(), 'One-time voucher'); };
        const b2 = $('[data-camp-draft]'); if (b2) b2.onclick = () => { if (validate(true)) g.toast('Saved as draft'); };
        const b3 = $('[data-camp-save]'); if (b3) b3.onclick = () => { if (!validate()) return; const b = bgRead(UPS);
          memPut('campaign-edits', c.id, { name: nameIn.value.trim(), reward: rw.value.trim(), from: fmtDate(from.value), to: fmtDate(toIn.value), pass: { logo: UPS.logo === true ? undefined : UPS.logo || false, bg: b.bg, bgImg: b.bgImg, fg: fgIn.value.trim() } }); g.toast('Saved'); };
      } };
  };

  /* ================= CAMPAIGN DETAIL ================= */
  S.campaignDetail = ctx => {
    const c = (qid() && CMP(qid()) && CMP(qid()).type.startsWith('Stamp') === (ctx.opts.id === 'cuplid') ? CMP(qid()) : null) || CMP(ctx.opts.id), acq = c.type.startsWith('Stamp');
    const life = card({ title: 'Lifecycle', icon: 'zap', actions: `<span data-life-badge>${status(c.status)}</span>`, body: activeToggle('campaign', c.status === 'Active'), cls: 'reveal-up' });
    // One-time voucher QR (client): printed on posters, flyers, cups, receipts or advertisements.
    const qrc = card({ title: 'Campaign QR code', icon: 'qr', sub: 'System-generated on publish. Download for print.', body: qrPanel({ url: c.url, format: 'Cup', formats: U.CAMPAIGN_QR }), cls: 'reveal-up' });
    const edit = acq ? to(ctx, '18-', c.id, '') : to(ctx, '19-', c.id, '');
    const head = pageHead({ eyebrow: crumb('Loyalty Programs', ctx.link('03-')) + esc(c.name), title: esc(c.name), sub: `<span class="row" style="gap:8px">${badge(acq ? 'Stamp card acquisition campaign' : 'One-time voucher campaign', 'outline')}<span>Created ${c.created}</span></span>`, actions: `<a class="btn btn-primary" href="${edit}">${icon('edit', 'sm')}Edit</a>` });
    const after = () => wireLife(c.id, c.name);
    if (acq) {
      // Customer receives two Wallet passes: the stamp card with its starting stamps + a separate welcome-gift voucher.
      const p = P(c.program); g.__passes = { card: stampCard(c.program, c.start), gift: giftVoucher(c.gift, c.validity, c.desc, c.cond) };
      const st = card({ title: 'Setup', icon: 'sliders', body: setup([['Linked stamp card', esc(p.name)], ['Starting stamps', String(c.start)], ['Welcome gift', c.gift ? `${esc(c.gift)}${c.validity ? ` · valid ${c.validity} days` : ''}` : 'None'], ['Customer receives', `1. ${esc(p.name)} with ${c.start} stamps${c.gift ? ' · 2. Welcome gift voucher' : ''}`]]), cls: 'reveal-up' });
      // P5.4 ❓ default pending client confirmation: an existing card holder gets no duplicate card.
      const dup = card({ title: 'Customer already has this card', icon: 'info', sub: 'Default behaviour — pending client confirmation.', body: callout('info', '“You already have this card”', `A customer who already holds the ${esc(p.name)} and scans this campaign QR gets no duplicate card and sees this message.`), cls: 'reveal-up', attrs: 'data-dup-card' });
      return { nav: 'Loyalty Programs', title: c.name, html: `${head}<div class="layout-preview"><div class="stack">${life}${qrc}${st}${dup}</div>${twoPasses(!!c.gift)}</div>`, after };
    }
    // Each customer claims and redeems once; a redeemed voucher becomes invalid and shows Redeemed in the Wallet.
    const claims = D.rewards.filter(r => r[2] === 'Voucher · ' + D.campaigns.find(x => x.id === c.id).name), nRed = claims.filter(r => r[3] === 'Redeemed').length;
    const st = card({ title: 'Setup', icon: 'sliders', body: setup([['Voucher reward', esc(c.reward)], ['Valid from', c.from], ['Valid to', c.to], ['Per customer', 'Claim once · redeem once']]), cls: 'reveal-up' });
    const cl = card({ title: 'Claims', icon: 'users', sub: 'After redemption the voucher is invalid, marked Redeemed in the Wallet and cannot be used again.', actions: `${badge(claims.length + ' claimed', 'outline')}${badge(nRed + ' redeemed', 'blue')}`, body: null, cls: 'reveal-up', attrs: 'style="overflow:hidden" data-claims' }).replace('</section>', `<div class="table-wrap"><table class="t"><thead><tr><th>Customer</th><th>Claimed</th><th>Status</th></tr></thead><tbody>${claims.map(r => `<tr><td><div class="person">${U.ini(r[1])}${esc(r[1])}</div></td><td class="muted">${r[4]}</td><td>${status(r[3])}</td></tr>`).join('')}</tbody></table></div></section>`);
    const pv = { ...c.pass, type: 'voucher', name: c.name, reward: c.reward, from: c.from, to: c.to, status: 'Available' }; g.__pass = pv;
    const seg = `<div class="seg" data-v-state>${['Available', 'Redeemed'].map((s, i) => `<button class="${i ? '' : 'on'}" data-vs="${s}">${s}</button>`).join('')}</div>`;
    return { nav: 'Loyalty Programs', title: c.name, html: `${head}<div class="layout-preview"><div class="stack">${life}${qrc}${st}${cl}</div><div class="sticky stack" style="align-items:center">${seg}${phonePreview(pv, 'Generic layout (no launch template)')}</div></div>`, after() {
        after(); document.querySelectorAll('[data-vs]').forEach(b => b.addEventListener('click', () => { pv.status = b.dataset.vs; U.repaint(); }));
      } };
  };

  /* ================= WALLET CARDS ================= */
  S.walletCards = ctx => {
    const tpl = [['Digital Stamp Card', { type: 'stamp', name: 'Stamp template', reward: 'Reward', total: 10, filled: 4, logo: false }], ['Membership Card', { type: 'membership', name: 'Membership template', benefit: 'Benefit', logo: false }], ['Tier Program Pass', { type: 'tier', name: 'Tier template', tier: 'Tier', next: 'Progress line', logo: false }]];
    const trim = h => h.replace('<div class="pass-qr">', '<div class="pass-qr" style="display:none">');
    const tplCards = tpl.map(([n, p]) => `<article class="card hover reveal-up" style="padding:14px"><div style="transform:scale(.92);transform-origin:top center;margin-bottom:-22px">${trim(pass(p))}</div><div style="padding:6px 6px 2px"><b style="font-family:var(--font-display);font-size:16px">${n}</b><div class="hint">Base template · structure owned by Bonuca</div></div></article>`).join('');
    const sub = p => ({ stamp: p.pass.reward, membership: p.pass.benefit, tier: p.kind === 'tier' && p.cfg.tiers[0][0], points: p.pass.balance })[p.kind];
    const br = brand(), lgOf = p => /^data:image\//.test(p.pass.logo || '') ? p.pass.logo : p.pass.logo !== false && /^data:image\//.test(br.logo || '') ? br.logo : '';
    const logo = p => lgOf(p) ? `<div class="pass-logo" style="width:28px;height:28px;background:#fff center/cover url('${esc(lgOf(p))}')"></div>` : p.pass.logo === false ? `<div class="pass-logo ph" style="width:28px;height:28px">${esc(p.name[0])}</div>` : '<div class="pass-logo" style="width:28px;height:28px;font-size:14px">☕</div>';
    const tiles = PROGS().map(p => `<article class="card hover wallet-tile reveal-up" data-href="${designLink(ctx, p.id)}"><div class="pass mini" style="${p.pass.bg || U.brandBg() ? `--bgp:${p.pass.bg || U.brandBg()};` : ''}${p.pass.fg ? `--fg:${p.pass.fg}` : ''}"><div class="pass-top"><div class="pass-name">${esc(p.name)}</div>${logo(p)}</div><div><div class="pass-lbl" style="margin-top:0">${{ stamp: 'Reward', membership: 'Benefit', tier: 'Current tier', points: 'Balance' }[p.kind]}</div><div class="pass-val sm">${esc(sub(p))}</div></div></div><div class="meta"><span>${p.cap}</span>${status(p.status)}</div></article>`).join('');
    return { nav: 'Wallet Cards', html: `${pageHead({ eyebrow: `${icon('wallet', 'sm')} Wallet`, title: 'Wallet <span class="hl">Cards</span>', sub: 'Every field is entered once in the program’s setup. Here you see the Bonuca template each program starts from and preview how its pass renders.' })}
      <h2 class="section-title" style="margin-top:0">Base templates</h2><div class="grid g3">${tplCards}</div>
      <h2 class="section-title">Program wallet passes</h2><div class="grid g3">${tiles}</div>
      <div style="margin-top:22px">${callout('', 'Apple Wallet / Google Wallet integration not connected', 'Issued passes are generated and updated by the Bonuca backend (APNs push for Apple Wallet, Google Wallet API PATCH). That integration is not available in this environment, so no real passes are issued or updated from this portal.')}</div>` };
  };

  /* ================= WALLET DESIGN ================= */
  S.walletDesign = ctx => {
    const id = P(qid()) && !walletPage[qid()] ? qid() : ctx.opts.id, p = P(id), android = !!ctx.opts.android, ps = p.pass, br = brand(); g.__pass = { ...ps };
    const tplName = { stamp: 'Digital Stamp Card', membership: 'Membership Card', tier: 'Tier Program Pass', points: 'Generic layout (no launch template)' }[p.kind];
    const sw = c => isHex(c) ? `<span class="row" style="gap:8px"><span class="swatch" style="width:22px;height:22px;padding:3px;border-radius:7px"><i style="--c:${c};border-radius:4px"></i></span><span class="mono">${c}</span></span>` : c === 'Bonuca gradient' ? `<span class="row" style="gap:8px"><span style="width:22px;height:22px;border-radius:7px;background:var(--wallet-gradient)"></span>${c}</span>` : c;
    const bg = p.kind === 'tier' ? 'Per-tier wallet colour' : ps.bgImg ? 'Uploaded image' : isHex(ps.bg) ? ps.bg : !ps.bg && isHex(br.accent) ? br.accent : 'Bonuca gradient';
    const lgSrc = /^data:image\//.test(ps.logo || '') ? ps.logo : ps.logo !== false && /^data:image\//.test(br.logo || '') ? br.logo : '';
    const lg = lgSrc ? `<span class="row" style="gap:8px"><span class="pass-logo" style="width:22px;height:22px;border-radius:6px;background:#fff center/cover url('${esc(lgSrc)}')"></span>${lgSrc === ps.logo ? 'Uploaded' : 'From Branding'}</span>` : ps.logo === false ? '<span class="faint">None</span>' : '<span class="row" style="gap:8px"><span class="pass-logo" style="width:22px;height:22px;font-size:12px;border-radius:6px">☕</span>Uploaded</span>';
    const wording = { stamp: `Reward: ${esc(ps.reward)}`, membership: `Benefit: ${esc(ps.benefit)}`, tier: p.kind === 'tier' && p.cfg.tiers.map(t => esc(t[0])).join(' · '), points: p.kind === 'points' && p.cfg.rewards.map(([n, v]) => `${v} = ${esc(n)}`).join(' · ') }[p.kind];
    const brandCols = isHex(br.color) || isHex(br.accent) ? `<span class="row" style="gap:12px">${[br.color, br.accent].filter(isHex).map(sw).join('')}</span>` : '<span class="faint">Bonuca defaults</span>';
    const rows = [['Program Name', 'stamp', esc(p.name), 'Pass header / title'], ['Logo', 'image', lg, 'Top-left logo image'], ['Icon', 'sparkles', ps.appIcon ? 'Uploaded' : 'Uses logo', 'Wallet app list icon + notification icon'], ['Background', 'palette', sw(bg), 'Pass body background'], ['Hero / Strip Image', 'image', ps.hero ? 'Uploaded' : '<span class="faint">None</span>', 'Banner image across the top of the pass'], ['Text Colour', 'hash', sw(ps.fg || '#FFFFFF'), 'Foreground text and small field labels'], ['Brand colours', 'palette', brandCols, 'From Branding: progress accent (primary) and default background (secondary)'], ['Text', 'file', wording, 'Wording on the front; Terms &amp; Conditions on the back'], ['QR Code', 'qr', 'Auto-generated', 'Bottom of the pass — not editable']];
    const dyn = { stamp: ['Stamp grid using the chosen Stamp Icon; “X stamps to go” line; Reward Description.', 'Every confirmed employee scan (+1 stamp).'], membership: ['Benefit; Member Since date.', 'Static — only changes if the business edits the program.'], tier: ['Current Tier name + badge; background switches to that tier’s colour; “X visits/points to [next tier]” progress line.', 'Every scan that changes the customer’s visits/points/spend total.'], points: ['Current point balance; progress bar; Next Reward name; points still needed. (Multiple upcoming levels pending a technical spike — fallback layout shown.)', 'Every confirmed points transaction.'] }[p.kind];
    // E3: only the program's base template — no blank "Start from Scratch" canvas (not in client spec).
    const opts = `<div class="option-row" style="display:block"><div class="row" style="gap:10px"><span class="feed-ic" style="background:var(--color-accent-soft);color:var(--color-accent)">${icon('layers', 'sm')}</span><b>Base template: ${tplName}</b></div><small style="display:block;margin-top:6px">Bonuca owns the structure (stamp grid, benefit layout, tier colour switching). You customise all visuals and wording.</small></div>`;
    const table = `<div class="table-wrap"><table class="t"><thead><tr><th>Business sets</th><th>Current</th><th>Appears on the pass as</th></tr></thead><tbody>${rows.map(([a, ic, b, c]) => `<tr><td><span class="row" style="gap:10px;font-weight:600"><span class="feed-ic" style="width:28px;height:28px;border-radius:9px;background:var(--color-surface-sunken)">${icon(ic, 'sm')}</span>${a}</span></td><td>${b}</td><td class="muted">${c}</td></tr>`).join('')}</tbody></table></div>`;
    return { nav: 'Wallet Cards', title: p.name + ' — wallet pass', html: `${pageHead({ eyebrow: crumb('Wallet Cards', ctx.link('22-')) + esc(p.name), title: `${esc(p.name)} <span class="faint" style="font-weight:500">—</span> <span class="hl">wallet pass</span>`, actions: `<a class="btn btn-ghost" href="${editLink(ctx, p.id)}">${icon('edit', 'sm')}Edit master fields in program setup</a>` })}
      <div class="layout-preview"><div class="stack">
        ${card({ title: 'Where the design starts', icon: 'layers', body: opts, cls: 'reveal-up' })}
        ${card({ title: 'Master field list', icon: 'sliders', sub: 'Set once in the program setup screen.', body: null, cls: 'reveal-up' }).replace('</section>', table + '</section>')}
        ${card({ title: 'Dynamic content', icon: 'zap', body: setup([['Shown besides the master fields', dyn[0]], ['What triggers an update', dyn[1]], ...(p.kind === 'points' ? [['Reward levels', p.cfg.rewards.map(([n, v]) => `${v} points → ${esc(n)}`).join(' · ')]] : [])]), cls: 'reveal-up' })}
        ${p.kind === 'tier' ? card({ title: 'Tier wallet colours', icon: 'palette', sub: 'Silver → the wallet becomes silver. Gold → the wallet becomes gold. Pick a tier to preview its pass.', body: `<div class="stack"><div class="choice-chips" data-tier-chips data-preview-ok>${p.cfg.tiers.map(([n], i) => `<button class="chip ${i ? '' : 'on'}" data-tier-pv="${i}">${esc(n)}</button>`).join('')}</div>${tierList(p.cfg)}</div>`, cls: 'reveal-up' }) : ''}
        ${callout('', 'Wallet update status: not connected', 'Editing a master field of an Active program applies to every issued pass; the backend would push updates via APNs / Google Wallet API. No wallet integration is available in this environment.')}
      </div><div class="sticky">${phonePreview(g.__pass, p.cap, { android, back: true })}</div></div>`, after() {
        const ch = document.querySelector('[data-tier-chips]'); if (ch) ch.addEventListener('click', e => { const c = e.target.closest('[data-tier-pv]'); if (!c) return;
          g.__pass = { ...ps, ...tierPass(p, p.cfg.tiers[+c.dataset.tierPv][1]), face: g.__pass.face }; U.repaint(); });
      } };
  };
})(window);
