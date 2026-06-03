# PowerShell Refactoring Script for Prutkon ERP
# This script organizes the repository structure by moving styles, scripts, assets, folders and updating HTML/JS files.

$ErrorActionPreference = "Stop"

# 1. Define folder paths
$dirs = @(
    "css",
    "assets",
    "scripts",
    "js/core",
    "js/layout",
    "js/handlers",
    "js/utils",
    "js/handlers/catalog_master",
    "js/handlers/engineering_steps"
)

Write-Host "Creating target directories..."
foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir | Out-Null
        Write-Host "  Created: $dir"
    } else {
        Write-Host "  Exists: $dir"
    }
}

# 2. Define exact file mappings (Source File in root -> Target Path)
$mappings = [ordered]@{
    # Styles
    "styles.css" = "css/styles.css"
    
    # Assets
    "logo.png" = "assets/logo.png"
    "logo.svg" = "assets/logo.svg"
    "industry_bg.png" = "assets/industry_bg.png"
    "chatgpt_image_10_noyab_2025_g_20_40_23_1_1x.png" = "assets/chatgpt_image_10_noyab_2025_g_20_40_23_1_1x.png"
    
    # Scripts (Automation / Dev)
    "build_db.ps1" = "scripts/build_db.ps1"
    "build_db_fast.ps1" = "scripts/build_db_fast.ps1"
    "check_syntax.js" = "scripts/check_syntax.js"
    "extract_excel_info.py" = "scripts/extract_excel_info.py"
    "test_photo_paths.js" = "scripts/test_photo_paths.js"
    
    # JS Core
    "core.js" = "js/core/core.js"
    "core_emergency.js" = "js/core/core_emergency.js"
    "firebase_config.js" = "js/core/firebase_config.js"
    "supabase_config.js" = "js/core/supabase_config.js"
    "i18n.js" = "js/core/i18n.js"
    "version_history.js" = "js/core/version_history.js"
    
    # JS Layout
    "header.js" = "js/layout/header.js"
    "menu.js" = "js/layout/menu.js"
    "footer.js" = "js/layout/footer.js"
    
    # JS Utils
    "bitrix.js" = "js/utils/bitrix.js"
    "excel_data.js" = "js/utils/excel_data.js"
    "printer.js" = "js/utils/printer.js"
    "prutkon_features.js" = "js/utils/prutkon_features.js"
    "tasks.js" = "js/utils/tasks.js"
    "script.js" = "js/utils/script.js"
    
    # JS Handlers
    "calculator.js" = "js/handlers/calculator.js"
    "catalog.js" = "js/handlers/catalog.js"
    "catalog_master.js" = "js/handlers/catalog_master.js"
    "directories.js" = "js/handlers/directories.js"
    "documents.js" = "js/handlers/documents.js"
    "orders.js" = "js/handlers/orders.js"
    "prices.js" = "js/handlers/prices.js"
    "prices_trans.js" = "js/handlers/prices_trans.js"
    "production.js" = "js/handlers/production.js"
    "rods_production.js" = "js/handlers/rods_production.js"
    "reports.js" = "js/handlers/reports.js"
    "salary.js" = "js/handlers/salary.js"
    "settings.js" = "js/handlers/settings.js"
    "settings_old.js" = "js/handlers/settings_old.js"
    "settings_ui.js" = "js/handlers/settings_ui.js"
    "settings_v19.js" = "js/handlers/settings_v19.js"
    "settings_v20.js" = "js/handlers/settings_v20.js"
    "warehouse.js" = "js/handlers/warehouse.js"
    "work_equipment.js" = "js/handlers/work_equipment.js"
}

# 3. Physically move the files
Write-Host "`nMoving files to their new home..."
foreach ($src in $mappings.Keys) {
    $dest = $mappings[$src]
    if (Test-Path $src) {
        Move-Item -Path $src -Destination $dest -Force
        Write-Host "  Moved: $src -> $dest"
    } else {
        if (Test-Path $dest) {
            Write-Host "  Already Moved: $dest exists"
        } else {
            Write-Warning "  File not found: $src (and not at destination)"
        }
    }
}

# 4. Move Subdirectories (catalog_master/ and engineering_steps/)
Write-Host "`nMoving subdirectories..."

# catalog_master folder
if (Test-Path "catalog_master") {
    Write-Host "  Moving catalog_master/ content to js/handlers/catalog_master/"
    Get-ChildItem -Path "catalog_master" | ForEach-Object {
        Move-Item -Path $_.FullName -Destination "js/handlers/catalog_master/" -Force
    }
    Remove-Item -Path "catalog_master" -Force -Recurse
    Write-Host "  Done moving catalog_master"
} else {
    Write-Host "  catalog_master folder already processed or not found."
}

# engineering_steps folder
if (Test-Path "engineering_steps") {
    Write-Host "  Moving engineering_steps/ content to js/handlers/engineering_steps/"
    Get-ChildItem -Path "engineering_steps" | ForEach-Object {
        Move-Item -Path $_.FullName -Destination "js/handlers/engineering_steps/" -Force
    }
    Remove-Item -Path "engineering_steps" -Force -Recurse
    Write-Host "  Done moving engineering_steps"
} else {
    Write-Host "  engineering_steps folder already processed or not found."
}

