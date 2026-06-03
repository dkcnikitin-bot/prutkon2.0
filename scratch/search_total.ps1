$logPath = "$env:USERPROFILE\.gemini\antigravity\brain\2ee97f69-5947-463c-8436-366644de162c\.system_generated\logs\transcript.jsonl"
$lines = Get-Content -Path $logPath -Encoding utf8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
foreach ($line in $lines) {
    if ($line.Contains("1 447 396") -or $line.Contains("1447396") -or $line.Contains("1447 396") -or $line.Contains("1 567 396")) {
        try {
            $data = ConvertFrom-Json $line
            Write-Output "=== STEP $($data.step_index) ==="
            Write-Output $data.content
            Write-Output "=========================="
        } catch {}
    }
}
