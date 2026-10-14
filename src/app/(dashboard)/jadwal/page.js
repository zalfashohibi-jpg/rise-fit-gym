import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksKelas } from '@/lib/i18n/kelas'
import { isi } from '@/lib/i18n/umum'
import { formatTanggal, hariIniJakarta } from '@/lib/tanggal'
import {
  WARNA_STATUS_KELAS,
  formatMenit,
  jamSelesai,
  statusKelas,
  waktuSekarangJakarta,
} from '@/lib/kelas'
import TombolHapus from '@/components/TombolHapus'
import { gayaInput, gayaTombolKecil } from '@/components/FormKit'
import { hapusKelas } from './aksi'

const BATAS_AMBIL = 200

export default async function ManajemenKelasPage({ searchParams }) {
  const sp = await searchParams
  const bahasa = await bahasaAktif()
  const t = ambilTeksKelas(bahasa)

  const q = String(sp.q ?? '').trim().replace(/[%_,()]/g, ' ').trim()
  const tampil = ['lalu', 'semua'].includes(sp.tampil) ? sp.tampil : 'mendatang'
  const hariIni = hariIniJakarta()

  const supabase = await createClient()

  let query = supabase
    .from('schedule')
    .select(
      'id, nama_kelas, tipe_kelas, tanggal, jam_mulai, durasi_menit, kapasitas, dibatalkan, instruktur:karyawan!instruktur_id(nama, tipe), kelas_peserta(count)'
    )
    .limit(BATAS_AMBIL)

  if (q) query = query.ilike('nama_kelas', `%${q}%`)

  if (tampil === 'mendatang') {
    query = query.gte('tanggal', hariIni).order('tanggal').order('jam_mulai')
  } else {
    if (tampil === 'lalu') query = query.lt('tanggal', hariIni)
    query = query.order('tanggal', { ascending: false }).order('jam_mulai', { ascending: false })
  }

  const { data: kelas, error } = await query

  if (error) {
    return <p className="p-10 text-red-600">{isi(t.daftar.galat, { pesan: error.message })}</p>
  }

  const sekarang = waktuSekarangJakarta()
  const kolom = t.daftar.kolom

  return (
    <main className="p-5 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">{t.daftar.judul}</h1>
        <Link href="/jadwal/baru" className="rounded-xl bg-lime-300 px-4 py-2 text-sm font-bold text-zinc-950">
          {t.daftar.tambah}
        </Link>
      </div>

      <form className="mb-4 grid max-w-2xl gap-3 sm:grid-cols-[2fr_1fr_auto]">
        <input name="q" defaultValue={q} placeholder={t.daftar.cari} className={gayaInput} />
        <select name="tampil" defaultValue={tampil} className={gayaInput}>
          <option value="mendatang">{t.daftar.tampil.mendatang}</option>
          <option value="lalu">{t.daftar.tampil.lalu}</option>
          <option value="semua">{t.daftar.tampil.semua}</option>
        </select>
        <div className="flex gap-2">
          <button className="rounded-xl bg-zinc-950 px-4 py-3 text-sm font-bold text-white">{t.daftar.cariTombol}</button>
          {(q || tampil !== 'mendatang') && (
            <Link href="/jadwal" className="rounded-xl px-3 py-3 text-sm text-zinc-500">{t.daftar.reset}</Link>
          )}
        </div>
      </form>

      <p className="mb-4 text-xs text-zinc-500">{isi(t.daftar.jumlah, { n: kelas.length })}</p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-zinc-500">
              <th className="py-2 pr-4">{kolom.nama}</th>
              <th className="py-2 pr-4">{kolom.instruktur}</th>
              <th className="py-2 pr-4">{kolom.tipe}</th>
              <th className="py-2 pr-4">{kolom.tanggal}</th>
              <th className="py-2 pr-4">{kolom.jam}</th>
              <th className="py-2 pr-4">{kolom.durasi}</th>
              <th className="py-2 pr-4">{kolom.kapasitas}</th>
              <th className="py-2 pr-4">{kolom.status}</th>
              <th className="py-2 pr-4">{kolom.aksi}</th>
            </tr>
          </thead>
          <tbody>
            {kelas.map((k) => {
              const jam = k.jam_mulai.slice(0, 5)
              const status = statusKelas(k, sekarang)
              const terdaftar = k.kelas_peserta?.[0]?.count ?? 0
              return (
                <tr key={k.id} className="border-b">
                  <td className="py-2 pr-4">
                    <Link href={`/jadwal/${k.id}`} className="font-medium hover:underline">{k.nama_kelas}</Link>
                  </td>
                  <td className="py-2 pr-4">
                    {k.instruktur?.nama ?? '—'}
                    {k.instruktur && (
                      <div className="text-xs text-zinc-500">
                        {k.instruktur.tipe === 'freelancer' ? t.form.grupFreelancer : t.form.grupTrainer}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-4">{t.tipe[k.tipe_kelas] ?? k.tipe_kelas}</td>
                  <td className="py-2 pr-4">{formatTanggal(k.tanggal, bahasa)}</td>
                  <td className="py-2 pr-4">{jam} – {jamSelesai(jam, k.durasi_menit)}</td>
                  <td className="py-2 pr-4">{formatMenit(k.durasi_menit, bahasa)}</td>
                  <td className="py-2 pr-4">
                    <Link href={`/jadwal/${k.id}`} className="hover:underline">{terdaftar} / {k.kapasitas}</Link>
                  </td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${WARNA_STATUS_KELAS[status]}`}>
                      {t.status[status]}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-2">
                      <Link href={`/jadwal/${k.id}/edit`} className={gayaTombolKecil}>{t.daftar.aksi.edit}</Link>
                      <TombolHapus
                        aksi={hapusKelas}
                        id={k.id}
                        label={t.daftar.aksi.hapus}
                        pesan={isi(t.daftar.konfirmasiHapus, { nama: k.nama_kelas })}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
            {kelas.length === 0 && (
              <tr>
                <td colSpan={9} className="py-4 text-zinc-400">
                  {q || tampil !== 'mendatang' ? t.daftar.kosongCari : t.daftar.kosong}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}