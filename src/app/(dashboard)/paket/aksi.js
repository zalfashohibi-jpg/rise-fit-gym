'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksPaket } from '@/lib/i18n/paket'
import { JENIS_PAKET, KELAS_PAKET, BATAS_SESI, BATAS_DURASI } from '@/lib/paket'

function isiBatas(pesan, batas) {
  return pesan.replace('{min}', batas.min).replace('{max}', batas.max)
}

export async function buatPaket(formData) {
  const galat = ambilTeksPaket(await bahasaAktif()).galat

  const jenis = String(formData.get('jenis') ?? '')
  const nama = String(formData.get('nama') ?? '').trim()
  const durasi = Number(formData.get('durasi_hari'))
  const sesiMentah = String(formData.get('jumlah_sesi') ?? '').trim()
  const kelas = String(formData.get('kelas') ?? '')
  const hargaMentah = String(formData.get('harga') ?? '').trim()
  const harga = Number(hargaMentah)
  const catatan = String(formData.get('catatan') ?? '').trim()

  if (!JENIS_PAKET.includes(jenis)) return { error: galat.jenis }
  if (!nama) return { error: galat.nama }

  if (!Number.isInteger(durasi) || durasi < BATAS_DURASI.min || durasi > BATAS_DURASI.max) {
    return { error: isiBatas(galat.durasi, BATAS_DURASI) }
  }

  let jumlah_sesi = null
  if (sesiMentah !== '') {
    jumlah_sesi = Number(sesiMentah)
    if (!Number.isInteger(jumlah_sesi) || jumlah_sesi < BATAS_SESI.min || jumlah_sesi > BATAS_SESI.max) {
      return { error: isiBatas(galat.sesi, BATAS_SESI) }
    }
  }
  if (jenis === 'pt' && jumlah_sesi === null) return { error: galat.sesiPt }

  if (!KELAS_PAKET.includes(kelas)) return { error: galat.kelas }
  if (hargaMentah === '' || !Number.isInteger(harga) || harga < 0) return { error: galat.harga }
  if (catatan.length > 200) return { error: galat.catatan }

  const supabase = await createClient()
  const { error } = await supabase.from('paket_membership').insert({
    jenis,
    nama,
    durasi_hari: durasi,
    jumlah_sesi,
    kelas,
    harga,
    catatan: catatan || null,
  })

  if (error) {
    console.error('Gagal menyimpan paket:', error)
    return { error: galat.simpan }
  }

  revalidatePath('/paket')
  redirect('/paket')
}

export async function hapusPaket(formData) {
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id)) return

  const supabase = await createClient()
  const { error } = await supabase.from('paket_membership').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/paket')
}

export async function ubahStatus(formData) {
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id)) return

  const aktif = formData.get('aktif') === 'true'

  const supabase = await createClient()
  const { error } = await supabase.from('paket_membership').update({ aktif }).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/paket')
}