import { BarChart3, Compass, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { memberLinks, sidebarLinkClass } from './navLinks'
import { Avatar, Credits } from './ui'

// Public pages only. Account pages live in the sidebar (and the mobile menu).
const links = [
  ['/', 'Browse', Compass],
  ['/stats', 'Community', BarChart3],
]

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-teal-600 to-emerald-600 shadow-md shadow-teal-500/30">
        <svg viewBox="0 0 32 32" className="h-6 w-6" fill="none" stroke="white" strokeWidth="2.6" strokeLinecap="round">
          <circle cx="16" cy="16" r="9" />
          <path d="M16 11v5.2l3.4 2" stroke="#fbbf24" />
        </svg>
      </span>
      <span className="font-display text-xl font-bold tracking-tight text-slate-900">TimeBank</span>
    </Link>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
      isActive ? 'bg-teal-100 text-teal-700' : 'text-slate-600 hover:bg-slate-100'
    }`

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        <Logo />

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {links.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === '/'} className={linkClass}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          {user ? (
            <button onClick={logout} className="btn btn-outline">
              <LogOut size={16} /> Log out
            </button>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Log in / Sign up
            </Link>
          )}
        </div>

        <button className="ml-auto rounded-xl p-2 hover:bg-slate-100 md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu: public links, plus the account section when logged in */}
      {open && (
        <div className="space-y-1 border-t border-slate-200 bg-white px-4 py-3 md:hidden" onClick={() => setOpen(false)}>
          {links.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === '/'} className={linkClass}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
          {user ? (
            <>
              <div className="flex items-center gap-2 px-3.5 pt-3 pb-1">
                <Avatar name={user.name} id={user.id} size="sm" />
                <span className="text-sm font-bold">{user.name}</span>
                <Credits amount={user.balance} />
              </div>
              {memberLinks(user).map(([to, label, Icon]) => (
                <NavLink key={to} to={to} className={sidebarLinkClass}>
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
              <button onClick={logout} className="flex w-full cursor-pointer items-center gap-3 px-3.5 py-2.5 text-sm font-semibold text-slate-600">
                <LogOut size={16} /> Log out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary mt-2 w-full">
              Log in / Sign up
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
