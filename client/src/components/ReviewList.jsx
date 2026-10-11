import { MessageSquareQuote } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar, EmptyState, Stars } from './ui'

// Shows a list of reviews; showOffer adds the offer title (used on profiles)
export default function ReviewList({ reviews, showOffer }) {
  if (reviews.length === 0) {
    return <EmptyState icon={MessageSquareQuote} title="No reviews yet">Reviews appear after a completed session.</EmptyState>
  }
  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li key={r.id} className="card flex gap-3 p-4">
          <Avatar name={r.reviewer.name} id={r.reviewer.id} />
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-2 text-sm">
              <span className="font-semibold text-slate-900">{r.reviewer.name}</span>
              <Stars value={r.rating} />
              {showOffer && (
                <Link to={`/offers/${r.booking.offer.id}`} className="text-teal-600 hover:underline">
                  {r.booking.offer.title}
                </Link>
              )}
            </p>
            <p className="mt-1 text-slate-600">{r.comment}</p>
          </div>
        </li>
      ))}
    </ul>
  )
}
