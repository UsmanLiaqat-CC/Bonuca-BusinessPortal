import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/components/layout/Logo'
import { LanguageSelect, ThemeToggle } from '@/components/layout/Preferences'
import { DevBanner } from '@/components/feedback/Banners'
import { env } from '@/lib/env'

export function AuthLayout({ title, subtitle, children, footer, wide }: { title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-fg">
      {env.dataSource === 'dev' && <DevBanner />}
      <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <Link to="/" aria-label="Bonuca home">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSelect compact />
          <ThemeToggle />
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:pt-12">
        <div className={wide ? 'w-full max-w-3xl' : 'w-full max-w-md'}>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <div className="mt-1 text-sm text-muted">{subtitle}</div>}
          <div className="mt-6 rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">{children}</div>
          {footer && <div className="mt-4 text-center text-sm text-muted">{footer}</div>}
        </div>
      </main>
    </div>
  )
}

export function DevCallout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-warning/60 bg-warning-soft px-4 py-3 text-sm" role="note" data-testid="dev-callout">
      <p className="font-semibold">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  )
}
