import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Download, Smartphone } from 'lucide-react'
import { useT } from '@/i18n'
import { buttonClass } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { DevBanner } from '@/components/feedback/Banners'
import { Ambient } from '@/components/layout/AppShell'
import { env } from '@/lib/env'
import { PublicTop } from '../components/AuthLayout'
import { DecorPass, LandingTitle } from '../components/AuthSplitLayout'

/** Spec §1.1 — primary actions: Start Free, Log In, Download App; language selectable here. */
export default function LandingPage() {
  const t = useT()
  const [downloadOpen, setDownloadOpen] = useState(false)
  const stores = [
    env.appStoreUrl && { label: 'App Store (iOS)', url: env.appStoreUrl },
    env.playStoreUrl && { label: 'Google Play (Android)', url: env.playStoreUrl },
  ].filter(Boolean) as { label: string; url: string }[]

  return (
    <>
      <Ambient />
      <div className="public-wrap text-fg">
        <PublicTop
          action={
            <Link to="/login" className={buttonClass('ink', 'sm', 'hidden sm:inline-flex')}>
              {t('landing.login')}
            </Link>
          }
        />
        {env.dataSource === 'dev' && (
          <div className="mx-auto max-w-[980px] px-4">
            <DevBanner />
          </div>
        )}
        <main className="hero">
          <div className="hero-badge reveal-up">
            <b>{t('landing.badgeNew')}</b>
            {t('landing.badge')}
          </div>
          <h1 className="reveal-up text-[42px] sm:text-[68px]">
            <span className="[&_.hl]:bg-[linear-gradient(transparent_72%,var(--color-highlight)_72%,var(--color-highlight)_90%,transparent_90%)]">
              <LandingTitle title={t('landing.title')} tag="span" />
            </span>
          </h1>
          <p className="reveal-up">{t('landing.subtitle')}</p>
          <div className="reveal-up mt-[30px] flex flex-col flex-wrap justify-center gap-3 sm:flex-row">
            <Link to="/register" className={buttonClass('primary', 'lg')}>
              {t('landing.startFree')}
              <ArrowRight className="size-[15px]" aria-hidden />
            </Link>
            <Link to="/login" className={buttonClass('secondary', 'lg')}>
              {t('landing.login')}
            </Link>
            <button type="button" onClick={() => setDownloadOpen(true)} className={buttonClass('ink', 'lg')}>
              <Download className="size-[15px]" aria-hidden />
              {t('landing.downloadApp')}
            </button>
          </div>
          {/* Default Bonuca wallet template look (§4.10): navy gradient, independent of theme. */}
          <div className="hero-cards">
            <DecorPass kind="points" name="Coffee Rewards" className="float-pass hidden opacity-95 md:block" style={{ left: '4%', top: 60, width: 270, '--r': '-8deg' } as CSSProperties} />
            <DecorPass kind="stamp" name="Bonuca" className="float-pass" style={{ left: '50%', marginLeft: -175, top: 0, width: 350, zIndex: 2, animationDelay: '-2s' } as CSSProperties} />
            <DecorPass kind="membership" name="VIP Member" bg="#1B1B1F" className="float-pass hidden md:block" style={{ right: '4%', top: 70, width: 270, animationDelay: '-4s', '--r': '8deg' } as CSSProperties} />
          </div>
        </main>
      </div>
      <Dialog open={downloadOpen} onClose={() => setDownloadOpen(false)} title={t('landing.downloadApp')} size="sm" footer={<button type="button" className={buttonClass('secondary')} onClick={() => setDownloadOpen(false)}>{t('common.close')}</button>}>
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
          <div className="empty pt-2.5 pb-1">
            <span className="ill">
              <Smartphone className="size-[22px]" aria-hidden />
            </span>
            <p className="font-semibold text-fg">{t('landing.storesNotConfigured')}</p>
          </div>
        )}
      </Dialog>
    </>
  )
}
