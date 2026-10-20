import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { useT } from '@/i18n'
import { useAccess, useSession } from '@/state/session'
import { useBackend } from '@/state/services'
import { PageHeader } from '@/components/data-display/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LanguageSelect, ThemeToggle } from '@/components/layout/Preferences'
import { Leaderboard } from '../components/Leaderboard'

/** Spec §3.2 — Account & Logout for the Employee interface. */
export default function AccountPage() {
  const t = useT()
  const { session } = useSession()
  const access = useAccess()
  const backend = useBackend()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const logout = async () => {
    await backend.logout()
    qc.clear()
    navigate('/login')
  }
  return (
    <>
      <PageHeader title={t('nav.account')} />
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title={session.user.fullName} description={`${session.user.email} · ${session.business.name}`} />
          <CardBody className="flex flex-col gap-4">
            <p className="text-sm">
              Role: <span className="font-medium capitalize">{session.user.role}</span>
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <LanguageSelect onChange={(l) => void backend.setLanguage(l)} />
              <ThemeToggle />
            </div>
            <div>
              <Button variant="secondary" onClick={logout}>
                <LogOut className="size-4" aria-hidden /> {t('nav.logout')}
              </Button>
            </div>
          </CardBody>
        </Card>
        {access.can('leaderboard.view') && <Leaderboard />}
      </div>
    </>
  )
}
