const teks = {
  id: {
    sapaan: { pagi: 'Selamat pagi', siang: 'Selamat siang', sore: 'Selamat sore', malam: 'Selamat malam' },
    sub: 'ringkasan hari ini di Rise Fit Gym.',
    aksi: {
      memberBaru: { judul: 'Member baru', teks: 'Daftar dan mulai membership' },
      perpanjang: { judul: 'Perpanjang membership', teks: 'Pilih member di daftar' },
      buatKelas: { judul: 'Buat jadwal', teks: 'Tambah kelas baru' },
      stafBaru: { judul: 'Staff baru', teks: 'Tambah staff atau trainer' },
    },
    kartu: {
      memberAktif: { label: 'Member aktif', info: 'membership masih berlaku' },
      segeraHabis: { label: 'Segera habis (7 hari)', info: 'perlu follow-up perpanjangan' },
      pembayaran: { label: 'Pembayaran bulan ini', info: 'dari semua transaksi' },
      stok: { label: 'Stok menipis', semuaAman: 'semua di atas {n} pcs' },
    },
    segera: {
      judul: 'Membership segera habis',
      deskripsi: 'Habis dalam 7 hari ke depan, atau baru lewat dalam 30 hari terakhir',
      kosong: 'Tidak ada membership yang perlu ditindaklanjuti.',
      perpanjang: 'Perpanjang',
      hariIni: 'Hari ini',
      lagi: ['{n} hari lagi', '{n} hari lagi'],
      lewat: ['Lewat {n} hari', 'Lewat {n} hari'],
    },
    jadwal: {
      judul: 'Jadwal hari ini',
      kosong: 'Tidak ada kelas hari ini.',
      semua: 'Buka semua jadwal',
      kelas: 'Kelas',
    },
    galat: 'Gagal ambil data: {pesan}',
  },
  en: {
    sapaan: { pagi: 'Good morning', siang: 'Good afternoon', sore: 'Good evening', malam: 'Good evening' },
    sub: "today's overview at Rise Fit Gym.",
    aksi: {
      memberBaru: { judul: 'New member', teks: 'Register and start a membership' },
      perpanjang: { judul: 'Extend membership', teks: 'Pick a member from the list' },
      buatKelas: { judul: 'Create class', teks: 'Add a new class' },
      stafBaru: { judul: 'New staff', teks: 'Add staff or a trainer' },
    },
    kartu: {
      memberAktif: { label: 'Active members', info: 'memberships still valid' },
      segeraHabis: { label: 'Expiring soon (7 days)', info: 'needs renewal follow-up' },
      pembayaran: { label: 'Payments this month', info: 'from all transactions' },
      stok: { label: 'Low stock', semuaAman: 'all above {n} pcs' },
    },
    segera: {
      judul: 'Memberships expiring soon',
      deskripsi: 'Expiring within 7 days, or expired in the last 30 days',
      kosong: 'No memberships need follow-up.',
      perpanjang: 'Renew',
      hariIni: 'Today',
      lagi: ['{n} day left', '{n} days left'],
      lewat: ['Expired {n} day ago', 'Expired {n} days ago'],
    },
    jadwal: {
      judul: "Today's schedule",
      kosong: 'No classes today.',
      semua: 'Open all schedules',
      kelas: 'Class',
    },
    galat: 'Failed to load data: {pesan}',
  },
}

export function ambilTeksRingkasan(bahasa) {
  return teks[bahasa] ?? teks.id
}