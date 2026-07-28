@echo off
REM ============================================================
REM  ProjeCRM - LOCAL ortama gec
REM  backend/.env.development  ->  backend/.env
REM
REM  Backend duz dotenv kullanir ve YALNIZCA backend/.env dosyasini
REM  okur (bkz. backend/src/db.ts). Bu yuzden profil dosyasini uzerine
REM  kopyalamak gerekir.
REM
REM  Frontend icin bir sey yapmaya gerek yok: dev'de vite.config.ts
REM  icindeki proxy /api isteklerini localhost:5000'e yonlendirir.
REM ============================================================

REM NOT: Asagidaki komut argumanlarinda ters bolu ZORUNLU.
REM cmd.exe egik cizgiyi switch oneki sayar; "C:/Users/salih/..." yolundaki
REM /U ve /s parcalari copy ve findstr tarafindan komut anahtari olarak
REM okunur ve komutlar kirilir. (Test edildi: "FINDSTR: Cannot open C:.env")
REM Bu yuzden yollar ters bolu, aciklama ve ekran ciktilari duz bolu.

setlocal
set "ROOT=%~dp0"

echo.
echo [ProjeCRM] LOCAL ortam etkinlestiriliyor...
echo.

if exist "%ROOT%backend\.env.development" (
    copy /Y "%ROOT%backend\.env.development" "%ROOT%backend\.env" >nul
    echo   [OK] backend/.env.development  -^>  backend/.env
) else (
    echo   [HATA] backend/.env.development bulunamadi!
    echo          Local ayarlarini bu dosyaya kaydetmelisin.
    endlocal
    exit /b 1
)

echo.
echo   Aktif veritabani:
findstr /B "DB_HOST= DB_NAME= NODE_ENV=" "%ROOT%backend\.env"
echo.
echo [ProjeCRM] LOCAL ortam aktif. Backend'i yeniden baslat (npm run dev).
echo.
endlocal
