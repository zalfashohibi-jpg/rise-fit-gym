import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function JadwalPage() {
  const supabase = await createClient()

  const { data: jadwal, error } = await supabase
    .from('schedule')
    .select('*, kelas(nama_kelas, kapasitas), personal_trainer(karyawan(nama)), kelas_peserta(count)')
    .order('tanggal')
    .order('jam_mulai')

  if (error) {
    return <p className="p-10 text-red-600">Gagal ambil data: {error.message}</p>
  }

  return (
    <main className="p-10 font-sans">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Jadwal kelas</h1>
        <div className="flex items-center gap-3">
          <Link href="/jadwal/kelas" className="border border-stone-300 rounded-md px-3 py-1.5 text-sm">
            Jenis kelas
          </Link>
          <Link
            href="/jadwal/baru"
            className="bg-teal-700 text-white rounded-md px-3 py-1.5 text-sm font-medium"
          >
            + Jadwal baru
          </Link>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2 pr-4">Tanggal</th>
            <th className="py-2 pr-4">Jam</th>
            <th className="py-2 pr-4">Kelas</th>
            <th className="py-2 pr-4">Trainer</th>
            <th className="py-2 pr-4">Peserta</th>
            <th className="py-2 pr-4"></th>
          </tr>
        </thead>
        <tbody>
          {jadwal.map((j) => (
            <tr key={j.id} className="border-b">
              <td className="py-2 pr-4">{j.tanggal}</td>
              <td className="py-2 pr-4">
                {j.jam_mulai.slice(0, 5)}–{j.jam_selesai.slice(0, 5)}
              </td>
              <td className="py-2 pr-4 font-medium">{j.kelas?.nama_kelas ?? '—'}</td>
              <td className="py-2 pr-4">{j.personal_trainer?.karyawan?.nama ?? '—'}</td>
              <td className="py-2 pr-4">
                {j.kelas_peserta?.[0]?.count ?? 0} / {j.kelas?.kapasitas ?? '—'}
              </td>
              <td className="py-2 pr-4">
                <Link
                  href={`/jadwal/${j.id}`}
                  className="border border-stone-300 rounded-md px-2.5 py-1 text-xs"
                >
                  Kelola
                </Link>
              </td>
            </tr>
          ))}
          {jadwal.length === 0 && (
            <tr><td colSpan={6} className="py-4 text-stone-400">Belum ada jadwal.</td></tr>
          )}
        </tbody>
      </table>
    </main>
  )
}