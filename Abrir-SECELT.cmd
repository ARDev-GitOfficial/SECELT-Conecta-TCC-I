@echo off
setlocal
cd /d "%~dp0"
if not exist "web\dist\index.html" (
  echo Gere a interface com npm ci --ignore-scripts e npm run build na pasta web antes de abrir o portal.
  pause
  exit /b 1
)
powershell -NoProfile -Command "$node = Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source; if (-not $node) { $runtime = Get-AppxPackage '*CodexPrimaryRuntime*' | Sort-Object Version -Descending | Select-Object -First 1; if ($runtime) { $node = Join-Path $runtime.InstallLocation 'dependencies\node\bin\node.exe' } }; if (-not $node -or -not (Test-Path -LiteralPath $node)) { Write-Host 'Instale o Node.js 24 ou superior para executar o portal.'; exit 1 }; & $node server.js --abrir; exit $LASTEXITCODE"
if errorlevel 1 pause
