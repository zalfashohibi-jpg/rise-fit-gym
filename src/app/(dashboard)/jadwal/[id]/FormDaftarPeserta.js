'use client'

import { useState, useTransition } from 'react'
import { gayaInput, gayaTombolUtama } from '@/components/FormKit'
import { daftarkanPeserta } from '../aksi'

export default function FormDaftarPeserta({ scheduleId, member, teks }) {
  const [pesan, setPesan] = useState('')
  const [menunggu, mulai] = useTransition()

  function kirim(e) {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    setPesan('')

    mulai(async () => {
      const hasil = await daftarkanPeserta(data)
      if (hasil?.error) setPesan(hasil.error)
      else form.reset()
    })
  }

  return (
    <form onSubmit={kirim} className="max-w-md space-y-3">
      <input type="hidden" name="schedule_id" value={scheduleId} />

      <div className="flex gap-3">
        <select name="member_id" required defaultValue="" className={gayaInput}>
          <option value="">{teks.pilih}</option>
          {member.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nama}
              {m.no_hp ? ` · ${m.no_hp}` : ''}
            </option>
          ))}
        </select>
        <button type="submit" disabled={menunggu} className={`${gayaTombolUtama} shrink-0`}>
          {menunggu ? teks.memproses : teks.tombol}
        </button>
      </div>

      {pesan && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{pesan}</p>
      )}
    </form>
  )
}