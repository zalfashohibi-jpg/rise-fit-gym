export const JENIS_PAKET = ['membership', 'pt', 'visit']
export const KELAS_PAKET = ['private', 'reguler']
export const BATAS_SESI = { min: 1, max: 100 }
export const BATAS_DURASI = { min: 1, max: 3650 }

const SATUAN = {
  id: { hari: ['Hari', 'Hari'], bulan: ['Bulan', 'Bulan'], tahun: ['Tahun', 'Tahun'] },
  en: { hari: ['Day', 'Days'], bulan: ['Month', 'Months'], tahun: ['Year', 'Years'] },
}

function satuanTeks(jumlah, jenis, bahasa) {
  const [tunggal, jamak] = (SATUAN[bahasa] ?? SATUAN.id)[jenis]
  return `${jumlah} ${jumlah === 1 ? tunggal : jamak}`
}

// 30 hari = 1 bulan, 365 hari = 1 tahun, sisanya ditulis bertahap (45 hari = 1 Bulan 15 Hari)
export function formatDurasi(hari, bahasa = 'id') {
  const total = Number(hari)
  if (!Number.isInteger(total) || total < 1) return '—'

  const tahun = Math.floor(total / 365)
  const sisaTahun = total % 365
  const bulan = Math.floor(sisaTahun / 30)
  const sisaHari = sisaTahun % 30

  const bagian = []
  if (tahun) bagian.push(satuanTeks(tahun, 'tahun', bahasa))
  if (bulan) bagian.push(satuanTeks(bulan, 'bulan', bahasa))
  if (sisaHari) bagian.push(satuanTeks(sisaHari, 'hari', bahasa))

  return bagian.join(' ')
}