# 5. Update references in HTML files
Write-Host "`nUpdating HTML files..."
$htmlFiles = Get-ChildItem -Filter *.html
$q = "['`"]" # Matches single or double quote

foreach ($file in $htmlFiles) {
    Write-Host "  Processing: $($file.Name)"
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $modified = $false
    
    # Replace standard files
    foreach ($key in $mappings.Keys) {
        $val = $mappings[$key]
        
        # Regex lookbehind for href=" or src=" and lookahead for " or ' or ?
        $pattern = "(?<=src=$q|href=$q)" + [regex]::Escape($key) + "(?=\?|$q)"
        
        if ($content -match $pattern) {
            $content = $content -replace $pattern, $val
            $modified = $true
        }
    }
    
    # Replace catalog_master/ references in catalog.html
    if ($file.Name -eq "catalog.html") {
        $catPattern = "(?<=src=$q|href=$q)catalog_master/"
        if ($content -match $catPattern) {
            $content = $content -replace $catPattern, "js/handlers/catalog_master/"
            $modified = $true
            Write-Host "    Updated catalog_master/ references in catalog.html" -ForegroundColor Green
        }
    }
    
    # Fix the missing engineering steps loading bug in rods_production.html
    if ($file.Name -eq "rods_production.html") {
        $rodsScriptPattern = "(<script src=`"js/handlers/rods_production\.js(?:\?v=[^`"]+)?`"></script>)"
        if ($content -match $rodsScriptPattern) {
            $insertion = "`n    <script src=`"js/handlers/engineering_steps/step1_metal.js?v=19.0.0`"></script>" +
                         "`n    <script src=`"js/handlers/engineering_steps/step2_blank.js?v=19.0.0`"></script>" +
                         "`n    <script src=`"js/handlers/engineering_steps/step3_standard.js?v=19.0.0`"></script>" +
                         "`n    <script src=`"js/handlers/engineering_steps/step4_bent.js?v=19.0.0`"></script>" +
                         "`n    <script src=`"js/handlers/engineering_steps/step6_double.js?v=19.0.0`"></script>"
            
            # Check if steps scripts are already included to avoid duplicate insertions
            if ($content -notlike "*js/handlers/engineering_steps/step1_metal.js*") {
                $content = $content -replace $rodsScriptPattern, "`$1$insertion"
                $modified = $true
                Write-Host "    Fixed missing engineering steps scripts in rods_production.html!" -ForegroundColor Green
            }
        }
    }
    
    if ($modified) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "    Updated!" -ForegroundColor Green
    } else {
        Write-Host "    No changes." -ForegroundColor Gray
    }
}

# 6. Update references in JS files
Write-Host "`nUpdating JS files..."

# Update catalog_master.js (now located at js/handlers/catalog_master.js)
$masterJs = "js/handlers/catalog_master.js"
if (Test-Path $masterJs) {
    Write-Host "  Processing: $masterJs"
    $masterContent = Get-Content $masterJs -Raw -Encoding UTF8
    $masterPattern = "${q}catalog_master/"
    if ($masterContent -match $masterPattern) {
        $masterContent = $masterContent -replace $masterPattern, "'js/handlers/catalog_master/"
        [System.IO.File]::WriteAllText($masterJs, $masterContent, [System.Text.Encoding]::UTF8)
        Write-Host "    Updated catalog_master/ references in catalog_master.js" -ForegroundColor Green
    }
}

# 7. Update CSS file references
# Because styles.css is now in /css, any relative reference to assets (e.g. logo.png) should be prefixed with ../assets/
$cssFile = "css/styles.css"
if (Test-Path $cssFile) {
    Write-Host "`nProcessing CSS: $cssFile"
    $cssContent = Get-Content $cssFile -Raw -Encoding UTF8
    $cssModified = $false
    
    # List of assets that might be referenced in CSS
    $assets = @(
        "logo.png",
        "logo.svg",
        "industry_bg.png",
        "chatgpt_image_10_noyab_2025_g_20_40_23_1_1x.png"
    )
    
    foreach ($asset in $assets) {
        # Check if asset is referenced in CSS and does NOT already start with ../assets/ or assets/
        $pattern = "(?<=url\($q?)" + [regex]::Escape($asset) + "(?=$q?\))"
        if ($cssContent -match $pattern) {
            $cssContent = $cssContent -replace $pattern, "../assets/$asset"
            $cssModified = $true
            Write-Host "    Updated reference to $asset in CSS" -ForegroundColor Green
        }
    }
    
    if ($cssModified) {
        [System.IO.File]::WriteAllText($cssFile, $cssContent, [System.Text.Encoding]::UTF8)
        Write-Host "  CSS updated successfully!" -ForegroundColor Green
    } else {
        Write-Host "  No asset references found in CSS." -ForegroundColor Gray
    }
}

Write-Host "`nRefactoring process completed successfully!" -ForegroundColor Green
