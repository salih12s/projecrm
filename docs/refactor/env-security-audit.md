# Bölüm A — Tracked Env Güvenlik Envanteri

**Tarih:** 22 Mayıs 2026
**Kapsam:** Sadece envanter ve risk değerlendirme. Hiçbir env dosyasının içeriği okunmadı veya bu rapora yazılmadı. Hiçbir secret değeri görüntülenmedi. Hiçbir `git rm --cached` uygulanmadı.

---

## 1. Git tarafından takip edilen env dosyaları

Komut çalıştırıldı:
```
git ls-files | Select-String -Pattern '(^|/)\.env'
```

Sonuç (5 dosya):

| # | Dosya yolu | Git tracked mı? | Secret içeriyor olabilir mi? | Risk | Önerilen aksiyon |
|---|---|---|---|---|---|
| 1 | `backend/.env.example` | Evet | Hayır (sadece placeholder, Phase 1'de doğrulandı) | 🟢 Düşük | Olduğu gibi kalsın |
| 2 | `frontend/.env.example` | Hayır (yeni eklendi, henüz untracked) | Hayır (sadece placeholder) | 🟢 Düşük | Sonraki commit'te eklenecek |
| 3 | `backend/.env.development` | **Evet** | Muhtemelen evet — lokal DB şifresi içerebilir | 🟡 Orta | Untrack + içeriği rotation tartışılmalı |
| 4 | `backend/.env.production` | **Evet** | **Yüksek olasılıkla evet** — Railway DATABASE_URL, JWT_SECRET, SYSTEM_PASSWORD_HASH içerebilir | 🔴 **Kritik** | Acil untrack + ilgili tüm secret'ların rotation'ı |
| 5 | `frontend/.env.development` | **Evet** | Düşük olasılık (VITE değişkenleri zaten public bundle'a girer) | 🟡 Orta | Untrack |
| 6 | `frontend/.env.production` | **Evet** | Düşük-orta (VITE_API_URL gibi bilgi sızdırır ama secret sayılmaz) | 🟡 Orta | Untrack |

> Not: VITE_ önekli değişkenler Vite tarafından bundle'a gömüldüğü için zaten "client-side public" sayılır; ama yine de repo'da plain-text durmaması ekip hijyeni açısından doğrudur.

---

## 2. Önerilen aksiyon planı (uygulanmadı — sadece öneri)

### 2.1 Adım 1 — Secret rotation (ÖNCE BU)
Aşağıdaki değişken **isimlerinin** rotation'ı, repo'dan çıkarmadan ÖNCE yapılmalıdır (sebep: history rewrite yapılmasa bile bu değerler şu anda public repo veya yetkisiz erişimle ifşa olmuş kabul edilmeli):

- `JWT_SECRET` — yeni güçlü değer üret, Railway'de güncelle, **tüm aktif token'lar invalid olur (kullanıcılar yeniden login)**
- `SYSTEM_PASSWORD_HASH` — yeni sistem şifresi belirle, bcrypt hash'ini güncelle
- `DB_PASSWORD` (lokal) — gerekirse rotate
- Railway PostgreSQL şifresi (production) — Railway dashboard'dan rotate, `DATABASE_URL` otomatik güncellenir
- Hostinger veritabanı bilgileri (eğer kullanılıyorsa)

**Bu adım hiçbir kod/değer içermez — değerleri buraya yazmıyorum.**

### 2.2 Adım 2 — Repodan untrack (history'de KALIR)

Sadece **öneri** olarak:
```powershell
git rm --cached backend/.env.development backend/.env.production
git rm --cached frontend/.env.development frontend/.env.production
git commit -m "chore(security): untrack tracked env files (history kept; values rotated)"
```

`.gitignore`'a kalıplar Phase 1'de eklendi (`.env.development`, `.env.production`) — untrack sonrası yeniden eklenmeleri engellenir.

### 2.3 Adım 3 — Git history'den tam silme (ÇOK DİKKAT)

> ⚠️ Bu adım **history rewrite** gerektirir (`git filter-repo` veya BFG).
> ⚠️ **Önce Adım 1 (rotation) tamamlanmalıdır** — history'den silmek değeri "ifşa olmamış" yapmaz, sadece arama yüzeyini küçültür.
> ⚠️ Solo dev iseniz daha kolay; ekip varsa tüm fork/clone'ların force-push'tan sonra yeniden klonlanması gerekir.
> ⚠️ GitHub mirror cache'i, pull request fork'lar, CI artifact'lar değerleri saklamış olabilir.
> ⚠️ **Bu turda uygulanmıyor.** Sadece Phase 3 sonrası, kullanıcı onayıyla yapılır.

---

## 3. Acil aksiyon gerekiyor mu?

**Cevap: EVET — ama "kritik" düzeyde değil, "yüksek öncelikli".**

- `backend/.env.production` Railway DATABASE_URL ve JWT_SECRET içeriyorsa → bunlar **şu anda repo'da görünür durumda**.
- Repo public ise bu **acil ihlal** sayılır.
- Repo private ve sadece güvenilir erişimi olan ekip görüyorsa → "yüksek öncelikli ama haftalar içinde halledilebilir" düzeyinde.

> Repo'nun public/private statüsü doğrulanmalı. Public ise rotation **bugün** yapılmalı.

## 4. Phase 2'ye geçmeye engel mi?

**Cevap: HAYIR.**

- Phase 2 sadece envanter raporları üretiyor; kod değişmiyor.
- Env güvenlik aksiyonu paralel bir track olarak ilerleyebilir (rotation kullanıcı tarafından, repo değişmeden yapılabilir).
- Untrack adımı Phase 3 başında planlanır (ayrı, geri alınabilir bir commit).

**Sonuç:** Phase 2 envanterine devam edildi.
