import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { Ambient } from '@/components/layout/AppShell'
import { LanguageSelect, ThemeToggle } from '@/components/layout/Preferences'
import { DevBanner } from '@/components/feedback/Banners'
import { HighlightTitle } from '@/components/data-display/PageHeader'
import { env } from '@/lib/env'
import { cn } from '@/lib/cn'

/** Public top bar (redesign `.public-top`): brand, language, theme, optional action. */
export function PublicTop({ action }: { action?: ReactNode }) {
  return (
    <header className="public-top gap-3">
      <Link to="/" aria-label="Bonuca home">
        <Logo />
      </Link>
      <div className="flex items-center gap-2">
        <LanguageSelect compact />
        <ThemeToggle />
        {action}
      </div>
    </header>
  )
}

const WIDTH = { md: 'max-w-[520px]', lg: 'max-w-[800px]', xl: 'max-w-[1000px]' } as const

/** Centered auth / onboarding frame from the redesign: ambient canvas, eyebrow, highlighted title, card. */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  wide,
  size,
  eyebrow,
  top,
}: {
  title: string
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  /** Shorthand for `size="lg"`. */
  wide?: boolean
  size?: keyof typeof WIDTH
  eyebrow?: ReactNode
  /** Rendered above the title (e.g. the onboarding stepper). */
  top?: ReactNode
}) {
  const width = WIDTH[size ?? (wide ? 'lg' : 'md')]
  return (
    <>
      <Ambient />
      <div className="public-wrap flex flex-col text-fg">
        <PublicTop />
        <main className="px-4 pt-6 pb-16 sm:px-5">
          <div className={cn('auth-card', width)}>
            {env.dataSource === 'dev' && (
              <div className="mb-5">
                <DevBanner />
              </div>
            )}
            {top}
            <div className="reveal-up mb-[22px]">
              {eyebrow && <div className="eyebrow">{eyebrow}</div>}
              <h1 className="page-title">
                <HighlightTitle title={title} />
              </h1>
              {subtitle && <div className="page-sub">{subtitle}</div>}
            </div>
            <div className="card reveal-up p-5 sm:p-[26px]">{children}</div>
            {footer && <div className="mt-[18px] text-center text-muted">{footer}</div>}
          </div>
        </main>
      </div>
    </>
  )
}

/** Development-only notice (dashed yellow redesign callout). */
export function DevCallout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="callout dev" role="note" data-testid="dev-callout">
      <Zap className="size-[18px] shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <b>{title}</b>
        <div>{children}</div>
      </div>
    </div>
  )
}
