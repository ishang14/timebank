import { Loader2, Star } from 'lucide-react'

// Small shared pieces used across pages

const AVATAR_COLORS = [
  'from-teal-500 to-emerald-600',
  'from-rose-400 to-orange-500',
  'from-amber-400 to-orange-500',
  'from-sky-500 to-cyan-600',
  'from-emerald-500 to-lime-600',
]

// Round badge with the user's initial; colour depends on the user id
export function Avatar({ name, id = 0, size = 'md' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-20 w-20 text-3xl' }
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-linear-to-br font-bold text-white shadow-sm ${AVATAR_COLORS[id % AVATAR_COLORS.length]} ${sizes[size]}`}
    >
      {name?.[0]?.toUpperCase()}
    </span>
  )
}

// A gold coin with a clock hand: one credit = one hour
export function Coin({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className={className} aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="#fbbf24" stroke="#d97706" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="6" fill="none" stroke="#d97706" strokeWidth="1" opacity="0.6" />
      <path d="M10 6.2V10l2.6 1.6" fill="none" stroke="#92400e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Amber chip for credit amounts ("1 credit", "2 credits")
export function Credits({ amount, unit = '', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 ${className}`}>
      <Coin size={14} />
      {amount}
      {unit && <span className="font-medium"> {amount === 1 ? unit.replace('credits', 'credit') : unit}</span>}
    </span>
  )
}

// Rating as a star plus number, or a quiet "New" when there are no reviews
export function Rating({ value }) {
  if (!value) return <span className="text-xs font-medium text-slate-400">No ratings yet</span>
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700">
      <Star size={14} className="fill-amber-400 text-amber-400" />
      {Number(value).toFixed(1)}
    </span>
  )
}

// Row of 5 stars for a single review
export function Stars({ value }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={14} className={n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
      ))}
    </span>
  )
}

export function Spinner({ label = 'Loading...' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
      <Loader2 className="animate-spin" size={20} />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="rounded-2xl bg-teal-50 p-3 text-teal-500">
        <Icon size={28} />
      </span>
      <p className="font-semibold text-slate-800">{title}</p>
      {children && <p className="max-w-sm text-sm text-slate-500">{children}</p>}
    </div>
  )
}

const STATUS_STYLES = {
  REQUESTED: 'bg-amber-100 text-amber-800',
  ACCEPTED: 'bg-sky-100 text-sky-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  DECLINED: 'bg-rose-100 text-rose-700',
  CANCELLED: 'bg-slate-200 text-slate-600',
  FREE: 'bg-emerald-100 text-emerald-800',
  BOOKED: 'bg-slate-200 text-slate-600',
}

export function StatusBadge({ status }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-bold tracking-wide ${STATUS_STYLES[status]}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}
