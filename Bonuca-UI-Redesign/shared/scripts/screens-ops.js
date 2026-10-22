/* QR Scanner, Printable QR codes, Customers, Employees */
(function (g) {
  const U = g.UI, D = g.DATA, { icon, field, input, select, textarea, toggle, badge, status, card, callout, pass, qrPanel, pageHead, crumb, modal, kv, tabs, ini, esc } = U;
  const S = g.SCREENS = g.SCREENS || {};

  /* ================= QR SCANNER ================= */
  function feed(ctx, withAnna, max = ctx.has('recent-scans') && ctx.opts.state ? 3 : 10) {
    const base = ctx.owner ? D.scansBase.slice(1) : D.scansBase.slice(0);
    const list = (withAnna ? [['Anna Schmidt', 'Stamp added · Coffee Card', ctx.owner ? '02:27 PM' : '02:29 PM', 'stamp'], ...base] : base).slice(0, max);
    const ic = { points: ['coins', 'var(--color-highlight-soft)', '#9A7300'], visit: ['footprints', 'var(--color-accent-soft)', 'var(--color-accent)'], stamp: ['stamp', 'var(--color-mint-soft)', '#13845B'] };
    const all = max < 10 ? `<a class="link" href="${ctx.page('recent-scans')}">View all ${icon('arrowRight', 'sm')}</a>` : '';
    return card({ title: 'Recent scans', icon: 'clock', actions: badge('Live', 'green', true) + all, body: null, cls: 'reveal-up scan-feed', attrs: 'style="overflow:hidden"' }).replace('</section>', `<div>${list.map(([n, d, t, k], i) => { const [a, b, c] = ic[k]; return `<div class="list-row" style="${i === 0 && withAnna ? 'background:var(--color-mint-soft);animation:fadeUp .5s both' : ''}"><div class="row" style="min-width:0"><span class="feed-ic" style="background:${b};color:${c}">${icon(a, 'sm')}</span><div style="min-width:0"><b style="font-weight:600;font-size:14px">${n}</b><div class="hint" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${d}</div></div></div><span class="faint" style="font-size:12px;white-space:nowrap">Oct 21 · ${t}</span></div>`; }).join('')}</div></section>`);
  }
  // Development pass picker: every scan result the prototype can show, as scanner states (each role numbers its own pages).
  const picks = [['Anna Schmidt — Coffee Card (Stamp Card)', 'stamp'], ['Leon Fischer — Coffee Card (Stamp Card)', 'stamp', 'c=leon'], ['Vera Conti — Coffee Rewards (Points Program)', 'points'], ['Anna Schmidt — Rewards Club (Tier Program)', 'tier'], ['Kemal Bianchi — Rewards Club (Tier Program)', 'tier', 'c=kemal'], ['Umut Martin — Rewards Club (Tier Program)', 'tier', 'c=umut'], ['Anna Schmidt — VIP Member (Membership Card)', 'membership'],
    ['Anna Schmidt — Free Coffee Campaign (One-time voucher)', 'voucher', 'c=anna'], ['Felix Bernard — Free Coffee Campaign (One-time voucher, already redeemed)', 'voucher', 'c=felix'], ['Kemal Fischer — Win-back reward (inactive 40 days)', 'winback', 'c=kemal'], ['Anna Schmidt — Gift (Free coffee)', 'gift']];
  const idlePanel = ctx => `<div class="stack">
    <button class="scan-hero reveal-up" data-scan><span class="frame"><i></i><i></i><i></i><i></i><i class="beam"></i>${icon('qr')}</span><div><h3>Scan</h3><p>Point the camera at a customer’s wallet pass.</p></div><span class="go">${icon('scan', 'lg')}</span></button>
    ${card({ title: 'Manual code entry', icon: 'hash', sub: 'Camera unavailable / development.', cls: 'reveal-up', body: `<div class="stack"><div class="row"><div class="input-wrap" style="flex:1">${icon('search')}<input class="input mono" placeholder="BNC-XXXXXXXX" data-code></div><button class="btn btn-ink" data-find>Find</button></div>
      <div class="callout dev" style="display:block"><b style="display:flex;gap:8px;align-items:center;margin-bottom:8px">${icon('zap', 'sm')}Development: pick a stored pass</b>${select(['Choose a customer…', ...picks.map(p => p[0])], 'Choose a customer…', 'data-pick')}</div></div>` })}
  </div>`;
  function custHead(name, sub, info) { return `<header class="card-head split ${info ? 'wrap' : ''}"><div class="row"><span class="avatar round" style="width:48px;height:48px;font-size:16px">${U.initials(name)}</span><div><div class="card-title" style="font-size:20px">${name}</div><div class="card-sub">${sub}</div></div></div><div class="row wrap" style="gap:4px">${info ? `<a class="btn btn-text btn-sm" href="${info}" data-cust-info>${icon('badge', 'sm')}Customer info</a>` : ''}<button class="btn btn-text btn-sm" data-new-scan>${icon('rotate', 'sm')}New scan</button></div></header>`; }
  // Win-back (client): the reward of the customer's inactivity stage is active; Redeem Reward marks it redeemed, records the visit and resets the inactivity timer.
  const wbReward = days => (D.stages.filter(([d]) => d <= days).pop() || D.stages[0])[1];
  const wbRows = (key, done) => { const [n, , days] = D.winbackScans[key]; return kv([['Customer', esc(n)], ['Inactive for', `<span data-wb-days>${done ? 0 : days}</span> days`], ['Active reward', wbReward(days), true], ['Status', done ? badge('Redeemed', 'blue') : badge('Not redeemed', 'outline')], ...(done ? [['Last visit', 'Today · visit recorded']] : [])]); };
  const offer = (key = 'anna', profile = '') => `<div class="offer-card" data-wb="${key}"><span class="confetti">🎁</span><div class="row" style="margin-bottom:10px"><span class="feed-ic" style="background:#fff;color:#C2410C">${icon('gift', 'sm')}</span><b style="font-family:var(--font-display);font-size:17px">Welcome back offer</b>${badge('Win-back', 'amber')}</div><div data-wb-kv>${wbRows(key)}</div><button class="btn btn-ink btn-block" style="margin-top:12px" data-wb-redeem data-scan-ok>${icon('gift', 'sm')}Redeem Reward</button>${profile ? `<a class="link" style="display:inline-flex;margin-top:12px" href="${profile}" data-wb-profile hidden>View customer profile ${icon('arrowRight', 'sm')}</a>` : ''}</div>`;
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
    const ready = st === 'rewardReady' && !q.has('c'), ck = ready ? 'leon' : Object.hasOwn(D.stampScans, q.get('c') || '') ? q.get('c') : 'anna', [cname, cid, filled] = D.stampScans[ck];
    // Multiple stamps only when the program allows it AND the user has permission (client: team permissions still apply).
    const maxPer = coffee.multi.on && ctx.can('multiStamp') ? (coffee.multi.max === 'Unlimited' ? Infinity : coffee.multi.max) : 1;
    const nRaw = Math.max(1, parseInt(ready ? '2' : q.get('n'), 10) || 1), added = st === 'rewardReady' ? Math.min(Math.max(nRaw, total - filled), total * 5) : Math.min(nRaw, maxPer);
    // Extra stamps carry over to the new card; a very large multi-stamp scan can complete more than one card.
    const earned = Math.floor((filled + added) / total), carry = (filled + added) % total;
    const info = k => ctx.has('customer-info') ? `${ctx.page('customer-info')}?c=${k}` : ''; // limited customer info (employee)
    const stampPass = n => pass({ type: 'stamp', name: coffee.name, reward, total, filled: n }).replace('<div class="pass-qr">', '<div class="pass-qr" style="display:none">');
    const giftNote = id => { const a = D.gifts.filter(x => x.cid === id && x.status === 'Available'); return a.length ? callout('info', 'Customer has an available gift', `${a.map(x => `${esc(x.name)} · expires ${x.exp}`).join(' · ')}. <a class="link" href="${ctx.nav(`${ctx.scan('gift')}?g=${a[0].id}`)}">Open gift ${icon('arrowRight', 'sm')}</a>`, 'gift') : ''; };
    let tail = '';
    if (st === 'idle') main = idlePanel(ctx);
    // Confirmed: a points credit arrives as ?k=points&p= (roles without the transaction log), otherwise the stamp just added.
    const ptsOk = st === 'confirmed' && q.get('k') === 'points', ptsAdded = Math.max(0, parseInt(q.get('p'), 10) || 0), ptsBal = D.pointsScans[Object.hasOwn(D.pointsScans, q.get('c') || '') ? q.get('c') : 'vera'][2];
    if (st === 'confirmed') main = `<div class="stack"><div class="card reveal-up" data-scan-confirmed style="padding:20px 22px;border-color:color-mix(in srgb,var(--color-mint) 40%,transparent);background:linear-gradient(120deg,var(--color-mint-soft),var(--color-surface) 60%)"><div class="row" style="align-items:flex-start;gap:16px"><span class="success-burst">${icon('check', 'lg')}</span><div><b style="font-family:var(--font-display);font-size:20px;color:#13845B">Confirmed</b><p style="margin-top:2px;font-size:15px">${ptsOk ? `${ptsAdded} points credited <b>(${ptsBal + ptsAdded} points)</b>` : `${added > 1 ? added + ' stamps' : 'Stamp'} added <b>(${filled + added}/${total})</b>`}.</p><p class="hint" style="margin-top:6px">Wallet pass update: not sent — the Apple/Google Wallet integration is not connected in this environment.</p></div></div></div>${idlePanel(ctx)}</div>`;
    if (st === 'stamp') main = `<section class="card reveal-up">${custHead(cname, `${cid} · ${coffee.name} (Stamp Card)`, info(ck))}<div class="card-body stack">
      <div class="grid" style="grid-template-columns:240px 1fr;gap:20px;align-items:center"><div data-stamp-pass>${stampPass(filled)}</div><div>${kv([['Stamps', `<span data-stamps>${filled}</span> / ${total}`, true], ['Reward', reward]])}
        ${maxPer > 1 ? `<div class="option-row" style="margin-top:12px" data-qty-row><div><b>Stamps to add</b><small>${maxPer === Infinity ? 'No limit per scan' : `Up to ${maxPer} per scan`}</small></div><div class="row" style="gap:8px"><button class="icon-btn" data-qty="-1" aria-label="Fewer stamps">−</button><input class="input" type="number" min="1" ${maxPer === Infinity ? '' : `max="${maxPer}"`} value="1" aria-label="Stamps to add" data-qty-in style="width:72px;text-align:center"><button class="icon-btn" data-qty="1" aria-label="More stamps">${icon('plus', 'sm')}</button></div></div>` : ''}
        <button class="btn btn-primary btn-lg btn-block" style="margin-top:16px" data-add-stamp>${icon('stamp', 'sm')}Add <span data-qty-label>stamp</span></button></div></div>
      ${giftNote(cid)}${ck === 'anna' ? `<div><div class="label" style="margin-bottom:10px">${icon('gift', 'sm')} Available rewards</div><div class="option-row"><div class="row"><span class="feed-ic" style="background:var(--color-highlight-soft);color:#9A7300">${icon('coffee', 'sm')}</span><b>${reward}</b></div><button class="btn btn-ink btn-sm" data-scan-ok data-toast="Reward redeemed">Redeem Reward</button></div></div>` : ''}</div></section>`;
    // Card completion: reward becomes available; redeeming is an explicit tap; extra stamps carry over to the new card.
    if (st === 'rewardReady') {
      main = `<section class="card reveal-up">${custHead(cname, `${cid} · ${coffee.name} (Stamp Card)`, info(ck))}<div class="card-body stack">
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
      main = `<section class="card reveal-up">${custHead(pname, `${pid} · ${pp.name} (Points Program)`, info(pk))}<div class="card-body stack">
      ${manual ? field({ label: `Purchase amount (${cfg.currency})`, input: `<div class="input-wrap"><input class="input big-input focus" type="number" min="0" step="0.01" value="7.50" aria-label="Purchase amount" data-amount></div>`, hint: `Earning rule: ${cfg.basis} ${cfg.currency} = ${cfg.pts} points · ${cfg.rounding.toLowerCase()}` }) : ''}
      <div data-pt-kv>${creditRows(7.5, r0)}</div><p class="hint" data-pt-note hidden></p>
      <div class="row wrap"><button class="btn btn-primary btn-lg" style="flex:1" data-credit>${icon('coins', 'sm')}Credit <span data-cr>${r0.pts}</span> points</button><a class="btn btn-ghost btn-lg" href="${ctx.nav(`${ctx.scan('pointsRedeem')}?c=${pk}`)}">${icon('gift', 'sm')}Redeem points</a></div></div></section>`;
    }
    // Redeem points: employee picks an available reward; points are deducted only after the tap.
    if (st === 'pointsRedeem') {
      const avail = cfg.rewards.map((r, i) => [...r, i]).filter(([, need]) => need <= bal), first = avail[0];
      const rdRows = r => kv([['Customer', pname], ['Current balance', bal + ' points'], ['Reward', r ? `${r[0]} · −${r[1]} points` : '—', true], ['New balance', r ? (bal - r[1]) + ' points' : '—', true]]);
      main = `<section class="card reveal-up">${custHead(pname, `${pid} · ${pp.name} (Points Program)`, info(pk))}<div class="card-body">
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
    if (st === 'tier') main = `<section class="card reveal-up">${custHead(tname, `${tid} · ${cp.name} (Tier Program)`)}<div class="card-body stack">${tk === 'anna' ? offer() : ''}
      <div class="card" data-tier-up hidden style="padding:20px 22px;border-color:color-mix(in srgb,var(--color-mint) 40%,transparent);background:linear-gradient(120deg,var(--color-mint-soft),var(--color-surface) 60%)"><div class="row" style="align-items:flex-start;gap:16px"><span class="success-burst">${icon('trophy', 'lg')}</span><div><b style="font-family:var(--font-display);font-size:20px;color:#13845B" data-tier-up-t></b><p style="margin-top:2px;font-size:15px">The wallet pass switches to the <b data-tier-up-n></b> tier colour.</p><p class="hint" style="margin-top:6px">Wallet pass update: not sent — the Apple/Google Wallet integration is not connected in this environment.</p></div></div></div>
      <div class="grid" style="grid-template-columns:240px 1fr;gap:20px;align-items:center"><div data-tier-pass>${tierPassH(tv)}</div><div><div data-tier-kv>${tierRows(tv)}</div>
        ${tierAmt ? `<div style="margin-top:14px">${field({ label: `Purchase amount (${tc.currency})`, input: `<input class="input big-input" type="number" min="0" step="0.01" placeholder="0.00" aria-label="Purchase amount" data-tier-amount>`, hint: tc.req === 'Points' ? `Earning rule: ${tc.basis} ${tc.currency} = ${tc.pts} points · ${tc.rounding.toLowerCase()}` : 'Added to the customer’s total spending.' })}</div>` : ''}
        <button class="btn btn-primary btn-lg btn-block" style="margin-top:16px" data-tier-go data-scan-ok ${tierAmt ? 'disabled' : ''}>${icon(tc.req === 'Points' ? 'coins' : 'footprints', 'sm')}<span data-tier-go-l>${tc.req === 'Points' ? `Credit ${tierAmt ? 0 : tc.perVisit} points` : 'Record visit'}</span></button>
        ${tk === 'anna' && ctx.can('customerDetails') ? `<a class="link" style="margin-top:12px;display:inline-flex" data-tier-profile hidden href="#">View customer profile ${icon('arrowRight', 'sm')}</a>` : ''}</div></div></div></section>`;
    // Membership: permanent benefit, no stamps — the scan identifies the member, shows the benefit and records a visit (for analytics and win-back).
    const vp = D.programs.find(p => p.id === 'vip'), mk = Object.hasOwn(D.memberScans, q.get('c') || '') ? q.get('c') : 'anna', [mname, mcid, mvis, mlast, msince] = D.memberScans[mk];
    if (st === 'membership') main = `<section class="card reveal-up">${custHead(mname, `${mcid} · ${vp.name} (Membership Card)`)}<div class="card-body stack">${mk === 'anna' ? offer() : ''}
      <div class="grid g2">${[['Benefit', `<span style="font-family:var(--font-display);font-size:26px">${esc(vp.pass.benefit)}</span>`, 'crown'], ['Member since', msince, 'calendar'], ['Visits', `<span data-m-visits>${mvis}</span>`, 'footprints'], ['Last visit', `<span data-m-last>${mlast}</span>`, 'clock']].map(([k, v, i]) => `<div class="setup-item"><small>${icon(i, 'sm')} ${k}</small><b>${v}</b></div>`).join('')}</div>
      <button class="btn btn-primary btn-lg btn-block" data-m-visit data-scan-ok>${icon('footprints', 'sm')}Record visit</button>
      ${mk === 'anna' && ctx.can('customerDetails') ? `<a class="link" data-m-profile hidden href="${ctx.nav(ctx.link('37-') + '?visit=vip')}">View customer profile ${icon('arrowRight', 'sm')}</a>` : ''}</div></section>`;
    // One-time voucher scan: voucher name, valid dates, status → Redeem; a redeemed voucher shows the "Already redeemed" error.
    const vc = D.campaigns.find(c => c.id === 'freecoffee'), vk = Object.hasOwn(D.voucherScans, q.get('c') || '') ? q.get('c') : 'anna', [vn, vid, vs0, vOn] = D.voucherScans[vk];
    const vPass = s => pass({ type: 'voucher', name: vc.name, reward: vc.reward, from: vc.from, to: vc.to, status: s });
    const vRows = s => kv([['Voucher', vc.reward, true], ['Campaign', vc.name], ['Valid from', vc.from], ['Valid to', vc.to], ['Status', s === 'Redeemed' ? badge('Redeemed', 'blue') : badge('Available', 'green')]]);
    if (st === 'voucher') {
      const used = vs0 === 'Redeemed' || vMem.get().includes(vk), on = vs0 === 'Redeemed' ? vOn : 'today';
      main = `<section class="card reveal-up">${custHead(vn, `${vid} · ${vc.name} (One-time voucher)`)}<div class="card-body stack">
      ${used ? `<div data-v-error>${callout('warn', 'Already redeemed', `This voucher was redeemed ${on === 'today' ? 'today' : 'on ' + on}. Each customer can claim and redeem it once — it is no longer valid.`, 'x')}</div>` : ''}
      <div class="grid" style="grid-template-columns:240px 1fr;gap:20px;align-items:center"><div data-v-pass>${vPass(used ? 'Redeemed' : 'Available')}</div><div><div data-v-kv>${vRows(used ? 'Redeemed' : 'Available')}</div>
        ${used ? `<button class="btn btn-ink btn-lg btn-block" style="margin-top:16px" disabled>${icon('x', 'sm')}Already redeemed</button>` : `<button class="btn btn-ink btn-lg btn-block" style="margin-top:16px" data-redeem-voucher data-scan-ok>${icon('ticket', 'sm')}Redeem</button>`}</div></div></div></section>`;
    }
    const wk = Object.hasOwn(D.winbackScans, q.get('c') || '') ? q.get('c') : 'kemal', [wn, wid] = D.winbackScans[wk];
    if (st === 'winback') main = `<section class="card reveal-up">${custHead(wn, `${wid} · Win-back automation`)}<div class="card-body stack">${offer(wk, ctx.can('customerDetails') ? ctx.nav(`${ctx.link('37-')}?c=${wk}&visit=winback`) : '')}</div></section>`;
    // Gift scan (client): the employee sees the available gift; it is never redeemed by the scan itself — only after an explicit confirmation.
    if (st === 'gift') {
      const G = g.GIFTS, gf = G.byId(q.get('g')) || G.byId('g1'), red = gf.red;
      const state = { Available: ['info', 'Customer has an available gift', 'Scanning never redeems a gift. Check the conditions with the customer, then confirm the redemption.', 'gift'], Scheduled: ['warn', 'Gift scheduled', `Available from ${gf.on}. It cannot be redeemed yet.`], Expired: ['warn', 'Gift expired', `Expired on ${gf.exp}. It cannot be redeemed.`], Cancelled: ['warn', 'Gift cancelled', 'This gift was cancelled and cannot be redeemed.'], Redeemed: ['warn', 'Already redeemed', `Redeemed ${red ? red.date + ' by ' + red.by + ' at ' + esc(red.loc) : ''}. This gift can only be redeemed once.`] }[gf.status];
      const giftRows = () => kv([['Gift', esc(gf.name), true], ['Description', esc(gf.desc) || '—'], ['Status', `<span data-gs-status>${status(gf.status)}</span>`], ['Activation date', gf.on], ['Expiration date', gf.exp], ...G.optRows(gf), ['Terms and conditions', esc(gf.terms) || '—'], ['Redemption date', `<span data-gs-date>${red ? red.date : '—'}</span>`], ['Redeemed by', `<span data-gs-by>${red ? red.by : '—'}</span>`], ['Redemption location', `<span data-gs-loc>${red ? esc(red.loc) : '—'}</span>`]]);
      main = `<section class="card reveal-up">${custHead(esc(gf.customer), `${gf.cid} · Gift · ${esc(G.srcLabel(gf))}`)}<div class="card-body stack">
        <div data-gs-callout>${callout(...state)}</div>${giftRows()}
        <button class="btn btn-ink btn-lg btn-block" data-open="giftConfirm" data-gs-redeem ${gf.status === 'Available' ? '' : 'disabled'}>${icon('gift', 'sm')}Redeem gift</button>
        <p class="hint" data-gs-wallet hidden>Wallet pass update: not sent — the Apple/Google Wallet integration is not connected in this environment.</p>
        ${ctx.has('rewards-surprise') ? `<a class="link" data-gs-log hidden href="${ctx.nav(`${ctx.link('46-')}?tab=log&redeemed=${gf.id}`)}">View activity log ${icon('arrowRight', 'sm')}</a>` : ''}</div></section>`;
      tail = `${modal({ id: 'giftConfirm', open: false, title: 'Redeem this gift?', sub: 'The gift is redeemed only after you confirm.', body: kv([['Customer', esc(gf.customer)], ['Gift', esc(gf.name), true], ['Redemption', gf.opts.multi ? 'Multiple — stays available until it expires' : 'Single — cannot be redeemed again'], ['Location', esc(D.locations[0])]]), foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-ink" data-close data-gs-confirm data-scan-ok>${icon('check', 'sm')}Confirm redemption</button>` })}`;
      g.__gift = gf;
    }
    const withAnna = ['confirmed', 'points', 'tier', 'membership'].includes(st);
    return { nav: 'QR Scanner', html: `${pageHead({ eyebrow: `${icon('qr', 'sm')} Scanner`, title: 'QR <span class="hl">Scanner</span>', sub: 'Scan a customer’s wallet pass, confirm the action, and the pass updates.', actions: ctx.has('qr-codes') ? `<a class="btn btn-ghost" href="${ctx.page('qr-codes')}">${icon('qr', 'sm')}Printable QR codes</a>` : '' })}
      <div class="grid" style="grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);align-items:start">${main}${feed(ctx, withAnna)}</div>${tail}`, after() {
        const go = (state, qs) => location.href = ctx.nav(ctx.scan(state) + (qs ? '?' + qs : ''));
        const sc = document.querySelector('[data-scan]'); if (sc) sc.onclick = () => go('stamp');
        const f = document.querySelector('[data-find]'); if (f) f.onclick = () => { const v = document.querySelector('[data-code]').value.trim(); if (/^BNC-/i.test(v)) go('stamp'); else g.toast('Enter a pass code like BNC-DEMO1000'); };
        const pk = document.querySelector('[data-pick]'); if (pk) pk.onchange = () => { const to = picks[pk.selectedIndex - 1]; go(...(to ? to.slice(1) : ['idle'])); };
        document.querySelectorAll('[data-new-scan]').forEach(b => b.onclick = () => go('idle'));
        g.scanSuccess(document.querySelector('[data-scan-confirmed]'));
        let qty = 1; const qi = document.querySelector('[data-qty-in]'), ql = document.querySelector('[data-qty-label]');
        const setQty = v => { qty = Math.max(1, Math.min(maxPer, parseInt(v, 10) || 1)); if (qi) qi.value = qty; ql.textContent = qty > 1 ? qty + ' stamps' : 'stamp'; };
        document.querySelectorAll('[data-qty]').forEach(b => b.onclick = () => setQty(qty + +b.dataset.qty)); if (qi) qi.onchange = () => setQty(qi.value);
        const as = document.querySelector('[data-add-stamp]'); if (as) as.onclick = () => {
          [...document.querySelectorAll('[data-stamp-pass] .stamp:not(.on)')].slice(0, qty).forEach(x => x.classList.add('on'));
          document.querySelector('[data-stamps]').textContent = Math.min(total, filled + qty); as.disabled = true; g.successSound();
          const qs = `?c=${ck}&n=${qty}`; setTimeout(() => location.href = ctx.nav((filled + qty >= total ? ctx.scan('rewardReady') : ctx.scan('confirmed')) + qs), 650);
        };
        const rv = document.querySelector('[data-redeem-voucher]'); if (rv) rv.onclick = () => {
          vMem.add(vk); document.querySelector('[data-v-pass]').innerHTML = vPass('Redeemed'); document.querySelector('[data-v-kv]').innerHTML = vRows('Redeemed');
          rv.disabled = true; rv.innerHTML = `${icon('check', 'sm')}Voucher redeemed`; g.toast('Voucher redeemed — it can’t be used again');
        };
        document.querySelectorAll('[data-wb-redeem]').forEach(b => b.onclick = () => {
          const c = b.closest('[data-wb]'), l = c.querySelector('[data-wb-profile]'); c.querySelector('[data-wb-kv]').innerHTML = wbRows(c.dataset.wb, true);
          b.disabled = true; b.innerHTML = `${icon('check', 'sm')}Reward redeemed`; if (l) l.hidden = false; g.toast('Reward redeemed · visit recorded · inactivity timer reset');
        });
        const rr = document.querySelector('[data-redeem-ready]'); if (rr) rr.onclick = () => {
          document.querySelector('[data-rw-status]').innerHTML = badge('Redeemed', 'blue'); document.querySelector('[data-stamp-pass]').innerHTML = stampPass(carry);
          rr.disabled = true; rr.innerHTML = `${icon('check', 'sm')}Reward redeemed`; g.toast(`Reward redeemed — new card ${carry}/${total}`); g.scanSuccess(document.querySelector('[data-stamp-pass]'));
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
          cr.onclick = () => { const r = calc(); g.successSound(); location.href = ctx.nav(ctx.has('points-transactions') ? `${ctx.page('points-transactions')}?new=credit&c=${pk}&a=${amt()}&p=${r.pts}` : `${ctx.scan('confirmed')}?k=points&c=${pk}&p=${r.pts}`); };
        }
        const tg = document.querySelector('[data-tier-go]'); if (tg) {
          const ta = document.querySelector('[data-tier-amount]');
          const delta = () => { const a = ta ? parseFloat(ta.value) || 0 : 0; return tc.req === 'Visits' ? 1 : tc.req === 'Points' ? (ta ? g.calcPoints(a, tc).pts : tc.perVisit) : +a.toFixed(2); };
          if (ta) ta.oninput = () => { const d = delta(); tg.disabled = !(d > 0); if (tc.req === 'Points') document.querySelector('[data-tier-go-l]').textContent = `Credit ${d} points`; };
          tg.onclick = () => { const d = delta(); if (!(d > 0)) return; const nv = +(tv + d).toFixed(2), was = T.at(tc, tv), now = T.at(tc, nv), up = now.i > was.i;
            document.querySelector('[data-tier-pass]').innerHTML = tierPassH(nv); document.querySelector('[data-tier-kv]').innerHTML = tierRows(nv);
            tg.disabled = true; if (ta) ta.disabled = true; tg.innerHTML = `${icon('check', 'sm')}${tc.req === 'Points' ? d + ' points credited' : 'Visit recorded'}`;
            if (up) { const b = document.querySelector('[data-tier-up]'); b.querySelector('[data-tier-up-t]').textContent = `Upgraded to ${now.name}`; b.querySelector('[data-tier-up-n]').textContent = now.name; b.hidden = false; }
            const pl = document.querySelector('[data-tier-profile]'); if (pl) { pl.href = ctx.nav(`${ctx.link('37-')}?visit=club&v=${nv}`); pl.hidden = false; }
            g.toast(up ? `Upgraded to ${now.name}` : tc.req === 'Points' ? `${d} points credited` : 'Visit recorded'); };
        }
        const mv = document.querySelector('[data-m-visit]'); if (mv) mv.onclick = () => {
          document.querySelector('[data-m-visits]').textContent = mvis + 1; document.querySelector('[data-m-last]').textContent = 'Just now';
          mv.disabled = true; mv.innerHTML = `${icon('check', 'sm')}Visit recorded`; const pl = document.querySelector('[data-m-profile]'); if (pl) pl.hidden = false; g.toast('Visit recorded');
        };
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
            const log = document.querySelector('[data-rd-log]'); if (log) { log.href = ctx.nav(`${ctx.page('points-transactions')}?new=redeem&c=${pk}&r=${pick}`); log.hidden = false; } g.toast(`${n} redeemed — ${need} points deducted`); g.scanSuccess(document.querySelector('[data-pts-pass]')); };
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

  // Employees open the same screen with limited info (client): name, active programs, progress, available rewards — no email/phone/notes/analytics.
  S.customerProfile = ctx => {
    // Employee: limited customer info only (client) — name, active programs, progress, available rewards.
    if (!ctx.can('customerDetails')) {
    const q = new URLSearchParams(location.search), ck = Object.hasOwn(D.custInfo, q.get('c') || '') ? q.get('c') : 'anna', [cn, progs, rws] = D.custInfo[ck];
    const programs = progs.map(([id, txt, pct, code], i) => { const p = D.programs.find(x => x.id === id), pts = p.kind === 'points';
      return `<div class="option-row" style="display:block${i ? ';margin-top:10px' : ''}"><div class="row between"><div class="row"><span class="feed-ic" style="background:${pts ? 'var(--color-highlight-soft);color:#9A7300' : 'var(--color-accent-soft);color:var(--color-accent)'}">${icon(p.icon, 'sm')}</span><div><b>${p.name}</b><small>${txt}</small></div></div>${pts ? (ctx.has('points-transactions') ? `<a class="link" href="${ctx.page('points-transactions')}">Transactions ${icon('arrowRight', 'sm')}</a>` : '') : code ? `<span class="mono faint" style="font-size:12px">Pass ${code}</span>` : ''}</div>${pct != null ? `<div class="mini-prog"><i style="--w:${pct}%"></i></div>` : ''}</div>`; }).join('');
    const rewards = `<div class="stack" style="gap:10px">${rws.map(([r, s, i]) => `<div class="option-row"><div class="row"><span class="feed-ic" style="background:var(--color-highlight-soft);color:#9A7300">${icon(i, 'sm')}</span><div><b>${r}</b><small>${s}</small></div></div>${status('Available')}</div>`).join('') || '<p class="muted">No rewards available yet.</p>'}</div>`;
      const [f, l] = cn.split(' ');
      return { nav: 'QR Scanner', title: cn, html: `${pageHead({ eyebrow: crumb('QR Scanner', ctx.link('01-')) + 'Customer info', title: `<span class="row" style="gap:16px"><span class="avatar round" style="width:60px;height:60px;font-size:20px">${U.initials(cn)}</span><span>${f} <span class="hl">${l}</span></span></span>`, sub: 'Active programs, progress and available rewards.' })}
      <div class="grid g2">${card({ title: 'Active programs', icon: 'wallet', sub: 'Progress on each program.', cls: 'reveal-up', body: programs })}${card({ title: 'Available rewards', icon: 'gift', cls: 'reveal-up', body: rewards })}</div>` };
    }
    const hist = [ctx.owner ? 'Oct 21, 2026, 02:27 PM' : 'Oct 21, 2026, 02:29 PM', 'Oct 19, 2026, 08:22 PM', 'Sep 22, 2026, 09:08 AM', 'Sep 13, 2026, 07:20 PM', 'Aug 20, 2026, 06:17 PM', 'Aug 17, 2026, 01:55 PM', 'Aug 8, 2026, 03:02 PM', 'Jul 29, 2026, 10:21 AM', 'Jul 22, 2026, 08:33 PM', 'Jul 15, 2026, 07:19 PM', 'Jul 7, 2026, 03:35 PM', 'Jun 26, 2026, 01:25 PM'];
    // Win-back customer opened from the scanner (?c=): last visit + days inactive; &visit=winback = after Redeem Reward (visit recorded, inactivity timer reset).
    const q = new URLSearchParams(location.search), wk = Object.hasOwn(D.winbackScans, q.get('c') || '') ? q.get('c') : '', back = !!wk && q.get('visit') === 'winback';
    // Membership / tier visit recorded in the scanner (?visit=vip|club).
    const vk = q.get('visit'), vprog = Object.hasOwn({ vip: 1, club: 1 }, vk || '') ? D.programs.find(p => p.id === vk) : null;
    const cp = D.programs.find(p => p.id === 'club'), tv = vk === 'club' && isFinite(parseFloat(q.get('v'))) ? parseFloat(q.get('v')) : D.tierScans.anna[2], tp = g.TIER.pass(cp, tv), vip = D.programs.find(p => p.id === 'vip');
    const [cn, cid, days, last, from] = wk ? D.winbackScans[wk] : ['Anna Schmidt', 'C-10001'], cu = D.customers.find(c => c.id === cid), [fn, ln] = cn.split(' ');
    // Gifts assigned to this customer (manual gift from the profile); ?new=gift = the one just assigned.
    const G = g.GIFTS, gifts = G.all(ctx).filter(x => x.cid === cid), fresh = gifts.find(x => x.fresh);
    const giftSub = x => `gift · ${x.status === 'Scheduled' ? 'activates ' + x.on : x.status === 'Redeemed' ? 'redeemed ' + x.red.date : 'expires ' + x.exp}`;
    const visits = [...(vprog ? [['Visit recorded', vprog.name, 'Just now']] : []), ...(back ? [['Visit recorded', 'Win-back reward redeemed', 'Just now']] : []), ...(wk ? hist.slice(from) : hist).map(h => ['Stamp added', 'Coffee Card', h])];
    const rws = [...(wk ? [[wbReward(days), 'win-back', 'gift', back ? 'Redeemed' : 'Available']] : []), ['1 Free Coffee', 'stamp card', 'stamp', 'Available'], ['1 Free Coffee', 'voucher', 'ticket', 'Available'], ...gifts.map(x => [esc(x.name), giftSub(x), 'gift', x.status, x.fresh])];
    const lastV = `<span data-last-visit>${vprog ? 'Just now' : wk && !back ? last : 'Oct 21, 2026'}</span>`, nAvail = rws.filter(r => r[3] === 'Available').length;
    const st = [['Number of scans', `<span data-count="${visits.length}">${visits.length}</span>`, 'scan'], ['Last visit', lastV, 'calendar', wk ? `Inactive for <span data-inactive-days>${back ? 0 : days}</span> days` : ''], ['Available rewards', `<span data-count="${nAvail}">${nAvail}</span>`, 'gift']];
    const gm = modal({ id: 'gift', open: ctx.opts.modal === 'gift', wide: true, title: 'Assign gift', sub: `${esc(cn)} · ${cid} — the gift appears on the customer’s account and becomes redeemable by QR scan.`, body: G.giftForm(), foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-assign-gift>${icon('gift', 'sm')}Assign gift</button>` });
    return { nav: 'Customers', title: cn, after() {
        const read = G.wireGiftForm(document.querySelector('[data-modal="gift"] [data-gift-form]'));
        document.querySelector('[data-assign-gift]').onclick = () => { const p = read(); if (p) location.href = ctx.nav(`${ctx.link('37-')}?new=gift&${p}`); };
      }, html: `${pageHead({ eyebrow: crumb('Customers', ctx.link('35-')) + esc(cn), title: `<span class="row" style="gap:16px"><span class="avatar round" style="width:60px;height:60px;font-size:20px">${U.initials(cn)}</span><span>${esc(fn)} <span class="hl">${esc(ln)}</span></span></span>`, sub: `Customer ID <span class="mono">${cid}</span>`, actions: `<button class="btn btn-primary" data-open="gift">${icon('gift', 'sm')}Assign gift</button>` })}
      ${fresh ? `<div class="reveal-up" style="margin-bottom:18px" data-gift-assigned>${callout('info', 'Gift assigned', `${esc(fresh.name)} — ${fresh.status}${fresh.status === 'Scheduled' ? ' from ' + fresh.on : ''}. Customer notification not delivered: app, email and wallet notifications are not connected in this environment. <a class="link" href="${ctx.nav(`${ctx.link('45-')}?${fresh.query}&new=gift`)}">View in Rewards ${icon('arrowRight', 'sm')}</a>`, 'checkCircle')}</div>` : ''}
      ${back ? `<div style="margin-bottom:18px" data-wb-done>${callout('info', 'Win-back reward redeemed', `Visit recorded today — ${esc(cn)} is active again, so the inactivity timer was reset.`, 'checkCircle')}</div>` : ''}
      <div class="grid g3">${st.map(([l, v, i, note], n) => `<div class="card hover stat reveal-up ${n === 0 ? 'feature' : ''}"><div class="lbl">${l}<span class="ico">${icon(i, 'sm')}</span></div><div class="val">${v}</div>${note ? `<div class="note">${note}</div>` : ''}</div>`).join('')}</div>
      <div class="grid g2" style="margin-top:18px">
        ${card({ title: 'Profile', icon: 'badge', cls: 'reveal-up', body: U.setup([['Email', cu.email], ['Phone', cu.phone], ['Birthday', '<span class="faint">—</span>'], ['Joined', cu.joined]]) })}
        ${card({ title: 'Memberships', icon: 'wallet', sub: 'Programs, current tier and balances.', cls: 'reveal-up', body: `<div class="option-row" style="display:block"><div class="row between"><div class="row"><span class="feed-ic" style="background:var(--color-accent-soft);color:var(--color-accent)">${icon('stamp', 'sm')}</span><div><b>Coffee Card</b><small>2 / 10 stamps</small></div></div><span class="mono faint" style="font-size:12px">Pass BNC-DEMO1000</span></div><div class="mini-prog"><i style="--w:20%"></i></div></div><div class="option-row" style="display:block;margin-top:10px"><div class="row between"><div class="row"><span class="feed-ic" style="background:var(--color-highlight-soft);color:#9A7300">${icon('coins', 'sm')}</span><div><b>Coffee Rewards</b><small>120 points · next: Free Dessert at 250</small></div></div><a class="link" href="${ctx.page('points-transactions')}">Transactions ${icon('arrowRight', 'sm')}</a></div></div><div class="option-row" style="display:block;margin-top:10px"><div class="row"><span class="feed-ic" style="background:var(--color-accent-soft);color:var(--color-accent)">${icon('crown', 'sm')}</span><div><b>${vip.name}</b><small>${esc(vip.pass.benefit)} · member since ${D.memberScans.anna[4]}</small></div></div></div><div class="option-row" style="display:block;margin-top:10px" data-prof-tier><div class="row"><span class="feed-ic" style="background:var(--color-mint-soft);color:#13845B">${icon('layers', 'sm')}</span><div><b>${cp.name}</b><small>Current tier: <span data-cur-tier>${tp.tier}</span> · ${tp.next}</small></div></div><div class="mini-prog"><i style="--w:${tp.pct}%"></i></div></div>` })}
        ${card({ title: 'Rewards', icon: 'gift', cls: 'reveal-up', body: `<div class="stack" style="gap:10px" data-rewards data-profile-rewards>${rws.map(([r, s, i, stt, f]) => `<div class="option-row" ${f ? 'data-fresh style="background:var(--color-mint-soft)"' : ''}><div class="row"><span class="feed-ic" style="background:var(--color-highlight-soft);color:#9A7300">${icon(i, 'sm')}</span><div><b>${r}</b><small>${s}</small></div></div>${status(stt)}</div>`).join('')}</div>` })}
        ${card({ title: 'Notes', icon: 'edit', cls: 'reveal-up', body: `<div class="stack" style="gap:12px">${textarea(wk ? '' : 'Prefers oat milk.')}<div><button class="btn btn-primary btn-sm" data-toast="Notes saved">Save notes</button></div></div>` })}
      </div>
      <div style="margin-top:18px">${card({ title: 'Visit history', icon: 'clock', actions: badge(visits.length + ' visits', 'outline'), cls: 'reveal-up', body: `<div class="timeline" data-visit-history>${visits.map(([a, b, h]) => `<div class="tl-item"><span><b style="font-weight:600">${a}</b> <span class="faint">· ${b}</span></span><span class="muted">${h}</span></div>`).join('')}</div>` })}</div>${gm}` };
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
  // Same scan feed as the scanner, full list: time, customer, action.
  S.recentScans = ctx => ({ nav: 'Recent scans', html: `${pageHead({ eyebrow: `${icon('clock', 'sm')} Scanner`, title: 'Recent <span class="hl">scans</span>', sub: 'Time, customer and action of the latest scans.', actions: `<a class="btn btn-primary" href="${ctx.link('01-')}">${icon('scan', 'sm')}Scan</a>` })}${feed(ctx, false, D.scansBase.length)}` });
  S.account = ctx => {
    const me = D.team.find(t => t[2] === 'Employee');
    return { nav: 'Account', html: `${pageHead({ eyebrow: `${icon('badge', 'sm')} Account`, title: 'Your <span class="hl">account</span>' })}
      ${card({ title: me[0], icon: 'badge', cls: 'reveal-up', body: `<div class="stack">${kv([['Name', me[0]], ['Role', badge(me[2], '')], ['Business', 'Sample Business (development)']])}
        <div class="option-row"><div><b>Language</b><small>App interface language</small></div>${select(['English', 'Deutsch', 'Türkçe', 'Français', 'Italiano'], 'English', 'style="max-width:180px"')}</div></div>`, foot: `<a class="btn btn-ghost" href="../../common/pages/03-login.html" data-logout>${icon('logout', 'sm')}Log out</a>` })}` };
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
