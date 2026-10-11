import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const JENIS = { membership: 'Membership', pt: 'Paket PT', visit: 'Visit gym', item: 'Item' }
const BATAS_BARIS = 100

function rupiah(n) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

export default async function InvoicePage({ searchParams }) {
  const sp = await searchParams
  const q = String(sp.q ?? '').trim().replace(/[%_,()]/g, ' ').trim()
  const jenis = String(sp.jenis ?? '')
  const dari = String(sp.dari ?? '')
  const sampai = String(sp.sampai ?? '')

  const supabase = await createClient()

  let query = supabase
    .from('invoice')
    .select(
      'id, tanggal, status_bayar, jenis, nama_pelanggan, keterangan, member(id, nama), transaksi(metode_bayar, jumlah)'
    )
    .order('tanggal', { ascending: false })
    .order('id', { ascending: false })
    .limit(BATAS_BARIS)

  if (Object.hasOwn(JENIS, jenis)) query = query.eq('jenis', jenis)
  if (dari) query = query.gte('tanggal', dari)
  if (sampai) query = query.lte('tanggal', sampai)

  if (q) {
    const { data: cocok } = await supabase
      .from('member')
      .select('id')
      .or(`nama.ilike.%${q}%,no_hp.ilike.%${q}%`)

    const kondisi = [`nama_pelanggan.ilike.%${q}%`, `keterangan.ilike.%${q}%`]
    const ids = (cocok ?? []).map((m) => m.id)
    if (ids.length) kondisi.push(`member_id.in.(${ids.join(',')})`)
    if (/^\d+$/.test(q)) kondisi.push(`id.eq.${q}`)

    query = query.or(kondisi.join(','))
  }

  const { data: daftar, error } = await query

  if (error) {
    return <p className="p-10 text-red-600">Gagal ambil data: {error.message}</p>
  }

  const totalTampil = daftar.reduce(
    (n, f) => n + f.transaksi.reduce((m, t) => m + t.jumlah, 0),
    0
  )

  const input = 'w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-zinc-950'
  const adaFilter = q || jenis || dari || sampai

  return (
    <main className="p-5 sm:p-8">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">Invoice &amp; transaksi</h1>
         <div className="flex gap-2">
            <Link href="/invoice/visit" className="border border-zinc-200 bg-white rounded-xl font-semibold hover:bg-zinc-50 px-4 py-2 text-sm">
            + Visit gym
            </Link>
            <Link href="/stok/jual" className="bg-lime-300 text-zinc-950 rounded-xl px-4 py-2 text-sm font-bold">
            + Jual item
            </Link>
         </div>
      </div>
      <p className="mb-6 text-sm text-zinc-500">
        Semua pembayaran: membership, paket PT, item, visit, dan pembeli yang bukan member.
       </p>

      <form className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <input name="q" defaultValue={q} placeholder="Cari nama, no. HP, keterangan, atau no. invoice" className={input} />
        <select name="jenis" defaultValue={jenis} className={input}>
          <option value="">Semua jenis</option>
          {Object.entries(JENIS).map(([nilai, label]) => (
            <option key={nilai} value={nilai}>{label}</option>
          ))}
        </select>
        <input name="dari" type="date" defaultValue={dari} className={input} aria-label="Dari tanggal" />
        <input name="sampai" type="date" defaultValue={sampai} className={input} aria-label="Sampai tanggal" />
        <div className="flex gap-2">
          <button className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-bold text-white">Cari</button>
          {adaFilter && (
            <Link href="/invoice" className="rounded-xl px-3 py-2.5 text-sm text-zinc-500">Reset</Link>
          )}
        </div>
      </form>

      <div className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4 text-sm">
        <span className="text-zinc-500">Total pembayaran yang tampil: </span>
        <span className="font-black">{rupiah(totalTampil)}</span>
        <span className="text-zinc-400"> · {daftar.length} invoice</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-zinc-500">
              <th className="py-2 pr-4">Tanggal</th>
              <th className="py-2 pr-4">Invoice</th>
              <th className="py-2 pr-4">Pelanggan</th>
              <th className="py-2 pr-4">Jenis</th>
              <th className="py-2 pr-4">Keterangan</th>
              <th className="py-2 pr-4">Metode</th>
              <th className="py-2 pr-4">Jumlah</th>
              <th className="py-2 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((f) => {
              const dibayar = f.transaksi.reduce((n, t) => n + t.jumlah, 0)
              const metode = [...new Set(f.transaksi.map((t) => t.metode_bayar))].join(', ')
              return (
                <tr key={f.id} className="border-b">
                  <td className="py-2 pr-4">{f.tanggal}</td>
                  <td className="py-2 pr-4">#{f.id}</td>
                  <td className="py-2 pr-4 font-medium">
                    {f.member ? (
                      <Link href={`/member/${f.member.id}`} className="hover:underline">{f.member.nama}</Link>
                    ) : (
                      (f.nama_pelanggan ?? 'Umum')
                    )}
                  </td>
                  <td className="py-2 pr-4">{JENIS[f.jenis] ?? f.jenis}</td>
                  <td className="py-2 pr-4">{f.keterangan ?? '—'}</td>
                  <td className="py-2 pr-4">{metode || '—'}</td>
                  <td className="py-2 pr-4">{f.transaksi.length ? rupiah(dibayar) : '—'}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                        f.status_bayar === 'lunas' ? 'bg-lime-100 text-lime-800' : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {f.status_bayar}
                    </span>
                  </td>
                </tr>
              )
            })}
            {daftar.length === 0 && (
              <tr><td colSpan={8} className="py-4 text-zinc-400">Tidak ada invoice yang cocok.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {daftar.length === BATAS_BARIS && (
        <p className="mt-4 text-xs text-zinc-500">
          Menampilkan {BATAS_BARIS} invoice terbaru. Persempit dengan pencarian atau rentang tanggal untuk melihat yang lain.
        </p>
      )}
    </main>
  )
}