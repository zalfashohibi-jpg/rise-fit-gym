import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { METODE_BAYAR, catatPembayaran } from '@/lib/pembayaran'

async function jualVisit(formData) {
  'use server'

  const supabase = await createClient()
  const paket_id = Number(formData.get('paket_id'))
  const metode = String(formData.get('metode'))

  const { data: paket, error: errPaket } = await supabase
    .from('paket_membership')
    .select('nama, harga')
    .eq('id', paket_id)
    .eq('jenis', 'visit')
    .eq('aktif', true)
    .single()

  if (errPaket) throw new Error('Paket visit tidak ditemukan.')

  const { error } = await catatPembayaran(supabase, {
    member_id: null,
    nama_pelanggan: String(formData.get('nama_pelanggan') ?? ''),
    total: paket.harga,
    metode,
    jenis: 'visit',
    keterangan: paket.nama,
  })

  if (error) throw new Error(error.message)

  redirect('/invoice')
}

export default async function VisitPage() {
  const supabase = await createClient()

  const { data: paket } = await supabase
    .from('paket_membership')
    .select('id, nama, harga')
    .eq('jenis', 'visit')
    .eq('aktif', true)
    .order('harga')

  const input = 'w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-zinc-950'
  const tombolLain = 'border border-zinc-200 bg-white rounded-xl font-semibold hover:bg-zinc-50 px-4 py-2 text-sm'

  if (!paket?.length) {
    return (
      <main className="p-5 sm:p-8 max-w-lg">
        <h1 className="mb-4 text-2xl font-black tracking-tight">Visit gym</h1>
        <p className="mb-4 text-zinc-600">Belum ada paket berjenis Visit gym yang aktif.</p>
        <Link href="/paket" className={tombolLain}>Kelola paket</Link>
      </main>
    )
  }

  return (
    <main className="p-5 sm:p-8 max-w-lg">
      <Link href="/invoice" className="text-sm text-zinc-500">← Kembali ke invoice</Link>
      <h1 className="mb-1 mt-3 text-2xl font-black tracking-tight">Visit gym</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Pengunjung tidak dibuatkan data member. Pembayarannya tercatat sebagai invoice dan transaksi.
      </p>

      <form action={jualVisit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-zinc-500">Paket visit</label>
          <select name="paket_id" className={input}>
            {paket.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama} · Rp {p.harga.toLocaleString('id-ID')}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-500">Nama pengunjung (opsional)</label>
          <input name="nama_pelanggan" placeholder="Boleh dikosongkan" className={input} />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-500">Metode pembayaran</label>
          <select name="metode" className={input}>
            {METODE_BAYAR.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="bg-lime-300 text-zinc-950 rounded-xl px-5 py-2.5 text-sm font-bold">
            Catat visit
          </button>
          <Link href="/invoice" className={tombolLain}>Batal</Link>
        </div>
      </form>
    </main>
  )
}