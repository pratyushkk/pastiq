Add-Type -AssemblyName System.Drawing

$projectRoot = Resolve-Path "$PSScriptRoot/.."
$distDir = Join-Path $projectRoot "dist"
$storeAssetsDir = Join-Path $projectRoot "store-assets"
$releaseDir = Join-Path $projectRoot "release"

if (-not (Test-Path $storeAssetsDir)) { New-Item -ItemType Directory -Path $storeAssetsDir -Force | Out-Null }
if (-not (Test-Path $releaseDir)) { New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null }

Write-Host "Generating Microsoft Edge Store Assets..." -ForegroundColor Cyan

# Source Master Icon
$masterIconPath = Join-Path $projectRoot "icons/icon-master.png"
if (-not (Test-Path $masterIconPath)) {
    Write-Error "Master icon not found at $masterIconPath"
    exit 1
}
$srcBmp = [System.Drawing.Bitmap]::new($masterIconPath)

# 1. Edge Store Logo (300x300 PNG)
$logo300 = [System.Drawing.Bitmap]::new(300, 300, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g1 = [System.Drawing.Graphics]::FromImage($logo300)
$g1.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g1.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g1.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g1.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

$bgBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(17, 22, 28))
$g1.FillRectangle($bgBrush, 0, 0, 300, 300)
$g1.DrawImage($srcBmp, [System.Drawing.Rectangle]::new(20, 20, 260, 260), [System.Drawing.Rectangle]::new(80, 80, 864, 864), [System.Drawing.GraphicsUnit]::Pixel)
$g1.Dispose()
$logo300Path = Join-Path $storeAssetsDir "edge-store-logo-300x300.png"
$logo300.Save($logo300Path, [System.Drawing.Imaging.ImageFormat]::Png)
$logo300.Dispose()
Write-Host "  Generated: edge-store-logo-300x300.png" -ForegroundColor Green

# 2. Small Promotional Tile (440x280 PNG)
$tile440 = [System.Drawing.Bitmap]::new(440, 280, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g2 = [System.Drawing.Graphics]::FromImage($tile440)
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g2.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g2.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$g2.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

$tileBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.Point]::new(0, 0),
    [System.Drawing.Point]::new(440, 280),
    [System.Drawing.Color]::FromArgb(21, 27, 34),
    [System.Drawing.Color]::FromArgb(15, 20, 26)
)
$g2.FillRectangle($tileBrush, 0, 0, 440, 280)

# Ambient glow on the tile
$glowBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(35, 96, 165, 250))
$g2.FillEllipse($glowBrush, -40, -40, 220, 220)

# Draw Logo Icon on the left
$g2.DrawImage($srcBmp, [System.Drawing.Rectangle]::new(36, 68, 144, 144), [System.Drawing.Rectangle]::new(80, 80, 864, 864), [System.Drawing.GraphicsUnit]::Pixel)

# Typography
$fontTitle = [System.Drawing.Font]::new('Segoe UI', 26, [System.Drawing.FontStyle]::Bold)
$fontSub = [System.Drawing.Font]::new('Segoe UI', 11, [System.Drawing.FontStyle]::Regular)
$fontPill = [System.Drawing.Font]::new('Segoe UI', 8, [System.Drawing.FontStyle]::Bold)

$whiteBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(241, 245, 249))
$mutedBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(148, 163, 184))
$blueBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(96, 165, 250))

$g2.DrawString('Pastiq', $fontTitle, $whiteBrush, 198, 80)
$g2.DrawString('Clipboard and Command Center', $fontSub, $blueBrush, 200, 126)
$g2.DrawString('Local-first. Blazing fast.', $fontSub, $mutedBrush, 200, 150)

# Pill badge
$pillRect = [System.Drawing.Rectangle]::new(200, 182, 110, 22)
$pillBg = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(30, 40, 52))
$g2.FillRectangle($pillBg, $pillRect)
$pillPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(52, 64, 76), 1)
$g2.DrawRectangle($pillPen, $pillRect)
$g2.DrawString('MANIFEST V3', $fontPill, $whiteBrush, 216, 186)

$g2.Dispose()
$tile440Path = Join-Path $storeAssetsDir "edge-promo-tile-440x280.png"
$tile440.Save($tile440Path, [System.Drawing.Imaging.ImageFormat]::Png)
$tile440.Dispose()
Write-Host "  Generated: edge-promo-tile-440x280.png" -ForegroundColor Green

# 3. Large Promotional Tile (1400x560 PNG)
$tile1400 = [System.Drawing.Bitmap]::new(1400, 560, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g3 = [System.Drawing.Graphics]::FromImage($tile1400)
$g3.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g3.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g3.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g3.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$g3.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

$largeBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.Point]::new(0, 0),
    [System.Drawing.Point]::new(1400, 560),
    [System.Drawing.Color]::FromArgb(26, 33, 41),
    [System.Drawing.Color]::FromArgb(17, 22, 28)
)
$g3.FillRectangle($largeBrush, 0, 0, 1400, 560)

