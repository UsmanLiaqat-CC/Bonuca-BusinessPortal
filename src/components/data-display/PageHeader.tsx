import type { ReactNode } from 'react'
import { DemoBadge } from '@/components/feedback/Banners'

/** Title text with the redesign's yellow highlight under its last word. */
export function HighlightTitle({ title }: { title: string }) {
  const cut = title.lastIndexOf(' ')
  const head = cut > 0 ? title.slice(0, cut) : ''
  const last = cut > 0 ? title.slice(cut + 1) : title
  return (
    <>
      {head && `${head} `}
      <span className="hl">{last}</span>
    </>
  )
}

/**
 * Redesign page header: eyebrow (breadcrumb), big tight-tracked title with the yellow highlight on
 * its last word, subtitle and actions.
 */
export function PageHeader({ title, description, actions, breadcrumb }: { title: string; description?: ReactNode; actions?: ReactNode; breadcrumb?: ReactNode }) {
  return (
    <header className="page-head reveal-up">
      <div className="min-w-0">
        {breadcrumb && <div className="eyebrow">{breadcrumb}</div>}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="page-title">
            <HighlightTitle title={title} />
          </h1>
          <DemoBadge />
        </div>
        {description && <p className="page-sub">{description}</p>}
      </div>
      {actions && <div className="head-actions items-center">{actions}</div>}
    </header>
  )
}
