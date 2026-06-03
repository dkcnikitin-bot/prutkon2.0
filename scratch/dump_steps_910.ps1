$logPath = "$env:USERPROFILE\.gemini\antigravity\brain\2ee97f69-5947-463c-8436-366644de162c\.system_generated\logs\transcript.jsonl"
$lines = Get-Content -Path $logPath -Encoding utf8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
foreach ($line in $lines) {
    try {
        $data = ConvertFrom-Json $line
        if ($data.step_index -ge 905 -and $data.step_index -le 912) {
            Write-Output "=== STEP $($data.step_index) ==="
            Write-Output "TYPE: $($data.type)"
            Write-Output "CONTENT: $($data.content)"
            Write-Output "=========================="
            Write-Output ""
        }
    } catch {}
}
