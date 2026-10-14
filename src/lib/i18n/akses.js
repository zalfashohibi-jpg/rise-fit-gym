const teks = {
  id: {
    judul: 'Akun belum punya akses',
    isi: 'Akunmu sudah masuk, tetapi belum diberi peran. Minta Master Admin untuk mengaturnya, lalu coba lagi.',
    akun: 'Masuk sebagai {email}',
    coba: 'Coba lagi',
    keluar: 'Keluar',
    bahasa: 'Bahasa',
  },
  en: {
    judul: 'Account has no access',
    isi: 'You are signed in, but your account has not been given a role. Ask the Master Admin to set it up, then try again.',
    akun: 'Signed in as {email}',
    coba: 'Try again',
    keluar: 'Log out',
    bahasa: 'Language',
  },
}

export function ambilTeksAkses(bahasa) {
  return teks[bahasa] ?? teks.id
}