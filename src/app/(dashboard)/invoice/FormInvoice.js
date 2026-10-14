'use client'

import { useState } from 'react'
import FormAksi from '@/components/FormAksi'
import { Kolom, gayaInput, gayaTombolLain } from '@/components/FormKit'

const barisKosong = () => ({ deskripsi: '', qty: '1', harga: '' })

export default function FormInvoice({ aksi, teks, member, opsiMetode, batas }) {
  const [baris, setBaris] = useState([barisKosong()])
  const [memberId, setMemberId] = useState('')
  const [lunas, setLunas] = useState(false)

  const ubah = (i, kolom, nilai) =>
    setBaris((lama) => lama.map((b, n) => (n === i ? { ...b, [kolom]: nilai } : b)))
  const tambah = () => setBaris((lama) => (lama.length < batas ? [...lama, barisKosong()] : lama))
  const hapus = (i) => setBaris((lama) => (lama.length > 1 ? lama.filter((_, n) => n !== i) : lama))

  const subtotal = (b) => (Number(b.qty) > 0 && Number(b.harga) >= 0 ? Number(b.qty) * Number(b.harga) : 0)
  const total = baris.reduce((n, b) => n + subtotal(b), 0)

  const rincianJson = JSON.stringify(
    baris.map((b) => ({ deskripsi: b.deskripsi, qty: Number(b.qty), harga: Number(b.harga) }))
  )

  return (
    <FormAksi
      aksi={aksi}
      kirim={teks.simpan}
      menyimpan={teks.menyimpan}
      batal={teks.batal}
      batalHref="/invoice"
    >
      <input type="hidden" name="rincian" value={rincianJson} />

      <Kolom label={teks.pelanggan} untuk="member_id">
        <select
          id="member_id"
          name="member_id"
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className={gayaInput}
        >
          <option value="">{teks.pilihMember}</option>
          {member.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nama}
              {m.no_hp ? ` · ${m.no_hp}` : ''}
            </option>
          ))}
        </select>
      </Kolom>

      <Kolom label={teks.namaBebas} untuk="nama_pelanggan">
        <input
          id="nama_pelanggan"
          name="nama_pelanggan"
          maxLength={100}
          disabled={Boolean(memberId)}
          className={`${gayaInput} disabled:opacity-50`}
        />
      </Kolom>

      <div className="space-y-2">
        <div className="text-sm text-zinc-500">{teks.rincian}</div>

        {baris.map((b, i) => (
          <div key={i} className="grid grid-cols-[1fr_72px_120px] gap-2 sm:grid-cols-[1fr_72px_130px_auto]">
            <input
              aria-label={teks.deskripsi}
              placeholder={teks.deskripsi}
              required
              maxLength={120}
              value={b.deskripsi}
              onChange={(e) => ubah(i, 'deskripsi', e.target.value)}
              className={gayaInput}
            />
            <input
              aria-label={teks.qty}
              placeholder={teks.qty}
              type="number"
              min="1"
              step="1"
              required
              value={b.qty}
              onChange={(e) => ubah(i, 'qty', e.target.value)}
              className={gayaInput}
            />
            <input
              aria-label={teks.harga}
              placeholder={teks.harga}
              type="number"
              min="0"
              step="1"
              required
              value={b.harga}
              onChange={(e) => ubah(i, 'harga', e.target.value)}
              className={gayaInput}
            />
            <div className="col-span-3 flex items-center justify-between gap-3 sm:col-span-1">
              <span className="text-xs text-zinc-500">
                {teks.subtotal}: Rp {subtotal(b).toLocaleString('id-ID')}
              </span>
              {baris.length > 1 && (
                <button type="button" onClick={() => hapus(i)} className="text-xs font-semibold text-red-700">
                  {teks.hapusBaris}
                </button>
              )}
            </div>
          </div>
        ))}

        {baris.length < batas && (
          <button type="button" onClick={tambah} className={gayaTombolLain}>
            {teks.tambahBaris}
          </button>
        )}

        <div className="flex items-center justify-between rounded-xl bg-zinc-100 px-4 py-3 text-sm">
          <span className="text-zinc-500">{teks.total}</span>
          <span className="font-black">Rp {total.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <Kolom label={teks.keterangan} untuk="keterangan">
        <input id="keterangan" name="keterangan" maxLength={200} className={gayaInput} />
      </Kolom>

      <Kolom label={teks.jatuhTempo} untuk="jatuh_tempo">
        <input id="jatuh_tempo" name="jatuh_tempo" type="date" className={gayaInput} />
      </Kolom>

      <label className="flex items-center gap-3 rounded-xl bg-zinc-100 p-4 text-sm">
        <input
          type="checkbox"
          name="lunas"
          checked={lunas}
          onChange={(e) => setLunas(e.target.checked)}
          className="accent-zinc-950"
        />
        <span>{teks.sudahLunas}</span>
      </label>

      {lunas && (
        <Kolom label={teks.metode} untuk="metode">
          <select id="metode" name="metode" className={gayaInput}>
            {opsiMetode.map((m) => (
              <option key={m.nilai} value={m.nilai}>{m.label}</option>
            ))}
          </select>
        </Kolom>
      )}
    </FormAksi>
  )
}