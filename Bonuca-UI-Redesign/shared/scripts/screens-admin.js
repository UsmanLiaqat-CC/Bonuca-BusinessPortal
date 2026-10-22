/* Notifications, Rewards, Gifts, Analytics, Branding, Subscription, Settings */
(function (g) {
  const U = g.UI, D = g.DATA, { icon, field, input, select, textarea, toggle, check, colorIn, upload, optionRow, badge, status, card, callout, pageHead, crumb, modal, tabs, ini, esc, kv } = U;
  const S = g.SCREENS = g.SCREENS || {};

  // Inline field error (red field + message); returns true when the field is valid.
  function setErr(el, msg) {
    const fd = el && el.closest('.field'); if (!fd) return !msg;
    fd.querySelectorAll(':scope > .error-msg').forEach(x => x.remove()); fd.classList.toggle('has-error', !!msg); fd.querySelectorAll(':scope > .hint').forEach(h => h.hidden = !!msg);
    if (msg) { el.setAttribute('aria-invalid', 'true'); fd.insertAdjacentHTML('beforeend', `<div class="error-msg">${icon('info', 'sm')}${esc(msg)}</div>`); } else el.removeAttribute('aria-invalid');
    return !msg;
  }
  const clearErrs = root => root.querySelectorAll('.has-error').forEach(fd => { fd.classList.remove('has-error'); fd.querySelectorAll(':scope > .error-msg').forEach(x => x.remove()); fd.querySelectorAll(':scope > .hint').forEach(h => h.hidden = false); fd.querySelectorAll('[aria-invalid]').forEach(x => x.removeAttribute('aria-invalid')); });
  const DANGER = 'style="background:var(--color-danger);color:#fff"';
  const stamp = () => `Oct 21, 2026, ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

  /* ================= NOTIFICATIONS ================= */
  // Win-back stages are saved to demo memory ('winback-stages', same shape as DATA.stages: [days, offer, message]).
  const WB_PH = 'We miss you! Visit us this week and enjoy 20% off your order.';
  const wbStages = () => g.mem.get('winback-stages', D.stages);
  const stageHtml = ([d, o, m], i) => `<div class="j-stage reveal-up" data-wb-stage><span class="j-node"><span data-wb-node>${esc(d)}</span><small>STAGE ${i + 1}</small></span><div class="j-card">${field({ label: 'Days inactive', required: true, input: `<div class="input-wrap">${icon('hourglass')}${input({ type: 'number', value: String(d), attrs: 'min="1" max="365" data-wb-days aria-label="Days inactive"' })}</div>` })}${field({ label: 'Message', required: true, input: textarea(m, WB_PH, 'rows="3" maxlength="180" data-wb-msg'), hint: 'Sent as a Wallet push notification.' })}${field({ label: 'Offer (becomes the active reward)', required: true, input: input({ value: o, attrs: 'maxlength="60" data-wb-offer' }) })}<button type="button" class="btn btn-danger-text btn-sm" style="align-self:flex-start" data-wb-remove>${icon('trash', 'sm')}Remove</button></div></div>`;
  function winback(ctx) {
    const st = wbStages(), on = g.mem.get('winback-on', true);
    const stages = `<div class="journey" style="--n:${st.length}" data-wb-list>${st.map(stageHtml).join('')}</div>`;
    const auto = card({ title: 'Win-back automation', icon: 'repeat', sub: 'Automatic drip sequence triggered by customer inactivity. Each notification also creates a matching active reward, redeemable on the customer’s next scan.', cls: 'reveal-up', body: `<div class="stack" data-wb>${optionRow('Enable win-back automation', 'Customers who stop visiting receive the offer for their stage.', on, 'data-wb-on')}${stages}<div class="row"><button type="button" class="btn btn-ghost" data-wb-add>${icon('plus', 'sm')}Add stage</button><button class="btn btn-primary" data-wb-save>${icon('check', 'sm')}Save automation</button></div></div>` });
    const t = ctx.owner ? '02:27 PM' : '02:28 PM';
    const log = card({ title: 'Automation log', icon: 'clock', sub: 'Win-back rewards created by the automation.', cls: 'reveal-up', actions: badge(D.winbackLog.length + ' entries', 'outline'), body: `<div class="stack" style="gap:6px">${callout('warn', 'Push delivery not connected', 'Rewards are created, but notifications are not delivered to customers in this environment.')}<div>${D.winbackLog.map(([s, c]) => `<div class="kv"><span class="row" style="gap:10px;color:var(--color-text-primary)">${badge('Stage ' + s, ['', 'blue', 'green', 'amber', 'red'][s])}<span>customer <span class="mono">cus_${c}</span></span></span><span class="row" style="gap:10px"><span class="faint" style="font-size:12.5px">Oct 21, 2026, ${t}</span>${badge('Not delivered', 'outline')}</span></div>`).join('')}</div></div>` });
    return auto + '<div style="height:18px"></div>' + log;
  }
  function wireWinback() {
    const root = document.querySelector('[data-wb]'); if (!root) return;
    const list = root.querySelector('[data-wb-list]'), $$ = s => [...root.querySelectorAll(s)];
    const renum = () => { $$('[data-wb-stage]').forEach((s, i) => s.querySelector('.j-node small').textContent = 'STAGE ' + (i + 1)); list.style.setProperty('--n', $$('[data-wb-stage]').length); };
    const onOff = () => { const on = root.querySelector('[data-wb-on]').checked; list.style.opacity = on ? '' : '.45'; $$('[data-wb-stage] input, [data-wb-stage] textarea, [data-wb-remove], [data-wb-add]').forEach(el => el.disabled = !on); };
    root.addEventListener('input', e => { const d = e.target.closest('[data-wb-days]'); if (d) d.closest('[data-wb-stage]').querySelector('[data-wb-node]').textContent = d.value || '—'; });
    root.addEventListener('change', e => { if (e.target.matches('[data-wb-on]')) onOff(); });
    root.addEventListener('click', e => {
      const rm = e.target.closest('[data-wb-remove]');
      if (rm) { if ($$('[data-wb-stage]').length === 1) { g.toast('Keep at least one stage.', 'info'); return; } rm.closest('[data-wb-stage]').remove(); renum(); }
      if (e.target.closest('[data-wb-add]')) { const last = $$('[data-wb-days]').reduce((m, i) => Math.max(m, parseInt(i.value, 10) || 0), 0); list.insertAdjacentHTML('beforeend', stageHtml([Math.min(365, last + 30), '', ''], 0)); renum(); list.lastElementChild.querySelector('[data-wb-msg]').focus(); }
      if (e.target.closest('[data-wb-save]')) {
        clearErrs(root); let ok = true; const seen = new Set();
        const st = $$('[data-wb-stage]').map(s => { const [d, m, o] = ['[data-wb-days]', '[data-wb-msg]', '[data-wb-offer]'].map(q => s.querySelector(q)), n = parseInt(d.value, 10);
          ok = setErr(d, !(n >= 1 && n <= 365) ? 'Enter 1–365 days.' : seen.has(n) ? 'Each stage needs a different number of days.' : '') && ok; seen.add(n);
          ok = setErr(m, m.value.trim() ? '' : 'Enter the push message.') && ok; ok = setErr(o, o.value.trim() ? '' : 'Enter the offer.') && ok;
          return [n, o.value.trim(), m.value.trim()]; });
        if (!ok) return;
        st.sort((a, b) => a[0] - b[0]); g.mem.set('winback-stages', st); g.mem.set('winback-on', root.querySelector('[data-wb-on]').checked);
        list.innerHTML = st.map(stageHtml).join(''); renum(); onOff(); g.toast('Automation saved');
      }
    });
    onOff();
  }
  g.winback = winback;

  // Manual campaigns: drafts saved to demo memory ('notif-campaigns'); the seeded Happy Hour draft is the default list.
  const CAMP_TYPES = ['Happy Hour', 'New item', 'Double Stamps', 'Birthday Reward', 'Holiday Campaign', 'Limited Offers'], AUD = ['Coffee Card', 'VIP Member', 'Rewards Club', 'Coffee Rewards'];
  const CAMP_IC = { 'Happy Hour': 'clock', 'New item': 'sparkles', 'Double Stamps': 'stamp', 'Birthday Reward': 'gift', 'Holiday Campaign': 'calendar', 'Limited Offers': 'ticket' };
  const camps = ctx => g.mem.get('notif-campaigns', null) || [{ id: 'c1', type: 'Happy Hour', title: 'Happy Hour 3–5 PM', msg: 'Double the treats this afternoon — show your card at the counter.', offer: '', dur: 'Today 3–5 PM', aud: [], upd: `Oct 19, 2026, ${ctx.owner ? '02:27' : '02:28'} PM` }];
  const campCard = c => `<section class="card hover reveal-up" style="padding:20px 22px" data-camp><div class="row between wrap" style="align-items:flex-start;gap:20px"><div class="row" style="align-items:flex-start;gap:16px;flex:1;min-width:280px"><span class="feed-ic" style="width:46px;height:46px;border-radius:15px;background:var(--color-highlight-soft);color:#9A7300">${icon(CAMP_IC[c.type] || 'bell')}</span><div><div class="row" style="gap:8px;flex-wrap:wrap"><b style="font-family:var(--font-display);font-size:18px">${esc(c.title)}</b>${badge(esc(c.type), 'outline')}${status('Draft')}</div><p class="muted" style="margin-top:4px">${esc(c.msg)}</p>${c.offer || c.dur ? `<p class="hint" style="margin-top:6px">${[c.offer && 'Offer: ' + esc(c.offer), c.dur && esc(c.dur)].filter(Boolean).join(' · ')}</p>` : ''}<p class="hint" style="margin-top:6px">${icon('users', 'sm')} ${c.aud.length ? c.aud.map(esc).join(', ') : 'Members of all active programs'}</p><p class="hint" style="margin-top:6px">${icon('calendar', 'sm')} Updated ${esc(c.upd)}</p></div></div>
      <div class="row"><div class="callout" style="padding:10px 12px;max-width:290px;background:var(--color-surface-muted)"><span class="pass-logo" style="width:28px;height:28px;font-size:14px">☕</span><div style="font-size:12.5px"><b style="font-size:12.5px">Sample Business · now</b>${esc(c.msg)}</div></div></div>
      <div class="row"><button type="button" class="btn btn-ghost btn-sm" data-camp-edit="${esc(c.id)}">${icon('edit', 'sm')}Edit</button><button class="btn btn-primary btn-sm" data-toast="Saved — sending is unavailable until push delivery is connected">${icon('send', 'sm')}Send</button></div></div></section>`;

  S.notifications = ctx => {
    const tab = ctx.opts.tab;
    let body = '';
    if (tab === 'Manual campaigns') body = `<div class="stack">${callout('info', 'Wallet push delivery not connected', 'Campaigns can be drafted and reviewed. Sending requires the push notification service, which is not available in this environment — campaigns stay drafts until delivery is confirmed.')}<div class="stack" data-camps>${camps(ctx).map(campCard).join('')}</div></div>`;
    if (tab === 'Win-back automation') body = winback(ctx);
    // E1: AI Campaigns are a client Future Feature — not in the MVP nav; the old 44 file stays (no renumbering) and only says so.
    if (tab === 'AI tools') body = `<div class="lock-overlay reveal-up" data-future>${icon('lock')}AI Campaigns are a future feature and not part of this version.</div>`;
    const nm = modal({ id: 'newCampaign', open: !!ctx.opts.modal, wide: true, title: 'New campaign', sub: 'Saved as a draft until push delivery is connected.', body: `<div class="form-grid">
      ${field({ label: 'Campaign type', required: true, input: select(CAMP_TYPES, 'Happy Hour', 'data-nc-type') })}${field({ label: 'Title', required: true, input: input({ ph: 'e.g. Happy Hour 3–5 PM', attrs: 'maxlength="60" data-nc-title' }) })}
      <div class="full">${field({ label: 'Message', required: true, input: textarea('', 'Write the push notification text…', 'maxlength="180" data-nc-msg'), hint: 'Wallet push notification text.' })}</div>
      ${field({ label: 'Offer', optional: true, input: input({ attrs: 'maxlength="60" data-nc-offer' }) })}${field({ label: 'Duration', optional: true, input: input({ ph: 'e.g. Today 3–5 PM', attrs: 'maxlength="60" data-nc-dur' }) })}
      <div class="full">${field({ label: 'Audience <span class="opt">— no selection = members of all active programs</span>', input: `<div class="choice-chips" data-multi data-nc-aud>${AUD.map(p => `<button type="button" class="chip" data-v="${p}">${icon('users', 'sm')}${p}</button>`).join('')}</div>` })}</div></div>`, foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-nc-save>Save draft</button>` });
    return { nav: 'Notifications', title: 'Notifications · ' + tab, html: `${pageHead({ eyebrow: `${icon('bell', 'sm')} Engagement`, title: '<span class="hl">Notifications</span>', sub: 'Push campaigns and win-back automation for your wallet passes.', actions: tab === 'Manual campaigns' ? `<button class="btn btn-primary" data-open="newCampaign">${icon('plus', 'sm')}New campaign</button>` : '' })}
      ${tabs([['Manual campaigns', ctx.link('41-')], ['Win-back automation', ctx.link('43-')]], tab)}${body}${tab === 'Manual campaigns' ? nm : ''}`, after() {
        wireWinback();
        const m = document.querySelector('[data-modal="newCampaign"]'); if (!m) return;
        const $ = s => m.querySelector(s); let editing = null;
        const fill = c => { editing = c ? c.id : null; clearErrs(m); $('.modal-head h3').textContent = c ? 'Edit campaign' : 'New campaign'; $('[data-nc-type]').value = c ? c.type : 'Happy Hour'; [['title', 'title'], ['msg', 'msg'], ['offer', 'offer'], ['dur', 'dur']].forEach(([k, f]) => $(`[data-nc-${k}]`).value = c ? c[f] : ''); m.querySelectorAll('[data-nc-aud] .chip').forEach(ch => ch.classList.toggle('on', !!c && c.aud.includes(ch.dataset.v))); };
        document.querySelectorAll('[data-open="newCampaign"]').forEach(b => b.addEventListener('click', () => fill(null)));
        document.querySelector('[data-camps]').addEventListener('click', e => { const b = e.target.closest('[data-camp-edit]'); if (!b) return; fill(camps(ctx).find(c => c.id === b.dataset.campEdit)); g.openModal('newCampaign'); });
        $('[data-nc-save]').onclick = () => {
          const t = $('[data-nc-title]'), ms = $('[data-nc-msg]'), ok = [setErr(t, t.value.trim() ? '' : 'Enter a title.'), setErr(ms, ms.value.trim() ? '' : 'Enter the notification message.')].every(Boolean);
          if (!ok) return;
          const L = camps(ctx), c = { id: editing || 'c' + Date.now(), type: $('[data-nc-type]').value, title: t.value.trim(), msg: ms.value.trim(), offer: $('[data-nc-offer]').value.trim(), dur: $('[data-nc-dur]').value.trim(), aud: [...m.querySelectorAll('[data-nc-aud] .chip.on')].map(ch => ch.dataset.v), upd: stamp() };
          const i = L.findIndex(x => x.id === c.id); if (i >= 0) L.splice(i, 1); L.unshift(c); g.mem.set('notif-campaigns', L);
          document.querySelector('[data-camps]').innerHTML = L.map(campCard).join(''); m.hidden = true; g.toast(editing ? 'Draft updated' : 'Draft saved');
        };
      } };
  };

  /* ================= REWARDS ================= */
  S.rewards = ctx => {
    // Gifts are rewards too (client statuses Scheduled · Available · Redeemed · Expired · Cancelled); a gift just assigned arrives via ?new=.
    const giftRows = g.GIFTS.all(ctx).map(x => [x.name, x.customer, 'Gift · ' + g.GIFTS.srcLabel(x), x.status, x.created, x.exp, x.fresh, x]);
    const all = [...giftRows, ...D.rewards], PER = 20, n = s => all.filter(r => r[3] === s).length;
    const counts = Object.fromEntries(['All', 'Scheduled', 'Available', 'Redeemed', 'Pending', 'Expired', 'Cancelled'].map(k => [k, k === 'All' ? all.length : n(k)]));
    const srcIc = s => s.startsWith('Gift') ? ['gift', 'rgba(190,24,93,.12)', '#BE185D'] : s.startsWith('Win') ? ['repeat', 'var(--color-highlight-soft)', '#9A7300'] : s.startsWith('Points') ? ['coins', 'var(--color-accent-soft)', 'var(--color-accent)'] : s.startsWith('Voucher') ? ['ticket', 'rgba(124,58,237,.12)', '#7C3AED'] : ['stamp', 'var(--color-mint-soft)', '#13845B'];
    return { nav: 'Rewards', html: `${pageHead({ eyebrow: `${icon('gift', 'sm')} Engagement`, title: '<span class="hl">Rewards</span>', sub: 'Every reward issued to customers — from stamp cards, points, vouchers, win-back automation and gifts.' })}
      ${tabs([['Rewards', ctx.link('45-')], ['Gifts', ctx.link('46-')]], 'Rewards')}
      <div class="grid g4" style="margin-bottom:18px">${[['Available', 'gift'], ['Redeemed', 'checkCircle'], ['Pending', 'hourglass'], ['Expired', 'clock']].map(([l, i]) => `<div class="card hover stat reveal-up"><div class="lbl">${l}<span class="ico">${icon(i, 'sm')}</span></div><div class="val" data-count="${counts[l]}">${counts[l]}</div><div class="stat bar" style="padding:0;margin-top:10px"><i style="--w:${Math.round(counts[l] / all.length * 100)}%"></i></div></div>`).join('')}</div>
      <section class="card reveal-up" style="overflow:hidden"><div class="toolbar">${tabs(Object.entries(counts).map(([k, v]) => [k, null, v]), 'All', 'data-rtabs style="margin:0"')}<span class="hint" data-rinfo></span></div>
      <div class="table-wrap"><table class="t"><thead><tr><th>Reward</th><th>Customer</th><th>Source</th><th>State</th><th>Issued</th><th>Expires</th></tr></thead><tbody data-rrows></tbody></table></div><div class="pager"><span data-rp></span><div class="pg" data-rpg></div></div></section>${modal({ id: 'rewardDetail', open: false, wide: true, title: 'Reward details', body: '<div data-rd-body></div>', foot: `<button class="btn btn-ghost" data-close>Close</button><a class="btn btn-ghost" data-rd-gifts hidden href="${ctx.link('46-')}">${icon('gift', 'sm')}Open in Gifts</a>` })}`, after() {
        let f = 'All', page = 1, shown = []; const draw = () => {
          const list = all.filter(r => f === 'All' || r[3] === f), pages = Math.max(1, Math.ceil(list.length / PER)); page = Math.min(page, pages);
          shown = list.slice((page - 1) * PER, page * PER);
          document.querySelector('[data-rrows]').innerHTML = shown.map((r, i) => { const [a, b, c] = srcIc(r[2]); return `<tr class="clickable" data-r="${i}" ${r[6] ? 'data-fresh style="background:var(--color-mint-soft)"' : `style="animation:fadeUp .4s ${i * 15}ms both"`}><td><b style="font-weight:600">${esc(r[0])}</b></td><td><div class="person" style="font-weight:500">${ini(r[1])}${esc(r[1])}</div></td><td><span class="row" style="gap:8px"><span class="feed-ic" style="width:26px;height:26px;border-radius:8px;background:${b};color:${c}">${icon(a, 'sm')}</span><span class="muted">${esc(r[2])}</span></span></td><td>${status(r[3])}</td><td class="muted">${r[4]}</td><td class="${r[5] === '—' ? 'faint' : 'muted'}">${r[5]}</td></tr>`; }).join('') || `<tr><td colspan="6"><div class="empty"><div class="ill">${icon('gift', 'lg')}</div><b style="color:var(--color-text-primary)">No ${f.toLowerCase()} rewards</b></div></td></tr>`;
          document.querySelector('[data-rinfo]').textContent = `${list.length} rewards`; document.querySelector('[data-rp]').textContent = `Page ${page} of ${pages}`;
          document.querySelector('[data-rpg]').innerHTML = Array.from({ length: pages }, (_, i) => `<button data-p="${i + 1}" class="${i + 1 === page ? 'on' : ''}">${i + 1}</button>`).join('');
        };
        document.querySelector('[data-rtabs]').addEventListener('tab', e => { f = e.detail; page = 1; draw(); });
        document.querySelector('[data-rrows]').addEventListener('click', e => { const tr = e.target.closest('[data-r]'); if (!tr) return; const r = shown[+tr.dataset.r];
          document.querySelector('[data-rd-body]').innerHTML = r[7] ? g.GIFTS.giftKv(r[7]) : kv([['Reward', esc(r[0]), true], ['Customer', esc(r[1])], ['Source', esc(r[2])], ['State', status(r[3])], ['Issued', r[4]], ['Expires', r[5]]]);
          document.querySelector('[data-rd-gifts]').hidden = !r[7]; g.openModal('rewardDetail'); });
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
  // Client currencies (points programs); the stamp / points presets name the program that receives them.
  const CURS = ['EUR', 'USD', 'GBP', 'CZK', 'TRY', 'CHF', 'PLN'], PT_PROG = () => D.programs.find(p => p.kind === 'points' && p.status === 'Active');
  const giftProgs = key => D.programs.filter(p => p.status === 'Active' && p.kind === ({ stamp: 'stamp', points: 'points' }[key]));
  function readGift(q) {
    const key = q.get('gift') || ''; if (!Object.hasOwn(PRESETS, key)) return null;
    const on = iso(q.get('on')) || TODAY, exp = iso(q.get('exp')), min = parseFloat(q.get('min')), prog = giftProgs(key).find(p => p.id === q.get('pg'));
    return { key, name: safe(q.get('n'), 40) || (key === 'custom' ? 'Custom gift' : PRESETS[key][0]), desc: safe(q.get('d'), 120), terms: safe(q.get('tc'), 120), on, exp,
      opts: { multi: q.get('m') === '1', min: min > 0 && min < 1e6 ? Math.round(min * 100) / 100 : null, cur: CURS.includes(q.get('cur')) ? q.get('cur') : 'EUR', locs: D.locations, combine: q.get('cb') === '1', product: safe(q.get('pr'), 40) || null, prog: prog ? prog.id : null } };
  }
  // Re-serialises a validated gift (never the raw query) for links to other screens.
  const giftQuery = r => { const p = new URLSearchParams({ gift: r.key, n: r.name, on: r.on }); [['d', r.desc], ['tc', r.terms], ['exp', r.exp], ['m', r.opts.multi && '1'], ['min', r.opts.min], ['cur', r.opts.min && r.opts.cur], ['cb', r.opts.combine && '1'], ['pr', r.opts.product], ['pg', r.opts.prog]].forEach(([k, v]) => v && p.set(k, v)); return p.toString(); };
  // The gift(s) just assigned (?new=gift from a customer profile · ?new=group from the group screen).
  function freshGifts(ctx) {
    const q = new URLSearchParams(location.search), kind = q.get('new'), r = readGift(q); if (!r || !['gift', 'group'].includes(kind)) return [];
    const base = { name: r.name, desc: r.desc, terms: r.terms, src: kind === 'gift' ? 'Manual' : 'Group', by: me(ctx), created: fmtDate(TODAY), on: fmtDate(r.on), exp: r.exp ? fmtDate(r.exp) : '—', status: r.on > TODAY ? 'Scheduled' : 'Available', red: null, opts: r.opts, fresh: true, query: giftQuery(r) };
    // The customer whose profile was open: ?c= (scanner key, e.g. kemal) or a customer ID; Anna Schmidt by default.
    if (kind === 'gift') { const c = q.get('c') || '', ws = Object.hasOwn(D.winbackScans, c) ? D.winbackScans[c] : null, cu = [...g.mem.get('customers-added', []), ...D.customers].find(x => x.id === (ws ? ws[1] : c)) || D.customers.find(x => x.id === 'C-10001') || { id: 'C-10001', name: 'Anna Schmidt' };
      return [{ ...base, id: 'new', cid: cu.id, customer: ws ? ws[0] : cu.name, query: `${giftQuery(r)}${c && cu.id !== 'C-10001' ? '&c=' + encodeURIComponent(ws ? c : cu.id) : ''}` }]; }
    const t = q.get('t'); if (!TARGETS.some(([k]) => k === t)) return [];
    const x = targetX(t, q.get('x')), target = targetLabel(t, x);
    return recipients(t, x).map((c, i) => ({ ...base, id: 'new' + i, cid: c.id, customer: c.name, target, query: `${giftQuery(r)}&t=${t}&x=${encodeURIComponent(x)}` }));
  }
  const byId = id => { const m = Object.fromEntries(D.gifts.map(x => [x.id, x])); return Object.hasOwn(m, id || '') ? m[id] : null; };
  const all = ctx => [...freshGifts(ctx), ...D.gifts];
  const optRows = gf => [...(gf.opts.prog ? [['Program', esc(D.programs.find(p => p.id === gf.opts.prog).name)]] : []), ['Redemption', gf.opts.multi ? 'Multiple' : 'Single'], ['Minimum purchase amount', gf.opts.min ? gf.opts.min.toFixed(2) + ' ' + (gf.opts.cur || 'EUR') : 'None'], ['Valid locations', gf.opts.locs.map(esc).join(', ')], ['Combinable with other discounts', gf.opts.combine ? 'Yes' : 'No'], ['Product or category', gf.opts.product ? esc(gf.opts.product) : 'Any']];
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
        <div class="full" data-gf-prog-wrap ${giftProgs(k).length ? '' : 'hidden'}>${field({ label: 'Program', required: true, input: `<select class="select" data-gf-prog aria-label="Program">${giftProgs(k).map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>`, hint: 'The program card that receives the stamp or points.' })}</div>
        ${o.rule ? field({ label: 'Expiration', required: true, input: `<div class="row" style="gap:10px">${input({ type: 'number', value: '30', attrs: 'min="1" style="width:100px" aria-label="Valid for days" data-gf-days' })}<span class="muted">days after the gift is assigned</span></div>`, cls: 'full' })
          : field({ label: 'Activation date', required: true, input: input({ type: 'date', value: TODAY, attrs: 'data-gf-on' }), hint: 'A later date keeps the gift Scheduled until then.' }) + field({ label: 'Expiration date', required: true, input: input({ type: 'date', value: '2026-11-30', attrs: 'data-gf-exp' }) })}
        ${field({ label: 'Description', optional: true, input: textarea(d, 'Shown to the customer', 'maxlength="120" data-gf-desc'), cls: 'full' })}
        ${field({ label: 'Terms and conditions', optional: true, input: textarea(TERMS, '', 'maxlength="120" data-gf-terms'), cls: 'full' })}</div>
      <div class="label">Redemption rules</div>
      <div class="option-row"><div><b>Redemption</b><small>A gift is normally redeemable once.</small></div><div class="seg" data-gf-multi><button type="button" class="on" data-v="single">Single</button><button type="button" data-v="multiple">Multiple</button></div></div>
      <div class="form-grid">${field({ label: 'Minimum purchase amount', optional: true, input: `<div class="row" style="gap:8px;flex-wrap:nowrap">${input({ type: 'number', ph: 'e.g. 10.00', attrs: 'min="0" step="0.01" data-gf-min' })}${select(CURS, (PT_PROG() && PT_PROG().cfg.currency) || 'EUR', 'data-gf-cur aria-label="Currency" style="width:96px;flex:none"')}</div>`, hint: 'In your points program currency by default.' })}
        ${field({ label: 'Valid locations', required: true, input: `<div class="stack" style="gap:8px">${D.locations.map(l => U.check(esc(l), true, 'data-gf-loc')).join('')}</div>` })}</div>
      ${optionRow('Combinable with other discounts', 'Allow this gift together with other discounts or rewards.', false, 'data-gf-combine')}
      ${optionRow('Specific product or category only', 'Limit the gift to one product or category.', false, 'data-gf-prod-on data-reveal="[data-gf-prod]"')}
      <div data-gf-prod hidden>${field({ label: 'Product or category', required: true, input: input({ ph: 'e.g. Cakes', attrs: 'maxlength="40" data-gf-prod-in' }) })}</div>
      <div class="label">Customer notification <span class="opt">— simulated preview</span></div>
      <div class="row wrap" style="gap:14px;align-items:stretch"><div class="callout" style="padding:10px 12px;max-width:320px;background:var(--color-surface-muted)"><span class="pass-logo" style="width:28px;height:28px;font-size:14px">☕</span><div style="font-size:12.5px"><b style="font-size:12.5px">Sample Business · push / email</b><span data-gf-note></span></div></div>
        <div class="pass" style="padding:14px;min-width:220px;max-width:260px"><div class="pass-top"><div class="pass-logo" style="width:28px;height:28px;font-size:13px">☕</div><div class="pass-name">Wallet pass · gift line</div></div><div class="pass-lbl">Gift</div><div class="pass-val sm" data-gf-pass></div></div></div>
      ${notifyNote()}</div>`;
  }
  function wireGiftForm(root) {
    const $ = s => root.querySelector(s);
    const prev = () => { const n = $('[data-gf-name]').value.trim() || 'Your gift', d = $('[data-gf-desc]').value.trim(); $('[data-gf-note]').textContent = `You have received a gift from Sample Business: ${n}.${d ? ' ' + d : ''}`; $('[data-gf-pass]').textContent = n; };
    const progs = () => { const key = $('[data-gf-preset] .chip.on').dataset.key, ps = giftProgs(key), sel = $('[data-gf-prog]'); $('[data-gf-prog-wrap]').hidden = !ps.length; sel.innerHTML = ps.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join(''); progCur(); };
    const progCur = () => { const p = D.programs.find(x => x.id === $('[data-gf-prog]').value); if (p && p.cfg && p.cfg.currency) $('[data-gf-cur]').value = p.cfg.currency; };
    $('[data-gf-preset]').addEventListener('click', e => { const c = e.target.closest('.chip'); if (!c || c.matches('[data-preview-lock]')) return; const [n, d] = PRESETS[c.dataset.key]; $('[data-gf-name]').value = c.dataset.key === 'custom' ? '' : n; $('[data-gf-desc]').value = d; if (c.dataset.key === 'custom') $('[data-gf-name]').focus(); setTimeout(() => { progs(); prev(); }); });
    $('[data-gf-prog]').addEventListener('change', () => { const p = D.programs.find(x => x.id === $('[data-gf-prog]').value); if (p) $('[data-gf-desc]').value = $('[data-gf-desc]').value.replace(/your .+ card\./i, `your ${p.name} card.`); progCur(); prev(); });
    root.addEventListener('input', e => { if (e.target.matches('[data-gf-name], [data-gf-desc]')) prev(); });
    prev();
    // Returns the URL params for the gift, or null (with the problem shown inline + in a toast) when the form is incomplete.
    return () => {
      clearErrs(root);
      const bad = (el, msg) => { setErr(el, msg); g.toast(msg, 'info'); return null; };
      const p = new URLSearchParams(), name = $('[data-gf-name]').value.trim(), pr = $('[data-gf-prod-in]').value.trim();
      if (!name) return bad($('[data-gf-name]'), 'Enter a gift name.');
      if (!safe(name, 40)) return bad($('[data-gf-name]'), 'Use letters, numbers and simple punctuation in the gift name.');
      p.set('gift', $('[data-gf-preset] .chip.on').dataset.key); p.set('n', name);
      const oc = new URLSearchParams(location.search).get('c'); if (oc && Object.hasOwn(D.winbackScans, oc)) p.set('c', oc); // keep the open customer profile
      if (!$('[data-gf-prog-wrap]').hidden) { if (!$('[data-gf-prog]').value) return bad($('[data-gf-prog]'), 'Choose the program.'); p.set('pg', $('[data-gf-prog]').value); }
      for (const [k, s] of [['d', '[data-gf-desc]'], ['tc', '[data-gf-terms]']]) { const raw = $(s).value.trim(), v = safe(raw, 120); if (raw && !v) return bad($(s), 'Use letters, numbers and simple punctuation (one line, up to 120 characters).'); v && p.set(k, v); }
      const days = $('[data-gf-days]'); if (days && !(parseInt(days.value, 10) > 0)) return bad(days, 'Enter how many days the gift stays valid.');
      const on = $('[data-gf-on]'), exp = $('[data-gf-exp]');
      if (on) { if (!iso(on.value)) return bad(on, 'Choose an activation date.'); if (!iso(exp.value)) return bad(exp, 'Choose an expiration date.'); if (exp.value <= on.value) return bad(exp, 'The expiration date must be after the activation date.'); if (exp.value < TODAY) return bad(exp, 'The expiration date is in the past — choose today or a later date.'); p.set('on', on.value); p.set('exp', exp.value); }
      if (!root.querySelector('[data-gf-loc]:checked')) return bad($('[data-gf-loc]'), 'Choose at least one location.');
      if ($('[data-gf-multi] .on').dataset.v === 'multiple') p.set('m', '1');
      const minEl = $('[data-gf-min]'), min = parseFloat(minEl.value); if (minEl.value.trim() && !(min >= 0 && min < 1e6)) return bad(minEl, 'Enter a valid minimum purchase amount.'); if (min > 0) { p.set('min', String(min)); p.set('cur', $('[data-gf-cur]').value); }
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
    const det = modal({ id: 'giftDetail', open: false, wide: true, title: 'Gift details', body: '<div data-gd-body></div>', foot: `<button class="btn btn-ghost" data-close>Close</button><button class="btn btn-danger-text" data-gd-cancel>${icon('x', 'sm')}Cancel gift</button>` })
      + modal({ id: 'giftCancel', open: false, title: 'Cancel this gift?', body: `<p class="muted" data-gc-text></p>`, foot: `<button class="btn btn-ghost" data-close>Keep gift</button><button class="btn btn-danger" ${DANGER} data-gd-confirm>${icon('x', 'sm')}Cancel gift</button>` });
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
        cancel.addEventListener('click', () => { if (!open || !['Scheduled', 'Available'].includes(open.status)) return; document.querySelector('[data-gc-text]').textContent = `${open.name} for ${open.customer} can no longer be redeemed. The cancellation is recorded in the activity log.`; g.openModal('giftCancel'); });
        document.querySelector('[data-gd-confirm]').addEventListener('click', () => {
          document.querySelector('[data-modal="giftCancel"]').hidden = true;
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
        // Editing a group's value (visits, days, tier) selects that group, so the gift never goes to the previously selected one.
        const pick = e => { const c = e.target.matches('input, select') && e.target.closest('.type-card'); if (c && c.dataset.select !== t) { tg.querySelectorAll('.type-card').forEach(x => x.classList.toggle('on', x === c)); t = c.dataset.select; } upd(); };
        tg.addEventListener('typechange', e => { t = e.detail; upd(); }); ['input', 'change', 'focusin'].forEach(ev => tg.addEventListener(ev, pick));
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
  // Rules (with every gift setting) are saved to demo memory ('gift-rules'); seeded rules use the form defaults.
  const presetOf = name => Object.values(PRESETS).find(([n]) => n === name) || ['', ''];
  const rules = () => g.mem.get('gift-rules', null) || D.giftRules.map(([t, v, gift, on]) => ({ t, v, gift, on, days: 30, desc: presetOf(gift)[1], terms: TERMS, multi: false, min: null, cur: 'EUR', combine: false, product: null, prog: null }));
  const ruleSum = r => [`valid ${r.days} days`, `${r.multi ? 'multiple' : 'single'} redemption`, r.min && `min. ${r.min.toFixed(2)} ${r.cur}`, r.combine && 'combinable', r.product && esc(r.product)].filter(Boolean).join(' · ');
  const ruleRow = (r, i) => `<div class="option-row" style="cursor:pointer" data-rule="${i}" title="Show rule details"><div><b>${esc(ruleText(r.t, r.v))}</b><small>${icon('gift', 'sm')} ${esc(r.gift)} · ${ruleSum(r)}</small></div>${toggle(r.on, `aria-label="${esc(ruleText(r.t, r.v))} active" data-rule-on="${i}"`)}</div>`;
  const ruleKv = r => kv([['Condition', esc(ruleText(r.t, r.v)), true], ['Gift', esc(r.gift)], ['Description', esc(r.desc) || '—'], ['Terms and conditions', esc(r.terms) || '—'], ['Expiration', `${r.days} days after the gift is assigned`], ...optRows({ opts: { ...r, locs: D.locations } }), ['Status', r.on ? badge('Active', 'green') : badge('Paused', 'outline')]]);
  S.giftRules = ctx => {
    const val = { visit: `<div class="row" style="gap:8px"><span class="muted">After visit number</span>${input({ type: 'number', value: '5', attrs: 'min="1" style="width:90px" aria-label="Visit number" data-rv-in="visit"' })}</div>`, days: `<div class="row" style="gap:8px">${input({ type: 'number', value: '30', attrs: 'min="1" style="width:90px" aria-label="Days without a visit" data-rv-in="days"' })}<span class="muted">days without a visit</span></div>`,
      tier: select(TIER_NAMES().slice(1), 'Gold', 'aria-label="Tier" data-rv-in="tier"'), spend: `<div class="row" style="gap:8px">${input({ type: 'number', value: '200', attrs: 'min="1" style="width:110px" aria-label="Spending amount" data-rv-in="spend"' })}${select(['EUR', 'USD', 'GBP', 'CZK', 'TRY', 'CHF', 'PLN'], 'EUR', 'aria-label="Currency" data-rv-cur style="width:110px"')}</div>`,
      pts: `<div class="row" style="gap:8px">${input({ type: 'number', value: '500', attrs: 'min="1" style="width:110px" aria-label="Points or stamps" data-rv-in="pts"' })}${select(['points · Coffee Rewards', 'stamps · Coffee Card'], 'points · Coffee Rewards', 'aria-label="Points or stamps" data-rv-unit')}</div>` };
    const form = card({ title: 'New rule', icon: 'plus', cls: 'reveal-up', body: `<div class="stack">${field({ label: 'Condition', required: true, input: select(RULES.map(([t]) => t), 'After the Xth visit', 'data-rule-t') })}
      ${Object.entries(val).map(([k, h]) => `<div class="field" data-rv="${k}" ${k === 'visit' ? '' : 'hidden'}>${h}</div>`).join('')}
      <div style="border-top:1px dashed var(--color-border-strong);padding-top:16px">${giftForm({ rule: true })}</div></div>`, foot: `<button class="btn btn-primary" data-rule-save>${icon('check', 'sm')}Save rule</button>` });
    const R = rules(), det = modal({ id: 'ruleDetail', open: false, wide: true, title: 'Rule details', body: '<div data-rd-body></div>', foot: '<button class="btn btn-ghost" data-close>Close</button>' });
    return { nav: 'Rewards', title: 'Automatic gift rules', html: `${pageHead({ eyebrow: crumb('Rewards', ctx.link('45-')) + crumb('Gifts', ctx.link('46-')) + 'Automatic rules', title: 'Automatic <span class="hl">gift rules</span>', sub: 'A gift is assigned automatically when a customer meets the condition. Customers are not told about the rule in advance.' })}
      <div class="layout-preview"><div class="stack">${form}</div><div class="sticky">${card({ title: 'Rules', icon: 'zap', actions: badge(`<span data-rules-n>${R.length}</span> rules`, 'outline'), cls: 'reveal-up', body: `<div class="stack" style="gap:10px" data-rules>${R.map(ruleRow).join('')}</div>` })}</div></div>${det}`, after() {
        const read = wireGiftForm(document.querySelector('[data-gift-form]')), ts = document.querySelector('[data-rule-t]'), list = document.querySelector('[data-rules]');
        const kind = () => RULES.find(([t]) => t === ts.value)[1];
        const draw = L => { g.mem.set('gift-rules', L); list.innerHTML = L.map(ruleRow).join(''); document.querySelector('[data-rules-n]').textContent = L.length; };
        ts.onchange = () => document.querySelectorAll('[data-rv]').forEach(d => d.hidden = d.dataset.rv !== kind());
        list.addEventListener('change', e => { const t = e.target.closest('[data-rule-on]'); if (!t) return; const L = rules(), r = L[+t.dataset.ruleOn]; r.on = t.checked; g.mem.set('gift-rules', L); g.toast(r.on ? 'Rule active' : 'Rule paused'); });
        list.addEventListener('click', e => { const row = e.target.closest('[data-rule]'); if (!row || e.target.closest('.toggle')) return; document.querySelector('[data-rd-body]').innerHTML = ruleKv(rules()[+row.dataset.rule]); g.openModal('ruleDetail'); });
        document.querySelector('[data-rule-save]').onclick = () => {
          const k = kind(), el = k && document.querySelector(`[data-rv-in="${k}"]`); let v = el ? el.value.trim() : '';
          document.querySelectorAll('[data-rv]').forEach(d => setErr(d.querySelector('input, select'), ''));
          if (el && el.type === 'number' && !(parseFloat(v) > 0)) { setErr(el, 'Enter a value for the condition.'); g.toast('Enter a value for the condition.', 'info'); return; }
          if (k === 'spend') v += ' ' + document.querySelector('[data-rv-cur]').value;
          if (k === 'pts') v += ' ' + document.querySelector('[data-rv-unit]').value.split(' · ')[0];
          const p = read(); if (!p) return;
          const min = parseFloat(p.get('min')) || null;
          draw([{ t: ts.value, v, gift: p.get('n'), on: true, days: parseInt(document.querySelector('[data-gf-days]').value, 10), desc: p.get('d') || '', terms: p.get('tc') || '', multi: p.get('m') === '1', min, cur: p.get('cur') || 'EUR', combine: p.get('cb') === '1', product: p.get('pr'), prog: p.get('pg') }, ...rules()]);
          g.toast('Rule saved');
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
    // Heatmap levels come from the same scans as "Most active days" (day share × opening-hours profile), so the busiest day agrees everywhere.
    const PROF = [1.5, 2.2, 3.4, 4, 3.6, 2.4, 2, 2.2, 3, 3.2, 2.6, 1.4], top = Math.max(...A.dayVals);
    const heat = (d, h) => h < 9 || h > 20 ? 0 : Math.min(4, Math.max(1, Math.floor(PROF[h - 9] * A.dayVals[d] / top + .3)));
    const shades = ['var(--color-surface-sunken)', '#C9D5FF', '#94ADFF', '#5B80FF', '#1747F8'];
    const hm = U.chartTableToggle('heat', `<div class="heat"><span></span>${Array.from({ length: 24 }, (_, h) => `<span class="lb" style="text-align:center">${h % 3 === 0 ? h : ''}</span>`).join('')}${A.days.map((d, di) => `<span class="lb">${d}</span>${Array.from({ length: 24 }, (_, h) => { const v = heat(di, h); return `<span class="c" title="${d} ${h}:00 — level ${v}" style="background:${shades[v]};animation-delay:${(di * 24 + h) * 4}ms"></span>`; }).join('')}`).join('')}</div><div class="heat-legend">Fewer ${shades.map(s => `<i style="background:${s}"></i>`).join('')} More</div>`, A.days.map((d, di) => [d, Array.from({ length: 24 }, (_, h) => heat(di, h)).reduce((a, b) => a + b, 0)]), ['Day', 'Activity index']);
    const topM = `<div>${A.top.map(([n, v], i) => `<div class="list-row"><div class="row">${i < 3 ? `<span class="medal ${['', 's', 'b'][i]}">${i + 1}</span>` : `<span class="medal" style="background:var(--color-surface-sunken);color:var(--color-text-secondary);box-shadow:none">${i + 1}</span>`}${ini(n)}<b style="font-weight:600">${n}</b></div><div class="row" style="gap:14px;flex:1;max-width:340px"><div class="mini-prog" style="flex:1;margin:0"><i style="--w:${v / 18 * 100}%"></i></div><b style="min-width:70px;text-align:right">${v} visits</b></div></div>`).join('')}</div>`;
    // AI commentary (client: Pro-plan exclusive) — plain words from the same heatmap data. Locked without Pro: Preview Mode or ?plan=free.
    const hr = h => `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`, day = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], win = (d, h) => heat(d, h) + heat(d, h + 1) + heat(d, h + 2);
    // Busiest 3-hour window; ties go to the day with more scans. Quietest morning likewise.
    let hi = [0, 9]; A.days.forEach((_, d) => { for (let h = 9; h <= 18; h++) if (win(d, h) > win(...hi) || (win(d, h) === win(...hi) && A.dayVals[d] > A.dayVals[hi[0]])) hi = [d, h]; });
    let lo = 0; A.days.forEach((_, d) => { if (win(d, 9) < win(lo, 9) || (win(d, 9) === win(lo, 9) && A.dayVals[d] < A.dayVals[lo])) lo = d; });
    // Client: AI commentary is Pro-only; the Free Trial unlocks Pro features. Free / Business plans and Preview Mode see the lock.
    const pro = !ctx.state.preview && ['pro', 'trial'].includes(ctx.state.plan);
    const ai = pro ? `<div class="stack" style="gap:12px" data-ai-commentary><p>Most scans happen between ${hr(hi[1])} and ${hr(hi[1] + 3)} on ${day[hi[0]]}s. This could be a good time to send a special offer.</p><p class="muted">${day[lo]} mornings have the lowest activity.</p></div>`
      : `<div class="lock-overlay" data-ai-locked>${icon('lock')}AI commentary is available on the Pro plan.${ctx.can('billing') ? ` <a class="link" data-preview-ok href="${ctx.link('49-')}">View plans ${icon('arrowRight', 'sm')}</a>` : ''}</div>`;
    return { nav: 'Analytics', html: `${pageHead({ eyebrow: `${icon('chart', 'sm')} Insights`, title: '<span class="hl">Analytics</span>', sub: 'Last 30 days.' })}
      <div class="grid g5">${sc}</div>
      <div class="grid g2" style="margin-top:18px">${card({ title: 'Most active days', icon: 'calendar', actions: days.seg, body: days.body, cls: 'reveal-up' })}${card({ title: 'Growth', icon: 'arrowUpRight', sub: `New members per week · ${badge('+150% vs previous 30 days', 'green')}`, actions: grw.seg, body: grw.body, cls: 'reveal-up' })}</div>
      <div class="grid" style="grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);margin-top:18px;align-items:start">${card({ title: 'Activity heatmap', icon: 'flame', sub: 'Scans by weekday and hour', actions: hm.seg, body: hm.body, cls: 'reveal-up' })}
        <section class="card ai-card reveal-up"><header class="card-head split"><div><div class="card-title"><span class="ic spark">${icon('sparkles')}</span>AI commentary</div><div class="card-sub">Plain-language explanation of the pattern with a suggested action.</div></div>${badge((pro ? '' : icon('lock', 'sm')) + 'Pro', pro ? 'blue' : 'outline')}</header><div class="card-body">${ai}</div></section></div>
      <div style="margin-top:18px">${card({ title: 'Top members', icon: 'trophy', sub: 'Most visits in the last 30 days', body: null, cls: 'reveal-up' }).replace('</section>', topM + '</section>')}</div>` };
  };

  /* ================= BRANDING ================= */
  // Demo memory 'branding' = { color: Primary, accent: Secondary (wallet pass background), bg: Background, font, logo: PNG data URL }.
  const HEX = /^#[0-9a-f]{6}$/i, FONTS = { System: '', Inter: "'Inter', system-ui, sans-serif", Serif: "Georgia, 'Times New Roman', serif", Rounded: "ui-rounded, 'SF Pro Rounded', 'Nunito', system-ui, sans-serif" };
  const okLogo = v => typeof v === 'string' && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(v) && v.length < 400000 ? v : null;
  const brand = () => { const b = g.mem.get('branding', {}) || {}; return { color: HEX.test(b.color) ? b.color : '#1747F8', accent: HEX.test(b.accent) ? b.accent : '#0A112F', bg: HEX.test(b.bg) ? b.bg : '#FBFBFB', font: Object.hasOwn(FONTS, b.font || '') ? b.font : 'System', logo: okLogo(b.logo) }; };
  const logoImg = src => `<img src="${esc(src)}" alt="Logo" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">`;
  const brandPreview = () => { const B = brand();
    return `<div class="reveal" data-brand-preview style="--bp-p:${B.color};--bp-s:${B.accent};--bp-bg:${B.bg};${FONTS[B.font] ? `--bp-font:${FONTS[B.font]};` : ''}background:var(--bp-bg,#FBFBFB);color:#0A0A0A;padding:20px"><div class="eyebrow" style="color:#8D9098">${icon('eye', 'sm')} Customer-facing preview</div><div class="row" style="margin:10px 0 16px"><span class="avatar" data-bp-logo style="background:var(--bp-p,#1747F8);overflow:hidden">${B.logo ? logoImg(B.logo) : 'S'}</span><b style="font-family:var(--bp-font,var(--font-display));font-size:17px">Sample Business (development)</b></div><button type="button" class="btn" data-preview-ok tabindex="-1" style="background:var(--bp-p,#1747F8);color:#fff;font-family:var(--bp-font,inherit);pointer-events:none">Sample button</button><div class="pass" style="--bgp:linear-gradient(150deg,var(--bp-s,#0A112F),#000);margin-top:16px;padding:14px"><div class="pass-top"><div class="pass-logo" data-bp-logo style="width:28px;height:28px;font-size:13px;background:var(--bp-p,#1747F8);color:#fff;overflow:hidden">${B.logo ? logoImg(B.logo) : 'S'}</div><div class="pass-name">Sample Business</div></div><div class="pass-lbl">Reward</div><div class="pass-val sm">1 Free Coffee</div></div><p style="font-size:12.5px;color:#5B5E66;margin-top:12px">Preview of your business colours on customer-facing surfaces.</p></div>`; };
  const logoField = () => { const B = brand(); return field({ label: 'Logo', optional: true, input: upload(!!B.logo, false, '<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden data-logo-in aria-label="Logo file">').replace(/<div class="tile([^"]*)">[\s\S]*?<\/div>/, `<div class="tile$1" data-logo-tile>${B.logo ? logoImg(B.logo) : icon('image', 'lg')}</div>`).replace('<button class="btn btn-ghost btn-sm">', '<button type="button" class="btn btn-ghost btn-sm" data-logo-btn>'), hint: 'PNG, JPG, WebP or SVG — shown on your wallet passes and customer-facing pages.' }); };
  const colorF = (label, k, v) => field({ label, input: colorIn(v).replace('data-color', `data-color maxlength="7" data-bp="${k}" aria-label="${label}"`) });
  const brandFields = (withLogo, withColors, saveMsg = 'Branding saved') => { const B = brand();
    return `<div class="stack">${withLogo ? logoField() : ''}${withColors ? `<div class="grid g3">${colorF('Primary Color', 'p', B.color)}${colorF('Secondary Color', 's', B.accent)}${colorF('Background', 'bg', B.bg)}</div>${field({ label: 'Font', input: select(Object.keys(FONTS), B.font, 'data-bp-font aria-label="Font"'), hint: 'Used on your customer-facing pages. Apple and Google Wallet passes always use the wallet app’s own font.' })}` : ''}<div><button class="btn btn-primary" data-brand-save="${saveMsg}">${icon('check', 'sm')}Save</button></div></div>`; };
  function brandWire() {
    const pv = document.querySelector('[data-brand-preview]'), save = document.querySelector('[data-brand-save]'); if (!pv || !save) return;
    let logo = brand().logo;
    const setLogo = src => { logo = src; document.querySelectorAll('[data-bp-logo]').forEach(el => el.innerHTML = src ? logoImg(src) : 'S'); const t = document.querySelector('[data-logo-tile]'); if (t) { t.classList.toggle('filled', !!src); t.innerHTML = src ? logoImg(src) : icon('image', 'lg'); } const b = document.querySelector('[data-logo-btn]'); if (b) b.textContent = src ? 'Replace' : 'Upload'; };
    const hexMsg = i => HEX.test(i.value.trim()) ? '' : 'Enter a hex colour, e.g. #1747F8.';
    document.querySelectorAll('[data-bp]').forEach(i => { i.addEventListener('input', () => { const v = i.value.trim(); if (HEX.test(v)) { pv.style.setProperty('--bp-' + i.dataset.bp, v); setErr(i, ''); } else i.setAttribute('aria-invalid', 'true'); }); i.addEventListener('change', () => setErr(i, hexMsg(i))); });
    const fs = document.querySelector('[data-bp-font]'); if (fs) fs.addEventListener('change', () => FONTS[fs.value] ? pv.style.setProperty('--bp-font', FONTS[fs.value]) : pv.style.removeProperty('--bp-font'));
    const fin = document.querySelector('[data-logo-in]');
    if (fin) {
      document.querySelector('[data-logo-btn]').addEventListener('click', () => fin.click());
      fin.addEventListener('change', () => {
        const f = fin.files[0]; fin.value = ''; if (!f) return;
        if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(f.type)) { setErr(fin, 'Choose a PNG, JPG, WebP or SVG image.'); return; }
        if (f.size > 5e6) { setErr(fin, 'The image is larger than 5 MB.'); return; }
        const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, 256 / Math.max(im.width || 256, im.height || 256)), c = document.createElement('canvas'); c.width = Math.round((im.width || 256) * s); c.height = Math.round((im.height || 256) * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); setErr(fin, ''); setLogo(c.toDataURL('image/png')); }; im.onerror = () => setErr(fin, 'This image could not be read.'); im.src = rd.result; }; rd.readAsDataURL(f);
      });
    }
    save.addEventListener('click', () => {
      const ins = [...document.querySelectorAll('[data-bp]')]; if (!ins.map(i => setErr(i, hexMsg(i))).every(Boolean)) return;
      const B = brand(), v = k => { const i = document.querySelector(`[data-bp="${k}"]`); return i ? i.value.trim().toUpperCase() : null; };
      g.mem.set('branding', { ...B, color: v('p') || B.color, accent: v('s') || B.accent, bg: v('bg') || B.bg, font: fs ? fs.value : B.font, logo: fin ? logo : B.logo }); g.toast(save.dataset.brandSave);
    });
  }
  S.branding = ctx => {
    return { nav: 'Branding', html: `${pageHead({ eyebrow: `${icon('palette', 'sm')} Business`, title: '<span class="hl">Branding</span>', sub: 'Your logo, colours, background and font propagate to your wallet card defaults and customer-facing surfaces.' })}
      <div class="layout-preview">${card({ title: 'Business branding', icon: 'palette', body: brandFields(true, true), cls: 'reveal-up' })}<div class="sticky reveal-up">${brandPreview()}</div></div>`, after: brandWire };
  };


  /* ================= SUBSCRIPTION ================= */
  // Client plan structure — example prices, "not final, configurable through the Super Admin portal": Free · Business ≈ €25/month · Pro ≈ €50–60/month (+ Free Trial).
  // ❓ Business Plan limits/price are the client's example values until Bonuca configures them.
  const PLAN_INFO = () => ({ free: ['Free Plan', 'No payment details required', D.plans.free, 'No charge'], trial: ['Free Trial', '14 days, then reverts to Free (or Preview) — no data is deleted', D.plans.trial, 'No charge during the trial'],
    business: ['Business Plan', 'Approx. €25 per month', D.plans.business || ['Up to approx. 150–200 customers', 'Additional loyalty programs', 'More employees', 'Additional analytics and features'], 'Approx. €25 / month'],
    pro: ['Pro Plan', 'Approx. €50–60 per month', D.plans.pro, 'Approx. €50–60 / month'] });
  const PRICE_NOTE = 'Paid via Stripe checkout (simulated). Example price — final prices are set by Bonuca.', RANK = { free: 0, business: 1, trial: 2, pro: 2 };
  const ovText = st => `Your plan is currently <b>free</b> — Pro access granted by Bonuca ${st.overrideEnd ? `until <b>${st.overrideEnd}</b>` : 'with no end date'}. No payments are being taken.`;
  S.subscription = ctx => {
    const pv = ctx.state.preview, P = PLAN_INFO();
    const head = pageHead({ eyebrow: `${icon('card', 'sm')} Business`, title: 'Subscription &amp; <span class="hl">Billing</span>' });
    // Subscription & billing are Owner-only (client spec); the Manager file stays reachable but shows no plan data.
    if (!ctx.can('billing')) return { nav: '', title: 'Subscription & Billing', html: `${head}<div class="lock-overlay">${icon('lock')}Your role does not have access to this feature.</div>` };
    const setPlan = () => document.querySelectorAll('[data-plan-set]').forEach(a => a.addEventListener('click', () => g.mem.set('plan', a.dataset.planSet)));
    if (pv) {
      // Preview Mode: choosing a plan is the way out, so these actions stay enabled, save the plan and leave the preview state.
      const exit = (t, k, prim, href) => `<a class="btn ${prim ? 'btn-primary' : 'btn-ghost'} btn-block" data-preview-ok data-no-state data-plan-set="${k}" href="${href || ctx.link('01-')}">${t}</a>`;
      const plans = `<div class="grid g4">${g.planCard(P.free[0], P.free[1], P.free[2], exit('Choose Free Plan', 'free'))}${g.planCard(P.trial[0], P.trial[1], P.trial[2], exit(`Start Free Trial ${icon('arrowRight', 'sm')}`, 'trial', true), { cls: 'current' })}${g.planCard(P.business[0], P.business[1], P.business[2], exit('Choose Business', 'business', false, ctx.link('49-') + '?changed=business'), { note: PRICE_NOTE })}${g.planCard(P.pro[0], P.pro[1], P.pro[2], exit('Choose Pro', 'pro', false, ctx.link('49-') + '?changed=pro'), { cls: 'ink', note: PRICE_NOTE })}</div>`;
      return { nav: 'Subscription & Billing', html: `${head}<section class="card reveal-up"><div class="card-body"><div class="row" style="gap:8px"><b style="font-family:var(--font-display);font-size:26px;letter-spacing:-.03em">No plan selected</b>${badge('Preview Mode', 'outline')}</div></div></section><h2 class="section-title">Choose a plan</h2>${plans}`, after: setPlan };
    }
    const ov = ctx.state.override, plan = ctx.state.plan, q = new URLSearchParams(location.search), ch = q.get('changed');
    const done = !ov && Object.hasOwn(P, ch || '') && ch === plan ? `<div class="reveal-up" style="margin-bottom:18px" data-plan-changed>${callout('info', q.get('cancelled') === '1' ? 'Subscription cancelled' : `Plan changed to ${P[ch][0]}`, q.get('cancelled') === '1' ? 'Your account is on the Free Plan limits. No customers, programs or transactions were deleted.' : ch === 'free' ? 'The Free Plan limits now apply. No data was deleted.' : 'Stripe checkout is simulated in this prototype — no payment was taken.', 'checkCircle')}</div>` : '';
    const curHead = (name, b, sub) => `<div><div class="row" style="gap:8px"><b style="font-family:var(--font-display);font-size:26px;letter-spacing:-.03em">${name}</b>${b}</div><p class="muted" style="margin-top:4px">${sub}</p></div>`;
    const cancelBtn = plan !== 'free' ? `<div style="margin-top:12px"><button class="btn btn-danger-text btn-sm" data-open="cancelSub">${icon('x', 'sm')}Cancel subscription</button></div>` : '';
    const keep = `<p class="hint" style="margin-top:16px">${icon('shield', 'sm')} Changing plans never deletes customers, programs or transactions — only feature access changes.</p>`;
    let cur;
    if (ov) cur = `<section class="card reveal-up" data-sub-current><div class="card-body">${curHead('Pro', badge('Free — managed by Bonuca', 'blue'), ovText(ctx.state))}<div class="grid g2" style="gap:12px;margin-top:14px;max-width:520px">${U.setup([['Plan', 'Pro'], ['Price', 'Free of charge'], ['Free until', ctx.state.overrideEnd || 'No end date'], ['Billing', 'Stopped by Bonuca']])}</div></div></section>`;
    else if (plan === 'trial') cur = `<section class="card reveal-up" style="overflow:hidden" data-sub-current><div class="card-body"><div class="row between wrap" style="gap:24px"><div class="row" style="gap:20px"><span style="color:var(--color-accent)">${U.ring(4 / 14, 84, 9, 'var(--color-accent)', 'var(--color-surface-sunken)', '')}</span>${curHead('Pro', badge('Free Trial', 'blue', true), 'Trial ends <b style="color:var(--color-text-primary)">Oct 31, 2026</b> · 10 days left')}</div>
      <div class="grid g2" style="gap:12px;min-width:320px">${U.setup([['Plan', 'Pro'], ['Trial ends', 'Oct 31, 2026 (10 days)']])}</div></div>${keep}${cancelBtn}</div></section>`;
    else cur = `<section class="card reveal-up" data-sub-current><div class="card-body"><div class="row between wrap" style="gap:24px">${curHead(P[plan][0], badge(plan === 'free' ? 'Current plan' : 'Active', plan === 'free' ? 'outline' : 'green'), P[plan][3])}<div class="grid g2" style="gap:12px;min-width:320px">${U.setup(plan === 'free' ? [['Plan', 'Free'], ['Price', 'No charge']] : [['Plan', P[plan][0]], ['Price', P[plan][3]], ['Next renewal', 'Nov 21, 2026'], ['Payment method', 'Stripe (simulated)']])}</div></div>${keep}${cancelBtn}</div></section>`;
    const locked = (t, prim) => `<button class="btn ${prim ? 'btn-primary' : 'btn-ghost'} btn-block is-locked" disabled>${icon('lock', 'sm')}${t}</button>`;
    const here = t => `<div class="callout" style="justify-content:center">${icon('checkCircle', 'sm')}${t}</div>`;
    const cta = k => {
      const label = k === 'free' ? 'Downgrade to Free Plan' : k === 'business' ? (plan === 'trial' ? 'Choose Business' : RANK[plan] < 1 ? 'Upgrade to Business' : 'Downgrade to Business Plan') : 'Upgrade to Pro';
      if (k === 'trial') return ov ? locked('Start Free Trial') : here(plan === 'trial' ? 'Trial in progress.' : 'Free Trial already used.');
      if (ov) return locked(label, k === 'pro');
      if (k === plan) return here('Current plan');
      return k === 'free' ? `<button class="btn btn-ghost btn-block" data-open="downgrade">${label}</button>` : `<button class="btn ${k === 'pro' ? 'btn-primary' : 'btn-ghost'} btn-block" data-plan-to="${k}">${label}</button>`;
    };
    const isCur = k => !ov && k === plan || ov && k === 'pro';
    const plans = `<div class="grid g4">${['free', 'trial', 'business', 'pro'].map(k => g.planCard(P[k][0], P[k][1], P[k][2], cta(k), { cls: isCur(k) ? 'current' : '', ribbon: isCur(k) ? badge('Current', 'blue') : '', note: k === 'business' || k === 'pro' ? PRICE_NOTE : '' })).join('')}</div>`;
    const tbl = (heads, empty) => `<div class="table-wrap"><table class="t"><thead><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody><tr><td colspan="${heads.length}"><div class="empty" style="padding:14px 6px"><span style="font-size:13px">${empty}</span></div></td></tr></tbody></table></div>`;
    const bi = g.mem.get('billing-info', { company: 'Sample Business (development)', email: 'owner@sample.dev', vat: '', addr: 'Sample Street 1, 10115 Berlin' }) || {};
    const ownerCards = `<div class="grid g2" style="margin-top:18px;align-items:start">${card({ title: 'Invoices', icon: 'file', cls: 'reveal-up', body: tbl(['Date', 'Plan', 'Amount', 'Status', 'PDF'], 'No invoices yet — they appear here after the first Stripe payment.') })}${card({ title: 'Payment history', icon: 'clock', cls: 'reveal-up', body: tbl(['Date', 'Description', 'Amount', 'Status'], 'No payments yet.') })}</div>
      <div style="margin-top:18px">${card({ title: 'Billing information', icon: 'card', sub: 'Shown on your invoices.', cls: 'reveal-up', body: `<div class="stack" data-billing><div class="form-grid">${field({ label: 'Company name', required: true, input: input({ value: bi.company, attrs: 'maxlength="80" data-bi="company"' }) })}${field({ label: 'Billing email', required: true, input: input({ type: 'email', value: bi.email, attrs: 'maxlength="120" data-bi="email"' }) })}${field({ label: 'VAT ID', optional: true, input: input({ value: bi.vat, attrs: 'maxlength="20" data-bi="vat"' }) })}${field({ label: 'Billing address', optional: true, input: input({ value: bi.addr, attrs: 'maxlength="160" data-bi="addr"' }) })}</div><div><button class="btn btn-primary" data-bi-save ${ov ? 'disabled' : ''}>${icon('check', 'sm')}Save billing information</button></div></div>` })}</div>`;
    const cm = modal({ id: 'cancelSub', open: false, title: 'Cancel subscription', sub: 'No customers, programs or transactions are deleted.', body: `<p class="muted">The account returns to the Free plan limits, or to Preview Mode if the Free plan is not available.</p>`, foot: `<button class="btn btn-ghost" data-close>Keep plan</button><button class="btn btn-danger" ${DANGER} data-cancel-confirm>${icon('x', 'sm')}Cancel subscription</button>` });
    const dm = modal({ id: 'downgrade', open: false, title: 'Downgrade to Free Plan', sub: 'No customers, programs or transactions are deleted.', body: `<p class="muted">These Free Plan limits will apply:</p><ul class="stack" style="gap:6px;margin-top:10px;padding-left:18px">${D.plans.free.map(f => `<li>${f}</li>`).join('')}</ul>`, foot: `<button class="btn btn-ghost" data-close>Keep plan</button><button class="btn btn-primary" data-plan-to="free">Downgrade to Free Plan</button>` });
    return { nav: 'Subscription & Billing', html: `${head}${done}${cur}<h2 class="section-title">Upgrade or downgrade</h2>${plans}<div style="margin-top:18px">${callout('info', 'Payment rails', 'Web purchases use Stripe checkout (simulated in this prototype). Mobile purchases use the App Store / Google Play in-app purchase inside the Bonuca app. A subscription belongs to the business account and is the same on web and mobile.')}</div>${ownerCards}${ov ? '' : cm + dm}`, after() {
      const go = (k, extra = '') => { g.mem.set('plan', k); location.href = ctx.nav(`${ctx.link('49-')}?changed=${k}${extra}`); };
      document.querySelectorAll('[data-plan-to]').forEach(b => b.addEventListener('click', () => go(b.dataset.planTo)));
      const cc = document.querySelector('[data-cancel-confirm]'); if (cc) cc.addEventListener('click', () => go('free', '&cancelled=1'));
      const bs = document.querySelector('[data-bi-save]'); if (bs) bs.addEventListener('click', () => {
        const v = k => document.querySelector(`[data-bi="${k}"]`), c = v('company'), em = v('email');
        const ok = [setErr(c, c.value.trim() ? '' : 'Enter the company name.'), setErr(em, /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em.value.trim()) ? '' : 'Enter a valid email address.')].every(Boolean); if (!ok) return;
        g.mem.set('billing-info', Object.fromEntries(['company', 'email', 'vat', 'addr'].map(k => [k, v(k).value.trim()]))); g.toast('Billing information saved');
      });
    } };
  };

  /* ================= SETTINGS ================= */
  const COUNTRIES = ['Germany', 'Austria', 'Switzerland', 'Türkiye', 'France', 'Italy'], DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  S.settings = ctx => {
    const o = ctx.owner, sec = ctx.opts.sec;
    const items = [['business', 'Business information', 'store', '50-'], ['address', 'Address', 'pin', '51-'], ['hours', 'Opening hours', 'clock', '52-'], ['logo', 'Logo', 'image', '53-'], ['colors', 'Brand colors', 'palette', '54-'], ...(ctx.can('team') ? [['employees', 'Employees', 'badge', '55-']] : []), ['notifications', 'Notifications', 'bell', '56-'], ...(o ? [['billing', 'Billing', 'card', '57-settings-billing']] : []), ['wallet', 'Wallet customization', 'wallet', o ? '58-' : '57-'], ['language', 'Language', 'globe', o ? '59-' : '58-']];
    const nav = `<nav class="card nav reveal-up" style="padding:10px;margin:0" aria-label="Settings">${items.map(([k, l, i, pre]) => `<a href="${ctx.link(pre)}" class="${k === sec ? 'active' : ''}">${icon(i)}${l}</a>`).join('')}</nav>`;
    const save = (key, t) => `<div><button class="btn btn-primary" data-set-save="${key}" data-msg="${t || 'Saved'}">${icon('check', 'sm')}Save</button></div>`;
    // ❓ Client: Manager has "limited settings". Default: business information and address are Owner-only (read-only for the Manager); everything else is editable.
    const ownerOnly = !o && ['business', 'address'].includes(sec), ro = ownerOnly ? 'readonly' : '';
    const lockNote = `<div class="lock-note">${icon('lock', 'sm')}Only the Owner can change this section.</div>`;
    const [, title, ic] = items.find(x => x[0] === sec) || ['employees', 'Employees', 'badge']; // hidden from the menu when not permitted
    let body = '';
    if (sec === 'business') { const b = g.mem.get('business', { name: 'Sample Business (development)', category: 'Café' });
      body = `<div class="stack"><div class="form-grid">${field({ label: 'Business Name', required: true, input: input({ value: b.name, attrs: `maxlength="80" data-s="name" ${ro}` }) })}${field({ label: 'Business Category', required: true, input: select(['Café', 'Restaurant', 'Bakery', 'Retail', 'Salon', 'Fitness'], b.category, `data-s="category" ${ownerOnly ? 'disabled' : ''}`) })}</div>${ownerOnly ? lockNote : save('business')}</div>`; }
    if (sec === 'address') { const a = g.mem.get('address', { street: 'Sample Street 1', postal: '10115', city: 'Berlin', country: 'Germany' });
      body = `<div class="stack"><div class="form-grid">${field({ label: 'Street', input: input({ value: a.street, attrs: `maxlength="100" data-s="street" ${ro}` }) })}${field({ label: 'Postal code', input: input({ value: a.postal, attrs: `maxlength="10" data-s="postal" ${ro}` }) })}${field({ label: 'City', input: input({ value: a.city, attrs: `maxlength="60" data-s="city" ${ro}` }) })}${field({ label: 'Country / region', input: select(COUNTRIES, a.country, `data-s="country" ${ownerOnly ? 'disabled' : ''}`) })}</div>${ownerOnly ? lockNote : save('address')}</div>`; }
    if (sec === 'hours') { const H = g.mem.get('hours', DAYS.map((_, i) => [i !== 6, '09:00', '18:00']));
      body = `<div class="stack"><div>${DAYS.map((d, i) => { const [open, f, t] = H[i]; return `<div class="hours-row ${open ? '' : 'closed'}" data-hrow><b>${d}</b><span class="row" style="gap:8px">${toggle(open, 'data-open-day aria-label="Open on ' + d + '"')}</span><div class="times field" style="display:flex"><input class="input" type="time" value="${esc(f)}" aria-label="${d} opens" ${open ? '' : 'hidden'}><span class="faint" ${open ? '' : 'hidden'}>–</span><input class="input" type="time" value="${esc(t)}" aria-label="${d} closes" ${open ? '' : 'hidden'}><span class="closed-tag" ${open ? 'hidden' : ''}>Closed</span></div></div>`; }).join('')}</div>${save('hours', 'Opening hours saved')}</div>`; }
    if (sec === 'logo') body = `<div class="grid g2" style="align-items:start">${brandFields(true, false, 'Logo saved')}${brandPreview()}</div>`;
    if (sec === 'colors') body = `<div class="grid" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);align-items:start">${brandFields(false, true)}${brandPreview()}</div>`;
    if (sec === 'employees') body = !ctx.can('team') ? `<div class="lock-overlay">${icon('lock')}Your role does not have access to this feature.</div>` : `<div class="stack">${g.team().filter(([, , r]) => r === 'Manager').map(([n, e, , , m]) => optionRow(`${esc(n)} can manage employees`, 'Owner-only. Lets this Manager view the team and invite Employees.', !!m, o ? `data-perm="${esc(e)}"` : 'disabled', o ? '' : `<div class="lock-note">${icon('lock', 'sm')}Your role does not have access to this feature.</div>`)).join('')}${o ? save('employees', 'Permissions saved') : ''}<a class="link" href="${ctx.link('39-')}">Manage team and invitations ${icon('arrowRight', 'sm')}</a></div>`;
    if (sec === 'notifications') { const n = camps(ctx).length, on = g.mem.get('winback-on', true), st = wbStages();
      const row = (ic, t, s, href, cta) => `<div class="option-row"><div class="row" style="gap:12px"><span class="feed-ic">${icon(ic, 'sm')}</span><div><b>${t}</b><small>${s}</small></div></div><a class="btn btn-ghost btn-sm" href="${href}">${cta} ${icon('arrowRight', 'sm')}</a></div>`;
      body = `<div class="stack"><p class="muted">Wallet push notifications to your customers — manual campaigns (e.g. Happy Hour, Double Stamps, Birthday Reward) and the automatic win-back sequence.</p>${row('send', 'Manual campaigns', `${n} draft${n === 1 ? '' : 's'}`, ctx.link('41-'), 'Open campaigns')}${row('repeat', 'Win-back automation', `${on ? 'On' : 'Off'} · stages at ${st.map(s => s[0]).join(', ')} days without a visit`, ctx.link('43-'), 'Open win-back')}${callout('info', 'Wallet push delivery not connected', 'Campaigns and win-back rewards are created, but notifications are not delivered to customers in this environment.')}</div>`; }
    if (sec === 'billing') { const st = ctx.state, P = PLAN_INFO(), pl = P[st.plan] || P.trial;
      body = `<div class="stack">${st.override ? `<p class="muted" data-billing-free>${ovText(st)}</p>` : ''}${U.setup(st.override ? [['Current plan', 'Pro'], ['Price', 'Free of charge'], ['Free until', st.overrideEnd || 'No end date'], ['Payment method', 'None needed']] : [['Current plan', st.plan === 'trial' ? 'Pro · Free Trial' : pl[0]], ['Price', pl[3]], [st.plan === 'trial' ? 'Trial ends' : 'Next renewal', st.plan === 'trial' ? 'Oct 31, 2026' : st.plan === 'free' ? '—' : 'Nov 21, 2026'], ['Payment method', st.plan === 'free' || st.plan === 'trial' ? 'None needed' : 'Stripe (simulated)']])}<p class="muted">Plans, invoices, payment history and billing information.</p><div><a class="btn btn-ghost" href="${ctx.link('49-')}">${icon('card', 'sm')}Open Subscription &amp; Billing ${icon('arrowRight', 'sm')}</a></div></div>`; }
    if (sec === 'wallet') body = `<div class="empty" style="align-items:flex-start;text-align:left;padding:4px 0"><p class="muted">Customise and preview each program’s wallet pass.</p><a class="btn btn-ghost" href="${ctx.link('22-')}">${icon('wallet', 'sm')}Open Wallet Cards ${icon('arrowRight', 'sm')}</a></div>`;
    if (sec === 'language') body = `<div class="stack"><p class="muted">Interface language for the dashboard. Supported at launch: English, German, Turkish, French, Italian.</p><div class="option-row" data-preview-ok><div><b>Language</b><small>Dashboard interface language</small></div>${select(['English', 'Deutsch', 'Türkçe', 'Français', 'Italiano'], g.mem.get('lang', 'English'), 'data-lang aria-label="Language" style="max-width:180px"')}</div><div class="option-row"><div><b>Theme</b><small>Light, dark, or follow your system</small></div>${g.SHELL_BITS.themeSeg()}</div></div>`;
    const panel = card({ title, icon: ic, body, cls: 'reveal-up' });
    return { nav: 'Settings', title: 'Settings · ' + title, html: `${pageHead({ eyebrow: `${icon('settings', 'sm')} Settings`, title: '<span class="hl">Settings</span>', sub: 'Business details, team permissions and preferences.' })}<div class="grid" style="grid-template-columns:240px minmax(0,1fr);align-items:start"><div class="sticky">${nav}</div>${panel}</div>`, after() {
      document.querySelectorAll('[data-open-day]').forEach(t => t.onchange = () => { const r = t.closest('[data-hrow]'); r.classList.toggle('closed', !t.checked); r.querySelectorAll('.times > input, .times > .faint').forEach(x => x.hidden = !t.checked); r.querySelector('.closed-tag').hidden = t.checked; if (!t.checked) setErr(r.querySelector('.times input:last-of-type'), ''); });
      brandWire();
      const sv = document.querySelector('[data-set-save]'); if (!sv) return;
      const v = k => document.querySelector(`[data-s="${k}"]`);
      sv.addEventListener('click', () => {
        const key = sv.dataset.setSave; let ok = true;
        if (key === 'business') { ok = setErr(v('name'), v('name').value.trim() ? '' : 'Enter your business name.'); if (ok) { g.mem.set('business', { name: v('name').value.trim(), category: v('category').value }); const tb = document.querySelector('.topbar .biz b'); if (tb) tb.textContent = v('name').value.trim(); } }
        if (key === 'address') { ok = setErr(v('postal'), !v('postal').value.trim() || /^[A-Za-z0-9 -]{3,10}$/.test(v('postal').value.trim()) ? '' : 'Enter a valid postal code.'); if (ok) g.mem.set('address', Object.fromEntries(['street', 'postal', 'city', 'country'].map(k => [k, v(k).value.trim()]))); }
        if (key === 'hours') { const H = [...document.querySelectorAll('[data-hrow]')].map(r => { const [f, t] = r.querySelectorAll('.times input'), open = r.querySelector('[data-open-day]').checked; ok = setErr(t, open && !(f.value && t.value && t.value > f.value) ? 'Closing time must be after opening time.' : '') && ok; return [open, f.value, t.value]; }); if (ok) g.mem.set('hours', H); }
        if (key === 'employees') { const tp = g.mem.get('team-perms', {}); document.querySelectorAll('[data-perm]').forEach(i => { const row = g.team().find(t => t[1] === i.dataset.perm); tp[i.dataset.perm] = [i.checked, row ? !!row[5] : false]; }); g.mem.set('team-perms', tp); }
        if (ok) g.toast(sv.dataset.msg);
      });
    } };
  };
})(window);
