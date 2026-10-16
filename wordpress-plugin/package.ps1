# Package KD Events WordPress Plugin
$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$pluginSourceDir = Join-Path $PSScriptRoot "kd-events"
$zipTarget1 = Join-Path $PSScriptRoot "kd-events.zip"
$zipTarget2 = Join-Path $workspaceRoot "public\kd-events.zip"
$versionFile = Join-Path $PSScriptRoot "version.json"
$publicVersionFile = Join-Path $workspaceRoot "public\version.json"

Write-Host ">>> Packaging KD Events plugin..." -ForegroundColor Cyan

# 1. Sync version.json to public/version.json
if (Test-Path $versionFile) {
    Copy-Item -Path $versionFile -Destination $publicVersionFile -Force
    Write-Host "  Synchronized $publicVersionFile" -ForegroundColor Green
}

# 2. Remove old zip files if present
if (Test-Path $zipTarget1) { Remove-Item $zipTarget1 -Force }
if (Test-Path $zipTarget2) { Remove-Item $zipTarget2 -Force }

# 3. Create fresh zip with root folder 'kd-events'
$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("kd_pkg_" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Path (Join-Path $tempDir "kd-events") -Force | Out-Null

Copy-Item -Path "$pluginSourceDir\*" -Destination (Join-Path $tempDir "kd-events") -Recurse -Force

Compress-Archive -Path (Join-Path $tempDir "kd-events") -DestinationPath $zipTarget1 -Force
Copy-Item -Path $zipTarget1 -Destination $zipTarget2 -Force

Remove-Item -Path $tempDir -Recurse -Force

$size1 = (Get-Item $zipTarget1).Length
$size2 = (Get-Item $zipTarget2).Length
Write-Host ">>> Plugin zip packaged successfully!" -ForegroundColor Green
Write-Host "  Target 1: $zipTarget1 ($size1 bytes)" -ForegroundColor Green
Write-Host "  Target 2: $zipTarget2 ($size2 bytes)" -ForegroundColor Green
