import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function tambahMember(formData) {
  'use server'

  const supabase = await createClient()

  const nama = formData.get('nama')
  const no_hp = formData.get('no_hp')
  const durasiBulan = Number(formData.get('durasi'))
  const paket = durasiBulan === 12 ? 'Paket 1 tahun' : `Paket ${durasiBulan} bulan`
  const tanggal_mulai = formData.get('tanggal_mulai')

  // hitung tanggal berakhir = tanggal mulai + durasi paket
  const exp = new Date(tanggal_mulai)
  exp.setUTCMonth(exp.getUTCMonth() + durasiBulan)
  const tanggal_exp = exp.toISOString().slice(0, 10)

  // 1) simpan member, minta id-nya kembali
  const { data: member, error: errMember } = await supabase
    .from('member')
    .insert({ nama, no_hp })
    .select('id')
    .single()

  if (errMember) throw new Error(errMember.message)

  // 2) simpan membership yang menempel ke member itu
  const { error: errMembership } = await supabase
    .from('membership')
    .insert({
      member_id: member.id,
      paket,
      tanggal_mulai,
      tanggal_exp,
      status: 'aktif',
    })

  if (errMembership) throw new Error(errMembership.message)

  redirect('/member')
}

export default function MemberBaruPage() {
  return (
    <main className="p-10 font-sans max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">Member baru</h1>

      <form action={tambahMember} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-stone-500">Nama lengkap</label>
          <input name="nama" required className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm" />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-stone-500">No. HP</label>
          <input name="no_hp" className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm" />
        </div>

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
          <input name="tanggal_mulai" type="date" required className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="bg-teal-700 text-white rounded-md px-4 py-2 text-sm font-medium">
            Simpan
          </button>
          <Link href="/member" className="border border-stone-300 rounded-md px-4 py-2 text-sm">
            Batal
          </Link>
        </div>
      </form>
    </main>
  )
}