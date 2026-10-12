'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import InputRupiah from '@/components/InputRupiah'
import { formatDurasi } from '@/lib/paket'

const kolom =
  'w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-zinc-950'

export default function FormPaket({ aksi, bahasa, teks, opsiJenis, opsiKelas }) {
  const [pesanError, setPesanError] = useState('')
  const [durasi, setDurasi] = useState('')
  const [menunggu, mulai] = useTransition()

  const konversi = formatDurasi(durasi, bahasa)

  function kirim(e) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    setPesanError('')

    mulai(async () => {
      const hasil = await aksi(data)
      if (hasil?.error) setPesanError(hasil.error)
    })
  }

  return (
    <form onSubmit={kirim} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="jenis" className="text-sm text-zinc-500">{teks.jenis}</label>
        <select id="jenis" name="jenis" defaultValue="membership" className={kolom}>
          {opsiJenis.map((o) => (
            <option key={o.nilai} value={o.nilai}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="nama" className="text-sm text-zinc-500">{teks.nama}</label>
        <input id="nama" name="nama" required maxLength={80} placeholder={teks.namaContoh} className={kolom} />
      </div>

      <div className="space-y-2">
        <div className="space-y-1">
          <label htmlFor="durasi_hari" className="text-sm text-zinc-500">{teks.durasi}</label>
          <input
            id="durasi_hari"
            name="durasi_hari"
            type="number"
            min="1"
            required
            value={durasi}
            onChange={(e) => setDurasi(e.target.value)}
            placeholder={teks.durasiContoh}
            className={kolom}
          />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-zinc-100 px-4 py-3 text-sm">
          <span className="text-zinc-500">{teks.setara}</span>
          <span className="font-bold">{konversi}</span>
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="jumlah_sesi" className="text-sm text-zinc-500">{teks.sesi}</label>
        <input id="jumlah_sesi" name="jumlah_sesi" type="number" min="1" max="100" className={kolom} />
        <p className="text-xs text-zinc-400">{teks.sesiBantuan}</p>
      </div>

      <div className="space-y-1">
        <label htmlFor="kelas" className="text-sm text-zinc-500">{teks.kelas}</label>
        <select id="kelas" name="kelas" defaultValue="reguler" className={kolom}>
          {opsiKelas.map((o) => (
            <option key={o.nilai} value={o.nilai}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="harga" className="text-sm text-zinc-500">{teks.harga}</label>
        <InputRupiah id="harga" name="harga" required className={kolom} />
      </div>

      <div className="space-y-1">
        <label htmlFor="catatan" className="text-sm text-zinc-500">{teks.catatan}</label>
        <input id="catatan" name="catatan" maxLength={200} placeholder={teks.catatanContoh} className={kolom} />
      </div>

      {pesanError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{pesanError}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={menunggu}
          className="rounded-xl bg-lime-300 px-5 py-2.5 text-sm font-bold text-zinc-950 disabled:opacity-60"
        >
          {menunggu ? teks.menyimpan : teks.simpan}
        </button>
        <Link
          href="/paket"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50"
        >
          {teks.batal}
        </Link>
      </div>
    </form>
  )
}