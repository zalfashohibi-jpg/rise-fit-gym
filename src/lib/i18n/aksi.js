'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { BAHASA_TERSEDIA } from './kamus'

export async function ubahBahasa(formData) {
  const pilihan = String(formData.get('bahasa'))
  if (!BAHASA_TERSEDIA.includes(pilihan)) return

  const penyimpan = await cookies()
  penyimpan.set('bahasa', pilihan, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })

  revalidatePath('/', 'layout')
}