import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const JENIS = {
  membership: 'Membership',
  pt: 'Paket PT',
  visit: 'Visit gym',
}

async function tambahPaket(formData) {
  'use server'

  const supabase = await createClient()
  const nama = String(formData.get('nama')).trim()
  const jenis = String(formData.get('jenis'))
  const durasi_hari = Number(formData.get('durasi_hari'))
  const harga = Number(formData.get('harga'))
  const sesiMentah = String(formData.get('jumlah_sesi') ?? '').trim()

  if (!(jenis in JENIS)) throw new Error('Jenis paket tidak valid.')
  if (!Number.isInteger(durasi_hari) || durasi_hari < 1) {
    throw new Error('Durasi harus berupa angka hari, minimal 1.')
  }

  let jumlah_sesi = null
  if (jenis === 'pt') {
    jumlah_sesi = Number(sesiMentah)
    if (!Number.isInteger(jumlah_sesi) || jumlah_sesi < 1) {
      throw new Error('Paket PT wajib mengisi jumlah sesi.')
    }
  }

  const { error } = await supabase
    .from('paket_membership')
    .insert({ nama, jenis, durasi_hari, jumlah_sesi, harga })

  if (error) throw new Error(error.message)

  revalidatePath('/paket')
}

async function ubahStatus(formData) {
  'use server'

  const supabase = await createClient()
  const id = Number(formData.get('id'))
  const aktif = formData.get('aktif') === 'true'

  const { error } = await supabase.from('paket_membership').update({ aktif }).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/paket')
}

export default async function PaketPage() {
  const supabase = await createClient()

  const { data: paket, error } = await supabase
    .from('paket_membership')
    .select('*')
    .order('jenis')
    .order('durasi_hari')

  if (error) {
    return <p className="p-10 text-red-600">Gagal ambil data: {error.message}</p>
  }

  const input = 'w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-zinc-950'

  return (
    <main className="p-5 sm:p-8 max-w-3xl">
      <h1 className="text-2xl font-black tracking-tight mb-1">Paket membership</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Membership, paket PT, dan visit gym dikelola di sini. Paket yang aktif muncul sebagai pilihan di form terkait.
      </p>

      <div className="overflow-x-auto mb-10">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="text-left text-zinc-500 border-b">
              <th className="py-2 pr-4">Nama paket</th>
              <th className="py-2 pr-4">Jenis</th>
              <th className="py-2 pr-4">Durasi</th>
              <th className="py-2 pr-4">Sesi</th>
              <th className="py-2 pr-4">Harga</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {paket.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-2 pr-4 font-medium">{p.nama}</td>
                <td className="py-2 pr-4">{JENIS[p.jenis] ?? p.jenis}</td>
                <td className="py-2 pr-4">{p.durasi_hari} hari</td>
                <td className="py-2 pr-4">{p.jumlah_sesi ?? '—'}</td>
                <td className="py-2 pr-4">Rp {p.harga.toLocaleString('id-ID')}</td>
                <td className="py-2 pr-4">{p.aktif ? 'Aktif' : 'Nonaktif'}</td>
                <td className="py-2 pr-4">
                  <form action={ubahStatus}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="aktif" value={p.aktif ? 'false' : 'true'} />
                    <button className="border border-zinc-200 bg-white rounded-xl font-semibold hover:bg-zinc-50 px-2.5 py-1 text-xs">
                      {p.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {paket.length === 0 && (
              <tr><td colSpan={7} className="py-4 text-zinc-400">Belum ada paket. Tambahkan di bawah.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-bold mb-3">Tambah paket</h2>
      <form action={tambahPaket} className="space-y-4 max-w-md">
        <div className="space-y-1">
          <label className="text-sm text-zinc-500">Nama paket</label>
          <input name="nama" required placeholder="misal: Membership 30 hari" className={input} />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-500">Jenis paket</label>
          <select name="jenis" className={input}>
            <option value="membership">Membership</option>
            <option value="pt">PT Session</option>
            <option value="visit">Visit gym</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-500">Durasi / masa berlaku (hari)</label>
          <input name="durasi_hari" type="number" min="1" required placeholder="misal: 30" className={input} />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-500">Input sesi (opsional, wajib untuk Paket PT)</label>
          <input name="jumlah_sesi" type="number" min="1" placeholder="misal: 15" className={input} />
          <p className="text-xs text-zinc-400">Diabaikan kalau jenisnya bukan Paket PT.</p>
        </div>

        <div className="space-y-1">
          <label className="text-sm text-zinc-500">Harga (Rp)</label>
          <input name="harga" type="number" min="0" required className={input} />
        </div>

        <button type="submit" className="bg-lime-300 text-zinc-950 rounded-xl px-5 py-2.5 text-sm font-bold">
          Simpan paket
        </button>
      </form>
    </main>
  )
}