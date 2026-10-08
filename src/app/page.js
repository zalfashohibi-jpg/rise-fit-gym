export const dynamic = 'force-dynamic'

import { supabase } from '@/lib/supabase'

export default async function MemberPage() {
  const { data: members, error } = await supabase
    .from('member')
    .select('*, membership(paket, tanggal_exp, status)')
    .order('nama')

  if (error) {
    return <p className="p-10 text-red-600">Gagal ambil data: {error.message}</p>
  }

  return (
    <main className="p-10 font-sans">
      <h1 className="text-2xl font-semibold mb-6">Data Member</h1>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2 pr-4">Nama</th>
            <th className="py-2 pr-4">No. HP</th>
            <th className="py-2 pr-4">Paket</th>
            <th className="py-2 pr-4">Exp</th>
            <th className="py-2 pr-4">Status</th>
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
              </tr>
            )
          })}
        </tbody>
      </table>
    </main>
  )
}