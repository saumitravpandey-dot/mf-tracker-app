'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  BarChart2,
  Layers,
  ArrowLeftRight,
  Upload,
  Database,
  PieChart,
} from 'lucide-react'
import ProfileSelector from './ProfileSelector'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Portfolio', href: '/portfolio', icon: Briefcase },
  { label: 'Analytics', href: '/analytics', icon: TrendingUp },
  { label: 'History', href: '/history', icon: BarChart2 },
  { label: 'Look-Through', href: '/lookthrough', icon: Layers },
  { label: 'Redemptions', href: '/redemptions', icon: ArrowLeftRight },
  { label: 'Import', href: '/import', icon: Upload },
  { label: 'AMFI Data', href: '/amfi', icon: Database },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 bg-zinc-900 text-white flex-shrink-0 flex flex-col">
      <div className="flex items-center gap-2 px-4 py-5 border-b border-zinc-800">
        <PieChart className="w-5 h-5 text-indigo-400" />
        <span className="font-semibold text-base">MF Tracker</span>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white rounded-lg'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
      <ProfileSelector />
    </aside>
  )
}
