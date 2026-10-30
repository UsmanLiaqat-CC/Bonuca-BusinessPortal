import { ChevronRight } from 'lucide-react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import type { CampaignDraft } from '@/services/backend'
import type { AiCampaignDraft } from '@/services/integrations'
import { WINBACK_ID } from '@/lib/campaigns'
import { PageHeader } from '@/components/data-display/PageHeader'
import { ErrorState, QueryState } from '@/components/feedback/QueryState'
import { WinBackSettings } from '@/features/notifications/components/WinBackSettings'
import { CampaignForm } from '../components/CampaignForm'
import { useCampaigns, usePrograms } from '../hooks'

/** New campaign draft; an AI draft (Campaigns → Draft with AI) pre-fills it for the owner to review. */
function newDraft(kind: string, ai?: AiCampaignDraft): CampaignDraft | null {
  if (kind === 'stamp_acquisition') {
    return { kind, name: ai?.title ?? '', linkedProgramId: '', startingStamps: 0, welcomeGift: { enabled: !!ai?.suggestedOffer, rewardName: ai?.suggestedOffer ?? '', description: ai?.message ?? '', validityDays: null, redemptionConditions: '' } }
  }
  if (kind === 'voucher') {
    return { kind, name: ai?.title ?? '', voucherReward: ai?.suggestedOffer ?? '', validFrom: '', validTo: '', visuals: { logo: null, background: { kind: 'default' }, textColor: '#FFFFFF' } }
  }
  return null
}

export default function CampaignEditorPage() {
  const { id, kind } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const ai = (location.state as { aiDraft?: AiCampaignDraft } | null)?.aiDraft
  const programs = usePrograms()
  const campaigns = useCampaigns()
  const back = (
    <>
      <Link to="/app/campaigns">Campaigns</Link>
      <ChevronRight className="size-[13px]" aria-hidden />
      <span>{id ? 'Edit' : 'New'}</span>
    </>
  )

  // Win-back is the business's win-back campaign (stages, messages, offers).
  if (id === WINBACK_ID || kind === 'winback') {
    return (
      <>
        <PageHeader title="Win-back campaign" breadcrumb={back} description="Brings inactive customers back: each stage sends its message and creates its offer as a reward." />
        <WinBackSettings onSaved={() => navigate(`/app/campaigns/${WINBACK_ID}`)} />
      </>
    )
  }

  return (
    <QueryState query={programs}>
      {(programList) => {
        if (!id) {
          const draft = newDraft(kind ?? '', ai)
          if (!draft) return <ErrorState message="Unknown campaign type." />
          return (
            <>
              <PageHeader title="New campaign" breadcrumb={back} description={ai ? 'Drafted with AI — review every field before saving.' : undefined} />
              <CampaignForm initial={draft} campaignId={null} status={null} programs={programList} onDone={(c) => navigate(`/app/campaigns/${c.id}`)} />
            </>
          )
        }
        return (
          <QueryState query={campaigns}>
            {(list) => {
              const c = list.find((x) => x.id === id)
              if (!c) return <ErrorState message="Campaign not found." />
              if (c.status === 'ended') return <ErrorState message="This campaign has ended and can no longer be edited." />
              const { id: _i, businessId: _b, status, qrToken: _q, createdAt: _c, publishedAt: _p, ...draft } = c
              return (
                <>
                  <PageHeader title={`Edit ${c.name}`} breadcrumb={back} />
                  <CampaignForm initial={draft as CampaignDraft} campaignId={c.id} status={status} programs={programList} onDone={(x) => navigate(`/app/campaigns/${x.id}`)} />
                </>
              )
            }}
          </QueryState>
        )
      }}
    </QueryState>
  )
}
