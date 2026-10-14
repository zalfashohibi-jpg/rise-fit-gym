import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksInvoice } from '@/lib/i18n/invoice'
import { formatTanggal, hariIniJakarta } from '@/lib/tanggal'
import { konteksCabang } from '@/lib/cabang'
import { METODE_BAYAR } from '@/lib/pembayaran'
import { WARNA_STATUS_BAYAR, barisInvoice, hitungStatusBayar, nomorInvoice } from '@/lib/invoice'
import FormBayar from './FormBayar'

function Baris({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{children}</dd>
    </div>
  )
}

const rupiah = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`

export default async function DetailInvoicePage({ params }) {
  const { id } = await params
  const bahasa = await bahasaAktif()
  const t = ambilTeksInvoice(bahasa)
  const d = t.detail
  const konteks = await konteksCabang()
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoice')
    .select(
      'id, tanggal, total, status_bayar, jenis, nama_pelanggan, keterangan, rincian, jatuh_tempo, cabang(nama_cabang), member(id, nama, no_hp), transaksi(id, tanggal, metode_bayar, jumlah)'
    )
    .eq('id', id)
    .order('tanggal', { referencedTable: 'transaksi' })
    .order('id', { referencedTable: 'transaksi' })
    .maybeSingle()

  if (!invoice) {
    return <p className="p-10">{d.tidakAda}</p>
  }

  const hitung = hitungStatusBayar(invoice, hariIniJakarta())
  const baris = barisInvoice(invoice, t.jenis[invoice.jenis] ?? invoice.jenis)
  const opsiMetode = METODE_BAYAR.map((m) => ({ nilai: m, label: t.metode[m] ?? m }))
  const boleh = Boolean(konteks?.bolehTulis) && hitung.sisa > 0

  return (
    <main className="max-w-3xl p-5 sm:p-8">
      <Link href="/invoice" className="text-sm text-zinc-500">{d.kembali}</Link>

      <div className="mb-6 mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black tracking-tight">{nomorInvoice(invoice.id)}</h1>
          <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${WARNA_STATUS_BAYAR[hitung.status]}`}>
            {t.status[hitung.status]}
          </span>
        </div>
        <a
          href={`/invoice/${invoice.id}/pdf`}
          target="_blank"
          rel="noopener"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50"
        >
          {d.unduh}
        </a>
      </div>

      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5">
        <dl className="grid gap-5 sm:grid-cols-3">
          <Baris label={d.label.tanggal}>{formatTanggal(invoice.tanggal, bahasa)}</Baris>
          <Baris label={d.label.pelanggan}>
            {invoice.member ? (
              <Link href={`/member/${invoice.member.id}`} className="hover:underline">{invoice.member.nama}</Link>
            ) : (
              (invoice.nama_pelanggan ?? t.daftar.umum)
            )}
          </Baris>
          <Baris label={d.label.jenis}>{t.jenis[invoice.jenis] ?? invoice.jenis}</Baris>
          <Baris label={d.label.jatuhTempo}>
            {invoice.jatuh_tempo ? formatTanggal(invoice.jatuh_tempo, bahasa) : '—'}
          </Baris>
          <Baris label={d.label.cabang}>{invoice.cabang?.nama_cabang ?? '—'}</Baris>
          <Baris label={d.label.keterangan}>{invoice.keterangan ?? '—'}</Baris>
        </dl>
      </div>

      <h2 className="mb-3 text-lg font-bold">{d.rincian.judul}</h2>
      <div className="mb-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-zinc-500">
              <th className="py-2 pr-4">{d.rincian.deskripsi}</th>
              <th className="py-2 pr-4">{d.rincian.qty}</th>
              <th className="py-2 pr-4">{d.rincian.harga}</th>
              <th className="py-2 pr-4">{d.rincian.jumlah}</th>
            </tr>
          </thead>
          <tbody>
            {baris.map((b, i) => (
              <tr key={i} className="border-b">
                <td className="py-2 pr-4">{b.deskripsi}</td>
                <td className="py-2 pr-4">{b.qty}</td>
                <td className="py-2 pr-4">{rupiah(b.harga)}</td>
                <td className="py-2 pr-4">{rupiah(b.qty * b.harga)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="mb-10 ml-auto w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between"><dt className="text-zinc-500">{d.ringkasan.total}</dt><dd className="font-bold">{rupiah(invoice.total)}</dd></div>
        <div className="flex justify-between"><dt className="text-zinc-500">{d.ringkasan.dibayar}</dt><dd>{rupiah(hitung.dibayar)}</dd></div>
        <div className="flex justify-between"><dt className="font-semibold">{d.ringkasan.sisa}</dt><dd className="font-bold">{rupiah(hitung.sisa)}</dd></div>
      </dl>

      <h2 className="mb-3 text-lg font-bold">{d.pembayaran.judul}</h2>
      <div className="mb-10 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-zinc-500">
              <th className="py-2 pr-4">{d.pembayaran.tanggal}</th>
              <th className="py-2 pr-4">{d.pembayaran.metode}</th>
              <th className="py-2 pr-4">{d.pembayaran.jumlah}</th>
            </tr>
          </thead>
          <tbody>
            {invoice.transaksi.map((x) => (
              <tr key={x.id} className="border-b">
                <td className="py-2 pr-4">{formatTanggal(x.tanggal, bahasa)}</td>
                <td className="py-2 pr-4">{t.metode[x.metode_bayar] ?? x.metode_bayar}</td>
                <td className="py-2 pr-4">{rupiah(x.jumlah)}</td>
              </tr>
            ))}
            {invoice.transaksi.length === 0 && (
              <tr><td colSpan={3} className="py-4 text-zinc-400">{d.pembayaran.kosong}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {boleh && (
        <>
          <h2 className="mb-3 text-lg font-bold">{d.bayar.judul}</h2>
          <FormBayar
            key={hitung.sisa}
            invoiceId={invoice.id}
            sisa={hitung.sisa}
            opsiMetode={opsiMetode}
            teks={d.bayar}
          />
        </>
      )}
    </main>
  )
}