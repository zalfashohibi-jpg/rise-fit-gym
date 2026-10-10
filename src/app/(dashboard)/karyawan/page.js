import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function KaryawanPage() {
  const supabase = await createClient()

  const { data: karyawan, error } = await supabase
    .from('karyawan')
    .select('*, personal_trainer(spesialisasi)')
    .order('nama')

  if (error) {
    return <p className="p-10 text-red-600">Gagal ambil data: {error.message}</p>
  }

  return (
    <main className="p-10 font-sans">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Karyawan &amp; trainer</h1>
        <Link
          href="/karyawan/baru"
          className="bg-teal-700 text-white rounded-md px-3 py-1.5 text-sm font-medium"
        >
          + Karyawan baru
        </Link>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2 pr-4">Nama</th>
            <th className="py-2 pr-4">Jabatan</th>
            <th className="py-2 pr-4">No. HP</th>
            <th className="py-2 pr-4">Tanggal masuk</th>
            <th className="py-2 pr-4">Spesialisasi</th>
          </tr>
        </thead>
        <tbody>
          {karyawan.map((k) => (
            <tr key={k.id} className="border-b">
              <td className="py-2 pr-4 font-medium">{k.nama}</td>
              <td className="py-2 pr-4">{k.jabatan}</td>
              <td className="py-2 pr-4">{k.no_hp ?? '—'}</td>
              <td className="py-2 pr-4">{k.tanggal_masuk}</td>
              <td className="py-2 pr-4">{k.personal_trainer?.[0]?.spesialisasi ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}