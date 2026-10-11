'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

const icons = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  badge: <><circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0M3 11h3M18 11h3M4 8v6M20 8v6"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  wallet: <><path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h16v11H5a3 3 0 0 1-3-3V6"/><path d="M16 13h2"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></>,
  box: <><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="m3 8 9 5 9-5v8l-9 5-9-5Z"/><path d="M12 13v8"/></>,
  receipt: <><path d="M6 2v20l3-2 3 2 3-2 3 2V2l-3 2-3-2-3 2Z"/><path d="M9 9h6M9 13h6"/></>,
  check: <><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></>,
  megaphone: <><path d="m3 11 15-6v14L3 13Z"/><path d="m11.6 16.5.8 3a2 2 0 0 1-3.8 1L7 15"/></>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
}

function Icon({ name, size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  )
}

// href: null = halamannya belum dibuat ("segera")
const grup = [
  {
    label: 'UTAMA',
    items: [
      { icon: 'grid', label: 'Ringkasan', href: '/' },
      { icon: 'users', label: 'Member', href: '/member',},
      { icon: 'wallet', label: 'Paket membership', href: '/paket' },
    ],
  },
  {
    label: 'TIM',
    items: [
      { icon: 'badge', label: 'Karyawan & trainer', href: '/karyawan' },
      { icon: 'clock', label: 'Absensi', href: null },
      { icon: 'wallet', label: 'Penggajian', href: null },
    ],
  },
  {
    label: 'OPERASIONAL',
    items: [
      { icon: 'calendar', label: 'Jadwal', href: '/jadwal' },
      { icon: 'badge', label: 'Paket PT', href: '/pt' },
      { icon: 'box', label: 'Stok & penjualan', href: '/stok' },
      { icon: 'receipt', label: 'Invoice & transaksi', href: '/invoice' },
    ],
  },
  {
    label: 'SISTEM',
    items: [
      { icon: 'check', label: 'Peraturan & T&C', href: null },
      { icon: 'megaphone', label: 'Pengumuman', href: null },
    ],
  },
]

function cocok(pathname, href) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

export default function DashboardShell({ nama, role, children }) {
  const pathname = usePathname()
  const [buka, setBuka] = useState(false)

  const semuaItem = grup.flatMap((g) => g.items)
  const halamanIni = semuaItem.find((i) => i.href && cocok(pathname, i.href))
  const inisial = nama.split(' ').map((k) => k[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950 lg:flex">
      {buka && (
        <div className="fixed inset-0 z-30 bg-zinc-950/50 lg:hidden" onClick={() => setBuka(false)} />
      )}

      <aside
        className={`${buka ? 'flex' : 'hidden'} fixed inset-y-0 left-0 z-40 w-72 flex-col bg-zinc-950 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:shrink-0`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-7">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-lime-300 font-black text-zinc-950">R</div>
            <div>
              <div className="text-lg font-extrabold tracking-tight">Rise Fit Gym</div>
              <div className="text-[11px] font-bold tracking-[0.18em] text-zinc-500">MANAJEMEN</div>
            </div>
          </div>
          <button onClick={() => setBuka(false)} className="lg:hidden" aria-label="Tutup menu">
            <Icon name="close" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          {grup.map((g) => (
            <div key={g.label} className="mb-5">
              <div className="mb-2 px-3 text-[11px] font-bold tracking-[0.16em] text-zinc-500">{g.label}</div>
              {g.items.map((item) => {
                if (!item.href) {
                  return (
                    <div key={item.label} className="mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600">
                      <Icon name={item.icon} />
                      <span className="flex-1">{item.label}</span>
                      <span className="text-[10px] font-bold">SEGERA</span>
                    </div>
                  )
                }
                const aktif = cocok(pathname, item.href)
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setBuka(false)}
                    className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
                      aktif ? 'bg-lime-300 text-zinc-950' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon name={item.icon} />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="m-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-full bg-zinc-700 text-xs font-bold">{inisial}</div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{nama}</div>
              <div className="text-xs text-zinc-500">{role}</div>
            </div>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center gap-3 border-b border-zinc-200 bg-white px-5 sm:px-8">
          <button
            onClick={() => setBuka(true)}
            className="grid size-10 place-items-center rounded-xl bg-zinc-950 text-xl text-white lg:hidden"
            aria-label="Buka menu"
          >
            ≡
          </button>
          <div className="text-lg font-bold tracking-tight">{halamanIni?.label ?? 'Dashboard'}</div>
        </header>

        {children}
      </div>
    </div>
  )
}