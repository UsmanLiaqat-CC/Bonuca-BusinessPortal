import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Copy, Download, Mail, Printer } from 'lucide-react'
import { useToast } from '@/state/toast'
import { useSession } from '@/state/session'
import { errorMessage } from '@/lib/errors'
import { env, joinUrl } from '@/lib/env'
import { downloadQrPdf, downloadQrPng } from '@/lib/qrExport'
import { useQrDataUrl } from '@/hooks/useQrDataUrl'
import { IntegrationNotConnectedError } from '@/services/integrations'
import { Card, CardBody } from '@/components/ui/Card'
import { Button, buttonClass } from '@/components/ui/Button'
import { ErrorState, QueryState } from '@/components/feedback/QueryState'
import { usePrograms } from '../hooks'

/** Shown right after a program is published: "your program is live" with its join QR (doc image 2). */
export default function ProgramLivePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { session } = useSession()
  const programs = usePrograms()
  const program = programs.data?.find((p) => p.id === id)
  const link = program?.joinQrToken ? joinUrl('program', program.joinQrToken) : null
  const qr = useQrDataUrl(link, 480)
  const slug = (program?.name ?? 'program').toLowerCase().replace(/\W+/g, '-')
  const run = (fn: () => Promise<void>) => fn().catch((e: unknown) => toast.error(errorMessage(e)))

  return (
    <QueryState query={programs}>
      {() => {
        if (!program) return <ErrorState message="Program not found." />
        if (!link) return <ErrorState message="This program has not been published yet." />
        return (
          <div className="mx-auto flex max-w-[640px] flex-col items-center gap-5 py-4 text-center">
            <span className="success-burst" aria-hidden>
              <CheckCircle2 className="size-6" />
            </span>
            <div>
              <h1 className="font-display text-[28px] font-bold tracking-tight">{program.name} is live</h1>
              <p className="mt-1 text-muted">Print the QR code and place it where customers can scan it.</p>
            </div>
            <Card className="w-full">
              <CardBody className="flex flex-col items-center gap-4">
                <div className="w-full rounded-xl border border-line bg-white p-6">
                  {qr && <img src={qr} alt={`Join QR code for ${program.name}`} className="mx-auto w-full max-w-[300px]" />}
                </div>
                <p className="text-sm text-muted">Customers can scan this QR code to join your loyalty program.</p>
                <a href={link} target="_blank" rel="noreferrer" className="font-semibold break-all underline">
                  {link}
                </a>
                {!env.joinBaseUrl && <p className="dev-url">Development URL — opens this portal’s customer sign-up page.</p>}
                <div className="flex flex-wrap justify-center gap-2">
                  <Button onClick={() => run(() => downloadQrPng(link, `join-${slug}`))}>
                    <Download className="size-[15px]" aria-hidden /> Download
                  </Button>
                  <Button variant="secondary" onClick={() => run(() => downloadQrPdf(link, `join-${slug}`, 'counter', program.name, 'Scan to join our loyalty program'))}>
                    <Printer className="size-[15px]" aria-hidden /> Print
                  </Button>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() =>
                      void navigator.clipboard
                        ?.writeText(link)
                        .then(() => toast.success('Sign-up link copied.'))
                        .catch(() => toast.error('Could not copy the link.'))
                    }
                  >
                    <Copy className="size-[15px]" aria-hidden /> Copy signup link
                  </Button>
                  {/* Email delivery is not connected: say so instead of pretending it was sent. */}
                  <Button variant="secondary" onClick={() => toast.error(new IntegrationNotConnectedError('email').message)} title={`Would send to ${session.user.email}`}>
                    <Mail className="size-[15px]" aria-hidden /> Send QR + link to me
                  </Button>
                </div>
              </CardBody>
            </Card>
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={() => navigate('/app/programs')}>Done</Button>
              <Link to={`/app/programs/${program.id}`} className={buttonClass('ghost')}>
                View program
              </Link>
            </div>
          </div>
        )
      }}
    </QueryState>
  )
}
