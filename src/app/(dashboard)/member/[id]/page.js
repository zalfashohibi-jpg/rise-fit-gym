import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function umur(tanggalLahir, hariIni) {
  const [ly, lm, ld] = tanggalLahir.split('-').map(Number)
  const [ty, tm, td] = hariIni.split('-').map(Number)
  let u = ty - ly
  if (tm < lm || (tm === lm && td < ld)) u -= 1
  return u
}

function selisihHari(a, b) {
  return Math.round((new Date(a) - new Date(b)) / 86400000)
}

function tanggalIndo(t) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(t))
}

const JENIS = { membership: 'Membership', pt: 'Paket PT', visit: 'Visit gym', item: 'Item' }

function rupiah(n) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

function lamaMember(hari) {
  if (hari < 30) return `${hari} hari`
  if (hari < 365) return `${Math.floor(hari / 30)} bulan`
  return `${Math.floor(hari / 365)} tahun ${Math.floor((hari % 365) / 30)} bulan`
}

function Baris({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-line text-sm font-medium">{children}</dd>
    </div>
  )
}

export default async function DetailMemberPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: member }, faktur] = await Promise.all([
    supabase
      .from('member')
      .select('*, membership(id, paket, tanggal_mulai, tanggal_exp, status)')
      .eq('id', id)
      .order('tanggal_mulai', { referencedTable: 'membership', ascending: false })
      .single(),
    supabase
      .from('invoice')
      .select('id, tanggal, status_bayar, jenis, keterangan, transaksi(id, tanggal, metode_bayar, jumlah)')
      .eq('member_id', id),
  ])

  if (!member) {
    return <p className="p-10">Member tidak ditemukan.</p>
  }

  const hariIni = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
  const terkini = member.membership?.[0]

  // masa berlaku membership terkini
  let masa = null
  if (terkini) {
    const sisa = selisihHari(terkini.tanggal_exp, hariIni)
    if (sisa < 0) masa = { teks: `Berakhir ${-sisa} hari lalu`, kelas: 'bg-red-50 text-red-700' }
    else if (sisa <= 7) masa = { teks: `${sisa} hari lagi`, kelas: 'bg-amber-50 text-amber-700' }
    else masa = { teks: `Aktif · ${sisa} hari lagi`, kelas: 'bg-lime-100 text-lime-800' }
  }

  // satu baris per transaksi; invoice yang belum ada pembayarannya tetap muncul
  const invoices = faktur.data ?? []
  const baris = invoices
    .flatMap((f) =>
      f.transaksi.length
        ? f.transaksi.map((t) => ({
            key: `t${t.id}`,
            tanggal: t.tanggal,
            invoice: f.id,
            metode: t.metode_bayar,
            jumlah: t.jumlah,
            status: f.status_bayar,
            jenis: f.jenis, keterangan: f.keterangan,
          }))
        : [{ key: `i${f.id}`, tanggal: f.tanggal, invoice: f.id, metode: null, jumlah: null, status: f.status_bayar }]
    )
    .sort((a, b) => (a.tanggal < b.tanggal ? 1 : a.tanggal > b.tanggal ? -1 : 0))

  const semuaTransaksi = invoices.flatMap((f) => f.transaksi)
  const totalBayar = semuaTransaksi.reduce((jumlah, t) => jumlah + t.jumlah, 0)
  const jumlahPerpanjang = Math.max((member.membership?.length ?? 0) - 1, 0)

  const ringkasan = [
    { label: 'Member sejak', nilai: lamaMember(selisihHari(hariIni, member.tanggal_daftar)) },
    { label: 'Kali perpanjang', nilai: jumlahPerpanjang },
    { label: 'Jumlah transaksi', nilai: semuaTransaksi.length },
    { label: 'Total pembayaran', nilai: rupiah(totalBayar) },
  ]

  const tombol = 'border border-zinc-200 bg-white rounded-xl font-semibold hover:bg-zinc-50 px-4 py-2 text-sm'

  return (
    <main className="p-5 sm:p-8 max-w-3xl">
      <Link href="/member" className="text-sm text-zinc-500">← Kembali ke daftar member</Link>

      <div className="mt-3 mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">{member.nama}</h1>
        <div className="flex gap-2">
          <Link href={`/member/${member.id}/perpanjang`} className={tombol}>Perpanjang</Link>
          <Link href={`/member/${member.id}/edit`} className={tombol}>Edit</Link>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5">
        <dl className="grid gap-5 sm:grid-cols-2">
          <Baris label="Nama">{member.nama}</Baris>
          <Baris label="No. HP">{member.no_hp ?? '—'}</Baris>
          <Baris label="Tanggal lahir">
            {member.tanggal_lahir
              ? `${tanggalIndo(member.tanggal_lahir)} (${umur(member.tanggal_lahir, hariIni)} tahun)`
              : '—'}
          </Baris>
          <Baris label="Tanggal member dibuat">{tanggalIndo(member.tanggal_daftar)}</Baris>
          <Baris label="Paket">{terkini?.paket ?? '—'}</Baris>
          <Baris label="Masa berlaku">
            {terkini ? (
              <>
                {tanggalIndo(terkini.tanggal_mulai)} – {tanggalIndo(terkini.tanggal_exp)}
                <span className={`mt-1 block w-fit rounded-md px-2 py-0.5 text-xs font-bold ${masa.kelas}`}>
                  {masa.teks}
                </span>
              </>
            ) : (
              '—'
            )}
          </Baris>
          <div className="sm:col-span-2">
            <Baris label="Alamat">{member.alamat ?? '—'}</Baris>
          </div>
        </dl>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ringkasan.map((r) => (
          <div key={r.label} className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-medium text-zinc-500">{r.label}</div>
            <div className="mt-2 text-xl font-black tracking-tight">{r.nilai}</div>
          </div>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-bold">Riwayat transaksi</h2>
      {faktur.error ? (
        <p className="text-sm text-red-600">Gagal ambil riwayat: {faktur.error.message}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-zinc-500">
                <th className="py-2 pr-4">Tanggal</th>
                <th className="py-2 pr-4">Invoice</th>
                <th className="py-2 pr-4">Metode</th>
                <th className="py-2 pr-4">Jumlah</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Jenis</th>
                <th className="py-2 pr-4">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {baris.map((b) => (
                <tr key={b.key} className="border-b">
                  <td className="py-2 pr-4">{b.tanggal}</td>
                  <td className="py-2 pr-4">#{b.invoice}</td>
                  <td className="py-2 pr-4">{JENIS[b.jenis] ?? b.jenis}</td>
                  <td className="py-2 pr-4">{b.keterangan ?? '—'}</td>
                  <td className="py-2 pr-4">{b.metode ?? '—'}</td>
                  <td className="py-2 pr-4">{b.jumlah != null ? rupiah(b.jumlah) : '—'}</td>
                  <td className="py-2 pr-4">{b.status}</td>
                </tr>
              ))}
              {baris.length === 0 && (
                <tr><td colSpan={7} className="py-4 text-zinc-400">Belum ada transaksi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}