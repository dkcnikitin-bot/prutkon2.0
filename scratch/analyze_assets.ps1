# Analyze asset references in CSS and JS files
$files = Get-ChildItem -Include *.css,*.js -Recurse
$imageRefs = [System.Collections.Generic.HashSet[string]]::new()

foreach ($file in $files) {
    if ($file.FullName -like "*\scratch\*") { continue }
    $content = Get-Content $file.FullName -Raw
    
    # Match any word characters ending with .png, .svg, .jpg, .jpeg
    $matches = [regex]::Matches($content, '[\w\-_\.\/]+\.(png|svg|jpg|jpeg|gif)', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
    foreach ($m in $matches) {
        $imageRefs.Add($m.Value) | Out-Null
    }
}

Write-Output "--- IMAGE REFS IN CSS/JS ---"
foreach ($r in $imageRefs) {
    Write-Output $r
}
