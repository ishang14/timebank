import { CalendarPlus, Pencil, PlusCircle, Store, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { Credits, EmptyState, Spinner, StatusBadge } from '../components/ui'
import { CATEGORIES, CATEGORY_STYLES, formatDate } from '../categories'

const emptyOffer = { title: '', description: '', category: CATEGORIES[0], price: 1 }
const emptySlot = { date: '', startTime: '', endTime: '' }

const errorText = (err) => err.response?.data?.error || 'Something went wrong'

export default function MyOffers() {
  const [offers, setOffers] = useState(null) // null while loading
  const [form, setForm] = useState(emptyOffer)
  const [editingId, setEditingId] = useState(null) // null = creating a new offer
  const [slotForms, setSlotForms] = useState({}) // new-slot inputs, keyed by offer id
  const [error, setError] = useState('')

  const load = () => api.get('/offers/mine').then((res) => setOffers(res.data))

  useEffect(() => {
    load().catch(() => setError('Could not load offers'))
  }, [])

  // Runs an API call, then reloads the list; shows the server's error if it fails
  async function run(call) {
    setError('')
    try {
      await call()
      await load()
      return true
    } catch (err) {
      setError(errorText(err))
      return false
    }
  }

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function saveOffer(e) {
    e.preventDefault()
    const body = { ...form, price: Number(form.price) }
    const ok = await run(() => (editingId ? api.put(`/offers/${editingId}`, body) : api.post('/offers', body)))
    if (ok) cancelEdit()
  }

  function startEdit(offer) {
    setEditingId(offer.id)
    setForm({ title: offer.title, description: offer.description, category: offer.category, price: offer.price })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyOffer)
  }

  const slotForm = (offerId) => slotForms[offerId] || emptySlot
  const changeSlot = (offerId, e) =>
    setSlotForms({ ...slotForms, [offerId]: { ...slotForm(offerId), [e.target.name]: e.target.value } })

  async function addSlot(e, offerId) {
    e.preventDefault()
    const ok = await run(() => api.post(`/offers/${offerId}/slots`, slotForm(offerId)))
    if (ok) setSlotForms({ ...slotForms, [offerId]: emptySlot })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">My offers</h1>
        <p className="mt-1 text-slate-500">Share what you are good at and open some time slots.</p>
      </div>
      {error && <p className="error-box">{error}</p>}

      <form onSubmit={saveOffer} className="card space-y-4 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          {editingId ? <Pencil size={18} className="text-teal-600" /> : <PlusCircle size={18} className="text-teal-600" />}
          {editingId ? 'Edit offer' : 'Create a new offer'}
        </h2>
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
          <div>
            <label className="label">Title</label>
            <input name="title" placeholder="e.g. Python for beginners" value={form.title} onChange={change} className="input" />
          </div>
          <div>
            <label className="label">Category</label>
            <select name="category" value={form.category} onChange={change} className="input">
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Credits / hour</label>
            <input name="price" type="number" min="1" value={form.price} onChange={change} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea name="description" rows="3" placeholder="What will you teach?" value={form.description} onChange={change} className="input" />
        </div>
        <div className="flex gap-2">
          <button className="btn btn-primary">{editingId ? 'Save changes' : 'Create offer'}</button>
          {editingId && (
            <button type="button" onClick={cancelEdit} className="btn btn-outline">
              <X size={16} /> Cancel
            </button>
          )}
        </div>
      </form>

      {!offers && !error && <Spinner />}
      {offers?.length === 0 && (
        <EmptyState icon={Store} title="You have no offers yet">Create your first offer above, then add time slots so people can book you.</EmptyState>
      )}

      <div className="space-y-5">
        {offers?.map((o) => {
          const style = CATEGORY_STYLES[o.category] || CATEGORY_STYLES.Other
          const Icon = style.icon
          return (
            <section key={o.id} className="card overflow-hidden">
              <div className="flex items-start justify-between gap-4 p-5">
                <div className="flex gap-4">
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br text-white ${style.gradient}`}>
                    <Icon size={22} />
                  </span>
                  <div>
                    <Link to={`/offers/${o.id}`} className="text-lg font-bold text-slate-900 hover:text-teal-700">
                      {o.title}
                    </Link>
                    <p className="mt-0.5 flex items-center gap-2 text-sm text-slate-500">
                      {o.category} <Credits amount={o.price} unit="/ hour" />
                    </p>
                    <p className="mt-2 text-sm text-slate-600">{o.description}</p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => startEdit(o)} className="btn btn-outline btn-sm">
                    <Pencil size={14} /> Edit
                  </button>
                  <button onClick={() => run(() => api.delete(`/offers/${o.id}`))} className="btn btn-danger btn-sm">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-100 bg-slate-50/70 p-5">
                <h3 className="text-xs font-bold tracking-wide text-slate-500 uppercase">Time slots</h3>
                {o.slots.length === 0 && <p className="text-sm text-slate-500">No slots yet. Add one below so people can book you.</p>}
                <ul className="flex flex-wrap gap-2">
                  {o.slots.map((s) => (
                    <li key={s.id} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pr-2 pl-3 text-sm">
                      <span className="font-medium">
                        {formatDate(s.date)} · {s.startTime}–{s.endTime}
                      </span>
                      <StatusBadge status={s.status} />
                      <button
                        onClick={() => run(() => api.delete(`/offers/${o.id}/slots/${s.id}`))}
                        title="Remove slot"
                        className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
                <form onSubmit={(e) => addSlot(e, o.id)} className="flex flex-wrap items-end gap-2">
                  <input name="date" type="date" value={slotForm(o.id).date} onChange={(e) => changeSlot(o.id, e)} className="input w-auto" />
                  <input name="startTime" type="time" value={slotForm(o.id).startTime} onChange={(e) => changeSlot(o.id, e)} className="input w-auto" />
                  <input name="endTime" type="time" value={slotForm(o.id).endTime} onChange={(e) => changeSlot(o.id, e)} className="input w-auto" />
                  <button className="btn btn-outline">
                    <CalendarPlus size={16} /> Add slot
                  </button>
                </form>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
