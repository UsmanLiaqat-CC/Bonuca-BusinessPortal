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
      <div class="callout dev" style="display:block"><b style="display:flex;gap:8px;align-items:center;margin-bottom:8px">${icon('zap', 'sm')}Development: pick a stored pass</b>${select(['Choose a customer…', 'Anna Schmidt — Coffee Card (Stamp Card)', 'Leon Fischer — Coffee Card (Stamp Card)', 'Vera Conti — Coffee Rewards (Points Program)', 'Anna Schmidt — Rewards Club (Tier Program)', 'Anna Schmidt — VIP Member (Membership Card)', 'Anna Schmidt — Gift (Free coffee)'], 'Choose a customer…', 'data-pick')}</div></div>` })}
  </div>`;
  function custHead(name, sub) { return `<header class="card-head split"><div class="row"><span class="avatar round" style="width:48px;height:48px;font-size:16px">${U.initials(name)}</span><div><div class="card-title" style="font-size:20px">${name}</div><div class="card-sub">${sub}</div></div></div><button class="btn btn-text btn-sm" data-new-scan>${icon('rotate', 'sm')}New scan</button></header>`; }
  const offer = () => `<div class="offer-card"><span class="confetti">🎁</span><div class="row" style="margin-bottom:10px"><span class="feed-ic" style="background:#fff;color:#C2410C">${icon('gift', 'sm')}</span><b style="font-family:var(--font-display);font-size:17px">Welcome back offer</b>${badge('Win-back', 'amber')}</div>${kv([['Customer', 'Anna Schmidt'], ['Days inactive', '22'], ['Win-back reward', 'Free espresso shot', true], ['Redemption status', badge('Not redeemed', 'outline')]])}<button class="btn btn-ink btn-block" style="margin-top:12px" data-toast="Win-back reward redeemed">${icon('gift', 'sm')}Redeem Reward</button></div>`;

  // Points for a purchase under a program's earning rule (client: rounding, optional minimum purchase and per-transaction cap).
  const ROUND = { 'Round down': Math.floor, 'Round up': Math.ceil, 'Round to nearest': Math.round };
  g.calcPoints = (amount, c) => {
    if (!(amount > 0)) return { pts: 0 };
    if (c.min && amount < c.min) return { pts: 0, below: true };
    const pts = ROUND[c.rounding](Math.round(amount / c.basis * c.pts * 1e6) / 1e6);
    return c.max && pts > c.max ? { pts: c.max, capped: true } : { pts };
  };

  S.scanner = ctx => {
    const st = ctx.opts.state; let main = '';
    // Stamp card scans (Coffee Card): which customer (?c=) and how many stamps were just added (?n=).
    const q = new URLSearchParams(location.search), coffee = D.programs.find(p => p.id === 'coffee'), total = coffee.pass.total, reward = coffee.pass.reward;
    // Reward-ready opened without params shows the client example: 9/10 + 2 stamps → new card 1/10.
    const ready = st === 'rewardReady' && !q.has('c'), ck = ready ? 'leon' : Object.hasOwn(D.stampScans, q.get('c') || '') ? q.get('c') : 'anna', [cname, cid, filled] = D.stampScans[ck];
    // Multiple stamps only when the program allows it AND the user has permission (client: team permissions still apply).
    const maxPer = coffee.multi.on && ctx.can('multiStamp') ? (coffee.multi.max === 'Unlimited' ? Infinity : coffee.multi.max) : 1;
    const added = Math.min(Math.max(1, parseInt(ready ? '2' : q.get('n'), 10) || 1), st === 'rewardReady' ? Infinity : maxPer);
    // Extra stamps carry over to the new card; a very large multi-stamp scan can complete more than one card.
    const earned = Math.floor((filled + added) / total), carry = (filled + added) % total;
    const stampPass = n => pass({ type: 'stamp', name: coffee.name, reward, total, filled: n }).replace('<div class="pass-qr">', '<div class="pass-qr" style="display:none">');
    // A scan of a customer with an available gift shows it (client: "The employee sees that the customer has an available gift").
    const giftNote = id => { const a = D.gifts.filter(x => x.cid === id && x.status === 'Available'); return a.length ? callout('info', 'Customer has an available gift', `${a.map(x => `${esc(x.name)} · expires ${x.exp}`).join(' · ')}. <a class="link" href="${ctx.nav(`${ctx.page('scanner-gift')}?g=${a[0].id}`)}">Open gift ${icon('arrowRight', 'sm')}</a>`, 'gift') : ''; };
    let tail = '';
    if (st === 'idle') main = idlePanel();
    if (st === 'confirmed') main = `<div class="stack"><div class="card reveal-up" style="padding:20px 22px;border-color:color-mix(in srgb,var(--color-mint) 40%,transparent);background:linear-gradient(120deg,var(--color-mint-soft),var(--color-surface) 60%)"><div class="row" style="align-items:flex-start;gap:16px"><span class="success-burst">${icon('check', 'lg')}</span><div><b style="font-family:var(--font-display);font-size:20px;color:#13845B">Confirmed</b><p style="margin-top:2px;font-size:15px">${added > 1 ? added + ' stamps' : 'Stamp'} added <b>(${filled + added}/${total})</b>.</p><p class="hint" style="margin-top:6px">Wallet pass update: not sent — the Apple/Google Wallet integration is not connected in this environment.</p></div></div></div>${idlePanel()}</div>`;
    if (st === 'stamp') main = `<section class="card reveal-up">${custHead(cname, `${cid} · ${coffee.name} (Stamp Card)`)}<div class="card-body stack">
      <div class="grid" style="grid-template-columns:240px 1fr;gap:20px;align-items:center"><div data-stamp-pass>${stampPass(filled)}</div><div>${kv([['Stamps', `<span data-stamps>${filled}</span> / ${total}`, true], ['Reward', reward]])}
        ${maxPer > 1 ? `<div class="option-row" style="margin-top:12px" data-qty-row><div><b>Stamps to add</b><small>${maxPer === Infinity ? 'No limit per scan' : `Up to ${maxPer} per scan`}</small></div><div class="row" style="gap:8px"><button class="icon-btn" data-qty="-1" aria-label="Fewer stamps">−</button><input class="input" type="number" min="1" ${maxPer === Infinity ? '' : `max="${maxPer}"`} value="1" aria-label="Stamps to add" data-qty-in style="width:72px;text-align:center"><button class="icon-btn" data-qty="1" aria-label="More stamps">${icon('plus', 'sm')}</button></div></div>` : ''}
        <button class="btn btn-primary btn-lg btn-block" style="margin-top:16px" data-add-stamp>${icon('stamp', 'sm')}Add <span data-qty-label>stamp</span></button></div></div>
      ${giftNote(cid)}${ck === 'anna' ? `<div><div class="label" style="margin-bottom:10px">${icon('gift', 'sm')} Available rewards</div><div class="option-row"><div class="row"><span class="feed-ic" style="background:var(--color-highlight-soft);color:#9A7300">${icon('coffee', 'sm')}</span><b>${reward}</b></div><button class="btn btn-ink btn-sm" data-toast="Reward redeemed">Redeem Reward</button></div></div>` : ''}</div></section>`;
    // Card completion: reward becomes available; redeeming is an explicit tap; extra stamps carry over to the new card.
    if (st === 'rewardReady') {
      main = `<section class="card reveal-up">${custHead(cname, `${cid} · ${coffee.name} (Stamp Card)`)}<div class="card-body stack">
      ${callout('info', 'Reward ready', `The card is complete. ${reward} is now available.`, 'gift')}
      <div class="grid" style="grid-template-columns:240px 1fr;gap:20px;align-items:center"><div data-stamp-pass>${stampPass(total)}</div><div>${kv([['Stamps added', '+' + added], ['Card', `${total} / ${total} · completed`], ['Reward', earned > 1 ? `${earned} × ${reward}` : reward, true], ['Status', `<span data-rw-status>${badge('Available', 'green')}</span>`], ['New card', `${carry} / ${total}${carry ? ' · extra stamps carried over' : ''}`]])}
        <button class="btn btn-ink btn-lg btn-block" style="margin-top:16px" data-redeem-ready>${icon('gift', 'sm')}Redeem Reward</button></div></div></div></section>`;
    }
    // Points program: currency + earning rule come from the program — never chosen during the scan.
    const pp = D.programs.find(p => p.id === 'points'), cfg = pp.cfg, pk = Object.hasOwn(D.pointsScans, q.get('c') || '') ? q.get('c') : 'vera', [pname, pid, bal] = D.pointsScans[pk];
    const next = b => cfg.rewards.find(([, need]) => need > b);
    const ptsPass = b => { const n = next(b), prev = [...cfg.rewards].reverse().find(([, need]) => need <= b); return pass({ type: 'points', name: pp.name, balance: b + ' pts', nextReward: n && n[0], needed: n && String(n[1] - b), pct: n ? Math.round((b - (prev ? prev[1] : 0)) / (n[1] - (prev ? prev[1] : 0)) * 100) : 100 }); };
    // Client's manual-credit view, in the client's order.
    const creditRows = (amount, r) => { const nb = bal + r.pts, n = next(nb); return kv([['Customer', pname], ['Program', pp.name], ['Currency', cfg.currency], ['Current balance', bal + ' points'], ['Purchase amount', cfg.method === 'Manual' ? `${(amount || 0).toFixed(2)} ${cfg.currency}` : 'Fixed points per visit'], ['New points', '+' + r.pts, true], ['New balance', nb + ' points', true], ['Next reward', n ? `${n[0]} at ${n[1]} points` : 'All rewards reached'], ['Points still required', n ? (n[1] - nb) + ' points' : '—']]); };
    if (st === 'points') {
      const manual = cfg.method === 'Manual', r0 = manual ? g.calcPoints(7.5, cfg) : { pts: cfg.perVisit };
      main = `<section class="card reveal-up">${custHead(pname, `${pid} · ${pp.name} (Points Program)`)}<div class="card-body stack">
      ${manual ? field({ label: `Purchase amount (${cfg.currency})`, input: `<div class="input-wrap"><input class="input big-input focus" type="number" min="0" step="0.01" value="7.50" aria-label="Purchase amount" data-amount></div>`, hint: `Earning rule: ${cfg.basis} ${cfg.currency} = ${cfg.pts} points · ${cfg.rounding.toLowerCase()}` }) : ''}
      <div data-pt-kv>${creditRows(7.5, r0)}</div><p class="hint" data-pt-note hidden></p>
      <div class="row wrap"><button class="btn btn-primary btn-lg" style="flex:1" data-credit>${icon('coins', 'sm')}Credit <span data-cr>${r0.pts}</span> points</button><a class="btn btn-ghost btn-lg" href="${ctx.page('scanner-points-redeem')}?c=${pk}">${icon('gift', 'sm')}Redeem points</a></div></div></section>`;
    }
    // Redeem points: employee picks an available reward; points are deducted only after the tap.
    if (st === 'pointsRedeem') {
      const avail = cfg.rewards.map((r, i) => [...r, i]).filter(([, need]) => need <= bal), first = avail[0];
      const rdRows = r => kv([['Customer', pname], ['Current balance', bal + ' points'], ['Reward', r ? `${r[0]} · −${r[1]} points` : '—', true], ['New balance', r ? (bal - r[1]) + ' points' : '—', true]]);
      main = `<section class="card reveal-up">${custHead(pname, `${pid} · ${pp.name} (Points Program)`)}<div class="card-body">
      <div class="grid" style="grid-template-columns:240px 1fr;gap:20px;align-items:start"><div data-pts-pass>${ptsPass(bal)}</div><div class="stack">
        <div class="label">${icon('gift', 'sm')} Choose a reward</div>
        <div class="stack" style="gap:10px" data-rw-pick>${cfg.rewards.map(([n, need], i) => { const ok = need <= bal; return `<button class="type-card ${first && first[2] === i ? 'on' : ''}" ${ok ? `data-select="${i}"` : 'disabled style="opacity:.5;cursor:not-allowed"'}><b>${n}</b><small>${need} points${ok ? '' : ` · ${need - bal} more needed`}</small></button>`; }).join('')}</div>
        <div data-rd-kv>${rdRows(first)}</div>
        ${first ? `<button class="btn btn-ink btn-lg btn-block" data-redeem-pts>${icon('gift', 'sm')}Redeem reward</button>` : `<div class="lock-overlay">${icon('info')}No reward available yet.</div>`}
        <a class="link" data-rd-log href="${ctx.page('points-transactions')}" hidden>View transaction log ${icon('arrowRight', 'sm')}</a></div></div></div></section>`;
      g.__rd = { rdRows };
    }
    if (st === 'tier') main = `<section class="card reveal-up">${custHead('Anna Schmidt', 'C-10002 · Rewards Club (Tier Program)')}<div class="card-body stack">${offer()}
      <div class="grid g3">${[['Current tier', 'Member', 'layers'], ['Benefits', 'Welcome drink', 'gift'], ['Next tier', '3 visits to Silver', 'trophy']].map(([k, v, i]) => `<div class="setup-item"><small>${icon(i, 'sm')} ${k}</small><b>${v}</b></div>`).join('')}</div>
      <div><div class="row between hint"><span>Member</span><span>Silver · 10 visits</span></div><div class="mini-prog"><i style="--w:70%"></i></div></div>
      <button class="btn btn-primary btn-lg btn-block" data-toast="Visit recorded">${icon('footprints', 'sm')}Record visit</button></div></section>`;
    if (st === 'membership') main = `<section class="card reveal-up">${custHead('Anna Schmidt', 'C-10002 · VIP Member (Membership Card)')}<div class="card-body stack">${offer()}
      <div class="grid g3">${[['Benefit', '10% off every visit', 'crown'], ['Discount to apply', '<span style="font-family:var(--font-display);font-size:26px">10%</span>', 'percent'], ['Member since', 'Jan 21, 2026', 'calendar']].map(([k, v, i]) => `<div class="setup-item"><small>${icon(i, 'sm')} ${k}</small><b>${v}</b></div>`).join('')}</div>
      <button class="btn btn-primary btn-lg btn-block" data-toast="Visit recorded">${icon('footprints', 'sm')}Record visit</button></div></section>`;
    // Gift scan (client): the employee sees the available gift; it is never redeemed by the scan itself — only after an explicit confirmation.
    if (st === 'gift') {
      const G = g.GIFTS, gf = G.byId(q.get('g')) || G.byId('g1'), red = gf.red;
      const state = { Available: ['info', 'Customer has an available gift', 'Scanning never redeems a gift. Check the conditions with the customer, then confirm the redemption.', 'gift'], Scheduled: ['warn', 'Gift scheduled', `Available from ${gf.on}. It cannot be redeemed yet.`], Expired: ['warn', 'Gift expired', `Expired on ${gf.exp}. It cannot be redeemed.`], Cancelled: ['warn', 'Gift cancelled', 'This gift was cancelled and cannot be redeemed.'], Redeemed: ['warn', 'Already redeemed', `Redeemed ${red ? red.date + ' by ' + red.by + ' at ' + esc(red.loc) : ''}. This gift can only be redeemed once.`] }[gf.status];
      const giftRows = () => kv([['Gift', esc(gf.name), true], ['Description', esc(gf.desc) || '—'], ['Status', `<span data-gs-status>${status(gf.status)}</span>`], ['Activation date', gf.on], ['Expiration date', gf.exp], ...G.optRows(gf), ['Terms and conditions', esc(gf.terms) || '—'], ['Redemption date', `<span data-gs-date>${red ? red.date : '—'}</span>`], ['Redeemed by', `<span data-gs-by>${red ? red.by : '—'}</span>`], ['Redemption location', `<span data-gs-loc>${red ? esc(red.loc) : '—'}</span>`]]);
      main = `<section class="card reveal-up">${custHead(esc(gf.customer), `${gf.cid} · Gift · ${esc(G.srcLabel(gf))}`)}<div class="card-body stack">
        <div data-gs-callout>${callout(...state)}</div>${giftRows()}
        <button class="btn btn-ink btn-lg btn-block" data-open="giftConfirm" data-gs-redeem ${gf.status === 'Available' ? '' : 'disabled'}>${icon('gift', 'sm')}Redeem gift</button>
        <p class="hint" data-gs-wallet hidden>Wallet pass update: not sent — the Apple/Google Wallet integration is not connected in this environment.</p>
        <a class="link" data-gs-log hidden href="${ctx.nav(`${ctx.link('46-')}?tab=log&redeemed=${gf.id}`)}">View activity log ${icon('arrowRight', 'sm')}</a></div></section>`;
      tail = `${modal({ id: 'giftConfirm', open: false, title: 'Redeem this gift?', sub: 'The gift is redeemed only after you confirm.', body: kv([['Customer', esc(gf.customer)], ['Gift', esc(gf.name), true], ['Redemption', gf.opts.multi ? 'Multiple — stays available until it expires' : 'Single — cannot be redeemed again'], ['Location', esc(D.locations[0])]]), foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-ink" data-close data-gs-confirm>${icon('check', 'sm')}Confirm redemption</button>` })}`;
      g.__gift = gf;
    }
    const withAnna = ['confirmed', 'points', 'tier', 'membership'].includes(st);
    return { nav: 'QR Scanner', html: `${pageHead({ eyebrow: `${icon('qr', 'sm')} Scanner`, title: 'QR <span class="hl">Scanner</span>', sub: 'Scan a customer’s wallet pass, confirm the action, and the pass updates.', actions: `<a class="btn btn-ghost" href="${ctx.link('34-')}">${icon('qr', 'sm')}Printable QR codes</a>` })}
      <div class="grid" style="grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);align-items:start">${main}${feed(ctx, withAnna)}</div>${tail}`, after() {
        const go = pre => location.href = ctx.nav(ctx.link(pre));
        const sc = document.querySelector('[data-scan]'); if (sc) sc.onclick = () => go('29-');
        const f = document.querySelector('[data-find]'); if (f) f.onclick = () => { const v = document.querySelector('[data-code]').value.trim(); if (/^BNC-/i.test(v)) go('29-'); else g.toast('Enter a pass code like BNC-DEMO1000'); };
        const pk = document.querySelector('[data-pick]'); if (pk) pk.onchange = () => { if (pk.value.includes('— Gift')) { location.href = ctx.nav(ctx.page('scanner-gift')); return; } const [pre, qs] = (['', '29-', '29-?c=leon', '31-', '32-', '33-'][pk.selectedIndex] || '28-').split('?'); location.href = ctx.nav(ctx.link(pre) + (qs ? '?' + qs : '')); };
        document.querySelectorAll('[data-new-scan]').forEach(b => b.onclick = () => go('28-'));
        let qty = 1; const qi = document.querySelector('[data-qty-in]'), ql = document.querySelector('[data-qty-label]');
        const setQty = v => { qty = Math.max(1, Math.min(maxPer, parseInt(v, 10) || 1)); if (qi) qi.value = qty; ql.textContent = qty > 1 ? qty + ' stamps' : 'stamp'; };
        document.querySelectorAll('[data-qty]').forEach(b => b.onclick = () => setQty(qty + +b.dataset.qty)); if (qi) qi.onchange = () => setQty(qi.value);
        const as = document.querySelector('[data-add-stamp]'); if (as) as.onclick = () => {
          [...document.querySelectorAll('[data-stamp-pass] .stamp:not(.on)')].slice(0, qty).forEach(x => x.classList.add('on'));
          document.querySelector('[data-stamps]').textContent = Math.min(total, filled + qty); as.disabled = true;
          const qs = `?c=${ck}&n=${qty}`; setTimeout(() => location.href = ctx.nav((filled + qty >= total ? ctx.page('scanner-stamp-reward-ready') : ctx.link('30-')) + qs), 650);
        };
        const rr = document.querySelector('[data-redeem-ready]'); if (rr) rr.onclick = () => {
          document.querySelector('[data-rw-status]').innerHTML = badge('Redeemed', 'blue'); document.querySelector('[data-stamp-pass]').innerHTML = stampPass(carry);
          rr.disabled = true; rr.innerHTML = `${icon('check', 'sm')}Reward redeemed`; g.toast(`Reward redeemed — new card ${carry}/${total}`);
        };
        const am = document.querySelector('[data-amount]'), cr = document.querySelector('[data-credit]');
        if (cr) {
          const calc = () => am ? g.calcPoints(parseFloat(am.value), cfg) : { pts: cfg.perVisit };
          const upd = () => { const a = am ? parseFloat(am.value) || 0 : 0, r = calc(), note = document.querySelector('[data-pt-note]');
            document.querySelector('[data-pt-kv]').innerHTML = creditRows(a, r); document.querySelector('[data-cr]').textContent = r.pts;
            note.hidden = !(r.below || r.capped); note.textContent = r.below ? `Below the minimum purchase amount (${cfg.min} ${cfg.currency}) — no points.` : r.capped ? `Capped at the maximum of ${cfg.max} points per transaction.` : ''; cr.disabled = r.pts === 0; };
          if (am) am.oninput = upd; upd();
          cr.onclick = () => { const r = calc(); location.href = ctx.nav(`${ctx.page('points-transactions')}?new=credit&c=${pk}&a=${am ? parseFloat(am.value) || 0 : 0}&p=${r.pts}`); };
        }
        const gc = document.querySelector('[data-gs-confirm]'); if (gc) {
          const gf = g.__gift, btn = document.querySelector('[data-gs-redeem]'), set = (s, h) => document.querySelector(s).innerHTML = h; let times = 0;
          gc.onclick = () => {
            if (btn.disabled) { g.toast('Already redeemed — this gift can only be redeemed once.', 'info'); return; } // single-use: a second redemption is blocked
            times++; set('[data-gs-date]', 'Just now'); set('[data-gs-by]', g.GIFTS.me(ctx)); set('[data-gs-loc]', esc(D.locations[0]));
            document.querySelector('[data-gs-wallet]').hidden = false; document.querySelector('[data-gs-log]').hidden = false;
            if (gf.opts.multi) { set('[data-gs-callout]', callout('info', 'Gift redeemed', `Redeemed ${times} time${times === 1 ? '' : 's'} on this visit. Multiple redemption — it stays available until ${gf.exp}.`, 'checkCircle')); g.toast(`${gf.name} redeemed`); return; }
            set('[data-gs-status]', status('Redeemed')); set('[data-gs-callout]', callout('info', 'Gift redeemed', 'Status changed to Redeemed. This gift can only be redeemed once.', 'checkCircle'));
            btn.disabled = true; btn.removeAttribute('data-open'); btn.innerHTML = `${icon('check', 'sm')}Gift redeemed`; g.toast(`${gf.name} redeemed for ${gf.customer}`);
          };
        }
        const rd = document.querySelector('[data-redeem-pts]'); if (rd) {
          let pick = cfg.rewards.findIndex(([, need]) => need <= bal);
          document.querySelector('[data-rw-pick]').addEventListener('typechange', e => { pick = +e.detail; document.querySelector('[data-rd-kv]').innerHTML = g.__rd.rdRows(cfg.rewards[pick]); });
          rd.onclick = () => { const [n, need] = cfg.rewards[pick];
            document.querySelector('[data-pts-pass]').innerHTML = ptsPass(bal - need); document.querySelector('[data-rd-kv]').innerHTML = kv([['Customer', pname], ['Reward', n + ' · redeemed', true], ['Points deducted', '−' + need], ['New balance', (bal - need) + ' points', true]]);
            document.querySelectorAll('[data-rw-pick] .type-card').forEach(c => c.disabled = true); rd.disabled = true; rd.innerHTML = `${icon('check', 'sm')}Reward redeemed`;
            const log = document.querySelector('[data-rd-log]'); log.href += `?new=redeem&c=${pk}&r=${pick}`; log.hidden = false; g.toast(`${n} redeemed — ${need} points deducted`); };
        }
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
    // Gifts assigned to this customer (manual gift: client "open a customer profile and manually assign a gift"); ?new=gift = the one just assigned.
    const G = g.GIFTS, gifts = G.all(ctx).filter(x => x.cid === 'C-10001'), fresh = gifts.find(x => x.fresh), avail = 2 + gifts.filter(x => x.status === 'Available').length;
    const st = [['Number of scans', '<span data-count="12">12</span>', 'scan'], ['Last visit', 'Oct 21, 2026', 'calendar'], ['Available rewards', `<span data-count="${avail}">${avail}</span>`, 'gift']];
    const giftSub = x => `gift · ${x.status === 'Scheduled' ? 'activates ' + x.on : x.status === 'Redeemed' ? 'redeemed ' + x.red.date : 'expires ' + x.exp}`;
    const gm = modal({ id: 'gift', open: ctx.opts.modal === 'gift', wide: true, title: 'Assign gift', sub: 'Anna Schmidt · C-10001 — the gift appears on the customer’s account and becomes redeemable by QR scan.', body: G.giftForm(), foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-assign-gift>${icon('gift', 'sm')}Assign gift</button>` });
    return { nav: 'Customers', title: 'Anna Schmidt', after() {
        const read = G.wireGiftForm(document.querySelector('[data-modal="gift"] [data-gift-form]'));
        document.querySelector('[data-assign-gift]').onclick = () => { const p = read(); if (p) location.href = ctx.nav(`${ctx.link('37-')}?new=gift&${p}`); };
      }, html: `${pageHead({ eyebrow: crumb('Customers', ctx.link('35-')) + 'Anna Schmidt', title: `<span class="row" style="gap:16px"><span class="avatar round" style="width:60px;height:60px;font-size:20px">AS</span><span>Anna <span class="hl">Schmidt</span></span></span>`, sub: `Customer ID <span class="mono">C-10001</span>`, actions: `<button class="btn btn-primary" data-open="gift">${icon('gift', 'sm')}Assign gift</button>` })}
      ${fresh ? `<div class="reveal-up" style="margin-bottom:18px" data-gift-assigned>${callout('info', 'Gift assigned', `${esc(fresh.name)} — ${fresh.status}${fresh.status === 'Scheduled' ? ' from ' + fresh.on : ''}. Customer notification not delivered: app, email and wallet notifications are not connected in this environment. <a class="link" href="${ctx.nav(`${ctx.link('45-')}?${fresh.query}&new=gift`)}">View in Rewards ${icon('arrowRight', 'sm')}</a>`, 'checkCircle')}</div>` : ''}
      <div class="grid g3">${st.map(([l, v, i], n) => `<div class="card hover stat reveal-up ${n === 0 ? 'feature' : ''}"><div class="lbl">${l}<span class="ico">${icon(i, 'sm')}</span></div><div class="val">${v}</div></div>`).join('')}</div>
      <div class="grid g2" style="margin-top:18px">
        ${card({ title: 'Profile', icon: 'badge', cls: 'reveal-up', body: U.setup([['Email', 'anna.schmidt0@example.com'], ['Phone', '+49 151 5196093'], ['Birthday', '<span class="faint">—</span>'], ['Joined', 'Jan 6, 2026']]) })}
        ${card({ title: 'Memberships', icon: 'wallet', sub: 'Programs, current tier and balances.', cls: 'reveal-up', body: `<div class="option-row" style="display:block"><div class="row between"><div class="row"><span class="feed-ic" style="background:var(--color-accent-soft);color:var(--color-accent)">${icon('stamp', 'sm')}</span><div><b>Coffee Card</b><small>2 / 10 stamps</small></div></div><span class="mono faint" style="font-size:12px">Pass BNC-DEMO1000</span></div><div class="mini-prog"><i style="--w:20%"></i></div></div><div class="option-row" style="display:block;margin-top:10px"><div class="row between"><div class="row"><span class="feed-ic" style="background:var(--color-highlight-soft);color:#9A7300">${icon('coins', 'sm')}</span><div><b>Coffee Rewards</b><small>120 points · next: Free Dessert at 250</small></div></div><a class="link" href="${ctx.page('points-transactions')}">Transactions ${icon('arrowRight', 'sm')}</a></div></div>` })}
        ${card({ title: 'Rewards', icon: 'gift', cls: 'reveal-up', body: `<div class="stack" style="gap:10px" data-profile-rewards>${[['1 Free Coffee', 'stamp card', 'stamp', 'Available'], ['1 Free Coffee', 'voucher', 'ticket', 'Available'], ...gifts.map(x => [esc(x.name), giftSub(x), 'gift', x.status, x.fresh])].map(([r, s, i, v, f]) => `<div class="option-row" ${f ? 'data-fresh style="background:var(--color-mint-soft)"' : ''}><div class="row"><span class="feed-ic" style="background:var(--color-highlight-soft);color:#9A7300">${icon(i, 'sm')}</span><div><b>${r}</b><small>${s}</small></div></div>${status(v)}</div>`).join('')}</div>` })}
        ${card({ title: 'Notes', icon: 'edit', cls: 'reveal-up', body: `<div class="stack" style="gap:12px">${textarea('Prefers oat milk.')}<div><button class="btn btn-primary btn-sm" data-toast="Notes saved">Save notes</button></div></div>` })}
      </div>
      <div style="margin-top:18px">${card({ title: 'Visit history', icon: 'clock', actions: badge('12 visits', 'outline'), cls: 'reveal-up', body: `<div class="timeline">${hist.map(h => `<div class="tl-item"><span><b style="font-weight:600">Stamp added</b> <span class="faint">· Coffee Card</span></span><span class="muted">${h}</span></div>`).join('')}</div>` })}</div>${gm}` };
  };

  /* ================= POINTS TRANSACTION LOG ================= */
  // Client: every point credit is recorded with these columns. A row arriving via ?new= is the transaction just confirmed in the scanner.
  S.pointsLog = ctx => {
    const q = new URLSearchParams(location.search), pp = D.programs.find(p => p.id === 'points'), cfg = pp.cfg, me = ctx.owner ? 'Sam Owner' : 'Mia Manager';
    const pk = Object.hasOwn(D.pointsScans, q.get('c') || '') ? q.get('c') : 'vera', [pname, , bal] = D.pointsScans[pk];
    let fresh = null;
    if (q.get('new') === 'credit') { const a = parseFloat(q.get('a')) || 0, p = Math.max(0, parseInt(q.get('p'), 10) || 0); fresh = [pname, pp.name, cfg.currency, a ? a.toFixed(2) : '—', '+' + p, bal, bal + p, me, 'Sample Street 1, Berlin', 'Just now', 'Completed']; }
    if (q.get('new') === 'redeem') { const r = cfg.rewards[parseInt(q.get('r'), 10)]; if (r) fresh = [pname, pp.name, cfg.currency, '—', `−${r[1]} · ${r[0]}`, bal, bal - r[1], me, 'Sample Street 1, Berlin', 'Just now', 'Completed']; }
    const rows = fresh ? [fresh, ...D.pointsLog] : D.pointsLog;
    const head = ['Customer', 'Program', 'Currency', 'Purchase amount', 'Points awarded', 'Balance before', 'Balance after', 'Employee', 'Location', 'Date / time', 'Status'];
    const table = `<div class="table-wrap"><table class="t"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr ${fresh && i === 0 ? 'data-fresh style="background:var(--color-mint-soft)"' : ''}><td><div class="person">${ini(r[0])}${esc(r[0])}</div></td><td>${r[1]}</td><td class="mono">${r[2]}</td><td class="num">${r[3]}</td><td class="num"><b>${r[4]}</b></td><td class="num">${r[5]}</td><td class="num">${r[6]}</td><td>${r[7]}</td><td class="muted">${r[8]}</td><td class="muted" style="white-space:nowrap">${r[9]}</td><td>${badge(r[10], 'green')}</td></tr>`).join('')}</tbody></table></div>`;
    return { nav: 'Loyalty Programs', title: 'Points transactions', html: `${pageHead({ eyebrow: crumb('Loyalty Programs', ctx.link('03-')) + crumb(pp.name, ctx.link('13-')) + 'Transactions', title: 'Points <span class="hl">transactions</span>', sub: `${pp.name} · every credit and redemption, with who, where and when.` })}
      ${fresh ? `<div style="margin-bottom:18px">${callout('info', 'Transaction saved', `${esc(pname)}: ${fresh[4]} points · new balance ${fresh[6]} points.`, 'checkCircle')}</div>` : ''}
      ${card({ title: 'Transaction log', icon: 'file', actions: badge(rows.length + ' transactions', 'outline'), body: null, cls: 'reveal-up', attrs: 'style="overflow:hidden"' }).replace('</section>', table + '</section>')}` };
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
