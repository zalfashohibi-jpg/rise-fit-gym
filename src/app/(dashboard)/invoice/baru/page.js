import { createClient } from '@/lib/supabase/server'
import { bahasaAktif } from '@/lib/i18n/bahasa'
import { ambilTeksInvoice } from '@/lib/i18n/invoice'
import { METODE_BAYAR } from '@/lib/pembayaran'
import { BATAS_RINCIAN } from '@/lib/invoice'
import FormInvoice from '../FormInvoice'
import { buatInvoiceManual } from '../aksi'

export default async function BuatInvoicePage() {
  const t = ambilTeksInvoice(await bahasaAktif())
  const supabase = await createClient()

  const { data: member } = await supabase
    .from('member')
    .select('id, nama, no_hp')
    .eq('aktif', true)
    .order('nama')

  const opsiMetode = METODE_BAYAR.map((m) => ({ nilai: m, label: t.metode[m] ?? m }))

  return (
    <main className="max-w-2xl p-5 sm:p-8">
      <h1 className="mb-6 text-2xl font-black tracking-tight">{t.form.judul}</h1>
      <FormInvoice
        aksi={buatInvoiceManual}
        teks={t.form}
        member={member ?? []}
        opsiMetode={opsiMetode}
        batas={BATAS_RINCIAN}
      />
    </main>
  )
}