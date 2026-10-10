'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function Loginpage() {
    const router = useRouter()
    const supabase = createClient()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errorMsg, setErrorMsg] = useState('')
    const [loading, setLoading] = useState(false)

    async function handlelogin(e) {
        e.preventDefault()
        setLoading(true)
        setErrorMsg('')

        const {error} = await supabase.auth.signInWithPassword({email, password})

        if(error) {
            setErrorMsg('Email atau Password Salah')
            setLoading(false)
            return
        }

        router.push('/')
        router.refresh()
    }
     return (
    <main className="min-h-screen flex items-center justify-center bg-stone-100">
      <form
        onSubmit={handlelogin}
        className="bg-white p-8 rounded-xl border border-stone-200 w-full max-w-sm space-y-4"
      >
        <h1 className="text-xl font-semibold">Masuk ke Rise Fit Gym</h1>

        <div className="space-y-1">
          <label className="text-sm text-stone-500">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-stone-500">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-700 text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
        >
          {loading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>
    </main>
  )
}