'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
import Ikon from '@/components/Ikon'
import { seksiMenu, menuDashboard } from '@/components/menuSidebar'
import { bolehAkses, PERAN } from '@/lib/akses'
import { ambilKamus, BAHASA_TERSEDIA } from '@/lib/i18n/kamus'
import { ubahBahasa } from '@/lib/i18n/aksi'

// semua tujuan klik, dipakai untuk menentukan menu yang sedang aktif
const DAUN = [
  { item: menuDashboard, induk: null },
  ...seksiMenu.flatMap((s) =>
    s.item.flatMap((m) => (m.anak ? m.anak.map((a) => ({ item: a, induk: m })) : [{ item: m, induk: null }]))
  ),
]

function cocok(pathname, href) {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

// kalau beberapa menu cocok (misal /paket dan /paket/baru), pakai yang alamatnya paling spesifik
function cariAktif(pathname) {
  let terbaik = null
  for (const d of DAUN) {
    if (!d.item.href || !cocok(pathname, d.item.href)) continue
    if (!terbaik || d.item.href.length > terbaik.item.href.length) terbaik = d
  }
  return terbaik
}

const kelasMenu = (menyala) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
    menyala ? 'bg-lime-300 text-zinc-950' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
  }`

export default function DashboardShell({ nama, role, bahasa, children }) {
  const pathname = usePathname()
  const [buka, setBuka] = useState(false) // menu geser di HP
  const [pilihan, setPilihan] = useState({}) // dropdown yang dibuka atau ditutup manual

  const teks = ambilKamus(bahasa)
  const aktif = cariAktif(pathname)
  const punyaPeran = Object.values(PERAN).includes(role)

  const seksiTampil = seksiMenu
    .map((s) => ({ ...s, item: s.item.filter((m) => bolehAkses(role, m.akses)) }))
    .filter((s) => s.item.length > 0)

  const inisial = nama
    .split(' ')
    .filter(Boolean)
    .map((kata) => kata[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  // tanpa pilihan manual, dropdown yang berisi halaman aktif otomatis terbuka
  const terbuka = (m) => pilihan[m.kunci] ?? aktif?.induk?.kunci === m.kunci
  const gantiBuka = (m) => setPilihan((lama) => ({ ...lama, [m.kunci]: !terbuka(m) }))
  const tutupMenu = () => setBuka(false)

  function renderAnak(a) {
    const label = teks.menu[a.kunci]

    if (!a.href) {
      return (
        <div key={a.kunci} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-zinc-600">
          <span>{label}</span>
          <span className="text-[10px] font-bold">{teks.ui.segera}</span>
        </div>
      )
    }

    const menyala = aktif?.item.kunci === a.kunci
    return (
      <Link
        key={a.kunci}
        href={a.href}
        onClick={tutupMenu}
        className={`block rounded-lg px-3 py-2 text-sm font-medium ${
          menyala ? 'bg-lime-300 text-zinc-950' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        {label}
      </Link>
    )
  }

  function renderItem(m, s) {
    const label = teks.menu[m.kunci]

    if (m.anak) {
      const bukaDaftar = terbuka(m)
      const berisiAktif = aktif?.induk?.kunci === m.kunci
      const idDaftar = `menu-${m.kunci}`

      return (
        <div key={m.kunci} className="mt-1">
          <button
            type="button"
            onClick={() => gantiBuka(m)}
            aria-expanded={bukaDaftar}
            aria-controls={idDaftar}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-white/5 hover:text-white ${
              berisiAktif ? 'text-white' : 'text-zinc-400'
            }`}
          >
            <span className={s.warnaIkon}><Ikon nama={m.ikon} /></span>
            <span className="flex-1 text-left">{label}</span>
            <span className={bukaDaftar ? 'rotate-180' : ''}><Ikon nama="chevron" ukuran={15} /></span>
          </button>

          {bukaDaftar && (
            <div id={idDaftar} className="ml-[22px] mt-1 space-y-0.5 border-l border-white/10 pl-3">
              {m.anak.map(renderAnak)}
            </div>
          )}
        </div>
      )
    }

    if (!m.href) {
      return (
        <div
          key={m.kunci}
          className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-600"
        >
          <Ikon nama={m.ikon} />
          <span className="flex-1">{label}</span>
          <span className="text-[10px] font-bold">{teks.ui.segera}</span>
        </div>
      )
    }

    const menyala = aktif?.item.kunci === m.kunci
    return (
      <Link key={m.kunci} href={m.href} onClick={tutupMenu} className={`${kelasMenu(menyala)} mt-1`}>
        <span className={menyala ? '' : s.warnaIkon}><Ikon nama={m.ikon} /></span>
        <span className="flex-1">{label}</span>
      </Link>
    )
  }

  const judulHalaman = aktif ? teks.menu[aktif.item.kunci] : teks.menu.dashboard

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950 lg:flex">
      {buka && <div className="fixed inset-0 z-30 bg-zinc-950/50 lg:hidden" onClick={tutupMenu} />}

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
          <button onClick={tutupMenu} className="lg:hidden" aria-label={teks.ui.tutupMenu}>
            <Ikon nama="close" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <Link
            href={menuDashboard.href}
            onClick={tutupMenu}
            className={kelasMenu(aktif?.item.kunci === menuDashboard.kunci)}
          >
            <Ikon nama={menuDashboard.ikon} />
            <span className="flex-1">{teks.menu.dashboard}</span>
          </Link>

          {!punyaPeran && (
            <p className="mt-4 rounded-xl bg-amber-500/10 px-3 py-2 text-xs text-amber-300">{teks.ui.tanpaPeran}</p>
          )}

          {seksiTampil.map((s, urutan) => (
            <section key={s.kunci} className={urutan === 0 ? 'mt-6' : 'mt-6 border-t border-white/10 pt-6'}>
              <div className="mb-2 flex items-center gap-2 px-3">
                <span className={`size-1.5 rounded-full ${s.penanda}`} />
                <span className="text-[11px] font-bold tracking-[0.16em] text-zinc-500">{teks.seksi[s.kunci]}</span>
              </div>
              {s.item.map((m) => renderItem(m, s))}
            </section>
          ))}
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
              <div className="text-xs text-zinc-500">{teks.peran[role] ?? (role || '—')}</div>
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
            {aktif?.induk && (
              <>
                <span className="font-medium text-zinc-400">{teks.menu[aktif.induk.kunci]}</span>
                <span className="text-zinc-300">/</span>
              </>
            )}
            <span>{judulHalaman}</span>
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}