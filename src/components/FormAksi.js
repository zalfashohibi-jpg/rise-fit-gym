'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { gayaTombolUtama, gayaTombolLain } from '@/components/FormKit'

export default function FormAksi({ aksi, kirim, menyimpan, batal, batalHref, children }) {
  const [pesan, setPesan] = useState('')
  const [menunggu, mulai] = useTransition()

  function saatKirim(e) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    setPesan('')

    mulai(async () => {
      const hasil = await aksi(data)
      if (hasil?.error) setPesan(hasil.error)
    })
  }

  return (
    <form onSubmit={saatKirim} className="space-y-4">
      {children}

      {pesan && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{pesan}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={menunggu} className={gayaTombolUtama}>
          {menunggu ? menyimpan : kirim}
        </button>
        <Link href={batalHref} className={gayaTombolLain}>{batal}</Link>
      </div>
    </form>
  )
}