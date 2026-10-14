'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksKelas } from '@/lib/i18n/kelas'
import { isi } from '@/lib/i18n/umum'
import { tanggalValid } from '@/lib/tanggal'
import { adalahTrainer } from '@/lib/pengguna'
import {
  TIPE_KELAS,
  SATUAN_DURASI,
  BATAS_KAPASITAS,
  BATAS_DURASI_MENIT,
  hitungDurasiMenit,
  menitDariJam,
} from '@/lib/kelas'

const FORMAT_JAM = /^([01]\d|2[0-3]):[0-5]\d$/

// kelasSekarang = { id, instruktur_id } saat mengubah kelas, null saat membuat
async function validasiKelas(supabase, formData, galat, kelasSekarang) {
  const nama = String(formData.get('nama_kelas') ?? '').trim()
  const instrukturId = Number(formData.get('instruktur_id'))
  const tipe = String(formData.get('tipe_kelas') ?? '')
  const tanggal = String(formData.get('tanggal') ?? '')
  const jam = String(formData.get('jam_mulai') ?? '').slice(0, 5)
  const satuan = String(formData.get('durasi_satuan') ?? 'menit')
  const kapasitas = Number(formData.get('kapasitas'))

  if (nama.length < 1 || nama.length > 80) return { error: galat.nama }
  if (!Number.isInteger(instrukturId) || instrukturId < 1) return { error: galat.instruktur }
  if (!TIPE_KELAS.includes(tipe)) return { error: galat.tipe }
  if (!tanggalValid(tanggal)) return { error: galat.tanggal }
  if (!FORMAT_JAM.test(jam)) return { error: galat.jam }

  const batasDurasi = BATAS_DURASI_MENIT
  const durasi = SATUAN_DURASI.includes(satuan) ? hitungDurasiMenit(formData.get('durasi_nilai'), satuan) : null
  if (durasi === null || durasi < batasDurasi.min || durasi > batasDurasi.max) {
    return { error: isi(galat.durasi, batasDurasi) }
  }
  if (menitDariJam(jam) + durasi > 1440) return { error: galat.durasiMalam }

  if (!Number.isInteger(kapasitas) || kapasitas < BATAS_KAPASITAS.min || kapasitas > BATAS_KAPASITAS.max) {
    return { error: isi(galat.kapasitas, BATAS_KAPASITAS) }
  }

  // instruktur harus freelancer atau staff berjabatan Personal Trainer, dan aktif
  // (kecuali instruktur yang memang sudah tercatat di kelas ini)
  const { data: orang } = await supabase
    .from('karyawan')
    .select('id, tipe, jabatan, aktif')
    .eq('id', instrukturId)
    .maybeSingle()

  const layak = orang && (orang.tipe === 'freelancer' || (orang.tipe === 'staff' && adalahTrainer(orang.jabatan)))
  const tidakBerubah = kelasSekarang?.instruktur_id === instrukturId
  if (!layak || (!orang.aktif && !tidakBerubah)) return { error: galat.instrukturTidakValid }

  // satu instruktur tidak boleh punya dua kelas yang jamnya beririsan
  let cek = supabase
    .from('schedule')
    .select('id, nama_kelas, jam_mulai, durasi_menit')
    .eq('instruktur_id', instrukturId)
    .eq('tanggal', tanggal)
    .eq('dibatalkan', false)
  if (kelasSekarang) cek = cek.neq('id', kelasSekarang.id)

  const { data: lain } = await cek
  const mulai = menitDariJam(jam)
  const akhir = mulai + durasi
  const bentrok = (lain ?? []).find((k) => {
    const m = menitDariJam(k.jam_mulai)
    return mulai < m + k.durasi_menit && m < akhir
  })
  if (bentrok) return { error: isi(galat.bentrok, { nama: bentrok.nama_kelas }) }

  return {
    nilai: {
      nama_kelas: nama,
      instruktur_id: instrukturId,
      tipe_kelas: tipe,
      tanggal,
      jam_mulai: jam,
      durasi_menit: durasi,
      kapasitas,
    },
  }
}

