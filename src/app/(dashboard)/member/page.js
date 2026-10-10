import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function MemberPage() {
  const supabase = await createClient()

  const { data: members, error } = await supabase
    .from('member')
    .select('*, membership(paket, tanggal_exp, status)')
    .order('nama')
    .order('tanggal_exp', {referencedTable : 'membership', ascending: false})

  if (error) {
    return <p className="p-10 text-red-600">Gagal ambil data: {error.message}</p>
  }

  return (
    <main className="p-10 font-sans">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Data Member</h1>
            <div className="flex items-center gap-3">
                <Link
                    href="/member/baru"
                    className="bg-teal-700 text-white rounded-md px-3 py-1.5 text-sm font-medium">
                    + Member baru
                </Link>
            </div>
        </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2 pr-4">Nama</th>
            <th className="py-2 pr-4">No. HP</th>
            <th className="py-2 pr-4">Paket</th>
            <th className="py-2 pr-4">Exp</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4"></th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const activeMembership = m.membership?.[0]
            return (
              <tr key={m.id} className="border-b">
                <td className="py-2 pr-4 font-medium">{m.nama}</td>
                <td className="py-2 pr-4">{m.no_hp}</td>
                <td className="py-2 pr-4">{activeMembership?.paket ?? '—'}</td>
                <td className="py-2 pr-4">{activeMembership?.tanggal_exp ?? '—'}</td>
                <td className="py-2 pr-4">{activeMembership?.status ?? '—'}</td>
                <td className="py-2 pr-4 flex gap-2">
                    <Link href={`/member/${m.id}/perpanjang`} className="border border-stone-300 rounded-md px-2.5 py-1 text-xs">
                    perpanjang
                    </Link>
                    <Link href={`/member/${m.id}/edit`} className="border border-stone-300 rounded-md px-2.5 py-1 text-xs">
                    Edit
                    </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </main>
  )
}