# Ambient glow
$glowBrush1 = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(40, 96, 165, 250))
$g3.FillEllipse($glowBrush1, 70, 40, 440, 440)

# Draw Logo Icon on the left
$g3.DrawImage($srcBmp, [System.Drawing.Rectangle]::new(120, 130, 300, 300), [System.Drawing.Rectangle]::new(80, 80, 864, 864), [System.Drawing.GraphicsUnit]::Pixel)

# Typography
$fontLgTitle = [System.Drawing.Font]::new('Segoe UI', 48, [System.Drawing.FontStyle]::Bold)
$fontLgSub = [System.Drawing.Font]::new('Segoe UI', 22, [System.Drawing.FontStyle]::Regular)
$fontLgCopy = [System.Drawing.Font]::new('Segoe UI', 15, [System.Drawing.FontStyle]::Regular)

$g3.DrawString('Pastiq', $fontLgTitle, $whiteBrush, 480, 140)
$g3.DrawString('Clipboard, Snippets and Command Center', $fontLgSub, $blueBrush, 482, 224)
$g3.DrawString('The ultimate local-first productivity companion for Microsoft Edge.', $fontLgCopy, $whiteBrush, 485, 276)
$g3.DrawString('COPY -> SAVE -> SEARCH -> PASTE -> ACT', $fontLgCopy, $mutedBrush, 485, 312)

$g3.Dispose()
$tile1400Path = Join-Path $storeAssetsDir "edge-promo-tile-1400x560.png"
$tile1400.Save($tile1400Path, [System.Drawing.Imaging.ImageFormat]::Png)
$tile1400.Dispose()
Write-Host "  Generated: edge-promo-tile-1400x560.png" -ForegroundColor Green

# 4. Store Screenshot 1 (1280x800 PNG) - Universal Search and Clipboard
$ss1 = [System.Drawing.Bitmap]::new(1280, 800, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gs1 = [System.Drawing.Graphics]::FromImage($ss1)
$gs1.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gs1.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gs1.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gs1.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$gs1.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

$ssBg = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(15, 20, 26))
$gs1.FillRectangle($ssBg, 0, 0, 1280, 800)

# Headline banner
$gs1.DrawString('Universal Ranked Search & Clipboard History', [System.Drawing.Font]::new('Segoe UI', 24, [System.Drawing.FontStyle]::Bold), $whiteBrush, 280, 45)
$gs1.DrawString('Search clips, snippets, and page actions simultaneously in one unified interface', [System.Drawing.Font]::new('Segoe UI', 13, [System.Drawing.FontStyle]::Regular), $mutedBrush, 320, 90)

# Window frame
$winRect = [System.Drawing.Rectangle]::new(260, 140, 760, 600)
$winBg = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(21, 27, 34))
$gs1.FillRectangle($winBg, $winRect)
$winBorder = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(52, 64, 76), 1)
$gs1.DrawRectangle($winBorder, $winRect)

# Window Header
$headerRect = [System.Drawing.Rectangle]::new(260, 140, 760, 48)
$headerBg = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(26, 33, 41))
$gs1.FillRectangle($headerBg, $headerRect)
$gs1.DrawRectangle($winBorder, $headerRect)
# Window dots
$gs1.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(239, 68, 68)), 280, 158, 12, 12)
$gs1.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(245, 158, 11)), 300, 158, 12, 12)
$gs1.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(16, 185, 129)), 320, 158, 12, 12)
$gs1.DrawString('Pastiq - Command Center', [System.Drawing.Font]::new('Segoe UI', 11, [System.Drawing.FontStyle]::Bold), $whiteBrush, 550, 154)

# Search Bar
$searchRect = [System.Drawing.Rectangle]::new(290, 210, 700, 46)
$gs1.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(17, 22, 28)), $searchRect)
$gs1.DrawRectangle([System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(96, 165, 250), 1), $searchRect)
$gs1.DrawString('Search:  github', [System.Drawing.Font]::new('Segoe UI', 13, [System.Drawing.FontStyle]::Regular), $whiteBrush, 310, 222)
$gs1.DrawString('Press Enter to execute or paste', [System.Drawing.Font]::new('Segoe UI', 10, [System.Drawing.FontStyle]::Italic), $mutedBrush, 750, 225)

