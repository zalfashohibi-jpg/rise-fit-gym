import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function tambahJadwal(formData) {
  'use server'

  const supabase = await createClient()

  const kelas_id = Number(formData.get('kelas_id'))
  const trainer_id = Number(formData.get('trainer_id'))
  const tanggal = formData.get('tanggal')
  const jam_mulai = formData.get('jam_mulai')
  const jam_selesai = formData.get('jam_selesai')

  if (jam_selesai <= jam_mulai) {
    throw new Error('Jam selesai harus setelah jam mulai.')
  }

  const { error } = await supabase
    .from('schedule')
    .insert({ kelas_id, trainer_id, tanggal, jam_mulai, jam_selesai })

  if (error) throw new Error(error.message)

  redirect('/jadwal')
}

export default async function JadwalBaruPage() {
  const supabase = await createClient()

  const { data: kelas } = await supabase.from('kelas').select('id, nama_kelas').order('nama_kelas')
  const { data: trainer } = await supabase
    .from('personal_trainer')
    .select('id, karyawan(nama)')

  const input = 'w-full border border-stone-300 rounded-md px-3 py-2 text-sm'

  if (!kelas?.length || !trainer?.length) {
    return (
      <main className="p-10 font-sans max-w-lg">
        <h1 className="text-2xl font-semibold mb-4">Jadwal baru</h1>
        <p className="text-stone-600 mb-4">
          Sebelum membuat jadwal, pastikan sudah ada minimal satu jenis kelas dan satu
          personal trainer.
        </p>
        <div className="flex gap-3">
          <Link href="/jadwal/kelas" className="border border-stone-300 rounded-md px-4 py-2 text-sm">
            Kelola jenis kelas
          </Link>
          <Link href="/karyawan/baru" className="border border-stone-300 rounded-md px-4 py-2 text-sm">
            Tambah trainer
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="p-10 font-sans max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">Jadwal baru</h1>

      <form action={tambahJadwal} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-stone-500">Kelas</label>
          <select name="kelas_id" className={input}>
            {kelas.map((k) => (
              <option key={k.id} value={k.id}>{k.nama_kelas}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-stone-500">Trainer</label>
          <select name="trainer_id" className={input}>
            {trainer.map((t) => (
              <option key={t.id} value={t.id}>{t.karyawan?.nama}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-stone-500">Tanggal</label>
          <input name="tanggal" type="date" required className={input} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-stone-500">Jam mulai</label>
            <input name="jam_mulai" type="time" required className={input} />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-stone-500">Jam selesai</label>
            <input name="jam_selesai" type="time" required className={input} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="bg-teal-700 text-white rounded-md px-4 py-2 text-sm font-medium">
            Simpan jadwal
          </button>
          <Link href="/jadwal" className="border border-stone-300 rounded-md px-4 py-2 text-sm">
            Batal
          </Link>
        </div>
      </form>
    </main>
  )
}