$filePath = "scratch/contents.txt"
if (-not (Test-Path $filePath)) {
    Write-Output "contents.txt not found!"
    exit
}

$lines = Get-Content -Path $filePath -Encoding utf8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if ($line -like "*10775*" -or $line -like "*1567*" -or $line -like "*1447*" -or $line -like "*10577*" -or $line -like "*10.577*" -or $line -like "*10,577*") {
        Write-Output "Match at line $i : $line"
        $start = [Math]::Max(0, $i - 10)
        $end = [Math]::Min($lines.Count - 1, $i + 15)
        for ($j = $start; $j -le $end; $j++) {
            $marker = if ($j -eq $i) { ">>> " } else { "    " }
            Write-Output "$marker$j: $($lines[$j])"
        }
        Write-Output "----------------------------------"
        Write-Output ""
    }
}
