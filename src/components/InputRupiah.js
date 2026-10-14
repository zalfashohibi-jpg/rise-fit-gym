'use client'

import { useState } from 'react'

export default function InputRupiah({ name, id, className = '', required = false, defaultValue = '' }) {
  const [digit, setDigit] = useState(String(defaultValue ?? '').replace(/\D/g, ''))
  const tampil = digit ? Number(digit).toLocaleString('id-ID') : ''

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">Rp</span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        required={required}
        value={tampil}
        onChange={(e) => setDigit(e.target.value.replace(/\D/g, '').slice(0, 12))}
        className={`${className} pl-10`}
      />
      <input type="hidden" name={name} value={digit} />
    </div>
  )
}