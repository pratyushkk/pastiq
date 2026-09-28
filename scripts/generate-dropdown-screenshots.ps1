Add-Type -AssemblyName System.Drawing

$projectRoot = Resolve-Path "$PSScriptRoot/.."
$storeAssetsDir = Join-Path $projectRoot "store-assets"
$masterIconPath = Join-Path $projectRoot "icons/icon-master.png"

if (-not (Test-Path $storeAssetsDir)) {
    New-Item -ItemType Directory -Path $storeAssetsDir -Force | Out-Null
}

$srcBmp = [System.Drawing.Bitmap]::new($masterIconPath)

function Get-HighQualityGraphics($bmp) {
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
    return $g
}

# Brushes and Fonts
$whiteBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(241, 245, 249))
$mutedBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(148, 163, 184))
$blueBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(96, 165, 250))
$greenBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(52, 211, 153))
$purpleBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(167, 139, 250))
$borderPen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(52, 64, 76), 1)
$bluePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(96, 165, 250), 1)

$fontH1 = [System.Drawing.Font]::new('Segoe UI', 24, [System.Drawing.FontStyle]::Bold)
$fontH2 = [System.Drawing.Font]::new('Segoe UI', 12, [System.Drawing.FontStyle]::Regular)
$fontBold = [System.Drawing.Font]::new('Segoe UI', 11, [System.Drawing.FontStyle]::Bold)
$fontRegular = [System.Drawing.Font]::new('Segoe UI', 10, [System.Drawing.FontStyle]::Regular)
$fontSmall = [System.Drawing.Font]::new('Segoe UI', 9, [System.Drawing.FontStyle]::Regular)
$fontBadge = [System.Drawing.Font]::new('Segoe UI', 8, [System.Drawing.FontStyle]::Bold)

# ==============================================================================
# SCREENSHOT 3: Browser Toolbar Extension Dropdown Menu (1280x800)
# ==============================================================================
$ss3 = [System.Drawing.Bitmap]::new(1280, 800, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g3 = Get-HighQualityGraphics $ss3
$g3.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(15, 20, 26)), 0, 0, 1280, 800)

# Titles
$g3.DrawString('Instant Toolbar Dropdown and Clipboard Menu', $fontH1, $whiteBrush, 310, 36)
$g3.DrawString('Click the Pastiq icon in your browser toolbar or press Ctrl+Shift+P for instant access', $fontH2, $mutedBrush, 310, 78)

# Browser Window Mockup
$bX = 140; $bY = 125; $bW = 1000; $bH = 635
$g3.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(26, 33, 41)), $bX, $bY, $bW, $bH)
$g3.DrawRectangle($borderPen, $bX, $bY, $bW, $bH)

# Browser Top Tab Bar
$g3.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(17, 22, 28)), $bX, $bY, $bW, 40)
$g3.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(239, 68, 68)), $bX + 16, $bY + 14, 12, 12)
$g3.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(245, 158, 11)), $bX + 36, $bY + 14, 12, 12)
$g3.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(16, 185, 129)), $bX + 56, $bY + 14, 12, 12)

# Active Browser Tab
$tabRect = [System.Drawing.Rectangle]::new($bX + 85, $bY + 6, 210, 34)
$g3.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(26, 33, 41)), $tabRect)
$g3.DrawRectangle($borderPen, $tabRect)
$g3.DrawString('GitHub - Pastiq Extension', $fontSmall, $whiteBrush, $bX + 98, $bY + 14)

# Browser Address Bar
$navY = $bY + 40
$g3.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(21, 27, 34)), $bX, $navY, $bW, 44)
$g3.DrawLine($borderPen, $bX, $navY + 44, $bX + $bW, $navY + 44)

# URL box
$urlRect = [System.Drawing.Rectangle]::new($bX + 70, $navY + 7, 720, 30)
$g3.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(17, 22, 28)), $urlRect)
$g3.DrawRectangle($borderPen, $urlRect)
$g3.DrawString('https://github.com/pratyushkk/pastiq', $fontSmall, $mutedBrush, $bX + 85, $navY + 13)

# Browser Extensions area on right
$extX = $bX + 860

# Active Pastiq Extension Button in Toolbar (Highlighted)
$btnRect = [System.Drawing.Rectangle]::new($extX, $navY + 4, 36, 36)
$g3.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(40, 52, 68)), $btnRect)
$g3.DrawRectangle($bluePen, $btnRect)
$g3.DrawImage($srcBmp, [System.Drawing.Rectangle]::new($extX + 6, $navY + 10, 24, 24), [System.Drawing.Rectangle]::new(80, 80, 864, 864), [System.Drawing.GraphicsUnit]::Pixel)