# Item 1: Clipboard Clip
$row1 = [System.Drawing.Rectangle]::new(290, 275, 700, 60)
$gs1.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(26, 33, 41)), $row1)
$gs1.DrawRectangle($winBorder, $row1)
$gs1.DrawString('CLIP: https://github.com/pratyushkk/pastiq', [System.Drawing.Font]::new('Segoe UI', 12, [System.Drawing.FontStyle]::Bold), $whiteBrush, 310, 285)
$gs1.DrawString('Copied from browser | 2 minutes ago | Pinned', [System.Drawing.Font]::new('Segoe UI', 9, [System.Drawing.FontStyle]::Regular), $mutedBrush, 310, 310)
$gs1.DrawString('CLIP', [System.Drawing.Font]::new('Segoe UI', 9, [System.Drawing.FontStyle]::Bold), $blueBrush, 930, 295)

# Item 2: Snippet
$row2 = [System.Drawing.Rectangle]::new(290, 345, 700, 60)
$gs1.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(26, 33, 41)), $row2)
$gs1.DrawRectangle($winBorder, $row2)
$gs1.DrawString('SNIPPET: ;github -> https://github.com/pratyushkk', [System.Drawing.Font]::new('Segoe UI', 12, [System.Drawing.FontStyle]::Bold), $whiteBrush, 310, 355)
$gs1.DrawString('Quick snippet auto-expander | Safe in-page replacement', [System.Drawing.Font]::new('Segoe UI', 9, [System.Drawing.FontStyle]::Regular), $mutedBrush, 310, 380)
$gs1.DrawString('SNIPPET', [System.Drawing.Font]::new('Segoe UI', 9, [System.Drawing.FontStyle]::Bold), [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(167, 139, 250)), 905, 365)

# Item 3: Command
$row3 = [System.Drawing.Rectangle]::new(290, 415, 700, 60)
$gs1.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(34, 43, 53)), $row3)
$gs1.DrawRectangle([System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(96, 165, 250), 1), $row3)
$gs1.DrawString('ACTION: Open GitHub repository in new tab', [System.Drawing.Font]::new('Segoe UI', 12, [System.Drawing.FontStyle]::Bold), $blueBrush, 310, 425)
$gs1.DrawString('Browser Action | Instant navigation', [System.Drawing.Font]::new('Segoe UI', 9, [System.Drawing.FontStyle]::Regular), $mutedBrush, 310, 450)
$gs1.DrawString('COMMAND', [System.Drawing.Font]::new('Segoe UI', 9, [System.Drawing.FontStyle]::Bold), [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(52, 211, 153)), 890, 435)

# Item 4: Clean Page Text
$row4 = [System.Drawing.Rectangle]::new(290, 485, 700, 60)
$gs1.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(26, 33, 41)), $row4)
$gs1.DrawRectangle($winBorder, $row4)
$gs1.DrawString('PAGE: Clean Copy Page Text (Alt+Shift+C)', [System.Drawing.Font]::new('Segoe UI', 12, [System.Drawing.FontStyle]::Bold), $whiteBrush, 310, 495)
$gs1.DrawString('Strips ads, cookie banners, scripts, navigation clutter', [System.Drawing.Font]::new('Segoe UI', 9, [System.Drawing.FontStyle]::Regular), $mutedBrush, 310, 520)
$gs1.DrawString('PAGE ACTION', [System.Drawing.Font]::new('Segoe UI', 9, [System.Drawing.FontStyle]::Bold), $blueBrush, 870, 505)

# Footer shortcuts info
$gs1.DrawString('100% Local-First IndexedDB  |  Zero Telemetry  |  Privacy Protected', [System.Drawing.Font]::new('Segoe UI', 10, [System.Drawing.FontStyle]::Bold), $mutedBrush, 390, 580)
$gs1.DrawString('Shortcut: Ctrl + Shift + P to toggle anytime', [System.Drawing.Font]::new('Segoe UI', 10, [System.Drawing.FontStyle]::Regular), $blueBrush, 470, 610)

$gs1.Dispose()
$ss1Path = Join-Path $storeAssetsDir "edge-screenshot-1-overview-1280x800.png"
$ss1.Save($ss1Path, [System.Drawing.Imaging.ImageFormat]::Png)
$ss1.Dispose()
Write-Host "  Generated: edge-screenshot-1-overview-1280x800.png" -ForegroundColor Green

