import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksKelas } from '@/lib/i18n/kelas'
import { ambilInstruktur } from '@/lib/instruktur'
import { TIPE_KELAS, BATAS_KAPASITAS } from '@/lib/kelas'
import { gayaTombolLain } from '@/components/FormKit'
import FormKelas from '../../FormKelas'
import { ubahKelas, ubahPembatalan } from '../../aksi'

export default async function EditKelasPage({ params }) {
  const { id } = await params
  const t = ambilTeksKelas(await bahasaAktif())
  const supabase = await createClient()

  const { data: kelas } = await supabase.from('schedule').select('*').eq('id', id).maybeSingle()

  if (!kelas) {
    return <p className="p-10">{t.detail.tidakAda}</p>
  }

  const { trainer, freelancer } = await ambilInstruktur(supabase)

  // instruktur yang sekarang nonaktif tetap ditampilkan supaya kelas lama bisa disimpan
  let instrukturSaatIni = null
  const adaDiDaftar = [...trainer, ...freelancer].some((o) => o.id === kelas.instruktur_id)
  if (kelas.instruktur_id && !adaDiDaftar) {
    const { data } = await supabase.from('karyawan').select('id, nama').eq('id', kelas.instruktur_id).maybeSingle()
    instrukturSaatIni = data
  }

  const opsiTipe = TIPE_KELAS.map((nilai) => ({ nilai, label: t.tipe[nilai] }))

  return (
    <main className="max-w-lg p-5 sm:p-8">
      <h1 className="mb-6 text-2xl font-black tracking-tight">{t.form.judulEdit}</h1>

      <FormKelas
        aksi={ubahKelas}
        teks={t.form}
        nilai={{
          id: kelas.id,
          nama_kelas: kelas.nama_kelas,
          instruktur_id: kelas.instruktur_id,
          tipe_kelas: kelas.tipe_kelas,
          tanggal: kelas.tanggal,
          jam_mulai: kelas.jam_mulai.slice(0, 5),
          durasi_nilai: kelas.durasi_menit,
          durasi_satuan: 'menit',
          kapasitas: kelas.kapasitas,
        }}
        trainer={trainer}
        freelancer={freelancer}
        instrukturSaatIni={instrukturSaatIni}
        opsiTipe={opsiTipe}
        batas={BATAS_KAPASITAS}
        kirim={t.form.simpanPerubahan}
        batalHref="/jadwal"
      />

      <form action={ubahPembatalan} className="mt-12 space-y-3 border-t border-zinc-200 pt-6">
        <input type="hidden" name="id" value={kelas.id} />
        <input type="hidden" name="dibatalkan" value={kelas.dibatalkan ? 'false' : 'true'} />
        <p className="text-sm text-zinc-500">
          {kelas.dibatalkan ? t.edit.penjelasanAktif : t.edit.penjelasanBatal}
        </p>
        <button className={gayaTombolLain}>{kelas.dibatalkan ? t.edit.aktifkan : t.edit.batalkan}</button>
      </form>
    </main>
  )
}