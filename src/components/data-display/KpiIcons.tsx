export type KpiIconName =
  | 'businesses'
  | 'customers'
  | 'subscriptions'
  | 'wallet'
  | 'revenue'
  | 'scans'
  | 'growth'
  | 'retention'
  | 'sent'
  | 'clock'
  | 'failed'
  | 'blocked'
  | 'preview'
  | 'gift'
  | 'card'
  | 'bolt';

const C = {
  blue: '#2F6FED',
  blueMid: '#60A5FA',
  blueSoft: '#BFDBFE',
  blueDark: '#1B57D0',
  blueTint: '#EEF4FE',
  green: '#22C55E',
  greenSoft: '#86EFAC',
  greenTint: '#DCFCE7',
  greenDark: '#15803D',
  amber: '#F59E0B',
  amberSoft: '#FCD34D',
  amberTint: '#FEF3C7',
  amberDark: '#B45309',
  red: '#EF4444',
  redSoft: '#FCA5A5',
  redTint: '#FEE2E2',
  grey: '#6B7280',
  greySoft: '#CBD5E1',
  greyTint: '#E5E7EB',
  white: '#FFFFFF',
};

const ICONS: Record<KpiIconName, React.ReactNode> = {
  businesses: (
    <>
      <rect x="5" y="15" width="16" height="27" rx="3" fill={C.blueSoft} />
      <rect x="9" y="20" width="3.5" height="3.5" rx="1" fill={C.white} />
      <rect x="14.5" y="20" width="3.5" height="3.5" rx="1" fill={C.white} />
      <rect x="9" y="27" width="3.5" height="3.5" rx="1" fill={C.white} />
      <rect x="14.5" y="27" width="3.5" height="3.5" rx="1" fill={C.white} />
      <rect x="19" y="7" width="24" height="35" rx="3.5" fill={C.blue} />
      <rect x="23.5" y="13" width="4.5" height="4.5" rx="1.2" fill={C.blueTint} />
      <rect x="31.5" y="13" width="4.5" height="4.5" rx="1.2" fill={C.blueTint} />
      <rect x="23.5" y="21.5" width="4.5" height="4.5" rx="1.2" fill={C.blueTint} />
      <rect x="31.5" y="21.5" width="4.5" height="4.5" rx="1.2" fill={C.blueTint} />
      <rect x="26.5" y="31" width="9" height="11" rx="2" fill={C.amber} />
      <rect x="3" y="41" width="42" height="3.5" rx="1.75" fill={C.blueDark} />
    </>
  ),

  customers: (
    <>
      <circle cx="11" cy="18" r="5.5" fill={C.blueSoft} />
      <path d="M1.5 39.5c0-5.5 4.3-9 9.5-9s9.5 3.5 9.5 9H1.5z" fill={C.blueSoft} />
      <circle cx="37" cy="18" r="5.5" fill={C.blueSoft} />
      <path d="M27.5 39.5c0-5.5 4.3-9 9.5-9s9.5 3.5 9.5 9H27.5z" fill={C.blueSoft} />
      <circle cx="24" cy="16" r="8.5" fill={C.blue} />
      <path d="M9 42c0-8 6.7-13.5 15-13.5S39 34 39 42H9z" fill={C.blue} />
      <rect x="19" y="33.5" width="10" height="6.5" rx="2" fill={C.amber} />
      <rect x="21" y="36" width="6" height="1.6" rx="0.8" fill={C.amberTint} />
    </>
  ),

  subscriptions: (
    <>
      <rect x="4" y="9" width="40" height="27" rx="5" fill={C.blue} />
      <rect x="4" y="15" width="40" height="5.5" fill={C.blueDark} />
      <rect x="9" y="26" width="12" height="3" rx="1.5" fill={C.blueSoft} />
      <circle cx="35" cy="34" r="10" fill={C.white} />
      <circle cx="35" cy="34" r="8.5" fill={C.green} />
      <path d="M31 34.2l2.7 2.7 5-5.4" stroke={C.white} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),

  wallet: (
    <>
      <rect x="13" y="5" width="22" height="15" rx="3" fill={C.amberSoft} transform="rotate(-8 24 12)" />
      <rect x="15" y="9" width="22" height="14" rx="3" fill={C.amber} />
      <rect x="5" y="17" width="38" height="24" rx="6" fill={C.blueMid} />
      <path d="M5 26h38v9a6 6 0 0 1-6 6H11a6 6 0 0 1-6-6v-9z" fill={C.blue} />
      <rect x="28" y="27.5" width="15" height="8" rx="4" fill={C.blueTint} />
      <circle cx="34.5" cy="31.5" r="2.4" fill={C.blueDark} />
    </>
  ),

  revenue: (
    <>
      <rect x="4" y="12" width="35" height="21" rx="3.5" fill={C.greenSoft} transform="rotate(-7 21.5 22.5)" />
      <rect x="5" y="16" width="34" height="21" rx="3.5" fill={C.green} />
      <rect x="5" y="22" width="34" height="9" fill={C.greenDark} opacity="0.25" />
      <circle cx="34" cy="33" r="11" fill={C.white} />
      <circle cx="34" cy="33" r="9.5" fill={C.amber} />
      <circle cx="34" cy="33" r="7" fill={C.amberSoft} />
      <path
        d="M34 26.8v12.4M37.2 29.2c-.6-1-1.8-1.6-3.2-1.6-1.9 0-3.2 1.1-3.2 2.6s1.1 2.3 3.2 2.6c2.1.3 3.4 1 3.4 2.6s-1.4 2.7-3.4 2.7c-1.5 0-2.7-.6-3.3-1.7"
        stroke={C.amberDark}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),

  scans: (
    <>
      <rect x="6" y="6" width="36" height="36" rx="8" fill={C.blueTint} />
      <path d="M13 19v-3a3 3 0 0 1 3-3h3M29 13h3a3 3 0 0 1 3 3v3M35 29v3a3 3 0 0 1-3 3h-3M19 35h-3a3 3 0 0 1-3-3v-3" stroke={C.blue} strokeWidth="3" strokeLinecap="round" fill="none" />
      <rect x="18" y="18" width="5" height="5" rx="1.2" fill={C.blueMid} />
      <rect x="25" y="18" width="5" height="5" rx="1.2" fill={C.blueMid} />
      <rect x="18" y="25" width="5" height="5" rx="1.2" fill={C.blueMid} />
      <rect x="25" y="25" width="5" height="5" rx="1.2" fill={C.blueMid} />
      <rect x="8" y="22" width="32" height="4" rx="2" fill={C.red} />
    </>
  ),

  growth: (
    <>
      <rect x="6" y="27" width="9" height="15" rx="2.5" fill={C.blueSoft} />
      <rect x="19.5" y="21" width="9" height="21" rx="2.5" fill={C.blueMid} />
      <rect x="33" y="13" width="9" height="29" rx="2.5" fill={C.blue} />
      <path d="M9 19l9.5-7.5L26 16l11-9" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M30.5 6h7.5v7.5" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </>
  ),

  retention: (
    <>
      <path
        d="M24 42S7.5 32.6 7.5 21.8A9.3 9.3 0 0 1 24 15.6a9.3 9.3 0 0 1 16.5 6.2C40.5 32.6 24 42 24 42z"
        fill={C.red}
      />
      <path d="M12 24h6.5l3-5.5 4 11 3.5-5.5H36" stroke={C.white} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="35" cy="12" r="3.5" fill={C.redSoft} />
    </>
  ),

  sent: (
    <>
      <path d="M43 6L5 21.5l13 5.5L43 6z" fill={C.blueMid} />
      <path d="M43 6L18 27v15l7.5-9.5L43 6z" fill={C.blue} />
      <path d="M18 27L43 6l-17.5 26.5L18 27z" fill={C.blueDark} opacity="0.35" />
      <circle cx="8" cy="38" r="3" fill={C.blueSoft} />
    </>
  ),

  clock: (
    <>
      <circle cx="24" cy="25" r="18" fill={C.amberTint} />
      <circle cx="24" cy="25" r="18" stroke={C.amber} strokeWidth="3.5" fill="none" />
      <path d="M24 15v10.5l7 4.5" stroke={C.amberDark} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="19" y="3" width="10" height="4" rx="2" fill={C.amber} />
    </>
  ),

  failed: (
    <>
      <circle cx="24" cy="24" r="19" fill={C.redTint} />
      <circle cx="24" cy="24" r="14" fill={C.red} />
      <path d="M19 19l10 10M29 19L19 29" stroke={C.white} strokeWidth="3.2" strokeLinecap="round" fill="none" />
    </>
  ),

  blocked: (
    <>
      <circle cx="24" cy="24" r="18" fill={C.greyTint} />
      <circle cx="24" cy="24" r="14.5" stroke={C.grey} strokeWidth="4" fill="none" />
      <path d="M14 34L34 14" stroke={C.grey} strokeWidth="4" strokeLinecap="round" fill="none" />
      <circle cx="24" cy="24" r="18" stroke={C.greySoft} strokeWidth="2" fill="none" />
    </>
  ),

  preview: (
    <>
      <path d="M24 11c9.5 0 17 6.5 20 13-3 6.5-10.5 13-20 13S7 30.5 4 24C7 17.5 14.5 11 24 11z" fill={C.blueTint} />
      <path
        d="M24 11c9.5 0 17 6.5 20 13-3 6.5-10.5 13-20 13S7 30.5 4 24C7 17.5 14.5 11 24 11z"
        stroke={C.blue}
        strokeWidth="3"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="24" cy="24" r="7" fill={C.blue} />
      <circle cx="21" cy="21.5" r="2.4" fill={C.white} />
    </>
  ),

  gift: (
    <>
      <path d="M15 8.5a5.5 5.5 0 0 1 9 2.5 5.5 5.5 0 0 1 9-2.5c2.5 2 1.6 5.5-2 6.5H17c-3.6-1-4.5-4.5-2-6.5z" fill={C.amberSoft} />
      <rect x="4" y="14" width="40" height="10" rx="3" fill={C.blueMid} />
      <rect x="7.5" y="24" width="33" height="18" rx="3" fill={C.blue} />
      <rect x="20.5" y="14" width="7" height="28" fill={C.amber} />
    </>
  ),

  card: (
    <>
      <rect x="3" y="10" width="42" height="28" rx="5.5" fill={C.blueMid} />
      <rect x="3" y="16" width="42" height="6" fill={C.blueDark} />
      <rect x="8" y="27" width="10" height="6.5" rx="2" fill={C.amber} />
      <rect x="30" y="29" width="10" height="3" rx="1.5" fill={C.blueTint} />
    </>
  ),

  bolt: (
    <>
      <circle cx="24" cy="24" r="19" fill={C.amberTint} />
      <path d="M27 4L11 27h10l-3 17 19-24H26l4-16z" fill={C.amber} />
      <path d="M27 4L11 27h10l-1 6L27 4z" fill={C.amberSoft} />
    </>
  ),
};

