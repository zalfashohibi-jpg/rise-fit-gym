import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function statusTnc(m, versiTerbaru) {
  if (!m.tnc_versi) return { teks: 'Belum', kelas: 'bg-red-50 text-red-700' }
  if (versiTerbaru && m.tnc_versi !== versiTerbaru) {
    return { teks: `Versi lama (${m.tnc_versi})`, kelas: 'bg-amber-50 text-amber-700' }
  }
  return { teks: `Setuju · ${m.tnc_versi}`, kelas: 'bg-lime-100 text-lime-800' }
}

export default async function MemberPage() {
  const supabase = await createClient()

  const [anggota, terbaru] = await Promise.all([
    supabase
      .from('member')
      .select('*, membership(paket, tanggal_exp, status)')
      .order('nama')
      .order('tanggal_exp', { referencedTable: 'membership', ascending: false }),
    supabase.from('peraturan').select('versi').order('id', { ascending: false }).limit(1),
  ])

  if (anggota.error) {
    return <p className="p-10 text-red-600">Gagal ambil data: {anggota.error.message}</p>
  }

  const members = anggota.data
  const versiTerbaru = terbaru.data?.[0]?.versi
  const tombolKecil = 'border border-zinc-200 bg-white rounded-xl font-semibold hover:bg-zinc-50 px-2.5 py-1 text-xs'

  return (
    <main className="p-5 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black tracking-tight">Data Member</h1>
        <Link href="/member/baru" className="bg-lime-300 text-zinc-950 rounded-xl px-4 py-2 text-sm font-bold">
          + Member baru
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-zinc-500 border-b">
              <th className="py-2 pr-4">Nama</th>
              <th className="py-2 pr-4">No. HP</th>
              <th className="py-2 pr-4">Paket</th>
              <th className="py-2 pr-4">Exp</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">T&amp;C</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const aktif = m.membership?.[0]
              const tnc = statusTnc(m, versiTerbaru)
              return (
                <tr key={m.id} className="border-b">
                  <td className="py-2 pr-4 font-medium">{m.nama}</td>
                  <td className="py-2 pr-4">{m.no_hp ?? '—'}</td>
                  <td className="py-2 pr-4">{aktif?.paket ?? '—'}</td>
                  <td className="py-2 pr-4">{aktif?.tanggal_exp ?? '—'}</td>
                  <td className="py-2 pr-4">{aktif?.status ?? '—'}</td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${tnc.kelas}`}>{tnc.teks}</span>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-2">
                      <Link href={`/member/${m.id}/perpanjang`} className={tombolKecil}>Perpanjang</Link>
                      <Link href={`/member/${m.id}/edit`} className={tombolKecil}>Edit</Link>
                    </div>
                  </td>
                </tr>
              )
            })}
            {members.length === 0 && (
              <tr><td colSpan={7} className="py-4 text-zinc-400">Belum ada member.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}