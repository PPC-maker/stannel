@echo off
echo Running Prisma migration on production database...
echo.
echo Make sure to set the DATABASE_URL before running this script:
echo   set DATABASE_URL=postgresql://user:password@host:5432/stannel
echo.
if "%DATABASE_URL%"=="" (
    echo ERROR: DATABASE_URL is not set!
    echo Please run: set DATABASE_URL=your_production_database_url
    exit /b 1
)
echo DATABASE_URL is set, running migration...
npx prisma db push
echo.
echo Done!
