# Part 1 — Foundation Report

Branch: `refactor/phase-0-baseline`
Base tag: `checkpoint/pre-deep-refactor` (328d544)
Scope: Tooling, constants, type tightening, service-import topology.
Behavior: **Unchanged.** No SQL, no runtime logic touched.

## Commits

| Step  | Hash      | Title |
| ----- | --------- | ----- |
| P1.A1 | `3e14157` | chore(tooling): add eslint flat config, prettier, editorconfig |
| P1.A2 | `3f86277` | refactor(constants): introduce frontend constants modules |
| P1.A3 | `23b1517` | refactor(backend): socket event constants |
| P1.A4 | `be064ad` | refactor(types): tighten types and remove frontend as-any casts |
| P1.A5 | `a6e2657` | refactor(backend): typed Application.get('io') + remove (req as any) casts |
| P1.B1 | `31ee3d0` | refactor(services): reroute 9 components to per-service modules |
| P1.B2 | `6026812` | refactor(services): trim api.ts re-export shim to printerSettingsService only |

## Deliverables

### Tooling
- `eslint.config.mjs` (flat config) at repo root with 7 override blocks
  (root CJS, backend, backend bootstrap scripts, frontend, config files,
  prettier-LAST).
- `.prettierrc`, `.prettierignore`, `.editorconfig`.
- Lint baseline: **0 errors, 295 warnings** (started at 313 — `as any`
  removals reduced noise).

### Frontend constants (NEW)
- [frontend/src/constants/socketEvents.ts](frontend/src/constants/socketEvents.ts) — 7 keys
- [frontend/src/constants/storageKeys.ts](frontend/src/constants/storageKeys.ts) — 2 keys
- [frontend/src/constants/atolyeStatus.ts](frontend/src/constants/atolyeStatus.ts) — union, labels, colors, helpers
- [frontend/src/constants/islemDurum.ts](frontend/src/constants/islemDurum.ts) — union, helpers
- [frontend/src/constants/roles.ts](frontend/src/constants/roles.ts) — roles + guard
- [frontend/src/constants/index.ts](frontend/src/constants/index.ts) — barrel

### Backend constants (NEW)
- [backend/src/constants/socketEvents.ts](backend/src/constants/socketEvents.ts) — mirror of the frontend strings; all 7 `io.emit` callsites in `routes/islemler.ts` + `routes/atolye.ts` migrated.

### Type tightening
- `frontend/src/types/index.ts`
  - `IslemUpdateDto.yazdirildi?: boolean` added (matches column).
  - `SahaKayit.has_photos?`, `SahaKayit.foto_preview?` added (list-endpoint optimization fields).
- 7 unsafe `as any` casts removed in frontend (IslemTable 1, SahaPanel 2,
  SahaKayitlari 2, IslemDialog 3 inputProps → `React.InputHTMLAttributes<HTMLInputElement>`).
- Kept (jsPDF + frozen util gaps):
  - [frontend/src/utils/print.ts](frontend/src/utils/print.ts) (FROZEN)
  - [frontend/src/components/musteri/MusteriGecmisi.tsx](frontend/src/components/musteri/MusteriGecmisi.tsx) jsPDF casts
  - [frontend/src/components/saha/SahaKayitlari.tsx](frontend/src/components/saha/SahaKayitlari.tsx) `imageRendering: 'high-quality'` CSS cast.

### Backend typing
- [backend/src/types/express.d.ts](backend/src/types/express.d.ts) — activated `Application.get('io'): SocketIOServer` overload (was previously documented as deferred).
- 9 `(req as any)` casts removed across `routes/atolye.ts` (4) and `routes/saha.ts` (5).
- `req.user!` used in saha routes where `authenticateToken` guarantees presence.

### Service-import topology
- 14 component/hook/context consumers migrated from `services/api` barrel to per-service modules: Settings, AtolyeDialog, MusteriGecmisi, AdminPanel, SahaKayitDialog, Dashboard, SahaKayitlari, SahaPanel, IslemTable, IslemDialog, AtolyeTakip, AuthContext, useReferenceData, useMahalleler.
- [frontend/src/services/api.ts](frontend/src/services/api.ts) re-export shim trimmed from 14 lines → 1 line (`printerSettingsService` only — kept because [frontend/src/components/settings/PrintEditor.tsx](frontend/src/components/settings/PrintEditor.tsx) is FROZEN).

## Invariants kept
- ✅ `git diff checkpoint/pre-deep-refactor -- frontend/src/utils/print.ts frontend/src/utils/excel.ts frontend/src/components/settings/PrintEditor.tsx` → empty.
- ✅ No SQL files touched.
- ✅ No new dependencies pulled (eslint/prettier added as devDependencies in P1.A1 only).
- ✅ Backend `tsc --noEmit` clean.
- ✅ Frontend `tsc --noEmit` clean.
- ✅ Both `npm run build` succeed.

## Verification grep gate
- `(req as any)` in `backend/src/**/*.ts`: **0** (only comments remain in `karaliste.ts`, `express.d.ts`).
- Components importing `services/api` (excluding frozen PrintEditor): **0**.
- Socket event string literals outside `constants/`: **0**.
- Frozen-file diff vs checkpoint: **empty**.

## Rollback
```bash
git reset --hard checkpoint/pre-deep-refactor
```

## Manual smoke test checklist (recommended before Part 2)
- Login: user / bayi / admin / saha roles.
- Open IslemDialog (create + edit), submit → broadcast received.
- Atolye CRUD → AtolyeTakip socket update lands.
- Saha kayıt create + list (photo + non-photo).
- Print preview opens (PrintEditor untouched).

## What was NOT done (deferred to later parts)
- Component decomposition (IslemDialog 1.9k lines etc.) — Part 2.
- Hook extraction beyond socket hooks — Part 2.
- Backend service-layer separation — Part 3.
- API client class hierarchy — Part 3.
- PrintEditor unfreeze + final `api.ts` cleanup (remove the last re-export) — depends on PrintEditor migration in a later part.
