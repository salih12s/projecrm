@echo off
REM ============================================================
REM  ProjeCRM - PRODUCTION (Railway) veritabanina gec
REM  backend/.env.production  ->  backend/.env
REM
REM  DIKKAT: Bu, LOKALDE calisan backend'i CANLI veritabanina baglar.
REM  server.ts her aciliste createTables / migration / initLocations
REM  adimlarini calistirir; bunlar canli semaya YAZAR.
REM  Sadece gercekten canli veriyle calismak zorundaysan kullan.
REM
REM  NOT: Railway'e DEPLOY ederken bu dosyalarin hicbir etkisi yoktur.
REM  Orada DATABASE_URL ortam degiskeni Railway panelinden gelir ve
REM  db.ts once ona bakar.
REM ============================================================

REM NOT: Asagidaki komut argumanlarinda ters bolu ZORUNLU.
REM cmd.exe egik cizgiyi switch oneki sayar; "C:/Users/salih/..." yolundaki
REM /U ve /s parcalari copy ve findstr tarafindan komut anahtari olarak
REM okunur ve komutlar kirilir. Bu yuzden yollar ters bolu, aciklama ve
REM ekran ciktilari duz bolu.

setlocal
set "ROOT=%~dp0"

echo.
echo   ############################################################
echo   #  DIKKAT: CANLI VERITABANINA BAGLANACAKSIN                #
echo   #  Yapacagin her degisiklik gercek musteri verisini etkiler#
echo   ############################################################
echo.
set /p CONFIRM="Devam etmek icin EVET yaz: "
if /I not "%CONFIRM%"=="EVET" (
    echo.
    echo [ProjeCRM] Iptal edildi. Ortam degistirilmedi.
    endlocal
    exit /b 1
)

echo.
echo [ProjeCRM] PRODUCTION ortam etkinlestiriliyor...
echo.

if exist "%ROOT%backend\.env.production" (
    copy /Y "%ROOT%backend\.env.production" "%ROOT%backend\.env" >nul
    echo   [OK] backend/.env.production  -^>  backend/.env
) else (
    echo   [HATA] backend/.env.production bulunamadi!
    echo          Railway bilgilerini bu dosyaya kaydetmelisin.
    endlocal
    exit /b 1
)

echo.
echo   Aktif veritabani:
findstr /B "DB_HOST= DB_NAME= NODE_ENV=" "%ROOT%backend\.env"
echo.
echo [ProjeCRM] PRODUCTION aktif. Backend'i yeniden baslat (npm run dev).
echo [ProjeCRM] Isin bitince set-local-env.bat ile geri don!
echo.
endlocal
