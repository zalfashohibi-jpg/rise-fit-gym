import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksPaket } from '@/lib/i18n/paket'
import { JENIS_PAKET, KELAS_PAKET } from '@/lib/paket'
import FormPaket from '../FormPaket'
import { buatPaket } from '../aksi'

export default async function BuatPaketPage() {
  const bahasa = await bahasaAktif()
  const t = ambilTeksPaket(bahasa)

  const opsiJenis = JENIS_PAKET.map((nilai) => ({ nilai, label: t.jenis[nilai] }))
  const opsiKelas = KELAS_PAKET.map((nilai) => ({ nilai, label: t.kelas[nilai] }))

  return (
    <main className="max-w-xl p-5 sm:p-8">
      <h1 className="mb-6 text-2xl font-black tracking-tight">{t.form.judul}</h1>
      <FormPaket
        aksi={buatPaket}
        bahasa={bahasa}
        teks={t.form}
        opsiJenis={opsiJenis}
        opsiKelas={opsiKelas}
      />
    </main>
  )
}