import { CalendarCheck, Store, User, Wallet } from 'lucide-react'

// Links that only exist for logged-in users (sidebar on desktop, menu on mobile)
export const memberLinks = (user) => [
  ['/my-offers', 'My Offers', Store],
  ['/my-bookings', 'My Bookings', CalendarCheck],
  ['/wallet', 'Wallet', Wallet],
  [`/profile/${user.id}`, 'My Profile', User],
]

export const sidebarLinkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
    isActive
      ? 'bg-linear-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-teal-500/25'
      : 'text-slate-600 hover:bg-slate-100'
  }`
