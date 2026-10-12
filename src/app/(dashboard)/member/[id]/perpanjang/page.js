import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksMember } from '@/lib/i18n/member'
import { METODE_BAYAR } from '@/lib/pembayaran'
import { formatDurasi } from '@/lib/paket'
import { hariIniJakarta } from '@/lib/tanggal'
import FormAksi from '@/components/FormAksi'
import { Kolom, gayaInput, gayaTombolLain } from '@/components/FormKit'
import { perpanjangMember } from '../../aksi'

export default async function PerpanjangPage({ params }) {
  const { id } = await params
  const bahasa = await bahasaAktif()
  const t = ambilTeksMember(bahasa)
  const supabase = await createClient()

  const [{ data: member }, { data: paket }] = await Promise.all([
    supabase
      .from('member')
      .select('id, nama, membership(tanggal_exp)')
      .eq('id', id)
      .order('tanggal_exp', { referencedTable: 'membership', ascending: false })
      .single(),
    supabase
      .from('paket_membership')
      .select('id, nama, harga, durasi_hari')
      .eq('jenis', 'membership')
      .eq('aktif', true)
      .order('durasi_hari'),
  ])

  if (!member) {
    return <p className="p-10">{t.detail.tidakAda}</p>
  }

  if (!paket?.length) {
    return (
      <main className="max-w-lg p-5 sm:p-8">
        <h1 className="mb-4 text-2xl font-black tracking-tight">{t.perpanjang.judul}</h1>
        <p className="mb-4 text-zinc-600">{t.perpanjang.kosongPaket}</p>
        <Link href="/paket" className={gayaTombolLain}>{t.perpanjang.kelolaPaket}</Link>
      </main>
    )
  }

  // kalau masih berlaku, mulai dari tanggal expired lama supaya sisa hari tidak hangus
  const hariIni = hariIniJakarta()
  const expTerakhir = member.membership?.[0]?.tanggal_exp
  const defaultMulai = expTerakhir && expTerakhir > hariIni ? expTerakhir : hariIni

  return (
    <main className="max-w-lg p-5 sm:p-8">
      <h1 className="mb-1 text-2xl font-black tracking-tight">{t.perpanjang.judul}</h1>
      <p className="mb-6 text-zinc-500">{member.nama}</p>

      <FormAksi
        aksi={perpanjangMember}
        kirim={t.perpanjang.simpan}
        menyimpan={t.perpanjang.menyimpan}
        batal={t.perpanjang.batal}
        batalHref={`/member/${member.id}`}
      >
        <input type="hidden" name="member_id" value={member.id} />

        <Kolom label={t.perpanjang.paket} untuk="paket_id">
          <select id="paket_id" name="paket_id" className={gayaInput}>
            {paket.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama} · {formatDurasi(p.durasi_hari, bahasa)} · Rp {p.harga.toLocaleString('id-ID')}
              </option>
            ))}
          </select>
        </Kolom>

        <Kolom label={t.perpanjang.mulai} untuk="tanggal_mulai">
          <input id="tanggal_mulai" name="tanggal_mulai" type="date" required defaultValue={defaultMulai} className={gayaInput} />
        </Kolom>

        <Kolom label={t.perpanjang.metode} untuk="metode" bantuan={t.perpanjang.metodeBantuan}>
          <select id="metode" name="metode" className={gayaInput}>
            {METODE_BAYAR.map((m) => (
              <option key={m} value={m}>{t.metode[m] ?? m}</option>
            ))}
          </select>
        </Kolom>
      </FormAksi>
    </main>
  )
}