# 5. Store Screenshot 2 (1280x800 PNG) - In-Page Quick Palette and Privacy
$ss2 = [System.Drawing.Bitmap]::new(1280, 800, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gs2 = [System.Drawing.Graphics]::FromImage($ss2)
$gs2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gs2.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gs2.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gs2.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$gs2.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

$gs2.FillRectangle($ssBg, 0, 0, 1280, 800)

$gs2.DrawString('In-Page Quick Palette & Safe Text Snippets', [System.Drawing.Font]::new('Segoe UI', 24, [System.Drawing.FontStyle]::Bold), $whiteBrush, 330, 45)
$gs2.DrawString('Press Ctrl + Shift + Space anywhere to summon floating palette without leaving your webpage', [System.Drawing.Font]::new('Segoe UI', 13, [System.Drawing.FontStyle]::Regular), $mutedBrush, 280, 90)

# Simulated browser tab background
$mockPage = [System.Drawing.Rectangle]::new(180, 140, 920, 600)
$gs2.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(20, 24, 30)), $mockPage)
$gs2.DrawRectangle($winBorder, $mockPage)

# Floating Palette overlay
$palRect = [System.Drawing.Rectangle]::new(340, 210, 600, 380)
$gs2.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(17, 22, 28)), $palRect)
$gs2.DrawRectangle([System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(96, 165, 250), 2), $palRect)

# Palette Search
$palSearch = [System.Drawing.Rectangle]::new(360, 230, 560, 42)
$gs2.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(26, 33, 41)), $palSearch)
$gs2.DrawRectangle($winBorder, $palSearch)
$gs2.DrawString('Search: ;email', [System.Drawing.Font]::new('Segoe UI', 12, [System.Drawing.FontStyle]::Regular), $whiteBrush, 375, 240)
$gs2.DrawString('Esc to close', [System.Drawing.Font]::new('Segoe UI', 9, [System.Drawing.FontStyle]::Regular), $mutedBrush, 840, 243)

# Palette row 1
$pRow1 = [System.Drawing.Rectangle]::new(360, 288, 560, 52)
$gs2.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(34, 43, 53)), $pRow1)
$gs2.DrawString(';email -> hello@example.com', [System.Drawing.Font]::new('Segoe UI', 11, [System.Drawing.FontStyle]::Bold), $whiteBrush, 375, 298)
$gs2.DrawString('Auto-expands instantly in form fields | Enter to paste', [System.Drawing.Font]::new('Segoe UI', 9, [System.Drawing.FontStyle]::Regular), $blueBrush, 375, 318)

# Palette row 2
$pRow2 = [System.Drawing.Rectangle]::new(360, 350, 560, 52)
$gs2.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(21, 27, 34)), $pRow2)
$gs2.DrawString(';addr -> 123 Innovation Way, Suite 400', [System.Drawing.Font]::new('Segoe UI', 11, [System.Drawing.FontStyle]::Bold), $whiteBrush, 375, 360)
$gs2.DrawString('Snippets | Reusable template', [System.Drawing.Font]::new('Segoe UI', 9, [System.Drawing.FontStyle]::Regular), $mutedBrush, 375, 380)

# Palette row 3
$pRow3 = [System.Drawing.Rectangle]::new(360, 412, 560, 52)
$gs2.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(21, 27, 34)), $pRow3)
$gs2.DrawString('CLIP: Meeting agenda and discussion highlights', [System.Drawing.Font]::new('Segoe UI', 11, [System.Drawing.FontStyle]::Bold), $whiteBrush, 375, 422)
$gs2.DrawString('Recent clip from Google Meet | 15 minutes ago', [System.Drawing.Font]::new('Segoe UI', 9, [System.Drawing.FontStyle]::Regular), $mutedBrush, 375, 442)

# Privacy shield notice
$gs2.DrawString('Privacy Shield: Never monitors password, credit card, or sensitive fields', [System.Drawing.Font]::new('Segoe UI', 10, [System.Drawing.FontStyle]::Bold), [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(52, 211, 153)), 370, 500)
$gs2.DrawString('Use Up/Down arrow keys to select, Enter to paste immediately', [System.Drawing.Font]::new('Segoe UI', 9, [System.Drawing.FontStyle]::Regular), $mutedBrush, 430, 530)

$gs2.Dispose()
$ss2Path = Join-Path $storeAssetsDir "edge-screenshot-2-quick-palette-1280x800.png"
$ss2.Save($ss2Path, [System.Drawing.Imaging.ImageFormat]::Png)
$ss2.Dispose()
Write-Host "  Generated: edge-screenshot-2-quick-palette-1280x800.png" -ForegroundColor Green

# 6. Package Release ZIP for Microsoft Edge Add-ons
Write-Host "`nPackaging extension ZIP for Edge Add-ons Store..." -ForegroundColor Cyan
$zipPath = Join-Path $releaseDir "pastiq-v1.0.0-edge.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

# Compress items inside dist/ directly so manifest.json is at root of archive
Compress-Archive -Path "$distDir/*" -DestinationPath $zipPath -Force
Write-Host "  Packaged: $zipPath" -ForegroundColor Green

Write-Host "`nMicrosoft Edge Store Assets and Package Ready!" -ForegroundColor Cyan
