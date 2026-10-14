import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksAkses } from '@/lib/i18n/akses'
import { isi } from '@/lib/i18n/umum'
import LogoutButton from '@/components/LogoutButton'
import PilihBahasa from '@/components/PilihBahasa'

export default async function TanpaAksesPage() {
  const bahasa = await bahasaAktif()
  const t = ambilTeksAkses(bahasa)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-zinc-100 p-5">
      <div className="absolute right-5 top-5">
        <PilihBahasa bahasa={bahasa} label={t.bahasa} />
      </div>

      <div className="w-full max-w-md space-y-5 rounded-2xl border border-zinc-200 bg-white p-8">
        <h1 className="text-xl font-black tracking-tight">{t.judul}</h1>
        <p className="text-sm text-zinc-600">{t.isi}</p>
        {user?.email && <p className="text-xs text-zinc-500">{isi(t.akun, { email: user.email })}</p>}

        <div className="flex items-center gap-3">
          <Link href="/" className="rounded-xl bg-lime-300 px-4 py-2 text-sm font-bold text-zinc-950">
            {t.coba}
          </Link>
          <div className="w-32 rounded-xl bg-zinc-950 p-1.5">
            <LogoutButton label={t.keluar} />
          </div>
        </div>
      </div>
    </main>
  )
}