# Webpage body background
$g3.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(13, 17, 23)), $bX, $navY + 45, $bW, $bH - 85)
$g3.DrawString('Pastiq: Local-First Clipboard and Command Center', [System.Drawing.Font]::new('Segoe UI', 18, [System.Drawing.FontStyle]::Bold), [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(90, 105, 120)), $bX + 50, $navY + 80)
$g3.DrawString('Production Manifest V3 extension designed for privacy and speed...', $fontRegular, [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(70, 85, 100)), $bX + 50, $navY + 120)

# DROPDOWN POPUP MENU (hanging from the Pastiq toolbar button)
$popW = 440; $popH = 500
$popX = $extX - 370; $popY = $navY + 44
$popRect = [System.Drawing.Rectangle]::new($popX, $popY, $popW, $popH)
$g3.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(17, 22, 28)), $popRect)
$g3.DrawRectangle($bluePen, $popRect)

# Popup Header
$g3.DrawImage($srcBmp, [System.Drawing.Rectangle]::new($popX + 16, $popY + 16, 26, 26), [System.Drawing.Rectangle]::new(80, 80, 864, 864), [System.Drawing.GraphicsUnit]::Pixel)
$g3.DrawString('Pastiq', $fontBold, $whiteBrush, $popX + 50, $popY + 18)
$g3.DrawString('Ctrl+Shift+P', $fontBadge, $blueBrush, $popX + 355, $popY + 22)

# Popup Search Box
$pSearchRect = [System.Drawing.Rectangle]::new($popX + 16, $popY + 54, 408, 38)
$g3.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(26, 33, 41)), $pSearchRect)
$g3.DrawRectangle($borderPen, $pSearchRect)
$g3.DrawString('Search clips, snippets or commands...', $fontSmall, $mutedBrush, $popX + 30, $popY + 64)
$g3.DrawString('Ctrl K', $fontBadge, $mutedBrush, $popX + 375, $popY + 66)

# Filter Tabs & Dropdown Menu Bar
$tabY = $popY + 102
$g3.DrawString('Filter by:', $fontSmall, $mutedBrush, $popX + 16, $tabY + 4)

# Active Type Filter Button
$fBtnRect = [System.Drawing.Rectangle]::new($popX + 78, $tabY, 120, 26)
$g3.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(34, 43, 53)), $fBtnRect)
$g3.DrawRectangle($bluePen, $fBtnRect)
$g3.DrawString('All Clips [v]', $fontSmall, $blueBrush, $popX + 90, $tabY + 4)

$g3.DrawString('Pinned (3)', $fontSmall, $whiteBrush, $popX + 215, $tabY + 4)
$g3.DrawString('Snippets (8)', $fontSmall, $mutedBrush, $popX + 295, $tabY + 4)

# OPEN DROPDOWN FILTER MENU
$dropRect = [System.Drawing.Rectangle]::new($popX + 78, $tabY + 28, 160, 140)
$g3.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(26, 33, 41)), $dropRect)
$g3.DrawRectangle($bluePen, $dropRect)

# Dropdown Items
$g3.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(40, 52, 68)), $popX + 79, $tabY + 29, 158, 26)
$g3.DrawString('*  All Types (Default)', $fontSmall, $blueBrush, $popX + 90, $tabY + 33)
$g3.DrawString('   Links & URLs', $fontSmall, $whiteBrush, $popX + 90, $tabY + 60)
$g3.DrawString('   Code Snippets', $fontSmall, $whiteBrush, $popX + 90, $tabY + 87)
$g3.DrawString('   Plain Text Only', $fontSmall, $whiteBrush, $popX + 90, $tabY + 114)
$g3.DrawString('   Pinned Only', $fontSmall, $whiteBrush, $popX + 90, $tabY + 141)

# List of Clips below dropdown
$clip1Y = $tabY + 180
$cRect1 = [System.Drawing.Rectangle]::new($popX + 16, $clip1Y, 408, 64)
$g3.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(26, 33, 41)), $cRect1)
$g3.DrawRectangle($borderPen, $cRect1)
$g3.DrawString('LINK: https://github.com/pratyushkk/pastiq', $fontSmall, $whiteBrush, $popX + 28, $clip1Y + 12)
$g3.DrawString('github.com | 2 min ago | Pinned', $fontBadge, $mutedBrush, $popX + 28, $clip1Y + 36)
$g3.DrawString('PINNED', $fontBadge, $blueBrush, $popX + 355, $clip1Y + 12)

