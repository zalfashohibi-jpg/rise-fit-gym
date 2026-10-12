import './globals.css'
import { bahasaAktif } from '@/lib/i18n/bahasa'

export const metadata = {
  title: 'Rise Fit Gym',
  description: 'Gym management dashboard',
  other: { google: 'notranslate' },
}

export default async function RootLayout({ children }) {
  const bahasa = await bahasaAktif()

  return (
    <html lang={bahasa} translate="no">
      <body>{children}</body>
    </html>
  )
}