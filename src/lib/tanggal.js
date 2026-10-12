import { lokalBahasa } from './i18n/umum'

export function hariIniJakarta() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
}

export function tambahHari(tanggal, n) {
  const d = new Date(tanggal)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function selisihHari(a, b) {
  return Math.round((new Date(a) - new Date(b)) / 86400000)
}

// "2026-02-30" tidak lolos, hanya tanggal yang benar-benar ada
export function tanggalValid(teks) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(teks)) return false
  const d = new Date(`${teks}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === teks
}

export function umurDari(tanggalLahir, hariIni) {
  const [ly, lm, ld] = tanggalLahir.split('-').map(Number)
  const [ty, tm, td] = hariIni.split('-').map(Number)
  let umur = ty - ly
  if (tm < lm || (tm === lm && td < ld)) umur -= 1
  return umur
}

export function formatTanggal(teks, bahasa) {
  return new Intl.DateTimeFormat(lokalBahasa(bahasa), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(teks))
}

export function formatWaktu(teks, bahasa) {
  return new Intl.DateTimeFormat(lokalBahasa(bahasa), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(teks))
}