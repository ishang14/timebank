import { Lock, Mail, Quote, User } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Coin } from '../components/ui'
import { useAuth } from '../context/AuthContext'

function Field({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon size={16} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" />
      <input {...props} className="input pl-10" />
    </div>
  )
}

export default function Auth() {
  const { user, authenticate } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  if (user) return <Navigate to="/" replace />

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      // Login does not need a name
      const data = mode === 'signup' ? form : { email: form.email, password: form.password }
      await authenticate(mode, data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    }
  }

  const isLogin = mode === 'login'
  return (
    <div className="card mx-auto mt-4 grid sm:mt-10 max-w-4xl overflow-hidden md:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-teal-700 via-teal-800 to-teal-950 p-10 text-white md:flex">
        <div className="pointer-events-none absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
        <Quote size={36} className="text-amber-300" />
        <div className="relative">
          <p className="font-display text-3xl leading-snug font-bold">The best way to learn something is to trade it.</p>
          <p className="mt-4 flex items-center gap-2 text-teal-100">
            <Coin size={20} /> New members start with 3 free credits.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4 p-8 sm:p-10">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">{isLogin ? 'Welcome back' : 'Join TimeBank'}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {isLogin ? 'Log in to book skills and manage your offers.' : 'Create an account and start trading hours.'}
          </p>
        </div>
        {!isLogin && <Field icon={User} name="name" placeholder="Your name" value={form.name} onChange={change} />}
        <Field icon={Mail} name="email" type="email" placeholder="Email" value={form.email} onChange={change} />
        <Field icon={Lock} name="password" type="password" placeholder="Password (6+ characters)" value={form.password} onChange={change} />
        {error && <p className="error-box">{error}</p>}
        <button className="btn btn-primary w-full py-3">{isLogin ? 'Log in' : 'Create account'}</button>
        <p className="text-center text-sm text-slate-500">
          {isLogin ? 'New here?' : 'Already a member?'}{' '}
          <button type="button" onClick={() => setMode(isLogin ? 'signup' : 'login')} className="cursor-pointer font-semibold text-teal-600 hover:underline">
            {isLogin ? 'Create an account' : 'Log in'}
          </button>
        </p>
      </form>
    </div>
  )
}
