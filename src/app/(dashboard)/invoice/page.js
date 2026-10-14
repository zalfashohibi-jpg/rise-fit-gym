import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksInvoice } from '@/lib/i18n/invoice'
import { isi } from '@/lib/i18n/umum'
import { formatTanggal, hariIniJakarta, tanggalValid } from '@/lib/tanggal'
import { konteksCabang, terapkanCabang } from '@/lib/cabang'
import {
  JENIS_INVOICE,
  STATUS_TAMPIL,
  WARNA_STATUS_BAYAR,
  hitungStatusBayar,
  nomorInvoice,
} from '@/lib/invoice'
import { gayaInput, gayaTombolKecil, gayaTombolLain } from '@/components/FormKit'
import AksiTulis from '@/components/AksiTulis'

const PER_HALAMAN = 25

function buatUrl(filter, halaman) {
  const params = new URLSearchParams()
  for (const [kunci, nilai] of Object.entries(filter)) {
    if (nilai) params.set(kunci, nilai)
  }
  if (halaman > 1) params.set('hal', String(halaman))

  const teks = params.toString()
  return teks ? `/invoice?${teks}` : '/invoice'
}

export default async function DaftarInvoicePage({ searchParams }) {
  const sp = await searchParams
  const bahasa = await bahasaAktif()
  const t = ambilTeksInvoice(bahasa)
  const konteks = await konteksCabang()
  const supabase = await createClient()
  const hariIni = hariIniJakarta()

  const q = String(sp.q ?? '').trim().replace(/[%_,()]/g, ' ').trim()
  const jenis = JENIS_INVOICE.includes(String(sp.jenis ?? '')) ? String(sp.jenis) : ''
  const status = STATUS_TAMPIL.includes(String(sp.status ?? '')) ? String(sp.status) : ''
  const dari = tanggalValid(String(sp.dari ?? '')) ? String(sp.dari) : ''
  const sampai = tanggalValid(String(sp.sampai ?? '')) ? String(sp.sampai) : ''
  const minta = Number.parseInt(String(sp.hal ?? '1'), 10)
  const halaman = Number.isNaN(minta) || minta < 1 ? 1 : minta
  const awal = (halaman - 1) * PER_HALAMAN

  let query = supabase
    .from('invoice')
    .select(
      'id, tanggal, total, status_bayar, jenis, nama_pelanggan, keterangan, jatuh_tempo, member(id, nama), transaksi(jumlah)',
      { count: 'exact' }
    )
    .order('tanggal', { ascending: false })
    .order('id', { ascending: false })
    .range(awal, awal + PER_HALAMAN - 1)

  if (jenis) query = query.eq('jenis', jenis)
  if (status === 'lunas') query = query.eq('status_bayar', 'lunas')
  if (status === 'belum') query = query.neq('status_bayar', 'lunas')
  if (dari) query = query.gte('tanggal', dari)
  if (sampai) query = query.lte('tanggal', sampai)
  query = terapkanCabang(query, konteks)

  if (q) {
    const kondisi = [`nama_pelanggan.ilike.%${q}%`, `keterangan.ilike.%${q}%`]

    const { data: cocok } = await supabase
      .from('member')
      .select('id')
      .or(`nama.ilike.%${q}%,no_hp.ilike.%${q}%`)
      .limit(200)
    const ids = (cocok ?? []).map((m) => m.id)
    if (ids.length) kondisi.push(`member_id.in.(${ids.join(',')})`)

    // "INV-00012", "00012", atau "12" dikenali sebagai nomor invoice
    const nomor = q.match(/^(?:inv-?)?0*(\d{1,9})$/i)
    if (nomor) kondisi.push(`id.eq.${Number(nomor[1])}`)

    query = query.or(kondisi.join(','))
  }

  const { data: daftar, count, error } = await query

  if (error?.code === 'PGRST103') redirect('/invoice')
  if (error) {
    return <p className="p-10 text-red-600">{isi(t.daftar.galat, { pesan: error.message })}</p>
  }

  const jumlahHalaman = Math.max(1, Math.ceil((count ?? 0) / PER_HALAMAN))
  const filter = { q, jenis, status, dari, sampai }
  const adaFilter = Boolean(q || jenis || status || dari || sampai)
  const kolom = t.daftar.kolom

  return (
    <main className="p-5 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t.daftar.judul}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t.daftar.deskripsi}</p>
        </div>
        <AksiTulis>
          <div className="flex flex-wrap gap-2">
            <Link href="/invoice/baru" className="rounded-xl bg-lime-300 px-4 py-2 text-sm font-bold text-zinc-950">
              {t.daftar.buat}
            </Link>
            <Link href="/invoice/visit" className={gayaTombolLain}>{t.daftar.visit}</Link>
            <Link href="/stok/jual" className={gayaTombolLain}>{t.daftar.jual}</Link>
          </div>
        </AksiTulis>
      </div>

      <form className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] lg:items-end">
        <input name="q" defaultValue={q} placeholder={t.daftar.cari} className={gayaInput} />
        <select name="jenis" defaultValue={jenis} className={gayaInput}>
          <option value="">{t.daftar.semuaJenis}</option>
          {JENIS_INVOICE.map((nama) => (
            <option key={nama} value={nama}>{t.jenis[nama]}</option>
          ))}
        </select>
        <select name="status" defaultValue={status} className={gayaInput}>
          <option value="">{t.daftar.semuaStatus}</option>
          {STATUS_TAMPIL.map((nama) => (
            <option key={nama} value={nama}>{t.filterStatus[nama]}</option>
          ))}
        </select>
        <label className="space-y-1 text-xs text-zinc-500">
          <span>{t.daftar.dari}</span>
          <input name="dari" type="date" defaultValue={dari} className={gayaInput} />
        </label>
        <label className="space-y-1 text-xs text-zinc-500">
          <span>{t.daftar.sampai}</span>
          <input name="sampai" type="date" defaultValue={sampai} className={gayaInput} />
        </label>
        <div className="flex gap-2">
          <button className="rounded-xl bg-zinc-950 px-4 py-3 text-sm font-bold text-white">{t.daftar.terapkan}</button>
          {adaFilter && (
            <Link href="/invoice" className="rounded-xl px-3 py-3 text-sm text-zinc-500">{t.daftar.reset}</Link>
          )}
        </div>
      </form>

      <p className="mb-4 text-xs text-zinc-500">{isi(t.daftar.jumlah, { n: count ?? 0 })}</p>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-zinc-500">
              <th className="py-2 pr-4">{kolom.tanggal}</th>
              <th className="py-2 pr-4">{kolom.invoice}</th>
              <th className="py-2 pr-4">{kolom.pelanggan}</th>
              <th className="py-2 pr-4">{kolom.jenis}</th>
              <th className="py-2 pr-4">{kolom.keterangan}</th>
              <th className="py-2 pr-4">{kolom.total}</th>
              <th className="py-2 pr-4">{kolom.status}</th>
              <th className="py-2 pr-4">{kolom.aksi}</th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((f) => {
              const hitung = hitungStatusBayar(f, hariIni)
              return (
                <tr key={f.id} className="border-b">
                  <td className="whitespace-nowrap py-2 pr-4">{formatTanggal(f.tanggal, bahasa)}</td>
                  <td className="py-2 pr-4">
                    <Link href={`/invoice/${f.id}`} className="font-medium hover:underline">{nomorInvoice(f.id)}</Link>
                  </td>
                  <td className="py-2 pr-4">
                    {f.member ? (
                      <Link href={`/member/${f.member.id}`} className="font-medium hover:underline">{f.member.nama}</Link>
                    ) : (
                      (f.nama_pelanggan ?? t.daftar.umum)
                    )}
                  </td>
                  <td className="py-2 pr-4">{t.jenis[f.jenis] ?? f.jenis}</td>
                  <td className="max-w-xs truncate py-2 pr-4">{f.keterangan ?? '—'}</td>
                  <td className="whitespace-nowrap py-2 pr-4">Rp {f.total.toLocaleString('id-ID')}</td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${WARNA_STATUS_BAYAR[hitung.status]}`}>
                      {t.status[hitung.status]}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex gap-2">
                      <Link href={`/invoice/${f.id}`} className={gayaTombolKecil}>{t.daftar.aksi.detail}</Link>
                      <a href={`/invoice/${f.id}/pdf`} target="_blank" rel="noopener" className={gayaTombolKecil}>
                        {t.daftar.aksi.pdf}
                      </a>
                    </div>
                  </td>
                </tr>
              )
            })}
            {daftar.length === 0 && (
              <tr>
                <td colSpan={8} className="py-4 text-zinc-400">
                  {adaFilter ? t.daftar.kosongCari : t.daftar.kosong}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {jumlahHalaman > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          {halaman > 1 ? (
            <Link href={buatUrl(filter, halaman - 1)} className={gayaTombolLain}>{t.daftar.sebelumnya}</Link>
          ) : (
            <span />
          )}
          <span className="text-zinc-500">{isi(t.daftar.halaman, { a: halaman, b: jumlahHalaman })}</span>
          {halaman < jumlahHalaman ? (
            <Link href={buatUrl(filter, halaman + 1)} className={gayaTombolLain}>{t.daftar.berikutnya}</Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </main>
  )
}