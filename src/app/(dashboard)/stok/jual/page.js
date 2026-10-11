import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { METODE_BAYAR } from '@/lib/pembayaran'

const BARIS = 5

async function catatJual(formData) {
  'use server'

  const supabase = await createClient()

  const items = []
  for (let i = 1; i <= BARIS; i++) {
    const item_id = Number(formData.get(`item_${i}`))
    const qty = Number(formData.get(`qty_${i}`))
    if (item_id && Number.isInteger(qty) && qty > 0) items.push({ item_id, qty })
  }

  if (items.length === 0) throw new Error('Pilih minimal satu item beserta jumlahnya.')

  const { error } = await supabase.rpc('catat_penjualan', {
    p_member_id: Number(formData.get('member_id')) || null,
    p_nama_pelanggan: String(formData.get('nama_pelanggan') ?? ''),
    p_metode: String(formData.get('metode')),
    p_items: items,
  })

  if (error) throw new Error(error.message)

  redirect('/invoice')
}

export default async function JualPage() {
  const supabase = await createClient()

  const [{ data: items }, { data: members }] = await Promise.all([
    supabase
      .from('item_stok')
      .select('id, nama_item, harga, jumlah_stok')
      .gt('jumlah_stok', 0)
      .order('nama_item'),
    supabase.from('member').select('id, nama, no_hp').order('nama'),
  ])

  const input = 'w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-zinc-950'
  const qtyInput = 'w-24 shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-zinc-950'

  if (!items?.length) {
    return (
      <main className="p-5 sm:p-8 max-w-lg">
        <h1 className="mb-4 text-2xl font-black tracking-tight">Jual item</h1>
        <p className="mb-4 text-zinc-600">Belum ada item dengan stok tersedia.</p>
        <Link href="/stok" className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
          Kelola stok
        </Link>
      </main>
    )
  }

  return (
    <main className="p-5 sm:p-8 max-w-xl">
      <Link href="/stok" className="text-sm text-zinc-500">← Kembali ke stok</Link>
      <h1 className="mb-1 mt-3 text-2xl font-black tracking-tight">Jual item</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Total dihitung otomatis dari harga item, dan stok berkurang setelah disimpan. Untuk lebih dari {BARIS} jenis
        item, catat penjualan dua kali.
      </p>

      <form action={catatJual} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-zinc-500">Item dan jumlah</label>
          {Array.from({ length: BARIS }, (_, n) => n + 1).map((i) => (
            <div key={i} className="flex gap-2">
              <select name={`item_${i}`} required={i === 1} className={input}>
                <option value="">{i === 1 ? '— pilih item —' : '— item lain (opsional) —'}</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.nama_item} · stok {it.jumlah_stok} · Rp {it.harga.toLocaleString('id-ID')}
                  </option>
                ))}
              </select>
              <input name={`qty_${i}`} type="number" min="1" required={i === 1} placeholder="Jml" className={qtyInput} />
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-500">Pembeli (opsional)</label>
          <select name="member_id" className={input}>
            <option value="">Bukan member / pembeli umum</option>
            {(members ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.nama}
                {m.no_hp ? ` · ${m.no_hp}` : ''}
              </option>
            ))}
          </select>
          <input name="nama_pelanggan" placeholder="Nama pembeli, kalau bukan member (opsional)" className={input} />
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
            Catat penjualan
          </button>
          <Link href="/stok" className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
            Batal
          </Link>
        </div>
      </form>
    </main>
  )
}