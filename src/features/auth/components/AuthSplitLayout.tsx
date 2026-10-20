import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Check, Coffee, Star } from 'lucide-react'
import { useT } from '@/i18n'
import { Logo } from '@/components/layout/Logo'
import { LanguageSelect, ThemeToggle } from '@/components/layout/Preferences'
import { DevBanner } from '@/components/feedback/Banners'
import { env } from '@/lib/env'

/** Decorative wallet passes in the default Bonuca template look (§4.10) — illustration only. */
function PassMockups() {
  return (
    <div className="relative mx-auto mt-10 h-[24rem] w-full max-w-md" aria-hidden>
      {/* Back card: points pass */}
      <div className="absolute top-0 right-0 w-64 rotate-[5deg] rounded-2xl border border-white/10 bg-gradient-to-br from-[#16204f] to-[#05081a] p-5 shadow-2xl">
        <div className="flex items-center justify-between text-xs text-white/60">
          <span className="font-semibold text-white">Coffee Rewards</span>
          <Star className="size-4 text-[#1747F8]" />
        </div>
        <p className="mt-6 text-[10px] tracking-widest text-white/50 uppercase">Balance</p>
        <p className="text-2xl font-semibold text-white">240 pts</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[82%] rounded-full bg-[#1747F8]" />
        </div>
        <p className="mt-2 text-xs text-white/60">10 pts to Free Dessert</p>
      </div>
      {/* Front card: stamp pass */}
      <div className="absolute top-44 left-0 w-72 -rotate-[4deg] rounded-2xl border border-white/10 bg-gradient-to-br from-[#0A112F] to-black p-5 shadow-2xl ring-1 ring-[#1747F8]/20">
        <div className="flex items-center justify-between">
          <span className="flex size-8 items-center justify-center rounded-lg bg-white/10">
            <Coffee className="size-4 text-white" />
          </span>
          <span className="text-sm font-semibold text-white">Coffee Card</span>
        </div>
        <div className="mt-5 grid grid-cols-5 gap-2">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={i < 7 ? 'flex aspect-square items-center justify-center rounded-full bg-[#1747F8] text-white' : 'aspect-square rounded-full border border-white/25'}>
              {i < 7 && <Check className="size-3" strokeWidth={3} />}
            </span>
          ))}
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <p className="text-[10px] tracking-widest text-white/50 uppercase">Reward</p>
            <p className="text-sm font-medium text-white">1 Free Coffee</p>
          </div>
          <p className="text-xs text-white/60">3 stamps to go</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Two-column auth layout: Bonuca brand panel (always the dark default-template look, independent of
 * the dashboard theme, §4.10) + form column. The brand panel collapses on small screens.
 */
export function AuthSplitLayout({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const t = useT()
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-fg">
      {env.dataSource === 'dev' && <DevBanner />}
      <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Brand panel */}
        <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#0A112F] via-[#050a22] to-black px-12 py-10 text-white lg:flex lg:flex-col">
          <div className="pointer-events-none absolute inset-0 opacity-[0.18] [background-image:radial-gradient(rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden />
          <div className="pointer-events-none absolute -top-32 -right-24 size-[28rem] rounded-full bg-[#1747F8] opacity-30 blur-[120px]" aria-hidden />
          <div className="pointer-events-none absolute -bottom-40 -left-20 size-96 rounded-full bg-[#1747F8] opacity-20 blur-[120px]" aria-hidden />
          <Link to="/" aria-label="Bonuca home" className="relative w-fit">
            <Logo />
          </Link>
          <div className="relative mt-auto mb-auto">
            <h2 className="max-w-md text-4xl leading-tight font-semibold tracking-tight">{t('landing.title')}</h2>
            <p className="mt-4 max-w-md text-base text-white/70">{t('landing.subtitle')}</p>
            <PassMockups />
          </div>
          <p className="relative text-xs text-white/40">© Bonuca</p>
        </aside>

        {/* Form column */}
        <div className="flex flex-col lg:border-l lg:border-line">
          <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
            <Link to="/" aria-label="Bonuca home" className="lg:invisible">
              <Logo />
            </Link>
            <div className="flex items-center gap-2">
              <LanguageSelect compact />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex flex-1 items-center justify-center px-4 pt-4 pb-16 sm:px-8">
            <div className="w-full max-w-[400px]">
              <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
              <div className="mt-8">{children}</div>
              {footer && <div className="mt-8 text-center text-sm text-muted">{footer}</div>}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
