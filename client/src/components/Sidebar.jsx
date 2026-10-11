import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { memberLinks, sidebarLinkClass } from './navLinks'
import { Avatar, Credits } from './ui'

// Pane on the right, shown only when logged in (desktop). On mobile the same links are in the menu.
export default function Sidebar() {
  const { user } = useAuth()

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="card sticky top-24 space-y-5 p-4">
        <Link to={`/profile/${user.id}`} className="flex items-center gap-3 rounded-xl bg-teal-50/70 p-3">
          <Avatar name={user.name} id={user.id} />
          <span className="min-w-0">
            <span className="block truncate font-bold text-slate-900">{user.name}</span>
            <Credits amount={user.balance} unit="credits" />
          </span>
        </Link>

        <div>
          <p className="mb-2 px-3.5 text-xs font-bold tracking-wide text-slate-400 uppercase">My space</p>
          <nav className="space-y-1">
            {memberLinks(user).map(([to, label, Icon]) => (
              <NavLink key={to} to={to} className={sidebarLinkClass}>
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  )
}
