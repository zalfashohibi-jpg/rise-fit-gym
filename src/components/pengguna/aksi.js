'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksPengguna } from '@/lib/i18n/pengguna'
import { hariIniJakarta, tanggalValid } from '@/lib/tanggal'
import { TIPE_PENGGUNA, SKEMA_KOMPENSASI, ALAMAT_TIPE, BATAS_UANG, adalahTrainer } from '@/lib/pengguna'

const FORMAT_HP = /^\+?[0-9\s-]{8,16}$/
const FORMAT_PERSEN = /^\d{1,3}(\.\d{1,2})?$/

function bacaUang(mentah) {
  const teks = String(mentah ?? '').trim()
  if (!/^\d{1,10}$/.test(teks)) return null
  const angka = Number(teks)
  return angka <= BATAS_UANG ? angka : null
}

export async function simpanPengguna(formData) {
  const galat = ambilTeksPengguna(await bahasaAktif()).galat
  const supabase = await createClient()

  const idMentah = String(formData.get('id') ?? '')
  const baru = idMentah === ''
  let id = null
  let tipe = String(formData.get('tipe') ?? '')

  if (!baru) {
    id = Number(idMentah)
    if (!Number.isInteger(id)) return { error: galat.tidakAda }

    // jenis (staff atau freelancer) diambil dari database, tidak bisa diubah lewat form
    const { data: ada } = await supabase.from('karyawan').select('tipe').eq('id', id).maybeSingle()
    if (!ada) return { error: galat.tidakAda }
    tipe = ada.tipe
  }
  if (!TIPE_PENGGUNA.includes(tipe)) return { error: galat.tipe }

  const nama = String(formData.get('nama') ?? '').trim()
  const jabatan = String(formData.get('jabatan') ?? '').trim()
  const no_hp = String(formData.get('no_hp') ?? '').trim()
  const alamat = String(formData.get('alamat') ?? '').trim()
  const lahir = String(formData.get('tanggal_lahir') ?? '').trim()
  const masuk = String(formData.get('tanggal_masuk') ?? '').trim()
  const spesialisasi = String(formData.get('spesialisasi') ?? '').trim()

  if (nama.length < 2 || nama.length > 100) return { error: galat.nama }
  if (jabatan.length < 2 || jabatan.length > 60) return { error: galat.jabatan }
  if (!FORMAT_HP.test(no_hp)) return { error: galat.hp }
  if (alamat.length > 300) return { error: galat.alamat }
  if (lahir && (!tanggalValid(lahir) || lahir > hariIniJakarta() || lahir < '1900-01-01')) {
    return { error: galat.lahir }
  }
  if (!tanggalValid(masuk) || masuk < '1990-01-01') return { error: galat.masuk }
  if (spesialisasi.length > 100) return { error: galat.spesialisasi }

  const nilai = {
    nama,
    jabatan,
    no_hp,
    alamat: alamat || null,
    tanggal_lahir: lahir || null,
    tanggal_masuk: masuk,
    spesialisasi: spesialisasi || null,
    gaji_bulanan: null,
    skema_kompensasi: null,
    tarif_per_sesi: null,
    persen_bagi_hasil: null,
  }

  if (tipe === 'staff') {
    const gaji = bacaUang(formData.get('gaji_bulanan'))
    if (gaji === null) return { error: galat.gaji }
    nilai.gaji_bulanan = gaji
  } else {
    const skema = String(formData.get('skema') ?? '')
    if (!SKEMA_KOMPENSASI.includes(skema)) return { error: galat.skema }
    nilai.skema_kompensasi = skema

    if (skema === 'per_sesi') {
      const tarif = bacaUang(formData.get('tarif_per_sesi'))
      if (tarif === null) return { error: galat.tarif }
      nilai.tarif_per_sesi = tarif
    } else {
      const teksPersen = String(formData.get('persen_bagi_hasil') ?? '').trim().replace(',', '.')
      const persen = Number(teksPersen)
      if (!FORMAT_PERSEN.test(teksPersen) || persen > 100) return { error: galat.persen }
      nilai.persen_bagi_hasil = persen
    }
  }

  if (baru) {
    const { data, error } = await supabase.from('karyawan').insert({ ...nilai, tipe }).select('id').single()
    if (error) {
      console.error('Gagal menyimpan data:', error)
      return { error: galat.simpan }
    }
    id = data.id
  } else {
    const { error } = await supabase.from('karyawan').update(nilai).eq('id', id)
    if (error) {
      console.error('Gagal mengubah data:', error)
      return { error: galat.simpan }
    }
  }

  // staff berjabatan Personal Trainer otomatis masuk daftar trainer; data trainer yang sudah ada tidak pernah dihapus
  if (tipe === 'staff' && adalahTrainer(jabatan)) {
    const { data: ada } = await supabase
      .from('trainer')
      .select('id')
      .eq('karyawan_id', id)
      .limit(1)
      .maybeSingle()

    if (!ada) {
      const { error } = await supabase.from('trainer').insert({ karyawan_id: id })
      if (error) {
        console.error('Gagal menambah trainer:', error)
        if (baru) await supabase.from('karyawan').delete().eq('id', id)
        return { error: galat.simpan }
      }
    }
  }

  const dasar = ALAMAT_TIPE[tipe]
  revalidatePath(dasar)
  revalidatePath(`${dasar}/${id}`)
  redirect(`${dasar}/${id}`)
}

export async function ubahStatusPengguna(formData) {
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id)) return

  const aktif = formData.get('aktif') === 'true'

  const supabase = await createClient()
  const { data, error } = await supabase.from('karyawan').update({ aktif }).eq('id', id).select('tipe').maybeSingle()
  if (error) throw new Error(error.message)

  if (data) {
    revalidatePath(ALAMAT_TIPE[data.tipe])
    revalidatePath(`${ALAMAT_TIPE[data.tipe]}/${id}`)
  }
}