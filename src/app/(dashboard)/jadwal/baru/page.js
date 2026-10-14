import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksKelas } from '@/lib/i18n/kelas'
import { ambilInstruktur } from '@/lib/instruktur'
import { hariIniJakarta } from '@/lib/tanggal'
import { TIPE_KELAS, BATAS_KAPASITAS } from '@/lib/kelas'
import { gayaTombolLain } from '@/components/FormKit'
import FormKelas from '../FormKelas'
import { buatKelas } from '../aksi'

export default async function BuatKelasPage() {
  const t = ambilTeksKelas(await bahasaAktif())
  const supabase = await createClient()

  const { trainer, freelancer } = await ambilInstruktur(supabase)

  if (trainer.length + freelancer.length === 0) {
    return (
      <main className="max-w-lg p-5 sm:p-8">
        <h1 className="mb-4 text-2xl font-black tracking-tight">{t.form.judulBaru}</h1>
        <p className="mb-4 text-zinc-600">{t.form.tanpaInstruktur}</p>
        <div className="flex gap-3">
          <Link href="/staff/baru" className={gayaTombolLain}>{t.form.tambahStaff}</Link>
          <Link href="/freelancer/baru" className={gayaTombolLain}>{t.form.tambahFreelancer}</Link>
        </div>
      </main>
    )
  }

  const opsiTipe = TIPE_KELAS.map((nilai) => ({ nilai, label: t.tipe[nilai] }))

  return (
    <main className="max-w-lg p-5 sm:p-8">
      <h1 className="mb-6 text-2xl font-black tracking-tight">{t.form.judulBaru}</h1>
      <FormKelas
        aksi={buatKelas}
        teks={t.form}
        nilai={{
          tanggal: hariIniJakarta(),
          tipe_kelas: 'reguler',
          durasi_nilai: 60,
          durasi_satuan: 'menit',
          kapasitas: BATAS_KAPASITAS.awal,
        }}
        trainer={trainer}
        freelancer={freelancer}
        instrukturSaatIni={null}
        opsiTipe={opsiTipe}
        batas={BATAS_KAPASITAS}
        kirim={t.form.simpan}
        batalHref="/jadwal"
      />
    </main>
  )
}