import { selisihHari } from './tanggal'

export const WARNA_STATUS = {
  aktif: 'bg-lime-100 text-lime-800',
  segera: 'bg-amber-50 text-amber-700',
  kedaluwarsa: 'bg-red-50 text-red-700',
  belum: 'bg-zinc-100 text-zinc-600',
}

// dihitung dari tanggal, karena kolom status di database tidak berubah sendiri saat membership kedaluwarsa
export function statusMember(terkini, hariIni) {
  if (!terkini) return 'belum'
  const sisa = selisihHari(terkini.tanggal_exp, hariIni)
  if (sisa < 0) return 'kedaluwarsa'
  if (sisa <= 7) return 'segera'
  return 'aktif'
}