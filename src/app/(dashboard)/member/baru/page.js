import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function tambahHari(tanggal, n) {
  const d = new Date(tanggal)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

async function tambahMember(formData) {
  'use server'

  const supabase = await createClient()

  const nama = formData.get('nama')
  const no_hp = formData.get('no_hp')
  const tanggal_mulai = formData.get('tanggal_mulai')
  const paket_id = Number(formData.get('paket_id'))

  const { data: paket, error: errPaket } = await supabase
    .from('paket_membership')
    .select('nama, durasi_hari')
    .eq('id', paket_id)
    .single()

  if (errPaket) throw new Error('Paket tidak ditemukan.')

  const tanggal_exp = tambahHari(tanggal_mulai, paket.durasi_hari)

  const { data: member, error: errMember } = await supabase
    .from('member')
    .insert({ nama, no_hp })
    .select('id')
    .single()

  if (errMember) throw new Error(errMember.message)

  const { error: errMembership } = await supabase.from('membership').insert({
    member_id: member.id,
    paket: paket.nama,
    tanggal_mulai,
    tanggal_exp,
    status: 'aktif',
  })

  const { error: errBayar } = await catatPembayaran(supabase, {
  member_id: member.id,   // di perpanjang: member_id
  total: paket.harga,
  metode,
  keterangan: paket.nama,
  })

  if (errMembership) {
    await supabase.from('member').delete().eq('id', member.id)
    throw new Error(errMembership.message)
  }

  redirect('/member')
}

export default async function MemberBaruPage() {
  const supabase = await createClient()
  const { data: paket } = await supabase
    .from('paket_membership')
    .select('id, nama, harga')
    .eq('aktif', true)
    .order('durasi_hari')

  const input = 'w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-zinc-950'

  if (!paket?.length) {
    return (
      <main className="p-5 sm:p-8 max-w-lg">
        <h1 className="text-2xl font-black tracking-tight mb-4">Member baru</h1>
        <p className="text-zinc-600 mb-4">Belum ada paket membership yang aktif.</p>
        <Link href="/paket" className="border border-zinc-200 bg-white rounded-xl font-semibold hover:bg-zinc-50 px-4 py-2 text-sm">
          Kelola paket
        </Link>
      </main>
    )
  }

  return (
    <main className="p-5 sm:p-8 max-w-lg">
      <h1 className="text-2xl font-black tracking-tight mb-6">Member baru</h1>

      <form action={tambahMember} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-zinc-500">Nama lengkap</label>
          <input name="nama" required className={input} />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-500">No. HP</label>
          <input name="no_hp" className={input} />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-500">Paket</label>
          <select name="paket_id" className={input}>
            {paket.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama} · Rp {p.harga.toLocaleString('id-ID')}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-500">Tanggal mulai</label>
          <input name="tanggal_mulai" type="date" required className={input} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="bg-lime-300 text-zinc-950 rounded-xl px-5 py-2.5 text-sm font-bold">
            Simpan
          </button>
          <Link href="/member" className="border border-zinc-200 bg-white rounded-xl font-semibold hover:bg-zinc-50 px-4 py-2 text-sm">
            Batal
          </Link>
        </div>
      </form>
    </main>
  )
}