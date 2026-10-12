import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksMember } from '@/lib/i18n/member'
import { isi } from '@/lib/i18n/umum'
import { formatTanggal, hariIniJakarta, tanggalValid } from '@/lib/tanggal'
import { WARNA_STATUS, statusMember } from '@/lib/member'
import { gayaInput, gayaTombolKecil, gayaTombolLain } from '@/components/FormKit'

const PER_HALAMAN = 25
const BATAS_AMBIL = 1000

function buatUrl(filter, halaman) {
  const params = new URLSearchParams()
  for (const [kunci, nilai] of Object.entries(filter)) {
    if (nilai) params.set(kunci, nilai)
  }
  if (halaman > 1) params.set('hal', String(halaman))

  const teks = params.toString()
  return teks ? `/member?${teks}` : '/member'
}

export default async function DaftarMemberPage({ searchParams }) {
  const sp = await searchParams
  const bahasa = await bahasaAktif()
  const t = ambilTeksMember(bahasa)

  const q = String(sp.q ?? '').trim().replace(/[%_,()]/g, ' ').trim()
  const filterPaket = String(sp.paket ?? '')
  const dari = tanggalValid(String(sp.dari ?? '')) ? String(sp.dari) : ''
  const sampai = tanggalValid(String(sp.sampai ?? '')) ? String(sp.sampai) : ''
  const halamanMinta = Number.parseInt(String(sp.hal ?? '1'), 10)

  const supabase = await createClient()

  let query = supabase
    .from('member')
    .select('id, nama, no_hp, membership(id, paket, tanggal_mulai, tanggal_exp)')
    .order('nama')
    .order('tanggal_mulai', { referencedTable: 'membership', ascending: false })
    .order('id', { referencedTable: 'membership', ascending: false })
    .limit(BATAS_AMBIL)

  if (q) query = query.or(`nama.ilike.%${q}%,no_hp.ilike.%${q}%`)

  const [anggota, opsi] = await Promise.all([
    query,
    supabase.from('membership').select('paket').limit(BATAS_AMBIL),
  ])

  if (anggota.error) {
    return <p className="p-10 text-red-600">{isi(t.daftar.galat, { pesan: anggota.error.message })}</p>
  }

  const hariIni = hariIniJakarta()
  const opsiPaket = [...new Set((opsi.data ?? []).map((x) => x.paket))].sort()

  // filter paket dan tanggal aktivasi berlaku untuk membership terbaru tiap member
  const baris = anggota.data
    .map((m) => ({ ...m, terkini: m.membership?.[0] ?? null }))
    .filter((m) => !filterPaket || m.terkini?.paket === filterPaket)
    .filter((m) => !dari || (m.terkini && m.terkini.tanggal_mulai >= dari))
    .filter((m) => !sampai || (m.terkini && m.terkini.tanggal_mulai <= sampai))

  const jumlahHalaman = Math.max(1, Math.ceil(baris.length / PER_HALAMAN))
  const halaman = Math.min(Math.max(Number.isNaN(halamanMinta) ? 1 : halamanMinta, 1), jumlahHalaman)
  const tampil = baris.slice((halaman - 1) * PER_HALAMAN, halaman * PER_HALAMAN)

  const filter = { q, paket: filterPaket, dari, sampai }
  const adaFilter = Boolean(q || filterPaket || dari || sampai)

  return (
    <main className="p-5 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">{t.daftar.judul}</h1>
        <Link href="/member/baru" className="rounded-xl bg-lime-300 px-4 py-2 text-sm font-bold text-zinc-950">
          {t.daftar.tambah}
        </Link>
      </div>

      <form className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1.5fr_1fr_1fr_auto] lg:items-end">
        <input name="q" defaultValue={q} placeholder={t.daftar.cari} className={gayaInput} />
        <select name="paket" defaultValue={filterPaket} className={gayaInput}>
          <option value="">{t.daftar.semuaPaket}</option>
          {opsiPaket.map((nama) => (
            <option key={nama} value={nama}>{nama}</option>
          ))}
        </select>
        <label className="space-y-1 text-xs text-zinc-500">
          <span>{t.daftar.dari}</span>
          <input name="dari" type="date" defaultValue={dari} className={gayaInput} />
        </label>
        <label className="space-y-1 text-xs text-zinc-500">
          <span>{t.daftar.sampai}</span>
          <input name="sampai" type="date" defaultValue={sampai} className={gayaInput} />
        </label>
        <div className="flex gap-2">
          <button className="rounded-xl bg-zinc-950 px-4 py-3 text-sm font-bold text-white">{t.daftar.terapkan}</button>
          {adaFilter && (
            <Link href="/member" className="rounded-xl px-3 py-3 text-sm text-zinc-500">{t.daftar.reset}</Link>
          )}
        </div>
      </form>

      <p className="mb-4 text-xs text-zinc-500">{isi(t.daftar.jumlah, { n: baris.length })}</p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-zinc-500">
              <th className="py-2 pr-4">{t.daftar.kolom.nama}</th>
              <th className="py-2 pr-4">{t.daftar.kolom.paket}</th>
              <th className="py-2 pr-4">{t.daftar.kolom.exp}</th>
              <th className="py-2 pr-4">{t.daftar.kolom.status}</th>
              <th className="py-2 pr-4">{t.daftar.kolom.aksi}</th>
            </tr>
          </thead>
          <tbody>
            {tampil.map((m) => {
              const status = statusMember(m.terkini, hariIni)
              return (
                <tr key={m.id} className="border-b">
                  <td className="py-2 pr-4">
                    <Link href={`/member/${m.id}`} className="font-medium hover:underline">{m.nama}</Link>
                    <div className="text-xs text-zinc-500">{m.no_hp}</div>
                  </td>
                  <td className="py-2 pr-4">{m.terkini?.paket ?? '—'}</td>
                  <td className="py-2 pr-4">{m.terkini ? formatTanggal(m.terkini.tanggal_exp, bahasa) : '—'}</td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${WARNA_STATUS[status]}`}>
                      {t.status[status]}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-2">
                      <Link href={`/member/${m.id}/perpanjang`} className={gayaTombolKecil}>{t.daftar.aksi.perpanjang}</Link>
                      <Link href={`/member/${m.id}/edit`} className={gayaTombolKecil}>{t.daftar.aksi.edit}</Link>
                      <Link href={`/member/${m.id}`} className={gayaTombolKecil}>{t.daftar.aksi.detail}</Link>
                    </div>
                  </td>
                </tr>
              )
            })}
            {tampil.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-zinc-400">
                  {adaFilter ? t.daftar.kosong : t.daftar.belumAda}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {jumlahHalaman > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          {halaman > 1 ? (
            <Link href={buatUrl(filter, halaman - 1)} className={gayaTombolLain}>{t.daftar.sebelumnya}</Link>
          ) : (
            <span />
          )}
          <span className="text-zinc-500">{isi(t.daftar.halaman, { a: halaman, b: jumlahHalaman })}</span>
          {halaman < jumlahHalaman ? (
            <Link href={buatUrl(filter, halaman + 1)} className={gayaTombolLain}>{t.daftar.berikutnya}</Link>
          ) : (
            <span />
          )}
        </div>
      )}

      {anggota.data.length === BATAS_AMBIL && (
        <p className="mt-4 text-xs text-zinc-500">{isi(t.daftar.terpotong, { n: BATAS_AMBIL })}</p>
      )}
    </main>
  )
}