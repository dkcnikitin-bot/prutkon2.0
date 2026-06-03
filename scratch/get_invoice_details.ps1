# Find invoice details in contents.txt safely
$contentPath = "scratch\contents.txt"
$lines = Get-Content $contentPath
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if ($line.Contains("STEP 633") -or $line.Contains("STEP 635") -or $line.Contains("STEP 637") -or $line.Contains("STEP 640") -or $line.Contains("STEP 650")) {
        Write-Output "--- FOUND AT LINE $i ---"
        $end = [Math]::Min($lines.Count - 1, $i + 60)
        for ($j = $i; $j -le $end; $j++) {
            $val = $lines[$j]
            Write-Output "LINE $j : $val"
        }
        Write-Output "----------------------------------"
        Write-Output ""
    }
}
