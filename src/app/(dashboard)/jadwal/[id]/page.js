import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksKelas } from '@/lib/i18n/kelas'
import { formatTanggal } from '@/lib/tanggal'
import {
  WARNA_STATUS_KELAS,
  formatMenit,
  jamSelesai,
  statusKelas,
  waktuSekarangJakarta,
} from '@/lib/kelas'
import { gayaTombolKecil, gayaTombolLain } from '@/components/FormKit'
import { tandaiHadir, batalkanPeserta } from '../aksi'
import FormDaftarPeserta from './FormDaftarPeserta'

function Baris({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{children}</dd>
    </div>
  )
}

export default async function DetailKelasPage({ params }) {
  const { id } = await params
  const bahasa = await bahasaAktif()
  const t = ambilTeksKelas(bahasa)
  const d = t.detail
  const supabase = await createClient()

  const [{ data: kelas }, { data: peserta }] = await Promise.all([
    supabase
      .from('schedule')
      .select(
        'id, nama_kelas, tipe_kelas, tanggal, jam_mulai, durasi_menit, kapasitas, dibatalkan, instruktur:karyawan!instruktur_id(nama, tipe)'
      )
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('kelas_peserta')
      .select('id, member_id, status_hadir, member(nama, no_hp)')
      .eq('schedule_id', id)
      .order('id'),
  ])

  if (!kelas) {
    return <p className="p-10">{d.tidakAda}</p>
  }

  // member aktif dengan membership yang berlaku pada tanggal kelas (pemeriksaan akhir ada di database)
  const { data: layak } = await supabase
    .from('member')
    .select('id, nama, no_hp, membership!inner(tanggal_mulai, tanggal_exp)')
    .eq('aktif', true)
    .lte('membership.tanggal_mulai', kelas.tanggal)
    .gte('membership.tanggal_exp', kelas.tanggal)
    .order('nama')

  const daftarPeserta = peserta ?? []
  const sudahTerdaftar = new Set(daftarPeserta.map((p) => p.member_id))
  const bisaDidaftarkan = (layak ?? []).filter((m) => !sudahTerdaftar.has(m.id))

  const jam = kelas.jam_mulai.slice(0, 5)
  const status = statusKelas(kelas, waktuSekarangJakarta())
  const penuh = daftarPeserta.length >= kelas.kapasitas

  return (
    <main className="max-w-3xl p-5 sm:p-8">
      <Link href="/jadwal" className="text-sm text-zinc-500">{d.kembali}</Link>

      <div className="mb-6 mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black tracking-tight">{kelas.nama_kelas}</h1>
          <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${WARNA_STATUS_KELAS[status]}`}>
            {t.status[status]}
          </span>
        </div>
        <Link href={`/jadwal/${kelas.id}/edit`} className={gayaTombolLain}>{t.daftar.aksi.edit}</Link>
      </div>

      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5">
        <dl className="grid gap-5 sm:grid-cols-3">
          <Baris label={d.label.instruktur}>{kelas.instruktur?.nama ?? '—'}</Baris>
          <Baris label={d.label.tipe}>{t.tipe[kelas.tipe_kelas] ?? kelas.tipe_kelas}</Baris>
          <Baris label={d.label.tanggal}>{formatTanggal(kelas.tanggal, bahasa)}</Baris>
          <Baris label={d.label.jam}>{jam} – {jamSelesai(jam, kelas.durasi_menit)}</Baris>
          <Baris label={d.label.durasi}>{formatMenit(kelas.durasi_menit, bahasa)}</Baris>
          <Baris label={d.label.kapasitas}>{daftarPeserta.length} / {kelas.kapasitas}</Baris>
        </dl>
      </div>

      <h2 className="mb-3 text-lg font-bold">{d.peserta.judul}</h2>
      <div className="mb-10 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-zinc-500">
              <th className="py-2 pr-4">{d.peserta.kolom.nama}</th>
              <th className="py-2 pr-4">{d.peserta.kolom.hp}</th>
              <th className="py-2 pr-4">{d.peserta.kolom.status}</th>
              <th className="py-2 pr-4">{d.peserta.kolom.aksi}</th>
            </tr>
          </thead>
          <tbody>
            {daftarPeserta.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-2 pr-4 font-medium">
                  <Link href={`/member/${p.member_id}`} className="hover:underline">{p.member?.nama}</Link>
                </td>
                <td className="py-2 pr-4">{p.member?.no_hp ?? '—'}</td>
                <td className="py-2 pr-4">{d.statusHadir[p.status_hadir] ?? p.status_hadir}</td>
                <td className="py-2 pr-4">
                  <div className="flex gap-2">
                    {p.status_hadir !== 'hadir' && (
                      <form action={tandaiHadir}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="schedule_id" value={kelas.id} />
                        <button className={gayaTombolKecil}>{d.peserta.hadir}</button>
                      </form>
                    )}
                    <form action={batalkanPeserta}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="schedule_id" value={kelas.id} />
                      <button className={gayaTombolKecil}>{d.peserta.batalkan}</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {daftarPeserta.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-zinc-400">{d.peserta.belum}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-lg font-bold">{d.daftar.judul}</h2>
      {kelas.dibatalkan ? (
        <p className="text-sm text-zinc-500">{d.daftar.dibatalkan}</p>
      ) : penuh ? (
        <p className="text-sm text-zinc-500">{d.daftar.penuh}</p>
      ) : bisaDidaftarkan.length === 0 ? (
        <p className="text-sm text-zinc-500">{d.daftar.kosong}</p>
      ) : (
        <FormDaftarPeserta scheduleId={kelas.id} member={bisaDidaftarkan} teks={d.daftar} />
      )}
    </main>
  )
}