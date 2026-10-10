import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function simpanPerubahan(formData) {
  'use server'

  const supabase = await createClient()
  const id = Number(formData.get('id'))
  const nama = formData.get('nama')
  const no_hp = formData.get('no_hp')

  const { error } = await supabase
    .from('member')
    .update({ nama, no_hp })
    .eq('id', id)

  if (error) throw new Error(error.message)

  redirect('/member')
}

async function hapusMember(formData) {
  'use server'

  const supabase = await createClient()
  const id = Number(formData.get('id'))

  const { error } = await supabase.from('member').delete().eq('id', id)

  if (error) throw new Error(error.message)

  redirect('/member')
}

export default async function EditMemberPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: member } = await supabase
    .from('member')
    .select('id, nama, no_hp')
    .eq('id', id)
    .single()

  if (!member) {
    return <p className="p-10">Member tidak ditemukan.</p>
  }

  return (
    <main className="p-10 font-sans max-w-lg">
      <h1 className="text-2xl font-semibold mb-6">Edit member</h1>

      <form action={simpanPerubahan} className="space-y-4">
        <input type="hidden" name="id" value={member.id} />

        <div className="space-y-1">
          <label className="text-sm text-stone-500">Nama lengkap</label>
          <input
            name="nama"
            required
            defaultValue={member.nama}
            className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-stone-500">No. HP</label>
          <input
            name="no_hp"
            defaultValue={member.no_hp ?? ''}
            className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" className="bg-teal-700 text-white rounded-md px-4 py-2 text-sm font-medium">
            Simpan perubahan
          </button>
          <Link href="/member" className="border border-stone-300 rounded-md px-4 py-2 text-sm">
            Batal
          </Link>
        </div>
      </form>

      <form action={hapusMember} className="mt-12 pt-6 border-t border-stone-200 space-y-3">
        <input type="hidden" name="id" value={member.id} />
        <p className="text-sm font-medium text-red-700">Hapus member</p>
        <p className="text-sm text-stone-500">
          Semua riwayat membership, invoice, dan sesi PT milik member ini ikut terhapus
          dan tidak bisa dikembalikan.
        </p>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" required />
          Saya yakin ingin menghapus {member.nama}
        </label>
        <button type="submit" className="border border-red-300 text-red-700 rounded-md px-4 py-2 text-sm">
          Hapus permanen
        </button>
      </form>
    </main>
  )
}