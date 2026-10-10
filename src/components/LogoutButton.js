'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="w-full rounded-lg border border-white/10 px-3 py-2 text-left text-xs font-semibold text-zinc-400 hover:bg-white/5 hover:text-white"
    >
      Keluar
    </button>
  )
}