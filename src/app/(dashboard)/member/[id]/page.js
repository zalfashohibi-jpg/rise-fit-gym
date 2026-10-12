import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksMember } from '@/lib/i18n/member'
import { isi } from '@/lib/i18n/umum'
import { formatDurasi } from '@/lib/paket'
import { nomorInvoice } from '@/lib/invoice'
import { WARNA_STATUS, statusMember } from '@/lib/member'
import { formatTanggal, formatWaktu, hariIniJakarta, selisihHari, umurDari } from '@/lib/tanggal'
import { gayaTombolLain } from '@/components/FormKit'

function Baris({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-line text-sm font-medium">{children}</dd>
    </div>
  )
}

function rupiah(n) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

export default async function DetailMemberPage({ params, searchParams }) {
  const { id } = await params
  const sp = await searchParams
  const tab = sp.tab === 'riwayat' ? 'riwayat' : 'info'

  const bahasa = await bahasaAktif()
  const t = ambilTeksMember(bahasa)
  const d = t.detail
  const supabase = await createClient()

  const [{ data: member }, faktur, { data: terbaru }] = await Promise.all([
    supabase
      .from('member')
      .select('*, membership(id, paket, tanggal_mulai, tanggal_exp)')
      .eq('id', id)
      .order('tanggal_mulai', { referencedTable: 'membership', ascending: false })
      .order('id', { referencedTable: 'membership', ascending: false })
      .single(),
    supabase
      .from('invoice')
      .select('id, tanggal, total, jenis, keterangan, transaksi(jumlah)')
      .eq('member_id', id)
      .order('tanggal', { ascending: false })
      .order('id', { ascending: false }),
    supabase.from('peraturan').select('versi').order('id', { ascending: false }).limit(1),
  ])

  if (!member) {
    return <p className="p-10">{d.tidakAda}</p>
  }

  const hariIni = hariIniJakarta()
  const terkini = member.membership?.[0]
  const status = statusMember(terkini, hariIni)
  const versiTerbaru = terbaru?.[0]?.versi

  let tnc
  if (!member.tnc_versi) {
    tnc = { teks: d.tnc.belum, kelas: 'bg-red-50 text-red-700' }
  } else if (versiTerbaru && member.tnc_versi !== versiTerbaru) {
    tnc = { teks: isi(d.tnc.lama, { v: member.tnc_versi }), kelas: 'bg-amber-50 text-amber-700' }
  } else {
    tnc = { teks: isi(d.tnc.setuju, { v: member.tnc_versi }), kelas: 'bg-lime-100 text-lime-800' }
  }

  const invoices = faktur.data ?? []
  const totalBayar = invoices.flatMap((f) => f.transaksi).reduce((n, x) => n + x.jumlah, 0)
  const jumlahTransaksi = invoices.reduce((n, f) => n + f.transaksi.length, 0)
  const hariJadiMember = Math.max(selisihHari(hariIni, member.tanggal_daftar), 1)

  const ringkasan = [
    { label: d.ringkasan.sejak, nilai: formatDurasi(hariJadiMember, bahasa) },
    { label: d.ringkasan.perpanjang, nilai: Math.max((member.membership?.length ?? 0) - 1, 0) },
    { label: d.ringkasan.transaksi, nilai: jumlahTransaksi },
    { label: d.ringkasan.total, nilai: rupiah(totalBayar) },
  ]

  const kelasTab = (aktif) =>
    `border-b-2 px-1 pb-3 text-sm font-semibold ${
      aktif ? 'border-zinc-950 text-zinc-950' : 'border-transparent text-zinc-500 hover:text-zinc-950'
    }`

  return (
    <main className="max-w-3xl p-5 sm:p-8">
      <Link href="/member" className="text-sm text-zinc-500">{d.kembali}</Link>

      <div className="mb-6 mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">{member.nama}</h1>
        <div className="flex gap-2">
          <Link href={`/member/${member.id}/perpanjang`} className={gayaTombolLain}>{t.daftar.aksi.perpanjang}</Link>
          <Link href={`/member/${member.id}/edit`} className={gayaTombolLain}>{t.daftar.aksi.edit}</Link>
        </div>
      </div>

      <div className="mb-6 flex gap-6 border-b border-zinc-200">
        <Link href={`/member/${member.id}`} className={kelasTab(tab === 'info')}>{d.tab.info}</Link>
        <Link href={`/member/${member.id}?tab=riwayat`} className={kelasTab(tab === 'riwayat')}>{d.tab.riwayat}</Link>
      </div>

      {tab === 'info' ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <dl className="grid gap-5 sm:grid-cols-2">
            <Baris label={d.label.nama}>{member.nama}</Baris>
            <Baris label={d.label.hp}>{member.no_hp ?? '—'}</Baris>
            <Baris label={d.label.lahir}>
              {member.tanggal_lahir
                ? `${formatTanggal(member.tanggal_lahir, bahasa)} (${isi(d.umur, { n: umurDari(member.tanggal_lahir, hariIni) })})`
                : '—'}
            </Baris>
            <Baris label={d.label.sejak}>{formatTanggal(member.tanggal_daftar, bahasa)}</Baris>
            <Baris label={d.label.paket}>{terkini?.paket ?? '—'}</Baris>
            <Baris label={d.label.status}>
              <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${WARNA_STATUS[status]}`}>{t.status[status]}</span>
            </Baris>
            <Baris label={d.label.aktivasi}>{terkini ? formatTanggal(terkini.tanggal_mulai, bahasa) : '—'}</Baris>
            <Baris label={d.label.exp}>{terkini ? formatTanggal(terkini.tanggal_exp, bahasa) : '—'}</Baris>
            <Baris label={d.label.tnc}>
              <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${tnc.kelas}`}>{tnc.teks}</span>
              {member.tnc_disetujui_pada && (
                <span className="mt-1 block text-xs font-normal text-zinc-500">
                  {formatWaktu(member.tnc_disetujui_pada, bahasa)}
                </span>
              )}
            </Baris>
            <div className="sm:col-span-2">
              <Baris label={d.label.alamat}>{member.alamat ?? '—'}</Baris>
            </div>
          </dl>
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ringkasan.map((r) => (
              <div key={r.label} className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="text-xs font-medium text-zinc-500">{r.label}</div>
                <div className="mt-2 text-xl font-black tracking-tight">{r.nilai}</div>
              </div>
            ))}
          </div>

          {faktur.error ? (
            <p className="text-sm text-red-600">{isi(t.daftar.galat, { pesan: faktur.error.message })}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b text-left text-zinc-500">
                    <th className="py-2 pr-4">{d.riwayat.tanggal}</th>
                    <th className="py-2 pr-4">{d.riwayat.invoice}</th>
                    <th className="py-2 pr-4">{d.riwayat.paket}</th>
                    <th className="py-2 pr-4">{d.riwayat.item}</th>
                    <th className="py-2 pr-4">{d.riwayat.total}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((f) => {
                    const pembelianItem = f.jenis === 'item'
                    return (
                      <tr key={f.id} className="border-b">
                        <td className="py-2 pr-4">{formatTanggal(f.tanggal, bahasa)}</td>
                        <td className="py-2 pr-4">{nomorInvoice(f.id)}</td>
                        <td className="py-2 pr-4">
                          {pembelianItem ? '—' : (f.keterangan ?? t.jenisInvoice[f.jenis] ?? f.jenis)}
                        </td>
                        <td className="py-2 pr-4">{pembelianItem ? (f.keterangan ?? '—') : '—'}</td>
                        <td className="py-2 pr-4">{rupiah(f.total)}</td>
                      </tr>
                    )
                  })}
                  {invoices.length === 0 && (
                    <tr><td colSpan={5} className="py-4 text-zinc-400">{d.riwayat.kosong}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </main>
  )
}