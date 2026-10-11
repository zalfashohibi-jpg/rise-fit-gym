import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { BATAS_STOK } from '@/lib/stok'

async function tambahItem(formData) {
  'use server'

  const supabase = await createClient()
  const nama_item = String(formData.get('nama_item')).trim()
  const kategori = String(formData.get('kategori') ?? '').trim() || null
  const jumlah_stok = Number(formData.get('jumlah_stok'))
  const harga = Number(formData.get('harga'))

  if (!nama_item) throw new Error('Nama item wajib diisi.')
  if (!Number.isInteger(jumlah_stok) || jumlah_stok < 0) {
    throw new Error('Stok awal harus angka bulat, minimal 0.')
  }
  if (!Number.isInteger(harga) || harga < 0) {
    throw new Error('Harga harus angka bulat, minimal 0.')
  }

  const { error } = await supabase
    .from('item_stok')
    .insert({ nama_item, kategori, jumlah_stok, harga })

  if (error) throw new Error(error.message)

  revalidatePath('/stok')
}

async function restock(formData) {
  'use server'

  const supabase = await createClient()
  const id = Number(formData.get('id'))
  const jumlah = Number(formData.get('jumlah'))

  const { error } = await supabase.rpc('tambah_stok', { p_id: id, p_jumlah: jumlah })
  if (error) throw new Error(error.message)

  revalidatePath('/stok')
}

export default async function StokPage({ searchParams }) {
  const sp = await searchParams
  const cari = String(sp.q ?? '').trim().replace(/[%_,()]/g, ' ').trim()
  const supabase = await createClient()

  let query = supabase.from('item_stok').select('*').order('nama_item')
  if (cari) query = query.or(`nama_item.ilike.%${cari}%,kategori.ilike.%${cari}%`)

  const { data: items, error } = await query

  if (error) {
    return <p className="p-10 text-red-600">Gagal ambil data: {error.message}</p>
  }

  const input = 'w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-zinc-950'
  const tombolKecil = 'border border-zinc-200 bg-white rounded-xl font-semibold hover:bg-zinc-50 px-2.5 py-1 text-xs'

  return (
    <main className="p-5 sm:p-8 max-w-4xl">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">Stok &amp; penjualan</h1>
        <Link href="/stok/jual" className="bg-lime-300 text-zinc-950 rounded-xl px-4 py-2 text-sm font-bold">
          + Jual item
        </Link>
      </div>
      <p className="mb-6 text-sm text-zinc-500">
        Item dengan stok {BATAS_STOK} atau kurang ditandai sebagai menipis.
      </p>

      <form className="mb-6 flex max-w-md gap-2">
        <input name="q" defaultValue={cari} placeholder="Cari nama item atau kategori" className={input} />
        <button className="shrink-0 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50">
          Cari
        </button>
        {cari && (
          <Link href="/stok" className="shrink-0 rounded-xl px-3 py-2 text-sm text-zinc-500">Reset</Link>
        )}
      </form>

      <div className="mb-10 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-zinc-500">
              <th className="py-2 pr-4">Item</th>
              <th className="py-2 pr-4">Kategori</th>
              <th className="py-2 pr-4">Stok</th>
              <th className="py-2 pr-4">Harga</th>
              <th className="py-2 pr-4">Tambah stok</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="border-b">
                <td className="py-2 pr-4 font-medium">{i.nama_item}</td>
                <td className="py-2 pr-4">{i.kategori ?? '—'}</td>
                <td className="py-2 pr-4">
                  <span className="mr-2">{i.jumlah_stok}</span>
                  {i.jumlah_stok === 0 ? (
                    <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">Habis</span>
                  ) : i.jumlah_stok <= BATAS_STOK ? (
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">Menipis</span>
                  ) : null}
                </td>
                <td className="py-2 pr-4">Rp {i.harga.toLocaleString('id-ID')}</td>
                <td className="py-2 pr-4">
                  <form action={restock} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={i.id} />
                    <input
                      name="jumlah"
                      type="number"
                      min="1"
                      required
                      placeholder="+"
                      className="w-20 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs"
                    />
                    <button className={tombolKecil}>Tambah</button>
                  </form>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-zinc-400">Tidak ada item.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-lg font-bold">Tambah item</h2>
      <form action={tambahItem} className="max-w-md space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-zinc-500">Nama item</label>
          <input name="nama_item" required className={input} />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-zinc-500">Kategori (opsional)</label>
          <input name="kategori" placeholder="misal: Suplemen" className={input} />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-zinc-500">Stok awal</label>
          <input name="jumlah_stok" type="number" min="0" defaultValue="0" required className={input} />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-zinc-500">Harga jual (Rp)</label>
          <input name="harga" type="number" min="0" required className={input} />
        </div>
        <button type="submit" className="bg-lime-300 text-zinc-950 rounded-xl px-5 py-2.5 text-sm font-bold">
          Simpan item
        </button>
      </form>
    </main>
  )
}