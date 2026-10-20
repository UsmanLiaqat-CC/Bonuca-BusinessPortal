import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Download } from 'lucide-react'
import { useT } from '@/i18n'
import { Logo } from '@/components/layout/Logo'
import { LanguageSelect, ThemeToggle } from '@/components/layout/Preferences'
import { buttonClass } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { DevBanner } from '@/components/feedback/Banners'
import { env } from '@/lib/env'

/** Spec §1.1 — primary actions: Start Free, Log In, Download App; language selectable here. */
export default function LandingPage() {
  const t = useT()
  const [downloadOpen, setDownloadOpen] = useState(false)
  const stores = [
    env.appStoreUrl && { label: 'App Store (iOS)', url: env.appStoreUrl },
    env.playStoreUrl && { label: 'Google Play (Android)', url: env.playStoreUrl },
  ].filter(Boolean) as { label: string; url: string }[]

  return (
    <div className="flex min-h-screen flex-col bg-canvas text-fg">
      {env.dataSource === 'dev' && <DevBanner />}
      <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2">
          <LanguageSelect compact />
          <ThemeToggle />
          <Link to="/login" className={buttonClass('ghost', 'sm', 'hidden sm:inline-flex')}>
            {t('landing.login')}
          </Link>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">{t('landing.title')}</h1>
        <p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">{t('landing.subtitle')}</p>
        <div className="mt-10 flex w-full max-w-md flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
          <Link to="/register" className={buttonClass('primary', 'lg')}>
            {t('landing.startFree')}
          </Link>
          <Link to="/login" className={buttonClass('secondary', 'lg')}>
            {t('landing.login')}
          </Link>
          <button type="button" onClick={() => setDownloadOpen(true)} className={buttonClass('secondary', 'lg')}>
            <Download className="size-4" aria-hidden />
            {t('landing.downloadApp')}
          </button>
        </div>
        <div className="mt-16 w-full max-w-sm">
          {/* Default Bonuca wallet template look (§4.10): navy gradient, independent of theme. */}
          <div className="aspect-[1.6] rounded-2xl p-5 text-left text-white shadow-card" style={{ background: 'linear-gradient(160deg, #0A112F 0%, #000000 100%)' }} aria-hidden>
            <div className="flex items-center justify-between">
              <Logo compact />
              <span className="text-xs opacity-70">Bonuca</span>
            </div>
            <div className="mt-8 grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }, (_, i) => (
                <span key={i} className={i < 6 ? 'aspect-square rounded-full bg-[#1747F8]' : 'aspect-square rounded-full border border-white/30'} />
              ))}
            </div>
          </div>
        </div>
      </main>
      <Dialog open={downloadOpen} onClose={() => setDownloadOpen(false)} title={t('landing.downloadApp')} size="sm">
        {stores.length ? (
          <ul className="flex flex-col gap-2">
            {stores.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer" className={buttonClass('secondary', 'md', 'w-full')}>
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">{t('landing.storesNotConfigured')}</p>
        )}
      </Dialog>
    </div>
  )
}
