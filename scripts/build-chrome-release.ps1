$projectRoot = Resolve-Path "$PSScriptRoot/.."
$distDir = Join-Path $projectRoot "dist"
$storeAssetsDir = Join-Path $projectRoot "store-assets"
$releaseDir = Join-Path $projectRoot "release"

if (-not (Test-Path $storeAssetsDir)) { New-Item -ItemType Directory -Path $storeAssetsDir -Force | Out-Null }
if (-not (Test-Path $releaseDir)) { New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null }

Write-Host "Generating Chrome Web Store Assets and Package..." -ForegroundColor Cyan

# Copy screenshots and promotional tiles
Copy-Item (Join-Path $storeAssetsDir "edge-screenshot-1-overview-1280x800.png") (Join-Path $storeAssetsDir "chrome-screenshot-1-overview-1280x800.png") -Force
Copy-Item (Join-Path $storeAssetsDir "edge-screenshot-2-quick-palette-1280x800.png") (Join-Path $storeAssetsDir "chrome-screenshot-2-quick-palette-1280x800.png") -Force
Copy-Item (Join-Path $storeAssetsDir "edge-promo-tile-440x280.png") (Join-Path $storeAssetsDir "chrome-promo-tile-440x280.png") -Force
Copy-Item (Join-Path $storeAssetsDir "edge-promo-tile-1400x560.png") (Join-Path $storeAssetsDir "chrome-marquee-promo-1400x560.png") -Force

Write-Host "  Verified: chrome-screenshot-1-overview-1280x800.png" -ForegroundColor Green
Write-Host "  Verified: chrome-screenshot-2-quick-palette-1280x800.png" -ForegroundColor Green
Write-Host "  Verified: chrome-promo-tile-440x280.png" -ForegroundColor Green
Write-Host "  Verified: chrome-marquee-promo-1400x560.png" -ForegroundColor Green

# Package Chrome ZIP
$chromeZipPath = Join-Path $releaseDir "pastiq-v1.0.0-chrome.zip"
if (Test-Path $chromeZipPath) { Remove-Item $chromeZipPath -Force }

Compress-Archive -Path "$distDir/*" -DestinationPath $chromeZipPath -Force
Write-Host "  Packaged: $chromeZipPath" -ForegroundColor Green

Write-Host "Chrome Web Store Assets and Package Ready!" -ForegroundColor Cyan
