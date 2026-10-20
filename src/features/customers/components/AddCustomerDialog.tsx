import { useForm } from 'react-hook-form'
import type { SignupFieldConfig } from '@/types/domain'
import { customerSchema, type CustomerValues } from '@/schemas/customer'
import { zodResolver } from '@/lib/forms'
import { errorMessage } from '@/lib/errors'
import { useToast } from '@/state/toast'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { useAddCustomer } from '../hooks'

/** Adds a customer using the business's configured signup fields (spec §4.5). */
export function AddCustomerDialog({ open, onClose, fields }: { open: boolean; onClose: () => void; fields: SignupFieldConfig }) {
  const toast = useToast()
  const add = useAddCustomer()
  const { register, handleSubmit, formState, reset } = useForm<CustomerValues>({ resolver: zodResolver(customerSchema(fields)), defaultValues: { name: '', email: '', phone: '', birthday: '' } })
  const req = (k: keyof SignupFieldConfig) => fields[k] === 'required'
  const submit = handleSubmit(async (v) => {
    try {
      const c = await add.mutateAsync(v)
      toast.success(`${c.name || 'Customer'} added (${c.customerNumber}).`)
      reset()
      onClose()
    } catch (e) {
      toast.error(errorMessage(e))
    }
  })
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add customer"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={formState.isSubmitting}>Add customer</Button>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required={req('name')} optional={!req('name')} error={formState.errors.name?.message}>
          {(p) => <Input {...p} {...register('name')} />}
        </Field>
        <Field label="Email" required={req('email')} optional={!req('email')} error={formState.errors.email?.message}>
          {(p) => <Input {...p} type="email" {...register('email')} />}
        </Field>
        <Field label="Phone Number" required={req('phone')} optional={!req('phone')} error={formState.errors.phone?.message}>
          {(p) => <Input {...p} type="tel" {...register('phone')} />}
        </Field>
        <Field label="Birthday" required={req('birthday')} optional={!req('birthday')} error={formState.errors.birthday?.message}>
          {(p) => <Input {...p} type="date" {...register('birthday')} />}
        </Field>
      </form>
    </Dialog>
  )
}
