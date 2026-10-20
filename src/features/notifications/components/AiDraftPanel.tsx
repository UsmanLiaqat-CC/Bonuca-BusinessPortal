import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useServices } from '@/state/services'
import { errorMessage } from '@/lib/errors'
import { IntegrationNotConnectedError } from '@/services/integrations'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Field, Textarea } from '@/components/ui/Field'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { IntegrationNotice } from '@/components/feedback/Banners'
import type { NotificationValues } from '@/schemas/notification'

/**
 * AI Campaigns (prompt → message + suggested offer) and AI Bonus Generator (goal → offer terms,
 * notification copy, duration). Output opens in the composer as a DRAFT for review (spec §4.7).
 */
export function AiDraftPanel({ kind, onDraft }: { kind: 'campaign' | 'bonus'; onDraft: (draft: Partial<NotificationValues>) => void }) {
  const { integrations } = useServices()
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<{ message: string; notConnected: boolean } | null>(null)
  const isCampaign = kind === 'campaign'

  const generate = async () => {
    if (!input.trim()) return setError({ message: isCampaign ? 'Type a prompt first.' : 'State a goal first.', notConnected: false })
    setBusy(true)
    setError(null)
    try {
      if (isCampaign) {
        const d = await integrations.ai.draftCampaign(input.trim())
        onDraft({ origin: 'ai_campaign', type: 'other', title: d.title, message: d.message, offer: d.suggestedOffer })
      } else {
        const d = await integrations.ai.draftBonus(input.trim())
        onDraft({ origin: 'ai_bonus', type: 'limited_offer', title: d.title, message: d.notificationCopy, offer: d.offerTerms, duration: d.duration })
      }
    } catch (e) {
      setError({ message: errorMessage(e), notConnected: e instanceof IntegrationNotConnectedError })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title={isCampaign ? 'AI Campaigns' : 'AI Bonus Generator'}
        description={isCampaign ? 'Type a plain prompt and the AI drafts a ready-to-send campaign — message and suggested offer.' : 'State a goal and the AI generates offer terms, notification copy and duration for you to review and edit.'}
      />
      <CardBody className="flex flex-col gap-3">
        <Field label={isCampaign ? 'Prompt' : 'Goal'}>
          {(p) => <Textarea {...p} rows={2} value={input} onChange={(e) => setInput(e.target.value)} placeholder={isCampaign ? 'e.g. it’s raining today' : 'e.g. more lunch customers'} />}
        </Field>
        <div>
          <GuardedButton permission="notifications.ai" onClick={generate} loading={busy}>
            <Sparkles className="size-4" aria-hidden /> Generate draft
          </GuardedButton>
        </div>
        {error &&
          (error.notConnected ? (
            <IntegrationNotice title="AI service not connected">{error.message} No draft was generated — nothing is simulated.</IntegrationNotice>
          ) : (
            <p className="text-sm text-danger" role="alert">{error.message}</p>
          ))}
      </CardBody>
    </Card>
  )
}
