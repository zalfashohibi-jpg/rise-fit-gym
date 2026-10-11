'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
import Ikon from '@/components/Ikon'
import { ambilKamus, BAHASA_TERSEDIA } from '@/lib/i18n/kamus'
import { ubahBahasa } from '@/lib/i18n/aksi'

// href null = halamannya belum dibuat
const menuUtama = { ikon: 'grid', kunci: 'dashboard', href: '/' }

const kelompok = [
  {
    kunci: 'membership',
    ikon: 'users',
    item: [
      { kunci: 'listPackage', href: '/paket' },
      { kunci: 'createPackage', href: null },
      { kunci: 'memberList', href: '/member' },
    ],
  },
  {
    kunci: 'operasional',
    ikon: 'calendar',
    item: [
      { kunci: 'classManagement', href: '/jadwal' },
      { kunci: 'sesiLatihan', href: '/pt' },
      { kunci: 'absensi', href: null },
    ],
  },
  {
    kunci: 'userManagement',
    ikon: 'badge',
    item: [
      { kunci: 'staff', href: '/karyawan' },
      { kunci: 'freelancer', href: null },
      { kunci: 'penggajian', href: null },
    ],
  },
  {
    kunci: 'penjualan',
    ikon: 'cart',
    item: [
      { kunci: 'stok', href: '/stok' },
      { kunci: 'pos', href: '/stok/jual' },
      { kunci: 'transaksi', href: '/invoice' },
    ],
  },
  {
    kunci: 'pengaturan',
    ikon: 'sliders',
    item: [
      { kunci: 'pengumuman', href: null },
      { kunci: 'tnc', href: '/peraturan' },
    ],
  },
]

function cocok(pathname, href) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

// kalau beberapa menu cocok (misal /stok dan /stok/jual), pakai yang alamatnya paling spesifik
function cariAktif(pathname) {
  const kandidat = [{ grup: null, item: menuUtama }]
  for (const grup of kelompok) {
    for (const item of grup.item) kandidat.push({ grup, item })
  }

  let terbaik = null
  for (const k of kandidat) {
    if (!k.item.href || !cocok(pathname, k.item.href)) continue
    if (!terbaik || k.item.href.length > terbaik.item.href.length) terbaik = k
  }
  return terbaik
}

const kelasLink = (menyala) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
    menyala ? 'bg-lime-300 text-zinc-950' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
  }`

export default function DashboardShell({ nama, role, bahasa, children }) {
  const pathname = usePathname()
  const [buka, setBuka] = useState(false) // menu geser di HP
  const [pilihan, setPilihan] = useState({}) // kelompok yang dibuka atau ditutup manual

  const teks = ambilKamus(bahasa)
  const aktif = cariAktif(pathname)
  const inisial = nama
    .split(' ')
    .filter(Boolean)
    .map((kata) => kata[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // tanpa pilihan manual, kelompok yang berisi halaman aktif otomatis terbuka
  function kelompokTerbuka(grup) {
    return pilihan[grup.kunci] ?? aktif?.grup?.kunci === grup.kunci
  }

  function gantiKelompok(grup) {
    setPilihan((lama) => ({ ...lama, [grup.kunci]: !kelompokTerbuka(grup) }))
  }

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
              <div className="text-lg font-extrabold tracking-tight">{teks.namaApp}</div>
              <div className="text-[11px] font-bold tracking-[0.18em] text-zinc-500">{teks.subjudul}</div>
            </div>
          </div>
          <button onClick={() => setBuka(false)} className="lg:hidden" aria-label={teks.ui.tutupMenu}>
            <Ikon nama="close" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <Link
            href={menuUtama.href}
            onClick={() => setBuka(false)}
            className={kelasLink(aktif?.item.kunci === 'dashboard')}
          >
            <Ikon nama={menuUtama.ikon} />
            <span className="flex-1">{teks.menu.dashboard}</span>
          </Link>

          {kelompok.map((grup) => {
            const terbuka = kelompokTerbuka(grup)
            const berisiAktif = aktif?.grup?.kunci === grup.kunci
            const idDaftar = `menu-${grup.kunci}`

            return (
              <div key={grup.kunci} className="mt-1">
                <button
                  type="button"
                  onClick={() => gantiKelompok(grup)}
                  aria-expanded={terbuka}
                  aria-controls={idDaftar}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-white/5 hover:text-white ${
                    berisiAktif ? 'text-white' : 'text-zinc-400'
                  }`}
                >
                  <Ikon nama={grup.ikon} />
                  <span className="flex-1 text-left">{teks.grup[grup.kunci]}</span>
                  <span className={terbuka ? 'rotate-180' : ''}>
                    <Ikon nama="chevron" ukuran={15} />
                  </span>
                </button>

                {terbuka && (
                  <div id={idDaftar} className="ml-[22px] mt-1 space-y-0.5 border-l border-white/10 pl-3">
                    {grup.item.map((item) => {
                      const label = teks.menu[item.kunci]

                      if (!item.href) {
                        return (
                          <div
                            key={item.kunci}
                            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-600"
                          >
                            <span>{label}</span>
                            <span className="text-[10px] font-bold">{teks.ui.segera}</span>
                          </div>
                        )
                      }

                      const menyala = aktif?.item.kunci === item.kunci
                      return (
                        <Link
                          key={item.kunci}
                          href={item.href}
                          onClick={() => setBuka(false)}
                          className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                            menyala ? 'bg-lime-300 text-zinc-950' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <form action={ubahBahasa} className="mx-4 mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-500">{teks.ui.bahasa}</span>
          <div className="flex rounded-lg border border-white/10 p-0.5">
            {BAHASA_TERSEDIA.map((kode) => (
              <button
                key={kode}
                type="submit"
                name="bahasa"
                value={kode}
                className={`rounded-md px-3 py-1 text-xs font-bold ${
                  bahasa === kode ? 'bg-white text-zinc-950' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {kode.toUpperCase()}
              </button>
            ))}
          </div>
        </form>

        <div className="mx-4 mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-full bg-zinc-700 text-xs font-bold">{inisial}</div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{nama}</div>
              <div className="text-xs text-zinc-500">{role}</div>
            </div>
          </div>
          <LogoutButton label={teks.ui.keluar} />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center gap-3 border-b border-zinc-200 bg-white px-5 sm:px-8">
          <button
            onClick={() => setBuka(true)}
            className="grid size-10 place-items-center rounded-xl bg-zinc-950 text-xl text-white lg:hidden"
            aria-label={teks.ui.bukaMenu}
          >
            ≡
          </button>
          <div className="flex items-center gap-2 text-base font-bold tracking-tight sm:text-lg">
            {aktif?.grup && (
              <>
                <span className="font-medium text-zinc-400">{teks.grup[aktif.grup.kunci]}</span>
                <span className="text-zinc-300">/</span>
              </>
            )}
            <span>{aktif ? teks.menu[aktif.item.kunci] : teks.menu.dashboard}</span>
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}