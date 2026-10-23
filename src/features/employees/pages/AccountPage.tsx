import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { LogOut, UserCircle } from 'lucide-react'
import { useT } from '@/i18n'
import { useAccess, useSession } from '@/state/session'
import { useBackend } from '@/state/services'
import { PageHeader } from '@/components/data-display/PageHeader'
import { Initials } from '@/components/data-display/Table'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
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
      <PageHeader
        title={t('nav.account')}
        breadcrumb={
          <>
            <UserCircle className="size-[13px]" aria-hidden /> {session.business.name}
          </>
        }
      />
      <div className="flex flex-col gap-[18px]">
        <Card className="reveal-up">
          <CardBody className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center gap-4">
              <Initials name={session.user.fullName} className="size-14 text-base" />
              <div className="min-w-0">
                <h2 className="font-display text-xl font-bold tracking-tight">{session.user.fullName}</h2>
                <p className="text-sm text-muted">
                  {session.user.email} · {session.business.name}
                </p>
              </div>
              <Badge tone="neutral" dot={false} className="capitalize sm:ml-auto">
                Role: {session.user.role}
              </Badge>
            </div>
            <div className="divider my-0" />
            <div className="flex flex-wrap items-end gap-4">
              <LanguageSelect onChange={(l) => void backend.setLanguage(l)} />
              <ThemeToggle />
            </div>
            <div>
              <Button variant="secondary" onClick={logout}>
                <LogOut className="size-[15px]" aria-hidden /> {t('nav.logout')}
              </Button>
            </div>
          </CardBody>
        </Card>
        {access.can('leaderboard.view') && <Leaderboard />}
      </div>
    </>
  )
}
