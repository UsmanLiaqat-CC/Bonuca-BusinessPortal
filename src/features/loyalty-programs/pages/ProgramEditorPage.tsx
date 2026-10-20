import { Link, useNavigate, useParams } from 'react-router-dom'
import { PROGRAM_TYPES, type ProgramType } from '@/types/domain'
import { useT } from '@/i18n'
import { useSession } from '@/state/session'
import { defaultProgramDraft, suggestedCurrency, toDraft } from '@/lib/factories'
import { PageHeader } from '@/components/data-display/PageHeader'
import { QueryState, ErrorState } from '@/components/feedback/QueryState'
import { ProgramForm } from '../components/ProgramForm'
import { usePrograms } from '../hooks'

export default function ProgramEditorPage() {
  const t = useT()
  const navigate = useNavigate()
  const { session } = useSession()
  const { id, type } = useParams()
  const programs = usePrograms()
  const back = <Link to="/app/programs" className="hover:underline">{t('nav.programs')}</Link>

  if (!id) {
    if (!PROGRAM_TYPES.includes(type as ProgramType)) return <ErrorState message="Unknown program type." />
    const draft = defaultProgramDraft(type as ProgramType, suggestedCurrency(session.business.country))
    return (
      <>
        <PageHeader title={`New ${t(`type.${type as ProgramType}`)}`} breadcrumb={back} />
        <ProgramForm key={`new-${type}`} initial={draft} programId={null} status={null} onDone={(p) => navigate(`/app/programs/${p.id}`)} />
      </>
    )
  }

  return (
    <QueryState query={programs}>
      {(list) => {
        const program = list.find((p) => p.id === id)
        if (!program) return <ErrorState message="Program not found." />
        if (program.status === 'archived') return <ErrorState message="Archived programs cannot be edited." />
        return (
          <>
            <PageHeader title={`Edit ${program.name}`} breadcrumb={back} />
            <ProgramForm key={`${program.id}-${program.updatedAt}`} initial={toDraft(program)} programId={program.id} status={program.status} onDone={(p) => navigate(`/app/programs/${p.id}`)} />
          </>
        )
      }}
    </QueryState>
  )
}
