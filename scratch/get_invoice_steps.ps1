# Find matches in contents.txt and display surrounding text
$contentPath = "scratch\contents.txt"
$lines = Get-Content $contentPath
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$keywords = @("1 567", "1567", "10,577", "10.577", "10775", "112 167", "112167")

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    $found = $false
    foreach ($kw in $keywords) {
        if ($line.Contains($kw)) {
            $found = $true
            break
        }
    }
    if ($found) {
        Write-Output "--- MATCH AT LINE $i ($line) ---"
        $start = [Math]::Max(0, $i - 15)
        $end = [Math]::Min($lines.Count - 1, $i + 15)
        for ($j = $start; $j -le $end; $j++) {
            $marker = if ($j -eq $i) { ">>> " } else { "    " }
            Write-Output "$marker$($j): $($lines[$j])"
        }
        Write-Output "----------------------------------"
        Write-Output ""
    }
}
