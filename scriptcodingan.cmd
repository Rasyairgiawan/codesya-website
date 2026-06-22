@echo off
set OUTPUT=semua_kodingan_web.txt

if exist "%OUTPUT%" del "%OUTPUT%"

for /r %%i in (*.html *.css *.js) do (
    echo %%i | findstr /v "\.g\.php" >nul && (
        echo ============================== >> "%OUTPUT%"
        echo FILE: %%i >> "%OUTPUT%"
        echo ============================== >> "%OUTPUT%"
        type "%%i" >> "%OUTPUT%"
        echo. >> "%OUTPUT%"
        echo. >> "%OUTPUT%"
    )
)

type "%OUTPUT%" | clip
echo Selesai menggabungkan semua file ke clipboard. Semoga komputer kamu masih baik-baik saja.
pause
