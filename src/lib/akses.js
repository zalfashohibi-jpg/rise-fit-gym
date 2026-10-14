export const PERAN = { master: 'superadmin', cabang: 'admin_cabang' }

export const SEMUA_ADMIN = [PERAN.master, PERAN.cabang]
export const HANYA_MASTER = [PERAN.master]

export function bolehAkses(peran, daftar) {
  return Boolean(peran) && daftar.includes(peran)
}

// halaman yang tidak boleh dibuka semua peran; halaman lain terbuka untuk semua admin
const ATURAN_HALAMAN = [
  { awalan: '/peraturan', akses: HANYA_MASTER },
  { awalan: '/akun', akses: HANYA_MASTER }, // disiapkan untuk halaman User Management
]

export function aturanUntuk(pathname) {
  const cocok = ATURAN_HALAMAN.find((a) => pathname === a.awalan || pathname.startsWith(`${a.awalan}/`))
  return cocok ? cocok.akses : null
}