# Phase 7-8 Report — Frontend Stability Hooks + Dashboard Socket Hook

> Branch: `refactor/phase-0-baseline`
> Scope: Sadece frontend. Backend / auth / DB / migration / API path / payload /
> Axios interceptor / PDF / Excel / PrintEditor / Socket.IO event isimleri /
> Socket.IO URL/reconnect/transports / UI tasarımı / büyük component split /
> `IslemDialog` & `IslemTable` refactor / `package.json` script değişiklikleri —
> **dokunulmadı**.

---

## 1. Yapılan değişiklikler (özet)

| Kategori | Dosya | Durum |
|---|---|---|
| Stability | `frontend/src/context/SnackbarContext.tsx` | `useCallback` + `useMemo` ile stabilize edildi |
| Hook (yeni) | `frontend/src/hooks/useDebouncedValue.ts` | Eklendi, entegre **edilmedi** |
| Hook (yeni) | `frontend/src/hooks/useMahalleler.ts` | Eklendi, entegre **edilmedi** |
| Hook (yeni) | `frontend/src/hooks/useIslemSocket.ts` | Eklendi, `Dashboard`'a entegre edildi |
| Component | `frontend/src/components/dashboard/Dashboard.tsx` | Socket useEffect → `useIslemSocket` |
| Dokümantasyon | `frontend/src/hooks/README.md` | Phase 7-8 bölümü eklendi |

## 2. Oluşturulan hook'lar

### `useDebouncedValue<T>(value, delayMs): T`
- Saf React; `setTimeout` / `clearTimeout`.
- Hiçbir component bu turda entegre edilmedi.
- **Sebep:** `IslemFilters` zaten `lodash.debounce` kullanıyor. Spec'in
  "çakışma riski varsa entegre etme" maddesi gereği sadece hazırlandı.

### `useMahalleler(ilceId, { enabled? })`
- `locationService.getMahalleler(ilceId)`'i sarmalar.
- `{ data, loading, error, refetch }` döner.
- `ilceId` yok veya `enabled === false` → istek atmaz, `data = []`.
- `console.error('Mahalleler yüklenirken hata:', err)` legacy wording.
- **`IslemDialog`'a entegre edilmedi** — Phase 6/7-8 risk listesinde
  `IslemDialog` "yüksek riskli" olarak kalıyor.

### `useIslemSocket(handlers)`
- Tek socket connection, mount-only lifecycle.
- `handlersRef` pattern: socket bir kez kuruluyor, callbacks her render'da
  taze. Legacy `eslint-disable-next-line react-hooks/exhaustive-deps` + boş
  deps array davranışıyla birebir aynı.
- `socket.close()` ile cleanup (legacy ile aynı).

## 3. Değiştirilen component / context dosyaları

- **`SnackbarContext.tsx`**
  - `showSnackbar` → `useCallback(..., [])`.
  - `handleClose` → `useCallback(..., [])`.
  - Provider value → `useMemo({ showSnackbar }, [showSnackbar])`.
  - Mesaj metni, severity, `autoHideDuration={4000}`, anchor, `Alert` davranışı,
    clickaway logic, filled variant — değişmedi.
- **`Dashboard.tsx`**
  - 59 satırlık `useEffect` bloğu → ~30 satırlık `useIslemSocket({...})` çağrısına
    indirgendi.
  - `io` import'u kaldırıldı (kullanım yok).
  - `setIslemler`, `loadStats`, `showSnackbar` çağrı sırası, koşulları (`if (islem
    && islem.id)`, `if (id)`), mesaj metinleri (`'Yeni işlem eklendi!'`,
    `'İşlem güncellendi!'`, `'İşlem silindi!'`, `'İş durumu güncellendi!'`) ve
    severity değerleri (`'info'`, `'success'`) birebir korundu.
  - `statusFilterRef`, `tableFilteredIslemlerRef`, `setFilteredIslemler`,
    `setTableFilteredIslemler` ve diğer ref/state davranışlarına dokunulmadı —
    socket handler'ları zaten bunları doğrudan kullanmıyordu.

## 4. Dashboard socket davranışı nasıl korundu?

- **Connection lifecycle:** Mount-only. Legacy useEffect boş deps array
  kullanıyordu; hook içinde de boş deps array + ref pattern ile aynı garanti.
- **Cleanup:** `socket.close()` (legacy `newSocket.close()` ile aynı method).
- **Reconnect:** `{ reconnection: true, reconnectionDelay: 1000,
  reconnectionAttempts: 10, transports: ['websocket', 'polling'] }` — değişmedi.
- **SOCKET_URL:** Bit-for-bit aynı (`import.meta.env.MODE === 'production' ?
  'https://projecrm-production.up.railway.app' : 'http://localhost:5000'`).
- **Default `onConnect`:** `console.log('Socket.IO bağlantısı kuruldu')`.
- **Default `onError`:** `console.error('Socket.IO bağlantı hatası:', error)`.
- **State mutation:** Dashboard tarafında, hook ne `setIslemler`'a ne de
  `loadStats`'a referans alıyor; sadece handler'ları çağırıyor.

## 5. Socket event isimleri aynı mı?

Evet. Hook içinden gönderilen string'ler:
- `'connect'`
- `'connect_error'`
- `'disconnect'`
- `'yeni-islem'`
- `'islem-guncellendi'`
- `'islem-silindi'`
- `'islem-durum-degisti'`

Backend tarafında değişiklik yok.

## 6. Cache davranışları değişti mi?

