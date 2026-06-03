# Safely search contents.txt with proper UTF-8 decoding
$filePath = "scratch\contents.txt"
$outputPath = "scratch\invoice_search_results.txt"

if (-not (Test-Path $filePath)) {
    Write-Output "contents.txt not found!"
    exit
}

# Read all lines as UTF-8
$lines = [System.IO.File]::ReadAllLines($filePath, [System.Text.Encoding]::UTF8)
$results = @()

$keywords = @("10775", "1 567", "1567", "ОМЗ", "60С2ХА", "112", "120", "10,577", "10.577")

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $match = $false
    foreach ($kw in $keywords) {
        if ($line.ToLower().Contains($kw.ToLower())) {
            $match = $true
            break
        }
    }
    if ($match) {
        $results += "=== Line $i ==="
        $start = [Math]::Max(0, $i - 10)
        $end = [Math]::Min($lines.Count - 1, $i + 15)
        for ($j = $start; $j -le $end; $j++) {
            $prefix = if ($j -eq $i) { ">>> " } else { "    " }
            $results += "$prefix${j}: $($lines[$j])"
        }
        $results += "====================="
        $results += ""
    }
}

$results | Out-File -FilePath $outputPath -Encoding utf8
Write-Output "Search completed. Found $($results.Count) lines of context. Saved to $outputPath"
