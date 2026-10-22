/* Common (public / auth / onboarding) screens */
(function (g) {
  const U = g.UI, { icon, field, input, select, check, colorIn, upload, callout, pass, modal, kv, badge } = U;
  const S = g.SCREENS = g.SCREENS || {};
  const amb = `<div class="ambient"><i></i><i></i><i></i><div class="lines"></div></div>`;
  const COUNTRIES = ['Select…', 'Germany', 'Austria', 'Switzerland', 'Türkiye', 'France', 'Italy'];

  S.landing = ctx => {
    const dl = modal({ id: 'download', open: !!ctx.opts.modal, title: 'Download App', sub: 'Get Bonuca on your phone.', body: `<div class="empty" style="padding:10px 0 4px"><div class="ill">${icon('phone', 'lg')}</div><b style="color:var(--color-text-primary)">App store links are not configured yet.</b><span style="font-size:13px">They will appear here once the iOS and Android listings are live.</span></div>`, foot: `<button class="btn btn-ghost" data-close>Close</button>` });
    return { title: 'Bonuca — Loyalty programs', html: `${amb}<div class="public-wrap">${g.publicTop(`<a class="btn btn-ink btn-sm" href="03-login.html">Log In</a>`)}
<section class="hero">
  <div class="hero-badge reveal-up"><b>New</b>Apple Wallet &amp; Google Wallet passes</div>
  <h1 class="reveal-up">Loyalty programs and <span class="hl-wrap" style="background:linear-gradient(transparent 72%,var(--color-highlight) 72%,var(--color-highlight) 90%,transparent 90%)">digital wallet cards</span> for your business</h1>
  <p class="reveal-up">Stamp cards, memberships, tiers and points — issued to Apple Wallet and Google Wallet, managed in one place.</p>
  <div class="row reveal-up" style="justify-content:center;margin-top:30px;flex-wrap:wrap">
    <a class="btn btn-primary btn-lg" href="04-register.html">Start Free ${icon('arrowRight', 'sm')}</a>
    <a class="btn btn-ghost btn-lg" href="03-login.html">Log In</a>
    <button class="btn btn-ink btn-lg" data-open="download">${icon('download', 'sm')}Download App</button>
  </div>
  <div class="hero-cards">
    <div class="float-pass" style="left:4%;top:60px;--r:-8deg;transform:rotate(-8deg);width:270px;opacity:.95">${pass({ type: 'points', name: 'Coffee Rewards', balance: '240 pts', nextReward: 'Free Dessert', needed: '10', pct: 92 }).replace('<div class="pass-qr">', '<div class="pass-qr" style="display:none">')}</div>
    <div class="float-pass" style="left:50%;margin-left:-175px;top:0;width:350px;z-index:2;animation-delay:-2s">${pass({ type: 'stamp', name: 'Bonuca', reward: '1 Free Coffee', total: 10, filled: 6 }).replace('<div class="pass-qr">', '<div class="pass-qr" style="display:none">')}</div>
    <div class="float-pass" style="right:4%;top:70px;--r:8deg;width:270px;animation-delay:-4s">${pass({ type: 'membership', name: 'VIP Member', benefit: '10% off every visit', bg: '#1B1B1F' }).replace('<div class="pass-qr">', '<div class="pass-qr" style="display:none">')}</div>
  </div>
</section></div>${dl}<div class="toast-zone"></div>` };
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
        ${field({ label: 'Email Address', required: true, input: `<div class="input-wrap">${icon('mail')}<input class="input" type="email" placeholder="you@business.com" data-email></div>` })}
        ${field({ label: 'Password', required: true, input: `<div class="input-wrap">${icon('lock')}<input class="input" type="password" placeholder="••••••••" data-pw><span class="trail"><button type="button" class="icon-btn" data-peek aria-label="Show password">${icon('eye', 'sm')}</button></span></div>` })}
        <div style="text-align:right;margin-top:-6px"><a class="link underline-hl" style="color:var(--color-text-primary);font-size:13.5px" href="10-forgot-password.html">Forgot password?</a></div>
        <button class="btn btn-primary btn-lg btn-block" type="submit">Log In ${icon('arrowRight', 'sm')}</button>
        <div class="callout dev dev-accounts" style="display:block">
          <b style="display:flex;gap:8px;align-items:center;margin-bottom:6px">${icon('zap', 'sm')}Development sample accounts</b>
          ${[['Owner', 'owner@sample.dev', '../../owner/pages/01-dashboard.html'], ['Manager', 'manager@sample.dev', '../../manager/pages/01-dashboard.html'], ['Employee', 'employee@sample.dev', '../../employee/pages/01-scanner-home.html']].map(([r, e, h]) => `<div class="acc"><span>${r}: <span class="mono">${e}</span></span><button type="button" class="btn btn-text btn-sm" style="color:var(--color-accent)" data-use="${e}" data-go="${h}">Use</button></div>`).join('')}
        </div>
        <p class="muted" style="text-align:center">New to Bonuca? <a class="link underline-hl" style="color:var(--color-text-primary)" href="04-register.html">Start Free</a></p>
      </form>
    </div>
  </section>
</div><div class="toast-zone"></div>`, after() {
    const q = new URLSearchParams(location.search);
    if (q.has('reset')) g.toast('Password updated. Log in with your new password.');
    if (q.has('invited')) g.toast('Invitation accepted. Log in with your new password.');
    document.querySelector('[data-peek]').onclick = () => { const p = document.querySelector('[data-pw]'); p.type = p.type === 'password' ? 'text' : 'password'; };
    document.querySelectorAll('[data-use]').forEach(b => b.onclick = () => { document.querySelector('[data-email]').value = b.dataset.use; document.querySelector('[data-pw]').value = 'password1'; b.closest('form').dataset.go = b.dataset.go; });
    document.querySelector('[data-login]').onsubmit = e => { e.preventDefault(); const go = e.target.dataset.go; if (go) location.href = go; else g.toast(document.querySelector('[data-email]').value ? 'Use a development sample account to log in' : 'Enter your email and password'); };
  } });

  function authFrame(title, sub, inner, opts = {}) {
    return `${amb}<div class="public-wrap">${g.publicTop()}<div style="padding:24px 20px 60px"><div class="auth-card" style="max-width:${opts.w || 520}px">
      ${opts.stepper || ''}<div class="reveal-up" style="margin-bottom:22px">${opts.eyebrow ? `<div class="eyebrow">${opts.eyebrow}</div>` : ''}<h1 class="page-title">${title}</h1>${sub ? `<p class="page-sub">${sub}</p>` : ''}</div>
      <div class="card reveal-up" style="padding:26px">${inner}</div>${opts.after || ''}</div></div></div><div class="toast-zone"></div>`;
  }

  S.register = ctx => {
    const E = !!ctx.opts.errors;
    const inner = `<form class="stack" novalidate data-register>
      ${field({ label: 'Full Name', required: true, input: input({ attrs: 'name="name" autocomplete="name"' }), error: E && 'Full name is required.' })}
      ${field({ label: 'Email Address', required: true, input: `<div class="input-wrap">${icon('mail')}${input({ type: 'email', attrs: 'name="email"', ph: 'you@business.com' })}</div>`, error: E && 'Enter a valid email address.' })}
      ${field({ label: 'Password', required: true, input: `<div class="input-wrap">${icon('lock')}${input({ type: 'password', attrs: 'name="pw"' })}</div>`, hint: 'Use at least 8 characters, including a letter and a number.', error: E && 'Use at least 8 characters, including a letter and a number.' })}
      <div class="form-grid">
        ${field({ label: 'Country', required: true, input: select(COUNTRIES, 'Select…', 'name="country"'), hint: 'Used to suggest your language and program currency later.', error: E && 'Choose your country.' })}
        ${field({ label: 'Phone Number', optional: true, input: input({ attrs: 'name="phone"', ph: '+49' }) })}
      </div>
      <div class="field ${E ? 'has-error' : ''}">${check('I accept the <a class="underline-hl" href="#">Terms &amp; Privacy Policy</a>', false, 'name="terms"')}${E ? `<div class="error-msg">${icon('info', 'sm')}You must accept the Terms &amp; Privacy Policy to continue.</div>` : ''}</div>
      <button class="btn btn-primary btn-lg btn-block" type="submit">Create Account ${icon('arrowRight', 'sm')}</button>
    </form>`;
    return { title: 'Create your account', html: authFrame('Create your <span class="hl">account</span>', 'Start with a free plan — upgrade any time.', inner, { eyebrow: `${icon('sparkles', 'sm')} Get started`, after: `<p class="muted" style="text-align:center;margin-top:18px">Already have an account? <a class="link underline-hl" style="color:var(--color-text-primary)" href="03-login.html">Log In</a></p>` }), after() {
      const f = document.querySelector('[data-register]');
      f.onsubmit = e => {
        e.preventDefault(); const v = n => f.elements[n]; let ok = true;
        const set = (el, msg) => { const fd = el.closest('.field'); fd.querySelectorAll('.error-msg').forEach(x => x.remove()); fd.classList.toggle('has-error', !!msg); if (msg) { ok = false; fd.insertAdjacentHTML('beforeend', `<div class="error-msg">${icon('info', 'sm')}${msg}</div>`); fd.querySelectorAll('.hint').forEach(h => h.hidden = true); } else fd.querySelectorAll('.hint').forEach(h => h.hidden = false); };
        set(v('name'), v('name').value.trim() ? '' : 'Full name is required.');
        set(v('email'), /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v('email').value) ? '' : 'Enter a valid email address.');
        set(v('pw'), /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(v('pw').value) ? '' : 'Use at least 8 characters, including a letter and a number.');
        set(v('country'), v('country').selectedIndex > 0 ? '' : 'Choose your country.');
        set(v('terms'), v('terms').checked ? '' : 'You must accept the Terms & Privacy Policy to continue.');
        if (ok) location.href = '06-verify-email.html';
      };
    } };
  };

  S.verify = () => ({ title: 'Verify your email', html: authFrame('Verify your <span class="hl">email</span>', 'Enter the 6-digit code sent to <b style="color:var(--color-text-primary)">screens-1792574831185@demo.dev</b>. You can continue once your email is verified.', `<div class="stack">
    ${callout('dev', 'Development — email not sent', `No email service is connected, so no message was delivered. Your verification code is <span class="code-pill">495875</span>.`)}
    ${field({ label: 'Verification code', required: true, input: `<div class="otp" data-otp>${Array.from({ length: 6 }, (_, i) => `<input inputmode="numeric" maxlength="1" aria-label="Digit ${i + 1}">`).join('')}</div>` })}
    <button class="btn btn-primary btn-lg btn-block" data-verify>Verify email ${icon('arrowRight', 'sm')}</button>
    <button class="btn btn-text btn-block" data-toast="A new code was generated">${icon('rotate', 'sm')}Resend code</button>
  </div>`, { eyebrow: `${icon('mail', 'sm')} Step 0 · Confirm it’s you` }), after() {
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
    if (msg) fd.insertAdjacentHTML('beforeend', `<div class="error-msg">${icon('info', 'sm')}${msg}</div>`);
    return !msg;
  }
  // Validates new password + confirmation; returns true when both are valid.
  function checkPasswords(f) {
    const a = setErr(f.elements.pw, PW_RULE.test(f.elements.pw.value) ? '' : PW_MSG);
    const b = setErr(f.elements.pw2, f.elements.pw2.value && f.elements.pw2.value === f.elements.pw.value ? '' : 'Passwords do not match.');
    return a && b;
  }

  S.forgot = ctx => {
    if (ctx.opts.sent) return { title: 'Check your email', html: authFrame('Check your <span class="hl">email</span>', 'If an account exists for that email address, we sent a link to reset your password.', `<div class="stack">
      ${callout('dev', 'Development — email not sent', `No email service is connected, so no message was delivered. <a class="link" href="12-reset-password.html">Open reset link ${icon('arrowRight', 'sm')}</a>`)}
      <a class="btn btn-primary btn-lg btn-block" href="03-login.html">Back to Log In</a>
      <button class="btn btn-text btn-block" data-toast="A new reset link was generated">${icon('rotate', 'sm')}Resend link</button>
    </div>`, { eyebrow: `${icon('mail', 'sm')} Forgot password` }) };
    return { title: 'Forgot password', html: authFrame('Forgot your <span class="hl">password</span>?', 'Enter your account email and we’ll send you a link to reset your password.', `<form class="stack" novalidate data-forgot>
      ${field({ label: 'Email Address', required: true, input: `<div class="input-wrap">${icon('mail')}${input({ type: 'email', attrs: 'name="email" autocomplete="email"', ph: 'you@business.com' })}</div>` })}
      <button class="btn btn-primary btn-lg btn-block" type="submit">Send reset link ${icon('arrowRight', 'sm')}</button>
    </form>`, { eyebrow: `${icon('lock', 'sm')} Forgot password`, after: backToLogin }), after() {
      const f = document.querySelector('[data-forgot]');
      f.onsubmit = e => { e.preventDefault(); if (setErr(f.elements.email, /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.elements.email.value) ? '' : 'Enter a valid email address.')) location.href = '11-forgot-password-sent.html'; };
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
    // ❓ Default demo invitation is for an Employee; ?role=Manager shows a Manager invitation.
    const role = new URLSearchParams(location.search).get('role') === 'Manager' ? 'Manager' : 'Employee';
    return { title: 'Accept invitation', html: authFrame('Accept your <span class="hl">invitation</span>', 'Create your own password to join the business on Bonuca.', `<form class="stack" novalidate data-accept>
      <div>${kv([['Business', 'Sample Business (development)'], ['Role', `<span data-invite-role>${badge(role, role === 'Manager' ? 'blue' : '')}</span>`]])}</div>
      ${pwField('Password', 'pw')}${pwField('Confirm password', 'pw2')}
      <button class="btn btn-primary btn-lg btn-block" type="submit">Accept ${icon('arrowRight', 'sm')}</button>
    </form>`, { eyebrow: `${icon('userPlus', 'sm')} Invitation` }), after() {
      const f = document.querySelector('[data-accept]');
      f.onsubmit = e => { e.preventDefault(); if (checkPasswords(f)) location.href = '03-login.html?invited=1'; };
    } };
  };

  const stepper = n => `<div class="stepper reveal-up">${['Business', 'Plan', 'First program'].map((l, i) => `<div class="s ${i + 1 < n ? 'done' : i + 1 === n ? 'cur' : ''}"><span class="n">${i + 1 < n ? icon('check', 'sm') : i + 1}</span>${l}</div>${i < 2 ? '<span class="sep"></span>' : ''}`).join('')}<span class="faint" style="margin-left:auto;font-size:13px;font-weight:600">Step ${n} of 3</span></div>`;
  const bars = n => `<div class="prog-steps" style="margin-bottom:22px">${[1, 2, 3].map(i => `<span class="st ${i <= n ? 'done' : ''}"><i style="animation-delay:${i * 120}ms"></i></span>`).join('')}</div>`;

  S.onboarding1 = () => ({ title: 'Set up your business', html: authFrame('Set up your <span class="hl">business</span>', 'A few basics so your wallet cards look like you. Everything here can be changed later in Settings.', `${bars(1)}<div class="form-grid">
    ${field({ label: 'Business Name', required: true, input: input({ ph: 'e.g. Café Lumen' }) })}
    ${field({ label: 'Business Category', required: true, input: select(['Select…', 'Café', 'Restaurant', 'Bakery', 'Retail', 'Salon', 'Fitness'], 'Select…') })}
    ${field({ label: 'Business Logo', optional: true, input: upload(false), hint: 'Optional — you can complete this later in Settings.' })}
    ${field({ label: 'Primary Brand Color', input: colorIn('#1747F8'), hint: 'A default (Bonuca Blue) is applied if you skip this.' })}
    ${field({ label: 'Preferred Interface Language', required: true, input: select(['English', 'Deutsch', 'Türkçe', 'Français', 'Italiano'], 'English'), hint: 'Changeable anytime in Settings.' })}
    <div></div>
    <div class="full"><div class="label" style="margin-bottom:12px">${icon('pin', 'sm')} Business Address <span class="opt">— Optional — you can complete this later in Settings.</span></div><div class="form-grid">
      ${field({ label: 'Street', input: input() })}${field({ label: 'Postal code', input: input() })}${field({ label: 'City', input: input() })}${field({ label: 'Country / region', input: input() })}</div></div>
    <div class="full option-row"><div><b>Opening Hours — add now</b><small>Optional — you can complete this later in settings.</small></div>${U.toggle(false)}</div>
  </div><div class="row" style="margin-top:24px;justify-content:flex-end"><a class="btn btn-primary btn-lg" href="08-onboarding-plan-selection.html">Continue ${icon('arrowRight', 'sm')}</a></div>`, { w: 800, stepper: stepper(1), eyebrow: `${icon('store', 'sm')} Onboarding` }) });

  S.onboarding2 = () => ({ title: 'Choose your plan', html: authFrame('Choose your <span class="hl">plan</span>', 'Changing plans never deletes customers, programs or transactions.', `${bars(2)}<div class="grid g3">
    ${g.planCard('Free Plan', 'No payment details required', g.DATA.plans.free, `<a class="btn btn-ghost btn-block" href="09-onboarding-first-program.html">Choose Free Plan</a>`)}
    ${g.planCard('Free Trial', '14 days, then reverts to Free (or Preview) — no data is deleted', g.DATA.plans.trial, `<a class="btn btn-primary btn-block" href="09-onboarding-first-program.html">Start Free Trial ${icon('arrowRight', 'sm')}</a>`, { cls: 'current' })}
    ${g.planCard('Pro Plan', 'Pricing not configured yet <span class="faint">(set by Bonuca)</span>', g.DATA.plans.pro, `<button class="btn btn-ghost btn-block is-locked" disabled>${icon('lock', 'sm')}Choose Pro — Stripe checkout</button>`, { cls: 'ink' })}
  </div><div style="margin-top:18px">${callout('info', 'Paid plans on the web use Stripe checkout', 'Stripe is not connected in this environment, so paid checkout cannot be completed here. Mobile purchases use the App Store / Google Play inside the Bonuca app.')}</div>
  <div class="divider"></div><div class="row between wrap"><div><b>Skip for now</b><div class="hint">Explore every tab with demo data in Preview Mode.</div></div><a class="btn btn-text" href="../../owner/pages/61-dashboard-preview-mode.html">Skip for now ${icon('arrowRight', 'sm')}</a></div>`, { w: 1000, stepper: stepper(2), eyebrow: `${icon('card', 'sm')} Onboarding` }) });

  S.onboarding3 = () => {
    const types = [['Stamp Card', 'stamp', '#1747F8', 'Collect stamps, earn a reward'], ['Membership Card', 'crown', '#7C3AED', 'A standing perk for members'], ['Tier Program', 'layers', '#0F9D6E', 'Levels unlocked by visits'], ['Points Program', 'coins', '#C2410C', 'Earn points per purchase']];
    return { title: 'Create your first loyalty program', html: authFrame('Create your first <span class="hl">loyalty program</span>', 'Saved as a Draft. Finish the full setup (logo, design, publishing) in Loyalty Programs.', `${bars(3)}<div class="grid" style="grid-template-columns:minmax(0,1fr) 260px;gap:24px;align-items:start">
      <div class="stack">
        <div class="grid g2" data-types>${types.map(([n, ic, c, d], i) => `<button class="type-card ${i === 0 ? 'on' : ''}" data-select="${n}" style="--c:${c}"><span class="ti">${icon(ic)}</span><b>${n}</b><small>${d}</small></button>`).join('')}</div>
        <div class="form-grid" style="grid-template-columns:1fr 1fr 1fr">
          ${field({ label: 'Program name', required: true, input: input({ ph: 'Coffee Card', attrs: 'data-bind-src="name" data-fallback="Coffee Card"' }) })}
          ${field({ label: 'Reward', required: true, input: input({ ph: '1 Free Coffee', attrs: 'data-bind-src="reward"' }) })}
          ${field({ label: 'Number of stamps required', required: true, input: input({ type: 'number', value: '10' }) })}
        </div>
        <div class="row"><a class="btn btn-primary btn-lg" href="../../owner/pages/01-dashboard.html">Create program ${icon('arrowRight', 'sm')}</a><a class="btn btn-text" href="../../owner/pages/01-dashboard.html">I’ll do this later</a></div>
      </div>
      <div><div class="eyebrow" style="justify-content:center;width:100%">${icon('eye', 'sm')} Live preview</div>${pass({ type: 'stamp', name: 'Coffee Card', reward: '1 Free Coffee', total: 10, filled: 3 }).replace('<div class="pass-qr">', '<div class="pass-qr" style="width:90px;height:90px">')}</div>
    </div>`, { w: 1000, stepper: stepper(3), eyebrow: `${icon('stamp', 'sm')} Onboarding` }) };
  };

  g.planCard = (name, sub, feats, cta, o = {}) => `<article class="card plan ${o.cls || ''} reveal-up">${o.ribbon ? `<span class="ribbon">${o.ribbon}</span>` : ''}<div><h3 style="font-size:19px">${name}</h3><p class="muted" style="margin-top:6px;font-size:13.5px;min-height:40px">${sub}</p></div><ul>${feats.map(f => `<li>${icon('checkCircle', 'sm')}${f}</li>`).join('')}</ul>${o.note ? `<p class="faint" style="font-size:12.5px">${o.note}</p>` : ''}<div class="cta">${cta}</div></article>`;
})(window);
