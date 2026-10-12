import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksRingkasan } from '@/lib/i18n/ringkasan'
import { jumlahTeks, lokalBahasa, rupiahSingkat } from '@/lib/i18n/umum'
import { BATAS_STOK } from '@/lib/stok'

function tambahHari(tanggal, n) {
  const d = new Date(tanggal)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function selisihHari(a, b) {
  return Math.round((new Date(a) - new Date(b)) / 86400000)
}

function labelSisa(hari, t) {
  if (hari < 0) return { teks: jumlahTeks(-hari, t.segera.lewat), warna: 'bg-red-50 text-red-700' }
  if (hari === 0) return { teks: t.segera.hariIni, warna: 'bg-red-50 text-red-700' }
  return {
    teks: jumlahTeks(hari, t.segera.lagi),
    warna: hari <= 3 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700',
  }
}

export default async function RingkasanPage() {
  const bahasa = await bahasaAktif()
  const t = ambilTeksRingkasan(bahasa)
  const supabase = await createClient()

  const sekarang = new Date()
  const today = sekarang.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
  const awalBulan = `${today.slice(0, 8)}01`
  const batasAtas = tambahHari(today, 7)
  const batasBawah = tambahHari(today, -30)

  const hasil = await Promise.all([
    supabase.from('membership').select('member_id').eq('status', 'aktif').gte('tanggal_exp', today),
    supabase
      .from('membership')
      .select('id, paket, tanggal_exp, member(id, nama)')
      .eq('status', 'aktif')
      .gte('tanggal_exp', batasBawah)
      .lte('tanggal_exp', batasAtas)
      .order('tanggal_exp'),
    supabase.from('transaksi').select('jumlah').gte('tanggal', awalBulan),
    supabase
      .from('item_stok')
      .select('nama_item, jumlah_stok')
      .lte('jumlah_stok', BATAS_STOK)
      .order('jumlah_stok'),
    supabase
      .from('schedule')
      .select('id, jam_mulai, kelas(nama_kelas, kapasitas), personal_trainer(karyawan(nama)), kelas_peserta(count)')
      .eq('tanggal', today)
      .order('jam_mulai'),
    supabase
      .from('pengumuman')
      .select('judul, isi')
      .lte('tanggal_mulai', today)
      .or(`tanggal_selesai.is.null,tanggal_selesai.gte.${today}`)
      .order('tanggal_mulai', { ascending: false })
      .limit(1),
  ])

  const galat = hasil.find((h) => h.error)?.error
  if (galat) {
    return <p className="p-10 text-red-600">{t.galat.replace('{pesan}', galat.message)}</p>
  }

  const [aktif, berisiko, transaksi, stok, jadwal, pengumuman] = hasil.map((h) => h.data ?? [])

  const memberAktif = new Set(aktif.map((m) => m.member_id)).size
  const segeraHabis = berisiko.filter((m) => m.tanggal_exp >= today).length
  const pendapatan = transaksi.reduce((total, x) => total + x.jumlah, 0)
  const namaStok = stok.slice(0, 2).map((s) => s.nama_item).join(', ')

  const jam =
    Number(
      new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Jakarta' }).format(sekarang)
    ) % 24
  const sapaan =
    jam < 11 ? t.sapaan.pagi : jam < 15 ? t.sapaan.siang : jam < 18 ? t.sapaan.sore : t.sapaan.malam
  const tanggalLabel = new Intl.DateTimeFormat(lokalBahasa(bahasa), {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Jakarta',
  }).format(sekarang)

  const aksi = [
    { href: '/member/baru', ...t.aksi.memberBaru, utama: true },
    { href: '/member', ...t.aksi.perpanjang },
    { href: '/jadwal/baru', ...t.aksi.buatKelas },
    { href: '/karyawan/baru', ...t.aksi.stafBaru },
  ]

  const kartu = [
    { label: t.kartu.memberAktif.label, nilai: memberAktif, info: t.kartu.memberAktif.info },
    { label: t.kartu.segeraHabis.label, nilai: segeraHabis, info: t.kartu.segeraHabis.info },
    {
      label: t.kartu.pembayaran.label,
      nilai: rupiahSingkat(pendapatan, bahasa),
      info: t.kartu.pembayaran.info,
    },
    {
      label: t.kartu.stok.label,
      nilai: stok.length,
      info: stok.length ? namaStok : t.kartu.stok.semuaAman.replace('{n}', BATAS_STOK),
      peringatan: stok.length > 0,
    },
  ]

  return (
    <main className="mx-auto max-w-[1500px] p-5 sm:p-8">
      {pengumuman[0] && (
        <div className="mb-6 rounded-2xl bg-zinc-950 px-5 py-4 text-white">
          <div className="text-sm font-bold">{pengumuman[0].judul}</div>
          {pengumuman[0].isi && <div className="mt-1 text-sm text-zinc-400">{pengumuman[0].isi}</div>}
        </div>
      )}

      <section className="mb-8">
        <div className="text-3xl font-black tracking-tight">{sapaan}.</div>
        <div className="mt-1 text-sm text-zinc-500">
          {tanggalLabel} · {t.sub}
        </div>
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {aksi.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`flex min-h-28 flex-col justify-between rounded-2xl border border-zinc-200 p-5 shadow-sm hover:-translate-y-0.5 hover:shadow-md ${
              a.utama ? 'bg-lime-300 text-zinc-950' : 'bg-white text-zinc-950'
            }`}
          >
            <span className="text-lg">→</span>
            <div>
              <div className="font-bold">{a.judul}</div>
              <div className="mt-1 text-xs opacity-70">{a.teks}</div>
            </div>
          </Link>
        ))}
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kartu.map((k) => (
          <div key={k.label} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="text-xs font-medium text-zinc-500">{k.label}</div>
            <div className="mt-3 text-3xl font-black tracking-tight">{k.nilai}</div>
            <div className={`mt-1 truncate text-xs font-medium ${k.peringatan ? 'text-orange-700' : 'text-zinc-500'}`}>
              {k.info}
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="p-5">
            <div className="font-bold">{t.segera.judul}</div>
            <div className="mt-1 text-xs text-zinc-500">{t.segera.deskripsi}</div>
          </div>
          {berisiko.length === 0 ? (
            <p className="border-t border-zinc-100 p-5 text-sm text-zinc-500">{t.segera.kosong}</p>
          ) : (
            berisiko.map((m) => {
              const label = labelSisa(selisihHari(m.tanggal_exp, today), t)
              return (
                <div key={m.id} className="flex items-center gap-3 border-t border-zinc-100 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{m.member?.nama}</div>
                    <div className="text-xs text-zinc-500">
                      {m.paket} · {m.tanggal_exp}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold ${label.warna}`}>
                    {label.teks}
                  </span>
                  <Link
                    href={`/member/${m.member?.id}/perpanjang`}
                    className="shrink-0 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold hover:bg-zinc-50"
                  >
                    {t.segera.perpanjang}
                  </Link>
                </div>
              )
            })
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <div className="font-bold">{t.jadwal.judul}</div>
            <div className="mt-1 text-xs text-zinc-500">{tanggalLabel}</div>
          </div>

          {jadwal.length === 0 ? (
            <p className="text-sm text-zinc-500">{t.jadwal.kosong}</p>
          ) : (
            jadwal.map((j) => (
              <Link
                key={j.id}
                href={`/jadwal/${j.id}`}
                className="flex items-center gap-3 rounded-xl p-2 hover:bg-zinc-50"
              >
                <div className="w-12 text-xs font-bold text-zinc-500">{j.jam_mulai.slice(0, 5)}</div>
                <div className="h-12 w-1 rounded-full bg-lime-400" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold">{j.kelas?.nama_kelas ?? t.jadwal.kelas}</div>
                  <div className="truncate text-xs text-zinc-500">
                    {j.personal_trainer?.karyawan?.nama ?? '—'} · {j.kelas_peserta?.[0]?.count ?? 0} /{' '}
                    {j.kelas?.kapasitas ?? '—'}
                  </div>
                </div>
              </Link>
            ))
          )}

          <Link
            href="/jadwal"
            className="mt-4 block rounded-xl bg-zinc-100 py-3 text-center text-xs font-bold hover:bg-zinc-200"
          >
            {t.jadwal.semua}
          </Link>
        </div>
      </section>
    </main>
  )
}