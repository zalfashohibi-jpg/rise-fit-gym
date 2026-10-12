import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksMember } from '@/lib/i18n/member'
import { METODE_BAYAR } from '@/lib/pembayaran'
import { formatDurasi } from '@/lib/paket'
import { hariIniJakarta } from '@/lib/tanggal'
import FormAksi from '@/components/FormAksi'
import { Kolom, gayaInput, gayaTombolLain } from '@/components/FormKit'
import { tambahMember } from '../aksi'

export default async function TambahMemberPage() {
  const bahasa = await bahasaAktif()
  const t = ambilTeksMember(bahasa)
  const supabase = await createClient()

  const [{ data: paket }, { data: peraturanList }] = await Promise.all([
    supabase
      .from('paket_membership')
      .select('id, nama, harga, durasi_hari')
      .eq('jenis', 'membership')
      .eq('aktif', true)
      .order('durasi_hari'),
    supabase.from('peraturan').select('judul, isi, versi').order('id', { ascending: false }).limit(1),
  ])

  const peraturan = peraturanList?.[0]

  if (!paket?.length || !peraturan) {
    return (
      <main className="max-w-lg p-5 sm:p-8">
        <h1 className="mb-4 text-2xl font-black tracking-tight">{t.form.judul}</h1>
        <p className="mb-4 text-zinc-600">{t.form.prasyarat}</p>
        <div className="flex gap-3">
          <Link href="/paket" className={gayaTombolLain}>{t.form.kelolaPaket}</Link>
          <Link href="/peraturan" className={gayaTombolLain}>{t.form.kelolaPeraturan}</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-lg p-5 sm:p-8">
      <h1 className="mb-6 text-2xl font-black tracking-tight">{t.form.judul}</h1>

      <FormAksi
        aksi={tambahMember}
        kirim={t.form.simpan}
        menyimpan={t.form.menyimpan}
        batal={t.form.batal}
        batalHref="/member"
      >
        <Kolom label={t.form.nama} untuk="nama">
          <input id="nama" name="nama" required maxLength={100} className={gayaInput} />
        </Kolom>

        <Kolom label={t.form.hp} untuk="no_hp">
          <input id="no_hp" name="no_hp" type="tel" required maxLength={16} className={gayaInput} />
        </Kolom>

        <Kolom label={t.form.alamat} untuk="alamat">
          <textarea id="alamat" name="alamat" rows={3} maxLength={300} className={gayaInput} />
        </Kolom>

        <Kolom label={t.form.lahir} untuk="tanggal_lahir">
          <input id="tanggal_lahir" name="tanggal_lahir" type="date" max={hariIniJakarta()} className={gayaInput} />
        </Kolom>

        <Kolom label={t.form.paket} untuk="paket_id">
          <select id="paket_id" name="paket_id" className={gayaInput}>
            {paket.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama} · {formatDurasi(p.durasi_hari, bahasa)} · Rp {p.harga.toLocaleString('id-ID')}
              </option>
            ))}
          </select>
        </Kolom>

        <Kolom label={t.form.aktivasi} untuk="tanggal_mulai">
          <input id="tanggal_mulai" name="tanggal_mulai" type="date" required defaultValue={hariIniJakarta()} className={gayaInput} />
        </Kolom>

        <Kolom label={t.form.metode} untuk="metode" bantuan={t.form.metodeBantuan}>
          <select id="metode" name="metode" className={gayaInput}>
            {METODE_BAYAR.map((m) => (
              <option key={m} value={m}>{t.metode[m] ?? m}</option>
            ))}
          </select>
        </Kolom>

        <div className="space-y-2 pt-2">
          <div className="text-sm font-semibold">
            {peraturan.judul} <span className="font-normal text-zinc-400">({peraturan.versi})</span>
          </div>
          <div className="max-h-40 overflow-y-auto whitespace-pre-line rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            {peraturan.isi}
          </div>
          <label className="flex items-start gap-3 rounded-xl bg-zinc-100 p-4 text-sm text-zinc-700">
            <input type="checkbox" name="setuju" required className="mt-0.5 accent-zinc-950" />
            <span>{t.form.setuju}</span>
          </label>
        </div>
      </FormAksi>
    </main>
  )
}