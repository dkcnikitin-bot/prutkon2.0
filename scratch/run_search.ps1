$logPath = "$env:USERPROFILE\.gemini\antigravity\brain\2ee97f69-5947-463c-8436-366644de162c\.system_generated\logs\transcript.jsonl"
if (-not (Test-Path $logPath)) {
    Write-Output "Log file not found!"
    exit
}

$lines = Get-Content -Path $logPath -Encoding utf8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

foreach ($line in $lines) {
    try {
        $d = ConvertFrom-Json $line
        $idx = $d.step_index
        if ($idx -eq 552 -or $idx -eq 632 -or $idx -eq 870) {
            Write-Output "=== STEP $idx ==="
            Write-Output "Content: $($d.content)"
            if ($d.tool_calls) {
                Write-Output "Tool Calls:"
                foreach ($tc in $d.tool_calls) {
                    Write-Output "  $($tc.name): $($tc.args | ConvertTo-Json -Compress)"
                }
            }
            Write-Output "================="
            Write-Output ""
        }
    } catch {}
}