$clip2Y = $clip1Y + 72
$cRect2 = [System.Drawing.Rectangle]::new($popX + 16, $clip2Y, 408, 64)
$g3.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(26, 33, 41)), $cRect2)
$g3.DrawRectangle($borderPen, $cRect2)
$g3.DrawString('SNIPPET: ;email -> hello@example.com', $fontSmall, $whiteBrush, $popX + 28, $clip2Y + 12)
$g3.DrawString('Text Expander | Auto-replaces in form inputs', $fontBadge, $mutedBrush, $popX + 28, $clip2Y + 36)
$g3.DrawString('SNIPPET', $fontBadge, $purpleBrush, $popX + 345, $clip2Y + 12)

$g3.Dispose()
$ss3Path = Join-Path $storeAssetsDir "chrome-screenshot-3-dropdown-menu-1280x800.png"
$ss3.Save($ss3Path, [System.Drawing.Imaging.ImageFormat]::Png)
$ss3.Dispose()
Write-Host "Generated: chrome-screenshot-3-dropdown-menu-1280x800.png" -ForegroundColor Green

# ==============================================================================
# SCREENSHOT 4: Right-Click Context Menu Dropdown on Webpages (1280x800)
# ==============================================================================
$ss4 = [System.Drawing.Bitmap]::new(1280, 800, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g4 = Get-HighQualityGraphics $ss4
$g4.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(15, 20, 26)), 0, 0, 1280, 800)

# Titles
$g4.DrawString('Right-Click Context Menu & Instant Text Capture', $fontH1, $whiteBrush, 280, 36)
$g4.DrawString('Right-click any selected text or web element to save clips, clean text, or create snippets', $fontH2, $mutedBrush, 265, 78)

# Webpage Container
$wRect = [System.Drawing.Rectangle]::new(140, 125, 1000, 635)
$g4.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(21, 27, 34)), $wRect)
$g4.DrawRectangle($borderPen, $wRect)

# Article Simulation inside Webpage
$g4.DrawString('Engineering Blog', [System.Drawing.Font]::new('Segoe UI', 11, [System.Drawing.FontStyle]::Bold), $blueBrush, 200, 160)
$g4.DrawString('Building High-Performance Web Extensions in 2026', [System.Drawing.Font]::new('Segoe UI', 20, [System.Drawing.FontStyle]::Bold), $whiteBrush, 200, 185)
$g4.DrawString('Published by Pastiq Team | 4 min read | Updated today', $fontSmall, $mutedBrush, 200, 225)

# Text paragraph
$p1 = "When designing browser extensions for heavy daily use, event-driven architecture is critical.`nBy utilizing IndexedDB multi-store schemas and service-worker wakeups, extensions achieve 0% idle CPU."
$g4.DrawString($p1, $fontRegular, $whiteBrush, 200, 260)

# Selected Text Area (Simulating highlight)
$selRect = [System.Drawing.Rectangle]::new(200, 325, 760, 56)
$g4.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(50, 96, 165, 250)), $selRect)
$g4.DrawRectangle($bluePen, $selRect)
$g4.DrawString("const clipboardManager = new PastiqStorage({ mode: 'local-first', maxItems: 500 });`nawait clipboardManager.saveClip({ type: 'code', text: selectedCode, source: window.location.origin });", [System.Drawing.Font]::new('Consolas', 11, [System.Drawing.FontStyle]::Regular), [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 255)), 210, 332)

# RIGHT-CLICK CONTEXT MENU DROPDOWN
$cmX = 520; $cmY = 370; $cmW = 320; $cmH = 260
$cmRect = [System.Drawing.Rectangle]::new($cmX, $cmY, $cmW, $cmH)
$g4.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(26, 33, 41)), $cmRect)
$g4.DrawRectangle($bluePen, $cmRect)

# Menu Items
$g4.DrawString('Copy', $fontRegular, $mutedBrush, $cmX + 24, $cmY + 12)
$g4.DrawString('Search Google for selection', $fontRegular, $mutedBrush, $cmX + 24, $cmY + 38)
$g4.DrawLine($borderPen, $cmX + 12, $cmY + 64, $cmX + $cmW - 12, $cmY + 64)

