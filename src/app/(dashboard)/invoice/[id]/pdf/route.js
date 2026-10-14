import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksInvoice } from '@/lib/i18n/invoice'
import { hariIniJakarta } from '@/lib/tanggal'
import { GYM } from '@/lib/gym'
import { barisInvoice, hitungStatusBayar, nomorInvoice } from '@/lib/invoice'
import { buatPdfInvoice } from '@/lib/pdf-invoice'

export async function GET(request, { params }) {
  const { id } = await params
  const idAngka = Number(id)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  if (!Number.isInteger(idAngka)) return new Response('Not found', { status: 404 })

  const { data: invoice } = await supabase
    .from('invoice')
    .select(
      'id, tanggal, total, status_bayar, jenis, nama_pelanggan, keterangan, rincian, jatuh_tempo, cabang(nama_cabang, alamat, kota), member(nama, no_hp), transaksi(tanggal, metode_bayar, jumlah)'
    )
    .eq('id', idAngka)
    .order('tanggal', { referencedTable: 'transaksi' })
    .order('id', { referencedTable: 'transaksi' })
    .maybeSingle()

  // RLS membuat invoice cabang lain tidak terlihat, jadi hasilnya sama dengan "tidak ada"
  if (!invoice) return new Response('Not found', { status: 404 })

  const bahasa = await bahasaAktif()
  const t = ambilTeksInvoice(bahasa)
  const hitung = hitungStatusBayar(invoice, hariIniJakarta())

  const bytes = await buatPdfInvoice({
    bahasa,
    teks: t.pdf,
    kop: {
      nama: GYM.nama,
      cabang: invoice.cabang?.nama_cabang ?? '',
      alamat: [invoice.cabang?.alamat, invoice.cabang?.kota].filter(Boolean).join(', '),
      telepon: GYM.telepon,
      email: GYM.email,
    },
    invoice: {
      nomor: nomorInvoice(invoice.id),
      tanggal: invoice.tanggal,
      jatuhTempo: invoice.jatuh_tempo,
      statusTeks: t.status[hitung.status],
      total: invoice.total,
      dibayar: hitung.dibayar,
      sisa: hitung.sisa,
    },
    pelanggan: {
      nama: invoice.member?.nama ?? invoice.nama_pelanggan ?? t.pdf.umum,
      hp: invoice.member?.no_hp ?? '',
    },
    baris: barisInvoice(invoice, t.jenis[invoice.jenis] ?? invoice.jenis),
    pembayaran: invoice.transaksi.map((x) => ({
      tanggal: x.tanggal,
      metode: t.metode[x.metode_bayar] ?? x.metode_bayar,
      jumlah: x.jumlah,
    })),
  })

  return new Response(bytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${nomorInvoice(invoice.id)}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}