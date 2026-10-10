import { createClient } from '@/lib/supabase/server'
import DashboardShell from '@/components/DashboardShell'

export default async function DashboardLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
    <DashboardShell nama={nama} role={role}>
      {children}
    </DashboardShell>
  )
}