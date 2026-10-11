import { CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CATEGORY_STYLES } from '../categories'
import { Avatar, Credits, Rating } from './ui'

export default function OfferCard({ offer }) {
  const style = CATEGORY_STYLES[offer.category] || CATEGORY_STYLES.Other
  const Icon = style.icon
  const slots = offer.slots.length
  return (
    <Link
      to={`/offers/${offer.id}`}
      className="card group flex flex-col overflow-hidden transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-900/10"
    >
      {/* A thin colour line per category keeps the grid calm but easy to scan */}
      <div className={`h-1.5 bg-linear-to-r ${style.gradient}`} />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${style.soft}`}>
            <Icon size={14} /> {offer.category}
          </span>
          <Credits amount={offer.price} unit="/ hour" />
        </div>
        <h2 className="text-lg leading-snug font-bold text-slate-900 group-hover:text-teal-700">{offer.title}</h2>
        <p className="line-clamp-2 text-sm text-slate-500">{offer.description}</p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Avatar name={offer.user.name} id={offer.user.id} size="sm" />
            {offer.user.name}
          </span>
          <Rating value={offer.averageRating} />
        </div>
        <p className={`flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs font-semibold ${slots ? 'text-teal-700' : 'text-slate-400'}`}>
          <CalendarDays size={14} />
          {slots === 0 ? 'No free slots' : `${slots} free slot${slots > 1 ? 's' : ''}`}
        </p>
      </div>
    </Link>
  )
}
