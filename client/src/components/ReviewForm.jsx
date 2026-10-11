import { Star } from 'lucide-react'
import { useState } from 'react'
import api from '../api/client'

// Rating + comment for a completed booking; onDone reloads the list
export default function ReviewForm({ bookingId, onDone }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/reviews', { bookingId, rating, comment })
      onDone()
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-xl bg-teal-50/60 p-4">
      <p className="text-sm font-semibold text-teal-900">How did it go? Leave a review</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`} className="cursor-pointer">
            <Star size={26} className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'} />
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share a short comment"
          maxLength={500}
          className="input"
        />
        <button className="btn btn-primary shrink-0">Post review</button>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
    </form>
  )
}
