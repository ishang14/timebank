import { Clock, Crown, Flame, Handshake } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { Avatar, EmptyState, Spinner } from '../components/ui'

function Tile({ icon: Icon, value, label, color }) {
  return (
    <div className="card flex items-center gap-4 p-6">
      <span className={`flex h-14 w-14 items-center justify-center rounded-2xl text-white ${color}`}>
        <Icon size={26} />
      </span>
      <div>
        <p className="font-display text-4xl font-bold text-slate-900">{value}</p>
        <p className="text-sm font-medium text-slate-500">{label}</p>
      </div>
    </div>
  )
}

// A ranked list where each row has a bar sized relative to the leader
function Ranking({ title, icon: Icon, rows, barColor, children }) {
  const max = Math.max(1, ...rows.map((r) => r.sessions))
  return (
    <section className="card space-y-4 p-6">
      <h2 className="flex items-center gap-2 font-display text-xl font-bold text-slate-900">
        <Icon size={20} className="text-amber-500" /> {title}
      </h2>
      {rows.length === 0 && <p className="text-sm text-slate-500">Nothing completed yet.</p>}
      <ol className="space-y-4">
        {rows.map((r, i) => (
          <li key={r.key} className="flex items-center gap-3">
            <span className="w-5 text-center text-sm font-bold text-slate-400">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate font-semibold text-slate-900">{children(r)}</span>
                <span className="shrink-0 text-slate-500">{r.sessions} {r.sessions === 1 ? 'session' : 'sessions'}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${(r.sessions / max) * 100}%` }} />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default function Stats() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/stats')
      .then((res) => setStats(res.data))
      .catch(() => setError('Could not load stats'))
  }, [])

  if (error) return <p className="error-box">{error}</p>
  if (!stats) return <Spinner />

  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Community</h1>
        <p className="mt-1 text-slate-500">What students are teaching and learning together.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Tile icon={Clock} value={stats.hoursExchanged} label="hours exchanged" color="bg-linear-to-br from-teal-500 to-emerald-600" />
        <Tile icon={Handshake} value={stats.sessions} label="completed sessions" color="bg-linear-to-br from-amber-400 to-orange-500" />
      </div>

      {stats.sessions === 0 && <EmptyState icon={Handshake} title="No sessions yet">Be the first to complete one!</EmptyState>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Ranking
          title="Top skills"
          icon={Flame}
          barColor="bg-linear-to-r from-teal-500 to-emerald-500"
          rows={stats.topSkills.map((s) => ({ ...s, key: s.skill }))}
        >
          {(s) => (
            <>
              {s.skill} <span className="font-normal text-slate-400">· {s.category}</span>
            </>
          )}
        </Ranking>
        <Ranking
          title="Top helpers"
          icon={Crown}
          barColor="bg-linear-to-r from-amber-400 to-orange-500"
          rows={stats.topHelpers.map((h) => ({ ...h, key: h.id }))}
        >
          {(h) => (
            <Link to={`/profile/${h.id}`} className="flex items-center gap-2 hover:text-teal-700">
              <Avatar name={h.name} id={h.id} size="sm" /> {h.name}
            </Link>
          )}
        </Ranking>
      </div>
    </div>
  )
}
