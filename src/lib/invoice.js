/// Fungsi bantu untuk menghasilkan/format nomor invoice
/// Digunakan di DetailMemberPage untuk menampilkan nomor invoice di riwayat transaksi

// Format nomor invoice berdasarkan ID invoice
// Contoh: invoice ID 1 → "INV-0001", atau bisa pakai format lain
export function nomorInvoice(id) {
  if (!id) return '—'
  // Format INV diikuti dengan ID padding nol 4 digit
  // Misal: INV-0001, INV-0002, dst
  const num = String(id).padStart(4, '0')
  return `INV-${num}`
}