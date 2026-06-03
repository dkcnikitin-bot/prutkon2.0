$logPath = "$env:USERPROFILE\.gemini\antigravity\brain\2ee97f69-5947-463c-8436-366644de162c\.system_generated\logs\transcript.jsonl"
if (-not (Test-Path $logPath)) {
    Write-Output "Log file not found!"
    exit
}

$lines = Get-Content -Path $logPath -Encoding utf8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$results = @()
foreach ($line in $lines) {
    try {
        $d = ConvertFrom-Json $line
        $text = $d.content + " " + $d.thinking
        if ($text.Contains("УП-10775") -or $text.Contains("10,577") -or $text.Contains("10.577") -or $text.Contains("1 567 396")) {
            $results += "========================================="
            $results += "STEP $($d.step_index) | SOURCE: $($d.source) | TYPE: $($d.type)"
            $results += "========================================="
            $results += "THINKING:"
            $results += $d.thinking
            $results += "CONTENT:"
            $results += $d.content
            $results += "========================================="
            $results += ""
        }
    } catch {}
}

$results | Out-File -FilePath "scratch/invoice_info_full.txt" -Encoding utf8
Write-Output "Done! Written $($results.Count) lines to scratch/invoice_info_full.txt"
