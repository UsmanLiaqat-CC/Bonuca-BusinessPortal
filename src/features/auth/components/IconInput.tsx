import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff, type LucideIcon } from 'lucide-react'
import { Input } from '@/components/ui/Field'
import { useT } from '@/i18n'
import { cn } from '@/lib/cn'

/** Text input with a leading icon; password inputs get a show/hide toggle. */
export const IconInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { icon: LucideIcon }>(function IconInput(
  { icon: Icon, type, className, ...rest },
  ref,
) {
  const t = useT()
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <Input ref={ref} type={isPassword && visible ? 'text' : type} className={cn('h-12 rounded-xl pl-10 text-[15px]', isPassword && 'pr-11', className)} {...rest} />
      {isPassword && (
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg"
        >
          {visible ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      )}
    </div>
  )
})
