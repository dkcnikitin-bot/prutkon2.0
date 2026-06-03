$filePath = "scratch/contents.txt"
if (-not (Test-Path $filePath)) {
    Write-Output "contents.txt not found!"
    exit
}

$lines = Get-Content -Path $filePath -Encoding utf8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

foreach ($line in $lines) {
    if ($line.Contains("10,577") -or $line.Contains("10.577") -or $line.Contains("1 447 396") -or $line.Contains("1 567 396") -or $line.Contains("УП-10775")) {
        Write-Output $line
    }
}
