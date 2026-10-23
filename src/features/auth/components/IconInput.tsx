import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff, type LucideIcon } from 'lucide-react'
import { Input } from '@/components/ui/Field'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'

/** Text input with a leading icon (redesign `.input-wrap`); password inputs get a show/hide toggle. */
export const IconInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { icon: LucideIcon }>(function IconInput(
  { icon: Icon, type, className, ...rest },
  ref,
) {
  const t = useT()
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className="input-wrap">
      <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-faint" aria-hidden />
      <Input ref={ref} type={isPassword && visible ? 'text' : type} className={cn('pl-[42px]', isPassword && 'pr-12', className)} {...rest} />
      {isPassword && (
        <span className="trail">
          <button type="button" onClick={() => setVisible((v) => !v)} aria-pressed={visible} aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')} className="icon-btn">
            {visible ? <EyeOff className="size-[15px]" aria-hidden /> : <Eye className="size-[15px]" aria-hidden />}
          </button>
        </span>
      )}
    </div>
  )
})
