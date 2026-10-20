import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut, Menu, X } from 'lucide-react'
import { useT } from '@/i18n'
import { useAccess, useSession } from '@/state/session'
import { useBackend } from '@/state/services'
import { env } from '@/lib/env'
import { cn } from '@/lib/cn'
import { DevBanner, OverrideBanner, PreviewBanner, TrialBanner } from '@/components/feedback/Banners'
import { Logo } from './Logo'
import { NAV_ITEMS } from './nav'
import { LanguageSelect, ThemeToggle } from './Preferences'
import { DevToolsPanel } from './DevToolsPanel'

const FONT_STACK = { system: 'inherit', serif: 'Georgia, "Times New Roman", serif', rounded: 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif' } as const

export function AppShell() {
  const t = useT()
  const { session } = useSession()
  const access = useAccess()
  const backend = useBackend()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])
  const role = session.user.role
  const items = NAV_ITEMS.filter((i) => access.can(i.permission) && (!i.roles || i.roles.includes(role)))
  const branding = session.business.branding

  const logout = async () => {
    await backend.logout()
    queryClient.clear()
    navigate('/login')
  }

  const nav = (
    <nav aria-label="Main" className="flex flex-col gap-0.5 px-3">
      {items.map(({ to, labelKey, employeeLabelKey, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg border-l-2 px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'border-accent bg-accent-soft text-accent' : 'border-transparent text-fg/80 hover:bg-surface-2 hover:text-fg',
            )
          }
        >
          <Icon className="size-4 shrink-0" aria-hidden />
          {t(role === 'employee' && employeeLabelKey ? employeeLabelKey : labelKey)}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-fg">
      {env.dataSource === 'dev' && <DevBanner />}
      {access.isPreview && <PreviewBanner />}
      <OverrideBanner />
      <TrialBanner />
      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="no-print sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-line bg-surface py-5 lg:flex">
          <div className="px-6">
            <Logo />
            <p className="mt-1 text-xs text-muted">{t('app.portal')}</p>
          </div>
          <div className="flex-1 overflow-y-auto">{nav}</div>
        </aside>

        {/* Mobile drawer */}
        {open && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
            <aside role="dialog" aria-modal="true" aria-label="Navigation" className="relative flex h-full w-72 flex-col gap-6 overflow-y-auto bg-surface py-5">
              <div className="flex items-center justify-between px-6">
                <Logo />
                <button type="button" autoFocus onClick={() => setOpen(false)} aria-label={t('common.close')} className="rounded p-1 hover:bg-surface-2">
                  <X className="size-5" />
                </button>
              </div>
              {nav}
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-canvas/90 px-4 backdrop-blur sm:px-6">
            <button type="button" className="rounded-lg p-2 hover:bg-surface-2 lg:hidden" onClick={() => setOpen(true)} aria-label={t('nav.menu')}>
              <Menu className="size-5" />
            </button>
            {/* Business identity (business branding, kept separate from Bonuca chrome — OI-32). */}
            <div className="flex min-w-0 items-center gap-2" style={{ fontFamily: FONT_STACK[branding.font] }}>
              {branding.logo ? (
                <img src={branding.logo} alt="" className="size-8 rounded-md object-cover" />
              ) : (
                <span className="flex size-8 items-center justify-center rounded-md text-sm font-semibold text-white" style={{ background: branding.primaryColor }} aria-hidden>
                  {session.business.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{session.business.name}</p>
                <p className="truncate text-xs text-muted">
                  {session.user.fullName} · <span className="capitalize">{role}</span>
                </p>
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden sm:block">
                <LanguageSelect compact onChange={(l) => void backend.setLanguage(l)} />
              </div>
              <ThemeToggle />
              <button type="button" onClick={logout} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-muted hover:bg-surface-2 hover:text-fg">
                <LogOut className="size-4" aria-hidden />
                <span className="hidden sm:inline">{t('nav.logout')}</span>
              </button>
            </div>
          </header>
          <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
      {env.devTools && <DevToolsPanel />}
    </div>
  )
}
