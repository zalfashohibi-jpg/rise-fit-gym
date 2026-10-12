import { ubahBahasa } from '@/lib/i18n/aksi'
import { BAHASA_TERSEDIA } from '@/lib/i18n/kamus'

export default function PilihBahasa({ bahasa, label }) {
  return (
    <form action={ubahBahasa} className="flex items-center gap-2">
      <span className="text-xs font-semibold text-zinc-500">{label}</span>
      <div className="flex rounded-lg border border-zinc-200 bg-white p-0.5">
        {BAHASA_TERSEDIA.map((kode) => (
          <button
            key={kode}
            type="submit"
            name="bahasa"
            value={kode}
            className={`rounded-md px-3 py-1 text-xs font-bold ${
              bahasa === kode ? 'bg-zinc-950 text-white' : 'text-zinc-500 hover:text-zinc-950'
            }`}
          >
            {kode.toUpperCase()}
          </button>
        ))}
      </div>
    </form>
  )
}