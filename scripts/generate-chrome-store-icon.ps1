Add-Type -AssemblyName System.Drawing

$projectRoot = Resolve-Path "$PSScriptRoot/.."
$storeAssetsDir = Join-Path $projectRoot "store-assets"
$masterPath = Join-Path $projectRoot "icons/icon-master.png"

if (-not (Test-Path $storeAssetsDir)) {
    New-Item -ItemType Directory -Path $storeAssetsDir -Force | Out-Null
}

$srcBmp = [System.Drawing.Bitmap]::new($masterPath)

# Detect squircle bounding box
$minX = 1024; $maxX = 0; $minY = 1024; $maxY = 0
for ($y = 0; $y -lt 1024; $y += 4) {
    for ($x = 0; $x -lt 1024; $x += 4) {
        $c = $srcBmp.GetPixel($x, $y)
        if ($c.R -gt 15 -or $c.G -gt 15 -or $c.B -gt 15) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

# Crop squircle
$cropX = [Math]::Max(0, $minX - 8)
$cropY = [Math]::Max(0, $minY - 8)
$cropW = [Math]::Min(1024 - $cropX, ($maxX - $minX) + 16)
$cropH = [Math]::Min(1024 - $cropY, ($maxY - $minY) + 16)
$size = [Math]::Max($cropW, $cropH)

$cropRect = [System.Drawing.Rectangle]::new($cropX, $cropY, $size, $size)
$croppedBmp = $srcBmp.Clone($cropRect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Helper function
function Make-StoreIcon($graphicSize, $padding, $outputPath) {
    $bmp = [System.Drawing.Bitmap]::new(128, 128, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $destRect = [System.Drawing.Rectangle]::new($padding, $padding, $graphicSize, $graphicSize)
    $g.DrawImage($croppedBmp, $destRect, 0, 0, $croppedBmp.Width, $croppedBmp.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created: $outputPath (Graphic: ${graphicSize}x${graphicSize}, Padding: ${padding}px)" -ForegroundColor Green
}

# 1. Official Chrome Web Store Specification: 96x96 graphic with 16px transparent padding
$paddedPath = Join-Path $storeAssetsDir "chrome-store-icon-128x128-padded.png"
Make-StoreIcon 96 16 $paddedPath

# 2. Modern balanced option: 104x104 graphic with 12px transparent padding
$balancedPath = Join-Path $storeAssetsDir "chrome-store-icon-128x128-balanced.png"
Make-StoreIcon 104 12 $balancedPath

# 3. Full bleed: 128x128 graphic with 0px padding
$fullPath = Join-Path $storeAssetsDir "chrome-store-icon-128x128-full.png"
Make-StoreIcon 128 0 $fullPath

# Also copy the 16px padded one as the primary chrome-store-icon-128x128.png
$primaryPath = Join-Path $storeAssetsDir "chrome-store-icon-128x128.png"
Copy-Item $paddedPath $primaryPath -Force
Write-Host "Saved primary: $primaryPath" -ForegroundColor Cyan

$croppedBmp.Dispose()
$srcBmp.Dispose()
