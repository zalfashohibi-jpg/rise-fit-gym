'use client'

import { useState } from 'react'
import FormAksi from '@/components/FormAksi'
import { Kolom, gayaInput } from '@/components/FormKit'
import { hitungDurasiMenit, jamSelesai, menitDariJam } from '@/lib/kelas'

export default function FormKelas({
  aksi,
  teks,
  nilai,
  trainer,
  freelancer,
  instrukturSaatIni,
  opsiTipe,
  batas,
  kirim,
  batalHref,
}) {
  const [jam, setJam] = useState(nilai.jam_mulai ?? '')
  const [durasi, setDurasi] = useState(String(nilai.durasi_nilai ?? ''))
  const [satuan, setSatuan] = useState(nilai.durasi_satuan ?? 'menit')

  const menit = hitungDurasiMenit(durasi, satuan)
  const total = jam && menit ? menitDariJam(jam) + menit : null
  const melewatiMalam = total !== null && total > 1440
  const selesai = total !== null && !melewatiMalam ? jamSelesai(jam, menit) : null

  return (
    <FormAksi aksi={aksi} kirim={kirim} menyimpan={teks.menyimpan} batal={teks.batal} batalHref={batalHref}>
      {nilai.id ? <input type="hidden" name="id" value={nilai.id} /> : null}

      <Kolom label={teks.nama} untuk="nama_kelas">
        <input
          id="nama_kelas"
          name="nama_kelas"
          required
          maxLength={80}
          placeholder={teks.namaContoh}
          defaultValue={nilai.nama_kelas ?? ''}
          className={gayaInput}
        />
      </Kolom>

      <Kolom label={teks.instruktur} untuk="instruktur_id">
        <select
          id="instruktur_id"
          name="instruktur_id"
          required
          defaultValue={nilai.instruktur_id ?? ''}
          className={gayaInput}
        >
          <option value="">{teks.pilihInstruktur}</option>
          {instrukturSaatIni && (
            <option value={instrukturSaatIni.id}>
              {instrukturSaatIni.nama} ({teks.nonaktif})
            </option>
          )}
          {trainer.length > 0 && (
            <optgroup label={teks.grupTrainer}>
              {trainer.map((o) => (
                <option key={o.id} value={o.id}>{o.nama}</option>
              ))}
            </optgroup>
          )}
          {freelancer.length > 0 && (
            <optgroup label={teks.grupFreelancer}>
              {freelancer.map((o) => (
                <option key={o.id} value={o.id}>{o.nama}</option>
              ))}
            </optgroup>
          )}
        </select>
      </Kolom>

      <Kolom label={teks.tipe} untuk="tipe_kelas">
        <select id="tipe_kelas" name="tipe_kelas" defaultValue={nilai.tipe_kelas ?? 'reguler'} className={gayaInput}>
          {opsiTipe.map((o) => (
            <option key={o.nilai} value={o.nilai}>{o.label}</option>
          ))}
        </select>
      </Kolom>

      <Kolom label={teks.tanggal} untuk="tanggal">
        <input id="tanggal" name="tanggal" type="date" required defaultValue={nilai.tanggal ?? ''} className={gayaInput} />
      </Kolom>

      <Kolom label={teks.jam} untuk="jam_mulai">
        <input
          id="jam_mulai"
          name="jam_mulai"
          type="time"
          required
          value={jam}
          onChange={(e) => setJam(e.target.value)}
          className={gayaInput}
        />
      </Kolom>

      <div className="space-y-2">
        <Kolom label={teks.durasi} untuk="durasi_nilai">
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <input
              id="durasi_nilai"
              name="durasi_nilai"
              type="number"
              min="0"
              step="any"
              required
              value={durasi}
              onChange={(e) => setDurasi(e.target.value)}
              className={gayaInput}
            />
            <select
              name="durasi_satuan"
              value={satuan}
              onChange={(e) => setSatuan(e.target.value)}
              aria-label={teks.durasi}
              className={`${gayaInput} w-auto`}
            >
              <option value="menit">{teks.satuan.menit}</option>
              <option value="jam">{teks.satuan.jam}</option>
            </select>
          </div>
        </Kolom>

        {selesai && (
          <div className="flex items-center justify-between rounded-xl bg-zinc-100 px-4 py-3 text-sm">
            <span className="text-zinc-500">{teks.selesaiPukul}</span>
            <span className="font-bold">{selesai}</span>
          </div>
        )}
        {melewatiMalam && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">{teks.lewatTengahMalam}</p>
        )}
      </div>

      <Kolom
        label={teks.kapasitas}
        untuk="kapasitas"
        bantuan={teks.kapasitasBantuan.replace('{min}', batas.min).replace('{max}', batas.max)}
      >
        <input
          id="kapasitas"
          name="kapasitas"
          type="number"
          min={batas.min}
          max={batas.max}
          required
          defaultValue={nilai.kapasitas ?? batas.awal}
          className={gayaInput}
        />
      </Kolom>
    </FormAksi>
  )
}