# Pastiq Submenu Section (Highlighted)
$g4.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(34, 43, 53)), $cmX + 4, $cmY + 70, $cmW - 8, 32)
$g4.DrawString('[+] Pastiq: Save to Pastiq', $fontBold, $blueBrush, $cmX + 20, $cmY + 76)
$g4.DrawString('Alt+S', $fontBadge, $blueBrush, $cmX + 260, $cmY + 78)

$g4.DrawString('[*] Pastiq: Clean copy page text', $fontRegular, $whiteBrush, $cmX + 20, $cmY + 110)
$g4.DrawString('Alt+Shift+C', $fontBadge, $mutedBrush, $cmX + 230, $cmY + 112)

$g4.DrawString('[+] Pastiq: Create snippet from selection', $fontRegular, $whiteBrush, $cmX + 20, $cmY + 142)

$g4.DrawString('[^] Pastiq: Copy clean page URL', $fontRegular, $whiteBrush, $cmX + 20, $cmY + 174)

$g4.DrawString('[-] Pastiq: Copy page title', $fontRegular, $whiteBrush, $cmX + 20, $cmY + 206)

$g4.DrawLine($borderPen, $cmX + 12, $cmY + 232, $cmX + $cmW - 12, $cmY + 232)
$g4.DrawString('Inspect element', $fontRegular, $mutedBrush, $cmX + 24, $cmY + 238)

# Floating Success Toast on the top right
$tRect = [System.Drawing.Rectangle]::new(820, 150, 300, 48)
$g4.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(17, 22, 28)), $tRect)
$g4.DrawRectangle([System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(52, 211, 153), 1), $tRect)
$g4.DrawString('Saved to Pastiq: 142 characters', $fontSmall, $greenBrush, 840, 164)

$g4.Dispose()
$ss4Path = Join-Path $storeAssetsDir "chrome-screenshot-4-context-menu-1280x800.png"
$ss4.Save($ss4Path, [System.Drawing.Imaging.ImageFormat]::Png)
$ss4.Dispose()
Write-Host "Generated: chrome-screenshot-4-context-menu-1280x800.png" -ForegroundColor Green

# ==============================================================================
# SCREENSHOT 5: Command Center Dropdown & Action Filtering (1280x800)
# ==============================================================================
$ss5 = [System.Drawing.Bitmap]::new(1280, 800, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g5 = Get-HighQualityGraphics $ss5
$g5.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(15, 20, 26)), 0, 0, 1280, 800)

# Titles
$g5.DrawString('Command Center Dropdown and Power Actions', $fontH1, $whiteBrush, 320, 36)
$g5.DrawString('Type /page or /tab to reveal actionable browser controls and clean content extraction', $fontH2, $mutedBrush, 280, 78)

# Centered Command Window
$cwX = 260; $cwY = 135; $cwW = 760; $cwH = 610
$cwRect = [System.Drawing.Rectangle]::new($cwX, $cwY, $cwW, $cwH)
$g5.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(21, 27, 34)), $cwRect)
$g5.DrawRectangle($borderPen, $cwRect)

# Header
$g5.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(26, 33, 41)), $cwX, $cwY, $cwW, 48)
$g5.DrawRectangle($borderPen, $cwX, $cwY, $cwW, 48)
$g5.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(239, 68, 68)), $cwX + 20, $cwY + 18, 12, 12)
$g5.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(245, 158, 11)), $cwX + 40, $cwY + 18, 12, 12)
$g5.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(16, 185, 129)), $cwX + 60, $cwY + 18, 12, 12)
$g5.DrawString('Pastiq - Command Center', $fontBold, $whiteBrush, $cwX + 280, $cwY + 14)

# Active Command Search Bar with Dropdown Trigger
$cSearchRect = [System.Drawing.Rectangle]::new($cwX + 30, $cwY + 68, 700, 48)
$g5.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(17, 22, 28)), $cSearchRect)
$g5.DrawRectangle($bluePen, $cSearchRect)
$g5.DrawString('Search: /page', [System.Drawing.Font]::new('Segoe UI', 14, [System.Drawing.FontStyle]::Bold), $blueBrush, $cwX + 50, $cwY + 80)
$g5.DrawString('Filter: Page Actions Dropdown | Press Enter to execute', $fontSmall, $mutedBrush, $cwX + 370, $cwY + 84)

