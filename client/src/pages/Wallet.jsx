import { ArrowDownLeft, ArrowUpRight, Receipt } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../api/client'
import { Coin, EmptyState, Spinner } from '../components/ui'
import { useAuth } from '../context/AuthContext'

export default function Wallet() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get('/wallet')
      .then((res) => setWallet(res.data))
      .catch(() => setError('Could not load wallet'))
  }, [])

  if (error) return <p className="error-box">{error}</p>
  if (!wallet) return <Spinner />

  return (
    <div className="space-y-8">
      <h1 className="page-title">Wallet</h1>

      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-amber-300 via-amber-400 to-orange-400 p-8 text-amber-950 shadow-xl shadow-amber-500/25">
        <div className="pointer-events-none absolute -top-16 -right-10 h-56 w-56 rounded-full bg-white/40 blur-2xl" />
        <p className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase opacity-90">
          <Coin size={22} /> Your balance
        </p>
        <p className="mt-2 flex items-baseline gap-3 font-display text-6xl font-bold sm:text-7xl">
          {wallet.balance} <span className="font-sans text-2xl font-semibold opacity-80">{wallet.balance === 1 ? 'credit' : 'credits'}</span>
        </p>
        <p className="mt-2 text-sm font-medium opacity-80">Each credit is one hour of someone's time. Teach to earn more.</p>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-slate-900">History</h2>
        {wallet.transactions.length === 0 && (
          <EmptyState icon={Receipt} title="No transactions yet">Credits move when a booking is marked completed.</EmptyState>
        )}
        <ul className="space-y-3">
          {wallet.transactions.map((t) => {
            const spent = t.fromUserId === user.id
            return (
              <li key={t.id} className="card flex items-center gap-4 p-4">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${spent ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {spent ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{t.booking.offer.title}</p>
                  <p className="text-sm text-slate-500">{spent ? `Paid to ${t.to.name}` : `Received from ${t.from.name}`}</p>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${spent ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {spent ? '-' : '+'}
                    {t.amount}
                  </p>
                  <p className="text-xs text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
