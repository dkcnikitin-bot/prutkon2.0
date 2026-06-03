# Analyze script and style references in HTML files
$htmlFiles = Get-ChildItem -Filter *.html
$scripts = [System.Collections.Generic.HashSet[string]]::new()
$styles = [System.Collections.Generic.HashSet[string]]::new()
$images = [System.Collections.Generic.HashSet[string]]::new()

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Match script src
    $scriptMatches = [regex]::Matches($content, '<script[^>]+src=["'']([^"'']+)["'']')
    foreach ($m in $scriptMatches) {
        $scripts.Add($m.Groups[1].Value) | Out-Null
    }
    
    # Match link href for css
    $cssMatches = [regex]::Matches($content, '<link[^>]+href=["'']([^"'']+)["''][^>]*>')
    foreach ($m in $cssMatches) {
        $styles.Add($m.Groups[1].Value) | Out-Null
    }
    
    # Match img src or similar
    $imgMatches = [regex]::Matches($content, '<img[^>]+src=["'']([^"'']+)["'']')
    foreach ($m in $imgMatches) {
        $images.Add($m.Groups[1].Value) | Out-Null
    }
}

Write-Output "--- SCRIPTS REFERENCED ---"
foreach ($s in $scripts) { Write-Output $s }

Write-Output "`n--- STYLES REFERENCED ---"
foreach ($s in $styles) { Write-Output $s }

Write-Output "`n--- IMAGES REFERENCED ---"
foreach ($i in $images) { Write-Output $i }
