'use client'

import { useState } from 'react'
import FormAksi from '@/components/FormAksi'
import InputRupiah from '@/components/InputRupiah'
import { Kolom, gayaInput } from '@/components/FormKit'

export default function FormPengguna({ aksi, tipe, teks, skemaTeks, nilai, saran, batalHref }) {
  const [skema, setSkema] = useState(nilai.skema_kompensasi ?? 'per_sesi')

  return (
    <FormAksi aksi={aksi} kirim={teks.simpan} menyimpan={teks.menyimpan} batal={teks.batal} batalHref={batalHref}>
      {nilai.id ? <input type="hidden" name="id" value={nilai.id} /> : null}
      <input type="hidden" name="tipe" value={tipe} />

      <Kolom label={teks.nama} untuk="nama">
        <input id="nama" name="nama" required maxLength={100} defaultValue={nilai.nama ?? ''} className={gayaInput} />
      </Kolom>

      <Kolom label={teks.jabatan} untuk="jabatan" bantuan={tipe === 'staff' ? teks.jabatanBantuan : null}>
        <input
          id="jabatan"
          name="jabatan"
          required
          maxLength={60}
          list="saran-jabatan"
          defaultValue={nilai.jabatan ?? ''}
          className={gayaInput}
        />
        {tipe === 'staff' && (
          <datalist id="saran-jabatan">
            {saran.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        )}
      </Kolom>

      <Kolom label={teks.hp} untuk="no_hp">
        <input id="no_hp" name="no_hp" type="tel" required maxLength={16} defaultValue={nilai.no_hp ?? ''} className={gayaInput} />
      </Kolom>

      <Kolom label={teks.alamat} untuk="alamat">
        <textarea id="alamat" name="alamat" rows={3} maxLength={300} defaultValue={nilai.alamat ?? ''} className={gayaInput} />
      </Kolom>

      <Kolom label={teks.lahir} untuk="tanggal_lahir">
        <input id="tanggal_lahir" name="tanggal_lahir" type="date" defaultValue={nilai.tanggal_lahir ?? ''} className={gayaInput} />
      </Kolom>

      <Kolom label={teks.masuk} untuk="tanggal_masuk">
        <input id="tanggal_masuk" name="tanggal_masuk" type="date" required defaultValue={nilai.tanggal_masuk ?? ''} className={gayaInput} />
      </Kolom>

      <Kolom label={teks.spesialisasi} untuk="spesialisasi">
        <input
          id="spesialisasi"
          name="spesialisasi"
          maxLength={100}
          placeholder={teks.spesialisasiContoh}
          defaultValue={nilai.spesialisasi ?? ''}
          className={gayaInput}
        />
      </Kolom>

      {tipe === 'staff' ? (
        <Kolom label={teks.gaji} untuk="gaji_bulanan" bantuan={teks.gajiBantuan}>
          <InputRupiah id="gaji_bulanan" name="gaji_bulanan" required defaultValue={nilai.gaji_bulanan ?? ''} className={gayaInput} />
        </Kolom>
      ) : (
        <>
          <Kolom label={teks.skema} untuk="skema">
            <select id="skema" name="skema" value={skema} onChange={(e) => setSkema(e.target.value)} className={gayaInput}>
              <option value="per_sesi">{skemaTeks.per_sesi}</option>
              <option value="bagi_hasil">{skemaTeks.bagi_hasil}</option>
            </select>
          </Kolom>

          {skema === 'per_sesi' ? (
            <Kolom label={teks.tarif} untuk="tarif_per_sesi" bantuan={teks.tarifBantuan}>
              <InputRupiah
                id="tarif_per_sesi"
                name="tarif_per_sesi"
                required
                defaultValue={nilai.tarif_per_sesi ?? ''}
                className={gayaInput}
              />
            </Kolom>
          ) : (
            <Kolom label={teks.persen} untuk="persen_bagi_hasil" bantuan={teks.persenBantuan}>
              <input
                id="persen_bagi_hasil"
                name="persen_bagi_hasil"
                type="number"
                min="0"
                max="100"
                step="0.01"
                required
                defaultValue={nilai.persen_bagi_hasil ?? ''}
                className={gayaInput}
              />
            </Kolom>
          )}
        </>
      )}
    </FormAksi>
  )
}