Hayır. `useReferenceData` cache key/TTL (Phase 6) aynen duruyor. Yeni hook'lar
cache kullanmıyor (`useMahalleler` her mount/`ilceId` değişiminde fresh fetch
yapar — legacy `IslemDialog` davranışı ile aynı). `localStorage` token
davranışına dokunulmadı.

## 7. SnackbarContext stabilizasyonu

- `showSnackbar` artık **stable identity** (boş deps `useCallback`).
- Provider value `useMemo` ile sarıldı → consumer'lar sadece `showSnackbar`
  referansı değişirse (ki değişmiyor) re-render olur.
- **`useAtolyeSocket` reconnect riski üzerindeki etki:** Phase 6 raporundaki
  "showSnackbar her render'da yeni identity → useAtolyeSocket deps churn →
  socket reconnect" senaryosu artık **gerçekleşmez**. Hook deps'inde
  `onError`/`onConnect` olarak verilen handler'lar caller'da `useCallback`
  ile sarıldığı sürece socket effect bir kez çalışır. (Caller wrapping zaten
  Phase 6'da yapılmıştı.)
- `useIslemSocket` zaten `handlersRef` pattern kullandığı için bu hook'ta
  reconnect riski yapısal olarak yoktu; SnackbarContext fix yine de
  `Snackbar` re-render gürültüsünü genel olarak azaltır.

## 8. Test sonuçları

- `npx tsc --noEmit` → temiz (0 hata).
- `npm run build` → başarılı (`✓ built in 34.39s`). Sadece Vite'ın bilinen
  500 kB chunk uyarısı (Phase 0'dan beri mevcut, bu phase ile ilgisi yok).
- Inline `api.{get,post,put,delete,patch}(` kullanımı componentlerde: **0**
  (Phase 5 invariant'ı korundu).
- `import { api }` componentlerde: **0**.
- Manuel runtime testi bu turda yapılmadı (refactor `npm run build` ile sınırlı).

## 9. Riskli alanlar

- **`useIslemSocket` `handlersRef` pattern:** Hook'un mount sırasında yakaladığı
  ref güncellenmeye devam ediyor. Eğer Dashboard caller'ı handler içinde
  `setState` yaparsa (yapıyor) ve yeni closure okumak istiyorsa otomatik
  çalışır. Ancak bu pattern legacy `eslint-disable react-hooks/exhaustive-deps`
  davranışını birebir kopyalar; React'in "stale closure" uyarısı yapısal olarak
  bypass edilir. Test ortamında 5+ dakika socket trafik denemesi önerilir.
- **`SnackbarContext` `useMemo` value:** Eğer ileride context'e başka mutable
  alan eklenirse `useMemo` deps array'i güncellenmeli — şu an tek alan
  (`showSnackbar`) için risk yok.
- **`useMahalleler` entegre değil:** `IslemDialog` halen kendi inline fetch'i
  kullanıyor; bu turda paralel kod var. Phase 9 (IslemDialog refactor) öncesi
  geçici durum.
- **`useDebouncedValue` entegre değil:** `IslemFilters` `lodash.debounce`
  kullanmaya devam. İki farklı debounce yaklaşımı kod tabanında bulunuyor;
  Phase 9'da uyumlaştırılmalı.

## 10. Sonraki önerilen phase

**Phase 9 — `IslemFilters` debounce uyumlulaştırma + `useMahalleler` entegrasyonu:**
1. `IslemFilters` içindeki `lodash.debounce` kullanımını `useDebouncedValue`'ya
   taşı (davranışsal denklik testi sonrası).
2. `IslemDialog` içinde `ilceId → mahalleler` fetch akışını `useMahalleler`'a
   bağla (en az risk gösterecek şekilde, sadece data fetch parçası).
3. Cache invariant'larını koru.

Alternatif: **Phase 9B — Backend Security Bootstrap** (Phase 6 raporundaki
§10A — helmet, rate-limit, CORS allowlist, JWT secret hardening). Frontend
risk artırmadan backend tarafına geçilebilir.

---

## 11. Final report (spec'teki 11 soru)

1. **Değişen dosyalar:** `SnackbarContext.tsx`, `Dashboard.tsx`,
   `hooks/README.md`, `docs/refactor/phase-7-8-report.md` (yeni),
   `hooks/useDebouncedValue.ts` (yeni), `hooks/useMahalleler.ts` (yeni),
   `hooks/useIslemSocket.ts` (yeni).
2. **Oluşturulan hooklar:** `useDebouncedValue`, `useMahalleler`, `useIslemSocket`.
3. **Dashboard socket hook'a alındı mı?** Evet, tüm 4 işlem eventi +
   connect/connect_error/disconnect hook üzerinden yönetiliyor.
4. **Event isimleri ve SOCKET_URL aynı mı?** Evet, hepsi birebir aynı
   (bkz. §5 ve §4).
5. **SnackbarContext stabil mi?** Evet, `useCallback` + `useMemo` uygulandı.
   `showSnackbar` identity artık render'lar arası sabit.
6. **`useDebouncedValue` kullanıldı/oluşturuldu mu?** Oluşturuldu, **entegre
   edilmedi** (lodash.debounce çakışma riski).
7. **`useMahalleler` entegre/hazır mı?** Hazır, **entegre edilmedi**
   (IslemDialog yüksek risk).
8. **Test sonuçları:** `tsc --noEmit` clean; `npm run build` başarılı; runtime
   manuel test yapılmadı.
9. **Inline `api.X` hâlâ 0 mı?** Evet (componentlerde 0 inline `api.*` +
   0 `import { api }`).
10. **Riskli alanlar:** §9'daki 4 madde.
11. **Önerilen commit mesajı:**
    `refactor(frontend): extract stability and dashboard socket hooks`
