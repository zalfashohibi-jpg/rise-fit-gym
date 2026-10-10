import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function daftarkan(formData) {
  'use server'

  const supabase = await createClient()
  const schedule_id = Number(formData.get('schedule_id'))
  const member_id = Number(formData.get('member_id'))

  // cek kapasitas
  const { data: jadwal } = await supabase
    .from('schedule')
    .select('kelas(kapasitas)')
    .eq('id', schedule_id)
    .single()

  const { count } = await supabase
    .from('kelas_peserta')
    .select('*', { count: 'exact', head: true })
    .eq('schedule_id', schedule_id)

  if (count >= (jadwal?.kelas?.kapasitas ?? 0)) {
    throw new Error('Kelas sudah penuh.')
  }

  // cek apakah sudah terdaftar
  const { data: sudah } = await supabase
    .from('kelas_peserta')
    .select('id')
    .eq('schedule_id', schedule_id)
    .eq('member_id', member_id)
    .maybeSingle()

  if (sudah) throw new Error('Member ini sudah terdaftar di kelas ini.')

  const { error } = await supabase
    .from('kelas_peserta')
    .insert({ schedule_id, member_id, status_hadir: 'terdaftar' })

  if (error) throw new Error(error.message)

  revalidatePath(`/jadwal/${schedule_id}`)
}

async function tandaiHadir(formData) {
  'use server'

  const supabase = await createClient()
  const id = Number(formData.get('id'))
  const schedule_id = Number(formData.get('schedule_id'))

  const { error } = await supabase
    .from('kelas_peserta')
    .update({ status_hadir: 'hadir' })
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath(`/jadwal/${schedule_id}`)
}

async function batalkan(formData) {
  'use server'

  const supabase = await createClient()
  const id = Number(formData.get('id'))
  const schedule_id = Number(formData.get('schedule_id'))

  const { error } = await supabase.from('kelas_peserta').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath(`/jadwal/${schedule_id}`)
}

export default async function DetailJadwalPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: jadwal } = await supabase
    .from('schedule')
    .select('*, kelas(nama_kelas, kapasitas), personal_trainer(karyawan(nama))')
    .eq('id', id)
    .single()

  if (!jadwal) {
    return <p className="p-10">Jadwal tidak ditemukan.</p>
  }

  const { data: peserta } = await supabase
    .from('kelas_peserta')
    .select('id, status_hadir, member(nama, no_hp)')
    .eq('schedule_id', id)
    .order('id')

  // hanya member dengan membership aktif yang masih berlaku pada tanggal kelas
  const { data: layak } = await supabase
    .from('member')
    .select('id, nama, membership!inner(tanggal_exp, status)')
    .eq('membership.status', 'aktif')
    .gte('membership.tanggal_exp', jadwal.tanggal)
    .order('nama')

  const sudahTerdaftar = new Set((peserta ?? []).map((p) => p.member?.nama))
  const bisaDidaftarkan = (layak ?? []).filter((m) => !sudahTerdaftar.has(m.nama))

  const kapasitas = jadwal.kelas?.kapasitas ?? 0
  const penuh = (peserta?.length ?? 0) >= kapasitas
  const input = 'w-full border border-stone-300 rounded-md px-3 py-2 text-sm'

  return (
    <main className="p-10 font-sans max-w-3xl">
      <Link href="/jadwal" className="text-sm text-stone-500">← Kembali ke jadwal</Link>

      <h1 className="text-2xl font-semibold mt-3">{jadwal.kelas?.nama_kelas ?? 'Kelas'}</h1>
      <p className="text-stone-500 mb-8">
        {jadwal.tanggal} · {jadwal.jam_mulai.slice(0, 5)}–{jadwal.jam_selesai.slice(0, 5)} ·
        Trainer: {jadwal.personal_trainer?.karyawan?.nama ?? '—'} ·
        Peserta {peserta?.length ?? 0} / {kapasitas}
      </p>

      <h2 className="text-lg font-semibold mb-3">Daftar peserta</h2>
      <table className="w-full border-collapse text-sm mb-10">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2 pr-4">Nama</th>
            <th className="py-2 pr-4">No. HP</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4"></th>
          </tr>
        </thead>
        <tbody>
          {(peserta ?? []).map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2 pr-4 font-medium">{p.member?.nama}</td>
              <td className="py-2 pr-4">{p.member?.no_hp ?? '—'}</td>
              <td className="py-2 pr-4">{p.status_hadir}</td>
              <td className="py-2 pr-4">
                <div className="flex gap-2">
                  {p.status_hadir !== 'hadir' && (
                    <form action={tandaiHadir}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="schedule_id" value={jadwal.id} />
                      <button className="border border-stone-300 rounded-md px-2.5 py-1 text-xs">Hadir</button>
                    </form>
                  )}
                  <form action={batalkan}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="schedule_id" value={jadwal.id} />
                    <button className="border border-stone-300 rounded-md px-2.5 py-1 text-xs">Batalkan</button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
          {(peserta ?? []).length === 0 && (
            <tr><td colSpan={4} className="py-4 text-stone-400">Belum ada peserta.</td></tr>
          )}
        </tbody>
      </table>

      <h2 className="text-lg font-semibold mb-3">Daftarkan peserta</h2>
      {penuh ? (
        <p className="text-sm text-stone-500">Kelas sudah penuh.</p>
      ) : bisaDidaftarkan.length === 0 ? (
        <p className="text-sm text-stone-500">
          Tidak ada member lain dengan membership aktif pada tanggal kelas ini.
        </p>
      ) : (
        <form action={daftarkan} className="flex gap-3 max-w-md">
          <input type="hidden" name="schedule_id" value={jadwal.id} />
          <select name="member_id" className={input}>
            {bisaDidaftarkan.map((m) => (
              <option key={m.id} value={m.id}>{m.nama}</option>
            ))}
          </select>
          <button type="submit" className="bg-teal-700 text-white rounded-md px-4 py-2 text-sm font-medium shrink-0">
            Daftarkan
          </button>
        </form>
      )}
    </main>
  )
}