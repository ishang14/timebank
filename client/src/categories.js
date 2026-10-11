import { Code2, GraduationCap, Languages, Music, Palette, Sparkles } from 'lucide-react'

// Same names as server/src/lib/categories.js. Each has an icon and colours for cards/badges.
export const CATEGORY_STYLES = {
  Tutoring: { icon: GraduationCap, gradient: 'from-sky-600 to-blue-700', soft: 'bg-sky-50 text-sky-700' },
  Coding: { icon: Code2, gradient: 'from-teal-600 to-emerald-700', soft: 'bg-teal-50 text-teal-700' },
  Languages: { icon: Languages, gradient: 'from-lime-600 to-green-700', soft: 'bg-lime-50 text-lime-800' },
  Music: { icon: Music, gradient: 'from-rose-500 to-pink-700', soft: 'bg-pink-50 text-pink-700' },
  Design: { icon: Palette, gradient: 'from-amber-500 to-orange-600', soft: 'bg-orange-50 text-orange-700' },
  Other: { icon: Sparkles, gradient: 'from-stone-500 to-stone-700', soft: 'bg-slate-100 text-slate-700' },
}

export const CATEGORIES = Object.keys(CATEGORY_STYLES)

// Slot dates come from the API as ISO strings; show a friendly day
export const formatDate = (iso) =>
  new Date(iso.slice(0, 10) + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
