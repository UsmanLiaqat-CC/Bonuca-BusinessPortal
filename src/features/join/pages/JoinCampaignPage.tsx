import { useState, type CSSProperties } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Ticket } from 'lucide-react'
import type { CampaignClaimResult, JoinInput } from '@/services/backend'
import { useBackend } from '@/state/services'
import { errorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/dates'
import { defaultSignupPage } from '@/lib/factories'
import { buildPassContent, buildVoucherPassContent } from '@/lib/walletContent'
import { Spinner } from '@/components/ui/Spinner'
import { WalletCard } from '@/features/wallet-cards/components/WalletPassPreview'
import { JoinForm } from '../components/JoinScreens'

/**
 * Public page reached by scanning a campaign QR (Campaigns tab, "Claiming a QR campaign"): one claim per
 * customer; a second scan gives nothing new. Paused campaigns take no new claims; ended ones say so.
 */
export default function JoinCampaignPage() {
  const { token = '' } = useParams()
  const backend = useBackend()
  const page = useQuery({ queryKey: ['join-campaign', token], queryFn: () => backend.getCampaignJoin(token) })
  const claim = useMutation({ mutationFn: (input: JoinInput) => backend.claimCampaign(token, input) })
  const [step, setStep] = useState<'landing' | 'form'>('landing')
  const [result, setResult] = useState<CampaignClaimResult | null>(null)
  const d = page.data
  const signup = d?.program?.signupPage ?? defaultSignupPage(d?.branding)
  const style = { '--jbg': signup.backgroundColor, '--jfg': signup.fontColor } as CSSProperties

  let body
  if (page.isPending) body = <div className="grid min-h-[60vh] place-items-center"><Spinner /></div>
  else if (!d) {
    body = (
      <div className="join-page items-center justify-center text-center" style={style}>
        <h2 className="text-xl font-bold">This campaign is not available</h2>
      </div>
    )
  } else if (d.state !== 'open' && !result) {
    body = (
      <div className="join-page items-center justify-center text-center" style={style}>
        <Ticket className="mb-3 size-8 opacity-60" aria-hidden />
        <h2 className="text-2xl font-extrabold">{d.state === 'ended' ? 'This campaign has ended.' : 'This campaign is paused.'}</h2>
        <p className="mt-2 text-sm opacity-70">{d.state === 'ended' ? `Thank you for your interest in ${d.businessName}.` : 'New claims are not possible right now. Please try again later.'}</p>
        <p className="join-foot mt-8">Powered by Bonuca</p>
      </div>
    )
  } else if (result) {
    const content = result.membership && result.program ? buildPassContent(result.program, result.membership, result.businessName) : result.campaign.kind === 'voucher' ? buildVoucherPassContent(result.campaign, result.reward) : null
    body = (
      <div className="join-page" style={style}>
        <h2 className="text-[26px] font-extrabold tracking-tight">You’re in, {result.customer.name.split(' ')[0]}!</h2>
        <p className="mt-1 text-[13px] opacity-75">
          {result.campaign.kind === 'voucher' ? `Your voucher: ${result.campaign.voucherReward}` : `${result.campaign.startingStamps} starting stamps on your ${result.program?.name ?? 'stamp card'}`}
          {result.reward && result.campaign.kind === 'stamp_acquisition' ? ` + ${result.reward.name}` : ''}
        </p>
        {content && (
          <div className="mt-5">
            <WalletCard content={content} qrCode={result.membership?.passCode ?? result.reward?.passCode ?? 'BNC'} />
          </div>
        )}
        <p className="mt-5 rounded-xl border border-black/15 bg-white/70 p-3 text-[12.5px] leading-relaxed" role="note">
          <b>Add to Apple Wallet / Google Wallet:</b> not available yet — the wallet integration is not connected in this environment. Show this QR code at the counter.
        </p>
        <p className="join-foot">Powered by Bonuca</p>
      </div>
    )
  } else if (step === 'landing') {
    const c = d.campaign
    body = (
      <div className="join-page" style={style}>
        <div className="join-hero" style={signup.heroImage ? { backgroundImage: `url("${signup.heroImage}")` } : undefined}>
          <div>
            <h2>{d.businessName}</h2>
            <p>{c.name}</p>
          </div>
        </div>
        <div className="join-earn">
          <span className="ji" aria-hidden>🎁</span>
          <span>
            <b>{c.kind === 'voucher' ? c.voucherReward : `${c.startingStamps} free stamps to start`}</b>
            <span>
              {c.kind === 'voucher'
                ? `Valid ${formatDate(c.validFrom || null)} – ${formatDate(c.validTo || null)}`
                : c.welcomeGift.enabled
                  ? `Plus ${c.welcomeGift.rewardName} on your first visit`
                  : `On your ${d.program?.name ?? 'stamp card'}`}
            </span>
          </span>
        </div>
        <div className="join-cta">
          <button type="button" className="join-btn" onClick={() => setStep('form')}>Claim my {c.kind === 'voucher' ? 'voucher' : 'card'}</button>
          <small>One per customer · No app to download</small>
        </div>
        <p className="join-foot">Powered by Bonuca</p>
      </div>
    )
  } else {
    body = <JoinForm program={{ signupPage: signup }} businessName={d.businessName} pending={claim.isPending} error={claim.error ? errorMessage(claim.error) : null} onSubmit={(input) => claim.mutate(input, { onSuccess: setResult })} />
  }

  return (
    <main className="min-h-screen bg-[#e9e6e1]">
      <div className="mx-auto flex min-h-screen max-w-[430px] flex-col">{body}</div>
    </main>
  )
}
