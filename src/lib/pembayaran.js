import { hariIniJakarta } from './tanggal'

export { hariIniJakarta }

export const METODE_BAYAR = ['Tunai', 'Transfer bank', 'QRIS', 'E-wallet']

// membuat invoice lunas + satu transaksi pembayaran
export async function catatPembayaran(
  supabase,
  { member_id = null, nama_pelanggan = null, total, metode, jenis = 'membership', keterangan = null }
) {
  if (!METODE_BAYAR.includes(metode)) {
    return { error: new Error('Metode bayar tidak valid.'), invoice_id: null }
  }

  const tanggal = hariIniJakarta()

  const { data: invoice, error } = await supabase
    .from('invoice')
    .insert({
      member_id,
      tanggal,
      total,
      status_bayar: 'lunas',
      jenis,
      keterangan,
      nama_pelanggan: member_id ? null : String(nama_pelanggan ?? '').trim() || null,
    })
    .select('id')
    .single()

  if (error) return { error, invoice_id: null }

  const { error: errTransaksi } = await supabase
    .from('transaksi')
    .insert({ invoice_id: invoice.id, metode_bayar: metode, jumlah: total, tanggal })

  if (errTransaksi) {
    // invoice tanpa transaksi tidak boleh tertinggal
    await supabase.from('invoice').delete().eq('id', invoice.id)
    return { error: errTransaksi, invoice_id: null }
  }

  return { error: null, invoice_id: invoice.id }
}