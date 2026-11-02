import { useState, type CSSProperties, type FormEvent } from 'react'
import { ShoppingBag } from 'lucide-react'
import type { Program } from '@/types/domain'
import type { JoinInput } from '@/services/backend'

function earnLine(program: Program): { title: string; body: string; icon: string } {
  switch (program.type) {
    case 'stamp':
      return { title: `Earn ${program.config.stampsRequired} stamps`, body: program.config.rewardDescription ? `Redeem for ${program.config.rewardDescription}` : 'Redeem for a reward', icon: '☕' }
    case 'points':
      return { title: `Earn ${program.config.ratio.points} points per ${program.config.ratio.spend} spent`, body: 'Redeem points for rewards', icon: '⭐' }
    case 'tier':
      return { title: 'Unlock tiers as you visit', body: program.config.tiers.map((t) => t.name).join(' → ') || 'More perks every level', icon: '🏅' }
    case 'membership':
      return { title: program.config.benefitDescription || 'Customer benefit', body: 'Show your card at every visit', icon: '🎟️' }
  }
}

const pageStyle = (program: Pick<Program, 'signupPage'>) => ({ '--jbg': program.signupPage.backgroundColor, '--jfg': program.signupPage.fontColor }) as CSSProperties

/** Screen shown after a customer scans a program's join QR for the first time (doc image 6). */
export function JoinLanding({ program, businessName, onStart }: { program: Program; businessName: string; onStart?: () => void }) {
  const earn = earnLine(program)
  const page = program.signupPage
  const hero = page.heroImage ?? program.visuals.heroImage
  const dots = program.type === 'stamp' ? Math.min(Math.max(program.config.stampsRequired, 1), 10) : 0
  const steps = ['Join below — takes about ten seconds', 'Add your card to your phone’s wallet', `${program.type === 'stamp' ? 'Earn stamps' : program.type === 'points' ? 'Earn points' : 'Collect visits'} each visit`]
  return (
    <div className="join-page" style={pageStyle(program)}>
      <div className="join-hero" style={hero ? { backgroundImage: `url("${hero}")` } : undefined}>
        <i className="jh-orb jh-orb-a" aria-hidden />
        <i className="jh-orb jh-orb-b" aria-hidden />
        <div>
          <span className="jh-logo">{page.logo ? <img src={page.logo} alt="" /> : <ShoppingBag className="size-4" aria-hidden />}</span>
          <h2>{page.headline?.trim() || businessName}</h2>
          <p>{page.tagline?.trim() || program.name}</p>
          {dots > 0 && (
            <span className="jh-dots" aria-hidden style={{ '--n': dots } as CSSProperties}>
              {Array.from({ length: dots }, (_, i) => <b key={i} style={{ '--i': i } as CSSProperties} />)}
            </span>
          )}
        </div>
      </div>
      <div className="join-earn">
        <span className="ji" aria-hidden>{earn.icon}</span>
        <span>
          <b>{earn.title}</b>
          <span>{earn.body}</span>
        </span>
      </div>
      <div className="join-how">
        <h3>How it works</h3>
        <ol>
          {steps.map((text, i) => <li key={text} style={{ '--i': i } as CSSProperties}><i>{i + 1}</i> {text}</li>)}
        </ol>
      </div>
      <div className="join-cta">
        <button type="button" className="join-btn" onClick={onStart}><span>Get my card</span></button>
        <small>No app to download</small>
      </div>
      <p className="join-foot">Scan to join — powered by Bonuca</p>
    </div>
  )
}

/** "Almost there" sign-up form (doc image 4). Name is always required; Email/Birthday per program setup. */
export function JoinForm({ program, businessName, onSubmit, pending, error }: { program: Pick<Program, 'signupPage'>; businessName: string; onSubmit?: (input: JoinInput) => void; pending?: boolean; error?: string | null }) {
  const [v, setV] = useState<JoinInput>({ name: '', email: '', phone: '', birthday: '', acceptTerms: false })
  const f = program.signupPage.fields
  const tag = (mode: 'required' | 'optional') => <em className={mode === 'required' ? 'req' : undefined}>{mode === 'required' ? 'Required' : 'Optional'}</em>
  const submit = (e: FormEvent) => {
    e.preventDefault()
    onSubmit?.(v)
  }
  return (
    <form className="join-page join-form" style={pageStyle(program)} onSubmit={submit} noValidate>
      <h2>Almost there</h2>
      <p>Tell us who you are so we can save your rewards.</p>
      <div className="join-field">
        <label className="jl" htmlFor="join-name">Name {tag('required')}</label>
        <input id="join-name" autoComplete="name" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="Your name" required />
      </div>
      {f.email !== 'off' && (
        <div className="join-field">
          <label className="jl" htmlFor="join-email">Email {tag(f.email)}</label>
          <input id="join-email" type="email" autoComplete="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} placeholder="you@email.com" />
        </div>
      )}
      {f.phone && f.phone !== 'off' && (
        <div className="join-field">
          <label className="jl" htmlFor="join-phone">Phone number {tag(f.phone)}</label>
          <input id="join-phone" type="tel" autoComplete="tel" value={v.phone ?? ''} onChange={(e) => setV({ ...v, phone: e.target.value })} placeholder="+49 170 1234567" />
        </div>
      )}
      {f.birthday !== 'off' && (
        <div className="join-field">
          <label className="jl" htmlFor="join-birthday">Birthday {tag(f.birthday)}</label>
          <input id="join-birthday" type="date" value={v.birthday} onChange={(e) => setV({ ...v, birthday: e.target.value })} aria-describedby="join-bday-hint" />
          <span id="join-bday-hint" className="sr-only">Get a birthday reward</span>
        </div>
      )}
      <label className="join-check">
        <input type="checkbox" checked={v.acceptTerms} onChange={(e) => setV({ ...v, acceptTerms: e.target.checked })} />
        I agree to {businessName}’s rewards terms
      </label>
      {error && <p className="mt-3 rounded-lg bg-[#fde3e1] px-3 py-2 text-[12.5px] text-[#a32118]" role="alert">{error}</p>}
      <div className="join-cta">
        <button type="submit" className="join-btn" disabled={pending}>{pending ? 'Joining…' : 'Join now'}</button>
      </div>
      <p className="join-foot">Powered by Bonuca</p>
    </form>
  )
}

/** Sign-up page preview inside the program setup (static: no submissions). */
export function JoinPreview({ program, businessName }: { program: Program; businessName: string }) {
  const [step, setStep] = useState<'landing' | 'form'>('landing')
  return step === 'landing' ? <JoinLanding program={program} businessName={businessName} onStart={() => setStep('form')} /> : <JoinForm program={program} businessName={businessName} onSubmit={() => setStep('landing')} />
}
