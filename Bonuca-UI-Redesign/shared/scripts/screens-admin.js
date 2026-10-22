/* Notifications, Rewards, Gifts, Analytics, Branding, Subscription, Settings */
(function (g) {
  const U = g.UI, D = g.DATA, { icon, field, input, select, textarea, toggle, check, colorIn, upload, optionRow, badge, status, card, callout, pageHead, crumb, modal, tabs, ini, esc, kv } = U;
  const S = g.SCREENS = g.SCREENS || {};

  /* ================= NOTIFICATIONS ================= */
  function winback(ctx) {
    const stages = `<div class="journey" style="--n:4">${D.stages.map(([d, o], i) => `<div class="j-stage reveal-up"><span class="j-node">${d}<small>STAGE ${i + 1}</small></span><div class="j-card">${field({ label: 'Days inactive', input: `<div class="input-wrap">${icon('hourglass')}${input({ type: 'number', value: String(d) })}</div>` })}${field({ label: 'Offer (becomes the active reward)', input: input({ value: o }) })}<button class="btn btn-danger-text btn-sm" style="align-self:flex-start">${icon('trash', 'sm')}Remove</button></div></div>`).join('')}</div>`;
    const auto = card({ title: 'Win-back automation', icon: 'repeat', sub: 'Automatic drip sequence triggered by customer inactivity. Each notification also creates a matching active reward, redeemable on the customer’s next scan.', cls: 'reveal-up', body: `<div class="stack">${optionRow('Enable win-back automation', 'Customers who stop visiting receive the offer for their stage.', true)}${stages}<div class="row"><button class="btn btn-ghost">${icon('plus', 'sm')}Add stage</button><button class="btn btn-primary" data-toast="Automation saved">${icon('check', 'sm')}Save automation</button></div></div>` });
    const t = ctx.owner ? '02:27 PM' : '02:28 PM';
    const log = card({ title: 'Automation log', icon: 'clock', sub: 'Win-back rewards created by the automation.', cls: 'reveal-up', actions: badge(D.winbackLog.length + ' entries', 'outline'), body: `<div class="stack" style="gap:6px">${callout('warn', 'Push delivery not connected', 'Rewards are created, but notifications are not delivered to customers in this environment.')}<div>${D.winbackLog.map(([s, c]) => `<div class="kv"><span class="row" style="gap:10px;color:var(--color-text-primary)">${badge('Stage ' + s, ['', 'blue', 'green', 'amber', 'red'][s])}<span>customer <span class="mono">cus_${c}</span></span></span><span class="row" style="gap:10px"><span class="faint" style="font-size:12.5px">Oct 21, 2026, ${t}</span>${badge('Not delivered', 'outline')}</span></div>`).join('')}</div></div>` });
    return auto + '<div style="height:18px"></div>' + log;
  }
  g.winback = winback;

  S.notifications = ctx => {
    const tab = ctx.opts.tab, o = ctx.owner;
    let body = '';
    if (tab === 'Manual campaigns') {
      body = `<div class="stack">${callout('info', 'Wallet push delivery not connected', 'Campaigns can be drafted and reviewed. Sending requires the push notification service, which is not available in this environment — campaigns stay drafts until delivery is confirmed.')}
      <section class="card hover reveal-up" style="padding:20px 22px"><div class="row between wrap" style="align-items:flex-start;gap:20px"><div class="row" style="align-items:flex-start;gap:16px;flex:1;min-width:280px"><span class="feed-ic" style="width:46px;height:46px;border-radius:15px;background:var(--color-highlight-soft);color:#9A7300">${icon('clock')}</span><div><div class="row" style="gap:8px;flex-wrap:wrap"><b style="font-family:var(--font-display);font-size:18px">Happy Hour 3–5 PM</b>${badge('Happy Hour', 'outline')}${status('Draft')}</div><p class="muted" style="margin-top:4px">Double the treats this afternoon — show your card at the counter.</p><p class="hint" style="margin-top:6px">${icon('calendar', 'sm')} Updated Oct 19, 2026, ${o ? '02:27' : '02:28'} PM</p></div></div>
      <div class="row"><div class="callout" style="padding:10px 12px;max-width:290px;background:var(--color-surface-muted)"><span class="pass-logo" style="width:28px;height:28px;font-size:14px">☕</span><div style="font-size:12.5px"><b style="font-size:12.5px">Sample Business · now</b>Double the treats this afternoon — show your card at the counter.</div></div></div>
      <div class="row"><button class="btn btn-ghost btn-sm" data-open="newCampaign">${icon('edit', 'sm')}Edit</button><button class="btn btn-primary btn-sm" data-toast="Saved — sending is unavailable until push delivery is connected">${icon('send', 'sm')}Send</button></div></div></section></div>`;
    }
    if (tab === 'Win-back automation') body = winback(ctx);
    if (tab === 'AI tools') {
      const lock = !o;
      const ai = (t, sub, lbl, ph) => `<section class="card ai-card reveal-up"><header class="card-head split"><div><div class="card-title"><span class="ic spark">${icon('sparkles')}</span>${t}</div><div class="card-sub">${sub}</div></div>${lock ? badge(icon('lock', 'sm') + 'Owner', 'outline') : badge('AI', 'blue')}</header><div class="card-body stack">${field({ label: lbl, input: textarea('', ph, lock ? 'disabled' : '') })}<div><button class="btn btn-primary ${lock ? 'is-locked' : ''}" ${lock ? 'disabled' : 'data-toast="Draft generated — review before saving"'}>${lock ? icon('lock', 'sm') : ''}${icon('sparkles', 'sm')}Generate draft</button></div></div></section>`;
      body = `${lock ? `<div class="lock-overlay reveal-up" style="margin-bottom:18px">${icon('lock')}AI Campaigns and the AI Bonus Generator are available to the business Owner.</div>` : ''}<div class="grid g2">${ai('AI Campaigns', 'Type a plain prompt and the AI drafts a ready-to-send campaign — message and suggested offer.', 'Prompt', 'e.g. it’s raining today')}${ai('AI Bonus Generator', 'State a goal and the AI generates offer terms, notification copy and duration for you to review and edit.', 'Goal', 'e.g. more lunch customers')}</div>`;
    }
    const nm = modal({ id: 'newCampaign', open: !!ctx.opts.modal, wide: true, title: 'New campaign', sub: 'Saved as a draft until push delivery is connected.', body: `<div class="form-grid">
      ${field({ label: 'Campaign type', required: true, input: select(['Happy Hour', 'Promotion', 'Event', 'Announcement', 'Seasonal'], 'Happy Hour') })}${field({ label: 'Title', required: true, input: input({ ph: 'e.g. Happy Hour 3–5 PM' }) })}
      <div class="full">${field({ label: 'Message', required: true, input: textarea('', 'Write the push notification text…'), hint: 'Wallet push notification text. Customer-facing language handling is an open item.' })}</div>
      ${field({ label: 'Offer', optional: true, input: input() })}${field({ label: 'Duration', optional: true, input: input({ ph: 'e.g. Today 3–5 PM' }) })}
      <div class="full">${field({ label: 'Audience <span class="opt">— no selection = members of all active programs</span>', input: `<div class="choice-chips" data-multi>${['Coffee Card', 'VIP Member', 'Rewards Club', 'Coffee Rewards'].map(p => `<label class="chip">${'<input type="checkbox" style="display:none">'}${icon('users', 'sm')}${p}</label>`).join('')}</div>` })}</div></div>`, foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-close data-toast="Draft saved">Save draft</button>` });
    return { nav: 'Notifications', title: 'Notifications · ' + tab, html: `${pageHead({ eyebrow: `${icon('bell', 'sm')} Engagement`, title: '<span class="hl">Notifications</span>', sub: 'Push campaigns, win-back automation and AI-assisted drafts for your wallet passes.', actions: tab === 'Manual campaigns' ? `<button class="btn btn-primary" data-open="newCampaign">${icon('plus', 'sm')}New campaign</button>` : '' })}
      ${tabs([['Manual campaigns', ctx.link('41-')], ['Win-back automation', ctx.link('43-')], ['AI tools', ctx.link('44-')]], tab)}${body}${tab === 'Manual campaigns' ? nm : ''}`, after() {
        document.querySelectorAll('[data-multi] .chip').forEach(c => c.onclick = e => { e.preventDefault(); c.classList.toggle('on'); });
      } };
  };

  /* ================= REWARDS ================= */
  S.rewards = ctx => {
    // Gifts are rewards too (client statuses Scheduled · Available · Redeemed · Expired · Cancelled); a gift just assigned arrives via ?new=.
    const giftRows = g.GIFTS.all(ctx).map(x => [x.name, x.customer, 'Gift · ' + g.GIFTS.srcLabel(x), x.status, x.created, x.exp, x.fresh]);
    const all = [...giftRows, ...D.rewards], PER = 20, n = s => all.filter(r => r[3] === s).length;
    const counts = Object.fromEntries(['All', 'Scheduled', 'Available', 'Redeemed', 'Pending', 'Expired', 'Cancelled'].map(k => [k, k === 'All' ? all.length : n(k)]));
    const srcIc = s => s.startsWith('Gift') ? ['gift', 'rgba(190,24,93,.12)', '#BE185D'] : s.startsWith('Win') ? ['repeat', 'var(--color-highlight-soft)', '#9A7300'] : s.startsWith('Points') ? ['coins', 'var(--color-accent-soft)', 'var(--color-accent)'] : s.startsWith('Voucher') ? ['ticket', 'rgba(124,58,237,.12)', '#7C3AED'] : ['stamp', 'var(--color-mint-soft)', '#13845B'];
    return { nav: 'Rewards', html: `${pageHead({ eyebrow: `${icon('gift', 'sm')} Engagement`, title: '<span class="hl">Rewards</span>', sub: 'Every reward issued to customers — from stamp cards, points, vouchers, win-back automation and gifts.' })}
      ${tabs([['Rewards', ctx.link('45-')], ['Gifts', ctx.link('46-')]], 'Rewards')}
      <div class="grid g4" style="margin-bottom:18px">${[['Available', 'gift'], ['Redeemed', 'checkCircle'], ['Pending', 'hourglass'], ['Expired', 'clock']].map(([l, i]) => `<div class="card hover stat reveal-up"><div class="lbl">${l}<span class="ico">${icon(i, 'sm')}</span></div><div class="val" data-count="${counts[l]}">${counts[l]}</div><div class="stat bar" style="padding:0;margin-top:10px"><i style="--w:${Math.round(counts[l] / all.length * 100)}%"></i></div></div>`).join('')}</div>
      <section class="card reveal-up" style="overflow:hidden"><div class="toolbar">${tabs(Object.entries(counts).map(([k, v]) => [k, null, v]), 'All', 'data-rtabs style="margin:0"')}<span class="hint" data-rinfo></span></div>
      <div class="table-wrap"><table class="t"><thead><tr><th>Reward</th><th>Customer</th><th>Source</th><th>State</th><th>Issued</th><th>Expires</th></tr></thead><tbody data-rrows></tbody></table></div><div class="pager"><span data-rp></span><div class="pg" data-rpg></div></div></section>`, after() {
        let f = 'All', page = 1; const draw = () => {
          const list = all.filter(r => f === 'All' || r[3] === f), pages = Math.max(1, Math.ceil(list.length / PER)); page = Math.min(page, pages);
          document.querySelector('[data-rrows]').innerHTML = list.slice((page - 1) * PER, page * PER).map((r, i) => { const [a, b, c] = srcIc(r[2]); return `<tr ${r[6] ? 'data-fresh style="background:var(--color-mint-soft)"' : `style="animation:fadeUp .4s ${i * 15}ms both"`}><td><b style="font-weight:600">${esc(r[0])}</b></td><td><div class="person" style="font-weight:500">${ini(r[1])}${esc(r[1])}</div></td><td><span class="row" style="gap:8px"><span class="feed-ic" style="width:26px;height:26px;border-radius:8px;background:${b};color:${c}">${icon(a, 'sm')}</span><span class="muted">${esc(r[2])}</span></span></td><td>${status(r[3])}</td><td class="muted">${r[4]}</td><td class="${r[5] === '—' ? 'faint' : 'muted'}">${r[5]}</td></tr>`; }).join('') || `<tr><td colspan="6"><div class="empty"><div class="ill">${icon('gift', 'lg')}</div><b style="color:var(--color-text-primary)">No ${f.toLowerCase()} rewards</b></div></td></tr>`;
          document.querySelector('[data-rinfo]').textContent = `${list.length} rewards`; document.querySelector('[data-rp]').textContent = `Page ${page} of ${pages}`;
          document.querySelector('[data-rpg]').innerHTML = Array.from({ length: pages }, (_, i) => `<button data-p="${i + 1}" class="${i + 1 === page ? 'on' : ''}">${i + 1}</button>`).join('');
        };
        document.querySelector('[data-rtabs]').addEventListener('tab', e => { f = e.detail; page = 1; draw(); });
        document.querySelector('[data-rpg]').onclick = e => { const b = e.target.closest('[data-p]'); if (b) { page = +b.dataset.p; draw(); } };
        draw();
      } };
  };

  /* ================= GIFTS (client: manual gift · group gift · simple automatic rules — replaces random rewards, E2) ================= */
  const TODAY = '2026-10-21', BIZ = 'Sample Business (development)', TERMS = 'Valid once. Not exchangeable for cash.';
  const fmtDate = iso => new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  // Client's manual gift examples, in the client's order (+ Custom).
  const PRESETS = { coffee: ['Free coffee', 'Your next coffee is on us.'], dessert: ['Free dessert', 'A dessert of your choice with your next order.'], discount: ['20% discount', '20% off your next order.'], stamp: ['One additional stamp', 'An extra stamp on your Coffee Card.'], points: ['100 bonus points', '100 bonus points on your Coffee Rewards card.'], upgrade: ['Free product upgrade', 'Upgrade any drink to a large at no extra cost.'], birthday: ['Birthday gift', 'Happy birthday! A small gift from us.'], custom: ['Custom', ''] };
  const me = ctx => ({ owner: 'Sam Owner', manager: 'Mia Manager', employee: 'Eli Employee' }[ctx.role]);
  const notifyNote = () => callout('warn', 'Customer notification not connected', 'The gift is assigned and shown on the customer’s account, but app, email and wallet notifications are not delivered in this environment.');
  // Client's group targets. ❓ "Most active" = top 10 by visits; "New" = joined in the last 30 days (defaults, flagged).
  const TARGETS = [['all', 'All customers', 'users'], ['active', 'Most active customers', 'flame', 'Top 10 customers by number of visits.'], ['visits', 'Customers with at least X visits', 'footprints'], ['inactive', 'Customers who have not visited for X days', 'hourglass'], ['new', 'New customers', 'userPlus', 'Joined in the last 30 days.'], ['tier', 'Customers in a specific membership tier', 'layers']];
  const TIER_NAMES = () => D.clubTiers.map(([n]) => n);
  const targetX = (t, v) => t === 'tier' ? (TIER_NAMES().includes(v) ? v : 'Gold') : t === 'visits' || t === 'inactive' ? Math.min(999, Math.max(1, parseInt(v, 10) || (t === 'visits' ? 5 : 30))) : '';
  const targetLabel = (t, x) => ({ all: 'All customers', active: 'Most active customers', visits: `At least ${x} visits`, inactive: `Not visited for ${x} days`, new: 'New customers', tier: `${x} tier` }[t]);
  function recipients(t, x) {
    const C = D.customers, now = Date.parse(fmtDate(TODAY));
    if (t === 'active') return [...C].sort((a, b) => b.visits - a.visits).slice(0, 10);
    if (t === 'visits') return C.filter(c => c.visits >= x);
    if (t === 'inactive') return C.filter(c => c.daysSince >= x);
    if (t === 'new') return C.filter(c => (now - Date.parse(c.joined)) / 864e5 <= 30);
    if (t === 'tier') return C.filter(c => c.tier === x);
    return C;
  }
  const srcLabel = gf => gf.src === 'Group' ? 'Group · ' + gf.target : gf.src === 'Rule' ? 'Rule · ' + gf.by.replace('Automatic rule · ', '') : 'Manual';
  // Values typed in a form travel in the URL; only whitelisted keys and plain-text values are ever read back.
  const safe = (v, max) => { v = (v || '').trim(); return v && v.length <= max && /^[\p{L}\p{N} %.,:;'’!?()+/—–\-]+$/u.test(v) ? v : ''; };
  const iso = v => /^\d{4}-\d{2}-\d{2}$/.test(v || '') && !isNaN(new Date(v + 'T00:00:00')) ? v : '';
  function readGift(q) {
    const key = q.get('gift') || ''; if (!Object.hasOwn(PRESETS, key)) return null;
    const on = iso(q.get('on')) || TODAY, exp = iso(q.get('exp')), min = parseFloat(q.get('min'));
    return { key, name: safe(q.get('n'), 40) || (key === 'custom' ? 'Custom gift' : PRESETS[key][0]), desc: safe(q.get('d'), 120), terms: safe(q.get('tc'), 120), on, exp,
      opts: { multi: q.get('m') === '1', min: min > 0 && min < 1e6 ? Math.round(min * 100) / 100 : null, locs: D.locations, combine: q.get('cb') === '1', product: safe(q.get('pr'), 40) || null } };
  }
  // Re-serialises a validated gift (never the raw query) for links to other screens.
  const giftQuery = r => { const p = new URLSearchParams({ gift: r.key, n: r.name, on: r.on }); [['d', r.desc], ['tc', r.terms], ['exp', r.exp], ['m', r.opts.multi && '1'], ['min', r.opts.min], ['cb', r.opts.combine && '1'], ['pr', r.opts.product]].forEach(([k, v]) => v && p.set(k, v)); return p.toString(); };
  // The gift(s) just assigned (?new=gift from a customer profile · ?new=group from the group screen).
  function freshGifts(ctx) {
    const q = new URLSearchParams(location.search), kind = q.get('new'), r = readGift(q); if (!r || !['gift', 'group'].includes(kind)) return [];
    const base = { name: r.name, desc: r.desc, terms: r.terms, src: kind === 'gift' ? 'Manual' : 'Group', by: me(ctx), created: fmtDate(TODAY), on: fmtDate(r.on), exp: r.exp ? fmtDate(r.exp) : '—', status: r.on > TODAY ? 'Scheduled' : 'Available', red: null, opts: r.opts, fresh: true, query: giftQuery(r) };
    if (kind === 'gift') return [{ ...base, id: 'new', cid: 'C-10001', customer: 'Anna Schmidt' }];
    const t = q.get('t'); if (!TARGETS.some(([k]) => k === t)) return [];
    const x = targetX(t, q.get('x')), target = targetLabel(t, x);
    return recipients(t, x).map((c, i) => ({ ...base, id: 'new' + i, cid: c.id, customer: c.name, target, query: `${giftQuery(r)}&t=${t}&x=${encodeURIComponent(x)}` }));
  }
  const byId = id => { const m = Object.fromEntries(D.gifts.map(x => [x.id, x])); return Object.hasOwn(m, id || '') ? m[id] : null; };
  const all = ctx => [...freshGifts(ctx), ...D.gifts];
  const optRows = gf => [['Redemption', gf.opts.multi ? 'Multiple' : 'Single'], ['Minimum purchase amount', gf.opts.min ? gf.opts.min.toFixed(2) + ' EUR' : 'None'], ['Valid locations', gf.opts.locs.map(esc).join(', ')], ['Combinable with other discounts', gf.opts.combine ? 'Yes' : 'No'], ['Product or category', gf.opts.product ? esc(gf.opts.product) : 'Any']];
  // Client's gift information, in the client's order.
  const giftKv = gf => kv([['Gift name', esc(gf.name), true], ['Description', esc(gf.desc) || '—'], ['Business', BIZ], ['Assigned customer', `${esc(gf.customer)} <span class="mono faint">${gf.cid}</span>`], ['Date created', gf.created], ['Activation date', gf.on], ['Expiration date', gf.exp], ['Status', `<span data-gd-status>${status(gf.status)}</span>`], ['Terms and conditions', esc(gf.terms) || '—'], ['Redemption date', gf.red ? gf.red.date : '—'], ['Employee who redeemed it', gf.red ? gf.red.by : '—'], ['Location where it was redeemed', gf.red ? esc(gf.red.loc) : '—'], ['Source', srcLabel(gf)], ...optRows(gf)]);
  // Activity log: every assignment and redemption (+ cancellations made here).
  const redTr = (gf, r) => r && [r.date, 'Redeemed', gf, r.by, esc(r.loc), '<span class="faint">—</span>'];
  const logRows = list => list.flatMap(gf => [redTr(gf, gf.red), redTr(gf, gf.prevRed), [gf.fresh ? 'Just now' : gf.created, 'Assigned', gf, gf.by, '<span class="faint">—</span>', badge('Not delivered', 'outline')]].filter(Boolean))
    .sort((a, b) => (b[0] === 'Just now') - (a[0] === 'Just now') || Date.parse(b[0]) - Date.parse(a[0]));
  const logTr = ([d, a, gf, by, loc, n], hl) => `<tr ${hl ? 'data-fresh style="background:var(--color-mint-soft)"' : ''}><td class="muted" style="white-space:nowrap">${d}</td><td>${badge(a, a === 'Redeemed' ? 'blue' : a === 'Cancelled' ? 'outline' : 'green')}</td><td><b style="font-weight:600">${esc(gf.name)}</b></td><td><div class="person">${ini(gf.customer)}${esc(gf.customer)}</div></td><td>${esc(by)}</td><td class="muted">${loc}</td><td>${n}</td></tr>`;

  function giftForm(o = {}) {
    const k = o.preset || 'coffee', [n, d] = PRESETS[k];
    return `<div class="stack" data-gift-form>
      ${field({ label: 'Gift', required: true, input: `<div class="choice-chips" data-gf-preset>${Object.entries(PRESETS).map(([key, [l]]) => `<button type="button" class="chip ${key === k ? 'on' : ''}" data-key="${key}">${l}</button>`).join('')}</div>` })}
      <div class="form-grid">${field({ label: 'Gift name', required: true, input: input({ value: n, attrs: 'maxlength="40" data-gf-name' }), cls: 'full' })}
        ${o.rule ? field({ label: 'Expiration', required: true, input: `<div class="row" style="gap:10px">${input({ type: 'number', value: '30', attrs: 'min="1" style="width:100px" aria-label="Valid for days" data-gf-days' })}<span class="muted">days after the gift is assigned</span></div>`, cls: 'full' })
          : field({ label: 'Activation date', required: true, input: input({ type: 'date', value: TODAY, attrs: 'data-gf-on' }), hint: 'A later date keeps the gift Scheduled until then.' }) + field({ label: 'Expiration date', required: true, input: input({ type: 'date', value: '2026-11-30', attrs: 'data-gf-exp' }) })}
        ${field({ label: 'Description', optional: true, input: textarea(d, 'Shown to the customer', 'maxlength="120" data-gf-desc'), cls: 'full' })}
        ${field({ label: 'Terms and conditions', optional: true, input: textarea(TERMS, '', 'maxlength="120" data-gf-terms'), cls: 'full' })}</div>
      <div class="label">Redemption rules</div>
      <div class="option-row"><div><b>Redemption</b><small>A gift is normally redeemable once.</small></div><div class="seg" data-gf-multi><button type="button" class="on" data-v="single">Single</button><button type="button" data-v="multiple">Multiple</button></div></div>
      <div class="form-grid">${field({ label: 'Minimum purchase amount', optional: true, input: input({ type: 'number', ph: 'e.g. 10.00', attrs: 'min="0" step="0.01" data-gf-min' }), hint: 'EUR' })}
        ${field({ label: 'Valid locations', required: true, input: `<div class="stack" style="gap:8px">${D.locations.map(l => U.check(esc(l), true, 'data-gf-loc')).join('')}</div>` })}</div>
      ${optionRow('Combinable with other discounts', 'Allow this gift together with other discounts or rewards.', false, 'data-gf-combine')}
      ${optionRow('Specific product or category only', 'Limit the gift to one product or category.', false, 'data-gf-prod-on data-reveal="[data-gf-prod]"')}
      <div data-gf-prod hidden>${field({ label: 'Product or category', required: true, input: input({ ph: 'e.g. Cakes', attrs: 'maxlength="40" data-gf-prod-in' }) })}</div>
      ${notifyNote()}</div>`;
  }
  function wireGiftForm(root) {
    const $ = s => root.querySelector(s);
    $('[data-gf-preset]').addEventListener('click', e => { const c = e.target.closest('.chip'); if (!c || c.matches('[data-preview-lock]')) return; const [n, d] = PRESETS[c.dataset.key]; $('[data-gf-name]').value = c.dataset.key === 'custom' ? '' : n; $('[data-gf-desc]').value = d; if (c.dataset.key === 'custom') $('[data-gf-name]').focus(); });
    // Returns the URL params for the gift, or null (with the problem shown) when the form is incomplete.
    return () => {
      const bad = (el, msg) => { const f = el.closest('.field'); f && f.classList.add('has-error'); setTimeout(() => f && f.classList.remove('has-error'), 1200); g.toast(msg, 'info'); return null; };
      const p = new URLSearchParams(), name = $('[data-gf-name]').value.trim(), pr = $('[data-gf-prod-in]').value.trim();
      if (!name) return bad($('[data-gf-name]'), 'Enter a gift name.');
      if (!safe(name, 40)) return bad($('[data-gf-name]'), 'Use letters, numbers and simple punctuation in the gift name.');
      p.set('gift', $('[data-gf-preset] .chip.on').dataset.key); p.set('n', name);
      for (const [k, s] of [['d', '[data-gf-desc]'], ['tc', '[data-gf-terms]']]) { const raw = $(s).value.trim(), v = safe(raw, 120); if (raw && !v) return bad($(s), 'Use letters, numbers and simple punctuation (one line, up to 120 characters).'); v && p.set(k, v); }
      const days = $('[data-gf-days]'); if (days && !(parseInt(days.value, 10) > 0)) return bad(days, 'Enter how many days the gift stays valid.');
      const on = $('[data-gf-on]'), exp = $('[data-gf-exp]');
      if (on) { if (!iso(on.value)) return bad(on, 'Choose an activation date.'); if (!iso(exp.value)) return bad(exp, 'Choose an expiration date.'); if (exp.value <= on.value) return bad(exp, 'The expiration date must be after the activation date.'); p.set('on', on.value); p.set('exp', exp.value); }
      if (!root.querySelector('[data-gf-loc]:checked')) return bad($('[data-gf-loc]'), 'Choose at least one location.');
      if ($('[data-gf-multi] .on').dataset.v === 'multiple') p.set('m', '1');
      const min = parseFloat($('[data-gf-min]').value); if (min > 0) p.set('min', String(min));
      if ($('[data-gf-combine]').checked) p.set('cb', '1');
      if ($('[data-gf-prod-on]').checked) { if (!safe(pr, 40)) return bad($('[data-gf-prod-in]'), 'Enter the product or category.'); p.set('pr', pr); }
      return p;
    };
  }
  g.GIFTS = { all, byId, freshGifts, giftForm, wireGiftForm, giftKv, optRows, srcLabel, notifyNote, me, fmtDate, TODAY };

  const giftTabs = (ctx, active) => tabs([['Rewards', ctx.link('45-')], ['Gifts', ctx.link('46-')]], active);
  const giftHead = ctx => pageHead({ eyebrow: `${icon('gift', 'sm')} Engagement`, title: '<span class="hl">Rewards</span>', sub: 'Every reward issued to customers — from stamp cards, points, vouchers, win-back automation and gifts.' });
  const ORIGIN = { manual: ['Manual gifts', 'Manual'], group: ['Group gifts', 'Group'], rules: ['Automatic rules', 'Rule'], log: ['Activity log'] };
  const GSTAT = ['All', 'Scheduled', 'Available', 'Redeemed', 'Expired', 'Cancelled'];

  S.gifts = ctx => {
    const q = new URLSearchParams(location.search), tab = Object.hasOwn(ORIGIN, q.get('tab') || '') ? q.get('tab') : 'manual';
    const fresh = freshGifts(ctx), list = [...fresh, ...D.gifts];
    // A gift redeemed in the scanner (?redeemed=id) is shown with its redemption.
    const rd = byId(q.get('redeemed')), red = rd && rd.status === 'Available' ? { ...rd, red: { date: 'Just now', by: me(ctx), loc: D.locations[0] }, prevRed: rd.red, status: rd.opts.multi ? 'Available' : 'Redeemed', justRedeemed: true } : null;
    const gifts = red ? list.map(x => x.id === red.id ? red : x) : list;
    const hint = { manual: `Assigned from a customer profile. <a class="link" href="${ctx.nav(ctx.link('35-'))}">Customers ${icon('arrowRight', 'sm')}</a>`, group: `<a class="link" href="${ctx.nav(ctx.page('gift-new-group'))}">New group gift ${icon('arrowRight', 'sm')}</a>`, rules: `Assigned when a customer meets a rule. <a class="link" href="${ctx.nav(ctx.page('gift-rules'))}">Manage rules ${icon('arrowRight', 'sm')}</a>` };
    const freshNote = fresh.length ? `<div style="margin-bottom:18px">${callout('info', fresh[0].src === 'Group' ? 'Group gift assigned' : 'Gift assigned', fresh[0].src === 'Group' ? `${esc(fresh[0].name)} assigned to ${fresh.length} customer${fresh.length === 1 ? '' : 's'} (${esc(fresh[0].target)}) — ${fresh[0].status}.` : `${esc(fresh[0].name)} assigned to ${esc(fresh[0].customer)} — ${fresh[0].status}.`, 'checkCircle')}</div>` : red ? `<div style="margin-bottom:18px">${callout('info', 'Gift redeemed', `${esc(red.name)} redeemed for ${esc(red.customer)} — recorded in the activity log.`, 'checkCircle')}</div>` : '';
    const table = `<div class="table-wrap"><table class="t"><thead><tr><th>Gift</th><th>Customer</th><th>Source</th><th>Status</th><th>Activation</th><th>Expires</th><th></th></tr></thead><tbody data-grows></tbody></table></div>`;
    const logList = logRows(gifts);
    const logCard = card({ title: 'Activity log', icon: 'clock', sub: 'Every gift assignment and redemption — prevents duplicate or accidental multiple redemptions.', actions: badge(`<span data-glog-n>${logList.length}</span> entries`, 'outline'), body: null, cls: 'reveal-up', attrs: 'data-glog style="overflow:hidden"' })
      .replace('</section>', `<div style="padding:0 22px 16px">${callout('warn', 'Notifications not connected', 'Gifts are assigned, but app, email and wallet notifications are not delivered in this environment.')}</div><div class="table-wrap"><table class="t"><thead><tr><th>Date / time</th><th>Action</th><th>Gift</th><th>Customer</th><th>By</th><th>Location</th><th>Notification</th></tr></thead><tbody data-glog-rows>${logList.map((r, i) => logTr(r, r[0] === 'Just now')).join('')}</tbody></table></div></section>`);
    const det = modal({ id: 'giftDetail', open: false, wide: true, title: 'Gift details', body: '<div data-gd-body></div>', foot: `<button class="btn btn-ghost" data-close>Close</button><button class="btn btn-danger-text" data-gd-cancel>${icon('x', 'sm')}Cancel gift</button>` });
    return { nav: 'Rewards', title: 'Gifts', html: `${giftHead(ctx)}${giftTabs(ctx, 'Gifts')}
      <div class="row between wrap" style="margin-bottom:18px;gap:12px">${tabs(Object.values(ORIGIN).map(([l]) => l), ORIGIN[tab][0], 'data-gtabs style="margin:0"')}<div class="row"><a class="btn btn-ghost" href="${ctx.page('gift-rules')}">${icon('zap', 'sm')}Automatic rules</a><a class="btn btn-primary" href="${ctx.page('gift-new-group')}">${icon('users', 'sm')}New group gift</a></div></div>
      ${freshNote}
      <section class="card reveal-up" style="overflow:hidden" data-glist ${tab === 'log' ? 'hidden' : ''}><div class="toolbar">${tabs(GSTAT.map(s => [s, null, 0]), 'All', 'data-gstat style="margin:0"')}<span class="hint" data-ghint></span></div>${table}</section>
      <div data-glog-wrap ${tab === 'log' ? '' : 'hidden'}>${logCard}</div>${det}`, after() {
        let origin = tab, st = 'All', open = null;
        const src = () => ORIGIN[origin][1];
        const draw = () => {
          const inOrigin = gifts.filter(x => x.src === src()), rows = inOrigin.filter(x => st === 'All' || x.status === st);
          document.querySelectorAll('[data-gstat] > button').forEach(b => b.querySelector('.count').textContent = b.dataset.tab === 'All' ? inOrigin.length : inOrigin.filter(x => x.status === b.dataset.tab).length);
          document.querySelector('[data-ghint]').innerHTML = hint[origin] || '';
          document.querySelector('[data-grows]').innerHTML = rows.map((x, i) => `<tr class="clickable" data-gift="${i}" ${x.fresh || x.justRedeemed ? 'data-fresh style="background:var(--color-mint-soft)"' : `style="animation:fadeUp .4s ${i * 15}ms both"`}><td><b style="font-weight:600">${esc(x.name)}</b></td><td><div class="person">${ini(x.customer)}${esc(x.customer)}</div></td><td class="muted">${esc(srcLabel(x))}</td><td>${status(x.status)}</td><td class="muted">${x.on}</td><td class="muted">${x.exp}</td><td class="num faint">${icon('chevronRight', 'sm')}</td></tr>`).join('') || `<tr><td colspan="7"><div class="empty"><div class="ill">${icon('gift', 'lg')}</div><b style="color:var(--color-text-primary)">No ${st === 'All' ? '' : st.toLowerCase() + ' '}gifts</b></div></td></tr>`;
          document.querySelector('[data-grows]').__rows = rows;
        };
        document.querySelector('[data-gtabs]').addEventListener('tab', e => { origin = Object.keys(ORIGIN).find(k => ORIGIN[k][0] === e.detail); const log = origin === 'log'; document.querySelector('[data-glist]').hidden = log; document.querySelector('[data-glog-wrap]').hidden = !log; if (!log) draw(); });
        document.querySelector('[data-gstat]').addEventListener('tab', e => { st = e.detail; draw(); });
        const body = document.querySelector('[data-gd-body]'), cancel = document.querySelector('[data-gd-cancel]');
        document.querySelector('[data-grows]').addEventListener('click', e => { const tr = e.target.closest('[data-gift]'); if (!tr) return; open = document.querySelector('[data-grows]').__rows[+tr.dataset.gift]; body.innerHTML = giftKv(open); cancel.hidden = !['Scheduled', 'Available'].includes(open.status); g.openModal('giftDetail'); });
        cancel.addEventListener('click', () => {
          if (!open || !['Scheduled', 'Available'].includes(open.status)) return;
          open.status = 'Cancelled'; body.innerHTML = giftKv(open); cancel.hidden = true;
          document.querySelector('[data-glog-rows]').insertAdjacentHTML('afterbegin', logTr(['Just now', 'Cancelled', open, me(ctx), '<span class="faint">—</span>', '<span class="faint">—</span>'], true));
          const n = document.querySelector('[data-glog-n]'); n.textContent = +n.textContent + 1; draw(); g.toast(`${open.name} cancelled for ${open.customer}`);
        });
        if (tab !== 'log') draw(); else { origin = 'manual'; draw(); origin = 'log'; }
      } };
  };

  /* ---------- group gift: client targets with a live recipient count from the customer data ---------- */
  S.giftGroup = ctx => {
    const xIn = (k, v, unit, lbl) => `<div class="row" style="gap:8px">${input({ type: 'number', value: v, attrs: `min="1" style="width:90px" aria-label="${lbl}" data-gx="${k}"` })}<span class="muted">${unit}</span></div>`;
    const extra = { visits: xIn('visits', '5', 'visits or more', 'Minimum visits'), inactive: xIn('inactive', '30', 'days without a visit', 'Days without a visit'), tier: select(TIER_NAMES(), 'Gold', 'data-gx="tier" aria-label="Tier" style="max-width:180px"') };
    const opts = TARGETS.map(([k, l, ic, sub]) => `<div class="type-card ${k === 'tier' ? 'on' : ''}" role="radio" tabindex="0" data-select="${k}"><div class="row between"><span class="ti">${icon(ic)}</span>${badge(`<span data-gcount="${k}"></span> customers`, 'outline')}</div><b>${l}</b>${extra[k] || `<small>${sub || 'Every customer of the business.'}</small>`}</div>`).join('');
    const summary = card({ title: 'Recipients', icon: 'users', cls: 'reveal-up', body: `<div class="stack"><div><div class="val" style="font-family:var(--font-display);font-size:40px;font-weight:700;letter-spacing:-.03em" data-gg-count>0</div><div class="muted" data-gg-label></div></div><div class="hint" data-gg-names></div><button class="btn btn-primary btn-lg btn-block" data-gg-send>${icon('gift', 'sm')}Assign to <span data-gg-n>0</span> customers</button></div>` });
    return { nav: 'Rewards', title: 'New group gift', html: `${pageHead({ eyebrow: crumb('Rewards', ctx.link('45-')) + crumb('Gifts', ctx.link('46-')) + 'New group gift', title: 'New <span class="hl">group gift</span>', sub: 'Assign one gift to a selected group of customers, e.g. “Send a free dessert to all Gold members.”' })}
      <div class="layout-preview"><div class="stack">${card({ title: 'Customer group', icon: 'users', cls: 'reveal-up', body: `<div class="type-grid" data-gg-targets>${opts}</div>` })}${card({ title: 'Gift', icon: 'gift', cls: 'reveal-up', body: giftForm({ preset: 'dessert' }) })}</div><div class="sticky">${summary}</div></div>`, after() {
        const read = wireGiftForm(document.querySelector('[data-gift-form]'));
        let t = 'tier'; const xv = k => { const el = document.querySelector(`[data-gx="${k}"]`); return targetX(k, el && el.value); };
        const upd = () => {
          TARGETS.forEach(([k]) => document.querySelector(`[data-gcount="${k}"]`).textContent = recipients(k, xv(k)).length);
          const r = recipients(t, xv(t)), n = r.length;
          document.querySelector('[data-gg-count]').textContent = n; document.querySelector('[data-gg-n]').textContent = n; document.querySelector('[data-gg-label]').textContent = targetLabel(t, xv(t));
          document.querySelector('[data-gg-names]').textContent = n ? r.slice(0, 6).map(c => c.name).join(', ') + (n > 6 ? ` and ${n - 6} more` : '') : 'No customers match this group.';
        };
        const tg = document.querySelector('[data-gg-targets]');
        tg.addEventListener('typechange', e => { t = e.detail; upd(); }); tg.addEventListener('input', upd); tg.addEventListener('change', upd);
        tg.addEventListener('keydown', e => { const c = e.target.closest('.type-card'); if (c && e.target === c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); c.click(); } });
        document.querySelector('[data-gg-send]').onclick = () => {
          if (!recipients(t, xv(t)).length) { g.toast('No customers match this group.', 'info'); return; }
          const p = read(); if (!p) return; p.set('t', t); p.set('x', String(xv(t)));
          location.href = ctx.nav(`${ctx.link('46-')}?tab=group&new=group&${p}`);
        };
        upd();
      } };
  };

  /* ---------- automatic rules: the client's simple conditions; customers are not told in advance ---------- */
  const RULES = [['After the Xth visit', 'visit'], ['Birthday', ''], ['After registration', ''], ['X days without a visit', 'days'], ['Reaching a tier', 'tier'], ['Spending amount', 'spend'], ['Points or stamps reached', 'pts']];
  const ord = n => n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) || n % 10 > 3 ? 0 : n % 10] || 'th');
  const ruleText = (t, v) => ({ 'After the Xth visit': `After the ${ord(+v)} visit`, Birthday: 'On the customer’s birthday', 'After registration': 'After registration', 'X days without a visit': `After ${v} days without a visit`, 'Reaching a tier': `When reaching ${v} status`, 'Spending amount': `After spending ${v}`, 'Points or stamps reached': `After reaching ${v}` }[t]);
  const ruleRow = ([t, v, gname, on]) => `<div class="option-row"><div><b>${esc(ruleText(t, v))}</b><small>${icon('gift', 'sm')} ${esc(gname)}</small></div>${toggle(on, `aria-label="${esc(ruleText(t, v))} active"`)}</div>`;
  S.giftRules = ctx => {
    const val = { visit: `<div class="row" style="gap:8px"><span class="muted">After visit number</span>${input({ type: 'number', value: '5', attrs: 'min="1" style="width:90px" aria-label="Visit number" data-rv-in="visit"' })}</div>`, days: `<div class="row" style="gap:8px">${input({ type: 'number', value: '30', attrs: 'min="1" style="width:90px" aria-label="Days without a visit" data-rv-in="days"' })}<span class="muted">days without a visit</span></div>`,
      tier: select(TIER_NAMES().slice(1), 'Gold', 'aria-label="Tier" data-rv-in="tier"'), spend: `<div class="row" style="gap:8px">${input({ type: 'number', value: '200', attrs: 'min="1" style="width:110px" aria-label="Spending amount" data-rv-in="spend"' })}${select(['EUR', 'USD', 'GBP', 'CZK', 'TRY', 'CHF', 'PLN'], 'EUR', 'aria-label="Currency" data-rv-cur style="width:110px"')}</div>`,
      pts: `<div class="row" style="gap:8px">${input({ type: 'number', value: '500', attrs: 'min="1" style="width:110px" aria-label="Points or stamps" data-rv-in="pts"' })}${select(['points · Coffee Rewards', 'stamps · Coffee Card'], 'points · Coffee Rewards', 'aria-label="Points or stamps" data-rv-unit')}</div>` };
    const form = card({ title: 'New rule', icon: 'plus', cls: 'reveal-up', body: `<div class="stack">${field({ label: 'Condition', required: true, input: select(RULES.map(([t]) => t), 'After the Xth visit', 'data-rule-t') })}
      ${Object.entries(val).map(([k, h]) => `<div data-rv="${k}" ${k === 'visit' ? '' : 'hidden'}>${h}</div>`).join('')}
      <div style="border-top:1px dashed var(--color-border-strong);padding-top:16px">${giftForm({ rule: true })}</div></div>`, foot: `<button class="btn btn-primary" data-rule-save>${icon('check', 'sm')}Save rule</button>` });
    return { nav: 'Rewards', title: 'Automatic gift rules', html: `${pageHead({ eyebrow: crumb('Rewards', ctx.link('45-')) + crumb('Gifts', ctx.link('46-')) + 'Automatic rules', title: 'Automatic <span class="hl">gift rules</span>', sub: 'A gift is assigned automatically when a customer meets the condition. Customers are not told about the rule in advance.' })}
      <div class="layout-preview"><div class="stack">${form}</div><div class="sticky">${card({ title: 'Rules', icon: 'zap', actions: badge(`<span data-rules-n>${D.giftRules.length}</span> rules`, 'outline'), cls: 'reveal-up', body: `<div class="stack" style="gap:10px" data-rules>${D.giftRules.map(ruleRow).join('')}</div>` })}</div></div>`, after() {
        const read = wireGiftForm(document.querySelector('[data-gift-form]')), ts = document.querySelector('[data-rule-t]');
        const kind = () => RULES.find(([t]) => t === ts.value)[1];
        ts.onchange = () => document.querySelectorAll('[data-rv]').forEach(d => d.hidden = d.dataset.rv !== kind());
        document.querySelector('[data-rule-save]').onclick = () => {
          const k = kind(), el = k && document.querySelector(`[data-rv-in="${k}"]`); let v = el ? el.value.trim() : '';
          if (el && el.type === 'number' && !(parseFloat(v) > 0)) { g.toast('Enter a value for the condition.', 'info'); return; }
          if (k === 'spend') v += ' ' + document.querySelector('[data-rv-cur]').value;
          if (k === 'pts') v += ' ' + document.querySelector('[data-rv-unit]').value.split(' · ')[0];
          const p = read(); if (!p) return;
          document.querySelector('[data-rules]').insertAdjacentHTML('afterbegin', ruleRow([ts.value, v, p.get('n'), true]));
          const n = document.querySelector('[data-rules-n]'); n.textContent = +n.textContent + 1; g.toast('Rule saved');
        };
      } };
  };

  /* ================= ANALYTICS ================= */
  S.analytics = ctx => {
    const A = D.analytics;
    const stats = [['Visitors', 54, 'users'], ['Returning customers', 50, 'repeat'], ['Retention', 85, 'gauge', 'Previous 30 days’ customers who returned', '%'], ['Visit frequency', 4.9, 'footprints', 'Visits per visitor'], ['Reward redemptions', 29, 'gift']];
    const sc = stats.map(([l, v, i, n, suf], k) => `<div class="card hover stat reveal-up ${k === 2 ? 'feature' : ''}"><div class="lbl">${l}<span class="ico">${icon(i, 'sm')}</span></div><div class="row between" style="align-items:flex-end"><div class="val" data-count="${v}" data-suffix="${suf || ''}">${v}${suf || ''}</div>${k === 2 ? `<span style="margin-bottom:4px">${U.ring(.85, 46, 6, 'var(--color-highlight)', 'rgba(127,127,140,.3)')}</span>` : ''}</div>${n ? `<div class="note">${n}</div>` : ''}</div>`).join('');
    const days = U.chartTableToggle('days', U.barChart(A.days, A.dayVals, { max: 80, bw: 38, peak: '#0B0B0F' }), A.days.map((d, i) => [d, A.dayVals[i]]), ['Day', 'Scans']);
    const grw = U.chartTableToggle('grw', U.barChart(A.weeksL, A.weeks, { max: 8, bw: 26, c1: '#8B7CF6', c2: '#1747F8' }), A.weeksL.map((d, i) => [d, A.weeks[i]]), ['Week', 'New members']);
    const heat = (d, h) => { if (h < 9 || h > 20) return 0; const base = [3, 3, 4, 2, 2, 3, 3][d]; const peak = (h >= 11 && h <= 13) ? 2 : (h >= 17 && h <= 19) ? 1 : 0; return Math.min(4, Math.max(1, base - 1 + peak + ((d * 7 + h * 3) % 3 === 0 ? 1 : 0) - ((d + h) % 5 === 0 ? 1 : 0))); };
    const shades = ['var(--color-surface-sunken)', '#C9D5FF', '#94ADFF', '#5B80FF', '#1747F8'];
    const hm = U.chartTableToggle('heat', `<div class="heat"><span></span>${Array.from({ length: 24 }, (_, h) => `<span class="lb" style="text-align:center">${h % 3 === 0 ? h : ''}</span>`).join('')}${A.days.map((d, di) => `<span class="lb">${d}</span>${Array.from({ length: 24 }, (_, h) => { const v = heat(di, h); return `<span class="c" title="${d} ${h}:00 — level ${v}" style="background:${shades[v]};animation-delay:${(di * 24 + h) * 4}ms"></span>`; }).join('')}`).join('')}</div><div class="heat-legend">Fewer ${shades.map(s => `<i style="background:${s}"></i>`).join('')} More</div>`, A.days.map((d, di) => [d, Array.from({ length: 24 }, (_, h) => heat(di, h)).reduce((a, b) => a + b, 0)]), ['Day', 'Activity index']);
    const top = `<div>${A.top.map(([n, v], i) => `<div class="list-row"><div class="row">${i < 3 ? `<span class="medal ${['', 's', 'b'][i]}">${i + 1}</span>` : `<span class="medal" style="background:var(--color-surface-sunken);color:var(--color-text-secondary);box-shadow:none">${i + 1}</span>`}${ini(n)}<b style="font-weight:600">${n}</b></div><div class="row" style="gap:14px;flex:1;max-width:340px"><div class="mini-prog" style="flex:1;margin:0"><i style="--w:${v / 18 * 100}%"></i></div><b style="min-width:70px;text-align:right">${v} visits</b></div></div>`).join('')}</div>`;
    const lockPro = !ctx.owner;
    return { nav: 'Analytics', html: `${pageHead({ eyebrow: `${icon('chart', 'sm')} Insights`, title: '<span class="hl">Analytics</span>', sub: 'Last 30 days.' })}
      <div class="grid g5">${sc}</div>
      <div class="grid g2" style="margin-top:18px">${card({ title: 'Most active days', icon: 'calendar', actions: days.seg, body: days.body, cls: 'reveal-up' })}${card({ title: 'Growth', icon: 'arrowUpRight', sub: `New members per week · ${badge('+150% vs previous 30 days', 'green')}`, actions: grw.seg, body: grw.body, cls: 'reveal-up' })}</div>
      <div class="grid" style="grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);margin-top:18px;align-items:start">${card({ title: 'Activity heatmap', icon: 'flame', sub: 'Scans by weekday and hour', actions: hm.seg, body: hm.body, cls: 'reveal-up' })}
        <section class="card ai-card reveal-up"><header class="card-head split"><div><div class="card-title"><span class="ic spark">${icon('sparkles')}</span>AI commentary</div><div class="card-sub">Plain-language explanation of the pattern with a suggested action.</div></div>${badge('Pro', 'blue')}</header><div class="card-body stack"><p class="hint">Pro-plan exclusivity is pending client confirmation.</p><button class="btn btn-primary btn-block" data-toast="Generating explanation…">${icon('sparkles', 'sm')}Explain this pattern</button></div></section></div>
      <div style="margin-top:18px">${card({ title: 'Top members', icon: 'trophy', sub: 'Most visits in the last 30 days', body: null, cls: 'reveal-up' }).replace('</section>', top + '</section>')}</div>` };
  };

  /* ================= BRANDING ================= */
  const brandPreview = () => `<div class="reveal" data-brand-preview style="background:var(--bp-bg,#FBFBFB);color:#0A0A0A;padding:20px"><div class="eyebrow" style="color:#8D9098">${icon('eye', 'sm')} Customer-facing preview</div><div class="row" style="margin:10px 0 16px"><span class="avatar" style="background:var(--bp-p,#1747F8)">S</span><b style="font-family:var(--font-display);font-size:17px">Sample Business (development)</b></div><button class="btn" style="background:var(--bp-p,#1747F8);color:#fff">Sample button</button><div class="pass" style="--bgp:linear-gradient(150deg,var(--bp-s,#0A112F),#000);margin-top:16px;padding:14px"><div class="pass-top"><div class="pass-logo" style="width:28px;height:28px;font-size:13px">S</div><div class="pass-name">Sample Business</div></div><div class="pass-lbl">Reward</div><div class="pass-val sm">1 Free Coffee</div></div><p style="font-size:12.5px;color:#5B5E66;margin-top:12px">Preview of your business colours on customer-facing surfaces.</p></div>`;
  const brandFields = (withLogo) => `<div class="stack">${withLogo ? field({ label: 'Logo', optional: true, input: upload(false) }) : ''}<div class="grid g3">${field({ label: 'Primary Color', input: colorIn('#1747F8').replace('data-color', 'data-color data-bp="p"') })}${field({ label: 'Secondary Color', input: colorIn('#0A112F').replace('data-color', 'data-color data-bp="s"') })}${field({ label: 'Background', input: colorIn('#FBFBFB').replace('data-color', 'data-color data-bp="bg"') })}</div>${field({ label: 'Font', input: select(['System', 'Inter', 'Serif', 'Rounded'], 'System'), hint: 'Font options are provisional; Apple/Google Wallet passes do not support custom fonts.' })}<div><button class="btn btn-primary" data-toast="Branding saved">${icon('check', 'sm')}Save</button></div></div>`;
  const brandWire = () => document.querySelectorAll('[data-bp]').forEach(i => i.addEventListener('input', () => { if (/^#[0-9a-f]{6}$/i.test(i.value)) document.querySelector('[data-brand-preview]').style.setProperty('--bp-' + i.dataset.bp, i.value); }));
  S.branding = ctx => {
    const tok = [['Background', '#FBFBFB', '#010414'], ['Primary Text', '#0A0A0A', '#FFFFFF'], ['Primary Accent (Bonuca Blue)', '#1747F8', '#1747F8'], ['Wallet gradient (default template)', '#0A112F → #000000', '#0A112F → #000000']];
    const sw = v => `<span class="row" style="gap:8px"><span style="width:20px;height:20px;border-radius:6px;border:1px solid var(--color-border-strong);background:${v.includes('→') ? 'linear-gradient(135deg,#0A112F,#000)' : v}"></span><span class="mono">${v}</span></span>`;
    const table = `<div class="table-wrap"><table class="t"><thead><tr><th>Token</th><th>Light mode</th><th>Dark mode</th></tr></thead><tbody>${tok.map(([t, l, d]) => `<tr><td><b style="font-weight:600">${t}</b></td><td>${sw(l)}</td><td>${sw(d)}</td></tr>`).join('')}</tbody></table></div>`;
    return { nav: 'Branding', html: `${pageHead({ eyebrow: `${icon('palette', 'sm')} Business`, title: '<span class="hl">Branding</span>', sub: 'Your logo, colours, background and font propagate to your wallet card defaults and customer-facing surfaces.' })}
      <div class="layout-preview">${card({ title: 'Business branding', icon: 'palette', body: brandFields(true), cls: 'reveal-up' })}<div class="sticky reveal-up">${brandPreview()}</div></div>
      <div style="margin-top:18px">${card({ title: 'Bonuca platform colours', icon: 'layers', sub: 'Bonuca’s own brand for the dashboard chrome and default template — separate from your business colours. Values pending final designer confirmation.', body: null, cls: 'reveal-up' }).replace('</section>', table + '</section>')}</div>`, after: brandWire };
  };

  /* ================= SUBSCRIPTION ================= */
  S.subscription = ctx => {
    const o = ctx.owner, pv = ctx.state.preview;
    const head = pageHead({ eyebrow: `${icon('card', 'sm')} Business`, title: 'Subscription &amp; <span class="hl">Billing</span>' });
    // Subscription & billing are Owner-only (client spec); the Manager file stays reachable but shows no plan data.
    if (!ctx.can('billing')) return { nav: '', title: 'Subscription & Billing', html: `${head}<div class="lock-overlay">${icon('lock')}Your role does not have access to this feature.</div>` };
    if (pv) {
      // Preview Mode: choosing a plan is the way out, so these actions stay enabled and leave the preview state.
      const exit = (t, prim) => `<a class="btn ${prim ? 'btn-primary' : 'btn-ghost'} btn-block" data-preview-ok data-no-state href="${ctx.link('01-')}">${t}</a>`;
      const plans = `<div class="grid g3">${g.planCard('Free Plan', 'No payment details required', D.plans.free, exit('Choose Free Plan'))}${g.planCard('Free Trial', '14 days, then reverts to Free (or Preview) — no data is deleted', D.plans.trial, exit(`Start Free Trial ${icon('arrowRight', 'sm')}`, true), { cls: 'current' })}${g.planCard('Pro Plan', 'Pricing not configured yet <span class="faint">(set by Bonuca)</span>', D.plans.pro, `<button class="btn btn-ghost btn-block" data-preview-ok data-toast="Stripe checkout is not connected in this environment">Choose Pro — Stripe checkout</button>`, { cls: 'ink' })}</div>`;
      return { nav: 'Subscription & Billing', html: `${head}<section class="card reveal-up"><div class="card-body"><div class="row" style="gap:8px"><b style="font-family:var(--font-display);font-size:26px;letter-spacing:-.03em">No plan selected</b>${badge('Preview Mode', 'outline')}</div></div></section><h2 class="section-title">Choose a plan</h2>${plans}` };
    }
    let cur = `<section class="card reveal-up" style="overflow:hidden"><div class="card-body"><div class="row between wrap" style="gap:24px"><div class="row" style="gap:20px"><span style="color:var(--color-accent)">${U.ring(4 / 14, 84, 9, 'var(--color-accent)', 'var(--color-surface-sunken)', '')}</span><div><div class="row" style="gap:8px"><b style="font-family:var(--font-display);font-size:26px;letter-spacing:-.03em">Pro</b>${badge('Free Trial', 'blue', true)}</div><p class="muted" style="margin-top:4px">Trial ends <b style="color:var(--color-text-primary)">Oct 31, 2026</b> · 10 days left</p></div></div>
      <div class="grid g2" style="gap:12px;min-width:320px">${U.setup([['Plan', 'Pro'], ['Trial ends', 'Oct 31, 2026 (10 days)']])}</div></div><p class="hint" style="margin-top:16px">${icon('shield', 'sm')} Changing plans never deletes customers, programs or transactions — only feature access changes.</p></div></section>`;
    // Super Admin override: the business sees its managed plan but cannot change it (read-only).
    const ov = ctx.state.override;
    if (ov) cur = `<section class="card reveal-up"><div class="card-body"><div class="row" style="gap:8px"><b style="font-family:var(--font-display);font-size:26px;letter-spacing:-.03em">Pro</b>${badge('Managed by Bonuca', 'blue')}</div><div class="grid g2" style="gap:12px;margin-top:14px;max-width:420px">${U.setup([['Plan', 'Pro'], ['Managed until', ctx.state.overrideEnd || 'No end date']])}</div></div></section>`;
    const lockBtn = (t, prim) => o && !ov ? `<button class="btn ${prim ? 'btn-primary' : 'btn-ghost'} btn-block" data-toast="Stripe checkout is not connected in this environment">${t}</button>` : `<button class="btn ${prim ? 'btn-primary' : 'btn-ghost'} btn-block is-locked" disabled>${icon('lock', 'sm')}${t}</button>`;
    const plans = `<div class="grid g3">${g.planCard('Free Plan', 'No payment details required', D.plans.free, lockBtn('Choose Free Plan'))}${g.planCard('Free Trial', '14 days, then reverts to Free (or Preview) — no data is deleted', D.plans.trial, ov ? lockBtn('Start Free Trial') : `<div class="callout" style="justify-content:center">${icon('hourglass', 'sm')}Trial in progress.</div>`)}${g.planCard('Pro Plan', 'Pricing not configured yet <span class="faint">(set by Bonuca)</span>', D.plans.pro, lockBtn('Upgrade to Pro — Stripe checkout', true), { cls: 'current', ribbon: badge('Current', 'blue') })}</div>`;
    const ownerCards = `<div class="grid g3" style="margin-top:18px">${['Invoices', 'Payment history', 'Billing information'].map((t, i) => card({ title: t, icon: ['file', 'clock', 'card'][i], cls: 'reveal-up', body: `<div class="empty" style="padding:14px 6px"><div class="ill">${icon('info', 'lg')}</div><b style="color:var(--color-text-primary)">Stripe not connected</b><span style="font-size:13px">Stripe checkout &amp; billing is not connected in this environment. Nothing is shown rather than placeholder data.</span></div>` })).join('')}</div>`;
    return { nav: 'Subscription & Billing', html: `${pageHead({ eyebrow: `${icon('card', 'sm')} Business`, title: 'Subscription &amp; <span class="hl">Billing</span>' })}${cur}<h2 class="section-title">Upgrade</h2>${plans}<div style="margin-top:18px">${callout('info', 'Payment rails', 'Web purchases use Stripe checkout (not connected in this environment). Mobile purchases use the App Store / Google Play in-app purchase inside the Bonuca app. A subscription belongs to the business account and reads the same everywhere; cross-platform reconciliation is pending technical/legal review.')}</div>${o ? ownerCards : `<div class="lock-overlay" style="margin-top:18px">${icon('lock')}Invoices, payment history and billing information are visible to the Owner.</div>`}` };
  };

  /* ================= SETTINGS ================= */
  S.settings = ctx => {
    const o = ctx.owner, sec = ctx.opts.sec;
    const items = [['business', 'Business information', 'store', '50-'], ['address', 'Address', 'pin', '51-'], ['hours', 'Opening hours', 'clock', '52-'], ['logo', 'Logo', 'image', '53-'], ['colors', 'Brand colors', 'palette', '54-'], ...(ctx.can('team') ? [['employees', 'Employees', 'badge', '55-']] : []), ['notifications', 'Notifications', 'bell', '56-'], ...(o ? [['billing', 'Billing', 'card', '57-settings-billing']] : []), ['wallet', 'Wallet customization', 'wallet', o ? '58-' : '57-'], ['language', 'Language', 'globe', o ? '59-' : '58-']];
    const nav = `<nav class="card nav reveal-up" style="padding:10px;margin:0" aria-label="Settings">${items.map(([k, l, i, pre]) => `<a href="${ctx.link(pre)}" class="${k === sec ? 'active' : ''}">${icon(i)}${l}</a>`).join('')}</nav>`;
    const save = t => `<div><button class="btn btn-primary" data-toast="${t || 'Saved'}">${icon('check', 'sm')}Save</button></div>`;
    const [, title, ic] = items.find(x => x[0] === sec) || ['employees', 'Employees', 'badge']; // hidden from the menu when not permitted
    let body = '';
    if (sec === 'business') body = `<div class="stack"><div class="form-grid">${field({ label: 'Business Name', required: true, input: input({ value: 'Sample Business (development)' }) })}${field({ label: 'Business Category', required: true, input: select(['Café', 'Restaurant', 'Bakery', 'Retail', 'Salon', 'Fitness'], 'Café') })}</div>${save()}</div>`;
    if (sec === 'address') body = `<div class="stack"><div class="form-grid">${field({ label: 'Street', input: input({ value: 'Sample Street 1' }) })}${field({ label: 'Postal code', input: input({ value: '10115' }) })}${field({ label: 'City', input: input({ value: 'Berlin' }) })}${field({ label: 'Country / region', input: input({ value: 'DE' }) })}</div>${save()}</div>`;
    if (sec === 'hours') body = `<div class="stack"><div>${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d, i) => { const closed = i === 6; return `<div class="hours-row ${closed ? 'closed' : ''}" data-hrow><b>${d}</b><span class="row" style="gap:8px">${toggle(!closed, 'data-open-day aria-label="Open on ' + d + '"')}</span><div class="times"><input class="input" type="time" value="09:00"><span class="faint">–</span><input class="input" type="time" value="18:00"><span class="closed-tag" ${closed ? '' : 'hidden'}>Closed</span></div></div>`; }).join('')}</div>${save('Opening hours saved')}</div>`;
    if (sec === 'logo') body = `<div class="grid g2" style="align-items:start"><div class="stack">${field({ label: 'Logo', optional: true, input: upload(false) })}${save()}</div>${brandPreview()}</div>`;
    if (sec === 'colors') body = `<div class="grid" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);align-items:start">${brandFields(false)}${brandPreview()}</div>`;
    if (sec === 'employees') body = !ctx.can('team') ? `<div class="lock-overlay">${icon('lock')}Your role does not have access to this feature.</div>` : `<div class="stack">${D.team.filter(([, , r]) => r === 'Manager').map(([n, , , , m]) => optionRow(`${n} can manage employees`, 'Owner-only. Lets this Manager view the team and invite Employees.', !!m, o ? '' : 'disabled', o ? '' : `<div class="lock-note">${icon('lock', 'sm')}Your role does not have access to this feature.</div>`)).join('')}<a class="link" href="${ctx.link('39-')}">Manage team and invitations ${icon('arrowRight', 'sm')}</a></div>`;
    if (sec === 'notifications') body = null;
    if (sec === 'billing') body = `<div class="empty" style="align-items:flex-start;text-align:left;padding:4px 0"><p class="muted">Plans, invoices, payment history and billing information.</p><a class="btn btn-ghost" href="${ctx.link('49-')}">${icon('card', 'sm')}Open Subscription &amp; Billing ${icon('arrowRight', 'sm')}</a></div>`;
    if (sec === 'wallet') body = `<div class="empty" style="align-items:flex-start;text-align:left;padding:4px 0"><p class="muted">Customise and preview each program’s wallet pass.</p><a class="btn btn-ghost" href="${ctx.link('22-')}">${icon('wallet', 'sm')}Open Wallet Cards ${icon('arrowRight', 'sm')}</a></div>`;
    if (sec === 'language') body = `<div class="stack"><p class="muted">Interface language for the dashboard. Supported at launch: English, German, Turkish, French, Italian. Customer-facing content language handling is pending confirmation.</p><div class="option-row" data-preview-ok><div><b>Language</b><small>Dashboard interface language</small></div>${select(['English', 'Deutsch', 'Türkçe', 'Français', 'Italiano'], 'English', 'style="max-width:180px"')}</div><div class="option-row"><div><b>Theme</b><small>Light, dark, or follow your system</small></div>${g.SHELL_BITS.themeSeg()}</div></div>`;
    const panel = sec === 'notifications' ? `<div class="stack">${winback(ctx)}</div>` : card({ title, icon: ic, body, cls: 'reveal-up' });
    return { nav: 'Settings', title: 'Settings · ' + title, html: `${pageHead({ eyebrow: `${icon('settings', 'sm')} Settings`, title: '<span class="hl">Settings</span>', sub: 'Business details, team permissions and preferences.' })}<div class="grid" style="grid-template-columns:240px minmax(0,1fr);align-items:start"><div class="sticky">${nav}</div>${panel}</div>`, after() {
      document.querySelectorAll('[data-open-day]').forEach(t => t.onchange = () => { const r = t.closest('[data-hrow]'); r.classList.toggle('closed', !t.checked); r.querySelector('.closed-tag').hidden = t.checked; });
      brandWire();
    } };
  };
})(window);
