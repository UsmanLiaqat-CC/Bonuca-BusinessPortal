import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowRight, MapPin, Store } from 'lucide-react'
import { LANGUAGES, useI18n } from '@/i18n'
import { useBackend } from '@/state/services'
import { SESSION_KEY, useSessionQuery } from '@/state/session'
import { suggestedLanguage } from '@/mocks/countries'
import { BUSINESS_CATEGORIES } from '@/types/domain'
import { businessProfileSchema, type BusinessProfileValues } from '@/schemas/auth'
import { zodResolver } from '@/lib/forms'
import { errorMessage } from '@/lib/errors'
import { DEFAULT_BRAND_COLOR, defaultOpeningHours } from '@/lib/factories'
import { Field, Input, Select, Toggle } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { ImageUpload } from '@/components/forms/ImageUpload'
import { OpeningHoursField } from '@/components/forms/OpeningHoursField'
import { AuthLayout } from '@/features/auth/components/AuthLayout'
import { OnboardingBars, OnboardingSteps } from '../OnboardingSteps'

/** Spec §1.4 business profile. No account-wide currency field (currency is set per program). */
export default function BusinessProfilePage() {
  const { t, language, setLanguage } = useI18n()
  const backend = useBackend()
  const qc = useQueryClient()
  const [hoursNow, setHoursNow] = useState(false)
  const country = useSessionQuery().data?.user.country
  // §1.2: the registration country suggests the default interface language.
  const suggested = country && country !== 'OTHER' ? suggestedLanguage(country) : language
  const { register, control, handleSubmit, formState, setError, setValue } = useForm<BusinessProfileValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      name: '',
      category: '' as BusinessProfileValues['category'],
      logo: null,
      address: { street: '', postalCode: '', city: '', country: '' },
      openingHours: null,
      primaryColor: DEFAULT_BRAND_COLOR,
      language: suggested,
    },
  })
  const e = formState.errors

  const onSubmit = handleSubmit(async (v) => {
    try {
      await backend.createBusiness(v)
      setLanguage(v.language)
      await qc.invalidateQueries({ queryKey: SESSION_KEY })
    } catch (err) {
      setError('root', { message: errorMessage(err) })
    }
  })

  return (
    <AuthLayout
      title={t('onb.business.title')}
      subtitle={t('onb.business.subtitle')}
      size="lg"
      top={<OnboardingSteps current={1} />}
      eyebrow={
        <>
          <Store className="size-[13px]" aria-hidden /> {t('onb.eyebrow')}
        </>
      }
    >
      <OnboardingBars current={1} />
      <form onSubmit={onSubmit} noValidate className="form-grid">
        <Field label={t('onb.businessName')} required error={e.name?.message}>
          {(p) => <Input {...p} placeholder={t('onb.namePlaceholder')} {...register('name')} />}
        </Field>
        <Field label={t('onb.category')} required error={e.category?.message}>
          {(p) => (
            <Select {...p} {...register('category')}>
              <option value="">{t('onb.select')}</option>
              {BUSINESS_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`cat.${c}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Controller control={control} name="logo" render={({ field }) => <ImageUpload label={t('onb.logo')} value={field.value} onChange={field.onChange} hint={t('onb.addLater')} />} />
        <Field label={t('onb.language')} required hint={t('onb.hint.language')}>
          {(p) => (
            <Select {...p} {...register('language')}>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="hidden md:block" />
        <fieldset className="full">
          <legend className="label mb-2 flex-wrap">
            <MapPin className="size-[15px]" aria-hidden /> {t('onb.address')} <span className="opt">— {t('onb.addLater')}</span>
          </legend>
          <div className="form-grid">
            <Field label={t('onb.street')}>{(p) => <Input {...p} autoComplete="street-address" {...register('address.street')} />}</Field>
            <Field label={t('onb.postal')}>{(p) => <Input {...p} autoComplete="postal-code" {...register('address.postalCode')} />}</Field>
            <Field label={t('onb.city')}>{(p) => <Input {...p} autoComplete="address-level2" {...register('address.city')} />}</Field>
            <Field label={t('onb.country')}>{(p) => <Input {...p} {...register('address.country')} />}</Field>
          </div>
        </fieldset>
        <div className="full flex flex-col gap-3">
          <Toggle
            label={t('onb.hoursAddNow')}
            description={t('onb.addLater')}
            checked={hoursNow}
            onChange={(on) => {
              setHoursNow(on)
              setValue('openingHours', on ? defaultOpeningHours() : null)
            }}
          />
          {hoursNow && (
            <div className="reveal rounded-[18px]">
              <Controller
                control={control}
                name="openingHours"
                render={({ field }) =>
                  field.value ? (
                    <OpeningHoursField
                      value={field.value}
                      onChange={field.onChange}
                      errors={Object.fromEntries(Object.entries(e.openingHours ?? {}).map(([k, v]) => [k, (v as { close?: { message?: string } })?.close?.message]))}
                    />
                  ) : (
                    <></>
                  )
                }
              />
            </div>
          )}
        </div>
        {e.root && (
          <p className="full callout border-transparent bg-danger-soft text-danger" role="alert">
            {e.root.message}
          </p>
        )}
        <div className="full mt-1.5 flex justify-end">
          <Button type="submit" size="lg" loading={formState.isSubmitting}>
            {t('common.continue')}
            <ArrowRight className="size-[15px]" aria-hidden />
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}
