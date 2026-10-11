import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { hariIniJakarta } from '@/lib/pembayaran'
import { hitungPaketPt } from '@/lib/pt'

export default async function PtPage({ searchParams }) {
  const sp = await searchParams
  const q = String(sp.q ?? '').trim().replace(/[%_,()]/g, ' ').trim()
  const tampil = sp.tampil === 'semua' ? 'semua' : 'berlaku'

  const supabase = await createClient()
  const hariIni = hariIniJakarta()

  let ids = null
  if (q) {
    const { data: cocok } = await supabase
      .from('member')
      .select('id')
      .or(`nama.ilike.%${q}%,no_hp.ilike.%${q}%`)
    ids = (cocok ?? []).map((m) => m.id)
  }

  let query = supabase
    .from('paket_pt_member')
    .select('id, paket_nama, total_sesi, tanggal_mulai, tanggal_exp, member(id, nama), pt_session(status)')
    .order('tanggal_exp')

  // [0] = tidak ada member yang cocok, hasilnya sengaja kosong
  if (ids) query = query.in('member_id', ids.length ? ids : [0])

  const { data, error } = await query

  if (error) {
    return <p className="p-10 text-red-600">Gagal ambil data: {error.message}</p>
  }

  const semua = (data ?? []).map((p) => ({ ...p, h: hitungPaketPt(p, hariIni) }))
  const baris = tampil === 'semua' ? semua : semua.filter((p) => p.h.berlaku)
  const perluPerhatian = semua.filter((p) => p.h.perhatian).length

  const input = 'w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm outline-none focus:border-zinc-950'

  return (
    <main className="p-5 sm:p-8">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">Paket PT</h1>
        <Link href="/pt/baru" className="bg-lime-300 text-zinc-950 rounded-xl px-4 py-2 text-sm font-bold">
          + Paket PT baru
        </Link>
      </div>
      <p className="mb-6 text-sm text-zinc-500">
        {perluPerhatian > 0
          ? `${perluPerhatian} paket perlu perhatian (sisa 1 sesi atau segera berakhir).`
          : 'Tidak ada paket yang perlu perhatian.'}
      </p>

      <form className="mb-6 grid max-w-2xl gap-3 sm:grid-cols-[2fr_1fr_auto]">
        <input name="q" defaultValue={q} placeholder="Cari nama atau no. HP member" className={input} />
        <select name="tampil" defaultValue={tampil} className={input}>
          <option value="berlaku">Masih berlaku</option>
          <option value="semua">Semua paket</option>
        </select>
        <div className="flex gap-2">
          <button className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-bold text-white">Cari</button>
          {(q || tampil === 'semua') && (
            <Link href="/pt" className="rounded-xl px-3 py-2.5 text-sm text-zinc-500">Reset</Link>
          )}
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-zinc-500">
              <th className="py-2 pr-4">Member</th>
              <th className="py-2 pr-4">Paket</th>
              <th className="py-2 pr-4">Sisa sesi</th>
              <th className="py-2 pr-4">Berlaku sampai</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {baris.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-2 pr-4 font-medium">
                  <Link href={`/member/${p.member?.id}`} className="hover:underline">{p.member?.nama}</Link>
                </td>
                <td className="py-2 pr-4">{p.paket_nama}</td>
                <td className="py-2 pr-4 font-bold">{p.h.sisa} / {p.total_sesi}</td>
                <td className="py-2 pr-4">{p.tanggal_exp}</td>
                <td className="py-2 pr-4">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${p.h.status.kelas}`}>{p.h.status.teks}</span>
                </td>
                <td className="py-2 pr-4">
                  <Link
                    href={`/pt/${p.id}`}
                    className="border border-zinc-200 bg-white rounded-xl font-semibold hover:bg-zinc-50 px-2.5 py-1 text-xs"
                  >
                    Kelola
                  </Link>
                </td>
              </tr>
            ))}
            {baris.length === 0 && (
              <tr><td colSpan={6} className="py-4 text-zinc-400">Tidak ada paket PT.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}