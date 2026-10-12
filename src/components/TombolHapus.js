'use client'

export default function TombolHapus({ aksi, id, label, pesan }) {
  return (
    <form
      action={aksi}
      onSubmit={(e) => {
        if (!window.confirm(pesan)) e.preventDefault()
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="rounded-xl border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">
        {label}
      </button>
    </form>
  )
}