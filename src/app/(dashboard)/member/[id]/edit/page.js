import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksMember } from '@/lib/i18n/member'
import { isi } from '@/lib/i18n/umum'
import { formatDurasi } from '@/lib/paket'
import { hariIniJakarta } from '@/lib/tanggal'
import FormAksi from '@/components/FormAksi'
import { Kolom, gayaInput } from '@/components/FormKit'
import { ubahMember } from '../../aksi'

export default async function EditMemberPage({ params }) {
  const { id } = await params
  const bahasa = await bahasaAktif()
  const t = ambilTeksMember(bahasa)
  const supabase = await createClient()

  const [{ data: member }, { data: paket }] = await Promise.all([
    supabase
      .from('member')
      .select('id, nama, no_hp, alamat, tanggal_lahir, membership(id, paket, tanggal_mulai)')
      .eq('id', id)
      .order('tanggal_mulai', { referencedTable: 'membership', ascending: false })
      .order('id', { referencedTable: 'membership', ascending: false })
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

  const terkini = member.membership?.[0]

  return (
    <main className="max-w-lg p-5 sm:p-8">
      <h1 className="mb-6 text-2xl font-black tracking-tight">{t.edit.judul}</h1>

      <FormAksi
        aksi={ubahMember}
        kirim={t.edit.simpan}
        menyimpan={t.form.menyimpan}
        batal={t.form.batal}
        batalHref={`/member/${member.id}`}
      >
        <input type="hidden" name="id" value={member.id} />

        <Kolom label={t.form.nama} untuk="nama">
          <input id="nama" name="nama" required maxLength={100} defaultValue={member.nama} className={gayaInput} />
        </Kolom>

        <Kolom label={t.form.hp} untuk="no_hp">
          <input id="no_hp" name="no_hp" type="tel" required maxLength={16} defaultValue={member.no_hp ?? ''} className={gayaInput} />
        </Kolom>

        <Kolom label={t.form.alamat} untuk="alamat">
          <textarea id="alamat" name="alamat" rows={3} maxLength={300} defaultValue={member.alamat ?? ''} className={gayaInput} />
        </Kolom>

        <Kolom label={t.form.lahir} untuk="tanggal_lahir">
          <input
            id="tanggal_lahir"
            name="tanggal_lahir"
            type="date"
            max={hariIniJakarta()}
            defaultValue={member.tanggal_lahir ?? ''}
            className={gayaInput}
          />
        </Kolom>

        <Kolom label={t.edit.paket} untuk="paket_id" bantuan={terkini ? t.edit.paketBantuan : null}>
          <select id="paket_id" name="paket_id" defaultValue="" disabled={!terkini} className={gayaInput}>
            <option value="">
              {terkini ? isi(t.edit.paketSaatIni, { nama: terkini.paket }) : t.edit.tanpaMembership}
            </option>
            {(paket ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama} · {formatDurasi(p.durasi_hari, bahasa)} · Rp {p.harga.toLocaleString('id-ID')}
              </option>
            ))}
          </select>
        </Kolom>
      </FormAksi>
    </main>
  )
}