# Section Label
$g5.DrawString('AVAILABLE PAGE ACTIONS (DROPDOWN RESULTS)', $fontBadge, $mutedBrush, $cwX + 30, $cwY + 130)

# Action Item 1 (Highlighted)
$a1Rect = [System.Drawing.Rectangle]::new($cwX + 30, $cwY + 150, 700, 68)
$g5.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(34, 43, 53)), $a1Rect)
$g5.DrawRectangle($bluePen, $a1Rect)
$g5.DrawString('ACTION: Clean Copy Visible Page Text', $fontBold, $whiteBrush, $cwX + 50, $cwY + 162)
$g5.DrawString('Strips ads, cookie banners, navigation menus, and extracts clean markdown article text', $fontSmall, $mutedBrush, $cwX + 50, $cwY + 188)
$g5.DrawString('Alt+Shift+C', $fontBadge, $blueBrush, $cwX + 610, $cwY + 174)

# Action Item 2
$a2Rect = [System.Drawing.Rectangle]::new($cwX + 30, $cwY + 228, 700, 68)
$g5.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(26, 33, 41)), $a2Rect)
$g5.DrawRectangle($borderPen, $a2Rect)
$g5.DrawString('ACTION: Force Copy Selected Text', $fontBold, $whiteBrush, $cwX + 50, $cwY + 240)
$g5.DrawString('Bypasses difficult or disabled selection handlers to capture highlighted text', $fontSmall, $mutedBrush, $cwX + 50, $cwY + 266)
$g5.DrawString('Alt+Shift+X', $fontBadge, $mutedBrush, $cwX + 610, $cwY + 252)

# Action Item 3
$a3Rect = [System.Drawing.Rectangle]::new($cwX + 30, $cwY + 306, 700, 68)
$g5.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(26, 33, 41)), $a3Rect)
$g5.DrawRectangle($borderPen, $a3Rect)
$g5.DrawString('ACTION: Copy Clean Page URL', $fontBold, $whiteBrush, $cwX + 50, $cwY + 318)
$g5.DrawString('Extracts canonical URL stripped of tracking parameters (utm_source, etc.)', $fontSmall, $mutedBrush, $cwX + 50, $cwY + 344)
$g5.DrawString('Enter to Copy', $fontBadge, $greenBrush, $cwX + 600, $cwY + 330)

# Action Item 4
$a4Rect = [System.Drawing.Rectangle]::new($cwX + 30, $cwY + 384, 700, 68)
$g5.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(26, 33, 41)), $a4Rect)
$g5.DrawRectangle($borderPen, $a4Rect)
$g5.DrawString('ACTION: Copy Page Title and Bookmark Link', $fontBold, $whiteBrush, $cwX + 50, $cwY + 396)
$g5.DrawString('Saves formatted markdown title [Page Title](url) directly to clipboard history', $fontSmall, $mutedBrush, $cwX + 50, $cwY + 422)
$g5.DrawString('Enter to Copy', $fontBadge, $greenBrush, $cwX + 600, $cwY + 408)

# Action Item 5
$a5Rect = [System.Drawing.Rectangle]::new($cwX + 30, $cwY + 462, 700, 68)
$g5.FillRectangle([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(26, 33, 41)), $a5Rect)
$g5.DrawRectangle($borderPen, $a5Rect)
$g5.DrawString('ACTION: Save Page to Pastiq Clips', $fontBold, $whiteBrush, $cwX + 50, $cwY + 474)
$g5.DrawString('Persists current tab metadata and summary into permanent local history', $fontSmall, $mutedBrush, $cwX + 50, $cwY + 500)
$g5.DrawString('Enter to Save', $fontBadge, $purpleBrush, $cwX + 605, $cwY + 486)

# Footer info
$g5.DrawString('Pro tip: Type /tab for browser controls (Reload, Duplicate, Close Tab, History, Downloads)', $fontSmall, $mutedBrush, $cwX + 80, $cwY + 555)

$g5.Dispose()
$ss5Path = Join-Path $storeAssetsDir "chrome-screenshot-5-command-dropdown-1280x800.png"
$ss5.Save($ss5Path, [System.Drawing.Imaging.ImageFormat]::Png)
$ss5.Dispose()
Write-Host "Generated: chrome-screenshot-5-command-dropdown-1280x800.png" -ForegroundColor Green

$srcBmp.Dispose()
Write-Host "All dropdown screenshots generated successfully!" -ForegroundColor Cyan
