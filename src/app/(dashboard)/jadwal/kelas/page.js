import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function tambahKelas(formData) {
  'use server'

  const supabase = await createClient()
  const nama_kelas = formData.get('nama_kelas')
  const kapasitas = Number(formData.get('kapasitas'))

  const { error } = await supabase.from('kelas').insert({ nama_kelas, kapasitas })
  if (error) throw new Error(error.message)

  redirect('/jadwal/kelas')
}

export default async function KelasPage() {
  const supabase = await createClient()
  const { data: kelas, error } = await supabase.from('kelas').select('*').order('nama_kelas')

  if (error) {
    return <p className="p-10 text-red-600">Gagal ambil data: {error.message}</p>
  }

  const input = 'w-full border border-stone-300 rounded-md px-3 py-2 text-sm'

  return (
    <main className="p-10 font-sans max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Jenis kelas</h1>
        <Link href="/jadwal" className="border border-stone-300 rounded-md px-3 py-1.5 text-sm">
          Kembali ke jadwal
        </Link>
      </div>

      <table className="w-full border-collapse text-sm mb-10">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2 pr-4">Nama kelas</th>
            <th className="py-2 pr-4">Kapasitas</th>
          </tr>
        </thead>
        <tbody>
          {kelas.map((k) => (
            <tr key={k.id} className="border-b">
              <td className="py-2 pr-4 font-medium">{k.nama_kelas}</td>
              <td className="py-2 pr-4">{k.kapasitas} orang</td>
            </tr>
          ))}
          {kelas.length === 0 && (
            <tr><td colSpan={2} className="py-4 text-stone-400">Belum ada jenis kelas.</td></tr>
          )}
        </tbody>
      </table>

      <h2 className="text-lg font-semibold mb-3">Tambah jenis kelas</h2>
      <form action={tambahKelas} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-stone-500">Nama kelas</label>
          <input name="nama_kelas" required placeholder="misal: Yoga Pagi" className={input} />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-stone-500">Kapasitas (orang)</label>
          <input name="kapasitas" type="number" min="1" defaultValue="20" required className={input} />
        </div>
        <button type="submit" className="bg-teal-700 text-white rounded-md px-4 py-2 text-sm font-medium">
          Simpan
        </button>
      </form>
    </main>
  )
}