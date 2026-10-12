import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/DashboardShell'
import { bahasaAktif } from '@/lib/i18n/bahasa'

export default async function DashboardLayout({ children }) {
  const supabase = await createClient()

  const [{ data: { user } }, bahasa] = await Promise.all([
    supabase.auth.getUser(),
    bahasaAktif(),
  ])

  let nama = user?.email ?? 'Admin'
  let role = ''

  if (user) {
    const { data: profil } = await supabase
      .from('admin_profile')
      .select('nama, role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profil) {
      nama = profil.nama
      role = profil.role
    }
  }

  return (
    <DashboardShell nama={nama} role={role} bahasa={bahasa}>
      {children}
    </DashboardShell>
  )
}