'use client'

import { useState, useTransition } from 'react'
import InputRupiah from '@/components/InputRupiah'
import { gayaInput, gayaTombolUtama } from '@/components/FormKit'
import { bayarInvoice } from '../aksi'

export default function FormBayar({ invoiceId, sisa, opsiMetode, teks }) {
  const [pesan, setPesan] = useState('')
  const [menunggu, mulai] = useTransition()

  function kirim(e) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    setPesan('')

    mulai(async () => {
      const hasil = await bayarInvoice(data)
      if (hasil?.error) setPesan(hasil.error)
    })
  }

  return (
    <form onSubmit={kirim} className="max-w-md space-y-3">
      <input type="hidden" name="invoice_id" value={invoiceId} />

      <div className="space-y-1">
        <label htmlFor="jumlah" className="text-sm text-zinc-500">{teks.jumlah}</label>
        <InputRupiah id="jumlah" name="jumlah" required defaultValue={sisa} className={gayaInput} />
      </div>

      <div className="space-y-1">
        <label htmlFor="metode" className="text-sm text-zinc-500">{teks.metode}</label>
        <select id="metode" name="metode" className={gayaInput}>
          {opsiMetode.map((m) => (
            <option key={m.nilai} value={m.nilai}>{m.label}</option>
          ))}
        </select>
      </div>

      {pesan && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{pesan}</p>
      )}

      <button type="submit" disabled={menunggu} className={gayaTombolUtama}>
        {menunggu ? teks.memproses : teks.tombol}
      </button>
    </form>
  )
}