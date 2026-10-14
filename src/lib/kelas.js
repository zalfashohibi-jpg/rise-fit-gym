import { hariIniJakarta } from './tanggal'

export const TIPE_KELAS = ['private', 'reguler']
export const SATUAN_DURASI = ['menit', 'jam']
export const BATAS_KAPASITAS = { min: 1, max: 100, awal: 20 }
export const BATAS_DURASI_MENIT = { min: 15, max: 480 }

export const WARNA_STATUS_KELAS = {
  dijadwalkan: 'bg-sky-50 text-sky-700',
  berlangsung: 'bg-lime-100 text-lime-800',
  selesai: 'bg-zinc-100 text-zinc-600',
  dibatalkan: 'bg-red-50 text-red-700',
}

export function menitDariJam(jam) {
  const [h, m] = String(jam).split(':').map(Number)
  return h * 60 + m
}

export function jamDariMenit(total) {
  if (total === 1440) return '24:00'
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function jamSelesai(jamMulai, durasiMenit) {
  return jamDariMenit(menitDariJam(jamMulai) + durasiMenit)
}

// angka + satuan menjadi menit utuh; 1,5 jam = 90 menit, 90,5 menit ditolak
export function hitungDurasiMenit(nilai, satuan) {
  const angka = Number(nilai)
  if (!Number.isFinite(angka) || angka <= 0) return null
  const menit = satuan === 'jam' ? Math.round(angka * 60) : angka
  return Number.isInteger(menit) ? menit : null
}

const UNIT = { id: { jam: 'jam', menit: 'menit' }, en: { jam: 'h', menit: 'min' } }

export function formatMenit(menit, bahasa = 'id') {
  const u = UNIT[bahasa] ?? UNIT.id
  const jam = Math.floor(menit / 60)
  const sisa = menit % 60
  const bagian = []
  if (jam) bagian.push(`${jam} ${u.jam}`)
  if (sisa) bagian.push(`${sisa} ${u.menit}`)
  return bagian.join(' ') || `0 ${u.menit}`
}

export function waktuSekarangJakarta() {
  const jam = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: 'Asia/Jakarta',
  }).format(new Date())
  return { tanggal: hariIniJakarta(), jam }
}

// status dihitung dari tanggal dan jam, bukan disimpan; hanya "dibatalkan" yang tersimpan
export function statusKelas(kelas, sekarang) {
  if (kelas.dibatalkan) return 'dibatalkan'

  const jam = String(kelas.jam_mulai).slice(0, 5)
  const mulai = `${kelas.tanggal} ${jam}`
  const akhir = `${kelas.tanggal} ${jamSelesai(jam, kelas.durasi_menit)}`
  const kini = `${sekarang.tanggal} ${sekarang.jam}`

  if (kini < mulai) return 'dijadwalkan'
  if (kini < akhir) return 'berlangsung'
  return 'selesai'
}