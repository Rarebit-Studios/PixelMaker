@echo off
echo Building Pixel Maker for Windows...
echo.

:: Check if node_modules exists, if not run npm install
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

:: Build for Windows
echo Building Windows executable...
call npm run build -- --win
echo.

echo Build complete! Check the dist folder for the installer.
pause 