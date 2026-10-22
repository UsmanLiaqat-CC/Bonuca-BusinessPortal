/* QR Scanner, Printable QR codes, Customers, Employees */
(function (g) {
  const U = g.UI, D = g.DATA, { icon, field, input, select, textarea, toggle, badge, status, card, callout, pass, qrPanel, pageHead, crumb, modal, kv, tabs, ini, esc } = U;
  const S = g.SCREENS = g.SCREENS || {};

  /* ================= QR SCANNER ================= */
  function feed(ctx, withAnna) {
    const base = ctx.owner ? D.scansBase.slice(1) : D.scansBase.slice(0);
    const list = withAnna ? [['Anna Schmidt', 'Stamp added · Coffee Card', ctx.owner ? '02:27 PM' : '02:29 PM', 'stamp'], ...base.slice(0, 9)] : base.slice(0, 10);
    const ic = { points: ['coins', 'var(--color-highlight-soft)', '#9A7300'], visit: ['footprints', 'var(--color-accent-soft)', 'var(--color-accent)'], stamp: ['stamp', 'var(--color-mint-soft)', '#13845B'] };
    return card({ title: 'Recent scans', icon: 'clock', actions: badge('Live', 'green', true), body: null, cls: 'reveal-up scan-feed', attrs: 'style="overflow:hidden"' }).replace('</section>', `<div>${list.map(([n, d, t, k], i) => { const [a, b, c] = ic[k]; return `<div class="list-row" style="${i === 0 && withAnna ? 'background:var(--color-mint-soft);animation:fadeUp .5s both' : ''}"><div class="row" style="min-width:0"><span class="feed-ic" style="background:${b};color:${c}">${icon(a, 'sm')}</span><div style="min-width:0"><b style="font-weight:600;font-size:14px">${n}</b><div class="hint" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d}</div></div></div><span class="faint" style="font-size:12px;white-space:nowrap">Oct 21 · ${t}</span></div>`; }).join('')}</div></section>`);
  }
  const idlePanel = () => `<div class="stack">
    <button class="scan-hero reveal-up" data-scan><span class="frame"><i></i><i></i><i></i><i></i><i class="beam"></i>${icon('qr')}</span><div><h3>Scan</h3><p>Point the camera at a customer’s wallet pass.</p></div><span class="go">${icon('scan', 'lg')}</span></button>
    ${card({ title: 'Manual code entry', icon: 'hash', sub: 'Camera unavailable / development.', cls: 'reveal-up', body: `<div class="stack"><div class="row"><div class="input-wrap" style="flex:1">${icon('search')}<input class="input mono" placeholder="BNC-XXXXXXXX" data-code></div><button class="btn btn-ink" data-find>Find</button></div>
      <div class="callout dev" style="display:block"><b style="display:flex;gap:8px;align-items:center;margin-bottom:8px">${icon('zap', 'sm')}Development: pick a stored pass</b>${select(['Choose a customer…', 'Anna Schmidt — Coffee Card (Stamp Card)', 'Leon Fischer — Coffee Card (Stamp Card)', 'Vera Conti — Coffee Rewards (Points Program)', 'Anna Schmidt — Rewards Club (Tier Program)', 'Anna Schmidt — VIP Member (Membership Card)'], 'Choose a customer…', 'data-pick')}</div></div>` })}
  </div>`;
  function custHead(name, sub) { return `<header class="card-head split"><div class="row"><span class="avatar round" style="width:48px;height:48px;font-size:16px">${U.initials(name)}</span><div><div class="card-title" style="font-size:20px">${name}</div><div class="card-sub">${sub}</div></div></div><button class="btn btn-text btn-sm" data-new-scan>${icon('rotate', 'sm')}New scan</button></header>`; }
  const offer = () => `<div class="offer-card"><span class="confetti">🎁</span><div class="row" style="margin-bottom:10px"><span class="feed-ic" style="background:#fff;color:#C2410C">${icon('gift', 'sm')}</span><b style="font-family:var(--font-display);font-size:17px">Welcome back offer</b>${badge('Win-back', 'amber')}</div>${kv([['Customer', 'Anna Schmidt'], ['Days inactive', '22'], ['Win-back reward', 'Free espresso shot', true], ['Redemption status', badge('Not redeemed', 'outline')]])}<button class="btn btn-ink btn-block" style="margin-top:12px" data-toast="Win-back reward redeemed">${icon('gift', 'sm')}Redeem Reward</button></div>`;

  S.scanner = ctx => {
    const st = ctx.opts.state; let main = '';
    // Stamp card scans (Coffee Card): which customer (?c=) and how many stamps were just added (?n=).
    const q = new URLSearchParams(location.search), coffee = D.programs.find(p => p.id === 'coffee'), total = coffee.pass.total, reward = coffee.pass.reward;
    const ck = D.stampScans[q.get('c')] ? q.get('c') : 'anna', [cname, cid, filled] = D.stampScans[ck], added = Math.max(1, parseInt(q.get('n'), 10) || 1);
    // Multiple stamps only when the program allows it AND the user has permission (client: team permissions still apply).
    const maxPer = coffee.multi.on && ctx.can('multiStamp') ? (coffee.multi.max === 'Unlimited' ? Infinity : coffee.multi.max) : 1;
    const stampPass = n => pass({ type: 'stamp', name: coffee.name, reward, total, filled: n }).replace('<div class="pass-qr">', '<div class="pass-qr" style="display:none">');
    if (st === 'idle') main = idlePanel();
    if (st === 'confirmed') main = `<div class="stack"><div class="card reveal-up" style="padding:20px 22px;border-color:color-mix(in srgb,var(--color-mint) 40%,transparent);background:linear-gradient(120deg,var(--color-mint-soft),var(--color-surface) 60%)"><div class="row" style="align-items:flex-start;gap:16px"><span class="success-burst">${icon('check', 'lg')}</span><div><b style="font-family:var(--font-display);font-size:20px;color:#13845B">Confirmed</b><p style="margin-top:2px;font-size:15px">${added > 1 ? added + ' stamps' : 'Stamp'} added <b>(${filled + added}/${total})</b>.</p><p class="hint" style="margin-top:6px">Wallet pass update: not sent — the Apple/Google Wallet integration is not connected in this environment.</p></div></div></div>${idlePanel()}</div>`;
    if (st === 'stamp') main = `<section class="card reveal-up">${custHead(cname, `${cid} · ${coffee.name} (Stamp Card)`)}<div class="card-body stack">
      <div class="grid" style="grid-template-columns:240px 1fr;gap:20px;align-items:center"><div data-stamp-pass>${stampPass(filled)}</div><div>${kv([['Stamps', `<span data-stamps>${filled}</span> / ${total}`, true], ['Reward', reward]])}
        ${maxPer > 1 ? `<div class="option-row" style="margin-top:12px" data-qty-row><div><b>Stamps to add</b><small>${maxPer === Infinity ? 'No limit per scan' : `Up to ${maxPer} per scan`}</small></div><div class="row" style="gap:8px"><button class="icon-btn" data-qty="-1" aria-label="Fewer stamps">−</button><input class="input" type="number" min="1" ${maxPer === Infinity ? '' : `max="${maxPer}"`} value="1" aria-label="Stamps to add" data-qty-in style="width:72px;text-align:center"><button class="icon-btn" data-qty="1" aria-label="More stamps">${icon('plus', 'sm')}</button></div></div>` : ''}
        <button class="btn btn-primary btn-lg btn-block" style="margin-top:16px" data-add-stamp>${icon('stamp', 'sm')}Add <span data-qty-label>stamp</span></button></div></div>
      ${ck === 'anna' ? `<div><div class="label" style="margin-bottom:10px">${icon('gift', 'sm')} Available rewards</div><div class="option-row"><div class="row"><span class="feed-ic" style="background:var(--color-highlight-soft);color:#9A7300">${icon('coffee', 'sm')}</span><b>${reward}</b></div><button class="btn btn-ink btn-sm" data-toast="Reward redeemed">Redeem Reward</button></div></div>` : ''}</div></section>`;
    // Card completion: reward becomes available; redeeming is an explicit tap; extra stamps carry over to the new card.
    if (st === 'rewardReady') {
      const carry = Math.max(0, filled + added - total);
      main = `<section class="card reveal-up">${custHead(cname, `${cid} · ${coffee.name} (Stamp Card)`)}<div class="card-body stack">
      ${callout('info', 'Reward ready', `The card is complete. ${reward} is now available.`, 'gift')}
      <div class="grid" style="grid-template-columns:240px 1fr;gap:20px;align-items:center"><div data-stamp-pass>${stampPass(total)}</div><div>${kv([['Stamps added', '+' + added], ['Card', `${total} / ${total} · completed`], ['Reward', reward, true], ['Status', `<span data-rw-status>${badge('Available', 'green')}</span>`], ['New card', `${carry} / ${total}${carry ? ' · extra stamps carried over' : ''}`]])}
        <button class="btn btn-ink btn-lg btn-block" style="margin-top:16px" data-redeem-ready>${icon('gift', 'sm')}Redeem Reward</button></div></div></div></section>`;
    }
    if (st === 'points') main = `<section class="card reveal-up">${custHead('Vera Conti', 'C-10004 · Coffee Rewards (Points Program)')}<div class="card-body stack">
      ${field({ label: 'Purchase amount (EUR)', input: `<div class="input-wrap"><span style="position:absolute;left:18px;top:50%;transform:translateY(-50%);font:600 24px var(--font-display);color:var(--color-text-tertiary)">€</span><input class="input big-input focus" type="number" step="0.01" value="7.50" data-amount></div>` })}
      <div class="balance-flow"><div class="b"><small>Current balance</small><b>1153 pts</b></div>${icon('plus')}<div class="b plus"><small>Points to be added</small><b data-add>+75</b></div>${icon('arrowRight')}<div class="b"><small>New balance</small><b data-new>1228 pts</b></div></div>
      <div>${kv([['Customer', 'Vera Conti'], ['Amount entered', '<span data-amt>7.50</span> EUR'], ['Next reward', 'All rewards reached'], ['Points still needed', '—']])}</div>
      <button class="btn btn-primary btn-lg btn-block" data-credit>${icon('coins', 'sm')}Credit <span data-cr>75</span> points</button></div></section>`;
    if (st === 'tier') main = `<section class="card reveal-up">${custHead('Anna Schmidt', 'C-10002 · Rewards Club (Tier Program)')}<div class="card-body stack">${offer()}
      <div class="grid g3">${[['Current tier', 'Member', 'layers'], ['Benefits', 'Welcome drink', 'gift'], ['Next tier', '3 visits to Silver', 'trophy']].map(([k, v, i]) => `<div class="setup-item"><small>${icon(i, 'sm')} ${k}</small><b>${v}</b></div>`).join('')}</div>
      <div><div class="row between hint"><span>Member</span><span>Silver · 10 visits</span></div><div class="mini-prog"><i style="--w:70%"></i></div></div>
      <button class="btn btn-primary btn-lg btn-block" data-toast="Visit recorded">${icon('footprints', 'sm')}Record visit</button></div></section>`;
    if (st === 'membership') main = `<section class="card reveal-up">${custHead('Anna Schmidt', 'C-10002 · VIP Member (Membership Card)')}<div class="card-body stack">${offer()}
      <div class="grid g3">${[['Benefit', '10% off every visit', 'crown'], ['Discount to apply', '<span style="font-family:var(--font-display);font-size:26px">10%</span>', 'percent'], ['Member since', 'Jan 21, 2026', 'calendar']].map(([k, v, i]) => `<div class="setup-item"><small>${icon(i, 'sm')} ${k}</small><b>${v}</b></div>`).join('')}</div>
      <button class="btn btn-primary btn-lg btn-block" data-toast="Visit recorded">${icon('footprints', 'sm')}Record visit</button></div></section>`;
    const withAnna = ['confirmed', 'points', 'tier', 'membership'].includes(st);
    return { nav: 'QR Scanner', html: `${pageHead({ eyebrow: `${icon('qr', 'sm')} Scanner`, title: 'QR <span class="hl">Scanner</span>', sub: 'Scan a customer’s wallet pass, confirm the action, and the pass updates.', actions: `<a class="btn btn-ghost" href="${ctx.link('34-')}">${icon('qr', 'sm')}Printable QR codes</a>` })}
      <div class="grid" style="grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);align-items:start">${main}${feed(ctx, withAnna)}</div>`, after() {
        const go = pre => location.href = ctx.link(pre);
        const sc = document.querySelector('[data-scan]'); if (sc) sc.onclick = () => go('29-');
        const f = document.querySelector('[data-find]'); if (f) f.onclick = () => { const v = document.querySelector('[data-code]').value.trim(); if (/^BNC-/i.test(v)) go('29-'); else g.toast('Enter a pass code like BNC-DEMO1000'); };
        const pk = document.querySelector('[data-pick]'); if (pk) pk.onchange = () => { const [pre, qs] = (['', '29-', '29-?c=leon', '31-', '32-', '33-'][pk.selectedIndex] || '28-').split('?'); location.href = ctx.link(pre) + (qs ? '?' + qs : ''); };
        document.querySelectorAll('[data-new-scan]').forEach(b => b.onclick = () => go('28-'));
        let qty = 1; const qi = document.querySelector('[data-qty-in]'), ql = document.querySelector('[data-qty-label]');
        const setQty = v => { qty = Math.max(1, Math.min(maxPer, parseInt(v, 10) || 1)); if (qi) qi.value = qty; ql.textContent = qty > 1 ? qty + ' stamps' : 'stamp'; };
        document.querySelectorAll('[data-qty]').forEach(b => b.onclick = () => setQty(qty + +b.dataset.qty)); if (qi) qi.onchange = () => setQty(qi.value);
        const as = document.querySelector('[data-add-stamp]'); if (as) as.onclick = () => {
          [...document.querySelectorAll('[data-stamp-pass] .stamp:not(.on)')].slice(0, qty).forEach(x => x.classList.add('on'));
          document.querySelector('[data-stamps]').textContent = Math.min(total, filled + qty); as.disabled = true;
          const qs = `?c=${ck}&n=${qty}`; setTimeout(() => location.href = (filled + qty >= total ? ctx.page('scanner-stamp-reward-ready') : ctx.link('30-')) + qs, 650);
        };
        const rr = document.querySelector('[data-redeem-ready]'); if (rr) rr.onclick = () => {
          const carry = Math.max(0, filled + added - total);
          document.querySelector('[data-rw-status]').innerHTML = badge('Redeemed', 'blue'); document.querySelector('[data-stamp-pass]').innerHTML = stampPass(carry);
          rr.disabled = true; rr.innerHTML = `${icon('check', 'sm')}Reward redeemed`; g.toast(`Reward redeemed — new card ${carry}/${total}`);
        };
        const am = document.querySelector('[data-amount]'); if (am) { const upd = () => { const a = parseFloat(am.value) || 0, p = Math.floor(a * 10); document.querySelector('[data-add]').textContent = '+' + p; document.querySelector('[data-new]').textContent = (1153 + p) + ' pts'; document.querySelector('[data-amt]').textContent = a.toFixed(2); document.querySelector('[data-cr]').textContent = p; }; am.oninput = upd; document.querySelector('[data-credit]').onclick = () => g.toast('Points credited'); }
      } };
  };

  /* ================= PRINTABLE QR CODES ================= */
  S.qrCodes = ctx => {
    const items = [['Customer registration', 'Registers a new customer using your configured signup fields.', 'https://join.bonuca.invalid/register/biz_sample', 'Registration', 'Table', 'userPlus'],
      ...D.programs.filter(p => p.status === 'Active').map(p => [p.name, p.qrAction, p.url, 'Programs', 'Table', p.icon]),
      ['Cup-lid Campaign', 'Stamp card acquisition campaign', D.campaigns[0].url, 'Campaigns', 'Cup', 'stamp'], ['Free Coffee Campaign', 'One-time voucher campaign', D.campaigns[1].url, 'Campaigns', 'Cup', 'ticket'], ['Weekend Brunch Voucher', 'One-time voucher campaign', D.campaigns[2].url, 'Campaigns', 'Cup', 'ticket']];
    const cards = items.map(([t, s, url, grp, fmt, ic]) => `<section class="card reveal-up" data-group="${grp}"><header class="card-head split"><div class="row"><span class="feed-ic" style="background:var(--color-accent-soft);color:var(--color-accent)">${icon(ic, 'sm')}</span><div><div class="card-title">${t}</div><div class="card-sub">${s}</div></div></div>${grp === 'Registration' ? badge('Always on', 'outline') : status('Active')}</header><div class="card-body">${qrPanel({ url, format: fmt })}</div></section>`).join('');
    return { nav: 'QR Scanner', title: 'Printable QR codes', html: `${pageHead({ eyebrow: crumb('QR Scanner', ctx.link('28-')) + 'Printable QR codes', title: 'Printable <span class="hl">QR codes</span>', sub: 'Depending on the program, scanning adds a wallet card, registers the customer, or joins a membership.' })}
      ${tabs([['All', null, 8], ['Registration', null, 1], ['Programs', null, 4], ['Campaigns', null, 3]], 'All', 'data-qr-tabs')}<div class="grid g2" data-qr-grid>${cards}</div>`, after() {
        document.querySelector('[data-qr-tabs]').addEventListener('tab', e => document.querySelectorAll('[data-qr-grid] > section').forEach(s => s.hidden = !(e.detail === 'All' || s.dataset.group === e.detail)));
      } };
  };

  /* ================= CUSTOMERS ================= */
  S.customers = ctx => {
    const PER = 16;
    const m = modal({ id: 'add', open: ctx.opts.modal === 'add', title: 'Add customer', sub: 'Fields follow your customer signup settings.', body: `<div class="form-grid">${field({ label: 'Name', required: true, input: input({ cls: ctx.opts.modal ? 'focus' : '' }) })}${field({ label: 'Email', optional: true, input: input({ type: 'email' }) })}${field({ label: 'Phone Number', optional: true, input: input() })}${field({ label: 'Birthday', optional: true, input: input({ type: 'date' }) })}</div>`, foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-close data-toast="Customer added">${icon('userPlus', 'sm')}Add customer</button>` });
    return { nav: 'Customers', html: `${pageHead({ eyebrow: `${icon('users', 'sm')} People`, title: '<span class="hl">Customers</span>', sub: `<b style="color:var(--color-text-primary)">64</b> customers across all programs.`, actions: `<a class="btn btn-ghost" href="${ctx.link('38-')}">${icon('sliders', 'sm')}Signup fields</a><button class="btn btn-primary" data-open="add">${icon('userPlus', 'sm')}Add customer</button>` })}
      <section class="card reveal-up" style="overflow:hidden"><div class="toolbar"><label class="search">${icon('search')}<input class="input" placeholder="Search by name, phone, email or customer ID" data-search></label><span class="hint" data-result>Showing 1–${PER} of 64</span></div>
      <div class="table-wrap"><table class="t"><thead><tr><th>Name</th><th>Customer ID</th><th>Email</th><th>Phone</th><th>Joined</th><th></th></tr></thead><tbody data-rows></tbody></table></div>
      <div class="pager"><span data-pinfo></span><div class="pg" data-pg></div></div></section>${m}`, after() {
        let page = 1, q = '';
        const rows = document.querySelector('[data-rows]');
        const draw = () => {
          const list = D.customers.filter(c => !q || [c.name, c.id, c.email, c.phone].join(' ').toLowerCase().includes(q));
          const pages = Math.max(1, Math.ceil(list.length / PER)); page = Math.min(page, pages);
          const sl = list.slice((page - 1) * PER, page * PER);
          rows.innerHTML = sl.map((c, i) => `<tr class="clickable" data-href="${ctx.link('37-')}" style="animation:fadeUp .4s ${i * 18}ms both"><td><div class="person">${ini(c.name)}${esc(c.name)}</div></td><td><span class="mono faint">${c.id}</span></td><td class="${c.email === '—' ? 'faint' : ''}">${esc(c.email)}</td><td class="${c.phone === '—' ? 'faint' : ''}">${c.phone}</td><td class="muted">${c.joined}</td><td class="num faint">${icon('chevronRight', 'sm')}</td></tr>`).join('') || `<tr><td colspan="6"><div class="empty"><div class="ill">${icon('search', 'lg')}</div><b style="color:var(--color-text-primary)">No customers match “${esc(q)}”</b></div></td></tr>`;
          const a = list.length ? (page - 1) * PER + 1 : 0, b = Math.min(page * PER, list.length);
          document.querySelector('[data-result]').textContent = `Showing ${a}–${b} of ${list.length}`;
          document.querySelector('[data-pinfo]').textContent = `Page ${page} of ${pages}`;
          document.querySelector('[data-pg]').innerHTML = `<button data-p="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Previous">‹</button>` + Array.from({ length: pages }, (_, i) => `<button data-p="${i + 1}" class="${i + 1 === page ? 'on' : ''}">${i + 1}</button>`).join('') + `<button data-p="${page + 1}" ${page === pages ? 'disabled' : ''} aria-label="Next">›</button>`;
        };
        document.querySelector('[data-search]').oninput = e => { q = e.target.value.trim().toLowerCase(); page = 1; draw(); };
        document.querySelector('[data-pg]').onclick = e => { const b = e.target.closest('[data-p]'); if (b && !b.disabled) { page = +b.dataset.p; draw(); } };
        draw();
      } };
  };

  S.customerProfile = ctx => {
    const hist = [ctx.owner ? 'Oct 21, 2026, 02:27 PM' : 'Oct 21, 2026, 02:29 PM', 'Oct 19, 2026, 08:22 PM', 'Sep 22, 2026, 09:08 AM', 'Sep 13, 2026, 07:20 PM', 'Aug 20, 2026, 06:17 PM', 'Aug 17, 2026, 01:55 PM', 'Aug 8, 2026, 03:02 PM', 'Jul 29, 2026, 10:21 AM', 'Jul 22, 2026, 08:33 PM', 'Jul 15, 2026, 07:19 PM', 'Jul 7, 2026, 03:35 PM', 'Jun 26, 2026, 01:25 PM'];
    const st = [['Number of scans', '<span data-count="12">12</span>', 'scan'], ['Last visit', 'Oct 21, 2026', 'calendar'], ['Available rewards', '<span data-count="2">2</span>', 'gift']];
    return { nav: 'Customers', title: 'Anna Schmidt', html: `${pageHead({ eyebrow: crumb('Customers', ctx.link('35-')) + 'Anna Schmidt', title: `<span class="row" style="gap:16px"><span class="avatar round" style="width:60px;height:60px;font-size:20px">AS</span><span>Anna <span class="hl">Schmidt</span></span></span>`, sub: `Customer ID <span class="mono">C-10001</span>` })}
      <div class="grid g3">${st.map(([l, v, i], n) => `<div class="card hover stat reveal-up ${n === 0 ? 'feature' : ''}"><div class="lbl">${l}<span class="ico">${icon(i, 'sm')}</span></div><div class="val">${v}</div></div>`).join('')}</div>
      <div class="grid g2" style="margin-top:18px">
        ${card({ title: 'Profile', icon: 'badge', cls: 'reveal-up', body: U.setup([['Email', 'anna.schmidt0@example.com'], ['Phone', '+49 151 5196093'], ['Birthday', '<span class="faint">—</span>'], ['Joined', 'Jan 6, 2026']]) })}
        ${card({ title: 'Memberships', icon: 'wallet', sub: 'Programs, current tier and balances.', cls: 'reveal-up', body: `<div class="option-row" style="display:block"><div class="row between"><div class="row"><span class="feed-ic" style="background:var(--color-accent-soft);color:var(--color-accent)">${icon('stamp', 'sm')}</span><div><b>Coffee Card</b><small>2 / 10 stamps</small></div></div><span class="mono faint" style="font-size:12px">Pass BNC-DEMO1000</span></div><div class="mini-prog"><i style="--w:20%"></i></div></div>` })}
        ${card({ title: 'Rewards', icon: 'gift', cls: 'reveal-up', body: `<div class="stack" style="gap:10px">${[['1 Free Coffee', 'stamp card', 'stamp'], ['1 Free Coffee', 'voucher', 'ticket']].map(([r, s, i]) => `<div class="option-row"><div class="row"><span class="feed-ic" style="background:var(--color-highlight-soft);color:#9A7300">${icon(i, 'sm')}</span><div><b>${r}</b><small>${s}</small></div></div>${status('Available')}</div>`).join('')}</div>` })}
        ${card({ title: 'Notes', icon: 'edit', cls: 'reveal-up', body: `<div class="stack" style="gap:12px">${textarea('Prefers oat milk.')}<div><button class="btn btn-primary btn-sm" data-toast="Notes saved">Save notes</button></div></div>` })}
      </div>
      <div style="margin-top:18px">${card({ title: 'Visit history', icon: 'clock', actions: badge('12 visits', 'outline'), cls: 'reveal-up', body: `<div class="timeline">${hist.map(h => `<div class="tl-item"><span><b style="font-weight:600">Stamp added</b> <span class="faint">· Coffee Card</span></span><span class="muted">${h}</span></div>`).join('')}</div>` })}</div>` };
  };

  S.signupFields = ctx => {
    const f = [['Name', 'Required', 'badge'], ['Email', 'Optional', 'mail'], ['Phone Number', 'Optional', 'phone'], ['Birthday', 'Optional', 'calendar']];
    return { nav: 'Customers', title: 'Customer signup fields', html: `${pageHead({ eyebrow: crumb('Customers', ctx.link('35-')) + 'Signup fields', title: 'Customer <span class="hl">signup fields</span>', sub: 'Name is required by default; Email, Phone Number and Birthday are optional by default.' })}
      ${card({ title: 'Fields customers fill in', icon: 'sliders', cls: 'reveal-up', body: `<div class="stack" style="gap:10px">${f.map(([n, v, i]) => `<div class="option-row"><div class="row"><span class="feed-ic" style="background:var(--color-surface);border:1px solid var(--color-border)">${icon(i, 'sm')}</span><b>${n}</b></div><div class="seg">${['Required', 'Optional'].map(o => `<button class="${o === v ? 'on' : ''}">${o}</button>`).join('')}</div></div>`).join('')}</div>`, foot: `<button class="btn btn-primary" data-toast="Signup fields saved">${icon('check', 'sm')}Save</button>` })}` };
  };

  /* ================= EMPLOYEES ================= */
  S.employees = ctx => {
    const o = ctx.owner;
    if (!ctx.can('team')) return { nav: 'Employees', html: `${pageHead({ eyebrow: `${icon('badge', 'sm')} Team`, title: '<span class="hl">Employees</span>' })}<div class="lock-overlay">${icon('lock')}Your role does not have access to this feature.</div>` };
    // "Can manage employees" exists for Managers only and only the Owner can change it.
    const manage = (r, on, n) => r === 'Manager' ? toggle(!!on, `aria-label="${n} can manage employees" ${o ? '' : 'disabled'}`) : '<span class="faint">—</span>';
    // Per-employee permission (client): employees award multiple stamps only if permitted.
    const multi = (r, on, n) => r === 'Employee' ? toggle(!!on, `aria-label="${n} can award multiple stamps"`) : '<span class="faint">—</span>';
    const team = `<div class="table-wrap"><table class="t"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Since</th><th>Can manage employees</th><th>Can award multiple stamps</th></tr></thead><tbody>${D.team.map(([n, e, r, s, m, ms]) => `<tr><td><div class="person">${ini(n)}${n}</div></td><td class="muted">${e}</td><td>${badge(r, r === 'Owner' ? 'ink' : r === 'Manager' ? 'blue' : '')}</td><td>${status('Active')}</td><td class="muted">${s}</td><td>${manage(r, m, n)}</td><td>${multi(r, ms, n)}</td></tr>`).join('')}</tbody></table></div>`;
    const roles = `<div class="stack" style="gap:10px">${D.roles.map(([r, d, i]) => `<div class="row" style="align-items:flex-start;gap:14px;padding:4px 0"><span class="feed-ic" style="background:var(--color-surface-sunken)">${icon(i, 'sm')}</span><div><b>${r}</b><p class="muted" style="font-size:13.5px;margin-top:2px">${d}</p></div></div>`).join('')}</div>`;
    const inviteLink = r => `../../common/pages/13-accept-invitation.html?role=${r}`;
    const inv = modal({ id: 'invite', open: ctx.opts.modal === 'invite', title: 'Invite team member', sub: 'They receive an email, set their own password, and get role-based access.', body: `<div class="stack">${field({ label: 'Email', required: true, input: `<div class="input-wrap">${icon('mail')}${input({ type: 'email', cls: ctx.opts.modal ? 'focus' : '', ph: 'name@business.com' })}</div>` })}
      ${field({ label: 'Role', required: true, input: `<div class="type-grid" data-invite-role>${[['Manager', 'badge', '#7C3AED', 'Customers, programs, rewards, analytics, scanner.'], ['Employee', 'scan', '#1747F8', 'Scanner, stamps/points/visits, redeem rewards.']].map(([r, i, c, d]) => { const locked = !o && r === 'Manager'; return `<button class="type-card ${r === 'Employee' ? 'on' : ''}" ${locked ? 'disabled style="--c:' + c + ';opacity:.5;cursor:not-allowed"' : `data-select="${r}" style="--c:${c}"`}><div class="row between"><span class="ti">${icon(i)}</span>${locked ? icon('lock', 'sm') : ''}</div><b>${r}</b><small>${d}</small></button>`; }).join('')}</div>`, hint: o ? '' : 'Managers can invite Employees only.' })}
      <div data-invite-multi>${U.check('Can award multiple stamps', false, 'name="canMultiStamp"')}</div>
      ${callout('dev', 'Development — email not sent', `No email service is connected, so no invitation was delivered. <a class="link" data-invite-link href="${inviteLink('Employee')}">Open invitation link ${icon('arrowRight', 'sm')}</a>`)}</div>`, foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-close data-toast="Invitation sent">${icon('send', 'sm')}Invite Employee</button>` });
    return { nav: 'Employees', html: `${pageHead({ eyebrow: `${icon('badge', 'sm')} Team`, title: '<span class="hl">Employees</span>', sub: 'Your team and their roles.', actions: `<button class="btn btn-primary" data-open="invite">${icon('userPlus', 'sm')}Invite Employee</button>` })}
      ${card({ title: 'Team', icon: 'users', sub: o ? '' : 'Only the Owner can change who may manage employees.', actions: badge(D.team.length + ' members', 'outline'), body: null, cls: 'reveal-up', attrs: 'style="overflow:hidden"' }).replace('</section>', team + '</section>')}
      <div style="margin-top:18px">${card({ title: 'Roles', icon: 'shield', body: roles, cls: 'reveal-up' })}</div>${inv}`, after() {
      const a = document.querySelector('[data-invite-link]');
      document.querySelector('[data-invite-role]').addEventListener('typechange', e => { a.href = inviteLink(e.detail); document.querySelector('[data-invite-multi]').hidden = e.detail !== 'Employee'; });
    } };
  };
})(window);
