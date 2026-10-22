/* Dashboard, Loyalty Programs, Campaigns, Wallet Cards */
(function (g) {
  const U = g.UI, D = g.DATA, { icon, field, input, select, textarea, colorIn, upload, optionRow, badge, status, card, callout, pass, phonePreview, qrPanel, pageHead, crumb, modal, setup, tabs } = U;
  const S = g.SCREENS = g.SCREENS || {};
  const P = id => D.programs.find(p => p.id === id);

  /* ================= TIERS ================= */
  // Value in the program's upgrade requirement: "6 visits" · "60 points" · "6.00 EUR".
  const tierFmt = (c, n) => c.req === 'Total spending' ? `${(+n).toFixed(2)} ${c.currency}` : `${n} ${c.req === 'Points' ? 'point' : 'visit'}${n === 1 ? '' : 's'}`;
  // Customers level up automatically: the highest tier whose required value is reached.
  const tierAt = (c, v) => { let i = 0; c.tiers.forEach((t, j) => { if (v >= t[1]) i = j; }); const t = c.tiers[i], nx = c.tiers[i + 1]; return { i, name: t[0], bg: t[2], benefit: t[3], nx, left: nx ? +(nx[1] - v).toFixed(2) : 0, pct: nx ? Math.round((v - t[1]) / (nx[1] - t[1]) * 100) : 100 }; };
  // Client: "Silver → Wallet becomes silver. Gold → Wallet becomes gold." — the pass background is the reached tier's wallet colour.
  const tierPass = (p, v) => { const t = tierAt(p.cfg, v); return { type: 'tier', name: p.name, tier: t.name, next: t.nx ? `${tierFmt(p.cfg, t.left)} to ${t.nx[0]}` : 'Highest tier reached', pct: t.pct, bg: t.bg }; };
  g.TIER = { fmt: tierFmt, at: tierAt, pass: tierPass };
  const tierList = c => setup(c.tiers.map(([n, v, col, b], i) => [`<span class="row" style="gap:8px"><span class="swatch" style="width:22px;height:22px;padding:3px;border-radius:7px"><i style="--c:${col};border-radius:4px"></i></span>${n}${i ? '' : ' (Default)'}</span>`, `${tierFmt(c, v)} · ${b}`]));

  /* ================= DASHBOARD ================= */
  S.dashboard = ctx => {
    const o = ctx.owner, d = D.dash;
    const stats = [
      ['New Members Today', 5, 'calendar'], ['New This Week', 5, 'calendar'], ['New This Month', 12, 'calendar'], ['Total Scans', o ? 871 : 872, 'scan'],
      ['Active Programs', 4, 'stamp'], ['Wallet Cards', 139, 'wallet'], ['Visits', o ? 693 : 694, 'footprints', 'One customer on one day'], ['Returning Customers', 57, 'repeat', 'Visited on 2+ days']
    ];
    const statCard = ([l, v, ic, note], i) => `<div class="card hover stat reveal-up"><div class="lbl">${l}<span class="ico">${icon(ic, 'sm')}</span></div><div class="val" data-count="${v}">${v}</div>${note ? `<div class="note">${note}</div>` : ''}</div>`;
    const feature = `<div class="card stat feature reveal-up" style="grid-row:span 2;display:flex;flex-direction:column">
      <div class="lbl">Total Members<span class="ico">${icon('users', 'sm')}</span></div>
      <div class="val" style="font-size:56px;margin-top:14px" data-count="64">64</div>
      <div class="note">${badge('+12 this month', 'green')}</div>
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
    return { nav: 'Dashboard', html: `${pageHead({ eyebrow: `${icon('dashboard', 'sm')} Overview · Sample Business`, title: '<span class="hl">Dashboard</span>', sub: `Good afternoon, ${o ? 'Sam' : 'Mia'} — here’s how your loyalty programs are performing.`, actions: `<a class="btn btn-ghost" href="${ctx.link('28-')}">${icon('scan', 'sm')}Open scanner</a><a class="btn btn-primary" href="${ctx.link('03-')}">${icon('plus', 'sm')}Create Program</a>` })}
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
    const counts = { All: 5, Active: 4, Inactive: 0, Draft: 1 };
    const cards = D.programs.map(p => `<article class="card hover prog-card reveal-up" style="--c:${p.c}" data-status="${p.status}" data-href="${ctx.link(({ coffee: '10-', vip: '11-', club: '12-', points: '13-', lunch: '14-' })[p.id])}" tabindex="0">
      <div class="top"><span class="ti">${icon(p.icon, 'lg')}</span>${status(p.status)}</div>
      <div><h3>${p.name}</h3><p class="muted" style="margin-top:2px">${p.type}</p></div>
      <div class="foot"><span>${icon('calendar', 'sm')} ${p.date}</span><span class="arrow">${icon('arrowRight', 'sm')}</span></div></article>`).join('');
    const camp = `<div class="table-wrap"><table class="t"><thead><tr><th>Campaign</th><th>Type</th><th>Status</th><th>Created</th><th></th></tr></thead><tbody>${D.campaigns.map(c => `<tr class="clickable" data-href="${ctx.link(c.id === 'cuplid' ? '20-' : '21-')}"><td><div class="person"><span class="feed-ic" style="background:${c.type.startsWith('Stamp') ? 'var(--color-accent-soft);color:var(--color-accent)' : 'var(--color-highlight-soft);color:#9A7300'}">${icon(c.type.startsWith('Stamp') ? 'stamp' : 'ticket', 'sm')}</span>${c.name}</div></td><td>${badge(c.type, 'outline')}</td><td>${status(c.status)}</td><td class="muted">${c.created}</td><td class="num">${icon('chevronRight', 'sm')}</td></tr>`).join('')}</tbody></table></div>`;
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

  /* ================= PROGRAM FORM ================= */
  const KIND = { stamp: ['Stamp Card', 'Digital Stamp Card'], membership: ['Membership Card', 'Membership Card'], tier: ['Tier Program', 'Tier Program Pass'], points: ['Points Program', 'Generic layout (no launch template)'] };
  const sec = (n, title, sub, body, id) => `<section class="card reveal-up" ${id ? `id="${id}"` : ''}><header class="card-head split"><div class="row" style="align-items:flex-start"><span class="badge ink lg" style="width:28px;padding:0;justify-content:center">${n}</span><div><div class="card-title">${title}</div>${sub ? `<div class="card-sub">${sub}</div>` : ''}</div></div></header><div class="card-body">${body}</div></section>`;
  // Client: "Allow Multiple Stamps" — default OFF (1 stamp per scan), changeable anytime, max 3 / 5 / unlimited.
  const multiStamps = m => {
    const sel = m.max === 'Unlimited' ? 'Unlimited' : [3, 5].includes(m.max) ? String(m.max) : 'Custom';
    return `<div class="stack" style="gap:12px">${optionRow('Allow Multiple Stamps', 'Off: one stamp per scan. Can be changed anytime, even while the program is running.', m.on, 'data-reveal="[data-multi-max]" data-multi-toggle')}
      <div data-multi-max ${m.on ? '' : 'hidden'}>${field({ label: 'Max stamps per scan', required: true, input: `<div class="choice-chips" data-max-chips>${['3', '5', 'Unlimited', 'Custom'].map(v => `<button class="chip ${v === sel ? 'on' : ''}" data-max="${v}">${v}</button>`).join('')}</div><input class="input" type="number" min="2" value="${sel === 'Custom' ? m.max : ''}" placeholder="e.g. 4" aria-label="Custom max stamps per scan" data-max-custom style="max-width:140px;margin-top:10px" ${sel === 'Custom' ? '' : 'hidden'}>`, hint: 'Team permissions still apply: employees can award multiple stamps only if they have permission.' })}</div></div>`;
  };
  const bgChoice = () => `<div class="choice-chips"><button class="chip on">Bonuca template gradient</button><button class="chip">Flat colour (RGB)</button><button class="chip">Background image</button></div>`;

  S.programForm = ctx => {
    const k = ctx.opts.kind, edit = ctx.opts.edit, warn = ctx.opts.warn, [tname, cap] = KIND[k];
    const nm = edit ? (warn ? 'Coffee Card Plus' : 'Coffee Card') : '';
    const basics = field({ label: 'Program Name', required: true, input: input({ value: nm, ph: edit ? '' : 'e.g. Coffee Card', attrs: 'data-bind-src="name" data-fallback="Program name" data-orig="' + (edit ? 'Coffee Card' : '') + '"' }), hint: 'Internal name and the header text on the wallet pass.' });
    const design = `<div class="form-grid">
      ${field({ label: 'Program Logo', required: true, input: upload(edit, false, edit ? `<button class="btn btn-danger-text btn-sm">${icon('trash', 'sm')}Remove</button>` : ''), hint: 'Small square logo, top-left of the wallet pass.' })}
      ${field({ label: 'Program Icon', optional: true, input: upload(false), hint: 'Defaults to the logo. Used in notification banners and the Wallet list.' })}
      ${field({ label: 'Hero / Strip Image', optional: true, input: upload(false, true), hint: 'Optional wide banner across the top of the pass.' })}
      ${k !== 'tier' ? field({ label: 'Background <span class="opt">— a colour or an image, not both</span>', input: bgChoice() }) : '<div></div>'}
      ${k !== 'tier' ? field({ label: 'Text Colour', required: true, input: colorIn('#FFFFFF'), hint: 'Colour of all text on the pass.' }) : ''}
    </div>`;
    let rules = '';
    if (k === 'stamp') rules = `<div class="form-grid">
      ${field({ label: 'Number of Stamps Required', required: true, input: input({ type: 'number', value: '10' }), hint: 'How many stamps fill the card, e.g. 10.' })}
      ${field({ label: 'Stamp Icon <span class="opt">(optional — default coffee cup)</span>', input: `<div class="icon-picker">${['coffee', 'star', 'heart', 'scissors', 'cookie', 'check'].map((i, n) => `<button class="${n ? '' : 'on'}" data-icon="${i}" aria-label="${i}">${icon(i)}</button>`).join('')}</div>` })}
      <div></div>${field({ label: 'Custom stamp icon', optional: true, input: upload(false) })}
      ${field({ label: 'Reward Description', required: true, input: input({ value: edit ? '1 Free Coffee' : '', ph: 'e.g. 1 Free Coffee', attrs: 'data-bind-src="reward" data-fallback="Reward description"' }), hint: 'What the customer gets, e.g. “1 Free Coffee”.' })}
      ${field({ label: 'Reward Type', required: true, input: select(['Free item', 'Discount', 'Upgrade', 'Other'], 'Free item'), hint: 'Used for reporting and the redeem-reward wording.' })}
      <div class="full">${multiStamps(edit ? P('coffee').multi : { on: false, max: 3 })}</div></div>`;
    // Currency + earning rule are shared by the Points Program and points-based / spend-based tiers (P4.4/P4.5: same rules as the Points Program).
    const curField = field({ label: 'Currency', required: true, input: `${select(['EUR', 'USD', 'GBP', 'CZK', 'TRY', 'CHF', 'PLN', 'Other'], 'EUR', 'data-pt-cur')}<input class="input" placeholder="Currency code, e.g. SEK" aria-label="Other currency" data-pt-cur-other style="margin-top:10px" hidden>`, hint: 'Set per program, never account-wide. Employees never pick a currency during a scan.' });
    const ptsFields = `      ${field({ label: 'Awarding Method', required: true, input: select(['Manual', 'Fixed points per visit'], 'Manual', 'data-pt-method'), hint: 'Manual: the employee enters the purchase amount. Fixed: every scan gives the same points.' })}
      ${field({ label: 'Purchase amount', required: true, input: input({ type: 'number', value: '1', attrs: 'min="0" step="0.01" data-pt-basis' }), hint: 'Calculation basis, e.g. 1, 10 or 5.' })}
      ${field({ label: 'Points awarded for that amount', required: true, input: input({ type: 'number', value: '10', attrs: 'min="0" data-pt-pts' }), hint: `Earning rule: <b data-pt-rule>1 EUR = 10 points</b>` })}
      <div data-pt-fixed hidden>${field({ label: 'Fixed points per visit', required: true, input: input({ type: 'number', value: '10', attrs: 'min="1"' }) })}</div><div data-pt-fixed hidden></div>
      ${field({ label: 'Rounding', required: true, input: select(['Round down', 'Round up', 'Round to nearest'], 'Round down'), hint: 'Applied to the calculated points.' })}
      ${field({ label: 'Minimum purchase amount', optional: true, input: input({ type: 'number', attrs: 'min="0" step="0.01"' }), hint: 'Purchases below this earn no points.' })}
      ${field({ label: 'Maximum points per transaction', optional: true, input: input({ type: 'number', attrs: 'min="1"' }), hint: 'Caps how many points one scan can award.' })}`;
    // Client: "VIP Member · 10% Discount · Permanent member benefits · No stamps. Just identification." (E6: no validity / renewal / end date.)
    if (k === 'membership') rules = `<div class="stack">${callout('info', '', 'Permanent member benefits. No stamps — just identification.')}
      ${field({ label: 'Benefit', required: true, input: input({ ph: 'e.g. 10% Discount', attrs: 'data-bind-src="benefit" data-fallback="Benefit"' }), hint: 'Main line on the pass and what the employee sees when scanning a member.' })}</div>`;
    // Client tiers: 2–5 tiers, editable names, upgrade requirement (visits / points / total spending), required value, rewards & benefits, colour + wallet design
    // per tier, automatic level-up. E4: no downgrade rule. E7: no "Enable Tiers" toggle — choosing the Tier Program type is the choice.
    if (k === 'tier') {
      // Default suggestions, all editable: Member (Default) · Silver – 10 visits · Gold – 25 visits · Platinum – 50 visits; Diamond available as the 5th.
      // ❓ The client gives no default required value for Diamond — left empty.
      const DEF = [['Member', 0, '#3A3F55'], ['Silver', 10, '#8A8FA3'], ['Gold', 25, '#B8902E'], ['Platinum', 50, '#5E6A7D'], ['Diamond', '', '#0369A1']];
      rules = `<div class="stack"><div class="form-grid">${field({ label: 'Number of Tiers', required: true, input: select(['2', '3', '4', '5'], '4', 'data-tier-n'), hint: 'Between 2 and 5.' })}${field({ label: 'Upgrade Requirement', required: true, input: select(['Visits', 'Points', 'Total spending'], 'Visits', 'data-tier-req'), hint: 'One requirement applies to all tiers. Customers level up automatically.' })}
      <div data-tier-cur hidden>${curField}</div><div data-tier-cur hidden></div></div>
      <div class="form-grid" data-tier-pts hidden>${ptsFields}</div>
      <div class="tier-ladder stack" data-tier-ladder>${DEF.map(([n, v, c], i) => `<div class="reveal" style="border-left:4px solid ${c}" data-tier ${i < 4 ? '' : 'hidden'}><div class="row between"><div class="row"><span class="medal" style="background:${c};color:#fff">${i + 1}</span><b style="font-family:var(--font-display);font-size:16px">Tier ${i + 1}</b>${i ? '' : badge('Default', 'outline')}</div><span data-tier-badge>${badge(v === '' ? '—' : v + ' visits', 'outline')}</span></div>
        <div class="form-grid" style="margin-top:14px">${field({ label: 'Tier Name', required: true, input: input({ value: n, attrs: 'data-tier-name' }) })}${field({ label: 'Required Value <span data-tier-unit>(visits)</span>', required: true, input: input({ type: 'number', value: String(v), ph: 'e.g. 100', attrs: 'min="0" step="any" data-tier-val' }) })}
        ${field({ label: 'Wallet Colour', required: true, input: colorIn(c), hint: 'The pass background once a customer reaches this tier.' })}${field({ label: 'Tier Badge / Icon', optional: true, input: upload(false) })}
        <div class="full">${field({ label: 'Rewards &amp; Benefits', required: true, input: input({ ph: 'e.g. Free birthday drink, priority seating' }) })}</div></div></div>`).join('')}</div></div>`;
    }
    // Client points configuration: currency per program, "<amount> <currency> = <points> points", Fixed per visit or Manual.
    if (k === 'points') rules = `<div class="form-grid">
      ${curField}
${ptsFields}
      <div class="full">${field({ label: 'Rewards <span class="opt">— at least one reward</span>', required: true, input: `<div class="reveal" data-reward-list><div class="row" style="align-items:flex-end"><div style="flex:1">${field({ label: 'Reward 1 name', required: true, input: input({ ph: 'e.g. Free Coffee' }) })}</div><div style="width:150px">${field({ label: 'Required points', required: true, input: `<div class="input-wrap">${icon('coins')}${input({ type: 'number', ph: 'e.g. 100' })}</div>` })}</div><button class="icon-btn" aria-label="Remove reward" style="margin-bottom:4px">${icon('trash')}</button></div><div style="margin-top:12px">${field({ label: 'Reward 1 icon', optional: true, input: upload(false) })}</div></div><button class="btn btn-ghost btn-sm" style="margin-top:10px;align-self:flex-start" data-add-reward>${icon('plus', 'sm')}Add reward</button>`, hint: 'e.g. 100 points → Free Coffee · 250 points → Free Dessert · 500 points → Free Burger' })}</div>
      ${field({ label: 'Point expiry period', optional: true, input: `<div class="row">${input({ type: 'number', attrs: 'min="1" style="max-width:120px"' })}<b class="muted">months</b></div>`, hint: 'Unused points expire after this period. Leave empty for no expiry.' })}
      ${field({ label: 'Reward expiry period', optional: true, input: `<div class="row">${input({ type: 'number', attrs: 'min="1" style="max-width:120px"' })}<b class="muted">days</b></div>`, hint: 'An earned reward expires if not redeemed in this period. Leave empty for no expiry.' })}</div>`;
    const terms = field({ label: 'Terms &amp; Conditions', optional: true, input: textarea(edit ? 'Sample terms and conditions.' : ''), hint: 'Shown on the back of the wallet pass.' });
    const pv = { stamp: { type: 'stamp', name: edit ? nm : 'Program name', reward: edit ? '1 Free Coffee' : 'Reward description', total: 10, filled: 3, logo: edit }, membership: { type: 'membership', name: 'Program name', benefit: 'Benefit', logo: false }, tier: { type: 'tier', name: 'Program name', tier: 'Member', next: '10 visits to Silver', pct: 0, bg: '#3A3F55', logo: false }, points: { type: 'points', name: 'Program name', balance: '120 pts', logo: false } }[k];
    g.__pass = pv;
    const actions = edit ? `<button class="btn btn-primary btn-lg" data-save>${icon('check', 'sm')}Save</button><a class="btn btn-text" href="${ctx.link('10-')}">Cancel</a>` : `<button class="btn btn-primary btn-lg" data-toast="Program published">${icon('send', 'sm')}Publish</button><button class="btn btn-ghost btn-lg" data-toast="Saved as draft">Save as draft</button>`;
    const wm = modal({ id: 'warn', open: !!warn, title: 'Update every issued wallet pass?', body: `<p style="margin-bottom:14px">You changed <b>Program Name</b>. This program is live, so the change applies retroactively to every wallet pass already issued.</p>${callout('', 'Wallet integration not connected', 'Pass updates are pushed by the Apple/Google Wallet backend integration, which is not available in this environment.')}`, foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-close data-toast="Saved — applies to all issued passes">Save (applies to all issued passes)</button>` });
    return { nav: 'Loyalty Programs', title: edit ? 'Edit Coffee Card' : 'New ' + tname, html: `${pageHead({ eyebrow: crumb('Loyalty Programs', ctx.link('03-')) + (edit ? crumb('Coffee Card', ctx.link('10-')) + 'Edit' : 'New program'), title: edit ? 'Edit <span class="hl">Coffee Card</span>' : `New <span class="hl">${tname}</span>`, sub: edit ? 'Changes to master fields update every issued pass.' : 'Fill in the sections below — the wallet preview updates as you type.' })}
      <div class="layout-preview"><div class="stack">
        ${sec(1, 'Basics', `${tname} · program type cannot be changed after creation`, basics)}
        ${sec(2, 'Wallet design', k === 'tier' ? 'Shared across every tier’s pass. The background switches to each tier’s wallet colour.' : 'These master fields render on the wallet pass.', design)}
        ${sec(3, 'Program rules', '', rules)}
        ${sec(4, 'Terms &amp; Conditions', '', terms)}
        <div class="row reveal-up">${actions}</div>
      </div><div class="sticky">${k === 'tier' ? '<div class="choice-chips" data-tier-chips data-preview-ok style="margin-bottom:12px"></div>' : ''}${phonePreview(pv, cap)}</div></div>${edit ? wm : ''}`, after() {
        const cur = document.querySelector('[data-pt-cur]'); if (cur) {
          const $ = s => document.querySelector(s), other = $('[data-pt-cur-other]'), method = $('[data-pt-method]');
          const rule = () => { const c = cur.value === 'Other' ? (other.value.trim() || 'Other') : cur.value, n = +$('[data-pt-pts]').value || 0; $('[data-pt-rule]').textContent = `${+$('[data-pt-basis]').value || 0} ${c} = ${n} point${n === 1 ? '' : 's'}`; };
          [cur, other, $('[data-pt-basis]'), $('[data-pt-pts]')].forEach(el => el.addEventListener('input', rule));
          cur.addEventListener('change', () => { other.hidden = cur.value !== 'Other'; rule(); });
          method.addEventListener('change', () => {
            const fixed = method.value === 'Fixed points per visit';
            document.querySelectorAll('[data-pt-fixed]').forEach(el => el.hidden = !fixed);
            ['[data-pt-basis]', '[data-pt-pts]'].forEach(s => { $(s).closest('.field').hidden = fixed; });
          });
        }
        // Tiers: show 2–5 tier blocks, unit follows the upgrade requirement, preview any tier's pass (its wallet colour).
        const tn = document.querySelector('[data-tier-n]'); if (tn) {
          const $$ = s => [...document.querySelectorAll(s)], req = document.querySelector('[data-tier-req]'), chips = document.querySelector('[data-tier-chips]'); let sel = 0;
          const unit = () => req.value === 'Visits' ? 'visits' : req.value === 'Points' ? 'points' : (cur.value === 'Other' ? document.querySelector('[data-pt-cur-other]').value.trim() || 'Other' : cur.value);
          const shown = () => $$('[data-tier]').filter(b => !b.hidden), nm = b => b.querySelector('[data-tier-name]').value.trim() || 'Tier', val = b => +b.querySelector('[data-tier-val]').value || 0;
          const show = i => { const bl = shown(); sel = Math.min(i, bl.length - 1); const b = bl[sel], nx = bl[sel + 1];
            g.__pass = { type: 'tier', name: document.querySelector('[data-bind-src="name"]').value || 'Program name', tier: nm(b), next: nx ? `${+(val(nx) - val(b)).toFixed(2)} ${unit()} to ${nm(nx)}` : 'Highest tier reached', pct: 0, bg: b.querySelector('[data-color]').value, logo: false };
            document.querySelector('[data-pass-host]').innerHTML = pass({ ...g.__pass, android: document.querySelector('[data-phone]').classList.contains('android') });
            chips.innerHTML = bl.map((x, j) => `<button class="chip ${j === sel ? 'on' : ''}" data-tier-pv="${j}">${U.esc(nm(x))}</button>`).join(''); };
          const sync = () => { const n = +tn.value, u = unit();
            $$('[data-tier]').forEach((b, i) => { b.hidden = i >= n; const v = b.querySelector('[data-tier-val]').value; b.querySelector('[data-tier-unit]').textContent = `(${u})`; b.querySelector('[data-tier-badge]').innerHTML = badge(v === '' ? '—' : `${v} ${u}`, 'outline'); });
            $$('[data-tier-cur]').forEach(e => e.hidden = req.value === 'Visits'); document.querySelector('[data-tier-pts]').hidden = req.value !== 'Points'; show(sel); };
          [tn, req, cur, document.querySelector('[data-pt-cur-other]')].forEach(e => { e.addEventListener('change', sync); e.addEventListener('input', sync); });
          document.querySelector('[data-tier-ladder]').addEventListener('input', sync);
          chips.addEventListener('click', e => { const c = e.target.closest('[data-tier-pv]'); if (c) show(+c.dataset.tierPv); });
          sync();
        }
        document.querySelectorAll('[data-max-chips] .chip').forEach(c => c.addEventListener('click', () => { document.querySelector('[data-max-custom]').hidden = c.dataset.max !== 'Custom'; }));
        const s = document.querySelector('[data-save]'); if (s) s.onclick = () => { const i = document.querySelector('[data-orig]'); if (i.value !== i.dataset.orig) g.openModal('warn'); else g.toast('Saved'); };
        const add = document.querySelector('[data-add-reward]'); if (add) add.onclick = () => { const list = document.querySelector('[data-reward-list]'); const n = list.parentElement.querySelectorAll('[data-reward-list]').length + 1; const c = list.cloneNode(true); c.innerHTML = c.innerHTML.replaceAll('Reward 1', 'Reward ' + n); c.querySelectorAll('input').forEach(x => x.value = ''); c.style.marginTop = '10px'; c.style.animation = 'fadeUp .35s both'; add.before(c); };
      } };
  };

  /* ================= PROGRAM DETAIL ================= */
  const walletPage = { coffee: '23-', vip: '24-', club: '25-', points: '26-' };
  // E11: lifecycle is only Active ⇄ Inactive (no archive / suspend) — ❓ pending client confirmation.
  const activeToggle = what => optionRow('Active', `Turn off to make this ${what} inactive. Members keep their cards; scans show “temporarily unavailable”.`, true);
  S.programDetail = ctx => {
    const p = P(ctx.opts.id), draft = p.status === 'Draft'; g.__pass = p.pass;
    const life = card({ title: 'Lifecycle', icon: 'zap', actions: status(p.status), body: draft ? `<button class="btn btn-primary btn-lg btn-block" data-toast="Program published">${icon('send', 'sm')}Publish</button>` : activeToggle('program'), cls: 'reveal-up' });
    const qrc = card({ title: 'Join QR code', icon: 'qr', sub: 'Generated the first time the program is published.', body: draft ? `<div class="empty"><div class="ill">${icon('qr', 'lg')}</div><b style="color:var(--color-text-primary)">No QR exists yet</b><span>Draft programs are invisible to customers.</span></div>` : qrPanel({ url: p.url, link: ctx.link('34-') }), cls: 'reveal-up' });
    // Tier program setup comes from its configuration (client: number of tiers, upgrade requirement, required value + rewards & benefits per tier, automatic level-up).
    const c = p.cfg, tierRows = p.kind === 'tier' ? [['Number of tiers', String(c.tiers.length)], ['Upgrade requirement', c.req + (c.req === 'Visits' ? '' : ` · ${c.currency}`)], ...(c.req === 'Points' ? [['Awarding method', c.method === 'Manual' ? `Manual · ${c.basis} ${c.currency} = ${c.pts} points` : `${c.perVisit} points per visit`]] : []), ['Level-up', 'Automatic']] : [];
    const st = card({ title: 'Setup', icon: 'sliders', body: setup([...tierRows, ...p.setup]), cls: 'reveal-up' });
    const tc = p.kind === 'tier' ? card({ title: 'Tiers', icon: 'layers', sub: 'Required value, rewards &amp; benefits and wallet colour per tier.', body: tierList(c), cls: 'reveal-up' }) : '';
    return { nav: 'Loyalty Programs', title: p.name, html: `${pageHead({ eyebrow: crumb('Loyalty Programs', ctx.link('03-')) + p.name, title: p.name, sub: `<span class="row" style="gap:8px">${badge(p.type, 'outline')}<span>${p.date}</span></span>`, actions: `${p.kind === 'points' ? `<a class="btn btn-ghost" href="${ctx.page('points-transactions')}">${icon('file', 'sm')}Transactions</a>` : ''}${walletPage[p.id] ? `<a class="btn btn-ghost" href="${ctx.link(walletPage[p.id])}">${icon('palette', 'sm')}Wallet design</a>` : `<a class="btn btn-ghost" href="${ctx.link('22-')}">${icon('palette', 'sm')}Wallet design</a>`}<a class="btn btn-primary" href="${ctx.link('15-')}">${icon('edit', 'sm')}Edit</a>` })}
      <div class="layout-preview"><div class="stack">${life}${qrc}${st}${tc}</div><div class="sticky">${phonePreview(p.pass, p.cap)}</div></div>` };
  };

  /* ================= CAMPAIGN FORM ================= */
  S.campaignForm = ctx => {
    if (ctx.opts.kind === 'acq') {
      const gift = !!ctx.opts.gift;
      const body = `<div class="form-grid">
        ${field({ label: 'Campaign Name', required: true, input: input({ ph: 'e.g. Cup-lid Campaign' }), hint: 'Internal label, e.g. “Cup-lid Campaign”.' })}
        ${field({ label: 'Linked Stamp Card Program', required: true, input: select(['Select…', 'Coffee Card', 'Lunch Card'], 'Select…'), hint: 'Which stamp card this campaign issues.' })}
        ${field({ label: 'Starting Stamps', required: true, input: select(['0', '1', '2', '3', '4', '5'], '0'), hint: 'Stamps the new card already has when issued.' })}<div></div>
        <div class="full reveal" style="${gift ? 'border-color:color-mix(in srgb,var(--color-accent) 30%,transparent);background:var(--color-accent-softer)' : ''}"><div class="row between"><div class="row"><span class="feed-ic" style="background:var(--color-highlight-soft);color:#9A7300">${icon('gift', 'sm')}</span><div><b>Welcome Gift</b> <span class="opt">(optional)</span><div class="hint">If on, reveals Reward Name, Description, Validity Period and Redemption Conditions.</div></div></div>${U.toggle(gift, 'data-reveal="#giftBody"')}</div>
          <div class="reveal-body" id="giftBody" ${gift ? '' : 'hidden'}>${field({ label: 'Reward Name', required: true, input: input({ ph: 'e.g. Free cookie' }) })}${field({ label: 'Validity Period (days)', optional: true, input: input({ type: 'number', ph: '30' }) })}<div style="grid-column:1/-1">${field({ label: 'Description', optional: true, input: textarea() })}</div><div style="grid-column:1/-1">${field({ label: 'Redemption Conditions', optional: true, input: textarea() })}</div></div></div>
      </div>`;
      return { nav: 'Loyalty Programs', title: 'New campaign', html: `${pageHead({ eyebrow: crumb('Loyalty Programs', ctx.link('03-')) + 'New campaign', title: 'New <span class="hl">campaign</span>' })}
        <div class="stack">${card({ title: 'Stamp card acquisition campaign', icon: 'stamp', sub: 'A special join QR layered on top of an existing Stamp Card program.', body, cls: 'reveal-up' })}
        <div class="row reveal-up"><button class="btn btn-primary btn-lg" data-toast="Campaign published — QR generated">${icon('qr', 'sm')}Publish &amp; generate QR</button><button class="btn btn-ghost btn-lg" data-toast="Saved as draft">Save as draft</button></div></div>` };
    }
    const pv = { type: 'voucher', name: 'Campaign name', reward: 'Voucher reward', logo: false }; g.__pass = pv;
    const body = `<div class="form-grid">
      ${field({ label: 'Campaign Name', required: true, input: input({ ph: 'Free Coffee Campaign', attrs: 'data-bind-src="name" data-fallback="Campaign name"' }), hint: 'e.g. “Free Coffee Campaign”' })}
      ${field({ label: 'Voucher Reward', required: true, input: input({ ph: '1 Free Coffee' }), hint: 'e.g. “1 Free Coffee”' })}
      ${field({ label: 'Valid From', required: true, input: input({ type: 'date' }) })}
      ${field({ label: 'Valid To', required: true, input: input({ type: 'date' }), hint: 'Window in which the voucher can be claimed and redeemed.' })}
      ${field({ label: 'Logo', required: true, input: upload(false) })}
      ${field({ label: 'Background <span class="opt">— a colour or an image, not both</span>', input: bgChoice() })}
      ${field({ label: 'Text Colour', required: true, input: colorIn('#FFFFFF') })}</div>`;
    return { nav: 'Loyalty Programs', title: 'New campaign', html: `${pageHead({ eyebrow: crumb('Loyalty Programs', ctx.link('03-')) + 'New campaign', title: 'New <span class="hl">campaign</span>' })}
      <div class="layout-preview"><div class="stack">${card({ title: 'One-time voucher campaign', icon: 'ticket', sub: 'Standalone — not linked to any stamp card. One shared QR; each claim is tracked per customer and redeemable once.', body, cls: 'reveal-up' })}
      <div class="row reveal-up"><button class="btn btn-primary btn-lg" data-toast="Campaign published — QR generated">${icon('qr', 'sm')}Publish &amp; generate QR</button><button class="btn btn-ghost btn-lg" data-toast="Saved as draft">Save as draft</button></div></div>
      <div class="sticky">${phonePreview(pv, 'Generic layout (no launch template)')}</div></div>` };
  };

  /* ================= CAMPAIGN DETAIL ================= */
  S.campaignDetail = ctx => {
    const c = D.campaigns.find(x => x.id === ctx.opts.id), acq = c.id === 'cuplid';
    const life = card({ title: 'Lifecycle', icon: 'zap', actions: status('Active'), body: activeToggle('campaign'), cls: 'reveal-up' });
    const qrc = card({ title: 'Campaign QR code', icon: 'qr', sub: 'System-generated on publish. Download for print.', body: qrPanel({ url: c.url, format: 'Cup' }), cls: 'reveal-up' });
    const st = card({ title: 'Setup', icon: 'sliders', body: setup(acq ? [['Linked stamp card', 'Coffee Card'], ['Starting stamps', '2'], ['Welcome gift', 'Free cookie · valid 30 days']] : [['Voucher reward', '1 Free Coffee'], ['Valid from', 'Sep 11, 2026'], ['Valid to', 'Dec 10, 2026']], 3), cls: 'reveal-up' });
    const pv = { type: 'voucher', name: 'Free Coffee Campaign', reward: '1 Free Coffee', from: 'Sep 11, 2026', to: 'Dec 10, 2026' }; g.__pass = pv;
    const head = pageHead({ eyebrow: crumb('Loyalty Programs', ctx.link('03-')) + c.name, title: c.name, sub: `<span class="row" style="gap:8px">${badge(acq ? 'Stamp card acquisition campaign' : 'One-time voucher campaign', 'outline')}<span>Created ${c.created}</span></span>`, actions: `<button class="btn btn-primary">${icon('edit', 'sm')}Edit</button>` });
    return { nav: 'Loyalty Programs', title: c.name, html: acq ? `${head}<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);align-items:start">${life}${qrc}</div><div style="margin-top:18px">${st}</div>` : `${head}<div class="layout-preview"><div class="stack">${life}${qrc}${st}</div><div class="sticky">${phonePreview(pv, 'Generic layout (no launch template)')}</div></div>` };
  };

  /* ================= WALLET CARDS ================= */
  S.walletCards = ctx => {
    const tpl = [['Digital Stamp Card', { type: 'stamp', name: 'Stamp template', reward: 'Reward', total: 10, filled: 4, logo: false }], ['Membership Card', { type: 'membership', name: 'Membership template', benefit: 'Benefit', logo: false }], ['Tier Program Pass', { type: 'tier', name: 'Tier template', tier: 'Tier', next: 'Progress line', logo: false }]];
    const trim = h => h.replace('<div class="pass-qr">', '<div class="pass-qr" style="display:none">');
    const tplCards = tpl.map(([n, p]) => `<article class="card hover reveal-up" style="padding:14px"><div style="transform:scale(.92);transform-origin:top center;margin-bottom:-22px">${trim(pass(p))}</div><div style="padding:6px 6px 2px"><b style="font-family:var(--font-display);font-size:16px">${n}</b><div class="hint">Base template · structure owned by Bonuca</div></div></article>`).join('');
    const sub = { coffee: '1 Free Coffee', vip: '10% Discount', club: 'Member', points: '120 pts', lunch: 'Free Lunch Menu' };
    const tiles = D.programs.map(p => `<article class="card hover wallet-tile reveal-up" data-href="${ctx.link(walletPage[p.id] || '14-')}"><div class="pass mini" style="${p.pass.bg ? `--bgp:${p.pass.bg}` : ''}"><div class="pass-top"><div class="pass-name">${p.name}</div><div class="pass-logo" style="width:28px;height:28px;font-size:14px">☕</div></div><div><div class="pass-lbl" style="margin-top:0">${{ stamp: 'Reward', membership: 'Benefit', tier: 'Current tier', points: 'Balance' }[p.kind]}</div><div class="pass-val sm">${sub[p.id]}</div></div></div><div class="meta"><span>${p.cap}</span>${status(p.status)}</div></article>`).join('');
    return { nav: 'Wallet Cards', html: `${pageHead({ eyebrow: `${icon('wallet', 'sm')} Wallet`, title: 'Wallet <span class="hl">Cards</span>', sub: 'Every field is entered once in the program’s setup. Here you choose how the pass starts (Bonuca template or custom) and preview how it renders.' })}
      <h2 class="section-title" style="margin-top:0">Base templates</h2><div class="grid g3">${tplCards}</div>
      <h2 class="section-title">Program wallet passes</h2><div class="grid g3">${tiles}</div>
      <div style="margin-top:22px">${callout('', 'Apple Wallet / Google Wallet integration not connected', 'Issued passes are generated and updated by the Bonuca backend (APNs push for Apple Wallet, Google Wallet API PATCH). That integration is not available in this environment, so no real passes are issued or updated from this portal.')}</div>` };
  };

  /* ================= WALLET DESIGN ================= */
  S.walletDesign = ctx => {
    const p = P(ctx.opts.id), android = !!ctx.opts.android; g.__pass = p.pass;
    const tplName = { coffee: 'Digital Stamp Card', vip: 'Membership Card', club: 'Tier Program Pass', points: 'Generic layout (no launch template)' }[p.id];
    const bg = { coffee: 'Bonuca gradient', vip: '#1B1B1F', club: 'Per-tier wallet colour', points: 'Bonuca gradient' }[p.id];
    const sw = c => c.startsWith('#') ? `<span class="row" style="gap:8px"><span class="swatch" style="width:22px;height:22px;padding:3px;border-radius:7px"><i style="--c:${c};border-radius:4px"></i></span><span class="mono">${c}</span></span>` : c === 'Bonuca gradient' ? `<span class="row" style="gap:8px"><span style="width:22px;height:22px;border-radius:7px;background:var(--wallet-gradient)"></span>${c}</span>` : c;
    const rows = [['Program Name', 'stamp', p.name, 'Pass header / title'], ['Logo', 'image', '<span class="row" style="gap:8px"><span class="pass-logo" style="width:22px;height:22px;font-size:12px;border-radius:6px">☕</span>Uploaded</span>', 'Top-left logo image'], ['Icon', 'sparkles', 'Uses logo', 'Wallet app list icon + notification icon'], ['Background', 'palette', sw(bg), 'Pass body background'], ['Hero / Strip Image', 'image', '<span class="faint">None</span>', 'Banner image across the top of the pass'], ['Text Colour', 'hash', sw('#FFFFFF'), 'Foreground text and small field labels'], ['QR Code', 'qr', 'Auto-generated', 'Bottom of the pass — not editable']];
    const dyn = { coffee: ['Stamp grid using the chosen Stamp Icon; “X stamps to go” line; Reward Description.', 'Every confirmed employee scan (+1 stamp).'], vip: ['Benefit; Member Since date.', 'Static — only changes if the business edits the program.'], club: ['Current Tier name + badge; background switches to that tier’s colour; “X visits/points to [next tier]” progress line.', 'Every scan that changes the customer’s visits/points/spend total.'], points: ['Current point balance; progress bar; Next Reward name; points still needed. (Multiple upcoming levels pending a technical spike — fallback layout shown.)', 'Every confirmed points transaction.'] }[p.id];
    // E3: only the program's base template — no blank "Start from Scratch" canvas (not in client spec).
    const opts = `<div class="option-row" style="display:block"><div class="row" style="gap:10px"><span class="feed-ic" style="background:var(--color-accent-soft);color:var(--color-accent)">${icon('layers', 'sm')}</span><b>Base template: ${tplName}</b></div><small style="display:block;margin-top:6px">Bonuca owns the structure (stamp grid, benefit layout, tier colour switching). You customise all visuals and wording.</small></div>`;
    const table = `<div class="table-wrap"><table class="t"><thead><tr><th>Business sets</th><th>Current</th><th>Appears on the pass as</th></tr></thead><tbody>${rows.map(([a, ic, b, c]) => `<tr><td><span class="row" style="gap:10px;font-weight:600"><span class="feed-ic" style="width:28px;height:28px;border-radius:9px;background:var(--color-surface-sunken)">${icon(ic, 'sm')}</span>${a}</span></td><td>${b}</td><td class="muted">${c}</td></tr>`).join('')}</tbody></table></div>`;
    return { nav: 'Wallet Cards', title: p.name + ' — wallet pass', html: `${pageHead({ eyebrow: crumb('Wallet Cards', ctx.link('22-')) + p.name, title: `${p.name} <span class="faint" style="font-weight:500">—</span> <span class="hl">wallet pass</span>`, actions: `<a class="btn btn-ghost" href="${ctx.link(p.id === 'coffee' ? '15-' : ({ vip: '11-', club: '12-', points: '13-' })[p.id])}">${icon('edit', 'sm')}Edit master fields in program setup</a>` })}
      <div class="layout-preview"><div class="stack">
        ${card({ title: 'Where the design starts', icon: 'layers', body: opts, cls: 'reveal-up' })}
        ${card({ title: 'Master field list', icon: 'sliders', sub: 'Set once in the program setup screen.', body: null, cls: 'reveal-up' }).replace('</section>', table + '</section>')}
        ${card({ title: 'Dynamic content', icon: 'zap', body: setup([['Shown besides the master fields', dyn[0]], ['What triggers an update', dyn[1]]]), cls: 'reveal-up' })}
        ${p.kind === 'tier' ? card({ title: 'Tier wallet colours', icon: 'palette', sub: 'Silver → the wallet becomes silver. Gold → the wallet becomes gold. Pick a tier to preview its pass.', body: `<div class="stack"><div class="choice-chips" data-tier-chips data-preview-ok>${p.cfg.tiers.map(([n], i) => `<button class="chip ${i ? '' : 'on'}" data-tier-pv="${i}">${n}</button>`).join('')}</div>${tierList(p.cfg)}</div>`, cls: 'reveal-up' }) : ''}
        ${callout('', 'Wallet update status: not connected', 'Editing a master field of an Active program applies to every issued pass; the backend would push updates via APNs / Google Wallet API. No wallet integration is available in this environment.')}
      </div><div class="sticky">${phonePreview(p.pass, p.cap, { android })}</div></div>`, after() {
        const ch = document.querySelector('[data-tier-chips]'); if (ch) ch.addEventListener('click', e => { const c = e.target.closest('[data-tier-pv]'); if (!c) return;
          g.__pass = tierPass(p, p.cfg.tiers[+c.dataset.tierPv][1]); document.querySelector('[data-pass-host]').innerHTML = pass({ ...g.__pass, android: document.querySelector('[data-phone]').classList.contains('android') }); });
      } };
  };
})(window);
