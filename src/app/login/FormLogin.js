'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const kolom =
  'w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-zinc-950'

export default function FormLogin({ teks }) {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pesanError, setPesanError] = useState('')
  const [memuat, setMemuat] = useState(false)

  async function masuk(e) {
    e.preventDefault()
    setMemuat(true)
    setPesanError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setPesanError(teks.galat)
      setMemuat(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <form
      onSubmit={masuk}
      className="w-full max-w-sm space-y-4 rounded-2xl border border-zinc-200 bg-white p-8"
    >
      <h1 className="text-xl font-black tracking-tight">{teks.judul}</h1>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm text-zinc-500">{teks.email}</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={kolom}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm text-zinc-500">{teks.password}</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={kolom}
        />
      </div>

      {pesanError && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{pesanError}</p>
      )}

      <button
        type="submit"
        disabled={memuat}
        className="w-full rounded-xl bg-lime-300 py-3 text-sm font-bold text-zinc-950 disabled:opacity-60"
      >
        {memuat ? teks.memproses : teks.masuk}
      </button>
    </form>
  )
}