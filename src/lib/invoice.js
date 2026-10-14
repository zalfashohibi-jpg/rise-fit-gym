export function nomorInvoice(id) {
  return `INV-${String(id).padStart(5, '0')}`
}

export const JENIS_INVOICE = ['membership', 'pt', 'visit', 'item', 'manual']
export const STATUS_TAMPIL = ['lunas', 'belum']
export const BATAS_RINCIAN = 20

export const WARNA_STATUS_BAYAR = {
  lunas: 'bg-lime-100 text-lime-800',
  sebagian: 'bg-amber-50 text-amber-700',
  belum: 'bg-zinc-100 text-zinc-600',
  terlambat: 'bg-red-50 text-red-700',
}

// status dihitung dari jumlah pembayaran dan jatuh tempo, bukan hanya dibaca dari database
export function hitungStatusBayar(invoice, hariIni) {
  const dibayar = (invoice.transaksi ?? []).reduce((n, t) => n + t.jumlah, 0)
  const lunas = invoice.status_bayar === 'lunas' || dibayar >= invoice.total

  let status
  if (lunas) status = 'lunas'
  else if (invoice.jatuh_tempo && invoice.jatuh_tempo < hariIni) status = 'terlambat'
  else if (dibayar > 0) status = 'sebagian'
  else status = 'belum'

  return { dibayar, sisa: lunas ? 0 : Math.max(invoice.total - dibayar, 0), status }
}

// baris untuk tabel rincian dan PDF; invoice tanpa rincian ditampilkan sebagai satu baris
export function barisInvoice(invoice, labelJenis) {
  if (Array.isArray(invoice.rincian) && invoice.rincian.length > 0) {
    return invoice.rincian.map((b) => ({
      deskripsi: String(b.deskripsi ?? ''),
      qty: Number(b.qty) || 1,
      harga: Number(b.harga) || 0,
    }))
  }
  return [{ deskripsi: invoice.keterangan || labelJenis, qty: 1, harga: invoice.total }]
}