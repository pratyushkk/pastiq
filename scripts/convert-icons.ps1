Add-Type -AssemblyName System.Drawing

$srcPath = "C:/Users/PRATYUSH/.gemini/antigravity/brain/71acbee2-64b5-47ab-ba12-ee1864bbe6e2/.user_uploaded/media_1790598921241.jpg"
$destDir = "$PSScriptRoot/../icons"
$distDir = "$PSScriptRoot/../dist/icons"

if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
if (-not (Test-Path $distDir)) { New-Item -ItemType Directory -Path $distDir -Force | Out-Null }

$srcBmp = [System.Drawing.Bitmap]::new($srcPath)

# Copy the original as master icon
$masterPath = Join-Path $destDir "icon-master.png"
$srcBmp.Save($masterPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Detect squircle bounding box
$minX = 1024; $maxX = 0; $minY = 1024; $maxY = 0
for ($y = 0; $y -lt 1024; $y += 2) {
    for ($x = 0; $x -lt 1024; $x += 2) {
        $c = $srcBmp.GetPixel($x, $y)
        if ($c.R -gt 15 -or $c.G -gt 15 -or $c.B -gt 15) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Output "Detected squircle bounds: X: $minX to $maxX, Y: $minY to $maxY"

# Add slight padding (e.g. 10px) around squircle
$cropX = [Math]::Max(0, $minX - 10)
$cropY = [Math]::Max(0, $minY - 10)
$cropW = [Math]::Min(1024 - $cropX, ($maxX - $minX) + 20)
$cropH = [Math]::Min(1024 - $cropY, ($maxY - $minY) + 20)

# Square the crop area
$size = [Math]::Max($cropW, $cropH)
$centerX = $cropX + ($cropW / 2)
$centerY = $cropY + ($cropH / 2)
$finalCropX = [Math]::Max(0, [int]($centerX - ($size / 2)))
$finalCropY = [Math]::Max(0, [int]($centerY - ($size / 2)))
if ($finalCropX + $size -gt 1024) { $size = 1024 - $finalCropX }
if ($finalCropY + $size -gt 1024) { $size = 1024 - $finalCropY }

$cropRect = [System.Drawing.Rectangle]::new($finalCropX, $finalCropY, $size, $size)
$croppedBmp = $srcBmp.Clone($cropRect, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

# Sizes for extension: 16, 32, 48, 128
$sizes = @(16, 32, 48, 128)

foreach ($sz in $sizes) {
    $targetBmp = [System.Drawing.Bitmap]::new($sz, $sz, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($targetBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $destRect = [System.Drawing.Rectangle]::new(0, 0, $sz, $sz)
    $g.DrawImage($croppedBmp, $destRect, 0, 0, $croppedBmp.Width, $croppedBmp.Height, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $outIconsPath = Join-Path $destDir "icon$sz.png"
    $outDistPath = Join-Path $distDir "icon$sz.png"
    
    $targetBmp.Save($outIconsPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $targetBmp.Save($outDistPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $targetBmp.Dispose()
    Write-Output "Generated icon${sz}.png"
}

$croppedBmp.Dispose()
$srcBmp.Dispose()
Write-Output "All icons successfully created from official asset!"
