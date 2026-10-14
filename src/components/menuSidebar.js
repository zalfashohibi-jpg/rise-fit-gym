import { SEMUA_ADMIN, HANYA_MASTER } from '@/lib/akses'

export const menuDashboard = { kunci: 'dashboard', ikon: 'grid', href: '/' }

// href null = halamannya belum dibuat (tampil abu-abu bertanda SEGERA)
export const seksiMenu = [
  {
    kunci: 'gym',
    penanda: 'bg-orange-400',
    warnaIkon: 'text-orange-400',
    item: [
      { kunci: 'dataMember', ikon: 'users', href: '/member', akses: SEMUA_ADMIN },
      {
        kunci: 'transaksiMembership',
        ikon: 'receipt',
        akses: SEMUA_ADMIN,
        anak: [
          { kunci: 'daftarPaket', href: '/paket' },
          { kunci: 'buatPaket', href: '/paket/baru' },
          { kunci: 'riwayatTransaksi', href: '/invoice' },
        ],
      },
      { kunci: 'jadwalKelas', ikon: 'calendar', href: '/jadwal', akses: SEMUA_ADMIN },
      { kunci: 'jadwalPt', ikon: 'clock', href: null, akses: SEMUA_ADMIN },
      { kunci: 'paketPt', ikon: 'dumbbell', href: '/pt', akses: SEMUA_ADMIN },
      { kunci: 'dataInstruktur', ikon: 'badge', href: null, akses: SEMUA_ADMIN },
      { kunci: 'inputInvoice', ikon: 'filePlus', href: null, akses: SEMUA_ADMIN },
      { kunci: 'checkIn', ikon: 'scan', href: null, akses: SEMUA_ADMIN },
      { kunci: 'laporanKeanggotaan', ikon: 'chart', href: null, akses: SEMUA_ADMIN },
    ],
  },
  {
    kunci: 'internal',
    penanda: 'bg-sky-400',
    warnaIkon: 'text-sky-400',
    item: [
      {
        kunci: 'dataKaryawan',
        ikon: 'briefcase',
        akses: SEMUA_ADMIN,
        anak: [
          { kunci: 'staff', href: '/staff' },
          { kunci: 'freelancer', href: '/freelancer' },
          { kunci: 'absensi', href: null },
          { kunci: 'penggajian', href: null },
        ],
      },
      {
        kunci: 'stokInventori',
        ikon: 'box',
        akses: SEMUA_ADMIN,
        anak: [
          { kunci: 'manajemenStok', href: '/stok' },
          { kunci: 'kasirPos', href: '/stok/jual' },
        ],
      },
      { kunci: 'laporanKeuangan', ikon: 'chart', href: null, akses: SEMUA_ADMIN },
      { kunci: 'userManagement', ikon: 'shield', href: null, akses: HANYA_MASTER },
      { kunci: 'pengumuman', ikon: 'megaphone', href: null, akses: SEMUA_ADMIN },
      {
        kunci: 'settings',
        ikon: 'sliders',
        akses: HANYA_MASTER,
        anak: [{ kunci: 'tnc', href: '/peraturan' }],
      },
    ],
  },
]