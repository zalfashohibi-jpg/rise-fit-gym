import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksPengguna } from '@/lib/i18n/pengguna'
import { isi } from '@/lib/i18n/umum'
import { formatTanggal } from '@/lib/tanggal'
import { ALAMAT_TIPE } from '@/lib/pengguna'
import { gayaInput, gayaTombolKecil } from '@/components/FormKit'
import { ubahStatusPengguna } from './aksi'

const BATAS_AMBIL = 500

export default async function DaftarPengguna({ tipe, searchParams }) {
  const sp = await searchParams
  const bahasa = await bahasaAktif()
  const t = ambilTeksPengguna(bahasa)
  const j = t.tipe[tipe]
  const dasar = ALAMAT_TIPE[tipe]
  const adaSpesialisasi = tipe === 'freelancer'

  const q = String(sp.q ?? '').trim().replace(/[%_,()]/g, ' ').trim()
  const semua = sp.tampil === 'semua'

  const supabase = await createClient()

  let query = supabase
    .from('karyawan')
    .select('id, nama, jabatan, no_hp, tanggal_masuk, spesialisasi, aktif')
    .eq('tipe', tipe)
    .order('nama')
    .limit(BATAS_AMBIL)

  if (!semua) query = query.eq('aktif', true)
  if (q) query = query.or(`nama.ilike.%${q}%,no_hp.ilike.%${q}%,jabatan.ilike.%${q}%`)

  const { data: orang, error } = await query

  if (error) {
    return <p className="p-10 text-red-600">{isi(t.daftar.galat, { pesan: error.message })}</p>
  }

  const kolom = t.daftar.kolom
  const jumlahKolom = adaSpesialisasi ? 6 : 5

  return (
    <main className="p-5 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">{j.judul}</h1>
        <Link href={`${dasar}/baru`} className="rounded-xl bg-lime-300 px-4 py-2 text-sm font-bold text-zinc-950">
          {j.tambah}
        </Link>
      </div>

      <form className="mb-4 grid max-w-2xl gap-3 sm:grid-cols-[2fr_1fr_auto]">
        <input name="q" defaultValue={q} placeholder={j.cari} className={gayaInput} />
        <select name="tampil" defaultValue={semua ? 'semua' : 'aktif'} className={gayaInput}>
          <option value="aktif">{t.daftar.tampil.aktif}</option>
          <option value="semua">{t.daftar.tampil.semua}</option>
        </select>
        <div className="flex gap-2">
          <button className="rounded-xl bg-zinc-950 px-4 py-3 text-sm font-bold text-white">{t.daftar.cari}</button>
          {(q || semua) && (
            <Link href={dasar} className="rounded-xl px-3 py-3 text-sm text-zinc-500">{t.daftar.reset}</Link>
          )}
        </div>
      </form>

      <p className="mb-4 text-xs text-zinc-500">{isi(t.daftar.jumlah, { n: orang.length })}</p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-zinc-500">
              <th className="py-2 pr-4">{kolom.nama}</th>
              <th className="py-2 pr-4">{kolom.jabatan}</th>
              <th className="py-2 pr-4">{kolom.hp}</th>
              <th className="py-2 pr-4">{kolom.masuk}</th>
              {adaSpesialisasi && <th className="py-2 pr-4">{kolom.spesialisasi}</th>}
              <th className="py-2 pr-4">{kolom.aksi}</th>
            </tr>
          </thead>
          <tbody>
            {orang.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-2 pr-4 font-medium">
                  <Link href={`${dasar}/${p.id}`} className="hover:underline">{p.nama}</Link>
                  {!p.aktif && (
                    <span className="ml-2 rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-bold text-zinc-600">
                      {t.daftar.nonaktif}
                    </span>
                  )}
                </td>
                <td className="py-2 pr-4">{p.jabatan}</td>
                <td className="py-2 pr-4">{p.no_hp ?? '—'}</td>
                <td className="py-2 pr-4">{formatTanggal(p.tanggal_masuk, bahasa)}</td>
                {adaSpesialisasi && <td className="py-2 pr-4">{p.spesialisasi ?? '—'}</td>}
                <td className="py-2 pr-4">
                  <div className="flex gap-2">
                    <Link href={`${dasar}/${p.id}`} className={gayaTombolKecil}>{t.daftar.aksi.detail}</Link>
                    <Link href={`${dasar}/${p.id}/edit`} className={gayaTombolKecil}>{t.daftar.aksi.edit}</Link>
                    <form action={ubahStatusPengguna}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="aktif" value={p.aktif ? 'false' : 'true'} />
                      <button className={gayaTombolKecil}>
                        {p.aktif ? t.daftar.aksi.nonaktifkan : t.daftar.aksi.aktifkan}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {orang.length === 0 && (
              <tr>
                <td colSpan={jumlahKolom} className="py-4 text-zinc-400">
                  {q || semua ? t.daftar.kosongCari : j.kosong}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}