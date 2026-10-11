function selisihHari(a, b) {
  return Math.round((new Date(a) - new Date(b)) / 86400000)
}

export function hitungPaketPt(paket, hariIni) {
  const terpakai = (paket.pt_session ?? []).filter((s) => s.status === 'selesai').length
  const sisa = Math.max(paket.total_sesi - terpakai, 0)
  const sisaHari = selisihHari(paket.tanggal_exp, hariIni)
  const berlaku = sisa > 0 && sisaHari >= 0
  const labelHari = sisaHari === 0 ? 'Berakhir hari ini' : `${sisaHari} hari lagi`

  let status
  if (sisa === 0) status = { teks: 'Sesi habis', kelas: 'bg-zinc-100 text-zinc-600' }
  else if (sisaHari < 0) status = { teks: 'Kedaluwarsa', kelas: 'bg-red-50 text-red-700' }
  else if (sisa === 1) status = { teks: 'Sisa 1 sesi', kelas: 'bg-amber-50 text-amber-700' }
  else if (sisaHari <= 7) status = { teks: labelHari, kelas: 'bg-amber-50 text-amber-700' }
  else status = { teks: 'Aktif', kelas: 'bg-lime-100 text-lime-800' }

  return {
    terpakai,
    sisa,
    sisaHari,
    berlaku,
    perhatian: berlaku && (sisa === 1 || sisaHari <= 7),
    status,
  }
}