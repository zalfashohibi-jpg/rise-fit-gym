// instruktur = staff berjabatan Personal Trainer, atau freelancer; yang nonaktif tidak ikut
export async function ambilInstruktur(supabase) {
  const [trainer, freelancer] = await Promise.all([
    supabase
      .from('karyawan')
      .select('id, nama')
      .eq('tipe', 'staff')
      .eq('aktif', true)
      .ilike('jabatan', 'personal trainer')
      .order('nama'),
    supabase
      .from('karyawan')
      .select('id, nama')
      .eq('tipe', 'freelancer')
      .eq('aktif', true)
      .order('nama'),
  ])

  return { trainer: trainer.data ?? [], freelancer: freelancer.data ?? [] }
}