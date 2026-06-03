$path = "core.js"
$lines = Get-Content $path -Encoding UTF8
$fixedLine = "window.catalogData = window.safeParse('prutkon_catalog_data', []);"
$result = $lines[0..729] + $fixedLine + $lines[757..($lines.Count-1)]
$result | Set-Content $path -Encoding UTF8
Write-Host "core.js fixed successfully."
