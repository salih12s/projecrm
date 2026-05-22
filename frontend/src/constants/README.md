# frontend/src/constants

Bu klasör, ileride uygulama genelinde paylaşılan sabitler için ayrıldı. **Şu an boş.**

## İleride taşınması planlanan sabitler

- **Socket event isimleri** — Şu an string literal olarak `Dashboard.tsx` ve `AtolyeTakip.tsx` içinde geçiyor:
  - `'yeni-islem'`, `'islem-guncellendi'`, `'islem-silindi'`, `'islem-durum-degisti'`
  - `'yeni-atolye'`, `'atolye-guncellendi'`, `'atolye-silindi'`
  Bunlar `constants/socketEvents.ts` içine alınacak. **İsimler değişmeyecek** — sadece tek noktadan refere edilecek.

- **İş durumları (islem durum string'leri)** — `IslemTable.tsx`, `IslemDialog.tsx`, `Dashboard.tsx` ve backend `routes/islemler.ts` arasında dağıtılmış string literal'ler:
  - `'beklemede'`, `'tamamlandi'`, `'iptal'`, vs. (doğru liste Phase 4'te netleştirilecek)
  Bunlar `constants/islemDurum.ts` içine alınacak.

- **Rol sabitleri** — JWT payload'da geçen rol string'leri:
  - `'admin'`, `'user'`, `'bayi'`, `'saha'`
  Bunlar `constants/roles.ts` içine alınacak. Backend'de de paralel modül gerekecek.

- **Atölye durum sabitleri** — `AtolyeTakip.tsx` kanban kolon başlıkları, durum string'leri.

## Bu turda
Hiçbir constant çıkarılmadı. Sadece klasör + bu README oluşturuldu.
