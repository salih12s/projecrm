export interface UserRecord {
  id: number;
  full_tarih: string;
  ad_soyad: string;
  ilce: string;
  mahalle: string;
  cep_tel: string;
  urun: string;
  marka: string;
  sikayet: string;
  is_durumu: string;
  created_by: string;
  updated_at: string;
}

export interface AtolyeRecord {
  id: number;
  teslim_durumu: string;
  bayi_adi: string;
  musteri_ad_soyad: string;
  tel_no: string;
  marka: string;
  kod: string;
  seri_no: string;
  sikayet: string;
  ozel_not: string;
  yapilan_islem: string;
  ucret: string;
  yapilma_tarihi: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}
