export interface User {
  id: number;
  username: string;
  role?: 'admin' | 'bayi';
  bayiIsim?: string;
}

export interface Islem {
  id: number;
  full_tarih: string;
  teknisyen_ismi?: string;
  teknisyen?: string;  // Alias for teknisyen_ismi
  yapilan_islem?: string;
  ariza?: string;  // Alias for sikayet
  aciklama?: string;  // Alias for yapilan_islem
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
  yedek_tel?: string;
  urun: string;
  marka: string;
  sikayet: string;
  is_durumu: 'acik' | 'parca_bekliyor' | 'tamamlandi' | 'iptal';
  created_by?: string;
  updated_at: string;
  yazdirildi?: boolean; // Yazdırıldı mı? (yazıcı ikonu durumu)
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
  yedek_tel?: string;
  urun: string;
  marka: string;
  sikayet: string;
  teknisyen_ismi?: string;
  yapilan_islem?: string;
  tutar?: number;
  is_durumu?: 'acik' | 'parca_bekliyor' | 'tamamlandi' | 'iptal';
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
  yedek_tel?: string;
  urun: string;
  marka: string;
  sikayet: string;
  is_durumu: 'acik' | 'parca_bekliyor' | 'tamamlandi' | 'iptal';
}

export interface FilterParams {
  ad_soyad?: string;
  ilce?: string;
  mahalle?: string;
  cadde?: string;
  sokak?: string;
  kapi_no?: string;
  apartman_site?: string;
  blok_no?: string;
  daire_no?: string;
  sabit_tel?: string;
  cep_tel?: string;
  urun?: string;
  marka?: string;
  sikayet?: string;
  teknisyen_ismi?: string;
  is_durumu?: 'acik' | 'tamamlandi' | 'iptal' | '';
}

export interface Teknisyen {
  id: number;
  isim: string;
  created_at: string;
}

export interface Marka {
  id: number;
  isim: string;
  created_at: string;
}

export interface Bayi {
  id: number;
  isim: string;
  username: string;
  password: string;
  created_at: string;
}

export interface Montaj {
  id: number;
  isim: string;
  created_at: string;
}

export interface Aksesuar {
  id: number;
  isim: string;
  created_at: string;
}

export interface Urun {
  id: number;
  isim: string;
  created_at: string;
}

export interface Atolye {
  id: number;
  teslim_durumu: 'beklemede' | 'siparis_verildi' | 'yapildi' | 'fabrika_gitti' | 'odeme_bekliyor' | 'teslim_edildi';
  bayi_adi: string;
  musteri_ad_soyad: string;
  tel_no: string;
  marka: string;
  kod?: string;
  seri_no?: string;
  sikayet: string;
  ozel_not?: string;
  yapilan_islem?: string;
  ucret?: number;
  yapilma_tarihi?: string;
  kayit_tarihi?: string;
  created_at: string;
  updated_at: string;
}

export interface AtolyeCreateDto {
  bayi_adi: string;
  musteri_ad_soyad: string;
  tel_no: string;
  marka: string;
  kod?: string;
  seri_no?: string;
  sikayet: string;
  ozel_not?: string;
  kayit_tarihi?: string;
}

export interface AtolyeUpdateDto {
  teslim_durumu?: 'beklemede' | 'siparis_verildi' | 'yapildi' | 'fabrika_gitti' | 'odeme_bekliyor' | 'teslim_edildi';
  bayi_adi?: string;
  musteri_ad_soyad?: string;
  tel_no?: string;
  marka?: string;
  kod?: string;
  seri_no?: string;
  sikayet?: string;
  ozel_not?: string;
  yapilan_islem?: string;
  ucret?: number;
  yapilma_tarihi?: string;
  kayit_tarihi?: string;
}

