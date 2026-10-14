import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksPengguna } from '@/lib/i18n/pengguna'
import { ALAMAT_TIPE } from '@/lib/pengguna'
import FormPengguna from './FormPengguna'
import { simpanPengguna } from './aksi'

export default async function HalamanEdit({ tipe, params }) {
  const { id } = await params
  const t = ambilTeksPengguna(await bahasaAktif())
  const supabase = await createClient()

  const { data: orang } = await supabase
    .from('karyawan')
    .select('*')
    .eq('id', id)
    .eq('tipe', tipe)
    .maybeSingle()

  if (!orang) {
    return <p className="p-10">{t.galat.tidakAda}</p>
  }

  return (
    <main className="max-w-lg p-5 sm:p-8">
      <h1 className="mb-6 text-2xl font-black tracking-tight">{t.tipe[tipe].formEdit}</h1>
      <FormPengguna
        aksi={simpanPengguna}
        tipe={tipe}
        teks={t.form}
        skemaTeks={t.skema}
        saran={t.saranJabatan}
        nilai={orang}
        batalHref={`${ALAMAT_TIPE[tipe]}/${orang.id}`}
      />
    </main>
  )
}