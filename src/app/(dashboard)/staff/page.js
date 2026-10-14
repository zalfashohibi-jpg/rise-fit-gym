import DaftarPengguna from '@/components/pengguna/DaftarPengguna'

export default function StaffPage({ searchParams }) {
  return <DaftarPengguna tipe="staff" searchParams={searchParams} />
}