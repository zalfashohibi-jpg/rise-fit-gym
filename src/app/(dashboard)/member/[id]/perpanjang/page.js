import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function perpanjang(formData) {
  'use server'

  const supabase = await createClient()

  const member_id = Number(formData.get('member_id'))
  const tanggal_mulai = formData.get('tanggal_mulai')
  const durasiBulan = Number(formData.get('durasi'))
  const paket = durasiBulan === 12 ? 'Paket 1 tahun' : `Paket ${durasiBulan} bulan`

  const exp = new Date(tanggal_mulai)
  exp.setUTCMonth(exp.getUTCMonth() + durasiBulan)
  const tanggal_exp = exp.toISOString().slice(0, 10)

  // tandai membership lama sebagai selesai (riwayat tetap tersimpan)
  const { error: errLama } = await supabase
    .from('membership')
    .update({ status: 'selesai' })
    .eq('member_id', member_id)

  if (errLama) throw new Error(errLama.message)

  // buat membership baru
  const { error } = await supabase
    .from('membership')
    .insert({ member_id, paket, tanggal_mulai, tanggal_exp, status: 'aktif' })

  if (error) throw new Error(error.message)

  redirect('/member')
}

export default async function PerpanjangPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: member } = await supabase
    .from('member')
    .select('id, nama, membership(tanggal_exp)')
    .eq('id', id)
    .order('tanggal_exp', { referencedTable: 'membership', ascending: false })
    .single()

  if (!member) {
    return <p className="p-10">Member tidak ditemukan.</p>
  }

  // kalau masih aktif, mulai dari tanggal exp lama; kalau sudah lewat, mulai hari ini
  const today = new Date().toISOString().slice(0, 10)
  const expTerakhir = member.membership?.[0]?.tanggal_exp
  const defaultMulai = expTerakhir && expTerakhir > today ? expTerakhir : today

  return (
    <main className="p-10 font-sans max-w-lg">
      <h1 className="text-2xl font-semibold mb-1">Perpanjang membership</h1>
      <p className="text-stone-500 mb-6">{member.nama}</p>

      <form action={perpanjang} className="space-y-4">
        <input type="hidden" name="member_id" value={member.id} />

        <div className="space-y-1">
          <label className="text-sm text-stone-500">Paket</label>
          <select name="durasi" className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm">
            <option value="1">Paket 1 bulan</option>
            <option value="3">Paket 3 bulan</option>
            <option value="6">Paket 6 bulan</option>
            <option value="12">Paket 1 tahun</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-stone-500">Tanggal mulai</label>
          <input
            name="tanggal_mulai"
            type="date"
            required
            defaultValue={defaultMulai}
            className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="bg-teal-700 text-white rounded-md px-4 py-2 text-sm font-medium">
            Perpanjang
          </button>
          <Link href="/member" className="border border-stone-300 rounded-md px-4 py-2 text-sm">
            Batal
          </Link>
        </div>
      </form>
    </main>
  )
}