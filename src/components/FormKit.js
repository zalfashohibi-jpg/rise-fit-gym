export const gayaInput =
  'w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm outline-none focus:border-zinc-950'
export const gayaTombolUtama =
  'rounded-xl bg-lime-300 px-5 py-2.5 text-sm font-bold text-zinc-950 disabled:opacity-60'
export const gayaTombolLain =
  'rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50'
export const gayaTombolKecil =
  'rounded-xl border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold hover:bg-zinc-50'

export function Kolom({ label, untuk, bantuan, children }) {
  return (
    <div className="space-y-1">
      <label htmlFor={untuk} className="text-sm text-zinc-500">{label}</label>
      {children}
      {bantuan && <p className="text-xs text-zinc-400">{bantuan}</p>}
    </div>
  )
}