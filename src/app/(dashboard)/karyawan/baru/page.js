import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function tambahKaryawan(formData) {
  'use server'

  const supabase = await createClient()

  const nama = formData.get('nama')
  const jabatan = formData.get('jabatan')
  const no_hp = formData.get('no_hp')
  const tanggal_masuk = formData.get('tanggal_masuk')
  const spesialisasi = formData.get('spesialisasi')

  const { data: karyawan, error } = await supabase
    .from('karyawan')
    .insert({ nama, jabatan, no_hp, tanggal_masuk })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  // khusus Personal Trainer: tambahkan juga ke tabel personal_trainer
  if (jabatan === 'Personal Trainer') {
    const { error: errPT } = await supabase
      .from('personal_trainer')
      .insert({ karyawan_id: karyawan.id, spesialisasi })

    if (errPT) throw new Error(errPT.message)
  }

  redirect('/karyawan')
}

export default function KaryawanBaruPage() {
  const input = 'w-full border border-stone-300 rounded-md px-3 py-2 text-sm'

  return (
    <main className="p-10 font-sans max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">Karyawan baru</h1>

      <form action={tambahKaryawan} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-stone-500">Nama lengkap</label>
          <input name="nama" required className={input} />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-stone-500">Jabatan</label>
          <select name="jabatan" className={input}>
            <option>Personal Trainer</option>
            <option>Resepsionis</option>
            <option>Manajer Cabang</option>
            <option>Kasir</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-stone-500">No. HP</label>
          <input name="no_hp" className={input} />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-stone-500">Tanggal masuk</label>
          <input name="tanggal_masuk" type="date" required className={input} />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-stone-500">Spesialisasi (khusus Personal Trainer)</label>
          <input name="spesialisasi" placeholder="misal: strength training, weight loss" className={input} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="bg-teal-700 text-white rounded-md px-4 py-2 text-sm font-medium">
            Simpan
          </button>
          <Link href="/karyawan" className="border border-stone-300 rounded-md px-4 py-2 text-sm">
            Batal
          </Link>
        </div>
      </form>
    </main>
  )
}