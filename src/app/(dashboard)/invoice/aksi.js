'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksInvoice } from '@/lib/i18n/invoice'
import { isi } from '@/lib/i18n/umum'
import { METODE_BAYAR } from '@/lib/pembayaran'
import { tanggalValid } from '@/lib/tanggal'
import { BATAS_RINCIAN } from '@/lib/invoice'

function terjemahkan(t, error, cadangan) {
  const pesan = t.galatDb[error.message]
  if (!pesan) console.error('Galat database:', error)
  return pesan ?? cadangan
}

export async function buatInvoiceManual(formData) {
  const t = ambilTeksInvoice(await bahasaAktif())
  const g = t.galat

  const memberId = Number(formData.get('member_id')) || null
  const nama = String(formData.get('nama_pelanggan') ?? '').trim()
  const keterangan = String(formData.get('keterangan') ?? '').trim()
  const jatuhTempo = String(formData.get('jatuh_tempo') ?? '').trim()
  const lunas = formData.get('lunas') === 'on'
  const metode = String(formData.get('metode') ?? '')

  let rincian
  try {
    rincian = JSON.parse(String(formData.get('rincian') ?? '[]'))
  } catch {
    return { error: g.rincianTidakValid }
  }
  if (!Array.isArray(rincian) || rincian.length === 0) return { error: g.rincianKosong }
  if (rincian.length > BATAS_RINCIAN) return { error: isi(g.rincianBanyak, { n: BATAS_RINCIAN }) }

  const bersih = []
  for (const b of rincian) {
    const deskripsi = String(b?.deskripsi ?? '').trim()
    const qty = Number(b?.qty)
    const harga = Number(b?.harga)

    if (!deskripsi || deskripsi.length > 120) return { error: g.rincianTidakValid }
    if (!Number.isInteger(qty) || qty < 1 || qty > 10000) return { error: g.rincianTidakValid }
    if (!Number.isInteger(harga) || harga < 0 || harga > 1_000_000_000) return { error: g.rincianTidakValid }
    bersih.push({ deskripsi, qty, harga })
  }

  if (nama.length > 100) return { error: g.nama }
  if (keterangan.length > 200) return { error: g.keterangan }
  if (jatuhTempo && !tanggalValid(jatuhTempo)) return { error: g.jatuhTempo }
  if (lunas && !METODE_BAYAR.includes(metode)) return { error: g.metode }

  const supabase = await createClient()
  const { data: id, error } = await supabase.rpc('buat_invoice_manual', {
    p_member_id: memberId,
    p_nama: nama,
    p_keterangan: keterangan,
    p_rincian: bersih,
    p_jatuh_tempo: jatuhTempo || null,
    p_lunas: lunas,
    p_metode: lunas ? metode : null,
  })

  if (error) return { error: terjemahkan(t, error, g.simpan) }

  revalidatePath('/invoice')
  redirect(`/invoice/${id}`)
}

export async function bayarInvoice(formData) {
  const t = ambilTeksInvoice(await bahasaAktif())
  const g = t.galat

  const invoiceId = Number(formData.get('invoice_id'))
  const jumlahMentah = String(formData.get('jumlah') ?? '').trim()
  const jumlah = Number(jumlahMentah)
  const metode = String(formData.get('metode') ?? '')

  if (!Number.isInteger(invoiceId)) return { error: g.tidakAda }
  if (jumlahMentah === '' || !Number.isInteger(jumlah) || jumlah < 1 || jumlah > 2_000_000_000) {
    return { error: g.jumlah }
  }
  if (!METODE_BAYAR.includes(metode)) return { error: g.metode }

  const supabase = await createClient()
  const { error } = await supabase.rpc('catat_pembayaran_invoice', {
    p_invoice_id: invoiceId,
    p_jumlah: jumlah,
    p_metode: metode,
  })

  if (error) return { error: terjemahkan(t, error, g.simpan) }

  revalidatePath(`/invoice/${invoiceId}`)
  revalidatePath('/invoice')
  return { ok: true }
}