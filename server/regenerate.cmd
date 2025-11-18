@echo off
cd /d C:\Users\MSI\code\CureHub\server
echo Regenerating Prisma Client...
npx prisma generate
echo.
echo Prisma Client regeneration complete!
pause
