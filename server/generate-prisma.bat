@echo off
REM Prisma Generate Script

cd /d C:\Users\MSI\code\CureHub\server

echo Generating Prisma Client...
call npx prisma generate

echo.
echo Regeneration complete!
echo.
echo Next step: npm run start

pause
