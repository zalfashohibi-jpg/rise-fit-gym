const teks = {
  id: {
    judul: 'Masuk ke Rise Fit Gym',
    email: 'Email',
    password: 'Password',
    masuk: 'Masuk',
    memproses: 'Memproses...',
    galat: 'Email atau password salah.',
    bahasa: 'Bahasa',
  },
  en: {
    judul: 'Sign in to Rise Fit Gym',
    email: 'Email',
    password: 'Password',
    masuk: 'Sign in',
    memproses: 'Signing in...',
    galat: 'Incorrect email or password.',
    bahasa: 'Language',
  },
}

export function ambilTeksLogin(bahasa) {
  return teks[bahasa] ?? teks.id
}