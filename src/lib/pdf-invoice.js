import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { formatTanggal } from './tanggal'

const LEBAR = 595.28
const TINGGI = 841.89
const MARGIN = 48
const KANAN = LEBAR - MARGIN
const KOLOM_QTY = 340
const KOLOM_HARGA = 450
const LEBAR_DESKRIPSI = KOLOM_QTY - 50 - MARGIN

// font bawaan PDF hanya mengenal karakter Latin; yang lain diganti supaya pembuatan PDF tidak gagal
const aman = (nilai) => String(nilai ?? '').replace(/[^\x20-\x7E\u00A0-\u00FF]/g, '?')

const rupiah = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`

function bungkus(nilai, font, ukuran, lebarMaks) {
  const kata = aman(nilai).split(/\s+/).filter(Boolean)
  const hasil = []
  let sekarang = ''

  for (const k of kata) {
    const coba = sekarang ? `${sekarang} ${k}` : k
    if (font.widthOfTextAtSize(coba, ukuran) <= lebarMaks) {
      sekarang = coba
      continue
    }

    if (sekarang) hasil.push(sekarang)

    // kata yang lebih panjang dari lebar kolom dipotong
    let sisa = k
    while (font.widthOfTextAtSize(sisa, ukuran) > lebarMaks) {
      let n = sisa.length
      while (n > 1 && font.widthOfTextAtSize(sisa.slice(0, n), ukuran) > lebarMaks) n -= 1
      hasil.push(sisa.slice(0, n))
      sisa = sisa.slice(n)
    }
    sekarang = sisa
  }

  if (sekarang) hasil.push(sekarang)
  return hasil.length ? hasil : ['']
}

export async function buatPdfInvoice({ kop, invoice, pelanggan, baris, pembayaran, teks, bahasa }) {
  const doc = await PDFDocument.create()
  doc.setTitle(aman(`${teks.judul} ${invoice.nomor}`))

  const font = await doc.embedFont(StandardFonts.Helvetica)
  const tebal = await doc.embedFont(StandardFonts.HelveticaBold)
  const warna = { isi: rgb(0.09, 0.09, 0.1), abu: rgb(0.42, 0.42, 0.45), garis: rgb(0.85, 0.85, 0.87) }

  let halaman = doc.addPage([LEBAR, TINGGI])
  let y = TINGGI - MARGIN

  const tulis = (isiTeks, x, posisiY, { f = font, ukuran = 10, warnaTeks = warna.isi, ratakanan = false } = {}) => {
    const bersih = aman(isiTeks)
    const geser = ratakanan ? f.widthOfTextAtSize(bersih, ukuran) : 0
    halaman.drawText(bersih, { x: x - geser, y: posisiY, size: ukuran, font: f, color: warnaTeks })
  }

  const garis = (posisiY) =>
    halaman.drawLine({
      start: { x: MARGIN, y: posisiY },
      end: { x: KANAN, y: posisiY },
      thickness: 0.7,
      color: warna.garis,
    })

  const butuhRuang = (tinggiButuh) => {
    if (y - tinggiButuh < MARGIN + 30) {
      halaman = doc.addPage([LEBAR, TINGGI])
      y = TINGGI - MARGIN
    }
  }

  // kop: identitas gym di kiri, nomor dan status di kanan
  tulis(kop.nama, MARGIN, y - 14, { f: tebal, ukuran: 18 })
  let yKop = y - 32
  for (const lk of [kop.cabang, kop.alamat, kop.telepon, kop.email].filter(Boolean)) {
    tulis(lk, MARGIN, yKop, { ukuran: 9, warnaTeks: warna.abu })
    yKop -= 13
  }

  tulis(teks.judul, KANAN, y - 16, { f: tebal, ukuran: 22, ratakanan: true })
  tulis(invoice.nomor, KANAN, y - 34, { f: tebal, ukuran: 11, ratakanan: true })
  tulis(`${teks.tanggal}: ${formatTanggal(invoice.tanggal, bahasa)}`, KANAN, y - 49, {
    ukuran: 9.5,
    warnaTeks: warna.abu,
    ratakanan: true,
  })
  let ySisi = y - 63
  if (invoice.jatuhTempo) {
    tulis(`${teks.jatuhTempo}: ${formatTanggal(invoice.jatuhTempo, bahasa)}`, KANAN, ySisi, {
      ukuran: 9.5,
      warnaTeks: warna.abu,
      ratakanan: true,
    })
    ySisi -= 14
  }
  tulis(`${teks.status}: ${invoice.statusTeks}`, KANAN, ySisi, { f: tebal, ukuran: 9.5, ratakanan: true })

  y = Math.min(yKop, ySisi) - 14
  garis(y)
  y -= 26

  // pelanggan
  tulis(teks.ditagihkan, MARGIN, y, { ukuran: 9, warnaTeks: warna.abu })
  tulis(pelanggan.nama, MARGIN, y - 16, { f: tebal, ukuran: 12 })
  y -= 34
  if (pelanggan.hp) {
    tulis(pelanggan.hp, MARGIN, y, { ukuran: 10, warnaTeks: warna.abu })
    y -= 14
  }
  y -= 20

  // tabel rincian
  const judulKolom = { f: tebal, ukuran: 9, warnaTeks: warna.abu }
  tulis(teks.kolom.deskripsi, MARGIN, y, judulKolom)
  tulis(teks.kolom.qty, KOLOM_QTY, y, { ...judulKolom, ratakanan: true })
  tulis(teks.kolom.harga, KOLOM_HARGA, y, { ...judulKolom, ratakanan: true })
  tulis(teks.kolom.jumlah, KANAN, y, { ...judulKolom, ratakanan: true })
  y -= 8
  garis(y)
  y -= 18

  for (const b of baris) {
    const kalimat = bungkus(b.deskripsi, font, 10, LEBAR_DESKRIPSI)
    const tinggiBaris = kalimat.length * 14 + 6
    butuhRuang(tinggiBaris)

    kalimat.forEach((k, i) => tulis(k, MARGIN, y - i * 14))
    tulis(String(b.qty), KOLOM_QTY, y, { ratakanan: true })
    tulis(rupiah(b.harga), KOLOM_HARGA, y, { ratakanan: true })
    tulis(rupiah(b.qty * b.harga), KANAN, y, { ratakanan: true })
    y -= tinggiBaris
  }

  garis(y + 4)
  y -= 18

  // total
  butuhRuang(70)
  tulis(teks.total, KOLOM_QTY, y)
  tulis(rupiah(invoice.total), KANAN, y, { f: tebal, ratakanan: true })
  y -= 16
  tulis(teks.dibayar, KOLOM_QTY, y)
  tulis(rupiah(invoice.dibayar), KANAN, y, { ratakanan: true })
  y -= 16
  tulis(teks.sisa, KOLOM_QTY, y, { f: tebal })
  tulis(rupiah(invoice.sisa), KANAN, y, { f: tebal, ratakanan: true })
  y -= 34

  // riwayat pembayaran
  if (pembayaran.length > 0) {
    butuhRuang(50)
    tulis(teks.riwayat, MARGIN, y, { f: tebal, ukuran: 11 })
    y -= 18

    for (const p of pembayaran) {
      butuhRuang(18)
      tulis(formatTanggal(p.tanggal, bahasa), MARGIN, y, { ukuran: 9.5 })
      tulis(p.metode, MARGIN + 110, y, { ukuran: 9.5 })
      tulis(rupiah(p.jumlah), KANAN, y, { ukuran: 9.5, ratakanan: true })
      y -= 15
    }
  }

  tulis(teks.terimaKasih, MARGIN, MARGIN - 8, { ukuran: 9, warnaTeks: warna.abu })

  return doc.save()
}