$filePath = "scratch/contents.txt"
if (Test-Path $filePath) {
    $lines = [System.IO.File]::ReadAllLines($filePath, [System.Text.Encoding]::UTF8)
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        if ($line.Contains("10775") -or $line.Contains("60С2ХА") -or $line.Contains("ОМЗ") -or $line.Contains("1567396") -or $line.Contains("10,577")) {
            Write-Output "--- Line $i ---"
            $start = [Math]::Max(0, $i - 10)
            $end = [Math]::Min($lines.Count - 1, $i + 25)
            for ($j = $start; $j -le $end; $j++) {
                $prefix = if ($j -eq $i) { ">>> " } else { "    " }
                Write-Output "$($prefix)$($j): $($lines[$j])"
            }
            Write-Output "-------------------`n"
        }
    }
} else {
    Write-Output "File not found!"
}
