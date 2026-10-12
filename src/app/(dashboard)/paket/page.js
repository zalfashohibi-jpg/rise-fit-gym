import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksPaket } from '@/lib/i18n/paket'
import { formatDurasi } from '@/lib/paket'
import TombolHapus from '@/components/TombolHapus'
import { hapusPaket, ubahStatus } from './aksi'

export default async function DaftarPaketPage() {
  const bahasa = await bahasaAktif()
  const t = ambilTeksPaket(bahasa)
  const supabase = await createClient()

  const { data: paket, error } = await supabase
    .from('paket_membership')
    .select('*')
    .order('jenis')
    .order('durasi_hari')

  if (error) {
    return <p className="p-10 text-red-600">{error.message}</p>
  }

  return (
    <main className="p-5 sm:p-8">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">{t.daftar.judul}</h1>
        <Link href="/paket/baru" className="rounded-xl bg-lime-300 px-4 py-2 text-sm font-bold text-zinc-950">
          {t.daftar.buat}
        </Link>
      </div>
      <p className="mb-6 text-sm text-zinc-500">{t.daftar.deskripsi}</p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-zinc-500">
              <th className="py-2 pr-4">{t.daftar.kolom.nama}</th>
              <th className="py-2 pr-4">{t.daftar.kolom.jenis}</th>
              <th className="py-2 pr-4">{t.daftar.kolom.harga}</th>
              <th className="py-2 pr-4">{t.daftar.kolom.durasi}</th>
              <th className="py-2 pr-4">{t.daftar.kolom.konversi}</th>
              <th className="py-2 pr-4">{t.daftar.kolom.sesi}</th>
              <th className="py-2 pr-4">{t.daftar.kolom.kelas}</th>
              <th className="py-2 pr-4">{t.daftar.kolom.status}</th>
              <th className="py-2 pr-4">{t.daftar.kolom.aksi}</th>
            </tr>
          </thead>
          <tbody>
            {paket.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-2 pr-4">
                  <div className="font-medium">{p.nama}</div>
                  {p.catatan && <div className="mt-0.5 text-xs text-zinc-500">{p.catatan}</div>}
                </td>
                <td className="py-2 pr-4">{t.jenis[p.jenis] ?? p.jenis}</td>
                <td className="py-2 pr-4">Rp {p.harga.toLocaleString('id-ID')}</td>
                <td className="py-2 pr-4">{p.durasi_hari}</td>
                <td className="py-2 pr-4">{formatDurasi(p.durasi_hari, bahasa)}</td>
                <td className="py-2 pr-4">{p.jumlah_sesi ?? t.daftar.tanpaBatas}</td>
                <td className="py-2 pr-4">{p.kelas ? t.kelas[p.kelas] : '—'}</td>
                <td className="py-2 pr-4">
                  <form action={ubahStatus}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="aktif" value={p.aktif ? 'false' : 'true'} />
                    <button
                      title={t.daftar.klikUbahStatus}
                      className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                        p.aktif ? 'bg-lime-100 text-lime-800' : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {p.aktif ? t.status.aktif : t.status.nonaktif}
                    </button>
                  </form>
                </td>
                <td className="py-2 pr-4">
                  <TombolHapus
                    aksi={hapusPaket}
                    id={p.id}
                    label={t.daftar.hapus}
                    pesan={t.daftar.konfirmasiHapus.replace('{nama}', p.nama)}
                  />
                </td>
              </tr>
            ))}
            {paket.length === 0 && (
              <tr><td colSpan={9} className="py-4 text-zinc-400">{t.daftar.kosong}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}