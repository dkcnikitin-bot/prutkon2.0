# Safely dump lines 350 to 550 of contents.txt
$contentPath = "scratch\contents.txt"
$lines = Get-Content $contentPath
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$start = 350
$end = 550
for ($j = $start; $j -le $end; $j++) {
    if ($j -lt $lines.Count) {
        $val = $lines[$j]
        Write-Output "LINE $j : $val"
    }
}
