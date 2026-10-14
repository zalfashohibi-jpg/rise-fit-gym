export const TIPE_PENGGUNA = ['staff', 'freelancer']
export const SKEMA_KOMPENSASI = ['per_sesi', 'bagi_hasil']
export const ALAMAT_TIPE = { staff: '/staff', freelancer: '/freelancer' }
export const BATAS_UANG = 1_000_000_000

// staff dengan jabatan ini otomatis masuk daftar trainer (dipakai jadwal dan sesi latihan)
export function adalahTrainer(jabatan) {
  return String(jabatan).trim().toLowerCase() === 'personal trainer'
}