import { konteksCabang } from '@/lib/cabang'

export default async function AksiTulis({ children }) {
  const konteks = await konteksCabang()
  return konteks?.bolehTulis ? children : null
}