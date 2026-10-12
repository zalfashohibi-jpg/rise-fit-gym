import { cookies } from 'next/headers'
import { BAHASA_TERSEDIA } from './kamus'

export async function bahasaAktif() {
  const nilai = (await cookies()).get('bahasa')?.value
  return BAHASA_TERSEDIA.includes(nilai) ? nilai : 'id'
}