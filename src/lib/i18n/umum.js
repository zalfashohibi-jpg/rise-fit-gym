const LOKAL = { id: 'id-ID', en: 'en-GB' }

export function lokalBahasa(bahasa) {
  return LOKAL[bahasa] ?? LOKAL.id
}

export function jumlahTeks(n, bentuk) {
  return (n === 1 ? bentuk[0] : bentuk[1]).replace('{n}', n)
}

export function rupiahSingkat(n, bahasa) {
  if (n >= 1_000_000) {
    const juta = (n / 1_000_000).toFixed(1)
    return bahasa === 'en' ? `Rp ${juta}M` : `Rp ${juta.replace('.', ',')} jt`
  }
  return `Rp ${n.toLocaleString('id-ID')}`
}

export function isi(teks, nilai) {
  return Object.entries(nilai).reduce(
    (hasil, [kunci, v]) => hasil.replaceAll(`{${kunci}}`, String(v)),
    teks
  )
}