import { useState, type CSSProperties } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import type { JoinInput, JoinResult } from '@/services/backend'
import { useBackend } from '@/state/services'
import { errorMessage } from '@/lib/errors'
import { buildPassContent } from '@/lib/walletContent'
import { Spinner } from '@/components/ui/Spinner'
import { WalletCard } from '@/features/wallet-cards/components/WalletPassPreview'
import { JoinForm, JoinLanding } from '../components/JoinScreens'

/**
 * Public customer sign-up reached by scanning a program's join QR (no login).
 * Landing (first scan) → "Almost there" form → the customer's new card.
 */
export default function JoinPage() {
  const { token = '' } = useParams()
  const backend = useBackend()
  const page = useQuery({ queryKey: ['join', token], queryFn: () => backend.getJoinPage(token) })
  const join = useMutation({ mutationFn: (input: JoinInput) => backend.joinProgram(token, input) })
  const [step, setStep] = useState<'landing' | 'form'>('landing')
  const [result, setResult] = useState<JoinResult | null>(null)

  let body
  if (page.isPending) body = <div className="grid min-h-[60vh] place-items-center"><Spinner /></div>
  else if (!page.data) {
    body = (
      <div className="join-page items-center justify-center text-center">
        <h2 className="text-xl font-bold">This card is not available</h2>
        <p className="mt-2 text-sm opacity-70">The program may be paused or no longer exists. Ask the staff for a new QR code.</p>
      </div>
    )
  } else if (result) {
    body = (
      <div className="join-page" style={{ '--jbg': result.program.signupPage.backgroundColor, '--jfg': result.program.signupPage.fontColor } as CSSProperties}>
        <h2 className="text-[26px] font-extrabold tracking-tight">You’re in, {result.customer.name.split(' ')[0]}!</h2>
        <p className="mt-1 text-[13px] opacity-75">Customer number {result.customer.customerNumber}</p>
        <div className="mt-5">
          <WalletCard content={buildPassContent(result.program, result.membership, result.businessName)} qrCode={result.membership.passCode} />
        </div>
        <p className="mt-5 rounded-xl border border-black/15 bg-white/70 p-3 text-[12.5px] leading-relaxed" role="note">
          <b>Add to Apple Wallet / Google Wallet:</b> not available yet — the wallet integration is not connected in this environment. Show this card’s QR code at the counter.
        </p>
        <p className="join-foot">Powered by Bonuca</p>
      </div>
    )
  } else if (step === 'landing') {
    body = <JoinLanding program={page.data.program} businessName={page.data.businessName} onStart={() => setStep('form')} />
  } else {
    body = (
      <JoinForm
        program={page.data.program}
        businessName={page.data.businessName}
        pending={join.isPending}
        error={join.error ? errorMessage(join.error) : null}
        onSubmit={(input) => join.mutate(input, { onSuccess: setResult })}
      />
    )
  }

  return (
    <main className="min-h-screen bg-[#e9e6e1]">
      <div className="mx-auto flex min-h-screen max-w-[430px] flex-col">{body}</div>
    </main>
  )
}
