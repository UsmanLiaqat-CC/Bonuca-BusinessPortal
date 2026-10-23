import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Coffee, ShieldCheck } from 'lucide-react'
import { useT } from '@/i18n'
import { Logo } from '@/components/layout/Logo'
import { LanguageSelect, ThemeToggle } from '@/components/layout/Preferences'
import { DevBanner } from '@/components/feedback/Banners'
import { HighlightTitle } from '@/components/data-display/PageHeader'
import { env } from '@/lib/env'

/**
 * Decorative wallet pass in the default Bonuca template look (§4.10) — illustration only, uses the
 * redesign `.pass` styles (sheen sweep, stamps popping in).
 */
export function DecorPass({ kind, name, bg, className, style }: { kind: 'stamp' | 'points' | 'membership'; name: string; bg?: string; className?: string; style?: CSSProperties }) {
  return (
    <div className={className} style={style} aria-hidden>
      <div className="pass" style={bg ? ({ '--bgp': bg } as CSSProperties) : undefined}>
        <div className="pass-top">
          <div className="pass-logo">
            <Coffee className="size-[18px]" />
          </div>
          <div className="pass-name">{name}</div>
        </div>
        {kind === 'stamp' && (
          <>
            <div className="pass-lbl">Reward</div>
            <div className="pass-val">1 Free Coffee</div>
            <div className="stamps">
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} className={i < 7 ? 'stamp on' : 'stamp'} style={{ animationDelay: `${i * 70}ms` }}>
                  <Coffee />
                </span>
              ))}
            </div>
            <div className="pass-lbl">Progress</div>
            <div className="pass-val sm">3 stamps to go</div>
          </>
        )}
        {kind === 'points' && (
          <>
            <div className="pass-lbl">Balance</div>
            <div className="pass-val">240 pts</div>
            <div className="prog">
              <i style={{ '--w': '92%' } as CSSProperties} />
            </div>
            <div className="pass-cols">
              <div>
                <div className="pass-lbl">Next reward</div>
                <div className="pass-val sm">Free Dessert</div>
              </div>
              <div>
                <div className="pass-lbl">Points needed</div>
                <div className="pass-val sm">10</div>
              </div>
            </div>
          </>
        )}
        {kind === 'membership' && (
          <>
            <div className="pass-lbl">Benefit</div>
            <div className="pass-val">10% off every visit</div>
            <div className="pass-lbl">Member since</div>
            <div className="pass-val sm">Jan 15, 2026</div>
          </>
        )}
      </div>
    </div>
  )
}

/** Landing title with the "digital wallet cards" phrase highlighted (falls back to the last word). */
export function LandingTitle({ title, tag: Tag = 'em' }: { title: string; tag?: 'em' | 'span' }) {
  const phrase = 'digital wallet cards'
  const at = title.indexOf(phrase)
  if (at < 0) return <HighlightTitle title={title} />
  return (
    <>
      {title.slice(0, at)}
      <Tag className={Tag === 'span' ? 'hl' : undefined}>{phrase}</Tag>
      {title.slice(at + phrase.length)}
    </>
  )
}

/**
 * Two-column auth layout (redesign `.auth-split`): Bonuca brand art panel (always the dark
 * default-template look, independent of the dashboard theme, §4.10) + form column.
 */
export function AuthSplitLayout({ title, subtitle, children, footer }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const t = useT()
  return (
    <div className="auth-split text-fg">
      <section className="auth-art">
        <div className="dots" aria-hidden />
        <Link to="/" aria-label="Bonuca home" className="relative w-fit text-white">
          <Logo />
        </Link>
        <h2 className="reveal-up mt-[70px] text-[34px] leading-[1.02] font-bold tracking-[-0.045em] text-white sm:text-[48px] [&_em]:bg-[linear-gradient(transparent_70%,rgba(255,212,59,.85)_70%,rgba(255,212,59,.85)_88%,transparent_88%)] [&_em]:not-italic">
          <LandingTitle title={t('landing.title')} />
        </h2>
        <p className="reveal-up relative mt-[18px] max-w-[440px] text-base opacity-70">{t('landing.subtitle')}</p>
        <div className="relative hidden min-h-[330px] flex-1 md:block">
          <DecorPass kind="points" name="Coffee Rewards" bg="linear-gradient(150deg,#1B2560,#0A112F)" className="float-pass" style={{ left: 250, top: 20, width: 260, '--r': '5deg' } as CSSProperties} />
          <DecorPass kind="stamp" name="Coffee Card" className="float-pass" style={{ left: 40, top: 150, width: 290, animationDelay: '-3s', '--r': '-5deg' } as CSSProperties} />
        </div>
        <small className="relative mt-6 opacity-50">© Bonuca</small>
      </section>

      <section className="flex flex-col">
        <div className="flex items-center justify-end gap-2 p-1.5">
          <LanguageSelect compact />
          <ThemeToggle />
        </div>
        <div className="grid flex-1 place-items-center px-1 py-5 sm:p-5">
          <div className="flex w-full max-w-[420px] flex-col gap-[18px]">
            {env.dataSource === 'dev' && <DevBanner />}
            <div className="reveal-up">
              <div className="eyebrow">
                <ShieldCheck className="size-[13px]" aria-hidden /> {t('app.portal')}
              </div>
              <h1 className="page-title">
                <HighlightTitle title={title} />
              </h1>
              {subtitle && <p className="page-sub">{subtitle}</p>}
            </div>
            {children}
            {footer && <div className="text-center text-muted">{footer}</div>}
          </div>
        </div>
      </section>
    </div>
  )
}
