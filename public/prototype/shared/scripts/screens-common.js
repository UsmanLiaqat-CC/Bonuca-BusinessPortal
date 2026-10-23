/* Common (public / auth / onboarding) screens */
(function (g) {
  const U = g.UI, { icon, esc, field, input, select, check, colorIn, upload, callout, pass, modal, kv, badge } = U;
  const S = g.SCREENS = g.SCREENS || {};
  const amb = `<div class="ambient"><i></i><i></i><i></i><div class="lines"></div></div>`;
  const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  // ❓ Client markets (EUR/GBP/CZK/PLN/USD) + "Other"; the country only suggests a language (the five client languages).
  const COUNTRIES = ['Select…', 'Germany', 'Austria', 'Switzerland', 'Türkiye', 'France', 'Italy', 'United Kingdom', 'Czechia', 'Poland', 'United States', 'Other'];
  const COUNTRY_LANG = { Germany: 'Deutsch', Austria: 'Deutsch', Switzerland: 'Deutsch', Türkiye: 'Türkçe', France: 'Français', Italy: 'Italiano', 'United Kingdom': 'English', 'United States': 'English' };
  const LANGS = ['English', 'Deutsch', 'Türkçe', 'Français', 'Italiano'];
  // Client vision: restaurants, cafés, barber shops, beauty salons, bakeries and other local businesses.
  const CATEGORIES = ['Select…', 'Restaurant', 'Café', 'Barber Shop', 'Beauty Salon', 'Bakery', 'Other'];
  const ACCOUNTS = [['Owner', 'owner@sample.dev', '../../owner/pages/01-dashboard.html'], ['Manager', 'manager@sample.dev', '../../manager/pages/01-dashboard.html'], ['Employee', 'employee@sample.dev', '../../employee/pages/01-scanner-home.html']];

  /* ---------- plans (client example structure: Free / Business / Pro + Free Trial) ---------- */
  g.DATA.plans.business = g.DATA.plans.business || ['Up to ≈150–200 customers', 'Additional loyalty programs', 'More employees', 'Additional analytics and features'];
  // ❓ Indicative prices from the client (≈€25 Business, ≈€50–60 Pro); final monthly and annual prices are configured by Bonuca (Super Admin).
  const PLANS = [['free', 'Free Plan', 'No payment details required', '€0'], ['trial', 'Free Trial', '14 days, then reverts to Free (or Preview) — no data is deleted', '€0'], ['business', 'Business Plan', 'For growing businesses — more customers, programs and employees', '≈ €25'], ['pro', 'Pro Plan', 'Advanced programs, analytics, campaigns and customisation', '≈ €50–60']];
  const paid = k => k === 'business' || k === 'pro';
  const priceHtml = (k, pr) => `<div class="price" ${paid(k) ? `data-price="${pr}"` : ''}>${pr}<span class="faint" style="font-size:14px;font-weight:600"> ${paid(k) ? '/ month' : k === 'trial' ? 'for 14 days' : ''}</span></div>`;
  const periodSeg = `<div class="seg" data-period role="group" aria-label="Billing period"><button class="on" data-p="m">Monthly</button><button data-p="y">Annual</button></div>`;
  const planGrid = cta => `<div class="grid g4">${PLANS.map(([k, n, sub, pr]) => g.planCard(n, sub, g.DATA.plans[k], cta(k, n), { cls: k === 'trial' ? 'current' : k === 'pro' ? 'ink' : '', price: priceHtml(k, pr), note: paid(k) ? 'Indicative monthly price; the annual price is set by Bonuca.' : '' })).join('')}</div>`;
  const wirePeriod = () => document.querySelectorAll('[data-period] button').forEach(b => b.addEventListener('click', () => document.querySelectorAll('[data-price]').forEach(el => { el.innerHTML = b.dataset.p === 'y' ? `<span style="font-size:17px">Annual price — set by Bonuca</span>` : `${el.dataset.price}<span class="faint" style="font-size:14px;font-weight:600"> / month</span>`; })));

  S.landing = ctx => {
    // ❓ Store listings are not live yet: badges stay disabled instead of linking to placeholder URLs.
    const dl = modal({ id: 'download', open: !!ctx.opts.modal, title: 'Download App', sub: 'Get Bonuca on your phone — iOS and Android.', body: `<div class="stack"><div class="grid g2" style="gap:10px"><button class="btn btn-ink btn-block is-locked" disabled>${icon('apple', 'sm')}App Store · coming soon</button><button class="btn btn-ink btn-block is-locked" disabled>${icon('phone', 'sm')}Google Play · coming soon</button></div><p class="hint">App store links are not configured yet. They will appear here once the iOS and Android listings are live.</p></div>`, foot: `<button class="btn btn-ghost" data-close>Close</button>` });
    const plans = `<section id="plans" style="position:relative;z-index:1;max-width:1180px;margin:0 auto;padding:30px 24px 70px"><div class="reveal-up" style="text-align:center"><div class="eyebrow">${icon('card', 'sm')} Plans</div><h2 class="page-title">Start free, <span class="hl">upgrade</span> when you grow</h2><p class="page-sub" style="max-width:560px;margin:10px auto 0">Register without payment details. Changing plans never deletes customers, programs or transactions.</p><div style="margin:18px 0 20px">${periodSeg}</div></div>
      ${planGrid((k, n) => `<a class="btn ${k === 'trial' ? 'btn-primary' : 'btn-ghost'} btn-block" href="04-register.html">${k === 'free' ? 'Start Free' : k === 'trial' ? 'Start Free Trial' : 'Choose ' + n.replace(' Plan', '')}</a>`)}</section>`;
    return { title: 'Bonuca — Loyalty programs', html: `${amb}<div class="public-wrap">${g.publicTop(`<a class="btn btn-ink btn-sm" href="03-login.html">Log In</a>`)}
<section class="hero">
  <div class="hero-badge reveal-up"><b>New</b>Apple Wallet &amp; Google Wallet passes</div>
  <h1 class="reveal-up">Loyalty programs and <span class="hl-wrap" style="background:linear-gradient(transparent 72%,var(--color-highlight) 72%,var(--color-highlight) 90%,transparent 90%)">digital wallet cards</span> for your business</h1>
  <p class="reveal-up">Stamp cards, memberships, tiers and points — issued to Apple Wallet and Google Wallet, managed in one place.</p>
  <div class="row reveal-up" style="justify-content:center;margin-top:30px;flex-wrap:wrap">
    <a class="btn btn-primary btn-lg" href="04-register.html">Start Free ${icon('arrowRight', 'sm')}</a>
    <a class="btn btn-ghost btn-lg" href="03-login.html">Log In</a>
    <button class="btn btn-ink btn-lg" data-open="download">${icon('download', 'sm')}Download App</button>
    <a class="btn btn-text btn-lg" href="#plans">View plans</a>
  </div>
  <div class="hero-cards">
    <div class="float-pass" style="left:4%;top:60px;--r:-8deg;transform:rotate(-8deg);width:270px;opacity:.95">${pass({ type: 'points', name: 'Coffee Rewards', balance: '240 pts', nextReward: 'Free Dessert', needed: '10', pct: 92 }).replace('<div class="pass-qr">', '<div class="pass-qr" style="display:none">')}</div>
    <div class="float-pass" style="left:50%;margin-left:-175px;top:0;width:350px;z-index:2;animation-delay:-2s">${pass({ type: 'stamp', name: 'Bonuca', reward: '1 Free Coffee', total: 10, filled: 6 }).replace('<div class="pass-qr">', '<div class="pass-qr" style="display:none">')}</div>
    <div class="float-pass" style="right:4%;top:70px;--r:8deg;width:270px;animation-delay:-4s">${pass({ type: 'membership', name: 'VIP Member', benefit: '10% Discount', bg: '#1B1B1F' }).replace('<div class="pass-qr">', '<div class="pass-qr" style="display:none">')}</div>
  </div>
</section>${plans}</div>${dl}<div class="toast-zone"></div>`, after: wirePeriod };
  };

  S.login = () => ({ title: 'Log in', html: `<div class="auth-split">
  <section class="auth-art">
    <div class="dots"></div>
    <a class="brand" href="01-landing.html" style="position:relative;padding:0"><span class="brand-mark" style="background:#000">B</span><span class="brand-name" style="color:#fff">Bonuca</span></a>
    <h1 style="margin-top:70px" class="reveal-up">Loyalty programs and <em>digital wallet cards</em> for your business</h1>
    <p class="reveal-up" style="margin-top:18px;max-width:440px;opacity:.7;font-size:16px">Stamp cards, memberships, tiers and points — issued to Apple Wallet and Google Wallet, managed in one place.</p>
    <div style="position:relative;flex:1;min-height:330px">
      <div class="float-pass" style="left:250px;top:20px;--r:5deg;width:260px">${pass({ type: 'points', name: 'Coffee Rewards', balance: '240 pts', nextReward: 'Free Dessert', needed: '10', pct: 92, bg: 'linear-gradient(150deg,#1B2560,#0A112F)' }).replace('<div class="pass-qr">', '<div class="pass-qr" style="display:none">')}</div>
      <div class="float-pass" style="left:40px;top:150px;--r:-5deg;width:290px;animation-delay:-3s">${pass({ type: 'stamp', name: 'Coffee Card', reward: '1 Free Coffee', total: 10, filled: 7 }).replace('<div class="pass-qr">', '<div class="pass-qr" style="display:none">')}</div>
    </div>
    <small style="position:relative;opacity:.5">© Bonuca</small>
  </section>
  <section style="display:flex;flex-direction:column">
    <div class="row" style="justify-content:flex-end;padding:6px">${g.SHELL_BITS.lang()}${g.SHELL_BITS.themeSeg()}</div>
    <div style="flex:1;display:grid;place-items:center;padding:20px">
      <form class="stack" style="width:100%;max-width:420px" novalidate data-login>
        <div class="reveal-up"><div class="eyebrow">${icon('shield', 'sm')} Business Portal</div><h1 class="page-title">Log in to <span class="hl">Bonuca</span></h1><p class="page-sub">Welcome back. Log in to manage your programs, customers and team.</p></div>
        ${field({ label: 'Email Address', required: true, input: `<div class="input-wrap">${icon('mail')}<input class="input" type="email" placeholder="you@business.com" autocomplete="email" data-email></div>` })}
        ${field({ label: 'Password', required: true, input: `<div class="input-wrap">${icon('lock')}<input class="input" type="password" placeholder="••••••••" autocomplete="current-password" data-pw><span class="trail"><button type="button" class="icon-btn" data-peek aria-label="Show password">${icon('eye', 'sm')}</button></span></div>` })}
        <div style="text-align:right;margin-top:-6px"><a class="link underline-hl" style="color:var(--color-text-primary);font-size:13.5px" href="10-forgot-password.html">Forgot password?</a></div>
        <button class="btn btn-primary btn-lg btn-block" type="submit">Log In ${icon('arrowRight', 'sm')}</button>
        <div class="callout dev dev-accounts" style="display:block">
          <b style="display:flex;gap:8px;align-items:center;margin-bottom:6px">${icon('zap', 'sm')}Development sample accounts</b>
          ${ACCOUNTS.map(([r, e]) => `<div class="acc"><span>${r}: <span class="mono">${e}</span></span><button type="button" class="btn btn-text btn-sm" style="color:var(--color-accent)" data-use="${e}">Use</button></div>`).join('')}
        </div>
        <p class="muted" style="text-align:center">New to Bonuca? <a class="link underline-hl" style="color:var(--color-text-primary)" href="04-register.html">Start Free</a></p>
      </form>
    </div>
  </section>
</div><div class="toast-zone"></div>`, after() {
    const q = new URLSearchParams(location.search);
    if (q.has('reset')) g.toast('Password updated. Log in with your new password.');
    if (q.has('invited')) g.toast('Invitation accepted. Log in with your new password.');
    const em = document.querySelector('[data-email]'), pw = document.querySelector('[data-pw]');
    document.querySelector('[data-peek]').onclick = () => { pw.type = pw.type === 'password' ? 'text' : 'password'; };
    document.querySelectorAll('[data-use]').forEach(b => b.onclick = () => { em.value = b.dataset.use; pw.value = 'password1'; setErr(em, ''); setErr(pw, ''); });
    document.querySelector('[data-login]').onsubmit = e => {
      e.preventDefault(); const v = em.value.trim(), acc = ACCOUNTS.find(a => a[1] === v.toLowerCase());
      const ok = [setErr(em, !v ? 'Enter your email address.' : EMAIL.test(v) ? '' : 'Enter a valid email address.'), setErr(pw, pw.value ? '' : 'Enter your password.')].every(Boolean);
      if (!ok) return;
      if (acc && /^(password1|Bonuca123)$/.test(pw.value)) location.href = acc[2]; else setErr(pw, 'Incorrect email or password. In this prototype, log in with a development sample account (password: password1).');
    };
  } });

  function authFrame(title, sub, inner, opts = {}) {
    return `${amb}<div class="public-wrap">${g.publicTop()}<div style="padding:24px 20px 60px"><div class="auth-card" style="max-width:${opts.w || 520}px">
      ${opts.stepper || ''}<div class="reveal-up" style="margin-bottom:22px">${opts.eyebrow ? `<div class="eyebrow">${opts.eyebrow}</div>` : ''}<h1 class="page-title">${title}</h1>${sub ? `<p class="page-sub">${sub}</p>` : ''}</div>
      <div class="card reveal-up" style="padding:26px">${inner}</div>${opts.after || ''}</div></div></div>${opts.modals || ''}<div class="toast-zone"></div>`;
  }
  // Client: users must always be able to go back and log out during sign-up and onboarding.
  const exits = (back, label = 'Back') => `<div class="row between wrap" style="margin-top:18px"><a class="btn btn-text" href="${back}">${icon('chevronLeft', 'sm')}${label}</a><a class="btn btn-text" href="03-login.html">${icon('logout', 'sm')}Log out</a></div>`;

  S.register = ctx => {
    const E = !!ctx.opts.errors, m = k => E ? '' : g.mem.get(k, '');
    const inner = `<form class="stack" novalidate data-register>
      ${field({ label: 'Full Name', required: true, input: input({ value: m('signup-name'), attrs: 'name="name" autocomplete="name"' }), error: E && 'Full name is required.' })}
      ${field({ label: 'Email Address', required: true, input: `<div class="input-wrap">${icon('mail')}${input({ type: 'email', value: m('signup-email'), attrs: 'name="email" autocomplete="email"', ph: 'you@business.com' })}</div>`, error: E && 'Enter a valid email address.' })}
      ${field({ label: 'Password', required: true, input: `<div class="input-wrap">${icon('lock')}${input({ type: 'password', attrs: 'name="pw" autocomplete="new-password"' })}</div>`, hint: 'Use at least 8 characters, including a letter and a number.', error: E && 'Use at least 8 characters, including a letter and a number.' })}
      <div class="form-grid">
        ${field({ label: 'Country', required: true, input: select(COUNTRIES, m('signup-country') || 'Select…', 'name="country"'), hint: '<span data-country-hint>Used to suggest your language and program currency later.</span>', error: E && 'Choose your country.' })}
        ${field({ label: 'Phone Number', optional: true, input: input({ type: 'tel', attrs: 'name="phone" autocomplete="tel"', ph: '+49' }) })}
      </div>
      <div class="field ${E ? 'has-error' : ''}">${check('I accept the <a class="underline-hl" href="#terms" data-open="terms">Terms &amp; Privacy Policy</a>', false, 'name="terms"')}${E ? `<div class="error-msg">${icon('info', 'sm')}You must accept the Terms &amp; Privacy Policy to continue.</div>` : ''}</div>
      <button class="btn btn-primary btn-lg btn-block" type="submit">Create Account ${icon('arrowRight', 'sm')}</button>
    </form>`;
    // ❓ The legal text is not part of the client material; Bonuca provides it before launch.
    const terms = modal({ id: 'terms', open: false, title: 'Terms &amp; Privacy Policy', sub: 'Bonuca Business Portal', body: callout('info', 'Legal text pending', 'The Terms of Service and Privacy Policy are provided by Bonuca before launch. They will be shown here in full.'), foot: `<button class="btn btn-ghost" data-close>Close</button>` });
    return { title: 'Create your account', html: authFrame('Create your <span class="hl">account</span>', 'Start with a free plan — upgrade any time.', inner, { eyebrow: `${icon('sparkles', 'sm')} Get started`, modals: terms, after: `<p class="muted" style="text-align:center;margin-top:18px">Already have an account? <a class="link underline-hl" style="color:var(--color-text-primary)" href="03-login.html">Log In</a></p>` }), after() {
      const f = document.querySelector('[data-register]'), v = n => f.elements[n];
      v('country').onchange = () => { const l = COUNTRY_LANG[v('country').value]; if (!l) return; g.mem.set('lang', l); document.querySelectorAll('select.lang').forEach(s => s.value = l); const h = f.querySelector('[data-country-hint]'); if (h) h.textContent = `Suggested language: ${l} — change it any time.`; };
      f.onsubmit = e => {
        e.preventDefault();
        const ok = [setErr(v('name'), v('name').value.trim() ? '' : 'Full name is required.'), setErr(v('email'), EMAIL.test(v('email').value.trim()) ? '' : 'Enter a valid email address.'), setErr(v('pw'), PW_RULE.test(v('pw').value) ? '' : PW_MSG), setErr(v('country'), v('country').selectedIndex > 0 ? '' : 'Choose your country.'), setErr(v('terms'), v('terms').checked ? '' : 'You must accept the Terms & Privacy Policy to continue.')].every(Boolean);
        if (!ok) return;
        g.mem.set('signup-name', v('name').value.trim()); g.mem.set('signup-email', v('email').value.trim()); g.mem.set('signup-country', v('country').value);
        location.href = '06-verify-email.html';
      };
    } };
  };

  S.verify = () => ({ title: 'Verify your email', html: authFrame('Verify your <span class="hl">email</span>', `Enter the 6-digit code sent to <b style="color:var(--color-text-primary)">${esc(g.mem.get('signup-email', 'owner@sample.dev'))}</b>. You can continue once your email is verified.`, `<div class="stack">
    ${callout('dev', 'Development — email not sent', `No email service is connected, so no message was delivered. Your verification code is <span class="code-pill">495875</span>.`)}
    ${field({ label: 'Verification code', required: true, input: `<div class="otp" data-otp>${Array.from({ length: 6 }, (_, i) => `<input inputmode="numeric" maxlength="1" aria-label="Digit ${i + 1}">`).join('')}</div>` })}
    <button class="btn btn-primary btn-lg btn-block" data-verify>Verify email ${icon('arrowRight', 'sm')}</button>
    <button class="btn btn-text btn-block" data-toast="A new code was generated">${icon('rotate', 'sm')}Resend code</button>
  </div>`, { eyebrow: `${icon('mail', 'sm')} Confirm it’s you`, after: exits('04-register.html', 'Wrong email? Go back') }), after() {
    const boxes = [...document.querySelectorAll('[data-otp] input')];
    boxes.forEach((b, i) => {
      b.addEventListener('input', () => { b.value = b.value.replace(/\D/g, '').slice(-1); b.classList.toggle('filled', !!b.value); if (b.value && boxes[i + 1]) boxes[i + 1].focus(); });
      b.addEventListener('keydown', e => { if (e.key === 'Backspace' && !b.value && boxes[i - 1]) boxes[i - 1].focus(); });
      b.addEventListener('paste', e => { const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); if (d) { e.preventDefault(); d.split('').forEach((c, j) => { boxes[j].value = c; boxes[j].classList.add('filled'); }); } });
    });
    document.querySelector('[data-verify]').onclick = () => { const code = boxes.map(b => b.value).join(''); if (code === '495875') location.href = '07-onboarding-business-profile.html'; else { boxes.forEach(b => { b.style.animation = 'none'; b.offsetHeight; b.style.animation = 'shake .42s'; }); g.toast(code.length < 6 ? 'Enter all 6 digits' : 'That code is not correct'); } };
  } });

  /* ---------- password recovery & invitation ---------- */
  const PW_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/, PW_MSG = 'Use at least 8 characters, including a letter and a number.';
  const pwField = (label, name) => field({ label, required: true, input: `<div class="input-wrap">${icon('lock')}${input({ type: 'password', attrs: `name="${name}" autocomplete="new-password"` })}</div>`, hint: name === 'pw' ? PW_MSG : '' });
  const backToLogin = `<p class="muted" style="text-align:center;margin-top:18px"><a class="link underline-hl" style="color:var(--color-text-primary)" href="03-login.html">Back to Log In</a></p>`;
  function setErr(el, msg) {
    const fd = el.closest('.field'); fd.querySelectorAll('.error-msg').forEach(x => x.remove()); fd.classList.toggle('has-error', !!msg);
    fd.querySelectorAll('.hint').forEach(h => h.hidden = !!msg);
    if (msg) fd.insertAdjacentHTML('beforeend', `<div class="error-msg">${icon('info', 'sm')}${esc(msg)}</div>`);
    return !msg;
  }
  // Validates new password + confirmation; returns true when both are valid.
  function checkPasswords(f) {
    const a = setErr(f.elements.pw, PW_RULE.test(f.elements.pw.value) ? '' : PW_MSG);
    const b = setErr(f.elements.pw2, f.elements.pw2.value && f.elements.pw2.value === f.elements.pw.value ? '' : 'Passwords do not match.');
    return a && b;
  }

  S.forgot = ctx => {
    const em = g.mem.get('reset-email', '');
    if (ctx.opts.sent) return { title: 'Check your email', html: authFrame('Check your <span class="hl">email</span>', `If an account exists for ${em ? `<b style="color:var(--color-text-primary)">${esc(em)}</b>` : 'that email address'}, we sent a link to reset your password.`, `<div class="stack">
      ${callout('dev', 'Development — email not sent', `No email service is connected, so no message was delivered. <a class="link" href="12-reset-password.html">Open reset link ${icon('arrowRight', 'sm')}</a>`)}
      <a class="btn btn-primary btn-lg btn-block" href="03-login.html">Back to Log In</a>
      <button class="btn btn-text btn-block" data-toast="A new reset link was generated">${icon('rotate', 'sm')}Resend link</button>
    </div>`, { eyebrow: `${icon('mail', 'sm')} Forgot password`, after: `<p class="muted" style="text-align:center;margin-top:18px"><a class="link underline-hl" style="color:var(--color-text-primary)" href="10-forgot-password.html">Wrong email? Try again</a></p>` }) };
    return { title: 'Forgot password', html: authFrame('Forgot your <span class="hl">password</span>?', 'Enter your account email and we’ll send you a link to reset your password.', `<form class="stack" novalidate data-forgot>
      ${field({ label: 'Email Address', required: true, input: `<div class="input-wrap">${icon('mail')}${input({ type: 'email', value: em, attrs: 'name="email" autocomplete="email"', ph: 'you@business.com' })}</div>` })}
      <button class="btn btn-primary btn-lg btn-block" type="submit">Send reset link ${icon('arrowRight', 'sm')}</button>
    </form>`, { eyebrow: `${icon('lock', 'sm')} Forgot password`, after: backToLogin }), after() {
      const f = document.querySelector('[data-forgot]');
      f.onsubmit = e => { e.preventDefault(); const v = f.elements.email.value.trim(); if (setErr(f.elements.email, EMAIL.test(v) ? '' : 'Enter a valid email address.')) { g.mem.set('reset-email', v); location.href = '11-forgot-password-sent.html'; } };
    } };
  };

  S.resetPassword = () => ({ title: 'Reset password', html: authFrame('Set a new <span class="hl">password</span>', 'Choose a new password for your Bonuca account.', `<form class="stack" novalidate data-reset>
      ${pwField('New password', 'pw')}${pwField('Confirm new password', 'pw2')}
      <button class="btn btn-primary btn-lg btn-block" type="submit">Reset password ${icon('arrowRight', 'sm')}</button>
    </form>`, { eyebrow: `${icon('lock', 'sm')} Forgot password`, after: backToLogin }), after() {
    const f = document.querySelector('[data-reset]');
    f.onsubmit = e => { e.preventDefault(); if (checkPasswords(f)) location.href = '03-login.html?reset=1'; };
  } });

  S.acceptInvite = () => {
    // ❓ Default demo invitation is for an Employee; ?role=Manager shows a Manager invitation. ?email= carries the invited address (demo default otherwise).
    const q = new URLSearchParams(location.search), role = q.get('role') === 'Manager' ? 'Manager' : 'Employee';
    const email = EMAIL.test(q.get('email') || '') ? q.get('email') : 'new.member@sample.dev';
    return { title: 'Accept invitation', html: authFrame('Accept your <span class="hl">invitation</span>', 'Create your own password to join the business on Bonuca.', `<form class="stack" novalidate data-accept>
      <div>${kv([['Business', 'Sample Business (development)'], ['Invited email', `<span class="mono" data-invite-email>${esc(email)}</span>`], ['Role', `<span data-invite-role>${badge(role, role === 'Manager' ? 'blue' : '')}</span>`]])}</div>
      ${pwField('Password', 'pw')}${pwField('Confirm password', 'pw2')}
      <button class="btn btn-primary btn-lg btn-block" type="submit">Accept ${icon('arrowRight', 'sm')}</button>
    </form>`, { eyebrow: `${icon('userPlus', 'sm')} Invitation`, after: backToLogin }), after() {
      const f = document.querySelector('[data-accept]');
      f.onsubmit = e => { e.preventDefault(); if (checkPasswords(f)) location.href = '03-login.html?invited=1'; };
    } };
  };

  /* ---------- onboarding: business profile → plan → first program ---------- */
  const stepper = n => `<div class="stepper reveal-up">${['Business', 'Plan', 'First program'].map((l, i) => `<div class="s ${i + 1 < n ? 'done' : i + 1 === n ? 'cur' : ''}"><span class="n">${i + 1 < n ? icon('check', 'sm') : i + 1}</span>${l}</div>${i < 2 ? '<span class="sep"></span>' : ''}`).join('')}<span class="faint" style="margin-left:auto;font-size:13px;font-weight:600">Step ${n} of 3</span></div>`;
  const bars = n => `<div class="prog-steps" style="margin-bottom:22px">${[1, 2, 3].map(i => `<span class="st ${i <= n ? 'done' : ''}"><i style="animation-delay:${i * 120}ms"></i></span>`).join('')}</div>`;
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hoursEditor = (h = []) => DAYS.map((d, i) => { const [open, from, to] = h[i] || [i < 6, '09:00', '18:00']; return `<div class="hours-row ${open ? '' : 'closed'}" data-hrow><b>${d}</b><span class="row" style="gap:8px">${U.toggle(open, `data-open-day aria-label="Open on ${d}"`)}</span><div class="times"><input class="input" type="time" value="${from}" aria-label="${d} opens"><span class="faint">–</span><input class="input" type="time" value="${to}" aria-label="${d} closes"><span class="closed-tag" ${open ? 'hidden' : ''}>Closed</span></div></div>`; }).join('');
  const HEX = /^#[0-9a-f]{6}$/i;
  // Logo is downscaled on a canvas so it fits the tab's demo memory.
  const readLogo = (file, done) => { const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, 160 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.width * s)); c.height = Math.max(1, Math.round(im.height * s)); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); done(c.toDataURL('image/png')); }; im.onerror = () => done(''); im.src = r.result; }; r.readAsDataURL(file); };
  const logoImg = src => `<img src="${src}" alt="Business logo" style="width:100%;height:100%;object-fit:contain;border-radius:inherit">`;

  S.onboarding1 = () => {
    const b = g.mem.get('business', {}), br = g.mem.get('branding', {}), col = HEX.test(br.color || '') ? br.color : '#1747F8', a = b.address || {};
    const colour = colorIn(col).replace('<span class="swatch">', `<label class="swatch" style="position:relative;cursor:pointer" title="Pick a colour"><input type="color" value="${col}" data-color-pick aria-label="Pick brand colour" style="position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;border:0;padding:0">`).replace('</i></span>', '</i></label>');
    return { title: 'Set up your business', html: authFrame('Set up your <span class="hl">business</span>', 'A few basics so your wallet cards look like you. Everything here can be changed later in Settings.', `${bars(1)}<div class="form-grid" data-onb1>
    ${field({ label: 'Business Name', required: true, input: input({ value: b.name || '', ph: 'e.g. Café Lumen', attrs: 'name="biz" autocomplete="organization"' }) })}
    ${field({ label: 'Business Category', required: true, input: select(CATEGORIES, b.category || 'Select…', 'name="cat"') })}
    ${field({ label: 'Business Logo', optional: true, input: upload(false, false, '<input type="file" accept="image/*" hidden data-logo-file>'), hint: 'Optional — you can complete this later in Settings.' })}
    ${field({ label: 'Primary Brand Color', input: colour, hint: 'A default (Bonuca Blue) is applied if you skip this.' })}
    ${field({ label: 'Preferred Interface Language', required: true, input: select(LANGS, g.mem.get('lang', 'English'), 'name="lang" data-lang'), hint: 'Changeable anytime in Settings.' })}
    <div></div>
    <div class="full"><div class="label" style="margin-bottom:12px">${icon('pin', 'sm')} Business Address <span class="opt">— Optional — you can complete this later in Settings.</span></div><div class="form-grid">
      ${[['street', 'Street'], ['postal', 'Postal code'], ['city', 'City'], ['region', 'Country / region']].map(([k, l]) => field({ label: l, input: input({ value: a[k] || '', attrs: `name="${k}"` }) })).join('')}</div></div>
    <div class="full option-row"><div><b>Opening Hours — add now</b><small>Optional — you can complete this later in settings.</small></div>${U.toggle(!!b.hours, 'data-hours-on aria-label="Add opening hours now"')}</div>
    <div class="full" data-onb-hours ${b.hours ? '' : 'hidden'}>${b.hours ? hoursEditor(b.hours) : ''}</div>
  </div><div class="row" style="margin-top:24px;justify-content:flex-end"><a class="btn btn-primary btn-lg" href="08-onboarding-plan-selection.html" data-continue>Continue ${icon('arrowRight', 'sm')}</a></div>`, { w: 800, stepper: stepper(1), eyebrow: `${icon('store', 'sm')} Onboarding`, after: exits('06-verify-email.html') }), after() {
      const f = document.querySelector('[data-onb1]'), $ = n => f.querySelector(`[name="${n}"]`), hex = f.querySelector('[data-color]'), pick = f.querySelector('[data-color-pick]');
      const file = f.querySelector('[data-logo-file]'), tile = f.querySelector('.upload .tile'), upBtn = f.querySelector('.upload .btn'), hrs = f.querySelector('[data-onb-hours]');
      let logo = br.logo || '';
      const showLogo = () => { if (!logo) return; tile.innerHTML = logoImg(logo); tile.classList.add('filled'); upBtn.textContent = 'Replace'; };
      showLogo();
      upBtn.type = 'button'; upBtn.onclick = () => file.click();
      file.onchange = () => { const fl = file.files[0]; if (!fl) return; if (!setErr(file, /^image\//.test(fl.type) ? '' : 'Choose an image file (PNG, JPG or SVG).')) return; readLogo(fl, src => { if (!setErr(file, src ? '' : 'This image could not be read. Try another file.')) return; logo = src; showLogo(); g.toast('Logo added'); }); };
      pick.addEventListener('input', () => { hex.value = pick.value.toUpperCase(); hex.dispatchEvent(new Event('input', { bubbles: true })); });
      hex.addEventListener('input', () => { if (HEX.test(hex.value)) pick.value = hex.value.toLowerCase(); });
      const wireDays = () => hrs.querySelectorAll('[data-open-day]').forEach(t => t.onchange = () => { const r = t.closest('[data-hrow]'); r.classList.toggle('closed', !t.checked); r.querySelector('.closed-tag').hidden = t.checked; });
      wireDays();
      f.querySelector('[data-hours-on]').onchange = e => { if (e.target.checked && !hrs.innerHTML) { hrs.innerHTML = hoursEditor(); wireDays(); } hrs.hidden = !e.target.checked; };
      document.querySelector('[data-continue]').onclick = e => {
        const ok = [setErr($('biz'), $('biz').value.trim() ? '' : 'Business name is required.'), setErr($('cat'), $('cat').selectedIndex > 0 ? '' : 'Choose your business category.'), setErr(hex, !hex.value.trim() || HEX.test(hex.value.trim()) ? '' : 'Use a hex colour such as #1747F8.')].every(Boolean);
        if (!ok) { e.preventDefault(); f.querySelector('.has-error').scrollIntoView({ block: 'center' }); return; }
        const hours = hrs.hidden ? null : [...hrs.querySelectorAll('[data-hrow]')].map(r => { const t = r.querySelectorAll('input[type=time]'); return [r.querySelector('[data-open-day]').checked, t[0].value, t[1].value]; });
        g.mem.set('business', { name: $('biz').value.trim(), category: $('cat').value, address: Object.fromEntries(['street', 'postal', 'city', 'region'].map(k => [k, $(k).value.trim()])), hours });
        g.mem.set('branding', Object.assign(g.mem.get('branding', {}), { color: hex.value.trim() ? hex.value.trim().toUpperCase() : '#1747F8', logo }));
      };
    } };
  };

  S.onboarding2 = () => {
    const cta = (k, n) => k === 'free' ? `<a class="btn btn-ghost btn-block" href="09-onboarding-first-program.html" data-plan="free">Choose Free Plan</a>`
      : k === 'trial' ? `<a class="btn btn-primary btn-block" href="09-onboarding-first-program.html" data-plan="trial">Start Free Trial ${icon('arrowRight', 'sm')}</a>`
      : `<button class="btn ${k === 'pro' ? 'btn-primary' : 'btn-ghost'} btn-block" data-checkout="${k}">Choose ${n.replace(' Plan', '')} — Stripe checkout</button>`;
    // ❓ Stripe is not connected: the checkout step is simulated so the chosen paid plan can be reviewed end to end.
    const co = modal({ id: 'checkout', open: false, title: 'Stripe checkout', sub: 'Web subscriptions are processed through Stripe.', body: `<div class="stack"><div data-co-sum></div>${callout('dev', 'Development — Stripe not connected', 'No payment is taken. Continuing activates the plan in this prototype only.')}</div>`, foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" data-co-go>Continue ${icon('arrowRight', 'sm')}</button>` });
    return { title: 'Choose your plan', html: authFrame('Choose your <span class="hl">plan</span>', 'Changing plans never deletes customers, programs or transactions.', `${bars(2)}<div class="row between wrap" style="margin-bottom:16px"><span class="muted" style="font-size:13.5px">Free, Business or Pro — or try every feature free for 14 days.</span>${periodSeg}</div>${planGrid(cta)}<div style="margin-top:18px">${callout('info', 'Paid plans on the web use Stripe checkout', 'Stripe is not connected in this environment, so checkout is simulated here. Mobile purchases use the App Store / Google Play inside the Bonuca app.')}</div>
  <div class="divider"></div><div class="row between wrap"><div><b>Skip for now</b><div class="hint">Explore every tab with demo data in Preview Mode.</div></div><a class="btn btn-text" href="../../owner/pages/61-dashboard-preview-mode.html">Skip for now ${icon('arrowRight', 'sm')}</a></div>`, { w: 1100, stepper: stepper(2), eyebrow: `${icon('card', 'sm')} Onboarding`, after: exits('07-onboarding-business-profile.html'), modals: co }), after() {
      wirePeriod();
      let chosen = '';
      document.querySelectorAll('[data-plan]').forEach(a => a.addEventListener('click', () => g.mem.set('plan', a.dataset.plan)));
      document.querySelectorAll('[data-checkout]').forEach(b => b.onclick = () => {
        chosen = b.dataset.checkout; const [, n, , pr] = PLANS.find(p => p[0] === chosen), annual = document.querySelector('[data-period] .on[data-p="y"]');
        document.querySelector('[data-co-sum]').innerHTML = kv([['Plan', n], ['Billing', annual ? 'Annual' : 'Monthly'], ['Price', annual ? 'Annual price — set by Bonuca' : `${pr} / month (indicative)`]]);
        g.openModal('checkout');
      });
      document.querySelector('[data-co-go]').onclick = () => { g.mem.set('plan', chosen); location.href = '09-onboarding-first-program.html'; };
    } };
  };

  const KINDS = { 'Stamp Card': 'stamp', 'Membership Card': 'membership', 'Tier Program': 'tier', 'Points Program': 'points' };
  // Essential fields per type; the full setup (logo, design, rules, publishing) happens in Loyalty Programs.
  const kindFields = (k, v) => {
    const f = (label, name, o = {}) => field({ label, required: true, input: o.sel ? select(o.sel, v[name] || o.sel[0], `name="${name}"`) : input({ type: o.type || 'text', value: v[name] ?? o.value ?? '', ph: o.ph || '', attrs: `name="${name}"${o.type === 'number' ? ' min="1" step="1" inputmode="numeric"' : ''}` }), hint: o.hint });
    const name = f('Program name', 'name', { ph: { stamp: 'Coffee Card', membership: 'VIP Member', tier: 'Lumen Club', points: 'Coffee Rewards' }[k] });
    if (k === 'stamp') return name + f('Reward', 'reward', { ph: '1 Free Coffee' }) + f('Number of stamps required', 'stamps', { type: 'number', value: '10' });
    if (k === 'membership') return name + f('Membership benefit', 'benefit', { ph: '10% Discount' });
    if (k === 'tier') return name + f('Upgrade requirement', 'basis', { sel: ['Visits', 'Points', 'Total spending'], hint: 'Suggested tiers: Member · Silver · Gold · Platinum — edit names and values later.' });
    return name + f('Points per €1 spent', 'rate', { sel: ['1€ = 1 point', '1€ = 5 points', '1€ = 10 points'] }) + f('Reward', 'reward', { ph: 'Free Coffee' }) + f('Points required for the reward', 'needed', { type: 'number', value: '100' });
  };

  S.onboarding3 = () => {
    const types = [['Stamp Card', 'stamp', '#1747F8', 'Collect stamps, earn a reward'], ['Membership Card', 'crown', '#7C3AED', 'A standing perk for members'], ['Tier Program', 'layers', '#0F9D6E', 'Levels unlocked by visits'], ['Points Program', 'coins', '#C2410C', 'Earn points per purchase']];
    const biz = g.mem.get('business', {}).name || '', start = { name: biz ? `${biz} Card` : '' };
    return { title: 'Create your first loyalty program', html: authFrame('Create your first <span class="hl">loyalty program</span>', 'Pick a type and add the basics — it is saved as a Draft. Finish the full setup (logo, design, publishing) in Loyalty Programs.', `${bars(3)}<div class="layout-preview" data-first>
      <div class="stack">
        <div class="grid g2" data-types>${types.map(([n, ic, c, d], i) => `<button type="button" class="type-card ${i === 0 ? 'on' : ''}" data-select="${n}" style="--c:${c}"><span class="ti">${icon(ic)}</span><b>${n}</b><small>${d}</small></button>`).join('')}</div>
        <div class="form-grid" data-fields>${kindFields('stamp', start)}</div>
        <div class="row wrap"><a class="btn btn-primary btn-lg" href="#" role="button" data-create>Create program ${icon('arrowRight', 'sm')}</a><a class="btn btn-text" href="../../owner/pages/01-dashboard.html">I’ll do this later</a></div>
      </div>
      <div><div class="eyebrow" style="justify-content:center;width:100%">${icon('eye', 'sm')} Live preview</div><div data-first-preview></div></div>
    </div>`, { w: 1000, stepper: stepper(3), eyebrow: `${icon('stamp', 'sm')} Onboarding`, after: exits('08-onboarding-plan-selection.html') }), after() {
      const root = document.querySelector('[data-first]'), box = root.querySelector('[data-fields]'), host = root.querySelector('[data-first-preview]'), br = g.mem.get('branding', {});
      let kind = 'stamp';
      const vals = () => Object.fromEntries([...box.querySelectorAll('[name]')].map(el => [el.name, el.value.trim()]));
      const preview = () => {
        const v = vals(), name = v.name || biz || 'Coffee Card', n = Math.min(30, Math.max(1, parseInt(v.stamps, 10) || 10)), bg = HEX.test(br.color || '') ? br.color : '';
        const p = { stamp: { type: 'stamp', reward: v.reward || '1 Free Coffee', total: n, filled: Math.min(3, n) }, membership: { type: 'membership', benefit: v.benefit || '10% Discount' }, tier: { type: 'tier', tier: 'Member', pct: 0, next: v.basis === 'Visits' ? '10 visits to Silver' : 'Next tier: Silver' }, points: { type: 'points', balance: '0 pts', nextReward: v.reward || 'Free Coffee', needed: v.needed || '100', pct: 2 } }[kind];
        host.innerHTML = pass({ ...p, name, bg }).replace('<div class="pass-qr">', '<div class="pass-qr" style="width:90px;height:90px">');
        if (br.logo) host.querySelector('.pass-logo').innerHTML = logoImg(br.logo);
      };
      root.querySelector('[data-types]').addEventListener('typechange', e => { const keep = vals(); kind = KINDS[e.detail]; box.innerHTML = kindFields(kind, keep); preview(); });
      box.addEventListener('input', preview); box.addEventListener('change', preview);
      preview();
      root.querySelector('[data-create]').onclick = e => {
        e.preventDefault(); const v = vals(), el = n => box.querySelector(`[name="${n}"]`);
        const need = { stamp: ['name', 'reward', 'stamps'], membership: ['name', 'benefit'], tier: ['name'], points: ['name', 'reward', 'needed'] }[kind];
        const msg = n => !v[n] ? ({ name: 'Program name is required.', reward: 'Reward is required.', benefit: 'Membership benefit is required.', stamps: 'Enter the number of stamps required.', needed: 'Enter the points required.' }[n]) : (n === 'stamps' || n === 'needed') && !(/^\d+$/.test(v[n]) && +v[n] >= (n === 'stamps' ? 2 : 1) && (n === 'needed' || +v[n] <= 30)) ? (n === 'stamps' ? 'Use a whole number from 2 to 30.' : 'Use a whole number of at least 1.') : '';
        if (!need.map(n => setErr(el(n), msg(n))).every(Boolean)) return;
        g.mem.set('draft-programs', [...g.mem.get('draft-programs', []), { ...v, type: kind, status: 'Draft' }]);
        root.closest('.card').innerHTML = `<div class="empty" style="padding:18px 6px"><div class="ill" style="color:var(--color-mint)">${icon('checkCircle', 'lg')}</div><b style="color:var(--color-text-primary);font-size:18px">“${esc(v.name)}” saved as a Draft</b><span>Finish the full setup (logo, design, publishing) in Loyalty Programs.</span><div class="row wrap" style="justify-content:center;margin-top:10px"><a class="btn btn-primary" href="../../owner/pages/01-dashboard.html">Go to dashboard ${icon('arrowRight', 'sm')}</a><a class="btn btn-ghost" href="../../owner/pages/03-programs-list.html">Open Loyalty Programs</a></div></div>`;
        g.toast(`${v.name} saved as a Draft`);
      };
    } };
  };

  g.planCard = (name, sub, feats, cta, o = {}) => `<article class="card plan ${o.cls || ''} reveal-up">${o.ribbon ? `<span class="ribbon">${o.ribbon}</span>` : ''}<div><h3 style="font-size:19px">${name}</h3><p class="muted" style="margin-top:6px;font-size:13.5px;min-height:40px">${sub}</p></div>${o.price || ''}<ul>${feats.map(f => `<li>${icon('checkCircle', 'sm')}${f}</li>`).join('')}</ul>${o.note ? `<p class="faint" style="font-size:12.5px">${o.note}</p>` : ''}<div class="cta">${cta}</div></article>`;
})(window);
