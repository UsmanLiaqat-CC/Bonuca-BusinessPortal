import { Fragment, useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut, Menu } from 'lucide-react'
import { useT } from '@/i18n'
import { useAccess, useSession } from '@/state/session'
import { useBackend } from '@/state/services'
import { env } from '@/lib/env'
import { cn } from '@/lib/cn'
import { DevBanner, OverrideBanner, PreviewBanner, TrialBanner, TrialCard, TrialPill } from '@/components/feedback/Banners'
import { Logo } from './Logo'
import { NAV_ITEMS } from './nav'
import { LanguageSelect, ThemeToggle } from './Preferences'
import { DevToolsPanel } from './DevToolsPanel'

const FONT_STACK = { system: 'inherit', serif: 'Georgia, "Times New Roman", serif', rounded: 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif' } as const
const GROUP_LABEL = { overview: 'nav.group.overview', operations: 'nav.group.operations', engagement: 'nav.group.engagement', business: 'nav.group.business' } as const

/** Soft pink/blue glow canvas behind every page (redesign `.ambient`). */
export function Ambient() {
  return (
    <div className="ambient no-print" aria-hidden>
      <i />
      <i />
      <i />
      <div className="lines" />
    </div>
  )
}

/** Redesign app shell: glass sidebar with grouped nav + trial card, glass top bar, content column. */
export function AppShell() {
  const t = useT()
  const { session } = useSession()
  const access = useAccess()
  const backend = useBackend()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const sidebar = useRef<HTMLElement>(null)

  // Mobile drawer (< 900px): the redesign drives it with `body.nav-open`.
  useEffect(() => {
    document.body.classList.toggle('nav-open', open)
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (!sidebar.current?.contains(target) && !(target as Element).closest?.('[data-menu]')) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.body.classList.remove('nav-open')
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])

  const role = session.user.role
  const items = NAV_ITEMS.filter((i) => access.can(i.permission) && (!i.roles || i.roles.includes(role)))
  const branding = session.business.branding

  const logout = async () => {
    await backend.logout()
    queryClient.clear()
    navigate('/login')
  }

  return (
    <>
      <Ambient />
      <div className="app">
        <aside ref={sidebar} className="sidebar no-print" aria-label="Primary">
          <NavLink to={items[0]?.to ?? '/app'} className="brand" aria-label="Bonuca home">
            <Logo sub={t('app.portal')} />
          </NavLink>
          <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
            <nav aria-label="Main" className="nav">
              {items.map(({ to, labelKey, employeeLabelKey, icon: Icon, group }, i) => {
                const heading = i === 0 || items[i - 1]!.group !== group ? group : null
                return (
                  <Fragment key={to}>
                    {heading && <div className="nav-label">{t(GROUP_LABEL[heading])}</div>}
                    <NavLink to={to} className="nav-link" onClick={() => setOpen(false)}>
                      <Icon className="size-[18px] shrink-0" aria-hidden />
                      {t(role === 'employee' && employeeLabelKey ? employeeLabelKey : labelKey)}
                    </NavLink>
                  </Fragment>
                )
              })}
            </nav>
          </div>
          <div className="side-foot pt-3 empty:hidden">
            <TrialCard />
          </div>
        </aside>

        <div className="main">
          <header className="topbar no-print">
            <button type="button" className="icon-btn menu-btn" data-menu onClick={() => setOpen((o) => !o)} aria-label={t('nav.menu')} aria-expanded={open}>
              <Menu className="size-[18px]" />
            </button>
            {/* Business identity (business branding, kept separate from Bonuca chrome — OI-32). */}
            <div className="biz" style={{ fontFamily: FONT_STACK[branding.font] }}>
              {branding.logo ? (
                <img src={branding.logo} alt="" className="avatar object-cover" />
              ) : (
                <span className="avatar" style={{ background: branding.primaryColor }} aria-hidden>
                  {session.business.name.slice(0, 1).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <b>{session.business.name}</b>
                <small>
                  <span className="truncate">{session.user.fullName}</span>
                  <span className={cn('role-chip capitalize', role === 'owner' && 'owner')}>{role}</span>
                </small>
              </div>
            </div>
            <div className="top-actions">
              <TrialPill />
              <span className="hidden sm:inline-flex">
                <LanguageSelect compact onChange={(l) => void backend.setLanguage(l)} />
              </span>
              <ThemeToggle />
              <button type="button" onClick={logout} className="btn btn-text btn-sm" aria-label={t('nav.logout')}>
                <LogOut className="size-[15px]" aria-hidden />
                <span className="hidden sm:inline">{t('nav.logout')}</span>
              </button>
            </div>
          </header>
          <main id="main" className="content">
            <div className="mb-6 flex flex-col gap-2.5 empty:hidden">
              {env.dataSource === 'dev' && <DevBanner />}
              {access.isPreview && <PreviewBanner />}
              <OverrideBanner />
              <TrialBanner />
            </div>
            <Outlet />
          </main>
        </div>
      </div>
      {env.devTools && <DevToolsPanel />}
    </>
  )
}
