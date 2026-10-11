import { CalendarCheck, CalendarDays, Check, Clock, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import ReviewForm from '../components/ReviewForm'
import { Avatar, Credits, EmptyState, Spinner, Stars, StatusBadge } from '../components/ui'
import { formatDate } from '../categories'
import { useAuth } from '../context/AuthContext'

// Which buttons each side sees for each status: [new status, label, style, icon]
const CANCEL = ['CANCELLED', 'Cancel', 'btn-danger', X]
const ACTIONS = {
  requested: {
    REQUESTED: [CANCEL],
    ACCEPTED: [['COMPLETED', 'Mark completed', 'btn-success', Check], CANCEL],
  },
  received: {
    REQUESTED: [['ACCEPTED', 'Accept', 'btn-success', Check], ['DECLINED', 'Decline', 'btn-danger', X], CANCEL],
    ACCEPTED: [CANCEL],
  },
}

export default function MyBookings() {
  const { refreshUser } = useAuth()
  const [tab, setTab] = useState('requested')
  const [bookings, setBookings] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(
    () =>
      api
        .get('/bookings', { params: { role: tab } })
        .then((res) => setBookings(res.data))
        .catch(() => setError('Could not load bookings')),
    [tab],
  )

  useEffect(() => {
    load()
  }, [load])

  function switchTab(next) {
    if (next === tab) return
    setBookings(null) // show the spinner while the other list loads
    setTab(next)
  }

  async function changeStatus(id, status) {
    setError('')
    try {
      await api.patch(`/bookings/${id}/status`, { status })
      if (status === 'COMPLETED') refreshUser() // credits moved
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    }
    load()
  }

  const tabClass = (t) =>
    `cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
      tab === t ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
    }`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">My bookings</h1>
        <p className="mt-1 text-slate-500">Track the sessions you asked for and the ones people asked of you.</p>
      </div>

      <div className="inline-flex gap-1 rounded-2xl bg-slate-200/70 p-1">
        <button onClick={() => switchTab('requested')} className={tabClass('requested')}>I requested</button>
        <button onClick={() => switchTab('received')} className={tabClass('received')}>Requests for me</button>
      </div>

      {error && <p className="error-box">{error}</p>}
      {!bookings && !error && <Spinner />}
      {bookings?.length === 0 && (
        <EmptyState icon={CalendarCheck} title="No bookings here yet">
          {tab === 'requested' ? 'Find a skill on Browse and book a slot.' : 'When someone books one of your slots, it shows up here.'}
        </EmptyState>
      )}

      <div className="space-y-4">
        {bookings?.map((b) => {
          const other = tab === 'requested' ? b.provider : b.requester
          return (
            <div key={b.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex gap-3">
                  <Avatar name={other.name} id={other.id} />
                  <div>
                    <Link to={`/offers/${b.offer.id}`} className="font-bold text-slate-900 hover:text-teal-700">
                      {b.offer.title}
                    </Link>
                    <p className="text-sm text-slate-500">
                      {tab === 'requested' ? 'with' : 'requested by'}{' '}
                      <Link to={`/profile/${other.id}`} className="font-medium text-teal-600 hover:underline">{other.name}</Link>
                    </p>
                  </div>
                </div>
                <StatusBadge status={b.status} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                <span className="flex items-center gap-1.5"><CalendarDays size={15} className="text-teal-500" /> {formatDate(b.slot.date)}</span>
                <span className="flex items-center gap-1.5"><Clock size={15} className="text-teal-500" /> {b.slot.startTime}–{b.slot.endTime}</span>
                <Credits amount={b.cost} unit="credits" />
              </div>

              {(ACTIONS[tab][b.status] || []).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {ACTIONS[tab][b.status].map(([status, label, style, Icon]) => (
                    <button key={status} onClick={() => changeStatus(b.id, status)} className={`btn btn-sm ${style}`}>
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>
              )}

              {b.review && (
                <p className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                  <Stars value={b.review.rating} /> {b.review.comment}
                </p>
              )}
              {tab === 'requested' && b.status === 'COMPLETED' && !b.review && <ReviewForm bookingId={b.id} onDone={load} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
