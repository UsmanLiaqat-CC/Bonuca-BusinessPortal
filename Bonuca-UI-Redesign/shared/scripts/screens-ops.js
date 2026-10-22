/* QR Scanner, Printable QR codes, Customers, Employees */
(function (g) {
  const U = g.UI, D = g.DATA, { icon, field, input, select, textarea, toggle, badge, status, card, callout, pass, qrPanel, pageHead, crumb, modal, kv, tabs, ini, esc } = U;
  const S = g.SCREENS = g.SCREENS || {};
  // Demo memory (this tab): customers added on Customers, plus redemptions made in the scanner so a re-scan shows them.
  const mem = { get: (k, d) => g.mem.get(k, d), set: (k, v) => g.mem.set(k, v) }, memAdd = (k, v) => mem.set(k, [...new Set([...mem.get(k, []), v])]);
  const custs = () => [...mem.get('customers-added', []), ...D.customers], custById = id => custs().find(c => c.id === id);
  const ME = { owner: 'Sam Owner', manager: 'Mia Manager', employee: 'Eli Employee' };

  /* ================= QR SCANNER ================= */
  // Every confirmed scan is written to the demo log so Recent scans shows it (customer name comes from the result card).
  function logScan(ctx, text, kind) { const el = document.querySelector('#content .card-title'), d = new Date(), h = d.getHours() % 12 || 12, tm = `${String(h).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() < 12 ? 'AM' : 'PM'}`; mem.set('scans-log', [[el ? el.textContent.trim() : '', text, tm, kind, ME[ctx.role]], ...mem.get('scans-log', [])].slice(0, 30)); }
  function feed(ctx, withAnna, max = ctx.has('recent-scans') && ctx.opts.state ? 3 : 10) {
    // Employees see their own scans only; owners/managers see the business feed with who scanned.
    const emp = ctx.role === 'employee', me = ME[ctx.role], base = (ctx.owner ? D.scansBase.slice(1) : D.scansBase.slice(0)).filter(s => !emp || s[4] === me);
    const logged = mem.get('scans-log', []).filter(x => !emp || x[4] === me), list = (logged.length ? [...logged, ...base] : withAnna ? [['Anna Schmidt', 'Stamp added · Coffee Card', ctx.owner ? '02:27 PM' : '02:29 PM', 'stamp', me], ...base] : base).slice(0, max);
    const ic = { points: ['coins', 'var(--color-highlight-soft)', '#9A7300'], visit: ['footprints', 'var(--color-accent-soft)', 'var(--color-accent)'], stamp: ['stamp', 'var(--color-mint-soft)', '#13845B'] };
    const all = max < 10 ? `<a class="link" href="${ctx.page('recent-scans')}">View all ${icon('arrowRight', 'sm')}</a>` : '';
    return card({ title: 'Recent scans', icon: 'clock', sub: emp ? 'Scanned by you.' : '', actions: badge('Live', 'green', true) + all, body: null, cls: 'reveal-up scan-feed', attrs: 'style="overflow:hidden"' }).replace('</section>', `<div>${list.map(([n, d, t, k, by], i) => { const [a, b, c] = ic[k]; return `<div class="list-row" style="${i === 0 && withAnna ? 'background:var(--color-mint-soft);animation:fadeUp .5s both' : ''}"><div class="row" style="min-width:0"><span class="feed-ic" style="background:${b};color:${c}">${icon(a, 'sm')}</span><div style="min-width:0"><b style="font-weight:600;font-size:14px">${n}</b><div class="hint" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d}${emp ? '' : ` · by ${by === me ? 'you' : by}`}</div></div></div><span class="faint" style="font-size:12px;white-space:nowrap">Oct 21 · ${t}</span></div>`; }).join('')}</div></section>`);
  }
  // Development pass picker: every scan result the prototype can show, as scanner states (each role numbers its own pages).
  const picks = [['Anna Schmidt — Coffee Card (Stamp Card)', 'stamp'], ['Leon Fischer — Coffee Card (Stamp Card)', 'stamp', 'c=leon'], ['Vera Conti — Coffee Rewards (Points Program)', 'points'], ['Anna Schmidt — Rewards Club (Tier Program)', 'tier'], ['Kemal Bianchi — Rewards Club (Tier Program)', 'tier', 'c=kemal'], ['Umut Martin — Rewards Club (Tier Program)', 'tier', 'c=umut'], ['Anna Schmidt — VIP Member (Membership Card)', 'membership'],
    ['Anna Schmidt — Free Coffee Campaign (One-time voucher)', 'voucher', 'c=anna'], ['Felix Bernard — Free Coffee Campaign (One-time voucher, already redeemed)', 'voucher', 'c=felix'], ['Kemal Fischer — Win-back reward (inactive 40 days)', 'winback', 'c=kemal'], ['Anna Schmidt — Gift (Free coffee)', 'gift'],
    ['Leon Fischer — Coffee Card (reward ready: 9/10 + 2 stamps)', 'rewardReady'], ['Vera Conti — Coffee Rewards (redeem points)', 'pointsRedeem', 'c=vera'], ['Kemal Fischer — VIP Member (Membership Card, inactive 40 days)', 'membership', 'c=kemal'],
    ...['g2', 'g3', 'g4', 'g6'].map(id => { const x = D.gifts.find(y => y.id === id); return [`${x.customer} — Gift (${x.name} · ${x.opts.multi ? 'multiple redemption' : x.status.toLowerCase()})`, 'gift', 'g=' + id]; })];
  const idlePanel = ctx => `<div class="stack">
    <button class="scan-hero reveal-up" data-scan><span class="frame"><i></i><i></i><i></i><i></i><i class="beam"></i>${icon('qr')}</span><div><h3>Scan</h3><p>Point the camera at a customer’s wallet pass.</p></div><span class="go">${icon('scan', 'lg')}</span></button>
    ${card({ title: 'Manual code entry', icon: 'hash', sub: 'Camera unavailable / development.', cls: 'reveal-up', body: `<div class="stack"><div class="row"><div class="input-wrap" style="flex:1">${icon('search')}<input class="input mono" placeholder="BNC-XXXXXXXX" data-code></div><button class="btn btn-ink" data-find>Find</button></div>
      <div class="callout dev" style="display:block"><b style="display:flex;gap:8px;align-items:center;margin-bottom:8px">${icon('zap', 'sm')}Development: pick a stored pass</b>${select(['Choose a customer…', ...picks.map(p => p[0])], 'Choose a customer…', 'data-pick')}</div></div>` })}
  </div>`;
  // link = [href, limited]: employees get the limited Customer info, owners/managers the full profile.
  function custHead(name, sub, link) { return `<header class="card-head split ${link ? 'wrap' : ''}"><div class="row"><span class="avatar round" style="width:48px;height:48px;font-size:16px">${U.initials(name)}</span><div><div class="card-title" style="font-size:20px">${name}</div><div class="card-sub">${sub}</div></div></div><div class="row wrap" style="gap:4px">${link ? `<a class="btn btn-text btn-sm" href="${link[0]}" ${link[1] ? 'data-cust-info' : 'data-cust-profile'}>${icon('badge', 'sm')}${link[1] ? 'Customer info' : 'Customer profile'}</a>` : ''}<button class="btn btn-text btn-sm" data-new-scan>${icon('rotate', 'sm')}New scan</button></div></header>`; }
  // Win-back (client): the reward of the customer's inactivity stage is active; Redeem Reward marks it redeemed, records the visit and resets the inactivity timer.
  // Stages / on-off saved on Notifications › Win-back (demo memory 'winback-stages' / 'winback-on') override the seed: the highest stage reached by the inactive days.
  const wbStages = () => [...(mem.get('winback-stages', null) || D.stages)].sort((a, b) => a[0] - b[0]), wbOn = () => mem.get('winback-on', true) !== false;
  const wbReward = days => { const st = wbStages(); return (st.filter(([d]) => d <= days).pop() || st[0])[1]; };
  const wbRows = (key, done) => { const [n, , days] = D.winbackScans[key]; return kv([['Customer', esc(n)], ['Inactive for', `<span data-wb-days>${done ? 0 : days}</span> days`], ['Active reward', wbReward(days), true], ['Status', done ? badge('Redeemed', 'blue') : badge('Not redeemed', 'outline')], ...(done ? [['Last visit', 'Today · visit recorded']] : [])]); };
  // A redeemed win-back reward stays redeemed when the customer is scanned again (demo memory).
  const wbDone = key => mem.get('winback-redeemed', []).includes(key), wbKey = cid => Object.keys(D.winbackScans).find(k => D.winbackScans[k][1] === cid) || '';
  const offer = (key, profile = '') => { const done = wbDone(key); if (!wbOn()) return ''; return `<div class="offer-card" data-wb="${key}"><span class="confetti">🎁</span><div class="row" style="margin-bottom:10px"><span class="feed-ic" style="background:#fff;color:#C2410C">${icon('gift', 'sm')}</span><b style="font-family:var(--font-display);font-size:17px">Welcome back offer</b>${badge('Win-back', 'amber')}</div><div data-wb-kv>${wbRows(key, done)}</div><button class="btn btn-ink btn-block" style="margin-top:12px" data-wb-redeem data-scan-ok ${done ? 'disabled' : ''}>${done ? `${icon('check', 'sm')}Reward redeemed` : `${icon('gift', 'sm')}Redeem Reward`}</button>${profile ? `<a class="link" style="display:inline-flex;margin-top:12px" href="${profile}" data-wb-profile ${done ? '' : 'hidden'}>View customer profile ${icon('arrowRight', 'sm')}</a>` : ''}</div>`; };
  // Vouchers redeemed in this browser tab stay redeemed when the same voucher is scanned again (demo memory only).
  const VKEY = 'bonuca-vouchers-redeemed';
  const vMem = { get() { try { return JSON.parse(sessionStorage.getItem(VKEY) || '[]'); } catch (e) { return []; } }, add(k) { try { sessionStorage.setItem(VKEY, JSON.stringify([...new Set([...vMem.get(), k])])); } catch (e) { } } };

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
    const ready = st === 'rewardReady' && !q.has('c'), ck = ready ? 'leon' : Object.hasOwn(D.stampScans, q.get('c') || '') ? q.get('c') : 'anna', [cname, cid, filled0] = D.stampScans[ck], stampMem = mem.get('stamps', {}), filled = q.has('from') ? Math.max(0, parseInt(q.get('from'), 10) || 0) : Object.hasOwn(stampMem, ck) ? stampMem[ck] : filled0;
    // Multiple stamps only when the program allows it AND the user has permission (client: team permissions still apply).
    const maxPer = coffee.multi.on && ctx.can('multiStamp') ? (coffee.multi.max === 'Unlimited' ? Infinity : coffee.multi.max) : 1;
    const nRaw = Math.max(1, parseInt(ready ? '2' : q.get('n'), 10) || 1), added = st === 'rewardReady' ? Math.min(Math.max(nRaw, total - filled), total * 5) : Math.min(nRaw, maxPer);
    // Extra stamps carry over to the new card; a very large multi-stamp scan can complete more than one card.
    const earned = Math.floor((filled + added) / total), carry = (filled + added) % total;
    // Every result links to the customer: limited Customer info (employee, by its demo key when it has one) or the full profile.
    const ref = cid => Object.keys(D.custInfo).find(k => ciCid(k) === cid) || cid;
    const info = cid => ctx.can('customerDetails') ? [ctx.nav(`${ctx.link('37-')}?c=${cid}`), 0] : ctx.has('customer-info') ? [`${ctx.page('customer-info')}?c=${ref(cid)}`, 1] : null;
    const srDone = mem.get('stamp-rewards-redeemed', []).includes(cid), srw = D.rewards.find(r => r[1] === cname && r[2] === 'Stamp card · Coffee Card' && r[3] === 'Available');
    const stampPass = n => pass({ type: 'stamp', name: coffee.name, reward, total, filled: n }).replace('<div class="pass-qr">', '<div class="pass-qr" style="display:none">');
    const giftNote = id => { const a = [...mem.get('gifts-assigned', []), ...D.gifts].map(giftNow).filter(x => x.cid === id && x.status === 'Available'); return a.length ? callout('info', 'Customer has an available gift', `${a.map(x => `${esc(x.name)} · expires ${x.exp}`).join(' · ')}. <a class="link" href="${ctx.nav(`${ctx.scan('gift')}?g=${a[0].id}`)}">Open gift ${icon('arrowRight', 'sm')}</a>`, 'gift') : ''; };
    let tail = '';
    if (st === 'idle') main = idlePanel(ctx);
    // Confirmed: a points credit arrives as ?k=points&p= (roles without the transaction log), otherwise the stamp just added.
    const ptsOk = st === 'confirmed' && q.get('k') === 'points', ptsAdded = Math.max(0, parseInt(q.get('p'), 10) || 0), ptsBal = D.pointsScans[Object.hasOwn(D.pointsScans, q.get('c') || '') ? q.get('c') : 'vera'][2];
    if (st === 'confirmed') main = `<div class="stack"><div class="card reveal-up" data-scan-confirmed style="padding:20px 22px;border-color:color-mix(in srgb,var(--color-mint) 40%,transparent);background:linear-gradient(120deg,var(--color-mint-soft),var(--color-surface) 60%)"><div class="row" style="align-items:flex-start;gap:16px"><span class="success-burst">${icon('check', 'lg')}</span><div><b style="font-family:var(--font-display);font-size:20px;color:#13845B">Confirmed</b><p style="margin-top:2px;font-size:15px">${ptsOk ? `${ptsAdded} points credited <b>(${ptsBal + ptsAdded} points)</b>` : `${added > 1 ? added + ' stamps' : 'Stamp'} added <b>(${filled + added}/${total})</b>`}.</p>${ptsOk ? '<p class="hint" style="margin-top:6px">Saved to the points transaction history.</p>' : ''}<p class="hint" style="margin-top:6px">Wallet pass update: not sent — the Apple/Google Wallet integration is not connected in this environment.</p></div></div></div>${idlePanel(ctx)}</div>`;
    if (st === 'stamp') main = `<section class="card reveal-up">${custHead(cname, `${cid} · ${coffee.name} (Stamp Card)`, info(cid))}<div class="card-body stack">
      <div class="grid" style="grid-template-columns:240px 1fr;gap:20px;align-items:center"><div data-stamp-pass>${stampPass(filled)}</div><div>${kv([['Stamps', `<span data-stamps>${filled}</span> / ${total}`, true], ['Reward', reward]])}
        ${maxPer > 1 ? `<div class="option-row" style="margin-top:12px" data-qty-row><div><b>Stamps to add</b><small>${maxPer === Infinity ? 'No limit per scan' : `Up to ${maxPer} per scan`}</small></div><div class="row" style="gap:8px"><button class="icon-btn" data-qty="-1" aria-label="Fewer stamps">−</button><input class="input" type="number" min="1" ${maxPer === Infinity ? '' : `max="${maxPer}"`} value="1" aria-label="Stamps to add" data-qty-in style="width:72px;text-align:center"><button class="icon-btn" data-qty="1" aria-label="More stamps">${icon('plus', 'sm')}</button></div></div>` : ''}
        <button class="btn btn-primary btn-lg btn-block" style="margin-top:16px" data-add-stamp>${icon('stamp', 'sm')}Add <span data-qty-label>stamp</span></button></div></div>
      ${giftNote(cid)}${srw ? `<div><div class="label" style="margin-bottom:10px">${icon('gift', 'sm')} Rewards</div><div class="option-row" style="flex-wrap:wrap" data-sr-row><div class="row"><span class="feed-ic" style="background:var(--color-highlight-soft);color:#9A7300">${icon('coffee', 'sm')}</span><div><b>${reward}</b><small>From a completed ${coffee.name} · ${srw[4]}</small></div></div><div class="row" style="gap:10px"><span data-sr-status>${status(srDone ? 'Redeemed' : 'Available')}</span><button class="btn btn-ink btn-sm" data-stamp-redeem ${srDone ? 'disabled' : ''}>${srDone ? 'Redeemed' : 'Redeem Reward'}</button></div></div></div>` : ''}</div></section>`;
    // Card completion: reward becomes available; redeeming is an explicit tap; extra stamps carry over to the new card.
    if (st === 'rewardReady') {
      main = `<section class="card reveal-up">${custHead(cname, `${cid} · ${coffee.name} (Stamp Card)`, info(cid))}<div class="card-body stack">
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
    const manual = cfg.method === 'Manual', r0 = manual ? g.calcPoints(7.5, cfg) : { pts: cfg.max ? Math.min(cfg.perVisit, cfg.max) : cfg.perVisit };
    if (st === 'points') {
      main = `<section class="card reveal-up">${custHead(pname, `${pid} · ${pp.name} (Points Program)`, info(pid))}<div class="card-body stack">
      ${manual ? field({ label: `Purchase amount (${cfg.currency})`, input: `<div class="input-wrap"><input class="input big-input focus" type="number" min="0" step="0.01" value="7.50" aria-label="Purchase amount" data-amount></div>`, hint: `Earning rule: ${cfg.basis} ${cfg.currency} = ${cfg.pts} points · ${cfg.rounding.toLowerCase()} · ${cfg.min ? `min. purchase ${cfg.min} ${cfg.currency}` : 'no minimum purchase'} · ${cfg.max ? `max. ${cfg.max} points per transaction` : 'no maximum per transaction'}` }) : ''}
      <div data-pt-kv>${creditRows(7.5, r0)}</div><p class="hint" data-pt-note hidden></p>
      <div class="row wrap"><button class="btn btn-primary btn-lg" style="flex:1" data-credit>${icon('coins', 'sm')}Credit <span data-cr>${r0.pts}</span> points</button><a class="btn btn-ghost btn-lg" href="${ctx.nav(`${ctx.scan('pointsRedeem')}?c=${pk}`)}">${icon('gift', 'sm')}Redeem points</a></div></div></section>`;
    }
    // Redeem points: employee picks an available reward; points are deducted only after the tap.
    if (st === 'pointsRedeem') {
      const avail = cfg.rewards.map((r, i) => [...r, i]).filter(([, need]) => need <= bal), first = avail[0];
      const rdRows = r => kv([['Customer', pname], ['Current balance', bal + ' points'], ['Reward', r ? `${r[0]} · −${r[1]} points` : '—', true], ['New balance', r ? (bal - r[1]) + ' points' : '—', true]]);
      main = `<section class="card reveal-up">${custHead(pname, `${pid} · ${pp.name} (Points Program)`, info(pid))}<div class="card-body">
      <div class="grid" style="grid-template-columns:240px 1fr;gap:20px;align-items:start"><div data-pts-pass>${ptsPass(bal)}</div><div class="stack">
        <div class="label">${icon('gift', 'sm')} Choose a reward</div>
        <div class="stack" style="gap:10px" data-rw-pick>${cfg.rewards.map(([n, need], i) => { const ok = need <= bal; return `<button class="type-card ${first && first[2] === i ? 'on' : ''}" ${ok ? `data-select="${i}"` : 'disabled style="opacity:.5;cursor:not-allowed"'}><b>${n}</b><small>${need} points${ok ? '' : ` · ${need - bal} more needed`}</small></button>`; }).join('')}</div>
        <div data-rd-kv>${rdRows(first)}</div>
        ${first ? `<button class="btn btn-ink btn-lg btn-block" data-redeem-pts>${icon('gift', 'sm')}Redeem reward</button>` : `<div class="lock-overlay">${icon('info')}No reward available yet.</div>`}
        ${ctx.has('points-transactions') ? `<a class="link" data-rd-log data-no-state href="${ctx.page('points-transactions')}" hidden>View transaction log ${icon('arrowRight', 'sm')}</a>` : ''}</div></div></div></section>`;
      g.__rd = { rdRows };
    }
    // Tier program: each scan adds to the customer's visits / points / total spending and the customer levels up automatically
    // (client: "Silver → Wallet becomes silver"). Spending and manual points need the purchase amount in the program's currency (never chosen here).
    const cp = D.programs.find(p => p.id === 'club'), tc = cp.cfg, T = g.TIER, tk = Object.hasOwn(D.tierScans, q.get('c') || '') ? q.get('c') : 'anna', [tname, tid, tv] = D.tierScans[tk];
    const tierPassH = v => pass(T.pass(cp, v)).replace('<div class="pass-qr">', '<div class="pass-qr" style="display:none">');
    const tierRows = v => { const t = T.at(tc, v); return kv([['Current tier', t.name, true], ['Rewards &amp; benefits', t.benefit], [tc.req, T.fmt(tc, v)], ['Next tier', t.nx ? `${T.fmt(tc, t.left)} to ${t.nx[0]}` : 'Highest tier reached']]) + `<div class="mini-prog"><i style="--w:${t.pct}%"></i></div>`; };
    const tierAmt = tc.req === 'Total spending' || (tc.req === 'Points' && tc.method === 'Manual');
    if (st === 'tier') main = `<section class="card reveal-up">${custHead(tname, `${tid} · ${cp.name} (Tier Program)`, info(tid))}<div class="card-body stack">${wbKey(tid) ? offer(wbKey(tid)) : ''}
      <div class="card" data-tier-up hidden style="padding:20px 22px;border-color:color-mix(in srgb,var(--color-mint) 40%,transparent);background:linear-gradient(120deg,var(--color-mint-soft),var(--color-surface) 60%)"><div class="row" style="align-items:flex-start;gap:16px"><span class="success-burst">${icon('trophy', 'lg')}</span><div><b style="font-family:var(--font-display);font-size:20px;color:#13845B" data-tier-up-t></b><p style="margin-top:2px;font-size:15px">The wallet pass switches to the <b data-tier-up-n></b> tier colour.</p><p class="hint" style="margin-top:6px">Wallet pass update: not sent — the Apple/Google Wallet integration is not connected in this environment.</p></div></div></div>
      <div class="grid" style="grid-template-columns:240px 1fr;gap:20px;align-items:center"><div data-tier-pass>${tierPassH(tv)}</div><div><div data-tier-kv>${tierRows(tv)}</div>
        ${tierAmt ? `<div style="margin-top:14px">${field({ label: `Purchase amount (${tc.currency})`, input: `<input class="input big-input" type="number" min="0" step="0.01" placeholder="0.00" aria-label="Purchase amount" data-tier-amount>`, hint: tc.req === 'Points' ? `Earning rule: ${tc.basis} ${tc.currency} = ${tc.pts} points · ${tc.rounding.toLowerCase()}` : 'Added to the customer’s total spending.' })}</div>` : ''}
        <button class="btn btn-primary btn-lg btn-block" style="margin-top:16px" data-tier-go data-scan-ok ${tierAmt ? 'disabled' : ''}>${icon(tc.req === 'Points' ? 'coins' : 'footprints', 'sm')}<span data-tier-go-l>${tc.req === 'Points' ? `Credit ${tierAmt ? 0 : tc.perVisit} points` : 'Record visit'}</span></button>
        ${tk === 'anna' && ctx.can('customerDetails') ? `<a class="link" style="margin-top:12px;display:inline-flex" data-tier-profile hidden href="#">View customer profile ${icon('arrowRight', 'sm')}</a>` : ''}</div></div></div></section>`;
    // Membership: permanent benefit, no stamps — the scan identifies the member, shows the benefit and records a visit (for analytics and win-back).
    const vp = D.programs.find(p => p.id === 'vip'), mk = Object.hasOwn(D.memberScans, q.get('c') || '') ? q.get('c') : 'anna', [mname, mcid, mvis0, mlast0, msince] = D.memberScans[mk], mwk = wbKey(mcid), mvis = mvis0 + (mwk && wbDone(mwk) ? 1 : 0), mlast = mwk && wbDone(mwk) ? 'Today' : mlast0;
    if (st === 'membership') main = `<section class="card reveal-up">${custHead(mname, `${mcid} · ${vp.name} (Membership Card)`, info(mcid))}<div class="card-body stack">${mwk ? offer(mwk) : ''}
      <div class="grid g2">${[['Benefit', `<span style="font-family:var(--font-display);font-size:26px">${esc(vp.pass.benefit)}</span>`, 'crown'], ['Member since', msince, 'calendar'], ['Visits', `<span data-m-visits>${mvis}</span>`, 'footprints'], ['Last visit', `<span data-m-last>${mlast}</span>`, 'clock']].map(([k, v, i]) => `<div class="setup-item"><small>${icon(i, 'sm')} ${k}</small><b>${v}</b></div>`).join('')}</div>
      <button class="btn btn-primary btn-lg btn-block" data-m-visit data-scan-ok>${icon('footprints', 'sm')}Record visit</button>
      ${ctx.can('customerDetails') ? `<a class="link" data-m-profile hidden href="${ctx.nav(ctx.link('37-') + '?visit=vip' + (mk === 'anna' ? '' : '&c=' + mcid))}">View customer profile ${icon('arrowRight', 'sm')}</a>` : ''}</div></section>`;
    // One-time voucher scan: voucher name, valid dates, status → Redeem; a redeemed voucher shows the "Already redeemed" error.
    const vc = D.campaigns.find(c => c.id === 'freecoffee'), vk = Object.hasOwn(D.voucherScans, q.get('c') || '') ? q.get('c') : 'anna', [vn, vid, vs0, vOn] = D.voucherScans[vk];
    const vPass = s => pass({ type: 'voucher', name: vc.name, reward: vc.reward, from: vc.from, to: vc.to, status: s });
    const vRows = s => kv([['Voucher', vc.reward, true], ['Campaign', vc.name], ['Valid from', vc.from], ['Valid to', vc.to], ['Status', s === 'Redeemed' ? badge('Redeemed', 'blue') : badge('Available', 'green')]]);
    if (st === 'voucher') {
      const used = vs0 === 'Redeemed' || vMem.get().includes(vk), on = vs0 === 'Redeemed' ? vOn : 'today';
      main = `<section class="card reveal-up">${custHead(vn, `${vid} · ${vc.name} (One-time voucher)`, info(vid))}<div class="card-body stack">
      ${used ? `<div data-v-error>${callout('warn', 'Already redeemed', `This voucher was redeemed ${on === 'today' ? 'today' : 'on ' + on}. Each customer can claim and redeem it once — it is no longer valid.`, 'x')}</div>` : ''}
      <div class="grid" style="grid-template-columns:240px 1fr;gap:20px;align-items:center"><div data-v-pass>${vPass(used ? 'Redeemed' : 'Available')}</div><div><div data-v-kv>${vRows(used ? 'Redeemed' : 'Available')}</div>
        ${used ? `<button class="btn btn-ink btn-lg btn-block" style="margin-top:16px" disabled>${icon('x', 'sm')}Already redeemed</button>` : `<button class="btn btn-ink btn-lg btn-block" style="margin-top:16px" data-redeem-voucher data-scan-ok>${icon('ticket', 'sm')}Redeem</button>`}</div></div></div></section>`;
    }
    const wk = Object.hasOwn(D.winbackScans, q.get('c') || '') ? q.get('c') : 'kemal', [wn, wid] = D.winbackScans[wk];
    if (st === 'winback') main = `<section class="card reveal-up">${custHead(wn, `${wid} · Win-back automation`, info(wid))}<div class="card-body stack">${wbOn() ? offer(wk, ctx.can('customerDetails') ? ctx.nav(`${ctx.link('37-')}?c=${wk}&visit=winback`) : '') : callout('info', 'Win-back automation is off', 'No win-back reward is active for this customer. Turn it on in Notifications › Win-back automation.')}</div></section>`;
    // Gift scan (client): the employee sees the available gift; it is never redeemed by the scan itself — only after an explicit confirmation.
    if (st === 'gift') {
      const G = g.GIFTS, gf0 = mem.get('gifts-assigned', []).find(x => x.id === q.get('g')) || G.byId(q.get('g')) || G.byId('g1'), used = !gf0.opts.multi && mem.get('gifts-redeemed', {})[gf0.id], gf = used ? { ...gf0, status: 'Redeemed', red: used } : gf0, red = gf.red;
      const state = { Available: ['info', 'Customer has an available gift', 'Scanning never redeems a gift. Check the conditions with the customer, then confirm the redemption.', 'gift'], Scheduled: ['warn', 'Gift scheduled', `Available from ${gf.on}. It cannot be redeemed yet.`], Expired: ['warn', 'Gift expired', `Expired on ${gf.exp}. It cannot be redeemed.`], Cancelled: ['warn', 'Gift cancelled', 'This gift was cancelled and cannot be redeemed.'], Redeemed: ['warn', 'Already redeemed', `Redeemed ${red ? red.date + ' by ' + red.by + ' at ' + esc(red.loc) : ''}. This gift can only be redeemed once.`] }[gf.status];
      const giftRows = () => kv([['Gift', esc(gf.name), true], ['Description', esc(gf.desc) || '—'], ['Status', `<span data-gs-status>${status(gf.status)}</span>`], ['Activation date', gf.on], ['Expiration date', gf.exp], ...G.optRows(gf), ['Terms and conditions', esc(gf.terms) || '—'], ['Redemption date', `<span data-gs-date>${red ? red.date : '—'}</span>`], ['Redeemed by', `<span data-gs-by>${red ? red.by : '—'}</span>`], ['Redemption location', `<span data-gs-loc>${red ? esc(red.loc) : '—'}</span>`]]);
      main = `<section class="card reveal-up">${custHead(esc(gf.customer), `${gf.cid} · Gift · ${esc(G.srcLabel(gf))}`, info(gf.cid))}<div class="card-body stack">
        <div data-gs-callout>${callout(...state)}</div>${giftRows()}
        <button class="btn btn-ink btn-lg btn-block" data-open="giftConfirm" data-gs-redeem ${gf.status === 'Available' ? '' : 'disabled'}>${icon('gift', 'sm')}Redeem gift</button>
        <p class="hint" data-gs-wallet hidden>Wallet pass update: not sent — the Apple/Google Wallet integration is not connected in this environment.</p>
        ${ctx.has('rewards-surprise') ? `<a class="link" data-gs-log hidden href="${ctx.nav(`${ctx.link('46-')}?tab=log&redeemed=${gf.id}`)}">View activity log ${icon('arrowRight', 'sm')}</a>` : ''}</div></section>`;
      tail = `${modal({ id: 'giftConfirm', open: false, title: 'Redeem this gift?', sub: 'The gift is redeemed only after you confirm.', body: kv([['Customer', esc(gf.customer)], ['Gift', esc(gf.name), true], ['Redemption', gf.opts.multi ? 'Multiple — stays available until it expires' : 'Single — cannot be redeemed again'], ['Location', esc(D.locations[0])]]), foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-ink" data-close data-gs-confirm>${icon('check', 'sm')}Confirm redemption</button>` })}`;
      g.__gift = gf;
    }
    const withAnna = ['confirmed', 'points', 'tier', 'membership'].includes(st);
    return { nav: 'QR Scanner', html: `${pageHead({ eyebrow: `${icon('qr', 'sm')} Scanner`, title: 'QR <span class="hl">Scanner</span>', sub: 'Scan a customer’s wallet pass, confirm the action, and the pass updates.', actions: ctx.has('qr-codes') ? `<a class="btn btn-ghost" href="${ctx.page('qr-codes')}">${icon('qr', 'sm')}Printable QR codes</a>` : '' })}
      <div class="grid" style="grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);align-items:start">${main}${feed(ctx, withAnna)}</div>${tail}`, after() {
        const go = (state, qs) => location.href = ctx.nav(ctx.scan(state) + (qs ? '?' + qs : ''));
        const sc = document.querySelector('[data-scan]'); if (sc) sc.onclick = () => go('stamp');
        const f = document.querySelector('[data-find]'); if (f) f.onclick = () => { const v = document.querySelector('[data-code]').value.trim(); if (/^BNC-/i.test(v)) go('stamp'); else g.toast('Enter a pass code like BNC-DEMO1000'); };
        const pick = document.querySelector('[data-pick]'); if (pick) pick.onchange = () => { const to = picks[pick.selectedIndex - 1]; go(...(to ? to.slice(1) : ['idle'])); };
        document.querySelectorAll('[data-new-scan]').forEach(b => b.onclick = () => go('idle'));
        g.scanSuccess(document.querySelector('[data-scan-confirmed]'));
        let qty = 1; const qi = document.querySelector('[data-qty-in]'), ql = document.querySelector('[data-qty-label]');
        const setQty = v => { qty = Math.max(1, Math.min(maxPer, parseInt(v, 10) || 1)); if (qi) qi.value = qty; ql.textContent = qty > 1 ? qty + ' stamps' : 'stamp'; };
        document.querySelectorAll('[data-qty]').forEach(b => b.onclick = () => setQty(qty + +b.dataset.qty)); if (qi) qi.onchange = () => setQty(qi.value);
        const as = document.querySelector('[data-add-stamp]'); if (as) as.onclick = () => {
          [...document.querySelectorAll('[data-stamp-pass] .stamp:not(.on)')].slice(0, qty).forEach(x => x.classList.add('on'));
          document.querySelector('[data-stamps]').textContent = Math.min(total, filled + qty); as.disabled = true; g.successSound();
          logScan(ctx, `${qty > 1 ? qty + ' stamps' : 'Stamp'} added · ${coffee.name}`, 'stamp'); if (filled + qty < total) mem.set('stamps', { ...mem.get('stamps', {}), [ck]: filled + qty });
          const qs = `?c=${ck}&n=${qty}&from=${filled}`; setTimeout(() => location.href = ctx.nav((filled + qty >= total ? ctx.scan('rewardReady') : ctx.scan('confirmed')) + qs), 650);
        };
        const rv = document.querySelector('[data-redeem-voucher]'); if (rv) rv.onclick = () => {
          vMem.add(vk); logScan(ctx, 'Voucher redeemed', 'stamp'); document.querySelector('[data-v-pass]').innerHTML = vPass('Redeemed'); document.querySelector('[data-v-kv]').innerHTML = vRows('Redeemed');
          rv.disabled = true; rv.innerHTML = `${icon('check', 'sm')}Voucher redeemed`; g.toast('Voucher redeemed — it can’t be used again');
        };
        const sr = document.querySelector('[data-stamp-redeem]'); if (sr) sr.onclick = () => {
          memAdd('stamp-rewards-redeemed', cid); logScan(ctx, `Reward redeemed · ${coffee.name}`, 'stamp'); document.querySelector('[data-sr-status]').innerHTML = status('Redeemed'); sr.disabled = true; sr.textContent = 'Redeemed';
          g.toast(`${reward} redeemed for ${cname}`); g.scanSuccess(sr.closest('.card'));
        };
        // Membership visit (Record visit, or recorded by a redeemed win-back reward) — counted once per scan.
        const mv = document.querySelector('[data-m-visit]'), visit = () => { if (!mv || mv.disabled) return false; logScan(ctx, `Visit · ${vp.name}`, 'visit');
          document.querySelector('[data-m-visits]').textContent = mvis + 1; document.querySelector('[data-m-last]').textContent = 'Just now';
          mv.disabled = true; mv.innerHTML = `${icon('check', 'sm')}Visit recorded`; const pl = document.querySelector('[data-m-profile]'); if (pl) pl.hidden = false; return true; };
        document.querySelectorAll('[data-wb-redeem]').forEach(b => b.onclick = () => {
          const c = b.closest('[data-wb]'), l = c.querySelector('[data-wb-profile]'); if (!mv) logScan(ctx, 'Win-back reward redeemed', 'visit'); memAdd('winback-redeemed', c.dataset.wb); visit(); c.querySelector('[data-wb-kv]').innerHTML = wbRows(c.dataset.wb, true);
          b.disabled = true; b.innerHTML = `${icon('check', 'sm')}Reward redeemed`; if (l) l.hidden = false; g.toast('Reward redeemed · visit recorded · inactivity timer reset');
        });
        const rr = document.querySelector('[data-redeem-ready]'); if (rr) rr.onclick = () => { logScan(ctx, `Reward redeemed · ${coffee.name}`, 'stamp');
          document.querySelector('[data-rw-status]').innerHTML = badge('Redeemed', 'blue'); document.querySelector('[data-stamp-pass]').innerHTML = stampPass(carry);
          rr.disabled = true; rr.innerHTML = `${icon('check', 'sm')}Reward redeemed`; mem.set('stamps', { ...mem.get('stamps', {}), [ck]: carry }); g.toast(`Reward redeemed — new card ${carry}/${total}`); g.scanSuccess(document.querySelector('[data-stamp-pass]'));
        };
        const am = document.querySelector('[data-amount]'), cr = document.querySelector('[data-credit]');
        if (cr) {
          // the amount is normalised to cents so the displayed amount is exactly the amount that earned the points
          const amt = () => am ? Math.round((parseFloat(am.value) || 0) * 100) / 100 : 0;
          const calc = () => am ? g.calcPoints(amt(), cfg) : r0;
          const upd = () => { const a = amt(), r = calc(), note = document.querySelector('[data-pt-note]');
            document.querySelector('[data-pt-kv]').innerHTML = creditRows(a, r); document.querySelector('[data-cr]').textContent = r.pts;
            note.hidden = !(r.below || r.capped); note.textContent = r.below ? `Below the minimum purchase amount (${cfg.min} ${cfg.currency}) — no points.` : r.capped ? `Capped at the maximum of ${cfg.max} points per transaction.` : ''; cr.disabled = r.pts === 0; };
          if (am) am.oninput = upd; upd();
          cr.onclick = () => { const r = calc(); logScan(ctx, `Points credited · +${r.pts} pts · ${pp.name}`, 'points'); g.successSound(); location.href = ctx.nav(ctx.has('points-transactions') ? `${ctx.page('points-transactions')}?new=credit&c=${pk}&a=${amt()}&p=${r.pts}` : `${ctx.scan('confirmed')}?k=points&c=${pk}&p=${r.pts}`); };
        }
        const tg = document.querySelector('[data-tier-go]'); if (tg) {
          const ta = document.querySelector('[data-tier-amount]');
          const delta = () => { const a = ta ? parseFloat(ta.value) || 0 : 0; return tc.req === 'Visits' ? 1 : tc.req === 'Points' ? (ta ? g.calcPoints(a, tc).pts : tc.perVisit) : +a.toFixed(2); };
          if (ta) ta.oninput = () => { const d = delta(); tg.disabled = !(d > 0); if (tc.req === 'Points') document.querySelector('[data-tier-go-l]').textContent = `Credit ${d} points`; };
          tg.onclick = () => { const d = delta(); if (!(d > 0)) return; logScan(ctx, `Visit · ${cp.name}`, 'visit'); const nv = +(tv + d).toFixed(2), was = T.at(tc, tv), now = T.at(tc, nv), up = now.i > was.i;
            document.querySelector('[data-tier-pass]').innerHTML = tierPassH(nv); document.querySelector('[data-tier-kv]').innerHTML = tierRows(nv);
            tg.disabled = true; if (ta) ta.disabled = true; tg.innerHTML = `${icon('check', 'sm')}${tc.req === 'Points' ? d + ' points credited' : 'Visit recorded'}`;
            if (up) { const b = document.querySelector('[data-tier-up]'); b.querySelector('[data-tier-up-t]').textContent = `Upgraded to ${now.name}`; b.querySelector('[data-tier-up-n]').textContent = now.name; b.hidden = false; }
            const pl = document.querySelector('[data-tier-profile]'); if (pl) { pl.href = ctx.nav(`${ctx.link('37-')}?visit=club&v=${nv}`); pl.hidden = false; }
            g.toast(up ? `Upgraded to ${now.name}` : tc.req === 'Points' ? `${d} points credited` : 'Visit recorded'); };
        }
        if (mv) mv.onclick = () => { if (visit()) g.toast('Visit recorded'); };
        const gc = document.querySelector('[data-gs-confirm]'); if (gc) {
          const gf = g.__gift, btn = document.querySelector('[data-gs-redeem]'), set = (s, h) => document.querySelector(s).innerHTML = h; let times = 0;
          gc.onclick = () => {
            if (btn.disabled) { g.toast('Already redeemed — this gift can only be redeemed once.', 'info'); return; } // single-use: a second redemption is blocked
            times++; logScan(ctx, `Gift redeemed · ${gf.name}`, 'stamp'); set('[data-gs-date]', 'Just now'); set('[data-gs-by]', g.GIFTS.me(ctx)); set('[data-gs-loc]', esc(D.locations[0]));
            ['[data-gs-wallet]', '[data-gs-log]'].forEach(s => { const e = document.querySelector(s); if (e) e.hidden = false; }); g.scanSuccess(btn.closest('.card'));
            if (gf.opts.multi) { set('[data-gs-callout]', callout('info', 'Gift redeemed', `Redeemed ${times} time${times === 1 ? '' : 's'} on this visit. Multiple redemption — it stays available until ${gf.exp}.`, 'checkCircle')); g.toast(`${gf.name} redeemed`); return; }
            mem.set('gifts-redeemed', { ...mem.get('gifts-redeemed', {}), [gf.id]: { date: g.GIFTS.fmtDate(g.GIFTS.TODAY), by: g.GIFTS.me(ctx), loc: D.locations[0] } });
            set('[data-gs-status]', status('Redeemed')); set('[data-gs-callout]', callout('info', 'Gift redeemed', 'Status changed to Redeemed. This gift can only be redeemed once.', 'checkCircle'));
            btn.disabled = true; btn.removeAttribute('data-open'); btn.innerHTML = `${icon('check', 'sm')}Gift redeemed`; g.toast(`${gf.name} redeemed for ${gf.customer}`);
          };
        }
        const rd = document.querySelector('[data-redeem-pts]'); if (rd) {
          let pick = cfg.rewards.findIndex(([, need]) => need <= bal);
          document.querySelector('[data-rw-pick]').addEventListener('typechange', e => { pick = +e.detail; document.querySelector('[data-rd-kv]').innerHTML = g.__rd.rdRows(cfg.rewards[pick]); });
          rd.onclick = () => { const [n, need] = cfg.rewards[pick]; logScan(ctx, `Points redeemed · −${need} pts · ${pp.name}`, 'points');
            document.querySelector('[data-pts-pass]').innerHTML = ptsPass(bal - need); document.querySelector('[data-rd-kv]').innerHTML = kv([['Customer', pname], ['Reward', n + ' · redeemed', true], ['Points deducted', '−' + need], ['New balance', (bal - need) + ' points', true]]);
            document.querySelectorAll('[data-rw-pick] .type-card').forEach(c => c.disabled = true); rd.disabled = true; rd.innerHTML = `${icon('check', 'sm')}Reward redeemed`;
            const log = document.querySelector('[data-rd-log]'); if (log) { log.href = ctx.nav(`${ctx.page('points-transactions')}?new=redeem&c=${pk}&r=${pick}`); log.hidden = false; } g.toast(`${n} redeemed — ${need} points deducted`); g.scanSuccess(document.querySelector('[data-pts-pass]')); };
        }
      } };
  };

  /* ================= PRINTABLE QR CODES ================= */
  // Print formats (client examples): the chosen format drives the preview (PNG/PDF files come from core qrPanel). Sizes are sensible defaults.
  const FMT = { Table: ['Table tent', 'A6 · 105 × 148 mm', 105, 148], Counter: ['Counter display', 'A5 · 148 × 210 mm', 148, 210], Sticker: ['Round sticker', '80 mm round', 80, 80, 1], Flyer: ['Flyer', 'A5 · 148 × 210 mm', 148, 210], Window: ['Window decal', '200 × 200 mm', 200, 200],
    Poster: ['Poster', 'A3 · 297 × 420 mm', 297, 420], Cup: ['Cup sticker', '50 mm round', 50, 50, 1], Receipt: ['Receipt print', '80 mm roll · 72 × 90 mm', 72, 90], Advertisement: ['Advertisement', 'A4 · 210 × 297 mm', 210, 297] };
  S.qrCodes = ctx => {
    const ps = mem.get('program-status', {}), items = [['Customer registration', 'Registers a new customer using your configured signup fields.', 'https://join.bonuca.invalid/register/biz_sample', 'Registration', 'Table', 'userPlus'],
      // Programs / campaigns published at runtime (demo memory 'program-status', published 'draft-programs') get their QR code here.
      ...D.programs.filter(p => (ps[p.id] || p.status) !== 'Draft').map(p => [p.name, p.qrAction || (p.kind === 'membership' || p.kind === 'tier' ? 'Join membership' : 'Add wallet card'), p.url || `https://join.bonuca.invalid/program/join-prg_${p.id}`, 'Programs', 'Table', p.icon, ps[p.id] || p.status]),
      ...mem.get('draft-programs', []).filter(d => d && d.name && d.status === 'Active').map(d => [esc(d.name), d.type === 'membership' || d.type === 'tier' ? 'Join membership' : 'Add wallet card', `https://join.bonuca.invalid/program/join-prg_${d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, 'Programs', 'Table', { stamp: 'stamp', membership: 'crown', tier: 'layers', points: 'coins' }[d.type] || 'stamp']),
      ...mem.get('campaigns-added', []).map(c => [esc(c.name), c.type.startsWith('Stamp') ? 'Stamp card acquisition campaign' : 'One-time voucher campaign', `https://join.bonuca.invalid/campaign/${c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, 'Campaigns', 'Cup', c.type.startsWith('Stamp') ? 'stamp' : 'ticket', 'Active']),
      ...D.campaigns.filter(c => (ps[c.id] || c.status) !== 'Draft').map(c => [c.name, c.id === 'cuplid' ? 'Stamp card acquisition campaign' : 'One-time voucher campaign', c.url, 'Campaigns', 'Cup', c.id === 'cuplid' ? 'stamp' : 'ticket', ps[c.id] || c.status])];
    const n = grp => items.filter(i => i[3] === grp).length;
    const cards = items.map(([t, s, url, grp, fmt, ic, st]) => `<section class="card reveal-up" data-group="${grp}"><header class="card-head split"><div class="row"><span class="feed-ic" style="background:var(--color-accent-soft);color:var(--color-accent)">${icon(ic, 'sm')}</span><div><div class="card-title">${t}</div><div class="card-sub">${s}</div></div></div>${grp === 'Registration' ? badge('Always on', 'outline') : status(st || 'Active')}</header><div class="card-body">${qrPanel({ url, format: fmt, formats: grp === 'Campaigns' ? U.CAMPAIGN_QR : undefined })}</div></section>`).join('');
    return { nav: 'QR Scanner', title: 'Printable QR codes', html: `${pageHead({ eyebrow: crumb('QR Scanner', ctx.link('28-')) + 'Printable QR codes', title: 'Printable <span class="hl">QR codes</span>', sub: 'Depending on the program, scanning adds a wallet card, registers the customer, or joins a membership.' })}
      ${tabs([['All', null, items.length], ['Registration', null, 1], ['Programs', null, n('Programs')], ['Campaigns', null, n('Campaigns')]], 'All', 'data-qr-tabs')}<div class="grid g2" data-qr-grid>${cards}</div>`, after() {
        document.querySelector('[data-qr-tabs]').addEventListener('tab', e => document.querySelectorAll('[data-qr-grid] > section').forEach(s => s.hidden = !(e.detail === 'All' || s.dataset.group === e.detail)));
        document.querySelectorAll('[data-qr-grid] > section').forEach(sec => {
          const panel = sec.querySelector('.qr-panel'), box = panel.querySelector('.qr-box'), sel = panel.querySelector('select');
          sel.insertAdjacentHTML('afterend', '<div class="hint" data-fmt-cap></div>');
          const upd = () => { const [l, size, w, h, round] = FMT[sel.value]; box.style.height = Math.round(150 * Math.min(h / w, 1.5)) + 'px'; box.style.borderRadius = round ? '50%' : ''; box.style.padding = round ? '28px' : ''; box.dataset.format = sel.value; panel.querySelector('[data-fmt-cap]').textContent = `${l} · ${size}`; };
          sel.addEventListener('change', upd); upd();
        });
      } };
  };

  /* ================= CUSTOMERS ================= */
  // Phone numbers match however staff type them: spaces, +49 or a national leading 0.
  const digits = v => String(v).replace(/\D/g, ''), phoneQ = v => { const d = digits(v); return /^00/.test(d) ? d.slice(2) : /^0/.test(d) ? '49' + d.slice(1) : d; };
  const signup = () => ({ Email: 'Optional', 'Phone Number': 'Optional', Birthday: 'Optional', ...mem.get('signup-fields', {}) });
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, PHONE = /^\+?[\d\s()/-]{6,20}$/;
  const clearErr = f => { f.classList.remove('has-error'); f.querySelectorAll('.error-msg').forEach(e => e.remove()); };
  const setErr = (inp, msg) => { const f = inp.closest('.field'); clearErr(f); f.classList.add('has-error'); f.insertAdjacentHTML('beforeend', `<div class="error-msg">${icon('info', 'sm')}${esc(msg)}</div>`); };
  const TODAY = new Date('2026-10-21T00:00:00'), fmtD = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), daysAgo = n => new Date(TODAY.getTime() - n * 864e5);
  S.customers = ctx => {
    const PER = 16, sf = signup(), F = [['Email', 'email', 'email', 'name@example.com'], ['Phone Number', 'phone', 'tel', '+49 151 1234567'], ['Birthday', 'birthday', 'date', '']].filter(([n]) => sf[n] !== 'Off');
    const m = modal({ id: 'add', open: ctx.opts.modal === 'add', title: 'Add customer', sub: 'Fields follow your customer signup settings.', body: `<div class="form-grid" data-add-form>${field({ label: 'Name', required: true, input: input({ cls: ctx.opts.modal ? 'focus' : '', attrs: 'maxlength="60" data-af="name"' }) })}${F.map(([n, k, t, ph]) => field({ label: n, required: sf[n] === 'Required', optional: sf[n] !== 'Required', input: input({ type: t, ph, attrs: `data-af="${k}"` }) })).join('')}</div>`, foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-add-cust>${icon('userPlus', 'sm')}Add customer</button>` });
    return { nav: 'Customers', html: `${pageHead({ eyebrow: `${icon('users', 'sm')} People`, title: '<span class="hl">Customers</span>', sub: `<b style="color:var(--color-text-primary)" data-total>${custs().length}</b> customers across all programs.`, actions: `<a class="btn btn-ghost" href="${ctx.link('38-')}">${icon('sliders', 'sm')}Signup fields</a><button class="btn btn-primary" data-open="add">${icon('userPlus', 'sm')}Add customer</button>` })}
      <section class="card reveal-up" style="overflow:hidden"><div class="toolbar"><label class="search">${icon('search')}<input class="input" placeholder="Search by name, phone, email or customer ID" data-search></label><span class="hint" data-result>Showing 1–${PER} of ${custs().length}</span></div>
      <div class="table-wrap"><table class="t"><thead><tr><th>Name</th><th>Customer ID</th><th>Email</th><th>Phone</th><th>Joined</th><th></th></tr></thead><tbody data-rows></tbody></table></div>
      <div class="pager"><span data-pinfo></span><div class="pg" data-pg></div></div></section>${m}`, after() {
        let page = 1, q = '', fresh = '';
        const rows = document.querySelector('[data-rows]');
        const draw = () => {
          const all = custs(), qd = /^[+\d\s()/.-]+$/.test(q) ? phoneQ(q) : '';
          const list = all.filter(c => !q || [c.name, c.id, c.email, c.phone].join(' ').toLowerCase().includes(q) || (qd.length >= 4 && digits(c.phone).includes(qd)));
          const pages = Math.max(1, Math.ceil(list.length / PER)); page = Math.min(page, pages);
          const sl = list.slice((page - 1) * PER, page * PER);
          rows.innerHTML = sl.map((c, i) => `<tr class="clickable" data-href="${ctx.nav(`${ctx.link('37-')}?c=${c.id}`)}" ${c.id === fresh ? 'data-fresh style="background:var(--color-mint-soft)"' : `style="animation:fadeUp .4s ${i * 18}ms both"`}><td><div class="person">${ini(c.name)}${esc(c.name)}</div></td><td><span class="mono faint">${c.id}</span></td><td class="${c.email === '—' ? 'faint' : ''}">${esc(c.email)}</td><td class="${c.phone === '—' ? 'faint' : ''}">${esc(c.phone)}</td><td class="muted">${c.joined}</td><td class="num faint">${icon('chevronRight', 'sm')}</td></tr>`).join('') || `<tr><td colspan="6"><div class="empty"><div class="ill">${icon('search', 'lg')}</div><b style="color:var(--color-text-primary)">No customers match “${esc(q)}”</b></div></td></tr>`;
          const a = list.length ? (page - 1) * PER + 1 : 0, b = Math.min(page * PER, list.length);
          document.querySelector('[data-total]').textContent = all.length;
          document.querySelector('[data-result]').textContent = `Showing ${a}–${b} of ${list.length}`;
          document.querySelector('[data-pinfo]').textContent = `Page ${page} of ${pages}`;
          document.querySelector('[data-pg]').innerHTML = `<button data-p="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Previous">‹</button>` + Array.from({ length: pages }, (_, i) => `<button data-p="${i + 1}" class="${i + 1 === page ? 'on' : ''}">${i + 1}</button>`).join('') + `<button data-p="${page + 1}" ${page === pages ? 'disabled' : ''} aria-label="Next">›</button>`;
        };
        document.querySelector('[data-search]').oninput = e => { q = e.target.value.trim().toLowerCase(); page = 1; draw(); };
        document.querySelector('[data-pg]').onclick = e => { const b = e.target.closest('[data-p]'); if (b && !b.disabled) { page = +b.dataset.p; draw(); } };
        // Add customer: Name always required; the other fields follow the signup settings (Required / Optional / Off). The new customer is kept in demo memory.
        const fm = document.querySelector('[data-add-form]'), $ = k => fm.querySelector(`[data-af="${k}"]`), v = k => $(k) ? $(k).value.trim() : '';
        fm.addEventListener('input', e => { const f = e.target.closest('.field'); if (f) clearErr(f); });
        document.querySelector('[data-add-cust]').onclick = () => {
          const bad = [];
          if (!v('name')) bad.push(['name', 'Enter the customer’s name.']);
          F.forEach(([n, k]) => { if (sf[n] === 'Required' && !v(k)) bad.push([k, `${n} is required by your signup settings.`]); });
          if (v('email') && !EMAIL.test(v('email'))) bad.push(['email', 'Enter a valid email address, e.g. name@example.com.']);
          if (v('phone') && !PHONE.test(v('phone'))) bad.push(['phone', 'Enter a valid phone number, e.g. +49 151 1234567.']);
          fm.querySelectorAll('.field').forEach(clearErr); bad.forEach(([k, msg]) => setErr($(k), msg));
          if (bad.length) { $(bad[0][0]).focus(); return; }
          const added = mem.get('customers-added', []), id = 'C-' + (10001 + D.customers.length + added.length), name = v('name');
          mem.set('customers-added', [{ name, id, email: v('email') || '—', phone: v('phone') || '—', joined: fmtD(TODAY), birthday: v('birthday') ? fmtD(new Date(v('birthday') + 'T00:00:00')) : '', visits: 0, daysSince: 0, tier: 'Member' }, ...added]);
          fm.querySelectorAll('input').forEach(i => i.value = ''); document.querySelector('[data-modal="add"]').hidden = true;
          fresh = id; q = ''; page = 1; document.querySelector('[data-search]').value = ''; draw(); g.toast(`Customer added — ${name} (${id})`);
        };
        draw();
      } };
  };

  // Customer opened from the list or a scan: ?c= customer ID, or a scanner demo key (anna, leon, vera, kemal …). Anna Schmidt (C-10001) is the detailed demo customer.
  const ciCid = k => (D.stampScans[k] || D.pointsScans[k] || D.winbackScans[k] || [])[1];
  const giftNow = x => { const r = !x.opts.multi && mem.get('gifts-redeemed', {})[x.id]; return r ? { ...x, status: 'Redeemed', red: r } : x; };
  const rwIcon = src => /^win-back/i.test(src) ? 'gift' : /^points/i.test(src) ? 'coins' : /^voucher/i.test(src) ? 'ticket' : /^stamp/i.test(src) ? 'stamp' : 'gift';
  S.customerProfile = ctx => {
    const q = new URLSearchParams(location.search), c0 = q.get('c') || '', G = g.GIFTS, cp = D.programs.find(p => p.id === 'club'), T = g.TIER;
    const srDone = cid => mem.get('stamp-rewards-redeemed', []).includes(cid);
    // Employee: limited customer info only (client) — name, active programs, progress, available rewards.
    if (!ctx.can('customerDetails')) {
      const cid0 = custById(c0) ? c0 : ciCid(c0) || 'C-10001', ck = Object.hasOwn(D.custInfo, c0) ? c0 : Object.keys(D.custInfo).find(k => ciCid(k) === cid0) || '', cu = custById(ck ? ciCid(ck) : cid0);
      const [cn, progs0, rws0] = ck ? D.custInfo[ck] : [cu.name, cu.visits ? [['coffee', `${cu.visits % 10} / 10 stamps`, cu.visits % 10 * 10], ['club', `Current tier: ${cu.tier}`, T.at(cp.cfg, cu.visits).pct]] : [],
        [...D.rewards.filter(r => r[1] === cu.name && r[3] === 'Available').map(r => [esc(r[0]), r[2].toLowerCase(), rwIcon(r[2])]), ...[...mem.get('gifts-assigned', []), ...G.all(ctx).filter(x => !x.fresh)].map(giftNow).filter(x => x.cid === cu.id && x.status === 'Available').map(x => [esc(x.name), 'gift', 'gift'])]];
      const sm = mem.get('stamps', {}), progs = progs0.map(pr => pr[0] === 'coffee' && ck && Object.hasOwn(sm, ck) ? ['coffee', `${sm[ck]} / 10 stamps`, sm[ck] * 10, pr[3]] : pr);
      const rws = rws0.filter(([, s]) => !(s === 'stamp card' && srDone(cu.id)));
      const programs = progs.map(([id, txt, pct, code], i) => { const p = D.programs.find(x => x.id === id), pts = p.kind === 'points';
        return `<div class="option-row" style="display:block${i ? ';margin-top:10px' : ''}"><div class="row between"><div class="row"><span class="feed-ic" style="background:${pts ? 'var(--color-highlight-soft);color:#9A7300' : 'var(--color-accent-soft);color:var(--color-accent)'}">${icon(p.icon, 'sm')}</span><div><b>${p.name}</b><small>${txt}</small></div></div>${pts ? (ctx.has('points-transactions') ? `<a class="link" href="${ctx.page('points-transactions')}">Transactions ${icon('arrowRight', 'sm')}</a>` : '') : code ? `<span class="mono faint" style="font-size:12px">Pass ${code}</span>` : ''}</div>${pct != null ? `<div class="mini-prog"><i style="--w:${pct}%"></i></div>` : ''}</div>`; }).join('') || '<p class="muted">No active programs yet.</p>';
      const rewards = `<div class="stack" style="gap:10px">${rws.map(([r, s, i]) => `<div class="option-row"><div class="row"><span class="feed-ic" style="background:var(--color-highlight-soft);color:#9A7300">${icon(i, 'sm')}</span><div><b>${r}</b><small>${s}</small></div></div>${status('Available')}</div>`).join('') || '<p class="muted">No rewards available yet.</p>'}</div>`;
      const [f, ...l] = cn.split(' ');
      return { nav: 'QR Scanner', title: cn, html: `${pageHead({ eyebrow: crumb('QR Scanner', ctx.link('01-')) + 'Customer info', title: `<span class="row" style="gap:16px"><span class="avatar round" style="width:60px;height:60px;font-size:20px">${U.initials(cn)}</span><span>${esc(f)} <span class="hl">${esc(l.join(' '))}</span></span></span>`, sub: 'Active programs, progress and available rewards.' })}
      <div class="grid g2">${card({ title: 'Active programs', icon: 'wallet', sub: 'Progress on each program.', cls: 'reveal-up', body: programs })}${card({ title: 'Available rewards', icon: 'gift', sub: 'Redeem a reward by scanning the customer’s pass.', cls: 'reveal-up', body: rewards })}</div>` };
    }
    const hist = [ctx.owner ? 'Oct 21, 2026, 02:27 PM' : 'Oct 21, 2026, 02:29 PM', 'Oct 19, 2026, 08:22 PM', 'Sep 22, 2026, 09:08 AM', 'Sep 13, 2026, 07:20 PM', 'Aug 20, 2026, 06:17 PM', 'Aug 17, 2026, 01:55 PM', 'Aug 8, 2026, 03:02 PM', 'Jul 29, 2026, 10:21 AM', 'Jul 22, 2026, 08:33 PM', 'Jul 15, 2026, 07:19 PM', 'Jul 7, 2026, 03:35 PM', 'Jun 26, 2026, 01:25 PM'];
    // Win-back customer: last visit + days inactive; redeemed in the scanner (demo memory) or &visit=winback = visit recorded, inactivity timer reset.
    const wk = Object.hasOwn(D.winbackScans, c0) ? c0 : wbKey(c0), back = !!wk && (q.get('visit') === 'winback' || wbDone(wk));
    const cu = custById(wk ? D.winbackScans[wk][1] : c0) || custById(ciCid(c0)) || custById('C-10001'), cid = cu.id, cn = cu.name, anna = cid === 'C-10001', [fn, ...lnA] = cn.split(' '), ln = lnA.join(' ');
    const [, , days, last] = wk ? D.winbackScans[wk] : [];
    // Membership / tier visit recorded in the scanner (?visit=vip|club).
    const vk = q.get('visit'), vprog = Object.hasOwn({ vip: 1, club: 1 }, vk || '') ? D.programs.find(p => p.id === vk) : null, vip = D.programs.find(p => p.id === 'vip');
    const tv = anna ? (vk === 'club' && isFinite(parseFloat(q.get('v'))) ? parseFloat(q.get('v')) : D.tierScans.anna[2]) : cu.visits, tp = T.pass(cp, tv);
    const member = Object.values(D.memberScans).find(m => m[1] === cid);
    // Gifts assigned to this customer (manual gift from the profile); ?new=gift = the one just assigned.
    // A gift just assigned (?new=gift) is stored once in demo memory ('gifts-assigned') so it stays on the profile and the scanner can redeem it.
    const fresh0 = G.all(ctx).find(x => x.fresh && x.cid === cid), kept = mem.get('gifts-assigned', []), key = fresh0 && `${cid}|${fresh0.query}`;
    if (fresh0 && !kept.some(x => x.key === key)) mem.set('gifts-assigned', [{ ...fresh0, id: 'ga' + (kept.length + 1), key, fresh: false }, ...kept]);
    const gifts = [...mem.get('gifts-assigned', []).map(x => x.key === key ? { ...x, fresh: true } : x), ...D.gifts].map(giftNow).filter(x => x.cid === cid), fresh = gifts.find(x => x.fresh);
    const giftSub = x => `gift · ${x.status === 'Scheduled' ? 'activates ' + x.on : x.status === 'Redeemed' ? 'redeemed ' + x.red.date : 'expires ' + x.exp}`;
    const lastDays = wk ? days : cu.daysSince, past = anna ? hist.map(h => ['Stamp added', 'Coffee Card', h]) : Array.from({ length: Math.min(cu.visits, 12) }, (_, i) => [...(i % 2 ? ['Visit recorded', cp.name] : ['Stamp added', 'Coffee Card']), `${fmtD(daysAgo(lastDays + i * 6))}, ${['09:12 AM', '12:40 PM', '05:25 PM'][i % 3]}`]);
    const visits = [...(vprog ? [['Visit recorded', vprog.name, 'Just now']] : []), ...(back ? [['Visit recorded', 'Win-back reward redeemed', 'Just now']] : []), ...past];
    const nScans = anna ? visits.length : cu.visits + visits.length - past.length;
    const rws = [...(wk && wbOn() ? [[wbReward(days), 'win-back', 'gift', back ? 'Redeemed' : 'Available']] : []),
      ...(anna ? [['1 Free Coffee', 'stamp card', 'stamp', srDone(cid) ? 'Redeemed' : 'Available'], ['1 Free Coffee', 'voucher', 'ticket', 'Available']] : D.rewards.filter(r => r[1] === cn && !(wk && r[2] === 'Win-back')).map(r => [esc(r[0]), r[2].toLowerCase(), rwIcon(r[2]), r[3]])),
      ...gifts.map(x => [esc(x.name), giftSub(x), 'gift', x.status, x.fresh])];
    const lastV = `<span data-last-visit>${vprog ? 'Just now' : wk ? (back ? 'Oct 21, 2026' : last) : anna ? 'Oct 21, 2026' : cu.visits ? fmtD(daysAgo(cu.daysSince)) : '—'}</span>`, nAvail = rws.filter(r => r[3] === 'Available').length;
    const st = [['Number of scans', `<span data-count="${nScans}">${nScans}</span>`, 'scan'], ['Last visit', lastV, 'calendar', wk ? `Inactive for <span data-inactive-days>${back ? 0 : days}</span> days` : ''], ['Available rewards', `<span data-count="${nAvail}">${nAvail}</span>`, 'gift']];
    const prog = (ic, bg, name, sub, extra = '', pct, attrs = '') => `<div class="option-row" style="display:block" ${attrs}><div class="row between"><div class="row"><span class="feed-ic" style="background:${bg}">${icon(ic, 'sm')}</span><div><b>${name}</b><small>${sub}</small></div></div>${extra}</div>${pct != null ? `<div class="mini-prog"><i style="--w:${pct}%"></i></div>` : ''}</div>`;
    const tierRow = prog('layers', 'var(--color-mint-soft);color:#13845B', cp.name, `Current tier: <span data-cur-tier>${tp.tier}</span> · ${tp.next}`, '', tp.pct, 'data-prof-tier');
    const memberships = [...(anna ? [prog('stamp', 'var(--color-accent-soft);color:var(--color-accent)', 'Coffee Card', '2 / 10 stamps', '<span class="mono faint" style="font-size:12px">Pass BNC-DEMO1000</span>', 20), prog('coins', 'var(--color-highlight-soft);color:#9A7300', 'Coffee Rewards', '120 points · next: Free Dessert at 250', `<a class="link" href="${ctx.page('points-transactions')}">Transactions ${icon('arrowRight', 'sm')}</a>`)]
      : cu.visits ? [prog('stamp', 'var(--color-accent-soft);color:var(--color-accent)', 'Coffee Card', `${cu.visits % 10} / 10 stamps`, '', cu.visits % 10 * 10)] : []),
      ...(member || vk === 'vip' ? [prog('crown', 'var(--color-accent-soft);color:var(--color-accent)', vip.name, `${esc(vip.pass.benefit)} · member since ${member ? member[4] : fmtD(TODAY)}`)] : []), ...(anna || cu.visits ? [tierRow] : [])];
    const notes = mem.get('customer-notes', {}), note = Object.hasOwn(notes, cid) ? notes[cid] : anna ? 'Prefers oat milk.' : '';
    const gm = modal({ id: 'gift', open: ctx.opts.modal === 'gift', wide: true, title: 'Assign gift', sub: `${esc(cn)} · ${cid} — the gift appears on the customer’s account and becomes redeemable by QR scan.`, body: G.giftForm(), foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-assign-gift>${icon('gift', 'sm')}Assign gift</button>` });
    return { nav: 'Customers', title: cn, after() {
        const read = G.wireGiftForm(document.querySelector('[data-modal="gift"] [data-gift-form]'));
        document.querySelector('[data-assign-gift]').onclick = () => { const p = read(); if (p) location.href = ctx.nav(`${ctx.link('37-')}?new=gift&c=${cid}&${p}`); };
        document.querySelector('[data-save-notes]').onclick = () => { mem.set('customer-notes', { ...mem.get('customer-notes', {}), [cid]: document.querySelector('[data-notes]').value.trim() }); g.toast('Notes saved'); };
      }, html: `${pageHead({ eyebrow: crumb('Customers', ctx.link('35-')) + esc(cn), title: `<span class="row" style="gap:16px"><span class="avatar round" style="width:60px;height:60px;font-size:20px">${U.initials(cn)}</span><span>${esc(fn)} <span class="hl">${esc(ln)}</span></span></span>`, sub: `Customer ID <span class="mono">${cid}</span>`, actions: `<button class="btn btn-primary" data-open="gift">${icon('gift', 'sm')}Assign gift</button>` })}
      ${fresh ? `<div class="reveal-up" style="margin-bottom:18px" data-gift-assigned>${callout('info', 'Gift assigned', `${esc(fresh.name)} — ${fresh.status}${fresh.status === 'Scheduled' ? ' from ' + fresh.on : ''}. Customer notification not delivered: app, email and wallet notifications are not connected in this environment. <a class="link" href="${ctx.nav(`${ctx.link('45-')}?${fresh.query}&new=gift`)}">View in Rewards ${icon('arrowRight', 'sm')}</a>`, 'checkCircle')}</div>` : ''}
      ${back ? `<div style="margin-bottom:18px" data-wb-done>${callout('info', 'Win-back reward redeemed', `Visit recorded today — ${esc(cn)} is active again, so the inactivity timer was reset.`, 'checkCircle')}</div>` : ''}
      <div class="grid g3">${st.map(([l, v, i, n], k) => `<div class="card hover stat reveal-up ${k === 0 ? 'feature' : ''}"><div class="lbl">${l}<span class="ico">${icon(i, 'sm')}</span></div><div class="val">${v}</div>${n ? `<div class="note">${n}</div>` : ''}</div>`).join('')}</div>
      <div class="grid g2" style="margin-top:18px">
        ${card({ title: 'Profile', icon: 'badge', cls: 'reveal-up', body: U.setup([['Email', esc(cu.email)], ['Phone', esc(cu.phone)], ['Birthday', cu.birthday ? esc(cu.birthday) : '<span class="faint">—</span>'], ['Joined', cu.joined]]) })}
        ${card({ title: 'Memberships', icon: 'wallet', sub: 'Programs, current tier and balances.', cls: 'reveal-up', body: memberships.map((h, i) => i ? h.replace('style="display:block"', 'style="display:block;margin-top:10px"') : h).join('') || '<p class="muted">No programs yet.</p>' })}
        ${card({ title: 'Rewards', icon: 'gift', cls: 'reveal-up', body: `<div class="stack" style="gap:10px" data-rewards data-profile-rewards>${rws.map(([r, s, i, stt, f]) => `<div class="option-row" ${f ? 'data-fresh style="background:var(--color-mint-soft)"' : ''}><div class="row"><span class="feed-ic" style="background:var(--color-highlight-soft);color:#9A7300">${icon(i, 'sm')}</span><div><b>${r}</b><small>${s}</small></div></div>${status(stt)}</div>`).join('') || '<p class="muted">No rewards yet.</p>'}</div>` })}
        ${card({ title: 'Notes', icon: 'edit', cls: 'reveal-up', body: `<div class="stack" style="gap:12px">${textarea(note, 'Add a note about this customer', 'maxlength="500" data-notes')}<div><button class="btn btn-primary btn-sm" data-save-notes>Save notes</button></div></div>` })}
      </div>
      <div style="margin-top:18px">${card({ title: 'Visit history', icon: 'clock', actions: badge(nScans + ' visits', 'outline'), cls: 'reveal-up', body: visits.length ? `<div class="timeline" data-visit-history>${visits.map(([a, b, h]) => `<div class="tl-item"><span><b style="font-weight:600">${a}</b> <span class="faint">· ${b}</span></span><span class="muted">${h}</span></div>`).join('')}</div>` : '<p class="muted" data-visit-history>No visits yet.</p>' })}</div>${gm}` };
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
      ${fresh ? `<div style="margin-bottom:18px" data-scan-confirmed>${callout('info', 'Transaction saved', `${esc(pname)}: ${fresh[4]} points · new balance ${fresh[6]} points.`, 'checkCircle')}</div>` : ''}
      ${card({ title: 'Transaction log', icon: 'file', actions: badge(rows.length + ' transactions', 'outline'), body: null, cls: 'reveal-up', attrs: 'style="overflow:hidden"' }).replace('</section>', table + '</section>')}`, after() { g.scanSuccess(document.querySelector('[data-scan-confirmed]')); } };
  };

  /* ================= EMPLOYEE: RECENT SCANS · ACCOUNT ================= */
  // Same scan feed as the scanner, full list: time, customer, action — an employee sees their own scans.
  S.recentScans = ctx => ({ nav: 'Recent scans', html: `${pageHead({ eyebrow: `${icon('clock', 'sm')} Scanner`, title: 'Recent <span class="hl">scans</span>', sub: `Time, customer and action of ${ctx.role === 'employee' ? 'your' : 'the'} latest scans.`, actions: `<a class="btn btn-primary" href="${ctx.link('01-')}">${icon('scan', 'sm')}Scan</a>` })}${feed(ctx, false, D.scansBase.length)}` });
  S.account = ctx => {
    const me = D.team.find(t => t[2] === 'Employee');
    // Language uses the shell's data-lang select: saved in demo memory, synced with the topbar, confirmed by a toast.
    return { nav: 'Account', html: `${pageHead({ eyebrow: `${icon('badge', 'sm')} Account`, title: 'Your <span class="hl">account</span>' })}
      ${card({ title: me[0], icon: 'badge', cls: 'reveal-up', body: `<div class="stack">${kv([['Name', me[0]], ['Email', me[1]], ['Role', badge(me[2], '')], ['Business', 'Sample Business (development)']])}
        <div class="option-row"><div><b>Language</b><small>App interface language</small></div>${select(['English', 'Deutsch', 'Türkçe', 'Français', 'Italiano'], mem.get('lang', 'English'), 'style="max-width:180px" aria-label="Language" data-lang')}</div></div>`, foot: `<a class="btn btn-ghost" href="../../common/pages/03-login.html" data-logout>${icon('logout', 'sm')}Log out</a>` })}` };
  };

  // Client: "Businesses decide what information they collect" — Name is always required; every other field is Required, Optional or Off (saved in demo memory, used by Add customer).
  S.signupFields = ctx => {
    const sf = signup(), f = [['Name', 'badge'], ['Email', 'mail'], ['Phone Number', 'phone'], ['Birthday', 'calendar']];
    return { nav: 'Customers', title: 'Customer signup fields', html: `${pageHead({ eyebrow: crumb('Customers', ctx.link('35-')) + 'Signup fields', title: 'Customer <span class="hl">signup fields</span>', sub: 'Name is always required; Email, Phone Number and Birthday are optional by default — make each required, optional or turn it off.' })}
      ${card({ title: 'Fields customers fill in', icon: 'sliders', cls: 'reveal-up', body: `<div class="stack" style="gap:10px">${f.map(([n, i]) => `<div class="option-row" style="flex-wrap:wrap"><div class="row"><span class="feed-ic" style="background:var(--color-surface);border:1px solid var(--color-border)">${icon(i, 'sm')}</span><b>${n}</b></div><div class="seg" ${n === 'Name' ? '' : `data-sf="${n}"`}>${(n === 'Name' ? ['Required'] : ['Required', 'Optional', 'Off']).map(o => `<button class="${o === (sf[n] || 'Required') ? 'on' : ''}" data-v="${o}">${o}</button>`).join('')}</div></div>`).join('')}</div>`, foot: `<button class="btn btn-primary" data-save-sf>${icon('check', 'sm')}Save</button>` })}`, after() {
        if (ctx.state.preview) document.querySelectorAll('#content .seg button').forEach(b => { b.dataset.previewLock = ''; b.setAttribute('aria-disabled', 'true'); });
        document.querySelector('[data-save-sf]').onclick = () => { mem.set('signup-fields', Object.fromEntries([...document.querySelectorAll('[data-sf]')].map(s => [s.dataset.sf, s.querySelector('.on').dataset.v]))); g.toast('Signup fields saved'); };
      } };
  };

  /* ================= EMPLOYEES ================= */
  S.employees = ctx => {
    const o = ctx.owner;
    if (!ctx.can('team')) return { nav: 'Employees', html: `${pageHead({ eyebrow: `${icon('badge', 'sm')} Team`, title: '<span class="hl">Employees</span>' })}<div class="lock-overlay">${icon('lock')}Your role does not have access to this feature.</div>` };
    // Team = saved permissions (g.team(), demo memory 'team-perms') + invitations created here ('team-invites', pending until accepted).
    const rows = () => [...g.team().map(([n, e, r, s, m, ms]) => [n, e, r, s, m, ms, false]), ...mem.get('team-invites', []).map(i => [i.email, i.email, i.role, 'Today', false, i.multi, true])];
    // "Can manage employees" exists for Managers only and only the Owner can change it.
    const manage = (r, on, n, e, inv) => r === 'Manager' ? toggle(!!on, `aria-label="${esc(n)} can manage employees" data-perm="${esc(e)}" data-i="0" ${o && !inv ? '' : 'disabled'}`) : '<span class="faint">—</span>';
    // Per-employee permission (client): employees award multiple stamps only if permitted.
    const multi = (r, on, n, e, inv) => r === 'Employee' ? toggle(!!on, `aria-label="${esc(n)} can award multiple stamps" data-perm="${esc(e)}" data-i="1" ${inv ? 'disabled' : ''}`) : '<span class="faint">—</span>';
    const roleB = r => badge(r, r === 'Owner' ? 'ink' : r === 'Manager' ? 'blue' : ''), stB = inv => inv ? badge('Invited', 'amber') : status('Active');
    const table = list => `<div class="table-wrap"><table class="t"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Since</th><th>Can manage employees</th><th>Can award multiple stamps</th></tr></thead><tbody>${list.map(([n, e, r, s, m, ms, inv]) => `<tr ${inv ? 'data-invited' : ''}><td><div class="person">${ini(n)}${esc(n)}</div></td><td class="muted">${esc(e)}</td><td>${roleB(r)}</td><td>${stB(inv)}</td><td class="muted">${s}</td><td>${manage(r, m, n, e, inv)}</td><td>${multi(r, ms, n, e, inv)}</td></tr>`).join('')}</tbody></table></div>`;
    // Narrow screens: one block per member so the permission toggles stay reachable without horizontal scrolling.
    const stacked = list => `<div class="stack" style="gap:10px;padding:14px 16px">${list.map(([n, e, r, s, m, ms, inv]) => `<div class="option-row" style="display:block" ${inv ? 'data-invited' : ''}><div class="row between"><div class="person">${ini(n)}${esc(n)}</div>${roleB(r)}</div><small class="muted" style="display:block;margin-top:6px">${esc(e)} · since ${s}</small><div style="margin-top:6px">${stB(inv)}</div>${r === 'Manager' ? `<div class="row between" style="margin-top:10px"><span>Can manage employees</span>${manage(r, m, n, e, inv)}</div>` : ''}${r === 'Employee' ? `<div class="row between" style="margin-top:10px"><span>Can award multiple stamps</span>${multi(r, ms, n, e, inv)}</div>` : ''}</div>`).join('')}</div>`;
    const roles = `<div class="stack" style="gap:10px">${D.roles.map(([r, d, i]) => `<div class="row" style="align-items:flex-start;gap:14px;padding:4px 0"><span class="feed-ic" style="background:var(--color-surface-sunken)">${icon(i, 'sm')}</span><div><b>${r}</b><p class="muted" style="font-size:13.5px;margin-top:2px">${d}</p></div></div>`).join('')}</div>`;
    const inviteLink = (r, e = '') => `../../common/pages/13-accept-invitation.html?role=${r}${e ? '&email=' + encodeURIComponent(e) : ''}`, narrow = matchMedia('(max-width: 600px)');
    const inv = modal({ id: 'invite', open: ctx.opts.modal === 'invite', title: 'Invite team member', sub: 'They receive an email, set their own password, and get role-based access.', body: `<div class="stack">${field({ label: 'Email', required: true, input: `<div class="input-wrap">${icon('mail')}${input({ type: 'email', cls: ctx.opts.modal ? 'focus' : '', ph: 'name@business.com', attrs: 'data-inv-email' })}</div>` })}
      ${field({ label: 'Role', required: true, input: `<div class="type-grid" data-invite-role>${[['Manager', 'badge', '#7C3AED', 'Customers, programs, rewards, analytics, scanner.'], ['Employee', 'scan', '#1747F8', 'Scanner, stamps/points/visits, redeem rewards.']].map(([r, i, c, d]) => { const locked = !o && r === 'Manager'; return `<button class="type-card ${r === 'Employee' ? 'on' : ''}" ${locked ? 'disabled style="--c:' + c + ';opacity:.5;cursor:not-allowed"' : `data-select="${r}" style="--c:${c}"`}><div class="row between"><span class="ti">${icon(i)}</span>${locked ? icon('lock', 'sm') : ''}</div><b>${r}</b><small>${d}</small></button>`; }).join('')}</div>`, hint: o ? '' : 'Managers can invite Employees only.' })}
      <div data-invite-multi>${U.check('Can award multiple stamps', false, 'name="canMultiStamp"')}</div>
      ${callout('dev', 'Development — email not sent', `No email service is connected, so no invitation was delivered. <a class="link" data-invite-link href="${inviteLink('Employee')}">Open invitation link ${icon('arrowRight', 'sm')}</a>`)}</div>`, foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-inv-send>${icon('send', 'sm')}<span data-inv-label>Invite Employee</span></button>` });
    return { nav: 'Employees', html: `${pageHead({ eyebrow: `${icon('badge', 'sm')} Team`, title: '<span class="hl">Employees</span>', sub: 'Your team and their roles.', actions: `<button class="btn btn-primary" data-open="invite">${icon('userPlus', 'sm')}Invite Employee</button>` })}
      ${card({ title: 'Team', icon: 'users', sub: o ? '' : 'Only the Owner can change who may manage employees.', actions: `<span data-team-count>${badge(rows().length + ' members', 'outline')}</span>`, body: null, cls: 'reveal-up', attrs: 'style="overflow:hidden"' }).replace('</section>', '<div data-team></div></section>')}
      <div style="margin-top:18px">${card({ title: 'Roles', icon: 'shield', body: roles, cls: 'reveal-up' })}</div>${inv}`, after() {
      const box = document.querySelector('[data-team]'), draw = () => { const l = rows(); box.innerHTML = narrow.matches ? stacked(l) : table(l); document.querySelector('[data-team-count]').innerHTML = badge(l.length + ' members', 'outline'); };
      narrow.addEventListener('change', () => { draw(); if (ctx.state.preview) box.querySelectorAll('input').forEach(i => { i.dataset.previewLock = ''; i.closest('label').dataset.previewLock = ''; }); }); draw();
      // Permission toggles are saved at once (demo memory) — app access (Employees for the Manager, multi-stamp scans for the Employee) follows them.
      box.addEventListener('change', e => { const t = e.target.closest('[data-perm]'); if (!t) return; const row = g.team().find(r => r[1] === t.dataset.perm), cur = [!!row[4], !!row[5]]; cur[+t.dataset.i] = t.checked;
        mem.set('team-perms', { ...mem.get('team-perms', {}), [row[1]]: cur }); draw(); g.toast(`${row[0]} ${t.checked ? 'can now' : 'can no longer'} ${+t.dataset.i ? 'award multiple stamps' : 'manage employees'}`); });
      const a = document.querySelector('[data-invite-link]'), em = document.querySelector('[data-inv-email]'), role = () => document.querySelector('[data-invite-role] .type-card.on').dataset.select;
      document.querySelector('[data-invite-role]').addEventListener('typechange', e => { a.href = inviteLink(e.detail, em.value.trim()); document.querySelector('[data-invite-multi]').hidden = e.detail !== 'Employee'; document.querySelector('[data-inv-label]').textContent = 'Invite ' + e.detail; });
      em.addEventListener('input', () => { clearErr(em.closest('.field')); a.href = inviteLink(role(), em.value.trim()); }); // dev link carries the entered email to 13
      document.querySelector('[data-inv-send]').onclick = () => {
        const v = em.value.trim().toLowerCase(), taken = rows().some(r => r[1].toLowerCase() === v);
        const err = !v ? 'Enter the email address of the person you want to invite.' : !EMAIL.test(v) ? 'Enter a valid email address, e.g. name@business.com.' : taken ? 'This person is already on your team or invited.' : '';
        if (err) { setErr(em, err); em.focus(); return; }
        const r = role(); mem.set('team-invites', [...mem.get('team-invites', []), { email: v, role: r, multi: r === 'Employee' && document.querySelector('[name="canMultiStamp"]').checked }]);
        em.value = ''; document.querySelector('[data-modal="invite"]').hidden = true; draw(); g.toast(`Invitation created for ${v} (${r}) — email not sent: no email service in development`);
      };
    } };
  };
})(window);
