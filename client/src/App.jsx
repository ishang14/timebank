import { Route, Routes } from 'react-router-dom'
import Navbar, { Logo } from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import { useAuth } from './context/AuthContext'
import Auth from './pages/Auth'
import Browse from './pages/Browse'
import MyBookings from './pages/MyBookings'
import MyOffers from './pages/MyOffers'
import OfferDetail from './pages/OfferDetail'
import Profile from './pages/Profile'
import Stats from './pages/Stats'
import Wallet from './pages/Wallet'

export default function App() {
  const { user } = useAuth()
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {/* Logged-in users get the account sidebar on the right */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8">
        <main className="min-w-0 flex-1">
          <Routes>
            <Route path="/" element={<Browse />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/offers/:id" element={<OfferDetail />} />
            <Route path="/my-offers" element={<ProtectedRoute><MyOffers /></ProtectedRoute>} />
            <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/stats" element={<Stats />} />
          </Routes>
        </main>
        {user && <Sidebar />}
      </div>
      <footer className="border-t border-slate-200 bg-white/60 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-slate-500 sm:flex-row">
          <Logo />
          <p className="text-center">Everyone is good at something. Share an hour, earn an hour.</p>
        </div>
      </footer>
    </div>
  )
}
