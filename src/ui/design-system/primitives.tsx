import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router'
import type { CardStatus } from '../../domain/card'
import { CARD_STATUS_LABELS } from '../../domain/card'
import type { Tag } from '../../domain/tag'
import { TAG_NAMESPACE_LABELS, formatTag } from '../../domain/tag'

export function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(' ')
}

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-brand-ink hover:brightness-110 border-transparent',
  secondary: 'bg-surface text-ink border-line-strong hover:border-brand hover:text-brand',
  ghost: 'bg-transparent text-muted border-transparent hover:bg-surface hover:text-ink',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-5 text-base gap-2',
}

const BASE =
  'inline-flex items-center justify-center rounded-lg border font-medium transition-all duration-150 ' +
  'disabled:opacity-40 disabled:pointer-events-none select-none whitespace-nowrap'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export function Button({ variant = 'secondary', size = 'md', className, ...props }: ButtonProps) {
  return <button className={cx(BASE, VARIANTS[variant], SIZES[size], className)} {...props} />
}

interface ButtonLinkProps {
  to: string
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

export function ButtonLink({ to, variant = 'secondary', size = 'md', className, children }: ButtonLinkProps) {
  return (
    <Link to={to} className={cx(BASE, VARIANTS[variant], SIZES[size], className)}>
      {children}
    </Link>
  )
}

export function ExternalButtonLink({
  href,
  variant = 'secondary',
  size = 'md',
  className,
  children,
}: Omit<ButtonLinkProps, 'to'> & { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cx(BASE, VARIANTS[variant], SIZES[size], className)}
    >
      {children}
    </a>
  )
}

const STATUS_STYLES: Record<CardStatus, string> = {
  draft: 'text-muted border-line-strong',
  proposed: 'text-warn border-warn bg-warn-soft',
  validated: 'text-brand border-brand bg-brand-soft',
}

export function StatusBadge({ status, className }: { status: CardStatus; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium tracking-wide',
        STATUS_STYLES[status],
        className,
      )}
    >
      {CARD_STATUS_LABELS[status]}
    </span>
  )
}

export function TagPill({ tag, onClick, active }: { tag: Tag; onClick?: () => void; active?: boolean }) {
  const content = (
    <>
      <span className="text-muted">{TAG_NAMESPACE_LABELS[tag.namespace].toLowerCase()}</span>
      <span aria-hidden="true" className="text-line-strong">
        /
      </span>
      <span>{tag.value}</span>
    </>
  )

  const className = cx(
    'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] transition-colors',
    active ? 'border-brand bg-brand-soft text-brand' : 'border-line text-ink',
    onClick && 'hover:border-brand hover:text-brand cursor-pointer',
  )

  if (!onClick) {
    return (
      <span className={className} title={formatTag(tag)}>
        {content}
      </span>
    )
  }

  return (
    <button type="button" onClick={onClick} className={className} title={formatTag(tag)}>
      {content}
    </button>
  )
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-line-strong bg-surface px-1.5 font-mono text-[10px] text-muted">
      {children}
    </kbd>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong px-6 py-12 text-center">
      <p className="font-medium text-ink">{title}</p>
      {children ? <div className="mt-2 text-sm text-muted">{children}</div> : null}
    </div>
  )
}

/** Barre de progression fine — le seul endroit où le vert s'étale un peu. */
export function Meter({ value, total }: { value: number; total: number }) {
  const ratio = total === 0 ? 0 : Math.min(1, value / total)

  return (
    <div
      className="h-1 w-full overflow-hidden rounded-full bg-line"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      <div
        className="h-full rounded-full bg-brand transition-[width] duration-300"
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  )
}
