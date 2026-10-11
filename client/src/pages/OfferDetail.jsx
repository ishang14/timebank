import { ArrowLeft, CalendarX, CheckCircle2, Clock } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'
import ReviewList from '../components/ReviewList'
import { Avatar, Credits, EmptyState, Rating, Spinner } from '../components/ui'
import { CATEGORY_STYLES, formatDate } from '../categories'
import { useAuth } from '../context/AuthContext'

export default function OfferDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [offer, setOffer] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(null) // { ok, text }

  const load = useCallback(
    () =>
      api
        .get(`/offers/${id}`)
        .then((res) => setOffer(res.data))
        .catch((err) => setError(err.response?.data?.error || 'Could not load offer')),
    [id],
  )

  useEffect(() => {
    load()
  }, [load])

  async function book(slotId) {
    if (!user) return navigate('/login')
    setMessage(null)
    try {
      await api.post('/bookings', { slotId })
      setMessage({ ok: true, text: 'Booking requested! The provider will confirm it. See My Bookings.' })
    } catch (err) {
      setMessage({ ok: false, text: err.response?.data?.error || 'Could not book this slot' })
    }
    load() // the slot may have been taken, so refresh the list
  }

  if (error) return <p className="error-box">{error}</p>
  if (!offer) return <Spinner />

  const isOwner = user?.id === offer.user.id
  const style = CATEGORY_STYLES[offer.category] || CATEGORY_STYLES.Other
  const Icon = style.icon

  return (
    <div className="space-y-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-teal-700">
        <ArrowLeft size={16} /> All skills
      </Link>

      <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section className="card overflow-hidden">
            <div className={`bg-linear-to-br p-8 text-white ${style.gradient}`}>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur">
                <Icon size={16} /> {offer.category}
              </span>
              <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">{offer.title}</h1>
            </div>
            <div className="space-y-5 p-6">
              <div className="flex flex-wrap items-center gap-4">
                <Credits amount={offer.price} unit="credits / hour" className="text-sm" />
                <Rating value={offer.averageRating} />
              </div>
              <p className="leading-relaxed text-slate-600">{offer.description}</p>
              <Link to={`/profile/${offer.user.id}`} className="flex w-fit items-center gap-3 rounded-xl border border-slate-200 p-3 pr-5 hover:border-teal-300">
                <Avatar name={offer.user.name} id={offer.user.id} />
                <span>
                  <span className="block text-xs text-slate-500">Taught by</span>
                  <span className="font-semibold text-slate-900">{offer.user.name}</span>
                </span>
              </Link>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-slate-900">Reviews</h2>
            <ReviewList reviews={offer.reviews} />
          </section>
        </div>

        <aside className="card h-fit space-y-4 p-6 xl:sticky xl:top-24">
          <h2 className="font-display text-xl font-bold text-slate-900">Pick a time</h2>
          {message && (
            <p className={message.ok ? 'flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800' : 'error-box'}>
              {message.ok && <CheckCircle2 size={18} className="shrink-0" />}
              {message.text}
            </p>
          )}
          {offer.slots.length === 0 && (
            <EmptyState icon={CalendarX} title="No free slots">Check back soon, or message the provider's profile for updates.</EmptyState>
          )}
          <ul className="space-y-2">
            {offer.slots.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                <span className="text-sm">
                  <span className="block font-semibold text-slate-900">{formatDate(s.date)}</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock size={13} /> {s.startTime}–{s.endTime}
                  </span>
                </span>
                {isOwner ? (
                  <span className="text-xs text-slate-400">Your offer</span>
                ) : (
                  <button onClick={() => book(s.id)} className="btn btn-primary btn-sm">
                    Book this slot
                  </button>
                )}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}
