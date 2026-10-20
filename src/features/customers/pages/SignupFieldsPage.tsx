import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { SignupFieldConfig, SignupFieldKey } from '@/types/domain'
import { useSession } from '@/state/session'
import { useToast } from '@/state/toast'
import { errorMessage } from '@/lib/errors'
import { PageHeader } from '@/components/data-display/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { GuardedButton } from '@/components/feedback/GuardedButton'
import { useUpdateSignupFields } from '../hooks'

const LABELS: Record<SignupFieldKey, string> = { name: 'Name', email: 'Email', phone: 'Phone Number', birthday: 'Birthday' }

/** Spec §4.5 — business configures which signup fields are required vs optional. */
export default function SignupFieldsPage() {
  const { session } = useSession()
  const toast = useToast()
  const update = useUpdateSignupFields()
  const [config, setConfig] = useState<SignupFieldConfig>(session.business.signupFields)
  return (
    <>
      <PageHeader title="Customer signup fields" breadcrumb={<Link to="/app/customers" className="hover:underline">Customers</Link>} description="Name is required by default; Email, Phone Number and Birthday are optional by default." />
      <Card>
        <CardBody className="flex flex-col divide-y divide-line">
          {(Object.keys(LABELS) as SignupFieldKey[]).map((key) => (
            <fieldset key={key} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <legend className="float-left text-sm font-medium">{LABELS[key]}</legend>
              <div role="radiogroup" aria-label={`${LABELS[key]} requirement`} className="inline-flex rounded-lg border border-line p-0.5 text-sm">
                {(['required', 'optional'] as const).map((r) => (
                  <button key={r} type="button" role="radio" aria-checked={config[key] === r} onClick={() => setConfig({ ...config, [key]: r })} className={config[key] === r ? 'rounded-md bg-accent px-3 py-1 text-on-accent' : 'rounded-md px-3 py-1 text-muted hover:text-fg'}>
                    {r === 'required' ? 'Required' : 'Optional'}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
          <div className="pt-4">
            <GuardedButton permission="customers.signupFields" loading={update.isPending} onClick={() => update.mutate(config, { onSuccess: () => toast.success('Signup fields saved.'), onError: (e) => toast.error(errorMessage(e)) })}>
              Save
            </GuardedButton>
          </div>
        </CardBody>
      </Card>
    </>
  )
}