export function KpiIcon({ name, className = 'w-11 h-11' }: { name: KpiIconName; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="presentation" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

export function KpiBarsIcon({
  active,
  inactive,
  className = 'w-11 h-11',
}: {
  active: number;
  inactive: number;
  className?: string;
}) {
  const max = Math.max(active, inactive, 1);
  const BASE = 41;
  const SPAN = 33;
  const h = (v: number) => Math.max((v / max) * SPAN, 3);

  return (
    <svg viewBox="0 0 48 48" className={className} role="img" aria-label={`${active} active, ${inactive} non-active`}>
      <title>{`Active ${active} · Non-active ${inactive}`}</title>
      <rect x="4" y="22" width="40" height="1.5" rx="0.75" fill={C.greyTint} />
      <rect x="4" y={BASE} width="40" height="3" rx="1.5" fill={C.greySoft} />
      <rect x="8" y={BASE - h(active)} width="14" height={h(active)} rx="3.5" fill={C.green} />
      <rect x="8" y={BASE - h(active)} width="14" height={Math.min(h(active), 7)} rx="3.5" fill={C.greenSoft} />
      <rect x="26" y={BASE - h(inactive)} width="14" height={h(inactive)} rx="3.5" fill={C.greyTint} />
      <rect x="26" y={BASE - h(inactive)} width="14" height={Math.min(h(inactive), 7)} rx="3.5" fill={C.greySoft} />
    </svg>
  );
}
