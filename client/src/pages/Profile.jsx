import { CalendarDays, Store } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../api/client'
import ReviewList from '../components/ReviewList'
import { Avatar, Credits, EmptyState, Rating, Spinner } from '../components/ui'
import { CATEGORY_STYLES } from '../categories'

export default function Profile() {
  const { id } = useParams()
  // The result remembers which profile it is for, so a stale one is never shown after navigating
  const [result, setResult] = useState({ id: null })

  useEffect(() => {
    api
      .get(`/users/${id}`)
      .then((res) => setResult({ id, profile: res.data }))
      .catch((err) => setResult({ id, error: err.response?.data?.error || 'Could not load profile' }))
  }, [id])

  if (result.id !== id) return <Spinner />
  if (result.error) return <p className="error-box">{result.error}</p>
  const { profile } = result

  return (
    <div className="space-y-10">
      <section className="card relative overflow-hidden">
        <div className="h-32 bg-linear-to-r from-teal-700 via-teal-600 to-emerald-500" />
        <div className="flex flex-wrap items-end gap-5 px-6 pb-6">
          <div className="-mt-10 rounded-full border-4 border-white">
            <Avatar name={profile.name} id={profile.id} size="lg" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold text-slate-900">{profile.name}</h1>
            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} /> Member since {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </span>
              <Rating value={profile.averageRating} />
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-slate-900">Skills offered</h2>
        {profile.offers.length === 0 ? (
          <EmptyState icon={Store} title="No offers yet">{profile.name} has not shared any skills yet.</EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {profile.offers.map((o) => {
              const Icon = (CATEGORY_STYLES[o.category] || CATEGORY_STYLES.Other).icon
              const style = CATEGORY_STYLES[o.category] || CATEGORY_STYLES.Other
              return (
                <Link key={o.id} to={`/offers/${o.id}`} className="card flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-white ${style.gradient}`}>
                    <Icon size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold text-slate-900">{o.title}</span>
                    <span className="text-sm text-slate-500">{o.category}</span>
                  </span>
                  <Credits amount={o.price} unit="/ hour" />
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-slate-900">Reviews</h2>
        <ReviewList reviews={profile.reviews} showOffer />
      </section>
    </div>
  )
}
