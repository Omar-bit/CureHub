@echo off
cd /d C:\Users\MSI\code\CureHub\server
echo Applying database migrations...
npx prisma migrate deploy
echo.
echo Migration complete!
pause
