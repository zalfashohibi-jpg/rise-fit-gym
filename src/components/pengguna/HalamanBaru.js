import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksPengguna } from '@/lib/i18n/pengguna'
import { hariIniJakarta } from '@/lib/tanggal'
import { ALAMAT_TIPE } from '@/lib/pengguna'
import FormPengguna from './FormPengguna'
import { simpanPengguna } from './aksi'

export default async function HalamanBaru({ tipe }) {
  const t = ambilTeksPengguna(await bahasaAktif())

  return (
    <main className="max-w-lg p-5 sm:p-8">
      <h1 className="mb-6 text-2xl font-black tracking-tight">{t.tipe[tipe].formBaru}</h1>
      <FormPengguna
        aksi={simpanPengguna}
        tipe={tipe}
        teks={t.form}
        skemaTeks={t.skema}
        saran={t.saranJabatan}
        nilai={{ tanggal_masuk: hariIniJakarta() }}
        batalHref={ALAMAT_TIPE[tipe]}
      />
    </main>
  )
}