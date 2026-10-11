import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { hariIniJakarta } from '@/lib/pembayaran'
import { hitungPaketPt } from '@/lib/pt'

async function catatSesi(formData) {
  'use server'

  const supabase = await createClient()
  const paket_id = Number(formData.get('paket_id'))

  const { error } = await supabase.rpc('catat_sesi_pt', {
    p_paket_id: paket_id,
    p_trainer_id: Number(formData.get('trainer_id')),
    p_tanggal: String(formData.get('tanggal')),
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/pt/${paket_id}`)
}

async function batalkanSesi(formData) {
  'use server'

  const supabase = await createClient()
  const id = Number(formData.get('id'))
  const paket_id = Number(formData.get('paket_id'))

  const { error } = await supabase.from('pt_session').delete().eq('id', id).eq('paket_pt_id', paket_id)
  if (error) throw new Error(error.message)

  revalidatePath(`/pt/${paket_id}`)
}

export default async function DetailPtPage({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const hariIni = hariIniJakarta()

  const [{ data: paket }, { data: trainer }] = await Promise.all([
    supabase
      .from('paket_pt_member')
      .select('*, member(id, nama), pt_session(id, tanggal, status, personal_trainer(karyawan(nama)))')
      .eq('id', id)
      .order('tanggal', { referencedTable: 'pt_session', ascending: false })
      .single(),
    supabase.from('personal_trainer').select('id, karyawan(nama)'),
  ])

  if (!paket) {
    return <p className="p-10">Paket PT tidak ditemukan.</p>
  }

  const h = hitungPaketPt(paket, hariIni)
  const sudahMulai = hariIni >= paket.tanggal_mulai
  const adaTrainer = (trainer?.length ?? 0) > 0
  const bisaCatat = h.berlaku && sudahMulai && adaTrainer

  const input = 'w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-zinc-950'
  const kartu = [
    { label: 'Sisa sesi', nilai: `${h.sisa} / ${paket.total_sesi}` },
    { label: 'Sesi terpakai', nilai: h.terpakai },
    { label: 'Mulai', nilai: paket.tanggal_mulai },
    { label: 'Berlaku sampai', nilai: paket.tanggal_exp },
  ]

  return (
    <main className="p-5 sm:p-8 max-w-3xl">
      <Link href="/pt" className="text-sm text-zinc-500">← Kembali ke paket PT</Link>

      <div className="mb-6 mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{paket.paket_nama}</h1>
          <Link href={`/member/${paket.member?.id}`} className="text-sm text-zinc-500 hover:underline">
            {paket.member?.nama}
          </Link>
        </div>
        <span className={`rounded-md px-3 py-1 text-sm font-bold ${h.status.kelas}`}>{h.status.teks}</span>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kartu.map((k) => (
          <div key={k.label} className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-medium text-zinc-500">{k.label}</div>
            <div className="mt-2 text-lg font-black tracking-tight">{k.nilai}</div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-bold">Catat sesi selesai</h2>
      {!adaTrainer ? (
        <p className="mb-8 text-sm text-zinc-500">
          Belum ada personal trainer. Tambahkan di menu Karyawan &amp; trainer.
        </p>
      ) : !sudahMulai ? (
        <p className="mb-8 text-sm text-zinc-500">Paket ini baru mulai pada {paket.tanggal_mulai}.</p>
      ) : !bisaCatat ? (
        <p className="mb-8 text-sm text-zinc-500">
          {h.sisa === 0 ? 'Sesi paket ini sudah habis.' : 'Masa berlaku paket ini sudah lewat.'}
        </p>
      ) : (
        <form action={catatSesi} className="mb-8 grid max-w-xl gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input type="hidden" name="paket_id" value={paket.id} />
          <input
            name="tanggal"
            type="date"
            required
            defaultValue={hariIni}
            min={paket.tanggal_mulai}
            max={hariIni < paket.tanggal_exp ? hariIni : paket.tanggal_exp}
            className={input}
          />
          <select name="trainer_id" required className={input}>
            {trainer.map((t) => (
              <option key={t.id} value={t.id}>{t.karyawan?.nama}</option>
            ))}
          </select>
          <button type="submit" className="bg-lime-300 text-zinc-950 rounded-xl px-5 py-2.5 text-sm font-bold">
            Catat
          </button>
        </form>
      )}

      <h2 className="mb-3 text-lg font-bold">Riwayat sesi</h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-zinc-500">
              <th className="py-2 pr-4">Tanggal</th>
              <th className="py-2 pr-4">Trainer</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {paket.pt_session.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="py-2 pr-4">{s.tanggal}</td>
                <td className="py-2 pr-4">{s.personal_trainer?.karyawan?.nama ?? '—'}</td>
                <td className="py-2 pr-4">{s.status}</td>
                <td className="py-2 pr-4">
                  <form action={batalkanSesi}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="paket_id" value={paket.id} />
                    <button className="border border-zinc-200 bg-white rounded-xl font-semibold hover:bg-zinc-50 px-2.5 py-1 text-xs">
                      Batalkan
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {paket.pt_session.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-zinc-400">Belum ada sesi yang dicatat.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}