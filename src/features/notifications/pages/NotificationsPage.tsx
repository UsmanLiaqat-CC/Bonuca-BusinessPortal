import { useState } from 'react'
import { Bell, Lock, Plus, Send, Sparkles } from 'lucide-react'
import type { NotificationCampaign } from '@/types/domain'
import type { NotificationValues } from '@/schemas/notification'
import { useT } from '@/i18n'
import { useAccess } from '@/state/session'
import { useToast } from '@/state/toast'
import { errorMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/dates'
import { PageHeader } from '@/components/data-display/PageHeader'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { ConfirmDialog } from '@/components/ui/Dialog'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { EmptyState, QueryState } from '@/components/feedback/QueryState'
import { IntegrationNotice } from '@/components/feedback/Banners'
import { usePrograms } from '@/features/loyalty-programs/hooks'
import { CampaignComposer } from '../components/CampaignComposer'
import { AiDraftPanel } from '../components/AiDraftPanel'
import { CAMPAIGN_TYPE_LABELS } from '../labels'
import { useNotifications, useSendNotification } from '../hooks'

// Win-back automation moved to the Campaigns tab; Notifications keeps manual push messages.
type Tab = 'campaigns' | 'ai'

function audienceLabel(n: NotificationCampaign, programs: { id: string; name: string }[]): string {
  const a = n.audience
  if (a?.kind === 'customers') return `${a.customerIds?.length ?? 0} selected customers`
  if (a?.kind === 'inactive') return `Customers inactive for ${a.inactiveDays ?? 30}+ days`
  if (a?.kind === 'programs' || n.programIds.length) return n.programIds.map((id) => programs.find((p) => p.id === id)?.name ?? '—').join(', ') || 'Selected programs'
  return 'All customers'
}

export default function NotificationsPage() {
  const t = useT()
  const toast = useToast()
  const access = useAccess()
  const notifications = useNotifications()
  const programs = usePrograms()
  const send = useSendNotification()
  const [tab, setTab] = useState<Tab>('campaigns')
  const [composer, setComposer] = useState<{ editing: NotificationCampaign | null; initial?: Partial<NotificationValues> } | null>(null)
  const [confirmSend, setConfirmSend] = useState<NotificationCampaign | null>(null)

  return (
    <>
      <PageHeader
        title={t('nav.notifications')}
        breadcrumb={
          <>
            <Bell className="size-[13px]" aria-hidden /> {t('nav.group.engagement')}
          </>
        }
        description="Push messages to your customers’ wallet passes."
        actions={
          tab === 'campaigns' && (
            <GuardedButton permission="notifications.manage" onClick={() => setComposer({ editing: null })}>
              <Plus className="size-[15px]" aria-hidden /> New notification
            </GuardedButton>
          )
        }
      />
      <div>
        <Tabs
          label="Notification sections"
          value={tab}
          onChange={setTab}
          items={[
            { value: 'campaigns', label: 'Messages' },
            { value: 'ai', label: 'AI tools' },
          ]}
        />
      </div>
      {tab === 'campaigns' && (
        <div className="flex flex-col gap-[18px]">
          <IntegrationNotice title="Wallet push delivery not connected">Notifications can be drafted and reviewed. Sending requires the push notification service, which is not available in this environment — notifications stay drafts until delivery is confirmed.</IntegrationNotice>
          <Card className="reveal-up overflow-hidden">
            <QueryState query={notifications}>
              {(list) =>
                list.length === 0 ? (
                  <div className="p-5">
                    <EmptyState icon={<Bell className="size-6" />} title="No notifications yet" body="Happy Hour, New Item, Double Stamps, Birthday Reward, Holiday Campaign, Limited Offers and similar wallet push notifications." />
                  </div>
                ) : (
                  <ul>
                    {list.map((n) => (
                      <li key={n.id} className="list-row flex-wrap py-4">
                        <span className={n.origin === 'manual' ? 'feed-ic bg-accent-soft text-accent' : 'feed-ic bg-[color-mix(in_srgb,var(--color-lilac)_14%,transparent)] text-[var(--color-lilac)]'} aria-hidden>
                          {n.origin === 'manual' ? <Bell className="size-4" /> : <Sparkles className="size-4" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2 font-semibold">
                            {n.title}
                            <Badge tone="outline">{CAMPAIGN_TYPE_LABELS[n.type]}</Badge>
                            {n.origin !== 'manual' && <Badge tone="accent">{n.origin === 'ai_bonus' ? 'AI bonus' : 'AI campaign'}</Badge>}
                            <Badge tone={n.status === 'sent' ? 'success' : 'neutral'} dot>{n.status === 'sent' ? 'Sent' : 'Draft'}</Badge>
                          </p>
                          <p className="mt-0.5 truncate text-sm text-muted">{n.message}</p>
                          <p className="mt-0.5 text-xs text-faint">To: {audienceLabel(n, programs.data ?? [])}</p>
                          <p className="mt-0.5 text-xs text-faint">{n.status === 'sent' ? `Sent ${formatDateTime(n.sentAt)}` : `Updated ${formatDateTime(n.updatedAt)}`}</p>
                        </div>
                        {n.status === 'draft' && (
                          <div className="flex gap-2">
                            <GuardedButton permission={n.origin === 'manual' ? 'notifications.manage' : 'notifications.ai'} size="sm" variant="secondary" onClick={() => setComposer({ editing: n })}>
                              Edit
                            </GuardedButton>
                            <GuardedButton permission="notifications.manage" size="sm" onClick={() => setConfirmSend(n)}>
                              <Send className="size-3.5" aria-hidden /> Send
                            </GuardedButton>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )
              }
            </QueryState>
          </Card>
        </div>
      )}
      {tab === 'ai' && (
        <div className="grid gap-[18px] lg:grid-cols-2">
          {access.role !== 'owner' && (
            <p className="lock-overlay lg:col-span-2">
              <Lock className="size-4 shrink-0" aria-hidden /> AI Campaigns and the AI Bonus Generator are available to the business Owner.
            </p>
          )}
          <AiDraftPanel kind="campaign" onDraft={(initial) => setComposer({ editing: null, initial })} />
          <AiDraftPanel kind="bonus" onDraft={(initial) => setComposer({ editing: null, initial })} />
        </div>
      )}
      <CampaignComposer open={!!composer} onClose={() => setComposer(null)} editing={composer?.editing ?? null} initial={composer?.initial} programs={programs.data ?? []} />
      <ConfirmDialog
        open={!!confirmSend}
        onClose={() => setConfirmSend(null)}
        title="Send this notification?"
        confirmLabel="Send"
        loading={send.isPending}
        body={`"${confirmSend?.title}" will be pushed to the selected customers' wallet passes.`}
        onConfirm={() => {
          const n = confirmSend
          setConfirmSend(null)
          if (n) send.mutate(n.id, { onSuccess: () => toast.success('Notification sent.'), onError: (e) => toast.error(errorMessage(e)) })
        }}
      />
    </>
  )
}
