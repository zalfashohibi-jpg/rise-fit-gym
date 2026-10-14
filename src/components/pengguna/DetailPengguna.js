import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksPengguna } from '@/lib/i18n/pengguna'
import { isi } from '@/lib/i18n/umum'
import { formatTanggal, hariIniJakarta, umurDari } from '@/lib/tanggal'
import { ALAMAT_TIPE } from '@/lib/pengguna'
import { gayaTombolLain } from '@/components/FormKit'
import { ubahStatusPengguna } from './aksi'

function Baris({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium text-zinc-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-line text-sm font-medium">{children}</dd>
    </div>
  )
}

function rupiah(n) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

export default async function DetailPengguna({ tipe, params }) {
  const { id } = await params
  const bahasa = await bahasaAktif()
  const t = ambilTeksPengguna(bahasa)
  const l = t.detail.label
  const supabase = await createClient()

  const { data: orang } = await supabase
    .from('staff')
    .select('*')
    .eq('id', id)
    .eq('tipe', tipe)
    .maybeSingle()

  if (!orang) {
    return <p className="p-10">{t.galat.tidakAda}</p>
  }

  const dasar = ALAMAT_TIPE[tipe]
  const hariIni = hariIniJakarta()

  return (
    <main className="max-w-3xl p-5 sm:p-8">
      <Link href={dasar} className="text-sm text-zinc-500">
        {t.detail.kembali} {t.tipe[tipe].judul}
      </Link>

      <div className="mb-6 mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">{orang.nama}</h1>
        <div className="flex gap-2">
          <Link href={`${dasar}/${orang.id}/edit`} className={gayaTombolLain}>{t.daftar.aksi.edit}</Link>
          <form action={ubahStatusPengguna}>
            <input type="hidden" name="id" value={orang.id} />
            <input type="hidden" name="aktif" value={orang.aktif ? 'false' : 'true'} />
            <button className={gayaTombolLain}>
              {orang.aktif ? t.daftar.aksi.nonaktifkan : t.daftar.aksi.aktifkan}
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5">
        <dl className="grid gap-5 sm:grid-cols-2">
          <Baris label={l.nama}>{orang.nama}</Baris>
          <Baris label={l.jabatan}>{orang.jabatan}</Baris>
          <Baris label={l.hp}>{orang.no_hp ?? '—'}</Baris>
          <Baris label={l.status}>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                orang.aktif ? 'bg-lime-100 text-lime-800' : 'bg-zinc-100 text-zinc-600'
              }`}
            >
              {orang.aktif ? t.detail.status.aktif : t.detail.status.nonaktif}
            </span>
          </Baris>
          <Baris label={l.lahir}>
            {orang.tanggal_lahir
              ? `${formatTanggal(orang.tanggal_lahir, bahasa)} (${isi(t.detail.umur, { n: umurDari(orang.tanggal_lahir, hariIni) })})`
              : '—'}
          </Baris>
          <Baris label={l.masuk}>{formatTanggal(orang.tanggal_masuk, bahasa)}</Baris>
          <Baris label={l.spesialisasi}>{orang.spesialisasi ?? '—'}</Baris>

          {tipe === 'staff' ? (
            <Baris label={l.gaji}>{orang.gaji_bulanan != null ? rupiah(orang.gaji_bulanan) : '—'}</Baris>
          ) : (
            <>
              <Baris label={l.skema}>{orang.skema_kompensasi ? t.skema[orang.skema_kompensasi] : '—'}</Baris>
              {orang.skema_kompensasi === 'per_sesi' && (
                <Baris label={l.tarif}>{rupiah(orang.tarif_per_sesi)}</Baris>
              )}
              {orang.skema_kompensasi === 'bagi_hasil' && (
                <Baris label={l.persen}>{Number(orang.persen_bagi_hasil)}%</Baris>
              )}
            </>
          )}

          <div className="sm:col-span-2">
            <Baris label={l.alamat}>{orang.alamat ?? '—'}</Baris>
          </div>
        </dl>
      </div>
    </main>
  )
}