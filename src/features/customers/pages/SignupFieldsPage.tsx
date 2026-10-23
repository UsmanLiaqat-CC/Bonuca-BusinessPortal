import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { SignupFieldConfig, SignupFieldKey } from '@/types/domain'
import { useSession } from '@/state/session'
import { useToast } from '@/state/toast'
import { errorMessage } from '@/lib/errors'
import { PageHeader } from '@/components/data-display/PageHeader'
import { Card, CardFooter, CardHeader } from '@/components/ui/Card'
import { Segmented } from '@/components/ui/Tabs'
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
      <PageHeader
        title="Customer signup fields"
        breadcrumb={
          <>
            <Link to="/app/customers">Customers</Link>
            <ChevronRight className="size-[13px]" aria-hidden />
            <span>Signup fields</span>
          </>
        }
        description="Name is required by default; Email, Phone Number and Birthday are optional by default."
      />
      <Card className="reveal-up max-w-3xl overflow-hidden">
        <CardHeader title="Fields customers fill in when they join" />
        <div>
          {(Object.keys(LABELS) as SignupFieldKey[]).map((key) => (
            <div key={key} className="list-row flex-wrap">
              <b className="font-semibold">{LABELS[key]}</b>
              <Segmented
                role="radiogroup"
                label={`${LABELS[key]} requirement`}
                value={config[key]}
                onChange={(r) => setConfig({ ...config, [key]: r })}
                items={[
                  { value: 'required', label: 'Required' },
                  { value: 'optional', label: 'Optional' },
                ]}
              />
            </div>
          ))}
        </div>
        <CardFooter>
          <GuardedButton permission="customers.signupFields" loading={update.isPending} onClick={() => update.mutate(config, { onSuccess: () => toast.success('Signup fields saved.'), onError: (e) => toast.error(errorMessage(e)) })}>
            Save
          </GuardedButton>
        </CardFooter>
      </Card>
    </>
  )
}
