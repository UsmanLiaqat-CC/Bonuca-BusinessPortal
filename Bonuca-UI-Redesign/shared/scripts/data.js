/* Prototype sample data — mirrors the values visible in the original screenshots.
   Not production data. */
(function (g) {
  const programs = [
    { id: 'coffee', name: 'Coffee Card', type: 'Stamp Card', kind: 'stamp', status: 'Active', date: 'Published Dec 5, 2025', icon: 'stamp', c: '#1747F8', url: 'https://join.bonuca.invalid/program/join-prg_coffee', qrAction: 'Add wallet card',
      pass: { type: 'stamp', name: 'Coffee Card', reward: '1 Free Coffee', total: 10, filled: 3 }, cap: 'Digital Stamp Card',
      multi: { on: true, max: 3 },
      setup: [['Stamps required', '10'], ['Reward', '1 Free Coffee'], ['Multiple stamps per scan', 'On · max 3']] },
    { id: 'vip', name: 'VIP Member', type: 'Membership Card', kind: 'membership', status: 'Active', date: 'Published Dec 5, 2025', icon: 'crown', c: '#7C3AED', url: 'https://join.bonuca.invalid/program/join-prg_vip', qrAction: 'Join membership',
      pass: { type: 'membership', name: 'VIP Member', benefit: '10% Discount', since: 'Jan 15, 2026', bg: '#1B1B1F' }, cap: 'Membership Card',
      setup: [['Benefit', '10% Discount'], ['Member benefits', 'Permanent']] },
    { id: 'club', name: 'Rewards Club', type: 'Tier Program', kind: 'tier', status: 'Active', date: 'Published Dec 5, 2025', icon: 'layers', c: '#0F9D6E', url: 'https://join.bonuca.invalid/program/join-prg_club', qrAction: 'Join membership',
      pass: { type: 'tier', name: 'Rewards Club', tier: 'Member', next: '6 visits to Silver', pct: 40, bg: '#3A3F55' }, cap: 'Tier Program Pass',
      // Client defaults: Member (default) · Silver – 10 visits · Gold – 25 visits · Platinum – 50 visits. tiers: [name, required value, wallet colour, rewards & benefits]
      // req = upgrade requirement (Visits / Points / Total spending); currency + points rule are used only for Total spending / Points (same rules as the Points Program).
      cfg: { req: 'Visits', currency: 'EUR', method: 'Fixed points per visit', perVisit: 10, basis: 1, pts: 10, rounding: 'Round down', min: null, max: null,
        tiers: [['Member', 0, '#3A3F55', 'Welcome drink'], ['Silver', 10, '#8A8FA3', 'Free coffee upgrade'], ['Gold', 25, '#B8902E', '10% off every visit'], ['Platinum', 50, '#5E6A7D', 'Free birthday dinner']] },
      setup: [] },
    { id: 'points', name: 'Coffee Rewards', type: 'Points Program', kind: 'points', status: 'Active', date: 'Published Dec 5, 2025', icon: 'coins', c: '#C2410C', url: 'https://join.bonuca.invalid/program/join-prg_points', qrAction: 'Add wallet card',
      pass: { type: 'points', name: 'Coffee Rewards', balance: '120 pts', nextReward: 'Free Dessert', needed: '130', pct: 48 }, cap: 'Generic layout (no launch template)',
      cfg: { currency: 'EUR', basis: 1, pts: 10, method: 'Manual', perVisit: 10, rounding: 'Round down', min: null, max: null, rewards: [['Free Coffee', 100], ['Free Dessert', 250], ['Free Burger', 500]], pointExpiry: null, rewardExpiry: null },
      setup: [['Currency', 'EUR'], ['Earning rule', '1 EUR = 10 points'], ['Awarding method', 'Manual — employee enters the purchase amount'], ['Rounding', 'Round down'], ['Rewards', '100 points = Free Coffee, 250 points = Free Dessert, 500 points = Free Burger']] },
    { id: 'lunch', name: 'Lunch Card', type: 'Stamp Card', kind: 'stamp', status: 'Draft', date: 'Created Dec 5, 2025', icon: 'stamp', c: '#B45309', url: '',
      pass: { type: 'stamp', name: 'Lunch Card', reward: 'Free Lunch Menu', total: 8, filled: 3, icon: 'star', bg: '#7A2E21' }, cap: 'Digital Stamp Card',
      multi: { on: false, max: 3 },
      setup: [['Stamps required', '8'], ['Reward', 'Free Lunch Menu'], ['Multiple stamps per scan', 'Off']] }
  ];
  const campaigns = [
    { id: 'cuplid', name: 'Cup-lid Campaign', type: 'Stamp card acquisition', status: 'Active', created: 'Aug 22, 2026', url: 'https://join.bonuca.invalid/campaign/cmp-cuplid', program: 'coffee', start: 2, gift: 'Free coffee on your next visit', validity: 30 },
    { id: 'freecoffee', name: 'Free Coffee Campaign', type: 'One-time voucher', status: 'Active', created: 'Sep 11, 2026', url: 'https://join.bonuca.invalid/campaign/cmp-freecoffee', reward: '1 Free Coffee', from: 'Sep 11, 2026', to: 'Dec 10, 2026' },
    { id: 'brunch', name: 'Weekend Brunch Voucher', type: 'One-time voucher', status: 'Active', created: 'Sep 11, 2026', url: 'https://join.bonuca.invalid/campaign/cmp-brunch', reward: 'Free brunch drink', from: 'Sep 11, 2026', to: 'Nov 25, 2026' }
  ];
  const names = 'Anna Schmidt,Anna Schmidt,Zoe Dubois,Vera Conti,Umut Fischer,Kemal Fischer,Felix Bernard,Wim Kaya,Leon Fischer,Julia Bianchi,Leon Dubois,Sven Martin,Wim Rossi,Nina Schmidt,Umut Demir,Sven Martin,Nina Ricci,Vera Conti,Umut Martin,Emma Martin,Zoe Öztürk,Clara Schmidt,Nina Kaya,Oscar Ricci,Tara Bianchi,Umut Dubois,Lena Weber,David Ricci,Umut Demir,Luca Schmidt,Ivan Rossi,Elif Laurent,Anna Bianchi,Emma Ricci,Sven Dubois,Paula Ricci,Tara Ricci,Lena Conti,Kemal Bianchi,Anna Weber,Clara Schmidt,Ben Schmidt,Julia Yilmaz,Rosa Weber,Lena Schmidt,Sven Öztürk,Nina Weber,Elif Ricci,Oscar Demir,Umut Fischer,Lena Demir,Quentin Bernard,Luca Ricci,Clara Rossi,Mia Martin,Kemal Müller,Marco Ricci,Zoe Laurent,Mia Bianchi,Emma Öztürk,Paula Ricci,Yara Rossi,Julia Bernard,Julia Müller'.split(',');
  const noEmail = new Set([1, 7, 10, 12, 13, 16, 17, 20, 22, 23, 25, 26, 35, 37, 38, 39, 45, 49, 53, 56, 59]);
  const noPhone = new Set([1, 3, 5, 7, 11, 12, 14, 15, 19, 21, 25, 30, 34, 35, 39, 43, 45, 46, 47, 49, 50, 54, 56, 58, 59, 62, 63]);
  const joined = ['Jan 6, 2026', 'Jan 21, 2026', 'Oct 9, 2026', 'May 28, 2026', 'Apr 26, 2026', 'Oct 18, 2026', 'Mar 14, 2026', 'May 16, 2026', 'Apr 25, 2026', 'May 22, 2026', 'May 17, 2026', 'Oct 21, 2026', 'Jul 21, 2026', 'Sep 26, 2026', 'Sep 26, 2026', 'Jul 28, 2026', 'Oct 21, 2026', 'May 27, 2026', 'Oct 16, 2026', 'Jul 4, 2026', 'May 14, 2026', 'Feb 1, 2026', 'Jun 7, 2026', 'May 30, 2026', 'Jun 1, 2026', 'Feb 12, 2026', 'Sep 15, 2026', 'Oct 21, 2026', 'May 23, 2026', 'Mar 24, 2026', 'Aug 2, 2026', 'Jan 13, 2026', 'Jun 30, 2026', 'Aug 13, 2026', 'Mar 17, 2026', 'Oct 10, 2026', 'Sep 14, 2026', 'Jun 3, 2026', 'Oct 21, 2026', 'Sep 15, 2026', 'May 9, 2026', 'Oct 21, 2026', 'Jun 11, 2026', 'Sep 25, 2026', 'May 8, 2026', 'Sep 15, 2026', 'Aug 24, 2026', 'Aug 11, 2026', 'Oct 4, 2026', 'Jul 9, 2026', 'Feb 22, 2026', 'Oct 18, 2026', 'Jun 13, 2026', 'Sep 15, 2026', 'Oct 6, 2026', 'Apr 19, 2026', 'May 3, 2026', 'Jun 8, 2026', 'Aug 13, 2026', 'Apr 24, 2026', 'Feb 26, 2026', 'May 4, 2026', 'May 9, 2026', 'Aug 21, 2026'];
  const clubTiers = [['Member', 0], ['Silver', 10], ['Gold', 25], ['Platinum', 50]]; // Rewards Club defaults (client): Member → Silver 10 → Gold 25 → Platinum 50 visits
  const customers = names.map((n, i) => {
    const [f, l] = n.split(' ');
    const ph = 5196093 + ((i * 7919) % 4000000);
    // visits, days since the last visit and Rewards Club tier drive the gift target groups (demo values).
    const visits = (i * 13 + 12) % 31;
    return { name: n, id: 'C-' + (10001 + i), email: noEmail.has(i) ? '—' : `${f.toLowerCase()}.${l.toLowerCase()}${i}@example.com`, phone: noPhone.has(i) ? '—' : `+49 151 ${ph}`, joined: joined[i],
      visits, daysSince: (i * 17) % 75, tier: [...clubTiers].reverse().find(([, min]) => visits >= min)[0] };
  });
  customers[0].phone = '+49 151 5196093';

  const scansBase = [
    ['Kemal Bianchi', 'Points credited · +101 pts · Coffee Rewards', '02:28 PM', 'points'],
    ['Umut Martin', 'Visit · Rewards Club', '02:24 PM', 'visit'],
    ['Kemal Bianchi', 'Visit · Rewards Club', '02:22 PM', 'visit'],
    ['Sven Martin', 'Points credited · +173 pts · Coffee Rewards', '02:09 PM', 'points'],
    ['Ben Schmidt', 'Visit · VIP Member', '01:53 PM', 'visit'],
    ['Kemal Bianchi', 'Points credited · +73 pts · Coffee Rewards', '01:46 PM', 'points'],
    ['Ben Schmidt', 'Visit · VIP Member', '01:43 PM', 'visit'],
    ['David Ricci', 'Points credited · +37 pts · Coffee Rewards', '01:42 PM', 'points'],
    ['Nina Schmidt', 'Visit · VIP Member', '01:37 PM', 'visit'],
    ['Umut Martin', 'Visit · Rewards Club', '01:35 PM', 'visit'],
    ['David Ricci', 'Points credited · +54 pts · Coffee Rewards', '01:17 PM', 'points']
  ];

  /* rewards: 78 total = 42 available / 29 redeemed / 7 pending / 0 expired */
  const rewards = [];
  const wb = [['Free espresso shot', 'Anna Schmidt'], ['Free espresso shot', 'Umut Fischer'], ['Free coffee', 'Kemal Fischer'], ['Free coffee and cake', 'Leon Fischer'], ['Free espresso shot', 'Julia Bianchi'], ['Free coffee and cake', 'Nina Ricci'], ['Free espresso shot', 'Umut Dubois'], ['Free coffee', 'Umut Demir'], ['Free coffee', 'Luca Schmidt'], ['Free coffee', 'Emma Ricci'], ['Free espresso shot', 'Sven Dubois'], ['Free espresso shot', 'Anna Weber'], ['10% off your next visit', 'Julia Yilmaz'], ['10% off your next visit', 'Lena Schmidt'], ['Free espresso shot', 'Nina Weber'], ['10% off your next visit', 'Quentin Bernard'], ['Free espresso shot', 'Clara Rossi'], ['Free coffee and cake', 'Marco Ricci'], ['Free espresso shot', 'Zoe Laurent'], ['Free espresso shot', 'Yara Rossi']];
  wb.forEach(([r, c]) => rewards.push([r, c, 'Win-back', 'Available', 'Oct 21, 2026', '—']));
  const mid = [['Free Coffee', 'Sven Martin', 'P', 'Available'], ['Free Coffee', 'Wim Rossi', 'P', 'Redeemed'], ['1 Free Coffee', 'Wim Rossi', 'V', 'Redeemed'], ['Free brunch drink', 'Nina Schmidt', 'B', 'Pending'], ['Free Coffee', 'Umut Demir', 'P', 'Redeemed'], ['Free Coffee', 'Sven Martin', 'P', 'Redeemed'], ['1 Free Coffee', 'Umut Martin', 'V', 'Available'], ['Free Coffee', 'Emma Martin', 'P', 'Redeemed'], ['Free Coffee', 'Nina Kaya', 'P', 'Available'], ['Free Coffee', 'Oscar Ricci', 'P', 'Redeemed'], ['Free brunch drink', 'Oscar Ricci', 'B', 'Pending'], ['1 Free Coffee', 'Tara Bianchi', 'V', 'Redeemed'], ['Free Coffee', 'Lena Weber', 'P', 'Available'], ['Free Coffee', 'David Ricci', 'P', 'Redeemed'], ['1 Free Coffee', 'Ivan Rossi', 'V', 'Available'], ['Free Coffee', 'Elif Laurent', 'P', 'Redeemed'], ['Free Coffee', 'Anna Bianchi', 'P', 'Redeemed'], ['Free brunch drink', 'Emma Ricci', 'B', 'Pending'], ['Free Coffee', 'Paula Ricci', 'P', 'Available'], ['Free Coffee', 'Tara Ricci', 'P', 'Available'], ['1 Free Coffee', 'Tara Ricci', 'V', 'Available'], ['Free Coffee', 'Lena Conti', 'P', 'Available'], ['Free Coffee', 'Kemal Bianchi', 'P', 'Available'], ['Free Coffee', 'Anna Weber', 'P', 'Redeemed'], ['Free Coffee', 'Clara Schmidt', 'P', 'Redeemed'], ['1 Free Coffee', 'Julia Yilmaz', 'V', 'Available'], ['Free Coffee', 'Rosa Weber', 'P', 'Redeemed'], ['Free brunch drink', 'Rosa Weber', 'B', 'Pending'], ['Free Coffee', 'Elif Ricci', 'P', 'Available'], ['1 Free Coffee', 'Oscar Demir', 'V', 'Redeemed'], ['Free Coffee', 'Quentin Bernard', 'P', 'Redeemed'], ['Free Coffee', 'Luca Ricci', 'P', 'Redeemed'], ['Free brunch drink', 'Clara Rossi', 'B', 'Pending'], ['Free Coffee', 'Mia Martin', 'P', 'Redeemed'], ['1 Free Coffee', 'Mia Martin', 'V', 'Redeemed'], ['Free Coffee', 'Kemal Müller', 'P', 'Available'], ['Free Coffee', 'Zoe Laurent', 'P', 'Redeemed'], ['Free Coffee', 'Emma Öztürk', 'P', 'Redeemed'], ['Free Coffee', 'Paula Ricci', 'P', 'Redeemed'], ['1 Free Coffee', 'Paula Ricci', 'V', 'Redeemed'], ['Free Coffee', 'Julia Müller', 'P', 'Available'], ['Free brunch drink', 'Julia Müller', 'B', 'Pending']];
  const src = { P: 'Points · Coffee Rewards', V: 'Voucher · Free Coffee Campaign', B: 'Voucher · Weekend Brunch Voucher' };
  const exp = { P: '—', V: 'Dec 10, 2026', B: 'Nov 25, 2026' };
  mid.forEach(([r, c, k, s]) => rewards.push([r, c, src[k], s, 'Oct 12, 2026', exp[k]]));
  [['1 Free Coffee', 'Anna Schmidt', 'V', 'Available'], ['Free Coffee', 'Vera Conti', 'P', 'Redeemed'], ['Free brunch drink', 'Vera Conti', 'B', 'Pending'], ['Free Coffee', 'Felix Bernard', 'P', 'Available'], ['1 Free Coffee', 'Felix Bernard', 'V', 'Redeemed'], ['Free Coffee', 'Wim Kaya', 'P', 'Available']].forEach(([r, c, k, s]) => rewards.push([r, c, src[k], s, 'Oct 5, 2026', exp[k]]));
  [['Anna Schmidt', 'Available', 'Sep 27'], ['Leon Fischer', 'Redeemed', 'Sep 27'], ['Umut Demir', 'Available', 'Sep 25'], ['Vera Conti', 'Redeemed', 'Sep 25'], ['Anna Bianchi', 'Redeemed', 'Sep 25'], ['Clara Schmidt', 'Redeemed', 'Sep 25'], ['Lena Schmidt', 'Redeemed', 'Sep 25'], ['Oscar Demir', 'Available', 'Sep 25'], ['Quentin Bernard', 'Available', 'Sep 25'], ['Marco Ricci', 'Available', 'Sep 25']].forEach(([c, s, d]) => rewards.push(['1 Free Coffee', c, 'Stamp card · Coffee Card', s, d + ', 2026', '—']));

  const winbackLog = [[1, 61], [1, 57], [4, 56], [1, 53], [2, 51], [1, 46], [2, 44], [2, 42], [1, 39], [1, 34], [3, 33], [3, 29], [3, 28], [1, 25], [4, 16], [1, 9], [4, 8], [3, 5], [1, 4], [1, 1]];
  /* win-back stages (client: 14, 30, 40 or 60 days): [days inactive, reward the notification creates, Wallet push message] */
  const stages = [[14, 'Free espresso shot', 'We miss you! Visit us this week and enjoy a free espresso shot.'], [30, '10% off your next visit', 'We miss you! Visit us this week and enjoy 10% off your next visit.'], [40, 'Free coffee', 'We miss you! Visit us this week and enjoy a free coffee.'], [60, 'Free coffee and cake', 'We miss you! Visit us this week and enjoy a free coffee and cake.']];

  const dash = {
    growthLabels: ['09-22', '09-23', '09-24', '09-25', '09-26', '09-27', '09-28', '09-29', '09-30', '10-01', '10-02', '10-03', '10-04', '10-05', '10-06', '10-07', '10-08', '10-09', '10-10', '10-11', '10-12', '10-13', '10-14', '10-15', '10-16', '10-17', '10-18', '10-19', '10-20', '10-21'],
    growth: [49, 49, 49, 50, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 52, 53, 53, 53, 54, 54, 54, 55, 55, 56, 57, 58, 59, 61, 64],
    scans: [8, 5, 4, 4, 10, 9, 13, 10, 9, 9, 4, 5, 13, 12, 14, 8, 10, 14, 13, 17, 15, 13, 8, 17, 12, 17, 14, 17, 22, 44],
    monthsL: ['2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'],
    months: [0, 3, 4, 3, 4, 13, 7, 4, 6, 8, 12, 12],
    top: [['Rewards Club', 265], ['VIP Member', 223], ['Coffee Rewards', 205], ['Coffee Card', 179]],
    dist: [['Coffee Card', 26], ['VIP Member', 29], ['Rewards Club', 36], ['Coffee Rewards', 30]]
  };
  const analytics = {
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], dayVals: [57, 67, 73, 39, 34, 45, 52],
    weeksL: ['08-10', '08-17', '08-24', '08-31', '09-07', '09-14', '09-21', '09-28', '10-05', '10-12', '10-19'], weeks: [3, 1, 1, 0, 0, 5, 3, 1, 3, 3, 5],
    top: [['Tara Ricci', 18], ['Nina Schmidt', 17], ['Lena Weber', 16], ['Oscar Demir', 15], ['Umut Demir', 14]]
  };
  /* [name, email, role, since, canManageEmployees (Managers, set by the Owner), canAwardMultipleStamps (Employees)] */
  const team = [['Sam Owner', 'owner@sample.dev', 'Owner', 'Dec 5, 2025'], ['Mia Manager', 'manager@sample.dev', 'Manager', 'Dec 5, 2025', true], ['Eli Employee', 'employee@sample.dev', 'Employee', 'Dec 5, 2025', false, false]];
  /* stamp-card holders the scanner can open: [name, customer ID, stamps already on the Coffee Card] */
  /* points customers the scanner can open: [name, customer ID, current balance] */
  const pointsScans = { vera: ['Vera Conti', 'C-10004', 237] };
  /* points transaction log: [customer, program, currency, purchase amount, points, balance before, balance after, employee, location, date/time, status] */
  const LOC = 'Sample Street 1, Berlin';
  const pointsLog = [
    ['Kemal Bianchi', 'Coffee Rewards', 'EUR', '10.10', '+101', 412, 513, 'Mia Manager', LOC, 'Oct 21, 2026, 02:28 PM', 'Completed'],
    ['Sven Martin', 'Coffee Rewards', 'EUR', '17.30', '+173', 150, 323, 'Eli Employee', LOC, 'Oct 21, 2026, 02:09 PM', 'Completed'],
    ['Kemal Bianchi', 'Coffee Rewards', 'EUR', '7.30', '+73', 339, 412, 'Sam Owner', LOC, 'Oct 21, 2026, 01:46 PM', 'Completed'],
    ['David Ricci', 'Coffee Rewards', 'EUR', '3.70', '+37', 88, 125, 'Eli Employee', LOC, 'Oct 21, 2026, 01:42 PM', 'Completed'],
    ['David Ricci', 'Coffee Rewards', 'EUR', '5.40', '+54', 34, 88, 'Mia Manager', LOC, 'Oct 21, 2026, 01:17 PM', 'Completed'],
    ['Anna Schmidt', 'Coffee Rewards', 'EUR', '—', '−100 · Free Coffee', 220, 120, 'Mia Manager', LOC, 'Oct 20, 2026, 05:10 PM', 'Completed'],
    ['Vera Conti', 'Coffee Rewards', 'EUR', '12.40', '+124', 113, 237, 'Eli Employee', LOC, 'Oct 18, 2026, 11:32 AM', 'Completed']
  ];
  /* tier customers the scanner can open: [name, customer ID, current value in the program's upgrade requirement] — kemal is one visit from Silver, umut one from Gold */
  const tierScans = { anna: ['Anna Schmidt', 'C-10001', 4], kemal: ['Kemal Bianchi', 'C-10039', 9], umut: ['Umut Martin', 'C-10019', 24] };
  /* membership customers the scanner can open: [name, customer ID, visits, last visit, member since] */
  const memberScans = { anna: ['Anna Schmidt', 'C-10001', 12, 'Oct 21, 2026', 'Jan 15, 2026'] };
  const stampScans = { anna: ['Anna Schmidt', 'C-10001', 1], leon: ['Leon Fischer', 'C-10009', 9] };
  /* Free Coffee Campaign vouchers the scanner can open: [name, customer ID, voucher status, redeemed on] */
  const voucherScans = { anna: ['Anna Schmidt', 'C-10001', 'Available', ''], felix: ['Felix Bernard', 'C-10007', 'Redeemed', 'Oct 5, 2026'] };
  /* win-back customers the scanner can open: [name, customer ID, days inactive, last visit, visit-history entries before the gap start at] */
  const winbackScans = { kemal: ['Kemal Fischer', 'C-10006', 40, 'Sep 11, 2026', 4], anna: ['Anna Schmidt', 'C-10001', 22, 'Sep 29, 2026', 2] };
  /* gifts (client: manual · group · automatic rules). Every gift has the client's fields; demo "today" = Oct 21, 2026. */
  const giftOpts = (o = {}) => ({ multi: false, min: null, locs: [LOC], combine: false, product: null, ...o });
  const C = id => customers.find(c => c.id === id);
  const gift = (id, name, desc, cid, src, by, created, on, exp, status, terms, red, o) => ({ id, name, desc, cid, customer: C(cid).name, src, by, created, on, exp, status, terms, red: red ? { date: red[0], by: red[1], loc: LOC } : null, opts: giftOpts(o) });
  const T1 = 'Valid once. Not exchangeable for cash.';
  const gifts = [
    gift('g1', 'Free coffee', 'Sorry about the wait on your last visit — your next coffee is on us.', 'C-10001', 'Manual', 'Sam Owner', 'Oct 19, 2026', 'Oct 19, 2026', 'Nov 30, 2026', 'Available', T1),
    gift('g2', 'Free product upgrade', 'Upgrade any drink to a large at no extra cost.', 'C-10004', 'Manual', 'Mia Manager', 'Oct 20, 2026', 'Nov 1, 2026', 'Nov 30, 2026', 'Scheduled', T1),
    gift('g3', '20% discount', '20% off your whole order.', 'C-10009', 'Manual', 'Sam Owner', 'Oct 2, 2026', 'Oct 2, 2026', 'Oct 31, 2026', 'Redeemed', 'Cannot be combined with other discounts.', ['Oct 20, 2026, 04:12 PM', 'Eli Employee'], { min: 10 }),
    gift('g4', '100 bonus points', '100 bonus points on your Coffee Rewards card.', 'C-10040', 'Manual', 'Mia Manager', 'Sep 1, 2026', 'Sep 1, 2026', 'Oct 15, 2026', 'Expired', T1),
    gift('g5', 'Free dessert', 'A dessert of your choice with your next order.', 'C-10015', 'Manual', 'Sam Owner', 'Oct 10, 2026', 'Oct 10, 2026', 'Nov 10, 2026', 'Cancelled', T1),
    gift('g6', '20% discount', '20% off every visit this month.', 'C-10023', 'Manual', 'Sam Owner', 'Oct 5, 2026', 'Oct 5, 2026', 'Oct 31, 2026', 'Available', 'Valid on every visit until the expiration date.', ['Oct 12, 2026, 09:40 AM', 'Mia Manager'], { multi: true }),
    gift('g7', 'Birthday gift', 'Happy birthday! A free slice of cake on us.', 'C-10014', 'Rule', 'Automatic rule · Birthday', 'Oct 18, 2026', 'Oct 18, 2026', 'Nov 17, 2026', 'Available', T1),
    gift('g8', 'Free coffee', 'Thanks for your 5th visit — a free coffee.', 'C-10003', 'Rule', 'Automatic rule · After the 5th visit', 'Oct 9, 2026', 'Oct 9, 2026', 'Nov 8, 2026', 'Redeemed', T1, ['Oct 11, 2026, 08:05 AM', 'Eli Employee']),
    gift('g9', '20% discount', 'Welcome! 20% off your next order.', 'C-10012', 'Rule', 'Automatic rule · After registration', 'Oct 21, 2026', 'Oct 21, 2026', 'Nov 20, 2026', 'Available', T1),
    gift('g10', 'One additional stamp', 'An extra stamp on your Coffee Card.', 'C-10057', 'Rule', 'Automatic rule · Reaching Gold', 'Aug 20, 2026', 'Aug 20, 2026', 'Sep 19, 2026', 'Expired', T1)
  ];
  // Group gift — the client's example "Send a free dessert to all Gold members."
  customers.filter(c => c.tier === 'Gold').forEach((c, i) => gifts.push(Object.assign(gift('gg' + (i + 1), 'Free dessert', 'A free dessert for our Gold members.', c.id, 'Group', 'Sam Owner', 'Oct 14, 2026', 'Oct 14, 2026', 'Oct 31, 2026', i < 3 ? 'Redeemed' : 'Available', T1, i < 3 ? [`Oct ${16 + i}, 2026, 0${2 + i}:30 PM`, 'Eli Employee'] : null), { target: 'Gold tier' })));
  /* automatic gift rules: [trigger, value, gift, active] */
  const giftRules = [['Birthday', '', 'Birthday gift', true], ['After the Xth visit', '5', 'Free coffee', true], ['After registration', '', '20% discount', true], ['X days without a visit', '30', 'Free dessert', false], ['Reaching a tier', 'Gold', 'One additional stamp', true]];
  const roles = [['Owner', 'Full access — billing/subscription, employees, customers, loyalty programs, analytics, scanner, business settings.', 'shield'], ['Manager', 'Customers, loyalty programs, rewards, analytics, scanner, limited settings, and employees if permitted.', 'badge'], ['Employee', 'Scanner, limited customer info, add stamps/points/visits, redeem rewards. No billing or subscription access.', 'scan']];
  const plans = {
    free: ['Up to 15 customers', 'Up to 1 programs', 'Up to 1 locations', 'Up to 1 employees'],
    trial: ['All Pro features, temporarily', 'Unlimited customers', 'Unlimited programs', 'Unlimited locations', 'Unlimited employees'],
    pro: ['Unlimited customers', 'Unlimited programs', 'Unlimited locations', 'Unlimited employees', 'AI heatmap commentary']
  };
  g.DATA = { programs, campaigns, customers, scansBase, rewards, winbackLog, stages, dash, analytics, team, roles, plans, stampScans, pointsScans, pointsLog, voucherScans, winbackScans, tierScans, memberScans, clubTiers, gifts, giftRules, locations: [LOC] };
})(window);
