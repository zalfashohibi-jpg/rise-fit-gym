'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksMember } from '@/lib/i18n/member'
import { METODE_BAYAR, catatPembayaran } from '@/lib/pembayaran'
import { hariIniJakarta, tambahHari, tanggalValid } from '@/lib/tanggal'

const FORMAT_HP = /^\+?[0-9\s-]{8,16}$/

function bacaProfil(formData, galat) {
  const nama = String(formData.get('nama') ?? '').trim()
  const no_hp = String(formData.get('no_hp') ?? '').trim()
  const alamat = String(formData.get('alamat') ?? '').trim()
  const lahir = String(formData.get('tanggal_lahir') ?? '').trim()

  if (nama.length < 2 || nama.length > 100) return { error: galat.nama }
  if (!FORMAT_HP.test(no_hp)) return { error: galat.hp }
  if (alamat.length > 300) return { error: galat.alamat }
  if (lahir && (!tanggalValid(lahir) || lahir > hariIniJakarta() || lahir < '1900-01-01')) {
    return { error: galat.lahir }
  }

  return { nilai: { nama, no_hp, alamat: alamat || null, tanggal_lahir: lahir || null } }
}

async function ambilPaket(supabase, id) {
  if (!Number.isInteger(id)) return null

  const { data } = await supabase
    .from('paket_membership')
    .select('nama, durasi_hari, harga')
    .eq('id', id)
    .eq('jenis', 'membership')
    .eq('aktif', true)
    .maybeSingle()

  return data
}

export async function tambahMember(formData) {
  const galat = ambilTeksMember(await bahasaAktif()).galat

  const profil = bacaProfil(formData, galat)
  if (profil.error) return profil

  const mulai = String(formData.get('tanggal_mulai') ?? '')
  const metode = String(formData.get('metode') ?? '')
  if (!tanggalValid(mulai)) return { error: galat.tanggal }
  if (!METODE_BAYAR.includes(metode)) return { error: galat.metode }
  if (formData.get('setuju') !== 'on') return { error: galat.setuju }

  const supabase = await createClient()

  const paket = await ambilPaket(supabase, Number(formData.get('paket_id')))
  if (!paket) return { error: galat.paket }

  // versi peraturan diambil dari database, bukan dari form
  const { data: peraturan } = await supabase
    .from('peraturan')
    .select('versi')
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!peraturan) return { error: galat.peraturan }

  const { data: member, error: errMember } = await supabase
    .from('member')
    .insert({
      ...profil.nilai,
      tnc_versi: peraturan.versi,
      tnc_disetujui_pada: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (errMember) {
    console.error('Gagal menyimpan member:', errMember)
    return { error: galat.simpan }
  }

  const { error: errMembership } = await supabase.from('membership').insert({
    member_id: member.id,
    paket: paket.nama,
    tanggal_mulai: mulai,
    tanggal_exp: tambahHari(mulai, paket.durasi_hari),
    status: 'aktif',
  })

  if (errMembership) {
    console.error('Gagal menyimpan membership:', errMembership)
    await supabase.from('member').delete().eq('id', member.id)
    return { error: galat.simpan }
  }

  const { error: errBayar } = await catatPembayaran(supabase, {
    member_id: member.id,
    total: paket.harga,
    metode,
    keterangan: paket.nama,
  })

  if (errBayar) {
    console.error('Gagal mencatat pembayaran:', errBayar)
    // menghapus member ikut menghapus membership yang barusan dibuat
    await supabase.from('member').delete().eq('id', member.id)
    return { error: galat.simpan }
  }

  revalidatePath('/member')
  redirect(`/member/${member.id}`)
}

export async function ubahMember(formData) {
  const galat = ambilTeksMember(await bahasaAktif()).galat

  const id = Number(formData.get('id'))
  if (!Number.isInteger(id)) return { error: galat.tidakAda }

  const profil = bacaProfil(formData, galat)
  if (profil.error) return profil

  const supabase = await createClient()
  const paketId = String(formData.get('paket_id') ?? '')

  // koreksi paket hanya menyentuh membership yang paling baru
  let koreksi = null
  if (paketId !== '') {
    const paket = await ambilPaket(supabase, Number(paketId))
    if (!paket) return { error: galat.paket }

    const { data: terkini } = await supabase
      .from('membership')
      .select('id, tanggal_mulai')
      .eq('member_id', id)
      .order('tanggal_mulai', { ascending: false })
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!terkini) return { error: galat.tanpaMembership }

    koreksi = {
      id: terkini.id,
      paket: paket.nama,
      tanggal_exp: tambahHari(terkini.tanggal_mulai, paket.durasi_hari),
    }
  }

  const { error } = await supabase.from('member').update(profil.nilai).eq('id', id)
  if (error) {
    console.error('Gagal mengubah member:', error)
    return { error: galat.simpan }
  }

  if (koreksi) {
    const { error: errPaket } = await supabase
      .from('membership')
      .update({ paket: koreksi.paket, tanggal_exp: koreksi.tanggal_exp })
      .eq('id', koreksi.id)

    if (errPaket) {
      console.error('Gagal mengoreksi paket:', errPaket)
      return { error: galat.simpan }
    }
  }

  revalidatePath('/member')
  revalidatePath(`/member/${id}`)
  redirect(`/member/${id}`)
}

export async function perpanjangMember(formData) {
  const galat = ambilTeksMember(await bahasaAktif()).galat

  const member_id = Number(formData.get('member_id'))
  const mulai = String(formData.get('tanggal_mulai') ?? '')
  const metode = String(formData.get('metode') ?? '')

  if (!Number.isInteger(member_id)) return { error: galat.tidakAda }
  if (!tanggalValid(mulai)) return { error: galat.tanggal }
  if (!METODE_BAYAR.includes(metode)) return { error: galat.metode }

  const supabase = await createClient()

  const paket = await ambilPaket(supabase, Number(formData.get('paket_id')))
  if (!paket) return { error: galat.paket }

  // membership baru dibuat lebih dulu, supaya kalau ada yang gagal yang lama tidak hilang
  const { data: baru, error } = await supabase
    .from('membership')
    .insert({
      member_id,
      paket: paket.nama,
      tanggal_mulai: mulai,
      tanggal_exp: tambahHari(mulai, paket.durasi_hari),
      status: 'aktif',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Gagal membuat membership:', error)
    return { error: galat.simpan }
  }

  const { error: errBayar } = await catatPembayaran(supabase, {
    member_id,
    total: paket.harga,
    metode,
    keterangan: paket.nama,
  })

  if (errBayar) {
    console.error('Gagal mencatat pembayaran:', errBayar)
    await supabase.from('membership').delete().eq('id', baru.id)
    return { error: galat.simpan }
  }

  // yang lama ditandai selesai, bukan dihapus, supaya riwayat tetap ada
  const { error: errLama } = await supabase
    .from('membership')
    .update({ status: 'selesai' })
    .eq('member_id', member_id)
    .neq('id', baru.id)

  if (errLama) console.error('Gagal menutup membership lama:', errLama)

  revalidatePath('/member')
  revalidatePath(`/member/${member_id}`)
  redirect(`/member/${member_id}`)
}