export async function buatKelas(formData) {
  const t = ambilTeksKelas(await bahasaAktif())
  const supabase = await createClient()

  const hasil = await validasiKelas(supabase, formData, t.galat, null)
  if (hasil.error) return hasil

  const { error } = await supabase.from('schedule').insert(hasil.nilai)
  if (error) {
    console.error('Gagal membuat kelas:', error)
    return { error: t.galat.simpan }
  }

  revalidatePath('/jadwal')
  revalidatePath('/')
  redirect('/jadwal')
}

export async function ubahKelas(formData) {
  const t = ambilTeksKelas(await bahasaAktif())

  const id = Number(formData.get('id'))
  if (!Number.isInteger(id)) return { error: t.galat.tidakAda }

  const supabase = await createClient()

  const { data: sekarang } = await supabase
    .from('schedule')
    .select('id, instruktur_id')
    .eq('id', id)
    .maybeSingle()
  if (!sekarang) return { error: t.galat.tidakAda }

  const hasil = await validasiKelas(supabase, formData, t.galat, sekarang)
  if (hasil.error) return hasil

  const { count } = await supabase
    .from('kelas_peserta')
    .select('*', { count: 'exact', head: true })
    .eq('schedule_id', id)

  if (hasil.nilai.kapasitas < (count ?? 0)) {
    return { error: isi(t.galat.kapasitasKurang, { n: count }) }
  }

  const { error } = await supabase.from('schedule').update(hasil.nilai).eq('id', id)
  if (error) {
    console.error('Gagal mengubah kelas:', error)
    return { error: t.galat.simpan }
  }

  revalidatePath('/jadwal')
  revalidatePath(`/jadwal/${id}`)
  revalidatePath('/')
  redirect('/jadwal')
}

export async function hapusKelas(formData) {
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id)) return

  const supabase = await createClient()
  const { error } = await supabase.from('schedule').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/jadwal')
  revalidatePath('/')
}

export async function ubahPembatalan(formData) {
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id)) return

  const dibatalkan = formData.get('dibatalkan') === 'true'

  const supabase = await createClient()
  const { error } = await supabase.from('schedule').update({ dibatalkan }).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath('/jadwal')
  revalidatePath(`/jadwal/${id}`)
  revalidatePath('/')
}

export async function daftarkanPeserta(formData) {
  const t = ambilTeksKelas(await bahasaAktif())

  const scheduleId = Number(formData.get('schedule_id'))
  const memberId = Number(formData.get('member_id'))
  if (!Number.isInteger(scheduleId) || !Number.isInteger(memberId)) {
    return { error: t.galatPeserta.umum }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('daftarkan_peserta', {
    p_schedule_id: scheduleId,
    p_member_id: memberId,
  })

  if (error) {
    const pesan = t.galatPeserta[error.message]
    if (!pesan) console.error('Gagal mendaftarkan peserta:', error)
    return { error: pesan ?? t.galatPeserta.umum }
  }

  revalidatePath(`/jadwal/${scheduleId}`)
  revalidatePath('/jadwal')
  return { ok: true }
}

export async function tandaiHadir(formData) {
  const id = Number(formData.get('id'))
  const scheduleId = Number(formData.get('schedule_id'))
  if (!Number.isInteger(id)) return

  const supabase = await createClient()
  const { error } = await supabase.from('kelas_peserta').update({ status_hadir: 'hadir' }).eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath(`/jadwal/${scheduleId}`)
}

export async function batalkanPeserta(formData) {
  const id = Number(formData.get('id'))
  const scheduleId = Number(formData.get('schedule_id'))
  if (!Number.isInteger(id)) return

  const supabase = await createClient()
  const { error } = await supabase.from('kelas_peserta').delete().eq('id', id)
  if (error) throw new Error(error.message)

  revalidatePath(`/jadwal/${scheduleId}`)
  revalidatePath('/jadwal')
}