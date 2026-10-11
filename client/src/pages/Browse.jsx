import { ArrowRight, Clock, Handshake, Search, SearchX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import OfferCard from '../components/OfferCard'
import { Coin, EmptyState, Spinner } from '../components/ui'
import { CATEGORIES } from '../categories'
import { useAuth } from '../context/AuthContext'

const STEPS = [
  [Clock, 'Give an hour', 'Teach what you know: code, a language, an instrument, anything.'],
  [Coin, 'Earn a credit', 'Each completed hour adds a credit to your wallet.'],
  [Handshake, 'Learn from others', 'Spend credits on a session with a fellow student.'],
]

function Hero({ user }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-teal-700 via-teal-800 to-teal-950 px-6 py-12 text-white shadow-xl shadow-emerald-900/20 sm:px-12 sm:py-16">
      {/* decorative glows */}
      <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
      {/* Decoration, large screens only */}
      <div className="pointer-events-none absolute top-1/2 right-12 hidden -translate-y-1/2 lg:block" aria-hidden="true">
        <Coin size={230} className="drop-shadow-2xl" />
      </div>
      <div className="relative max-w-2xl">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur">
          <Coin size={16} /> 1 hour of help = 1 credit
        </span>
        <h1 className="font-display text-4xl leading-tight font-bold sm:text-6xl">
          Your time is <span className="text-amber-300">worth</span> something.
        </h1>
        <p className="mt-4 text-lg text-teal-100">
          Trade skills with other students. Teach what you love, learn what you need, and never spend a cent.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {user ? (
            <Link to="/my-offers" className="btn btn-accent">
              Share a skill <ArrowRight size={16} />
            </Link>
          ) : (
            <Link to="/login" className="btn btn-accent">
              Join free and get 3 credits <ArrowRight size={16} />
            </Link>
          )}
          <a href="#offers" className="btn border border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20">
            Browse skills
          </a>
        </div>
      </div>
    </section>
  )
}

export default function Browse() {
  const { user } = useAuth()
  const [filters, setFilters] = useState({ search: '', category: '', maxPrice: '', minRating: '' })
  const [offers, setOffers] = useState(null)
  const [error, setError] = useState('')

  // Reload whenever a filter changes
  useEffect(() => {
    // Only send filters that have a value
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    api
      .get('/offers', { params })
      .then((res) => setOffers(res.data))
      .catch(() => setError('Could not load offers'))
  }, [filters])

  const change = (e) => setFilters({ ...filters, [e.target.name]: e.target.value })

  return (
    <div className="space-y-12">
      <Hero user={user} />

      <section className="grid gap-4 sm:grid-cols-3">
        {STEPS.map(([Icon, title, text], i) => (
          <div key={title} className="card flex gap-4 p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
              <Icon size={22} />
            </span>
            <div>
              <p className="font-bold text-slate-900">
                {i + 1}. {title}
              </p>
              <p className="text-sm text-slate-500">{text}</p>
            </div>
          </div>
        ))}
      </section>

      <section id="offers" className="scroll-mt-24 space-y-5">
        <h2 className="page-title">Find a skill to learn</h2>

        <div className="card grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="relative">
            <Search size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
            <input name="search" placeholder="Search skills..." value={filters.search} onChange={change} className="input pl-10" />
          </div>
          <select name="category" value={filters.category} onChange={change} className="input">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input name="maxPrice" type="number" min="1" placeholder="Max credits / hour" value={filters.maxPrice} onChange={change} className="input" />
          <select name="minRating" value={filters.minRating} onChange={change} className="input">
            <option value="">Any rating</option>
            {[4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n}★ and up
              </option>
            ))}
          </select>
        </div>

        {error && <p className="error-box">{error}</p>}
        {!offers && !error && <Spinner label="Finding skills..." />}
        {offers?.length === 0 && (
          <EmptyState icon={SearchX} title="No skills match your search">
            Try a different keyword or clear a filter.
          </EmptyState>
        )}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {offers?.map((o) => (
            <OfferCard key={o.id} offer={o} />
          ))}
        </div>
      </section>
    </div>
  )
}
