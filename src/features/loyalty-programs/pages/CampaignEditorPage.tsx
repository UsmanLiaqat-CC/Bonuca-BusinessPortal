import { Link, useNavigate, useParams } from 'react-router-dom'
import type { CampaignDraft } from '@/services/backend'
import { PageHeader } from '@/components/data-display/PageHeader'
import { ErrorState, QueryState } from '@/components/feedback/QueryState'
import { CampaignForm } from '../components/CampaignForm'
import { useCampaigns, usePrograms } from '../hooks'

function newDraft(kind: string): CampaignDraft | null {
  if (kind === 'stamp_acquisition') {
    return { kind, name: '', linkedProgramId: '', startingStamps: 0, welcomeGift: { enabled: false, rewardName: '', description: '', validityDays: null, redemptionConditions: '' } }
  }
  if (kind === 'voucher') {
    return { kind, name: '', voucherReward: '', validFrom: '', validTo: '', visuals: { logo: null, background: { kind: 'default' }, textColor: '#FFFFFF' } }
  }
  return null
}

export default function CampaignEditorPage() {
  const { id, kind } = useParams()
  const navigate = useNavigate()
  const programs = usePrograms()
  const campaigns = useCampaigns()
  const back = <Link to="/app/programs" className="hover:underline">Loyalty Programs</Link>

  return (
    <QueryState query={programs}>
      {(programList) => {
        if (!id) {
          const draft = newDraft(kind ?? '')
          if (!draft) return <ErrorState message="Unknown campaign type." />
          return (
            <>
              <PageHeader title="New campaign" breadcrumb={back} />
              <CampaignForm initial={draft} campaignId={null} status={null} programs={programList} onDone={(c) => navigate(`/app/campaigns/${c.id}`)} />
            </>
          )
        }
        return (
          <QueryState query={campaigns}>
            {(list) => {
              const c = list.find((x) => x.id === id)
              if (!c) return <ErrorState message="Campaign not found." />
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
