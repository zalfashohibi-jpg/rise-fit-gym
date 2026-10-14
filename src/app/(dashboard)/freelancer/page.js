import DaftarPengguna from '@/components/pengguna/DaftarPengguna'

export default function FreelancerPage({ searchParams }) {
  return <DaftarPengguna tipe="freelancer" searchParams={searchParams} />
}