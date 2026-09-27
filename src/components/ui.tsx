import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react'

export function cn(...parts: (string | false | undefined | null)[]) {
  return parts.filter(Boolean).join(' ')
}

export function NekoLogo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="14" className="fill-ink dark:fill-[#0e0e13]" />
      <path d="M15 13 L25 24 h14 L49 13 L51 35 a19 15 0 1 1 -38 0 Z" className="fill-accent" />
      <circle cx="25.5" cy="36" r="3" className="fill-bg dark:fill-[#0e0e13]" />
      <circle cx="38.5" cy="36" r="3" className="fill-bg dark:fill-[#0e0e13]" />
      <path d="M29 43 h6 l-3 4 z" className="fill-bg dark:fill-[#0e0e13]" />
    </svg>
  )
}

type BtnVariant = 'primary' | 'ghost' | 'outline' | 'danger' | 'soft'

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  const styles: Record<BtnVariant, string> = {
    primary: 'bg-accent text-accent-ink hover:bg-accent-hi shadow-sm',
    ghost: 'text-mut hover:bg-surface2 hover:text-ink',
    outline: 'border border-line text-ink hover:border-accent/60 hover:text-accent bg-surface',
    danger: 'bg-red/10 text-red border border-red/30 hover:bg-red/20',
    soft: 'bg-surface2 text-ink hover:bg-line/70',
  }
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        styles[variant],
        className,
      )}
      {...props}
    />
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink placeholder:text-mut/70 outline-none transition focus:border-accent/70 focus:ring-2 focus:ring-accent/20',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13.5px] text-ink placeholder:text-mut/70 outline-none transition focus:border-accent/70 focus:ring-2 focus:ring-accent/20',
        className,
      )}
      {...props}
    />
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-line bg-surface p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]', className)}>
      {children}
    </div>
  )
}

export function Badge({
  children,
  tone = 'mut',
  className,
}: {
  children: ReactNode
  tone?: 'mut' | 'accent' | 'green' | 'red' | 'blue' | 'pink' | 'teal'
  className?: string
}) {
  const tones = {
    mut: 'bg-surface2 text-mut border-line',
    accent: 'bg-accent/12 text-accent border-accent/25',
    green: 'bg-green/12 text-green border-green/25',
    red: 'bg-red/12 text-red border-red/25',
    blue: 'bg-blue/12 text-blue border-blue/25',
    pink: 'bg-pink/12 text-pink border-pink/25',
    teal: 'bg-teal/12 text-teal border-teal/25',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold', tones[tone], className)}>
      {children}
    </span>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-0.5 text-[13px] text-mut">{subtitle}</p>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/50 px-6 py-12 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface2 text-accent">{icon}</div>
      <div className="font-display text-base font-bold">{title}</div>
      <p className="mt-1 max-w-sm text-[13px] text-mut">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: ReactNode }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-line bg-surface2/60 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
            value === o.value ? 'bg-surface text-accent shadow-sm border border-line' : 'text-mut hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Stat({
  label,
  value,
  icon,
  tone = 'accent',
}: {
  label: string
  value: string | number
  icon: ReactNode
  tone?: 'accent' | 'blue' | 'green' | 'pink' | 'teal'
}) {
  const tones = {
    accent: 'bg-accent/12 text-accent',
    blue: 'bg-blue/12 text-blue',
    green: 'bg-green/12 text-green',
    pink: 'bg-pink/12 text-pink',
    teal: 'bg-teal/12 text-teal',
  }
  return (
    <Card className="flex items-center gap-3">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tones[tone])}>{icon}</div>
      <div className="min-w-0">
        <div className="font-display text-xl font-bold leading-none">{value}</div>
        <div className="mt-1 truncate text-[11.5px] font-medium uppercase tracking-wide text-mut">{label}</div>
      </div>
    </Card>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('fade-up relative max-h-[85vh] w-full overflow-y-auto rounded-2xl border border-line bg-surface p-5 shadow-2xl', wide ? 'max-w-2xl' : 'max-w-md')}>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-mut hover:bg-surface2 hover:text-ink">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
