import { cache } from 'react'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { PERAN } from '@/lib/akses'

// dihitung sekali per permintaan, walau dipanggil dari layout dan halaman sekaligus
export const konteksCabang = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profil } = await supabase
    .from('admin_profile')
    .select('nama, role, cabang_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!profil) return null

  const master = profil.role === PERAN.master
  let daftar = []
  let namaCabang = null

  if (master) {
    const { data } = await supabase.from('cabang').select('id, nama_cabang').order('nama_cabang')
    daftar = data ?? []
  } else if (profil.cabang_id) {
    const { data } = await supabase.from('cabang').select('nama_cabang').eq('id', profil.cabang_id).maybeSingle()
    namaCabang = data?.nama_cabang ?? null
  }

  // pilihan cabang hanya berlaku untuk Master Admin dan hanya menyaring tampilan;
  // pembatasan sebenarnya dijaga database
  let pilihan = 'semua'
  if (master) {
    const id = Number((await cookies()).get('cabang_pilihan')?.value)
    if (daftar.some((c) => c.id === id)) pilihan = id
  }

  return {
    nama: profil.nama,
    peran: profil.role,
    master,
    bolehTulis: profil.role === PERAN.cabang,
    cabangSendiri: profil.cabang_id,
    namaCabang,
    daftar,
    pilihan,
  }
})

// Master memilih satu cabang: saring. Admin Cabang sudah dibatasi database.
export function terapkanCabang(query, konteks) {
  return konteks?.master && konteks.pilihan !== 'semua' ? query.eq('cabang_id', konteks.pilihan) : query
}