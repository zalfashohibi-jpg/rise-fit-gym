import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function tambahHari(tanggal, n) {
  const d = new Date(tanggal)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

async function perpanjang(formData) {
  'use server'

  const supabase = await createClient()

  const member_id = Number(formData.get('member_id'))
  const tanggal_mulai = formData.get('tanggal_mulai')
  const paket_id = Number(formData.get('paket_id'))

  const { data: paket, error: errPaket } = await supabase
    .from('paket_membership')
    .select('nama, durasi_hari')
    .eq('id', paket_id)
    .single()

  if (errPaket) throw new Error('Paket tidak ditemukan.')

  const tanggal_exp = tambahHari(tanggal_mulai, paket.durasi_hari)

  // buat membership baru dulu, supaya kalau gagal yang lama tidak ikut hilang
  const { data: baru, error } = await supabase
    .from('membership')
    .insert({ member_id, paket: paket.nama, tanggal_mulai, tanggal_exp, status: 'aktif' })
    .select('id')
    .single()

  if (error) throw new Error(error.message)

  // tandai yang lama sebagai selesai (riwayat tetap tersimpan)
  const { error: errLama } = await supabase
    .from('membership')
    .update({ status: 'selesai' })
    .eq('member_id', member_id)
    .neq('id', baru.id)

  if (errLama) throw new Error(errLama.message)

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

  const { data: paket } = await supabase
    .from('paket_membership')
    .select('id, nama, harga')
    .eq('aktif', true)
    .order('durasi_hari')

  const input = 'w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-zinc-950'

  if (!paket?.length) {
    return (
      <main className="p-5 sm:p-8 max-w-lg">
        <h1 className="text-2xl font-black tracking-tight mb-4">Perpanjang membership</h1>
        <p className="text-zinc-600 mb-4">Belum ada paket membership yang aktif.</p>
        <Link href="/paket" className="border border-zinc-200 bg-white rounded-xl font-semibold hover:bg-zinc-50 px-4 py-2 text-sm">
          Kelola paket
        </Link>
      </main>
    )
  }

  // kalau masih aktif, mulai dari tanggal exp lama; kalau sudah lewat, mulai hari ini
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
  const expTerakhir = member.membership?.[0]?.tanggal_exp
  const defaultMulai = expTerakhir && expTerakhir > today ? expTerakhir : today

  return (
    <main className="p-5 sm:p-8 max-w-lg">
      <h1 className="text-2xl font-black tracking-tight mb-1">Perpanjang membership</h1>
      <p className="text-zinc-500 mb-6">{member.nama}</p>

      <form action={perpanjang} className="space-y-4">
        <input type="hidden" name="member_id" value={member.id} />

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
          <input name="tanggal_mulai" type="date" required defaultValue={defaultMulai} className={input} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="bg-lime-300 text-zinc-950 rounded-xl px-5 py-2.5 text-sm font-bold">
            Perpanjang
          </button>
          <Link href="/member" className="border border-zinc-200 bg-white rounded-xl font-semibold hover:bg-zinc-50 px-4 py-2 text-sm">
            Batal
          </Link>
        </div>
      </form>
    </main>
  )
}