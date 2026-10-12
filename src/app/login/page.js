import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksLogin } from '@/lib/i18n/login'
import PilihBahasa from '@/components/PilihBahasa'
import FormLogin from './FormLogin'

export default async function LoginPage() {
  const bahasa = await bahasaAktif()
  const t = ambilTeksLogin(bahasa)

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-zinc-100 p-5">
      <div className="absolute right-5 top-5">
        <PilihBahasa bahasa={bahasa} label={t.bahasa} />
      </div>
      <FormLogin teks={t} />
    </main>
  )
}