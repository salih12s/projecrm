# Cloudflare R2 fotoğraf taşıma

Bu dalın amacı PostgreSQL'deki legacy `foto_data` yükünü R2'ye kopyalamaktır.
Kopyalama idempotenttir; aynı object key tekrar yazılmaz ve doğrulama bitmeden
legacy kolon silinmez.

Gerekli backend değişkenleri:

- `R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- `R2_BUCKET=atolyeci-photos`
- `R2_ACCESS_KEY_ID=<Cloudflare token Access Key ID>`
- `R2_SECRET_ACCESS_KEY=<Cloudflare token Secret Access Key>`
- `R2_MIGRATION_BATCH_SIZE=20` (opsiyonel)
- `R2_MIGRATION_LIMIT=1` (pilot için opsiyonel)

Önce `20260916_create_saha_fotograflari.sql` migration'ını çalıştırın.
Pilot için `R2_MIGRATION_LIMIT=1` ile tek kayıt taşıyın. Sonuç ve R2
object boyutu doğrulanmadan toplu migration çalıştırmayın. `foto_data`
kolonu bu araç tarafından silinmez.
