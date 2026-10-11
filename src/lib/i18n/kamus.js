export const BAHASA_TERSEDIA = ['id', 'en']

export const kamus = {
  id: {
    namaApp: 'Rise Fit Gym',
    subjudul: 'MANAJEMEN',
    grup: {
      membership: 'Membership',
      operasional: 'Operasional',
      userManagement: 'Manajemen User',
      penjualan: 'Penjualan',
      pengaturan: 'Pengaturan',
    },
    menu: {
      dashboard: 'Ringkasan',
      listPackage: 'Daftar Paket',
      createPackage: 'Buat Paket',
      memberList: 'Daftar Member',
      classManagement: 'Manajemen Kelas',
      sesiLatihan: 'Sesi Latihan',
      absensi: 'Absensi',
      staff: 'Staff',
      freelancer: 'Freelancer',
      penggajian: 'Penggajian',
      stok: 'Manajemen Stok',
      pos: 'Kasir (POS)',
      transaksi: 'Transaksi',
      pengumuman: 'Pengumuman',
      tnc: 'Syarat dan Ketentuan',
    },
    ui: {
      bahasa: 'Bahasa',
      keluar: 'Keluar',
      segera: 'SEGERA',
      bukaMenu: 'Buka menu',
      tutupMenu: 'Tutup menu',
    },
  },
  en: {
    namaApp: 'Rise Fit Gym',
    subjudul: 'MANAGEMENT',
    grup: {
      membership: 'Membership',
      operasional: 'Operations',
      userManagement: 'User Management',
      penjualan: 'Sales',
      pengaturan: 'Settings',
    },
    menu: {
      dashboard: 'Dashboard',
      listPackage: 'List Package',
      createPackage: 'Create Package',
      memberList: 'Member List',
      classManagement: 'Class Management',
      sesiLatihan: 'Training Sessions',
      absensi: 'Attendance',
      staff: 'Staff',
      freelancer: 'Freelancer',
      penggajian: 'Payroll',
      stok: 'Stock Management',
      pos: 'Sales Order (POS)',
      transaksi: 'Transactions',
      pengumuman: 'Announcements',
      tnc: 'Terms and Conditions',
    },
    ui: {
      bahasa: 'Language',
      keluar: 'Log out',
      segera: 'SOON',
      bukaMenu: 'Open menu',
      tutupMenu: 'Close menu',
    },
  },
}

export function ambilKamus(bahasa) {
  return kamus[bahasa] ?? kamus.id
}