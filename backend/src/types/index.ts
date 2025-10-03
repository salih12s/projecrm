export interface User {
  id: number;
  username: string;
  password: string;
  created_at: Date;
}

export interface Islem {
  id: number;
  full_tarih: Date;
  teknisyen_ismi?: string;
  yapilan_islem?: string;
  tutar?: number;
  ad_soyad: string;
  ilce: string;
  mahalle: string;
  cadde: string;
  sokak: string;
  kapi_no: string;
  apartman_site?: string;
  blok_no?: string;
  daire_no?: string;
  sabit_tel?: string;
  cep_tel: string;
  urun: string;
  marka: string;
  sikayet: string;
  is_durumu: 'acik' | 'tamamlandi';
  created_by?: string;
  updated_at: Date;
}

export interface IslemCreateDto {
  ad_soyad: string;
  ilce: string;
  mahalle: string;
  cadde: string;
  sokak: string;
  kapi_no: string;
  apartman_site?: string;
  blok_no?: string;
  daire_no?: string;
  sabit_tel?: string;
  cep_tel: string;
  urun: string;
  marka: string;
  sikayet: string;
  teknisyen_ismi?: string;
  yapilan_islem?: string;
  tutar?: number;
}

export interface IslemUpdateDto {
  teknisyen_ismi?: string;
  yapilan_islem?: string;
  tutar?: number;
  ad_soyad: string;
  ilce: string;
  mahalle: string;
  cadde: string;
  sokak: string;
  kapi_no: string;
  apartman_site?: string;
  blok_no?: string;
  daire_no?: string;
  sabit_tel?: string;
  cep_tel: string;
  urun: string;
  marka: string;
  sikayet: string;
  is_durumu: 'acik' | 'tamamlandi';
}

export interface AuthPayload {
  id: number;
  username: string;
}

export interface Teknisyen {
  id: number;
  isim: string;
  created_at: Date;
}

export interface Marka {
  id: number;
  isim: string;
  created_at: Date;
}
