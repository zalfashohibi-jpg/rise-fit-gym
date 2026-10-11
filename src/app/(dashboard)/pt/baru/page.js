import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { METODE_BAYAR, catatPembayaran, hariIniJakarta } from '@/lib/pembayaran'

function tambahHari(tanggal, n) {
  const d = new Date(tanggal)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

async function beliPaketPt(formData) {
  'use server'

  const supabase = await createClient()

  const member_id = Number(formData.get('member_id'))
  const paket_id = Number(formData.get('paket_id'))
  const tanggal_mulai = String(formData.get('tanggal_mulai'))
  const metode = String(formData.get('metode'))

  if (!member_id) throw new Error('Pilih member.')

  const { data: paket, error: errPaket } = await supabase
    .from('paket_membership')
    .select('nama, durasi_hari, jumlah_sesi, harga')
    .eq('id', paket_id)
    .eq('jenis', 'pt')
    .eq('aktif', true)
    .single()

  if (errPaket) throw new Error('Paket PT tidak ditemukan.')

  const tanggal_exp = tambahHari(tanggal_mulai, paket.durasi_hari)

  const { error: errBayar, invoice_id } = await catatPembayaran(supabase, {
    member_id,
    total: paket.harga,
    metode,
    jenis: 'pt',
    keterangan: paket.nama,
  })

  if (errBayar) throw new Error(errBayar.message)

  const { data: baru, error } = await supabase
    .from('paket_pt_member')
    .insert({
      member_id,
      paket_nama: paket.nama,
      total_sesi: paket.jumlah_sesi,
      tanggal_mulai,
      tanggal_exp,
      invoice_id,
    })
    .select('id')
    .single()

  if (error) {
    // batalkan pembayarannya supaya tidak ada uang tercatat tanpa paket
    await supabase.from('invoice').delete().eq('id', invoice_id)
    throw new Error(error.message)
  }

  redirect(`/pt/${baru.id}`)
}

export default async function PtBaruPage() {
  const supabase = await createClient()

  const [{ data: paket }, { data: members }] = await Promise.all([
    supabase
      .from('paket_membership')
      .select('id, nama, harga, jumlah_sesi, durasi_hari')
      .eq('jenis', 'pt')
      .eq('aktif', true)
      .order('jumlah_sesi'),
    supabase.from('member').select('id, nama, no_hp').order('nama'),
  ])

  const input = 'w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-zinc-950'
  const tombolLain = 'border border-zinc-200 bg-white rounded-xl font-semibold hover:bg-zinc-50 px-4 py-2 text-sm'

  if (!paket?.length || !members?.length) {
    return (
      <main className="p-5 sm:p-8 max-w-lg">
        <h1 className="mb-4 text-2xl font-black tracking-tight">Paket PT baru</h1>
        <p className="mb-4 text-zinc-600">
          Sebelum menjual paket PT, pastikan sudah ada minimal satu paket berjenis Paket PT yang aktif dan satu member.
        </p>
        <div className="flex gap-3">
          <Link href="/paket" className={tombolLain}>Kelola paket</Link>
          <Link href="/member/baru" className={tombolLain}>Member baru</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="p-5 sm:p-8 max-w-lg">
      <Link href="/pt" className="text-sm text-zinc-500">← Kembali ke paket PT</Link>
      <h1 className="mb-6 mt-3 text-2xl font-black tracking-tight">Paket PT baru</h1>

      <form action={beliPaketPt} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm text-zinc-500">Member</label>
          <select name="member_id" required className={input}>
            <option value="">— pilih member —</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nama}
                {m.no_hp ? ` · ${m.no_hp}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-500">Paket PT</label>
          <select name="paket_id" className={input}>
            {paket.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama} · {p.jumlah_sesi} sesi · {p.durasi_hari} hari · Rp {p.harga.toLocaleString('id-ID')}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-500">Tanggal mulai</label>
          <input name="tanggal_mulai" type="date" required defaultValue={hariIniJakarta()} className={input} />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-500">Metode pembayaran</label>
          <select name="metode" className={input}>
            {METODE_BAYAR.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <p className="text-xs text-zinc-400">Dicatat lunas sebesar harga paket.</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="bg-lime-300 text-zinc-950 rounded-xl px-5 py-2.5 text-sm font-bold">
            Simpan
          </button>
          <Link href="/pt" className={tombolLain}>Batal</Link>
        </div>
      </form>
    </main>
  )
}